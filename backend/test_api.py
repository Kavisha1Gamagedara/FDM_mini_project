"""
Automated Test Suite for FastAPI Backend Service
Verifies all endpoints: Health, Metadata, Single Prediction, Validation Errors, and Batch CSV.
"""

import io
import sys
import time
from pathlib import Path

# Add project root directory to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
try:
    from backend.main import app
except ImportError:
    from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Hotel Booking Cancellation Prediction API" in data["service"]
    print("[PASS] GET /: PASSED")

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["champion_model"] == "XGBoost Classifier"
    assert data["total_features_aligned"] == 93
    print("[PASS] GET /health: PASSED")

def test_metadata_endpoint():
    response = client.get("/metadata")
    assert response.status_code == 200
    data = response.json()
    assert "City Hotel" in data["hotels"]
    assert "No Deposit" in [d["code"] for d in data["deposit_types"]]
    print("[PASS] GET /metadata: PASSED")

def test_predict_high_risk():
    high_risk_payload = {
        "hotel": "City Hotel",
        "lead_time": 280,
        "arrival_date_month": "September",
        "arrival_date_week_number": 37,
        "stays_in_weekend_nights": 0,
        "stays_in_week_nights": 3,
        "adults": 2,
        "children": 0,
        "babies": 0,
        "meal": "BB",
        "country": "PRT",
        "market_segment": "Online TA",
        "distribution_channel": "TA/TO",
        "is_repeated_guest": 0,
        "previous_cancellations": 1,
        "previous_bookings_not_canceled": 0,
        "reserved_room_type": "A",
        "deposit_type": "Non Refund",
        "customer_type": "Transient",
        "adr": 120.0,
        "required_car_parking_spaces": 0,
        "total_of_special_requests": 0
    }
    response = client.post("/predict", json=high_risk_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_band"] == "High Risk"
    assert data["risk_level"] == "high"
    assert data["cancellation_probability"] > 0.60
    assert len(data["key_risk_drivers"]) > 0
    print(f"[PASS] POST /predict (High Risk): PASSED -> {data['cancellation_probability_pct']}% ({data['risk_band']})")

def test_predict_low_risk():
    low_risk_payload = {
        "hotel": "Resort Hotel",
        "lead_time": 6,
        "arrival_date_month": "July",
        "arrival_date_week_number": 28,
        "stays_in_weekend_nights": 2,
        "stays_in_week_nights": 2,
        "adults": 2,
        "children": 1,
        "babies": 0,
        "meal": "HB",
        "country": "GBR",
        "market_segment": "Direct",
        "distribution_channel": "Direct",
        "is_repeated_guest": 1,
        "previous_cancellations": 0,
        "previous_bookings_not_canceled": 4,
        "reserved_room_type": "D",
        "deposit_type": "No Deposit",
        "customer_type": "Transient-Party",
        "adr": 140.0,
        "required_car_parking_spaces": 1,
        "total_of_special_requests": 2
    }
    response = client.post("/predict", json=low_risk_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_band"] == "Low Risk"
    assert data["risk_level"] == "low"
    assert data["cancellation_probability"] < 0.35
    print(f"[PASS] POST /predict (Low Risk): PASSED -> {data['cancellation_probability_pct']}% ({data['risk_band']})")

def test_predict_validation_error():
    # Negative lead time should trigger Pydantic validation error (422)
    invalid_payload = {
        "hotel": "City Hotel",
        "lead_time": -10,  # Invalid!
        "adults": 0        # Invalid!
    }
    response = client.post("/predict", json=invalid_payload)
    assert response.status_code == 422
    print("[PASS] POST /predict (Input Validation 422): PASSED")

def test_predict_batch_csv():
    csv_content = (
        "hotel,lead_time,arrival_date_month,arrival_date_week_number,stays_in_weekend_nights,stays_in_week_nights,adults,children,babies,meal,country,market_segment,distribution_channel,is_repeated_guest,previous_cancellations,previous_bookings_not_canceled,reserved_room_type,deposit_type,customer_type,adr,required_car_parking_spaces,total_of_special_requests\n"
        "City Hotel,250,August,33,1,2,2,0,0,BB,PRT,Online TA,TA/TO,0,1,0,A,Non Refund,Transient,130,0,0\n"
        "Resort Hotel,5,July,28,1,1,2,0,0,HB,GBR,Direct,Direct,1,0,3,D,No Deposit,Transient,95,1,2\n"
    )
    files = {"file": ("test_bookings.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/predict/batch", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["total_bookings"] == 2
    assert len(data["predictions"]) == 2
    print(f"[PASS] POST /predict/batch (CSV Upload): PASSED -> {data['total_bookings']} bookings processed successfully!")

def test_customer_reservations_mongo():
    # Test creating customer reservation and persisting to MongoDB
    booking_data = {
        "booking_ref": "AUR-TEST-AUTO99",
        "guest_name": "Jonathan Harker",
        "guest_email": "jonathan@example.com",
        "hotel": "City Hotel",
        "lead_time": 45,
        "arrival_date_month": "August",
        "arrival_date_week_number": 33,
        "stays_in_weekend_nights": 1,
        "stays_in_week_nights": 2,
        "adults": 2,
        "children": 0,
        "babies": 0,
        "meal": "BB",
        "country": "GBR",
        "deposit_type": "No Deposit",
        "adr": 135.0,
        "required_car_parking_spaces": 0,
        "total_of_special_requests": 1
    }
    create_res = client.post("/reservations", json=booking_data)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["booking_ref"] == "AUR-TEST-AUTO99"
    assert "prediction" in created
    assert "risk_band" in created["prediction"]
    
    # Test retrieving list from MongoDB
    list_res = client.get("/reservations")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    
    print(f"[PASS] POST /reservations & GET /reservations (MongoDB Storage): PASSED -> Ref {created['booking_ref']} saved with {created['prediction']['risk_band']}!")

def test_auth_and_cancellation_tracking():
    # 1. Admin login with pre-saved credentials (admin / admin123)
    admin_login_res = client.post("/auth/login", json={"identifier": "admin", "password": "admin123"})
    assert admin_login_res.status_code == 200
    admin_data = admin_login_res.json()["user"]
    assert admin_data["role"] == "admin"
    print(f"[PASS] Admin Pre-Saved Login: PASSED -> User '{admin_data['username']}' Role: {admin_data['role']}")

    # 2. Customer registration & login
    new_user = {
        "username": f"testguest_{int(time.time())}",
        "email": f"test_{int(time.time())}@example.com",
        "name": "Sarah Connor",
        "password": "mypassword123",
        "role": "customer"
    }
    reg_res = client.post("/auth/register", json=new_user)
    assert reg_res.status_code == 200
    cust_data = reg_res.json()["user"]
    assert cust_data["role"] == "customer"

    cust_login = client.post("/auth/login", json={"identifier": new_user["email"], "password": "mypassword123"})
    assert cust_login.status_code == 200
    print(f"[PASS] Customer Registration & Login: PASSED -> User '{cust_data['email']}'")

    # 3. Create a reservation for this customer
    ref_1 = f"AUR-TEST-HIST-{int(time.time()) % 10000}"
    res_payload_1 = {
        "booking_ref": ref_1,
        "guest_name": new_user["name"],
        "guest_email": new_user["email"],
        "username": new_user["username"],
        "hotel": "City Hotel",
        "lead_time": 20,
        "adr": 120.0
    }
    b1_res = client.post("/reservations", json=res_payload_1)
    assert b1_res.status_code == 200
    b1_data = b1_res.json()
    # First booking: not repeated guest yet
    assert b1_data["is_repeated_guest"] == 0

    # 4. Cancel the reservation
    cancel_res = client.post(f"/reservations/{ref_1}/cancel")
    assert cancel_res.status_code == 200
    print(f"[PASS] Reservation Cancellation: PASSED -> Ref {ref_1} marked as cancelled")

    # 5. Make a 2nd reservation for the same customer -> system should detect previous cancellation!
    ref_2 = f"AUR-TEST-HIST2-{int(time.time()) % 10000}"
    res_payload_2 = {
        "booking_ref": ref_2,
        "guest_name": new_user["name"],
        "guest_email": new_user["email"],
        "username": new_user["username"],
        "hotel": "City Hotel",
        "lead_time": 20,
        "adr": 120.0
    }
    b2_res = client.post("/reservations", json=res_payload_2)
    assert b2_res.status_code == 200
    b2_data = b2_res.json()
    # Now user has history: is_repeated_guest=1, previous_cancellations=1!
    assert b2_data["is_repeated_guest"] == 1
    assert b2_data["previous_cancellations"] >= 1
    print(f"[PASS] History Tracking (Repeated Guest & Previous Cancellation): PASSED -> is_repeated_guest={b2_data['is_repeated_guest']}, previous_cancellations={b2_data['previous_cancellations']} detected automatically!")

if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING BACKEND TEST SUITE (backend/test_api.py)")
    print("=" * 70)
    test_root_endpoint()
    test_health_endpoint()
    test_metadata_endpoint()
    test_predict_high_risk()
    test_predict_low_risk()
    test_predict_validation_error()
    test_predict_batch_csv()
    test_customer_reservations_mongo()
    test_auth_and_cancellation_tracking()
    print("=" * 70)
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY! (9/9)")
    print("=" * 70)
