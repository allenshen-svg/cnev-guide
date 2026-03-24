"""ChinaEV backend — serves static site + test-drive registration API"""
import os, json, sqlite3, hashlib, hmac, time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS

BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE, 'data', 'registrations.db')
ADMIN_SECRET = os.environ.get('ADMIN_SECRET', 'chinaev_admin_2026')

app = Flask(__name__, static_folder=None)
CORS(app)

# ── Database ──────────────────────────────────────────────
def get_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    return db

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    db = get_db()
    db.execute('''CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        country TEXT NOT NULL,
        phone TEXT DEFAULT '',
        brands TEXT DEFAULT '',
        period TEXT DEFAULT '',
        duration TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'new',
        created_at TEXT NOT NULL,
        ip TEXT DEFAULT ''
    )''')
    db.execute('CREATE INDEX IF NOT EXISTS idx_reg_email ON registrations(email)')
    db.execute('CREATE INDEX IF NOT EXISTS idx_reg_status ON registrations(status)')
    db.commit()
    db.close()

init_db()

# ── Admin auth ────────────────────────────────────────────
def check_admin():
    key = request.headers.get('X-Admin-Key', '')
    expected = hmac.new(ADMIN_SECRET.encode(), b'chinaev', hashlib.sha256).hexdigest()[:32]
    return hmac.compare_digest(key, expected)

# ── Static files ──────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory(BASE, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    # Only serve known static file types
    allowed_ext = ('.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.csv')
    if not filename.lower().endswith(allowed_ext):
        abort(404)
    # Prevent path traversal
    safe = os.path.normpath(filename)
    if safe.startswith('..') or safe.startswith('/'):
        abort(404)
    full = os.path.join(BASE, safe)
    if not full.startswith(BASE) or not os.path.isfile(full):
        abort(404)
    directory = os.path.dirname(full)
    basename = os.path.basename(full)
    return send_from_directory(directory, basename)

# ── API: submit registration ──────────────────────────────
@app.route('/api/register', methods=['POST'])
def register():
    d = request.get_json(silent=True)
    if not d:
        return jsonify(ok=False, error='Invalid JSON'), 400

    name = (d.get('name') or '').strip()
    email = (d.get('email') or '').strip()
    country = (d.get('country') or '').strip()

    if not name or not email or not country:
        return jsonify(ok=False, error='Name, email, and country are required'), 400
    if len(email) > 200 or '@' not in email:
        return jsonify(ok=False, error='Invalid email'), 400

    # Rate limit: max 3 registrations per email
    db = get_db()
    count = db.execute('SELECT COUNT(*) FROM registrations WHERE email=?', (email,)).fetchone()[0]
    if count >= 3:
        db.close()
        return jsonify(ok=False, error='Maximum registrations reached for this email'), 429

    brands = ','.join(d.get('brands', [])) if isinstance(d.get('brands'), list) else ''
    db.execute(
        'INSERT INTO registrations (name, email, country, phone, brands, period, duration, notes, created_at, ip) VALUES (?,?,?,?,?,?,?,?,?,?)',
        (name, email, country,
         (d.get('phone') or '')[:30],
         brands[:500],
         (d.get('period') or '')[:50],
         (d.get('duration') or '')[:50],
         (d.get('notes') or '')[:1000],
         datetime.utcnow().isoformat() + 'Z',
         request.remote_addr or '')
    )
    db.commit()
    db.close()
    return jsonify(ok=True, message='Registration received')

# ── API: admin list registrations ─────────────────────────
@app.route('/api/admin/registrations')
def list_registrations():
    if not check_admin():
        return jsonify(ok=False, error='Unauthorized'), 401
    db = get_db()
    rows = db.execute('SELECT * FROM registrations ORDER BY id DESC').fetchall()
    db.close()
    return jsonify(ok=True, data=[dict(r) for r in rows])

# ── API: admin update status ──────────────────────────────
@app.route('/api/admin/registrations/<int:rid>', methods=['PATCH'])
def update_registration(rid):
    if not check_admin():
        return jsonify(ok=False, error='Unauthorized'), 401
    d = request.get_json(silent=True)
    status = (d.get('status') or '').strip() if d else ''
    if status not in ('new', 'contacted', 'confirmed', 'completed', 'cancelled'):
        return jsonify(ok=False, error='Invalid status'), 400
    db = get_db()
    db.execute('UPDATE registrations SET status=? WHERE id=?', (status, rid))
    db.commit()
    db.close()
    return jsonify(ok=True)

# ── Admin page ────────────────────────────────────────────
@app.route('/admin')
def admin_page():
    return send_from_directory(BASE, 'admin.html')

# ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8090'))
    print(f'ChinaEV server on http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=False)
