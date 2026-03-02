from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime

expenses_bp = Blueprint("expenses", __name__)

CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Bills", "Other"]


def serialize_expense(exp):
    return {
        "id": str(exp["_id"]),
        "user_id": str(exp["user_id"]),
        "title": exp.get("title", ""),
        "amount": exp["amount"],
        "category": exp["category"],
        "type": exp.get("type", "expense"),  # 'expense' or 'income'
        "date": exp["date"].isoformat(),
        "note": exp.get("note", ""),
        "created_at": exp["created_at"].isoformat()
    }


@expenses_bp.route("/", methods=["POST"])
@jwt_required()
def add_expense():
    user_id = get_jwt_identity()
    data = request.get_json()

    title = data.get("title", "").strip()
    amount = data.get("amount")
    category = data.get("category", "Other")
    exp_type = data.get("type", "expense")
    note = data.get("note", "")
    date_str = data.get("date")

    if not amount or amount <= 0:
        return jsonify({"error": "Valid amount is required"}), 400
    if category not in CATEGORIES:
        return jsonify({"error": "Invalid category"}), 400

    date = datetime.fromisoformat(date_str) if date_str else datetime.utcnow()

    expense = {
        "user_id": ObjectId(user_id),
        "title": title,
        "amount": float(amount),
        "category": category,
        "type": exp_type,
        "date": date,
        "note": note,
        "created_at": datetime.utcnow()
    }
    result = current_app.expenses_col.insert_one(expense)
    expense["_id"] = result.inserted_id
    return jsonify(serialize_expense(expense)), 201


@expenses_bp.route("/", methods=["GET"])
@jwt_required()
def get_expenses():
    user_id = get_jwt_identity()
    month = request.args.get("month")  # format: YYYY-MM
    category = request.args.get("category")
    exp_type = request.args.get("type")

    query = {"user_id": ObjectId(user_id)}
    if month:
        year, m = map(int, month.split("-"))
        query["date"] = {
            "$gte": datetime(year, m, 1),
            "$lt": datetime(year, m + 1, 1) if m < 12 else datetime(year + 1, 1, 1)
        }
    if category:
        query["category"] = category
    if exp_type:
        query["type"] = exp_type

    expenses = list(current_app.expenses_col.find(query).sort("date", -1))
    return jsonify([serialize_expense(e) for e in expenses]), 200


@expenses_bp.route("/<expense_id>", methods=["PUT"])
@jwt_required()
def update_expense(expense_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    expenses_col = current_app.expenses_col

    expense = expenses_col.find_one({"_id": ObjectId(expense_id), "user_id": ObjectId(user_id)})
    if not expense:
        return jsonify({"error": "Expense not found"}), 404

    update_fields = {}
    for field in ["title", "amount", "category", "type", "note"]:
        if field in data:
            update_fields[field] = data[field]
    if "date" in data:
        update_fields["date"] = datetime.fromisoformat(data["date"])

    expenses_col.update_one({"_id": ObjectId(expense_id)}, {"$set": update_fields})
    updated = expenses_col.find_one({"_id": ObjectId(expense_id)})
    return jsonify(serialize_expense(updated)), 200


@expenses_bp.route("/<expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    user_id = get_jwt_identity()
    result = current_app.expenses_col.delete_one({
        "_id": ObjectId(expense_id),
        "user_id": ObjectId(user_id)
    })
    if result.deleted_count == 0:
        return jsonify({"error": "Expense not found"}), 404
    return jsonify({"message": "Deleted successfully"}), 200


@expenses_bp.route("/summary/<month>", methods=["GET"])
@jwt_required()
def get_summary(month):
    user_id = get_jwt_identity()
    year, m = map(int, month.split("-"))
    start = datetime(year, m, 1)
    end = datetime(year, m + 1, 1) if m < 12 else datetime(year + 1, 1, 1)

    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "date": {"$gte": start, "$lt": end}, "type": "expense"}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    result = list(current_app.expenses_col.aggregate(pipeline))
    summary = {r["_id"]: {"total": r["total"], "count": r["count"]} for r in result}
    total = sum(r["total"] for r in result)
    return jsonify({"by_category": summary, "total": total, "month": month}), 200


@expenses_bp.route("/categories", methods=["GET"])
def get_categories():
    return jsonify(CATEGORIES), 200
