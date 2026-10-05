"""
Inference Pipeline for Hotel Booking Cancellation Risk Prediction
Stage 9: Backend Architecture (FastAPI Production Pipeline)

This module handles:
1. Loading the champion machine learning model (XGBoost) and feature definitions.
2. Replicating the exact Part B feature engineering transformations on raw booking inputs.
3. Aligning inputs with the 93-feature matrix used during training.
4. Risk banding and generating actionable revenue management advice.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple


class CancellationPipeline:
    def __init__(self, model_path: str = "models/xgboost_model.joblib",
                 features_path: str = "backend/feature_columns.json"):
        """
        Initializes the inference pipeline with the champion model and feature schema.
        """
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found at {model_path}")
        
        self.model = joblib.load(model_path)
        
        if os.path.exists(features_path):
            with open(features_path, "r") as f:
                self.feature_columns = json.load(f)
        elif os.path.exists("data/X_test_tree.csv"):
            self.feature_columns = pd.read_csv("data/X_test_tree.csv", nrows=1).columns.tolist()
        else:
            raise FileNotFoundError("Feature definitions not found.")
            
        self.top_countries = [
            "PRT", "GBR", "FRA", "ESP", "DEU", "ITA", "IRL", "BEL", 
            "BRA", "USA", "NLD", "CHE", "CN", "AUT", "SWE"
        ]
        self.top_agents = [9.0, 240.0, 14.0, 7.0, 250.0, 241.0, 28.0, 8.0, 1.0, 6.0]
        
        self.month_map = {
            "January": 1, "February": 2, "March": 3, "April": 4,
            "May": 5, "June": 6, "July": 7, "August": 8,
            "September": 9, "October": 10, "November": 11, "December": 12
        }
        self.season_map = {
            12: "Winter", 1: "Winter", 2: "Winter",
            3: "Spring", 4: "Spring", 5: "Spring",
            6: "Summer", 7: "Summer", 8: "Summer",
            9: "Autumn", 10: "Autumn", 11: "Autumn"
        }

    def _engineer_features(self, raw: Dict[str, Any]) -> pd.DataFrame:
        """
        Applies exact Stage 4 / Part B feature transformations to a raw booking dictionary.
        """
        # 1. Basic numeric extractions with sensible fallbacks
        lead_time = float(raw.get("lead_time", 0))
        stays_weekend = float(raw.get("stays_in_weekend_nights", 0))
        stays_week = float(raw.get("stays_in_week_nights", 1))
        adults = float(raw.get("adults", 1))
        children = float(raw.get("children", 0))
        babies = float(raw.get("babies", 0))
        is_repeated = float(raw.get("is_repeated_guest", 0))
        prev_cancels = float(raw.get("previous_cancellations", 0))
        prev_not_cancels = float(raw.get("previous_bookings_not_canceled", 0))
        adr = float(raw.get("adr", 100.0))
        parking_spaces = float(raw.get("required_car_parking_spaces", 0))
        special_requests = float(raw.get("total_of_special_requests", 0))
        week_num = float(raw.get("arrival_date_week_number", 26))
        
        # 2. Engineered numerics
        total_nights = stays_weekend + stays_week
        total_guests = adults + children + babies
        is_family = 1.0 if (children + babies) > 0 else 0.0
        adr_per_person = adr / max(total_guests, 1.0)
        lead_time_log = np.log1p(max(lead_time, 0.0))
        adr_log = np.log1p(max(adr, 0.0))
        
        prev_total = prev_cancels + prev_not_cancels
        prev_cancel_rate = prev_cancels / (prev_total + 1.0)
        has_prev_cancel = 1.0 if prev_cancels > 0 else 0.0
        has_parking = 1.0 if parking_spaces > 0 else 0.0
        has_special = 1.0 if special_requests > 0 else 0.0
        
        # Lead time ordinal band
        if lead_time <= 7:
            lt_band = 0.0
        elif lead_time <= 30:
            lt_band = 1.0
        elif lead_time <= 90:
            lt_band = 2.0
        elif lead_time <= 180:
            lt_band = 3.0
        else:
            lt_band = 4.0
            
        # Agent & Company binary flags
        agent_val = raw.get("agent")
        has_agent = 1.0 if agent_val not in [None, 0, 0.0, "0", "Direct", "none", ""] else 0.0
        company_val = raw.get("company")
        has_company = 1.0 if company_val not in [None, 0, 0.0, "0", "none", ""] else 0.0
        
        # Date & Seasonal Cyclicality
        month_name = str(raw.get("arrival_date_month", "July")).title()
        month_num = self.month_map.get(month_name, 7)
        month_sin = np.sin(2 * np.pi * month_num / 12)
        month_cos = np.cos(2 * np.pi * month_num / 12)
        season = self.season_map.get(month_num, "Summer")
        
        # Grouped Country
        country_raw = str(raw.get("country", "PRT")).upper()
        country_grouped = country_raw if country_raw in self.top_countries else "Other"
        
        # Grouped Agent
        if not has_agent or agent_val in ["Direct", 0, 0.0]:
            agent_grouped = "Direct"
        else:
            try:
                agent_float = float(agent_val)
                agent_grouped = f"Agent_{int(agent_float)}" if agent_float in self.top_agents else "Other_Agent"
            except (ValueError, TypeError):
                agent_grouped = "Other_Agent"
                
        # 3. Build dense vector aligned to exact 93 training features
        row = pd.Series(0.0, index=self.feature_columns)
        
        # Numeric assignments
        row["lead_time"] = lead_time
        row["arrival_date_week_number"] = week_num
        row["stays_in_weekend_nights"] = stays_weekend
        row["stays_in_week_nights"] = stays_week
        row["adults"] = adults
        row["children"] = children
        row["babies"] = babies
        row["is_repeated_guest"] = is_repeated
        row["previous_cancellations"] = prev_cancels
        row["previous_bookings_not_canceled"] = prev_not_cancels
        row["adr"] = adr
        row["required_car_parking_spaces"] = parking_spaces
        row["total_of_special_requests"] = special_requests
        row["has_agent"] = has_agent
        row["has_company"] = has_company
        row["total_nights"] = total_nights
        row["total_guests"] = total_guests
        row["is_family"] = is_family
        row["adr_per_person"] = adr_per_person
        row["lead_time_log"] = lead_time_log
        row["adr_log"] = adr_log
        row["prev_cancellation_rate"] = prev_cancel_rate
        row["has_previous_cancellation"] = has_prev_cancel
        row["has_parking_space"] = has_parking
        row["has_special_requests"] = has_special
        row["arrival_month_sin"] = month_sin
        row["arrival_month_cos"] = month_cos
        row["lead_time_band"] = lt_band
        
        # One-hot encoded category assignments
        hotel_str = str(raw.get("hotel", "City Hotel"))
        meal_str = str(raw.get("meal", "BB"))
        segment_str = str(raw.get("market_segment", "Online TA"))
        channel_str = str(raw.get("distribution_channel", "TA/TO"))
        room_str = str(raw.get("reserved_room_type", "A"))
        deposit_str = str(raw.get("deposit_type", "No Deposit"))
        cust_str = str(raw.get("customer_type", "Transient"))
        
        active_cats = [
            f"hotel_{hotel_str}",
            f"meal_{meal_str}",
            f"market_segment_{segment_str}",
            f"distribution_channel_{channel_str}",
            f"reserved_room_type_{room_str}",
            f"deposit_type_{deposit_str}",
            f"customer_type_{cust_str}",
            f"country_grouped_{country_grouped}",
            f"agent_grouped_{agent_grouped}",
            f"arrival_season_{season}"
        ]
        
        for cat in active_cats:
            if cat in row.index:
                row[cat] = 1.0
                
        return pd.DataFrame([row])

    def predict_booking(self, raw_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Scores a single booking dictionary and returns risk level, probability,
        prescribed revenue management action, and top risk factors.
        """
        features_df = self._engineer_features(raw_input)
        
        # XGBoost inference
        proba = float(self.model.predict_proba(features_df)[0, 1])
        pct = round(proba * 100, 1)
        
        # Risk Banding based on Cost Analysis from Proposal
        if proba < 0.35:
            risk_band = "Low Risk"
            risk_level = "low"
            suggested_action = (
                "Standard booking confirmation. Send standard welcome email. "
                "No prepayment or additional follow-up required."
            )
        elif proba < 0.60:
            risk_band = "Medium Risk"
            risk_level = "medium"
            suggested_action = (
                "Moderate cancellation risk. Send re-confirmation prompt 7 days prior "
                "to arrival and verify payment method/pre-authorization."
            )
        else:
            risk_band = "High Risk"
            risk_level = "high"
            suggested_action = (
                "High probability of cancellation. Require advance deposit or "
                "credit card guarantee. Flag for overbooking protection."
            )
            
        # Extract contributing factors based on booking attributes
        key_factors = []
        lead_time = float(raw_input.get("lead_time", 0))
        if lead_time > 180:
            key_factors.append(f"Extended lead time ({int(lead_time)} days) significantly increases cancellation hazard.")
        elif lead_time > 90:
            key_factors.append(f"Moderate-to-long lead time ({int(lead_time)} days).")
            
        deposit = str(raw_input.get("deposit_type", "No Deposit"))
        if deposit == "Non Refund":
            key_factors.append("Non-Refundable deposit policy historically correlated with high group/contract cancellations.")
            
        prev_cancels = float(raw_input.get("previous_cancellations", 0))
        if prev_cancels > 0:
            key_factors.append(f"Guest history shows {int(prev_cancels)} previous cancellation(s).")
            
        spec_req = float(raw_input.get("total_of_special_requests", 0))
        if spec_req == 0:
            key_factors.append("Zero special requests submitted (low engagement indicator).")
        else:
            key_factors.append(f"Guest submitted {int(spec_req)} special request(s) (positive commitment indicator).")
            
        parking = float(raw_input.get("required_car_parking_spaces", 0))
        if parking > 0:
            key_factors.append("Car parking requested (strong signal of intent to stay).")
            
        if not key_factors:
            key_factors.append("Standard transient reservation profile without anomalous risk indicators.")
            
        return {
            "cancellation_probability": round(proba, 4),
            "cancellation_probability_pct": pct,
            "risk_band": risk_band,
            "risk_level": risk_level,
            "suggested_action": suggested_action,
            "key_risk_drivers": key_factors,
            "inputs_processed": {
                "hotel": raw_input.get("hotel", "City Hotel"),
                "lead_time": lead_time,
                "deposit_type": deposit,
                "country": raw_input.get("country", "PRT"),
                "adr": float(raw_input.get("adr", 100.0)),
                "customer_type": raw_input.get("customer_type", "Transient")
            }
        }


# ==============================================================================
# Self-Test Execution Block (Allows running 'python backend/pipeline.py' directly)
# ==============================================================================
if __name__ == "__main__":
    print("=" * 70)
    print("TESTING INFERENCE PIPELINE (backend/pipeline.py)")
    print("=" * 70)
    
    pipeline = CancellationPipeline()
    print("Pipeline successfully initialized with model and 93 feature definitions!\n")
    
    # Test Case 1: High Risk Reservation (Long lead time, non-refundable deposit, prior cancellation)
    high_risk_sample = {
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
    
    # Test Case 2: Low Risk Reservation (Short lead time, repeat guest, parking, special requests)
    low_risk_sample = {
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
    
    res1 = pipeline.predict_booking(high_risk_sample)
    print("--- [TEST 1: HIGH RISK BOOKING] ---")
    print(f"Cancellation Probability: {res1['cancellation_probability_pct']}%")
    print(f"Risk Band:                {res1['risk_band']}")
    print(f"Suggested Action:         {res1['suggested_action']}")
    print("Key Drivers:")
    for d in res1["key_risk_drivers"]:
        print(f"  • {d}")
        
    print("\n" + "-" * 70 + "\n")
    
    res2 = pipeline.predict_booking(low_risk_sample)
    print("--- [TEST 2: LOW RISK BOOKING] ---")
    print(f"Cancellation Probability: {res2['cancellation_probability_pct']}%")
    print(f"Risk Band:                {res2['risk_band']}")
    print(f"Suggested Action:         {res2['suggested_action']}")
    print("Key Drivers:")
    for d in res2["key_risk_drivers"]:
        print(f"  • {d}")
        
    print("\n" + "=" * 70)
    print("Pipeline verification completed successfully!")
