from flask import Blueprint, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ml.predictor import generate_insights

insights_bp = Blueprint("insights", __name__)


@insights_bp.route("/", methods=["GET"])
@jwt_required()
def get_insights():
    user_id = get_jwt_identity()
    try:
        insights = generate_insights(current_app.expenses_col, user_id)
        return jsonify(insights), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
