# Hotel Booking Cancellation Prediction & Management System

A web-based hotel revenue and reservation management platform that predicts booking cancellations using machine learning to help hoteliers reduce revenue loss and manage room inventory effectively.

---

## Features

- **Customer Booking Portal:** Guests can browse rooms/suites, calculate stay rates, and reserve rooms with instant booking confirmation.
- **Admin Dashboard:** Real-time operational dashboard with key metrics (Scheduled Revenue, On-The-Books Stays, Predicted Cancellations, Rooms at Stake).
- **Cancellation Risk Prediction:** Uses a trained machine learning model to evaluate cancellation probability (Low, Medium, High risk) for each booking.
- **Single & Batch Prediction:** 
  - Single booking risk evaluator with interactive parameters.
  - CSV file upload to predict cancellations for multiple bookings at once.
- **Guest History Tracking:** Automatically tracks past bookings and cancellations using MongoDB.
- **Near-Term Risk & Inspection:** Daily and near-term cancellation breakdown by room type and date.

---

## Machine Learning Models

The models were trained and evaluated on the **Hotel Booking Demand** dataset (`hotel_bookings.csv`). Post-booking features were removed to prevent data leakage, and 93 aligned features were used after preprocessing and one-hot encoding.

### Model Comparison Summary

| Model | ROC-AUC | Accuracy | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **XGBoost (Selected)** | **0.9426** | **86.01%** | **84.01%** | **0.8514** |
| Random Forest | 0.9409 | 85.78% | 82.20% | 0.8480 |
| Support Vector Machine | 0.9305 | 84.68% | 83.96% | 0.8382 |
| LightGBM | 0.9292 | 83.69% | 82.22% | 0.8275 |
| Decision Tree | 0.9225 | 82.58% | 85.17% | 0.8185 |
| Logistic Regression | 0.9106 | 82.58% | 80.42% | 0.8156 |

**XGBoost** was chosen as the champion model for its high accuracy, strong recall on cancellations, and fast inference time.

---

## Tech Stack

- **Frontend:** React, Vite, Vanilla CSS
- **Backend:** FastAPI, Python, Uvicorn
- **Machine Learning:** Scikit-learn, XGBoost, Pandas, NumPy, Joblib
- **Database:** MongoDB (with local fallback)

---

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI application and API routes
│   ├── pipeline.py             # Feature engineering & model inference
│   ├── database.py             # MongoDB connection & helper functions
│   ├── feature_columns.json    # 93 feature columns used by the model
│   └── test_api.py             # Backend test script
├── frontend/
│   ├── src/
│   │   ├── components/         # React components (Dashboard, Portals, Forms)
│   │   ├── App.jsx             # Main React entry & routing
│   │   └── index.css           # Styling
│   └── package.json
├── models/
│   ├── xgboost_model.joblib    # Trained XGBoost model
│   └── random_forest_model.joblib
├── hotel_bookings.csv          # Dataset file
├── run_system.bat              # One-click startup script (Windows)
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. One-Click Run (Windows)
Simply double click:
```cmd
run_system.bat
```
This starts both the FastAPI backend (`http://127.0.0.1:8000`) and the Vite frontend (`http://localhost:5173`), and opens the application in your browser.

---

### 2. Manual Setup

**Backend:**
```bash
# Install dependencies
pip install fastapi uvicorn scikit-learn xgboost lightgbm pandas numpy joblib pymongo python-multipart pydantic

# Start backend server
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend will run at `http://localhost:5173` and backend API documentation at `http://127.0.0.1:8000/docs`.

---

## Test Accounts

| Role | Username / Identifier | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Admin dashboard, predictions & reservations roster |
| **Customer** | `alexandra` | `guest123` | Customer booking portal & personal reservation history |

---

## Testing

To run the backend test suite:
```bash
python backend/test_api.py
```
