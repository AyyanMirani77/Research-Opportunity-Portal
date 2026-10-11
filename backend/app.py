import os
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

COLUMNS = ["title", "description", "research_area", "faculty_name",
           "department", "required_skills", "positions", "deadline", "status"]


def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "research_portal"),
    )


def run(sql, params=(), fetch=None, commit=False):
    """Run one query. fetch: 'one' | 'all' | None. Returns (result, lastrowid)."""
    conn = get_db()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute(sql, params)
        result = cur.fetchone() if fetch == "one" else cur.fetchall() if fetch == "all" else None
        if commit:
            conn.commit()
        return result, cur.lastrowid, cur.rowcount
    finally:
        conn.close()


def clean(row):
    if row and row.get("deadline"):
        row["deadline"] = row["deadline"].isoformat()
    if row and row.get("created_at"):
        row["created_at"] = row["created_at"].isoformat()
    return row


def validate(data, partial=False):
    """Returns (cleaned_dict, errors_dict)."""
    errors, out = {}, {}
    if not isinstance(data, dict):
        return {}, {"body": "Request body must be a JSON object"}
    for col in COLUMNS:
        if col not in data:
            if not partial and col != "status":
                errors[col] = "This field is required"
            continue
        val = data[col]
        if col == "positions":
            try:
                val = int(val)
                if val < 1:
                    raise ValueError
            except (ValueError, TypeError):
                errors[col] = "Must be a whole number of 1 or more"
                continue
        elif col == "deadline":
            try:
                datetime.strptime(str(val), "%Y-%m-%d")
            except ValueError:
                errors[col] = "Use the date format YYYY-MM-DD"
                continue
        elif col == "status":
            if val not in ("Open", "Closed"):
                errors[col] = "Must be either Open or Closed"
                continue
        else:
            val = str(val).strip()
            if not val:
                errors[col] = "This field cannot be empty"
                continue
        out[col] = val
    if partial and not out and not errors:
        errors["body"] = "Provide at least one field to update"
    return out, errors


def bad_request(errors):
    return jsonify({"error": "Validation failed", "details": errors}), 400


@app.route("/")
def home():
    return app.send_static_file("index.html")


@app.route("/api/opportunities", methods=["POST"])
def create():
    data, errors = validate(request.get_json(silent=True))
    if errors:
        return bad_request(errors)
    data.setdefault("status", "Open")
    cols = ", ".join(data)
    marks = ", ".join(["%s"] * len(data))
    _, new_id, _ = run(f"INSERT INTO opportunities ({cols}) VALUES ({marks})",
                       tuple(data.values()), commit=True)
    row, _, _ = run("SELECT * FROM opportunities WHERE id=%s", (new_id,), fetch="one")
    return jsonify(clean(row)), 201


@app.route("/api/opportunities", methods=["GET"])
def list_all():
    rows, _, _ = run("SELECT * FROM opportunities ORDER BY id DESC", fetch="all")
    return jsonify([clean(r) for r in rows]), 200


@app.route("/api/opportunities/<int:oid>", methods=["GET"])
def get_one(oid):
    row, _, _ = run("SELECT * FROM opportunities WHERE id=%s", (oid,), fetch="one")
    if not row:
        return jsonify({"error": f"Opportunity {oid} not found"}), 404
    return jsonify(clean(row)), 200


@app.route("/api/opportunities/<int:oid>", methods=["PUT"])
def update(oid):
    row, _, _ = run("SELECT id FROM opportunities WHERE id=%s", (oid,), fetch="one")
    if not row:
        return jsonify({"error": f"Opportunity {oid} not found"}), 404
    data, errors = validate(request.get_json(silent=True), partial=True)
    if errors:
        return bad_request(errors)
    sets = ", ".join(f"{c}=%s" for c in data)
    run(f"UPDATE opportunities SET {sets} WHERE id=%s",
        tuple(data.values()) + (oid,), commit=True)
    row, _, _ = run("SELECT * FROM opportunities WHERE id=%s", (oid,), fetch="one")
    return jsonify(clean(row)), 200


@app.route("/api/opportunities/<int:oid>", methods=["DELETE"])
def delete(oid):
    _, _, count = run("DELETE FROM opportunities WHERE id=%s", (oid,), commit=True)
    if count == 0:
        return jsonify({"error": f"Opportunity {oid} not found"}), 404
    return jsonify({"message": f"Opportunity {oid} deleted"}), 200


@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Route not found"}), 404


@app.errorhandler(405)
def not_allowed(_):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(Exception)
def server_error(e):
    app.logger.exception(e)
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
