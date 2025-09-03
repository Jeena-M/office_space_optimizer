# predict_desk_usage.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()  

# Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load badge data

# Get the absolute path to the current script’s directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, "synthetic_badge_data.csv")

df = pd.read_csv(csv_path)
df['date'] = pd.to_datetime(df['date'])

# Today's date (for prediction)
today = datetime(2025, 8, 20)

# Prepare features per desk
features = []
desk_codes = df['desk_code'].unique()
for desk in desk_codes:
    emp_df = df[df['desk_code'] == desk]
    # Last 7 days usage
    last_7d = emp_df[(emp_df['date'] >= today - timedelta(days=7)) & (emp_df['date'] < today)]
    last_30d = emp_df[(emp_df['date'] >= today - timedelta(days=30)) & (emp_df['date'] < today)]
    
    feat = {
        "desk_code": desk,
        "days_used_last_7": last_7d.shape[0],
        "days_used_last_30": last_30d.shape[0],
        "weekday_usage": last_30d[last_30d['date'].dt.weekday < 5].shape[0] / 20.0,  # 20 weekdays in 30 days approx
        "department": emp_df['department'].iloc[0]
    }
    features.append(feat)

feature_df = pd.DataFrame(features)

# Create label for training (just for example using last 30 days)
feature_df['used'] = feature_df['days_used_last_7'] > 0  # simple rule

# Train model
X = feature_df[['days_used_last_7', 'days_used_last_30', 'weekday_usage']]
y = feature_df['used']
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X, y)

# Predict usage for today
feature_df['predicted_used'] = clf.predict(X)

# Update desks table in Supabase
for _, row in feature_df.iterrows():
    supabase.table('desks').update({"used": row['predicted_used']}).eq("desk_code", row['desk_code']).execute()

print("Desk usage updated based on ML prediction!")
