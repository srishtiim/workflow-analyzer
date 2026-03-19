# Enterprise Workflow Inefficiency Analyzer

A full-stack data science web application that analyzes enterprise workflow logs, detects bottlenecks, identifies inefficiencies, and predicts delays using machine learning.

## Live Demo
- Frontend: (add Vercel URL after deployment)
- Backend API: (add Render URL after deployment)

## Tech Stack
| Layer | Technology |
|---|---|
| Dataset | Python, Pandas, NumPy |
| ML Model | Scikit-learn (Random Forest) |
| Backend API | FastAPI, Uvicorn, Joblib |
| Frontend | React, Vite, Tailwind CSS, Recharts, Axios |
| Deployment | Vercel (frontend), Render (backend) |

## How It Works
1. Upload a workflow CSV file through the dashboard
2. Backend processes the CSV and computes inefficiency scores per department
3. ML model predicts delay probability for each workflow
4. Dashboard displays bottlenecks, charts, and flagged workflows

## Dataset
- 2342 rows across 500 unique tasks
- 8 departments: HR, Finance, IT, Legal, Operations, Procurement, Compliance, Management
- 14 columns including timestamps, step durations, delay flags, inefficiency scores
- Finance (2.4x) and Legal (2.1x) have highest delay multipliers baked in

## ML Model
- Algorithm: Random Forest Classifier
- Target: delay_flag (0 = on time, 1 = delayed)
- Features: department, workflow_type, step_number, total_steps, step_duration_hours, expected_duration_hours, inefficiency_score, priority
- Accuracy: ~84%

## Run Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
python model_trainer.py
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open localhost:5173, upload workflow_data.csv, click Run Analysis.
