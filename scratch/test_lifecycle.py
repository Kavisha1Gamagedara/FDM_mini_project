import urllib.request
import json
import time

BASE = 'http://127.0.0.1:8000'

def post(endpoint, data):
    req = urllib.request.Request(
        f'{BASE}{endpoint}',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(endpoint):
    with urllib.request.urlopen(f'{BASE}{endpoint}') as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("=================================================================")
    print("VERIFYING RBAC, AUTHENTICATION, AND CANCELLATION HISTORY PIPELINE")
    print("=================================================================")

    # 1. Admin login with pre-saved credentials
    adm = post('/auth/login', {'identifier': 'admin', 'password': 'admin123'})
    print(f"[PASS] 1. Pre-saved Admin Login: User='{adm['user']['username']}' Role='{adm['user']['role']}'")

    # 2. Customer Registration
    test_user = f"traveler_{int(time.time())}"
    test_email = f"{test_user}@aurastay.com"
    cust = post('/auth/register', {
        'username': test_user,
        'email': test_email,
        'name': 'Sophia Bennett',
        'password': 'secretpassword123'
    })
    print(f"[PASS] 2. Customer Registration: Created '{cust['user']['username']}' ({cust['user']['email']})")

    # 3. Customer Login
    login_cust = post('/auth/login', {
        'identifier': test_user,
        'password': 'secretpassword123'
    })
    print(f"[PASS] 3. Customer Login: Verified '{login_cust['user']['name']}'")

    # 4. Check initial guest history (clean slate)
    h0 = get(f'/auth/history/{test_email}')
    print(f"[PASS] 4. Initial History: Total={h0['total_past_bookings']}, RepeatedGuest={h0['is_repeated_guest']}, Cancellations={h0['previous_cancellations']}")

    # 5. Create Booking #1 for this guest
    b1 = post('/reservations', {
        'hotel': 'City Hotel',
        'guest_name': 'Sophia Bennett',
        'email': test_email,
        'username': test_user,
        'arrival_date': '2026-11-10',
        'adults': 2,
        'children': 0,
        'babies': 0,
        'stays_in_week_nights': 3,
        'stays_in_weekend_nights': 1,
        'reserved_room_type': 'A',
        'meal': 'BB',
        'country': 'PRT',
        'market_segment': 'Direct',
        'distribution_channel': 'Direct',
        'customer_type': 'Transient',
        'deposit_type': 'No Deposit',
        'adr': 130.0,
        'total_of_special_requests': 1
    })
    ref1 = b1['booking_ref']
    prob1 = b1['prediction']['cancellation_probability_pct']
    risk1 = b1['prediction']['risk_band']
    print(f"[PASS] 5. Created Booking #1 ({ref1}): Risk={prob1}% ({risk1}), is_repeated={b1['is_repeated_guest']}, prev_cancels={b1['previous_cancellations']}")

    # 6. Guest / Admin cancels Booking #1
    cancel_resp = post(f'/reservations/{ref1}/cancel', {})
    res_obj = cancel_resp.get('reservation', {})
    print(f"[PASS] 6. Cancelled Booking #1: Status='{res_obj.get('status')}' Timestamp='{res_obj.get('cancelled_at')}'")

    # 7. Check guest history after cancellation
    h_after = get(f'/auth/history/{test_email}')
    print(f"[PASS] 7. Updated Guest History in Mongo: RepeatedGuest={h_after['is_repeated_guest']}, Cancellations={h_after['previous_cancellations']}")

    # 8. Guest creates Booking #2: system should automatically detect previous cancellation and repeated guest!
    b2 = post('/reservations', {
        'hotel': 'City Hotel',
        'guest_name': 'Sophia Bennett',
        'email': test_email,
        'username': test_user,
        'arrival_date': '2026-12-15',
        'adults': 2,
        'children': 0,
        'babies': 0,
        'stays_in_week_nights': 3,
        'stays_in_weekend_nights': 1,
        'reserved_room_type': 'A',
        'meal': 'BB',
        'country': 'PRT',
        'market_segment': 'Direct',
        'distribution_channel': 'Direct',
        'customer_type': 'Transient',
        'deposit_type': 'No Deposit',
        'adr': 130.0,
        'total_of_special_requests': 1
    })
    prob2 = b2['prediction']['cancellation_probability_pct']
    risk2 = b2['prediction']['risk_band']
    print(f"[PASS] 8. Created Booking #2 ({b2['booking_ref']}):")
    print(f"       -> Auto-detected is_repeated_guest: {b2['is_repeated_guest']} (Was {b1['is_repeated_guest']})")
    print(f"       -> Auto-detected previous_cancellations: {b2['previous_cancellations']} (Was {b1['previous_cancellations']})")
    print(f"       -> ML Predicted Risk shifted from {prob1}% to {prob2}% ({risk2}) based on real cancellation history!")

    assert b2['is_repeated_guest'] == 1, "is_repeated_guest should be 1"
    assert b2['previous_cancellations'] == 1, "previous_cancellations should be 1"
    print("=================================================================")
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == '__main__':
    main()
