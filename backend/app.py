from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import IsolationForest
import os
import random

app = Flask(__name__)  # ✅ FIXED
CORS(app)

# Generate dataset if not exists
if not os.path.exists("predictive_risk_dataset_10k.csv"):
    import generate_dataset

# Load dataset
DATA_FILE = "predictive_risk_dataset_10k.csv"
df = pd.read_csv(DATA_FILE)

# Function to recommend actions based on reasons
def generate_recommendations(reasons):
    recs = []
    for reason in reasons:
        if "network" in reason.lower():
            recs.append("Limit external network access")
        elif "usb" in reason.lower():
            recs.append("Disable USB temporarily")
        elif "unauthorized" in reason.lower():
            recs.append("Investigate unauthorized login")
        elif "file" in reason.lower():
            recs.append("Audit file access logs")
    return recs or ["No immediate action"]

# Function to assign status based on score
def assign_status(score):
    if score > 50:
        return "suspicious"
    elif score >= 41:
        return "high risk"
    elif score >= 26:
        return "risk"
    else:
        return "normal"

@app.route("/api/risk_scores", methods=["GET"])
def get_risk_scores():
    model_type = request.args.get("model", "iforest")
    features = df[['files_accessed', 'unauthorized_access', 'usb_usage', 'network_activity']]

    if model_type == "random":
        # Generate random scores between 5 and 55 for testing
        scores = [random.randint(5, 55) for _ in range(len(df))]
    else:
        model = IsolationForest(contamination=0.2, random_state=42)
        model.fit(features)
        raw_scores = model.decision_function(features)

        # Normalize scores between 5–55 using min-max scaling
        min_score = min(raw_scores)
        max_score = max(raw_scores)
        scores = [
            int(5 + (1 - ((s - min_score) / (max_score - min_score))) * 50)
            for s in raw_scores
        ]

    results = []
    for i in range(len(df)):
        user = df.iloc[i]
        reasons = []
        if user['network_activity'] > 3000:
            reasons.append("High network usage")
        if user['usb_usage'] == 1:
            reasons.append("USB device used")
        if user['unauthorized_access'] > 0:
            reasons.append("Unauthorized access attempts")
        if user['files_accessed'] > 75:
            reasons.append("High file access")

        recommendations = generate_recommendations(reasons)
        status = assign_status(scores[i])

        results.append({
            "id": user['user_id'],
            "score": scores[i],
            "status": status,
            "reasons": reasons,
            "recommended_actions": recommendations
        })

    return jsonify(results)

if __name__ == "__main__":  # ✅ FIXED
    app.run(debug=True)
