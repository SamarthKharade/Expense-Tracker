from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime

budget_bp = Blueprint("budget", __name__)


@budget_bp.route("/<month>", methods=["GET"])
@jwt_required()
def get_budget(month):
    user_id = get_jwt_identity()
    budget = current_app.budgets_col.find_one({"user_id": ObjectId(user_id), "month": month})
    if not budget:
        return jsonify({"month": month, "total_limit": 0, "category_limits": {}}), 200
    return jsonify({
        "month": month,
        "total_limit": budget.get("total_limit", 0),
        "category_limits": budget.get("category_limits", {})
    }), 200


@budget_bp.route("/<month>", methods=["POST", "PUT"])
@jwt_required()
def set_budget(month):
    user_id = get_jwt_identity()
    data = request.get_json()
    total_limit = data.get("total_limit", 0)
    category_limits = data.get("category_limits", {})

    current_app.budgets_col.update_one(
        {"user_id": ObjectId(user_id), "month": month},
        {"$set": {
            "user_id": ObjectId(user_id),
            "month": month,
            "total_limit": float(total_limit),
            "category_limits": {k: float(v) for k, v in category_limits.items()},
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    return jsonify({"message": "Budget saved", "month": month, "total_limit": total_limit, "category_limits": category_limits}), 200
