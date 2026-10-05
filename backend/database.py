"""
MongoDB Database Connection, User Authentication & Reservation Data Access Layer
Handles persistent storage of users, customer reservations, and AI prediction scores.
Tracks user history to automatically determine if a guest has visited before or previously cancelled.
"""

import os
import time
import hashlib
import secrets
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv
import pymongo
from pymongo.collection import Collection

# Load .env from backend/.env or project root .env
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

MONGO_URI = (
    os.getenv("Mongo_URL") 
    or os.getenv("MONGO_URL") 
    or os.getenv("MONGODB_URI")
)

DB_NAME = "hotel_cancellation_system"
COLLECTION_NAME = "reservations"
USERS_COLLECTION = "users"

_client: Optional[pymongo.MongoClient] = None
_db = None
_reservations_col: Optional[Collection] = None
_users_col: Optional[Collection] = None

# In-memory fallbacks if database connection is temporarily interrupted
_in_memory_reservations: List[Dict[str, Any]] = []
_in_memory_users: List[Dict[str, Any]] = []


# ==============================================================================
# Password Cryptography Utilities
# ==============================================================================

def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hashes a password with a cryptographic salt using SHA-256."""
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode('utf-8')).hexdigest()
    return hashed, salt


def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verifies a plain password against a stored hash and salt."""
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest() == hashed


# ==============================================================================
# Database Connection & Initialization
# ==============================================================================

def get_db():
    """
    Initializes and returns the MongoDB database instance (singleton connection).
    """
    global _client, _db, _reservations_col, _users_col

    if _db is not None:
        return _db

    if not MONGO_URI:
        print("[WARNING] Mongo_URL not found in environment variables. Database operations will be mocked in-memory.")
        _seed_default_users()
        return None

    try:
        _client = pymongo.MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        # Test connection
        _client.admin.command('ping')
        _db = _client[DB_NAME]
        _reservations_col = _db[COLLECTION_NAME]
        _users_col = _db[USERS_COLLECTION]
        
        # Ensure indexes on reservations
        _reservations_col.create_index([("booking_ref", pymongo.ASCENDING)], unique=True, sparse=True)
        _reservations_col.create_index([("created_at", pymongo.DESCENDING)])
        _reservations_col.create_index([("guest_email", pymongo.ASCENDING)])
        
        # Ensure indexes on users
        _users_col.create_index([("email", pymongo.ASCENDING)], unique=True, sparse=True)
        _users_col.create_index([("username", pymongo.ASCENDING)], unique=True, sparse=True)
        
        print(f"[MongoDB] Successfully connected to Cluster: {DB_NAME}")
        _seed_default_users()
        return _db
    except Exception as e:
        print(f"[MongoDB] Connection error: {e}. Falling back to memory storage.")
        _db = None
        _seed_default_users()
        return None


def _seed_default_users():
    """Seeds default admin and customer accounts if not present."""
    # Seed default Admin: admin / admin123
    existing_admin = get_user_by_identifier("admin") or get_user_by_identifier("admin@aurastay.com")
    if not existing_admin:
        create_user({
            "username": "admin",
            "email": "admin@aurastay.com",
            "name": "Hotel System Administrator",
            "password": "admin123",
            "role": "admin"
        })
        print("[Auth] Default Admin seeded: username='admin', email='admin@aurastay.com'")

    # Seed default Customer: alexandra / guest123
    existing_guest = get_user_by_identifier("alexandra") or get_user_by_identifier("alexandra.miller@example.com")
    if not existing_guest:
        create_user({
            "username": "alexandra",
            "email": "alexandra.miller@example.com",
            "name": "Alexandra Miller",
            "password": "guest123",
            "role": "customer"
        })
        print("[Auth] Default Customer seeded: username='alexandra', email='alexandra.miller@example.com'")


# ==============================================================================
# User Management & RBAC Functions
# ==============================================================================

def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Registers a new user in MongoDB with hashed credentials.
    """
    db = get_db()
    plain_password = user_data.get("password", "guest123")
    hashed, salt = hash_password(plain_password)

    doc = {
        "username": user_data.get("username", "").strip().lower(),
        "email": user_data.get("email", "").strip().lower(),
        "name": user_data.get("name", "Guest"),
        "role": user_data.get("role", "customer"),
        "password_hash": hashed,
        "password_salt": salt,
        "created_at": datetime.utcnow().isoformat()
    }

    if db is not None:
        try:
            col = db[USERS_COLLECTION]
            col.update_one(
                {"$or": [{"email": doc["email"]}, {"username": doc["username"]}]},
                {"$set": doc},
                upsert=True
            )
            # Return sanitized record without password hash
            sanitized = dict(doc)
            sanitized.pop("password_hash", None)
            sanitized.pop("password_salt", None)
            return sanitized
        except Exception as e:
            print(f"[MongoDB Error] create_user: {e}")

    # In-memory fallback
    _in_memory_users.append(doc)
    sanitized = dict(doc)
    sanitized.pop("password_hash", None)
    sanitized.pop("password_salt", None)
    return sanitized


def get_user_by_identifier(identifier: str) -> Optional[Dict[str, Any]]:
    """
    Looks up a user by either username or email.
    """
    if not identifier:
        return None
    ident = identifier.strip().lower()
    db = get_db()

    if db is not None:
        try:
            col = db[USERS_COLLECTION]
            return col.find_one({"$or": [{"email": ident}, {"username": ident}]}, {"_id": 0})
        except Exception as e:
            print(f"[MongoDB Error] get_user_by_identifier: {e}")

    for u in _in_memory_users:
        if u.get("email") == ident or u.get("username") == ident:
            return u
    return None


def authenticate_user(identifier: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Validates user credentials against stored hash.
    Returns user dict without password if valid, None otherwise.
    """
    user = get_user_by_identifier(identifier)
    if not user:
        return None

    hashed = user.get("password_hash")
    salt = user.get("password_salt")
    if not hashed or not salt:
        return None

    if verify_password(password, hashed, salt):
        sanitized = dict(user)
        sanitized.pop("password_hash", None)
        sanitized.pop("password_salt", None)
        return sanitized
    return None


# ==============================================================================
# Guest Booking History & Cancellation Tracking
# ==============================================================================

def get_user_booking_history(email: str, username: Optional[str] = None) -> Dict[str, Any]:
    """
    Queries MongoDB for past reservations by this guest's email or username to calculate:
    - total_past_bookings: total bookings on record
    - previous_cancellations: how many reservations were cancelled
    - previous_bookings_not_canceled: how many bookings were kept / not cancelled
    - is_repeated_guest: 1 if user has visited/booked before, 0 otherwise
    - history: list of past reservations
    """
    records: List[Dict[str, Any]] = []
    db = get_db()

    clean_email = (email or "").strip().lower()
    clean_username = (username or "").strip().lower()

    if db is not None and clean_email:
        try:
            col = db[COLLECTION_NAME]
            or_filters = [{"guest_email": {"$regex": f"^{clean_email}$", "$options": "i"}}]
            if clean_username:
                or_filters.append({"username": clean_username})
            cursor = col.find({"$or": or_filters}, {"_id": 0}).sort("created_at", pymongo.DESCENDING)
            records = list(cursor)
        except Exception as e:
            print(f"[MongoDB Error] get_user_booking_history: {e}")
    else:
        for r in _in_memory_reservations:
            r_email = (r.get("guest_email") or "").strip().lower()
            r_uname = (r.get("username") or "").strip().lower()
            if r_email == clean_email or (clean_username and r_uname == clean_username):
                records.append(r)

    total_past = len(records)
    cancellations = sum(1 for r in records if r.get("status") == "cancelled" or r.get("deposit_type") == "Cancelled")
    not_canceled = total_past - cancellations
    is_repeated = 1 if total_past > 0 else 0

    return {
        "guest_email": clean_email,
        "total_past_bookings": total_past,
        "previous_cancellations": cancellations,
        "previous_bookings_not_canceled": not_canceled,
        "is_repeated_guest": is_repeated,
        "has_ever_visited": is_repeated == 1,
        "has_ever_cancelled": cancellations > 0,
        "history": records
    }


def cancel_reservation(booking_ref: str) -> Optional[Dict[str, Any]]:
    """
    Marks a reservation as 'cancelled' in MongoDB.
    This triggers history updates for future bookings by this user!
    """
    db = get_db()
    if db is not None:
        try:
            col = db[COLLECTION_NAME]
            res = col.find_one_and_update(
                {"booking_ref": booking_ref},
                {"$set": {"status": "cancelled", "cancelled_at": datetime.utcnow().isoformat()}},
                return_document=pymongo.ReturnDocument.AFTER,
                projection={"_id": 0}
            )
            return res
        except Exception as e:
            print(f"[MongoDB Error] cancel_reservation: {e}")

    for r in _in_memory_reservations:
        if r.get("booking_ref") == booking_ref:
            r["status"] = "cancelled"
            r["cancelled_at"] = datetime.utcnow().isoformat()
            return r
    return None


# ==============================================================================
# Reservations Storage & Retrieval
# ==============================================================================

def save_reservation_to_db(reservation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Inserts a new customer reservation with its AI cancellation assessment into MongoDB.
    """
    db = get_db()
    doc = dict(reservation_data)
    
    if "created_at" not in doc:
        doc["created_at"] = datetime.utcnow().isoformat()
    if "status" not in doc:
        doc["status"] = "confirmed"

    if db is not None:
        try:
            col = db[COLLECTION_NAME]
            booking_ref = doc.get("booking_ref")
            if booking_ref:
                col.update_one({"booking_ref": booking_ref}, {"$set": doc}, upsert=True)
            else:
                col.insert_one(doc)
            
            doc.pop("_id", None)
            return doc
        except Exception as e:
            print(f"[MongoDB Error] save_reservation failed: {e}")

    # Fallback to in-memory store
    doc.pop("_id", None)
    _in_memory_reservations.insert(0, doc)
    return doc


def get_all_reservations_from_db(
    limit: int = 200,
    market_segment: Optional[str] = None,
    arrival_date: Optional[str] = None,
    month: Optional[str] = None,
    risk_band: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieves reservations ordered by most recent first for the admin dashboard,
    with optional filtering by market segment, arrival date, month, and risk band.
    """
    query: Dict[str, Any] = {}
    if market_segment and market_segment != "all":
        query["market_segment"] = market_segment
    if arrival_date and arrival_date != "all":
        query["$or"] = [
            {"check_in_date": arrival_date},
            {"arrival_date_month": arrival_date}
        ]
    if month and month != "all":
        query["arrival_date_month"] = month
    if risk_band and risk_band != "all":
        query["prediction.risk_band"] = risk_band

    db = get_db()
    if db is not None:
        try:
            col = db[COLLECTION_NAME]
            cursor = col.find(query, {"_id": 0}).sort("created_at", pymongo.DESCENDING).limit(limit)
            return list(cursor)
        except Exception as e:
            print(f"[MongoDB Error] get_all_reservations failed: {e}")

    # Fallback in-memory filtering
    res = list(_in_memory_reservations)
    if market_segment and market_segment != "all":
        res = [r for r in res if r.get("market_segment") == market_segment]
    if arrival_date and arrival_date != "all":
        res = [r for r in res if r.get("check_in_date") == arrival_date or r.get("arrival_date_month") == arrival_date]
    if month and month != "all":
        res = [r for r in res if r.get("arrival_date_month") == month]
    if risk_band and risk_band != "all":
        res = [r for r in res if (r.get("prediction") or {}).get("risk_band") == risk_band]
    return res[:limit]


def get_reservation_by_ref(booking_ref: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single reservation by its unique reference code.
    """
    db = get_db()
    if db is not None:
        try:
            col = db[COLLECTION_NAME]
            return col.find_one({"booking_ref": booking_ref}, {"_id": 0})
        except Exception as e:
            print(f"[MongoDB Error] get_reservation_by_ref failed: {e}")

    for r in _in_memory_reservations:
        if r.get("booking_ref") == booking_ref:
            return r
    return None
