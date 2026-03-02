from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

# MongoDB connection
client = MongoClient(app.config["MONGO_URI"])
db = client["expense_tracker"]

# Collections
users_col = db["users"]
expenses_col = db["expenses"]
budgets_col = db["budgets"]

# Make db accessible to routes
app.db = db
app.users_col = users_col
app.expenses_col = expenses_col
app.budgets_col = budgets_col

# Register blueprints
from routes.auth import auth_bp
from routes.expenses import expenses_bp
from routes.budget import budget_bp
from routes.insights import insights_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(expenses_bp, url_prefix="/api/expenses")
app.register_blueprint(budget_bp, url_prefix="/api/budget")
app.register_blueprint(insights_bp, url_prefix="/api/insights")

@app.route("/api/health")
def health():
    return {"status": "ok", "message": "Expense Tracker API running"}

if __name__ == "__main__":
    app.run(debug=True, port=5000)
