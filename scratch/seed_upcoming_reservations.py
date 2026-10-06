"""
Seeds realistic future bookings across upcoming months (Oct 2026 to June 2027)
so the Admin Dashboard line chart has rich, realistic XGBoost-evaluated cancellation data.
"""
import urllib.request
import json
import random

API_URL = "http://127.0.0.1:8000/reservations"

UPCOMING_STAYS = [
    # October 2026
    {"guest_name": "Matteo Rossi", "email": "matteo.rossi@milan.it", "hotel": "Resort Hotel", "check_in_date": "2026-10-22", "check_out_date": "2026-10-25", "arrival_date_month": "October", "lead_time": 16, "adr": 145.0, "market_segment": "Direct", "deposit_type": "No Deposit", "total_of_special_requests": 2, "required_car_parking_spaces": 1, "reserved_room_type": "A"},
    {"guest_name": "Elena Bianchi", "email": "elena.b@roma.it", "hotel": "Resort Hotel", "check_in_date": "2026-10-28", "check_out_date": "2026-10-31", "arrival_date_month": "October", "lead_time": 22, "adr": 210.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 0, "required_car_parking_spaces": 0, "reserved_room_type": "D"},
    
    # November 2026
    {"guest_name": "Hans Schneider", "email": "h.schneider@berlin.de", "hotel": "Resort Hotel", "check_in_date": "2026-11-08", "check_out_date": "2026-11-12", "arrival_date_month": "November", "lead_time": 45, "adr": 145.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 0, "required_car_parking_spaces": 0, "reserved_room_type": "A"},
    {"guest_name": "Sophie Laurent", "email": "sophie.l@paris.fr", "hotel": "Resort Hotel", "check_in_date": "2026-11-15", "check_out_date": "2026-11-18", "arrival_date_month": "November", "lead_time": 60, "adr": 210.0, "market_segment": "Groups", "deposit_type": "Non Refund", "total_of_special_requests": 1, "required_car_parking_spaces": 0, "reserved_room_type": "D"},
    {"guest_name": "Marco Ferri", "email": "marco.f@turin.it", "hotel": "City Hotel", "check_in_date": "2026-11-20", "check_out_date": "2026-11-23", "arrival_date_month": "November", "lead_time": 90, "adr": 115.0, "market_segment": "Corporate", "deposit_type": "No Deposit", "total_of_special_requests": 0, "required_car_parking_spaces": 1, "reserved_room_type": "A"},
    {"guest_name": "Julian Vance", "email": "jvance@london.uk", "hotel": "Resort Hotel", "check_in_date": "2026-11-25", "check_out_date": "2026-11-29", "arrival_date_month": "November", "lead_time": 120, "adr": 420.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 0, "required_car_parking_spaces": 0, "reserved_room_type": "F"},

    # December 2026 (Holiday season - high demand)
    {"guest_name": "Alexander Hayes", "email": "alex.hayes@oxford.uk", "hotel": "Resort Hotel", "check_in_date": "2026-12-05", "check_out_date": "2026-12-09", "arrival_date_month": "December", "lead_time": 75, "adr": 210.0, "market_segment": "Direct", "deposit_type": "No Deposit", "total_of_special_requests": 2, "required_car_parking_spaces": 1, "reserved_room_type": "D"},
    {"guest_name": "Chiara Fontana", "email": "chiara.f@bologna.it", "hotel": "Resort Hotel", "check_in_date": "2026-12-14", "check_out_date": "2026-12-17", "arrival_date_month": "December", "lead_time": 110, "adr": 145.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 0, "required_car_parking_spaces": 0, "reserved_room_type": "A"},
    {"guest_name": "David Sterling", "email": "d.sterling@zurich.ch", "hotel": "Resort Hotel", "check_in_date": "2026-12-23", "check_out_date": "2026-12-28", "arrival_date_month": "December", "lead_time": 150, "adr": 420.0, "market_segment": "Direct", "deposit_type": "No Deposit", "total_of_special_requests": 3, "required_car_parking_spaces": 1, "reserved_room_type": "F"},
    {"guest_name": "Nordic Travel Group", "email": "groups@nordictravel.no", "hotel": "Resort Hotel", "check_in_date": "2026-12-28", "check_out_date": "2027-01-02", "arrival_date_month": "December", "lead_time": 180, "adr": 160.0, "market_segment": "Groups", "deposit_type": "Non Refund", "total_of_special_requests": 0, "required_car_parking_spaces": 0, "reserved_room_type": "A", "room_count": 4},

    # January 2027 (Winter shoulder season)
    {"guest_name": "Oliver Twist", "email": "oliver@london.co.uk", "hotel": "City Hotel", "check_in_date": "2027-01-10", "check_out_date": "2027-01-14", "arrival_date_month": "January", "lead_time": 95, "adr": 115.0, "market_segment": "Corporate", "deposit_type": "No Deposit", "total_of_special_requests": 1, "required_car_parking_spaces": 1, "reserved_room_type": "A"},
    {"guest_name": "Claire Dupont", "email": "claire.dupont@lyon.fr", "hotel": "Resort Hotel", "check_in_date": "2027-01-20", "check_out_date": "2027-01-24", "arrival_date_month": "January", "lead_time": 140, "adr": 145.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 0, "required_car_parking_spaces": 0, "reserved_room_type": "A"},

    # February 2027 (Valentine's & Winter Wellness)
    {"guest_name": "Luca Moretti", "email": "luca.moretti@roma.it", "hotel": "Resort Hotel", "check_in_date": "2027-02-12", "check_out_date": "2027-02-15", "arrival_date_month": "February", "lead_time": 130, "adr": 210.0, "market_segment": "Direct", "deposit_type": "No Deposit", "total_of_special_requests": 2, "required_car_parking_spaces": 1, "reserved_room_type": "D"},
    {"guest_name": "Venture Capital Summit", "email": "events@techcap.com", "hotel": "City Hotel", "check_in_date": "2027-02-22", "check_out_date": "2027-02-25", "arrival_date_month": "February", "lead_time": 175, "adr": 135.0, "market_segment": "Corporate", "deposit_type": "No Deposit", "total_of_special_requests": 1, "required_car_parking_spaces": 0, "reserved_room_type": "A"},

    # March 2027 (Spring arrival)
    {"guest_name": "Charlotte Green", "email": "charlotte.g@bristol.uk", "hotel": "Resort Hotel", "check_in_date": "2027-03-10", "check_out_date": "2027-03-15", "arrival_date_month": "March", "lead_time": 160, "adr": 145.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 0, "required_car_parking_spaces": 0, "reserved_room_type": "A"},
    {"guest_name": "Antonio Ricci", "email": "antonio.r@napoli.it", "hotel": "Resort Hotel", "check_in_date": "2027-03-24", "check_out_date": "2027-03-28", "arrival_date_month": "March", "lead_time": 190, "adr": 210.0, "market_segment": "Direct", "deposit_type": "No Deposit", "total_of_special_requests": 1, "required_car_parking_spaces": 1, "reserved_room_type": "D"},

    # April 2027 (Easter & Salento Wildflowers)
    {"guest_name": "Maximilian Weber", "email": "m.weber@munich.de", "hotel": "Resort Hotel", "check_in_date": "2027-04-05", "check_out_date": "2027-04-10", "arrival_date_month": "April", "lead_time": 210, "adr": 210.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 1, "required_car_parking_spaces": 0, "reserved_room_type": "D"},
    {"guest_name": "Beatrice Conti", "email": "beatrice.c@florence.it", "hotel": "Resort Hotel", "check_in_date": "2027-04-18", "check_out_date": "2027-04-22", "arrival_date_month": "April", "lead_time": 230, "adr": 420.0, "market_segment": "Direct", "deposit_type": "No Deposit", "total_of_special_requests": 3, "required_car_parking_spaces": 1, "reserved_room_type": "F"},

    # May 2027 (Pre-Summer Bloom)
    {"guest_name": "James Henderson", "email": "j.henderson@manchester.uk", "hotel": "Resort Hotel", "check_in_date": "2027-05-12", "check_out_date": "2027-05-17", "arrival_date_month": "May", "lead_time": 250, "adr": 210.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 0, "required_car_parking_spaces": 0, "reserved_room_type": "D"},
    {"guest_name": "Sophia Van Der Berg", "email": "sophia@amsterdam.nl", "hotel": "Resort Hotel", "check_in_date": "2027-05-24", "check_out_date": "2027-05-29", "arrival_date_month": "May", "lead_time": 260, "adr": 420.0, "market_segment": "Direct", "deposit_type": "No Deposit", "total_of_special_requests": 2, "required_car_parking_spaces": 1, "reserved_room_type": "F"},

    # June 2027 (Summer Peak Opening)
    {"guest_name": "Arthur Pendelton", "email": "arthur.p@dublin.ie", "hotel": "Resort Hotel", "check_in_date": "2027-06-08", "check_out_date": "2027-06-14", "arrival_date_month": "June", "lead_time": 280, "adr": 420.0, "market_segment": "Online TA", "deposit_type": "No Deposit", "total_of_special_requests": 1, "required_car_parking_spaces": 1, "reserved_room_type": "F"},
]

def seed_stays():
    success_count = 0
    for stay in UPCOMING_STAYS:
        try:
            req = urllib.request.Request(
                API_URL, 
                data=json.dumps(stay).encode('utf-8'), 
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req) as resp:
                if resp.status == 200:
                    success_count += 1
        except Exception as e:
            print(f"Error seeding {stay['guest_name']}: {e}")
    print(f"Successfully seeded {success_count} future bookings across upcoming months!")

if __name__ == "__main__":
    seed_stays()
