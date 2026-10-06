# Hotel Revenue Management & Cancellation Risk Prediction

This repository contains the Exploratory Data Analysis (EDA), Data Preprocessing, Feature Engineering, and Class Imbalance mitigation pipeline for the **Hotel Booking Demand** dataset.

## Project Overview
- **Dataset:** Hotel Booking Demand (`hotel_bookings.csv` – Antonio, de Almeida, & Nunes, 2019)
- **Target Variable:** `is_canceled` (0 = Stayed / Checked-out, 1 = Canceled / No-Show)
- **Objective:** Predict booking cancellation risk at the time of reservation creation to assist hotel revenue and inventory management.

## Key Pipeline Steps
1. **Data Cleaning:** Removal of 827 physically impossible / administrative records (0 guests, 0 night stays with ADR=0, negative/extreme typo ADR).
2. **Leakage Prevention:** Dropping post-booking features (`reservation_status`, `assigned_room_type`, `booking_changes`, `days_in_waiting_list`).
3. **Group-Aware Splitting:** Preserving genuine group tour blocks using `GroupShuffleSplit` across identical booking profiles to prevent data leakage without blind deduplication.
4. **Missing Value Imputation:** Domain-informed handling for `company`, `agent`, `country`, and `children`.
5. **Feature Engineering:** 17 engineered features including `lead_time_log`, `cancellation_ratio`, `has_parking_space`, `adr_per_person`, and trigonometric seasonal features.
6. **Dual Preprocessing Pipelines:**
   - **Unscaled Matrix:** For Tree-based models (Decision Tree, Random Forest, XGBoost, LightGBM).
   - **Standardized Matrix:** For Linear and Distance-based models (Logistic Regression, KNN, SVM).
7. **Class Imbalance Handling:** SMOTE-NC on scaled training data preserving one-hot categorical validity, alongside algorithmic class weighting (`class_weight='balanced'`) for tree models.

## Repository Structure
```
├── FDM_Final_new.ipynb                         # Master EDA & Preprocessing Notebook
├── FDM_Stage4_Preprocessing_FeatureEngineering.ipynb # Stage 4 pipeline
├── Stage4_Preprocessing_FeatureEngineering_Report.md # Detailed methodology report
├── models/                                     # Saved preprocessor bundle and selected features
│   ├── preprocessor_pipeline.joblib
│   ├── feature_metadata.json
│   └── selected_features.json
├── .gitignore
└── README.md
```

## Dataset Access
The raw dataset `hotel_bookings.csv` is publicly available on Kaggle / ScienceDirect:
> Antonio, N., de Almeida, A., & Nunes, L. (2019). *Hotel booking demand datasets*. Data in Brief, 22, 41-49.
Place `hotel_bookings.csv` in the root directory before running the pipeline.

## Running the Platform
From the root directory, simply run:
```bash
start system
```
This launches:
- **FastAPI Backend:** `http://127.0.0.1:8000` (API Docs: `http://127.0.0.1:8000/docs`)
- **React Frontend:** `http://localhost:5173`
- Automatically opens the frontend portal in your default browser.

