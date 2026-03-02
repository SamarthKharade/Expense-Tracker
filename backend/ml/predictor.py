import numpy as np
from datetime import datetime, timedelta
from bson import ObjectId


CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Bills", "Other"]


def get_monthly_spending(expenses_col, user_id, year, month):
    """Get total spending per category for a given month."""
    start = datetime(year, month, 1)
    end = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)
    
    pipeline = [
        {"$match": {
            "user_id": ObjectId(user_id),
            "date": {"$gte": start, "$lt": end},
            "type": "expense"
        }},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}}}
    ]
    results = list(expenses_col.aggregate(pipeline))
    return {r["_id"]: r["total"] for r in results}


def get_last_n_months_data(expenses_col, user_id, n=3):
    """Get spending data for last n months."""
    now = datetime.utcnow()
    months_data = []
    
    for i in range(n, 0, -1):
        # Go back i months
        month = now.month - i
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        spending = get_monthly_spending(expenses_col, user_id, year, month)
        months_data.append({"year": year, "month": month, "spending": spending})
    
    return months_data


def predict_end_of_month(expenses_col, user_id):
    """Predict end-of-month total per category based on current spending pace."""
    now = datetime.utcnow()
    day_of_month = now.day
    days_in_month = 30  # approximate
    
    # Current month spending
    current_spending = get_monthly_spending(expenses_col, user_id, now.year, now.month)
    
    predictions = {}
    for cat, spent in current_spending.items():
        if day_of_month > 0:
            predicted = (spent / day_of_month) * days_in_month
            predictions[cat] = round(predicted, 2)
    
    return predictions


def generate_insights(expenses_col, user_id):
    """
    ML Insights:
    1. Compare this month vs last month by category
    2. Detect categories with significant increase
    3. Predict end-of-month spending
    4. Detect unusual spikes using z-score on historical data
    """
    now = datetime.utcnow()
    
    # Current month spending
    curr_spending = get_monthly_spending(expenses_col, user_id, now.year, now.month)
    
    # Last month spending
    last_month = now.month - 1
    last_year = now.year
    if last_month == 0:
        last_month = 12
        last_year -= 1
    prev_spending = get_monthly_spending(expenses_col, user_id, last_year, last_month)
    
    # Historical data (last 3 months)
    historical = get_last_n_months_data(expenses_col, user_id, n=3)
    
    insights = []
    alerts = []
    
    # Compare current vs previous month
    comparison = {}
    all_categories = set(list(curr_spending.keys()) + list(prev_spending.keys()))
    
    for cat in all_categories:
        curr = curr_spending.get(cat, 0)
        prev = prev_spending.get(cat, 0)
        
        if prev > 0:
            change_pct = ((curr - prev) / prev) * 100
        elif curr > 0:
            change_pct = 100  # new spending this month
        else:
            change_pct = 0
        
        comparison[cat] = {
            "current": round(curr, 2),
            "previous": round(prev, 2),
            "change_pct": round(change_pct, 2),
            "change_amount": round(curr - prev, 2)
        }
        
        # Generate insight messages
        if change_pct > 30 and curr > 100:
            alerts.append({
                "category": cat,
                "type": "warning",
                "message": f"⚠️ Your {cat} spending increased by {change_pct:.0f}% compared to last month (₹{prev:.0f} → ₹{curr:.0f})",
                "severity": "high" if change_pct > 60 else "medium"
            })
        elif change_pct < -20 and prev > 100:
            insights.append({
                "category": cat,
                "type": "positive",
                "message": f"✅ Great! You reduced {cat} spending by {abs(change_pct):.0f}% this month (₹{prev:.0f} → ₹{curr:.0f})",
                "severity": "low"
            })
    
    # Z-score anomaly detection using historical data
    if len(historical) >= 2:
        for cat in CATEGORIES:
            hist_values = [m["spending"].get(cat, 0) for m in historical]
            curr_val = curr_spending.get(cat, 0)
            
            if len(hist_values) >= 2 and sum(hist_values) > 0:
                mean = np.mean(hist_values)
                std = np.std(hist_values)
                
                if std > 0:
                    z_score = (curr_val - mean) / std
                    if z_score > 2:
                        alerts.append({
                            "category": cat,
                            "type": "anomaly",
                            "message": f"🔴 Unusual spike detected in {cat}! Spending is significantly higher than your 3-month average (Avg: ₹{mean:.0f}, Current: ₹{curr_val:.0f})",
                            "severity": "high"
                        })
    
    # Predict end of month
    predictions = predict_end_of_month(expenses_col, user_id)
    
    # Top spending category this month
    if curr_spending:
        top_cat = max(curr_spending, key=curr_spending.get)
        insights.append({
            "category": top_cat,
            "type": "info",
            "message": f"📊 Your highest spending this month is on {top_cat} (₹{curr_spending[top_cat]:.0f})",
            "severity": "info"
        })
    
    return {
        "comparison": comparison,
        "alerts": alerts,
        "insights": insights,
        "predictions": predictions,
        "current_month": f"{now.year}-{now.month:02d}",
        "previous_month": f"{last_year}-{last_month:02d}"
    }
