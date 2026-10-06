import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def get_history(email):
    req = urllib.request.Request(f"{BASE_URL}/auth/history/{email}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def create_booking(email, guest_name="Test Customer"):
    payload = {
        "guest_name": guest_name,
        "guest_email": email,
        "hotel": "Resort Hotel",
        "lead_time": 15,
        "arrival_date_month": "October",
        "arrival_date_week_number": 43,
        "stays_in_weekend_nights": 1,
        "stays_in_week_nights": 2,
        "adults": 2,
        "children": 0,
        "babies": 0,
        "meal": "BB",
        "country": "PRT",
        "market_segment": "Direct",
        "distribution_channel": "Direct",
        "reserved_room_type": "A",
        "deposit_type": "No Deposit",
        "adr": 180.0,
        "required_car_parking_spaces": 0,
        "total_of_special_requests": 0
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(f"{BASE_URL}/reservations", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def cancel_booking(booking_ref):
    req = urllib.request.Request(f"{BASE_URL}/reservations/{booking_ref}/cancel", data=b"", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def run_test():
    test_email = "autocheck_guest_test@example.com"
    print("=== Step 1: Initial History Check for Brand New Guest ===")
    hist1 = get_history(test_email)
    print(f"Total past: {hist1['total_past_bookings']}, Cancellations: {hist1['previous_cancellations']}, Repeated: {hist1['is_repeated_guest']}")
    assert hist1['total_past_bookings'] == 0
    assert hist1['previous_cancellations'] == 0
    assert hist1['is_repeated_guest'] == 0

    print("\n=== Step 2: Customer Creates 1st Reservation (Without Manual History) ===")
    b1 = create_booking(test_email, "Alice FirstTimer")
    print(f"Booking Ref: {b1['booking_ref']}")
    print(f"Recorded is_repeated_guest: {b1.get('is_repeated_guest')}")
    print(f"Recorded previous_cancellations: {b1.get('previous_cancellations')}")
    print(f"AI Cancellation Risk: {b1['prediction']['cancellation_probability_pct']}% ({b1['prediction']['risk_band']})")

    print("\n=== Step 3: Customer Cancels 1st Reservation ===")
    cancel_res = cancel_booking(b1['booking_ref'])
    print(f"Cancellation confirmed: {cancel_res['reservation']['status']}")

    print("\n=== Step 4: System Automatically Detects Cancellation for This Guest ===")
    hist2 = get_history(test_email)
    print(f"Total past: {hist2['total_past_bookings']}, Cancellations: {hist2['previous_cancellations']}, Repeated: {hist2['is_repeated_guest']}")
    assert hist2['total_past_bookings'] >= 1
    assert hist2['previous_cancellations'] >= 1
    assert hist2['is_repeated_guest'] == 1

    print("\n=== Step 5: Customer Creates 2nd Reservation (System Auto-Injects History) ===")
    b2 = create_booking(test_email, "Alice FirstTimer")
    print(f"Booking Ref: {b2['booking_ref']}")
    print(f"Auto-Detected is_repeated_guest: {b2.get('is_repeated_guest')}")
    print(f"Auto-Detected previous_cancellations: {b2.get('previous_cancellations')}")
    print(f"Auto-Detected previous_bookings_not_canceled: {b2.get('previous_bookings_not_canceled')}")
    print(f"AI Cancellation Risk: {b2['prediction']['cancellation_probability_pct']}% ({b2['prediction']['risk_band']})")
    print("=== Test Successfully Passed! ===")

if __name__ == "__main__":
    run_test()
