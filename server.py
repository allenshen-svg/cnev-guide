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
    db.execute('''CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_id INTEGER NOT NULL,
        sender TEXT NOT NULL DEFAULT 'admin',
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        read_at TEXT DEFAULT NULL,
        FOREIGN KEY (registration_id) REFERENCES registrations(id)
    )''')
    db.execute('CREATE INDEX IF NOT EXISTS idx_msg_reg ON messages(registration_id)')
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
    allowed_ext = ('.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.csv', '.xml', '.txt')
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

# ── API: admin send message ───────────────────────────────
@app.route('/api/admin/messages', methods=['POST'])
def send_message():
    if not check_admin():
        return jsonify(ok=False, error='Unauthorized'), 401
    d = request.get_json(silent=True)
    if not d:
        return jsonify(ok=False, error='Invalid JSON'), 400
    reg_id = d.get('registration_id')
    content = (d.get('content') or '').strip()
    if not reg_id or not content:
        return jsonify(ok=False, error='registration_id and content required'), 400
    if len(content) > 5000:
        return jsonify(ok=False, error='Message too long'), 400
    db = get_db()
    reg = db.execute('SELECT id FROM registrations WHERE id=?', (reg_id,)).fetchone()
    if not reg:
        db.close()
        return jsonify(ok=False, error='Registration not found'), 404
    db.execute(
        'INSERT INTO messages (registration_id, sender, content, created_at) VALUES (?,?,?,?)',
        (reg_id, 'admin', content, datetime.utcnow().isoformat() + 'Z')
    )
    db.commit()
    db.close()
    return jsonify(ok=True, message='Message sent')

# ── API: admin get messages for a registration ────────────
@app.route('/api/admin/messages/<int:reg_id>')
def admin_get_messages(reg_id):
    if not check_admin():
        return jsonify(ok=False, error='Unauthorized'), 401
    db = get_db()
    rows = db.execute('SELECT * FROM messages WHERE registration_id=? ORDER BY id ASC', (reg_id,)).fetchall()
    db.close()
    return jsonify(ok=True, data=[dict(r) for r in rows])

# ── API: user check messages by email ─────────────────────
@app.route('/api/message-token')
def get_message_token():
    email = (request.args.get('email') or '').strip().lower()
    if not email or '@' not in email:
        return jsonify(ok=False, error='Valid email required'), 400
    db = get_db()
    regs = db.execute('SELECT id, name FROM registrations WHERE LOWER(email)=?', (email,)).fetchall()
    db.close()
    if not regs:
        return jsonify(ok=False, error='No registrations found'), 404
    token = hmac.new(ADMIN_SECRET.encode(), email.encode(), hashlib.sha256).hexdigest()[:16]
    return jsonify(ok=True, token=token, registrations=[dict(r) for r in regs])

@app.route('/api/messages')
def user_messages():
    email = (request.args.get('email') or '').strip().lower()
    token = (request.args.get('token') or '').strip()
    if not email or not token:
        return jsonify(ok=False, error='Email and token required'), 400
    # Token = HMAC of email (prevents enumeration)
    expected = hmac.new(ADMIN_SECRET.encode(), email.encode(), hashlib.sha256).hexdigest()[:16]
    if not hmac.compare_digest(token, expected):
        return jsonify(ok=False, error='Invalid token'), 403
    db = get_db()
    regs = db.execute('SELECT id, name FROM registrations WHERE LOWER(email)=?', (email,)).fetchall()
    if not regs:
        db.close()
        return jsonify(ok=True, data=[])
    reg_ids = [r['id'] for r in regs]
    placeholders = ','.join('?' * len(reg_ids))
    msgs = db.execute(
        f'SELECT m.*, r.name as reg_name FROM messages m JOIN registrations r ON m.registration_id=r.id WHERE m.registration_id IN ({placeholders}) ORDER BY m.id ASC',
        reg_ids
    ).fetchall()
    # Mark admin messages as read
    unread_ids = [dict(m)['id'] for m in msgs if dict(m)['sender'] == 'admin' and not dict(m)['read_at']]
    if unread_ids:
        ph = ','.join('?' * len(unread_ids))
        db.execute(f'UPDATE messages SET read_at=? WHERE id IN ({ph})', [datetime.utcnow().isoformat() + 'Z'] + unread_ids)
        db.commit()
    db.close()
    return jsonify(ok=True, data=[dict(m) for m in msgs])

# ── API: user send reply ──────────────────────────────────
@app.route('/api/messages', methods=['POST'])
def user_reply():
    d = request.get_json(silent=True)
    if not d:
        return jsonify(ok=False, error='Invalid JSON'), 400
    email = (d.get('email') or '').strip().lower()
    token = (d.get('token') or '').strip()
    content = (d.get('content') or '').strip()
    reg_id = d.get('registration_id')
    if not email or not token or not content or not reg_id:
        return jsonify(ok=False, error='Missing required fields'), 400
    if len(content) > 5000:
        return jsonify(ok=False, error='Message too long'), 400
    expected = hmac.new(ADMIN_SECRET.encode(), email.encode(), hashlib.sha256).hexdigest()[:16]
    if not hmac.compare_digest(token, expected):
        return jsonify(ok=False, error='Invalid token'), 403
    db = get_db()
    reg = db.execute('SELECT id FROM registrations WHERE id=? AND LOWER(email)=?', (reg_id, email)).fetchone()
    if not reg:
        db.close()
        return jsonify(ok=False, error='Registration not found'), 404
    db.execute(
        'INSERT INTO messages (registration_id, sender, content, created_at) VALUES (?,?,?,?)',
        (reg_id, 'user', content, datetime.utcnow().isoformat() + 'Z')
    )
    db.commit()
    db.close()
    return jsonify(ok=True, message='Reply sent')

# ── API: admin unread count ───────────────────────────────
@app.route('/api/admin/unread')
def admin_unread():
    if not check_admin():
        return jsonify(ok=False, error='Unauthorized'), 401
    db = get_db()
    rows = db.execute(
        "SELECT m.registration_id, r.name, r.email, COUNT(*) as count FROM messages m JOIN registrations r ON m.registration_id=r.id WHERE m.sender='user' AND m.read_at IS NULL GROUP BY m.registration_id"
    ).fetchall()
    db.close()
    return jsonify(ok=True, data=[dict(r) for r in rows])

# ── API: admin mark messages read ─────────────────────────
@app.route('/api/admin/messages/<int:reg_id>/read', methods=['POST'])
def admin_mark_read(reg_id):
    if not check_admin():
        return jsonify(ok=False, error='Unauthorized'), 401
    db = get_db()
    db.execute("UPDATE messages SET read_at=? WHERE registration_id=? AND sender='user' AND read_at IS NULL",
               (datetime.utcnow().isoformat() + 'Z', reg_id))
    db.commit()
    db.close()
    return jsonify(ok=True)

# ── SEO: sitemap & robots ─────────────────────────────────
@app.route('/robots.txt')
def robots():
    txt = "User-agent: *\nAllow: /\nSitemap: https://cnevguide.com/sitemap.xml\n"
    return txt, 200, {'Content-Type': 'text/plain'}

@app.route('/sitemap.xml')
def sitemap():
    import json as _json
    data_path = os.path.join(BASE, 'data', 'ev_data.json')
    with open(data_path) as f:
        data = _json.load(f)
    base_url = 'https://cnevguide.com'
    pages = [
        ('/', '1.0', 'daily'),
        ('/#/brands', '0.9', 'weekly'),
        ('/#/cars', '0.9', 'weekly'),
        ('/#/compare', '0.7', 'monthly'),
        ('/#/events', '0.6', 'weekly'),
        ('/#/news', '0.6', 'daily'),
        ('/#/test-drive', '0.8', 'monthly'),
    ]
    for b in data.get('brands', []):
        pages.append((f'/#/brand/{b["id"]}', '0.8', 'weekly'))
    for c in data.get('cars', []):
        pages.append((f'/#/car/{c["id"]}', '0.7', 'weekly'))

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for path, prio, freq in pages:
        xml += f'  <url><loc>{base_url}{path}</loc><priority>{prio}</priority><changefreq>{freq}</changefreq></url>\n'
    xml += '</urlset>\n'
    return xml, 200, {'Content-Type': 'application/xml'}

# ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8090'))
    print(f'ChinaEV server on http://localhost:{port}')
    app.run(host='0.0.0.0', port=port, debug=False)
