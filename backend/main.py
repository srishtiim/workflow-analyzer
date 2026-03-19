from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import joblib
import os
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

backend_dir = os.path.dirname(__file__)
model_path = os.path.join(backend_dir, 'model.pkl')
encoders_path = os.path.join(backend_dir, 'encoders.pkl')

try:
    model = joblib.load(model_path)
    encoders = joblib.load(encoders_path)
except Exception as e:
    print(f"Failed to load model or encoders: {e}")
    model = None
    encoders = None

class PredictionRequest(BaseModel):
    department: str
    workflow_type: str
    step_number: int
    total_steps: int
    step_duration_hours: float
    expected_duration_hours: float
    inefficiency_score: float
    priority: str

@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    # Calculate metrics
    avg_ineff = df.groupby('department')['inefficiency_score'].mean().reset_index()
    dept_inefficiency = [{"department": row['department'], "avg_inefficiency_score": row['inefficiency_score']} for _, row in avg_ineff.iterrows()]
    
    avg_dur = df.groupby('department')[['step_duration_hours', 'expected_duration_hours']].mean().reset_index()
    dept_duration = [{"department": row['department'], "avg_actual": row['step_duration_hours'], "avg_expected": row['expected_duration_hours']} for _, row in avg_dur.iterrows()]
    
    top_3 = avg_ineff.sort_values(by='inefficiency_score', ascending=False).head(3)
    bottlenecks = [{"department": row['department'], "inefficiency_score": row['inefficiency_score']} for _, row in top_3.iterrows()]
    
    total_workflows = len(df)
    total_delayed = int((df['delay_flag'] == 1).sum()) if 'delay_flag' in df.columns else 0
    total_ontime = int((df['delay_flag'] == 0).sum()) if 'delay_flag' in df.columns else total_workflows
    delay_rate = (total_delayed / total_workflows * 100) if total_workflows > 0 else 0
    
    # Add predicted_delay column using the loaded model
    if model and encoders:
        try:
            pred_df = df.copy()
            pred_df['department'] = encoders['department'].transform(pred_df['department'].astype(str))
            pred_df['workflow_type'] = encoders['workflow_type'].transform(pred_df['workflow_type'].astype(str))
            pred_df['priority'] = encoders['priority'].transform(pred_df['priority'].astype(str))
            
            features = ['department', 'workflow_type', 'step_number', 'total_steps', 
                        'step_duration_hours', 'expected_duration_hours', 'inefficiency_score', 'priority']
            
            X_pred = pred_df[features]
            df['predicted_delay'] = model.predict(X_pred).tolist()
        except Exception as e:
            print(f"Prediction error during analysis: {e}")
            df['predicted_delay'] = None
    else:
        df['predicted_delay'] = None

    # Clean data (replace NaN with None for JSON serialization)
    df_clean = df.where(pd.notnull(df), None)
    workflows = df_clean.to_dict(orient='records')
    
    return {
        "total_workflows": total_workflows,
        "total_delayed": total_delayed,
        "total_ontime": total_ontime,
        "delay_rate": delay_rate,
        "dept_inefficiency": dept_inefficiency,
        "dept_duration": dept_duration,
        "bottlenecks": bottlenecks,
        "workflows": workflows
    }
    
@app.post("/predict")
async def predict(req: PredictionRequest):
    if not model or not encoders:
        return {"error": "Model not loaded"}
        
    try:
        # Encode inputs
        dept_encoded = encoders['department'].transform([req.department])[0]
        wt_encoded = encoders['workflow_type'].transform([req.workflow_type])[0]
        priority_encoded = encoders['priority'].transform([req.priority])[0]
        
        input_data = pd.DataFrame([{
            'department': dept_encoded,
            'workflow_type': wt_encoded,
            'step_number': req.step_number,
            'total_steps': req.total_steps,
            'step_duration_hours': req.step_duration_hours,
            'expected_duration_hours': req.expected_duration_hours,
            'inefficiency_score': req.inefficiency_score,
            'priority': priority_encoded
        }])
        
        proba = model.predict_proba(input_data)[0]
        pred = model.predict(input_data)[0]
        
        delay_prob = float(proba[1]) if len(proba) > 1 else (1.0 if pred == 1 else 0.0)
        
        return {
            "delay_probability": delay_prob,
            "prediction": "delayed" if pred == 1 else "on-time"
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
