"""
MongoDB Database Connection and Reservation Data Access Layer
Handles persistent storage of customer reservations and AI prediction scores.
"""

import os
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
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

_client: Optional[pymongo.MongoClient] = None
_db = None
_reservations_col: Optional[Collection] = None


def get_db():
    """
    Initializes and returns the MongoDB database instance (singleton connection).
    """
    global _client, _db, _reservations_col

    if _db is not None:
        return _db

    if not MONGO_URI:
        print("[WARNING] Mongo_URL not found in environment variables. Database operations will be mocked in-memory.")
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
        
        # Ensure index on booking_ref and created_at
        _reservations_col.create_index([("booking_ref", pymongo.ASCENDING)], unique=True, sparse=True)
        _reservations_col.create_index([("created_at", pymongo.DESCENDING)])
        
        print(f"[MongoDB] Successfully connected to Cluster: {DB_NAME}.{COLLECTION_NAME}")
        return _db
    except Exception as e:
        print(f"[MongoDB] Connection error: {e}. Falling back to memory storage.")
        _db = None
        return None


# In-memory fallback if database connection is temporarily interrupted
_in_memory_reservations: List[Dict[str, Any]] = []


def save_reservation_to_db(reservation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Inserts a new customer reservation with its AI cancellation assessment into MongoDB.
    """
    db = get_db()
    doc = dict(reservation_data)
    
    if "created_at" not in doc:
        doc["created_at"] = datetime.utcnow().isoformat()

    if db is not None:
        try:
            col = db[COLLECTION_NAME]
            # Avoid duplicate insertion if booking_ref already exists
            booking_ref = doc.get("booking_ref")
            if booking_ref:
                col.update_one({"booking_ref": booking_ref}, {"$set": doc}, upsert=True)
            else:
                col.insert_one(doc)
            
            # Remove ObjectId before returning to ensure clean JSON serialization
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
