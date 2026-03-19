import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def main():
    # Load data
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'workflow_data.csv')
    df = pd.read_csv(data_path)

    # Encode categorical columns
    categorical_columns = ['department', 'workflow_type', 'priority', 'step_name']
    encoders = {}
    
    for col in categorical_columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
        
    # Define features and target
    features = ['department', 'workflow_type', 'step_number', 'total_steps', 
                'step_duration_hours', 'expected_duration_hours', 'inefficiency_score', 'priority']
    target = 'delay_flag'
    
    X = df[features]
    y = df[target]
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train RandomForestClassifier
    model = RandomForestClassifier(random_state=42)
    model.fit(X_train, y_train)
    
    # Predictions and Evaluation
    y_pred = model.predict(X_test)
    
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    # Save the model and encoders
    backend_dir = os.path.dirname(__file__)
    joblib.dump(model, os.path.join(backend_dir, 'model.pkl'))
    joblib.dump(encoders, os.path.join(backend_dir, 'encoders.pkl'))
    
    print(f"Model saved to {os.path.join(backend_dir, 'model.pkl')}")
    print(f"Encoders saved to {os.path.join(backend_dir, 'encoders.pkl')}")

if __name__ == '__main__':
    main()
