"""
Hotel Booking Cancellation Risk Prediction System - FastAPI Backend Service
Stage 9: Operational Backend Architecture

Endpoints:
- GET  /         : Service status and system information
- GET  /health   : Health check, model status, and champion algorithm info
- GET  /metadata : Allowed categories, dropdown options, and default values for UI
- POST /predict  : Single booking risk assessment with probability, risk band, and advice
- POST /predict/batch : Upload CSV of bookings to receive batch risk scores and aggregated statistics
"""

import io
import os
import time
import pandas as pd
from typing import Dict, Any, List, Optional, Union, Literal
from fastapi import FastAPI, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import the inference pipeline and database functions
try:
    from backend.pipeline import CancellationPipeline
    from backend.database import (
        save_reservation_to_db, 
        get_all_reservations_from_db, 
        get_reservation_by_ref,
        create_user,
        get_user_by_identifier,
        authenticate_user,
        get_user_booking_history,
        cancel_reservation
    )
except ImportError:
    from pipeline import CancellationPipeline
    from database import (
        save_reservation_to_db, 
        get_all_reservations_from_db, 
        get_reservation_by_ref,
        create_user,
        get_user_by_identifier,
        authenticate_user,
        get_user_booking_history,
        cancel_reservation
    )

# ==============================================================================
# FastAPI App Initialization & CORS Configuration
# ==============================================================================

app = FastAPI(
    title="Hotel Cancellation Risk Prediction API",
    description=(
        "Production ML REST API for predicting hotel reservation cancellation probabilities, "
        "risk banding (Low, Medium, High), and prescribed revenue management interventions. "
        "Powered by an optimized predictive machine learning model."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React frontend (Vite default: http://localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pipeline once on server startup
pipeline = CancellationPipeline(
    model_path="models/xgboost_model.joblib",
    features_path="backend/feature_columns.json"
)


# ==============================================================================
# Pydantic Schemas for Validation and Documentation
# ==============================================================================

class BookingRequest(BaseModel):
    hotel: Literal["City Hotel", "Resort Hotel"] = Field(
        default="City Hotel", description="Property type"
    )
    lead_time: int = Field(
        default=30, ge=0, le=1000, description="Days elapsed between booking date and arrival date"
    )
    arrival_date_month: Literal[
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ] = Field(default="August", description="Month of arrival")
    arrival_date_week_number: int = Field(
        default=33, ge=1, le=53, description="Week number of arrival date"
    )
    stays_in_weekend_nights: int = Field(
        default=1, ge=0, le=30, description="Number of weekend nights (Saturday or Sunday)"
    )
    stays_in_week_nights: int = Field(
        default=2, ge=0, le=60, description="Number of weekday nights (Monday to Friday)"
    )
    adults: int = Field(
        default=2, ge=1, le=20, description="Number of adults"
    )
    children: int = Field(
        default=0, ge=0, le=10, description="Number of children"
    )
    babies: int = Field(
        default=0, ge=0, le=10, description="Number of babies"
    )
    meal: Literal["BB", "FB", "HB", "SC"] = Field(
        default="BB", description="Meal plan: BB (Bed & Breakfast), HB (Half Board), FB (Full Board), SC (Self Catering)"
    )
    country: str = Field(
        default="PRT", description="ISO 3-letter country code (e.g. PRT, GBR, FRA, ESP, DEU, USA, IRL)"
    )
    market_segment: Literal[
        "Online TA", "Offline TA/TO", "Direct", "Corporate", "Groups", "Complementary", "Aviation"
    ] = Field(default="Online TA", description="Booking distribution market segment")
    distribution_channel: Literal[
        "TA/TO", "Direct", "Corporate", "GDS"
    ] = Field(default="TA/TO", description="Booking distribution channel")
    is_repeated_guest: int = Field(
        default=0, ge=0, le=1, description="1 if the guest has booked previously, 0 otherwise"
    )
    previous_cancellations: int = Field(
        default=0, ge=0, le=50, description="Number of previous bookings cancelled by the customer"
    )
    previous_bookings_not_canceled: int = Field(
        default=0, ge=0, le=100, description="Number of previous bookings not cancelled"
    )
    reserved_room_type: Literal[
        "A", "B", "C", "D", "E", "F", "G", "H", "L"
    ] = Field(default="A", description="Code of room type reserved")
    deposit_type: Literal[
        "No Deposit", "Non Refund", "Refundable"
    ] = Field(default="No Deposit", description="Deposit guarantee policy applied to booking")
    agent: Optional[Union[float, int, str]] = Field(
        default=9.0, description="ID of travel agency that made booking, or 'Direct'"
    )
    company: Optional[Union[float, int, str]] = Field(
        default=None, description="ID of corporate entity that made booking, or None"
    )
    customer_type: Literal[
        "Transient", "Transient-Party", "Contract", "Group"
    ] = Field(default="Transient", description="Type of booking customer")
    adr: float = Field(
        default=105.0, ge=0.0, le=5000.0, description="Average Daily Rate in EUR"
    )
    required_car_parking_spaces: int = Field(
        default=0, ge=0, le=10, description="Number of car parking spaces requested"
    )
    total_of_special_requests: int = Field(
        default=0, ge=0, le=10, description="Number of special requests made by guest"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "hotel": "City Hotel",
                "lead_time": 45,
                "arrival_date_month": "August",
                "arrival_date_week_number": 33,
                "stays_in_weekend_nights": 1,
                "stays_in_week_nights": 3,
                "adults": 2,
                "children": 0,
                "babies": 0,
                "meal": "BB",
                "country": "PRT",
                "market_segment": "Online TA",
                "distribution_channel": "TA/TO",
                "is_repeated_guest": 0,
                "previous_cancellations": 0,
                "previous_bookings_not_canceled": 0,
                "reserved_room_type": "A",
                "deposit_type": "No Deposit",
                "agent": 9.0,
                "company": None,
                "customer_type": "Transient",
                "adr": 110.0,
                "required_car_parking_spaces": 0,
                "total_of_special_requests": 1
            }
        }
    }


class PredictionResponse(BaseModel):
    cancellation_probability: float = Field(..., description="Continuous probability of cancellation [0.0 - 1.0]")
    cancellation_probability_pct: float = Field(..., description="Cancellation risk percentage [0.0% - 100.0%]")
    risk_band: str = Field(..., description="Categorical risk tier: Low Risk, Medium Risk, High Risk")
    risk_level: str = Field(..., description="Risk slug for styling: low, medium, high")
    suggested_action: str = Field(..., description="Actionable intervention for hotel staff")
    key_risk_drivers: List[str] = Field(..., description="Primary factors contributing to the risk score")
    inputs_processed: Dict[str, Any] = Field(..., description="Summary of normalized core inputs")


class BatchPredictionResponse(BaseModel):
    total_bookings: int
    low_risk_count: int
    medium_risk_count: int
    high_risk_count: int
    average_cancellation_probability_pct: float
    predictions: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    champion_model: str
    roc_auc_test_score: float
    total_features_aligned: int
    uptime_seconds: float


START_TIME = time.time()


# ==============================================================================
# API Endpoints
# ==============================================================================

@app.get("/", tags=["General"])
def read_root():
    """
    Root endpoint returning service identity and documentation link.
    """
    return {
        "service": "Hotel Booking Cancellation Prediction API",
        "version": "1.0.0",
        "documentation": "/docs",
        "champion_algorithm": "Tuned Predictive Ensemble (Cost-Sensitive)",
        "status": "Operational"
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
def health_check():
    """
    Health check endpoint returning model readiness and performance statistics.
    """
    return {
        "status": "healthy",
        "champion_model": "Predictive Classifier",
        "roc_auc_test_score": 0.9426,
        "total_features_aligned": len(pipeline.feature_columns),
        "uptime_seconds": round(time.time() - START_TIME, 1)
    }


@app.get("/metadata", tags=["Metadata"])
def get_form_metadata():
    """
    Provides valid categorical choices and default parameters for dynamic frontend rendering.
    """
    return {
        "hotels": ["City Hotel", "Resort Hotel"],
        "months": [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],
        "meals": [
            {"code": "BB", "label": "Bed & Breakfast (BB)"},
            {"code": "HB", "label": "Half Board - Breakfast & Dinner (HB)"},
            {"code": "FB", "label": "Full Board - Breakfast, Lunch & Dinner (FB)"},
            {"code": "SC", "label": "Self Catering / Room Only (SC)"}
        ],
        "market_segments": [
            "Online TA", "Offline TA/TO", "Direct", "Corporate", "Groups", "Complementary", "Aviation"
        ],
        "distribution_channels": [
            "TA/TO", "Direct", "Corporate", "GDS"
        ],
        "deposit_types": [
            {"code": "No Deposit", "label": "No Deposit Required"},
            {"code": "Non Refund", "label": "Non-Refundable Deposit"},
            {"code": "Refundable", "label": "Refundable Deposit"}
        ],
        "customer_types": [
            {"code": "Transient", "label": "Transient (Independent Guest)"},
            {"code": "Transient-Party", "label": "Transient-Party (Associated with Group)"},
            {"code": "Contract", "label": "Contract / Corporate Agreement"},
            {"code": "Group", "label": "Group Booking"}
        ],
        "room_types": ["A", "B", "C", "D", "E", "F", "G", "H", "L"],
        "top_countries": [
            {"code": "PRT", "name": "Portugal (PRT)"},
            {"code": "GBR", "name": "United Kingdom (GBR)"},
            {"code": "FRA", "name": "France (FRA)"},
            {"code": "ESP", "name": "Spain (ESP)"},
            {"code": "DEU", "name": "Germany (DEU)"},
            {"code": "ITA", "name": "Italy (ITA)"},
            {"code": "IRL", "name": "Ireland (IRL)"},
            {"code": "BEL", "name": "Belgium (BEL)"},
            {"code": "BRA", "name": "Brazil (BRA)"},
            {"code": "USA", "name": "United States (USA)"},
            {"code": "NLD", "name": "Netherlands (NLD)"},
            {"code": "CHE", "name": "Switzerland (CHE)"},
            {"code": "CN", "name": "China (CN)"},
            {"code": "AUT", "name": "Austria (AUT)"},
            {"code": "SWE", "name": "Sweden (SWE)"},
            {"code": "Other", "name": "Other Country"}
        ],
        "risk_thresholds": {
            "low": "< 35%",
            "medium": "35% - 59%",
            "high": ">= 60%"
        }
    }


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_single_booking(request: BookingRequest):
    """
    Evaluates a single reservation and returns continuous probability,
    discrete risk tier, suggested staff action, and driving factors.
    """
    try:
        raw_dict = request.model_dump()
        result = pipeline.predict_booking(raw_dict)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error during prediction: {str(e)}"
        )


@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
async def predict_batch_bookings(file: UploadFile = File(...)):
    """
    Accepts a CSV file of bookings, applies feature engineering and XGBoost scoring
    to every row, and returns a consolidated risk assessment summary with individual predictions.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a valid CSV file (.csv)."
        )
        
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("utf-8", errors="replace")))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="The uploaded CSV file contains no data.")
            
        predictions = []
        low_count = 0
        med_count = 0
        high_count = 0
        prob_sum = 0.0
        
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            res = pipeline.predict_booking(row_dict)
            
            p_val = res["cancellation_probability_pct"]
            prob_sum += p_val
            
            level = res["risk_level"]
            if level == "low":
                low_count += 1
            elif level == "medium":
                med_count += 1
            else:
                high_count += 1
                
            predictions.append({
                "row_index": idx + 1,
                "hotel": row_dict.get("hotel", "City Hotel"),
                "lead_time": row_dict.get("lead_time", 0),
                "adr": row_dict.get("adr", 0),
                "cancellation_probability_pct": p_val,
                "risk_band": res["risk_band"],
                "risk_level": level,
                "suggested_action": res["suggested_action"],
                "key_risk_drivers": res["key_risk_drivers"]
            })
            
        total = len(predictions)
        avg_prob = round(prob_sum / total, 1) if total > 0 else 0.0
        
        return {
            "total_bookings": total,
            "low_risk_count": low_count,
            "medium_risk_count": med_count,
            "high_risk_count": high_count,
            "average_cancellation_probability_pct": avg_prob,
            "predictions": predictions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process CSV file: {str(e)}"
        )


# ==============================================================================
# User Authentication & RBAC Schemas & Endpoints
# ==============================================================================

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=4)
    name: str = "Guest"
    role: Literal["customer", "admin"] = "customer"


class UserLoginRequest(BaseModel):
    identifier: str  # username or email
    password: str


@app.post("/auth/register", tags=["Authentication"])
def register_user(payload: UserRegisterRequest):
    """
    Registers a new user (customer or admin).
    """
    clean_username = payload.username.strip().lower()
    clean_email = payload.email.strip().lower()
    
    if get_user_by_identifier(clean_username) or get_user_by_identifier(clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered."
        )
    user = create_user(payload.model_dump())
    return {"message": "User registered successfully", "user": user}


@app.post("/auth/login", tags=["Authentication"])
def login_user(payload: UserLoginRequest):
    """
    Authenticates user or admin with credentials.
    """
    user = authenticate_user(payload.identifier, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )
    return {"message": "Login successful", "user": user}


@app.get("/auth/history/{identifier}", tags=["Authentication"])
def user_history(identifier: str):
    """
    Retrieves previous booking count, visit count, and cancellation count from MongoDB
    for a given guest email or username.
    """
    history = get_user_booking_history(identifier, identifier)
    return history


# ==============================================================================
# Customer Reservations & MongoDB Persistence Endpoints
# ==============================================================================

class CustomerReservationInput(BaseModel):
    booking_ref: Optional[str] = None
    username: Optional[str] = None
    guest_name: str = Field(default="Guest", description="Name of the lead guest")
    guest_email: Optional[str] = Field(default=None, description="Guest contact email")
    email: Optional[str] = Field(default=None, description="Alias for guest_email")
    hotel: Literal["City Hotel", "Resort Hotel"] = "City Hotel"
    lead_time: int = Field(default=30, ge=0)
    arrival_date_month: str = "July"
    arrival_date_week_number: int = Field(default=28, ge=1, le=53)
    stays_in_weekend_nights: int = Field(default=1, ge=0)
    stays_in_week_nights: int = Field(default=2, ge=0)
    adults: int = Field(default=2, ge=1)
    children: int = Field(default=0, ge=0)
    babies: int = Field(default=0, ge=0)
    meal: str = "BB"
    country: str = "PRT"
    market_segment: str = "Direct"
    distribution_channel: str = "Direct"
    is_repeated_guest: int = 0
    previous_cancellations: int = 0
    previous_bookings_not_canceled: int = 0
    reserved_room_type: str = "A"
    deposit_type: str = "No Deposit"
    customer_type: str = "Transient"
    adr: float = Field(default=115.0, ge=0.0)
    required_car_parking_spaces: int = Field(default=0, ge=0)
    total_of_special_requests: int = Field(default=0, ge=0)
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    booking_channel_name: Optional[str] = "Hotel Direct Website"
    corporate_code: Optional[str] = None
    room_count: Optional[int] = 1
    company: Optional[Union[float, int, str]] = None
    agent: Optional[Union[float, int, str]] = None
    status: Optional[str] = "confirmed"
    created_at: Optional[str] = None


@app.post("/reservations", tags=["Reservations"])
def create_customer_reservation(payload: CustomerReservationInput):
    """
    Creates a new reservation from the Customer Portal.
    Automatically checks the guest's past booking history in MongoDB to determine
    if they have visited before or previously cancelled, automatically populating:
    - is_repeated_guest
    - previous_cancellations
    - previous_bookings_not_canceled
    Evaluates cancellation risk using the champion XGBoost model and persists into MongoDB.
    """
    try:
        data = payload.model_dump()
        
        # Ensure unique booking reference if not supplied
        if not data.get("booking_ref"):
            import random
            data["booking_ref"] = f"AUR-{random.randint(100000, 999999)}"
            
        # Check guest history in MongoDB by email or username
        guest_email = (data.get("guest_email") or data.get("email") or "").strip().lower()
        username = (data.get("username") or "").strip().lower()
        if not guest_email and not username:
            guest_email = "guest@example.com"
        data["guest_email"] = guest_email

        # Link or auto-register customer into MongoDB users collection
        user = get_user_by_identifier(username) if username else None
        if not user and guest_email:
            user = get_user_by_identifier(guest_email)
        if user:
            data["username"] = user.get("username")
            data["guest_name"] = data.get("guest_name") or user.get("name", "Guest")
        elif guest_email and guest_email != "guest@example.com":
            try:
                user = create_user({
                    "username": username or guest_email.split('@')[0],
                    "email": guest_email,
                    "name": data.get("guest_name", "Guest"),
                    "role": "customer"
                })
                data["username"] = user.get("username")
            except Exception:
                pass

        history = get_user_booking_history(guest_email, data.get("username"))
        
        # Auto-update ML history features from real MongoDB record
        if history["total_past_bookings"] > 0:
            data["is_repeated_guest"] = history["is_repeated_guest"]
            data["previous_cancellations"] = history["previous_cancellations"]
            data["previous_bookings_not_canceled"] = history["previous_bookings_not_canceled"]
        else:
            # If guest is not found in MongoDB yet, retain values if explicitly supplied (e.g. admin manual entry)
            data["is_repeated_guest"] = int(data.get("is_repeated_guest") or 0)
            data["previous_cancellations"] = int(data.get("previous_cancellations") or 0)
            data["previous_bookings_not_canceled"] = int(data.get("previous_bookings_not_canceled") or 0)
            
        # Ensure agent & company are properly aligned if omitted
        if not data.get("agent"):
            if data.get("distribution_channel") == "TA/TO":
                data["agent"] = 9.0
            else:
                data["agent"] = "Direct"
                
        if not data.get("company") and (data.get("market_segment") == "Corporate" or data.get("distribution_channel") == "Corporate"):
            data["company"] = data.get("corporate_code") or "CORP-01"

        # Run AI prediction on booking features
        ai_assessment = pipeline.predict_booking(data)
        data["prediction"] = ai_assessment
        data["guest_history"] = {
            "has_ever_visited": history["has_ever_visited"],
            "has_ever_cancelled": history["has_ever_cancelled"],
            "total_past_bookings": history["total_past_bookings"],
            "previous_cancellations": history["previous_cancellations"],
            "previous_bookings_not_canceled": history["previous_bookings_not_canceled"]
        }
        
        # Persist directly into MongoDB
        saved_doc = save_reservation_to_db(data)
        return saved_doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create reservation: {str(e)}"
        )


@app.get("/reservations", tags=["Reservations"])
def list_customer_reservations(
    limit: int = 200,
    market_segment: Optional[str] = None,
    arrival_date: Optional[str] = None,
    month: Optional[str] = None,
    risk_band: Optional[str] = None
):
    """
    Retrieves all customer reservations stored in MongoDB (ordered newest first)
    with optional filtering by market segment, arrival date, month, and risk band.
    """
    try:
        reservations = get_all_reservations_from_db(
            limit=limit,
            market_segment=market_segment,
            arrival_date=arrival_date,
            month=month,
            risk_band=risk_band
        )
        return {"total": len(reservations), "reservations": reservations}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reservations from database: {str(e)}"
        )


@app.get("/reservations/{booking_ref}", tags=["Reservations"])
def get_single_reservation(booking_ref: str):
    """
    Retrieves a single reservation by its unique booking reference code.
    """
    res = get_reservation_by_ref(booking_ref)
    if not res:
        raise HTTPException(status_code=404, detail=f"Reservation {booking_ref} not found")
    return res


@app.post("/reservations/{booking_ref}/cancel", tags=["Reservations"])
def cancel_guest_reservation(booking_ref: str):
    """
    Cancels an existing reservation in MongoDB.
    Future bookings by this user will now reflect a recorded previous cancellation!
    """
    updated = cancel_reservation(booking_ref)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Reservation {booking_ref} not found")
    return {"message": "Reservation cancelled successfully", "reservation": updated}

