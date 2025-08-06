from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import IsolationForest

app = Flask(__name__)
CORS(app)

# Load dataset
df = pd.read_csv("data.csv")

@app.route("/api/risk_scores", methods=["GET"])
def get_risk_scores():
    features = df[['file_access', 'login_count', 'remote_login', 'network_spike']]
    model = IsolationForest(contamination=0.2, random_state=42)
    model.fit(features)
    scores = model.decision_function(features)
    predictions = model.predict(features)

    results = []
    for i in range(len(df)):
        score = int((1 - scores[i]) * 25 + 25)
        status = "suspicious" if predictions[i] == -1 else "normal"

        # Dynamic risk reasons (example logic)
        reasons = []
        if df.iloc[i]['network_spike'] == 1:
            reasons.append("Unusual network activity")
        if df.iloc[i]['remote_login'] == 1:
            reasons.append("Remote login detected")
        if df.iloc[i]['file_access'] > 15:
            reasons.append("High file access frequency")
        if df.iloc[i]['login_count'] > 25:
            reasons.append("Excessive login attempts")

        results.append({
            "id": int(df.iloc[i]['user_id']),
            "ip": df.iloc[i]['ip_address'],
            "score": score,
            "status": status,
            "reasons": reasons
        })

    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)
