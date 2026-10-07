from http.server import BaseHTTPRequestHandler
from pathlib import Path
import json
import sys

# Add root directory to sys.path to import knowledge base from app.py
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

try:
    from app import recommend, get_struggles
except ImportError:
    # Fallback in case path resolution differs in serverless environment
    import app
    recommend = app.recommend
    get_struggles = app.get_struggles


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        url_path = self.path.split("?")[0]
        if url_path in ("/struggles", "/api/struggles"):
            self._handle_struggles()
        elif url_path in ("/recommend", "/api/recommend"):
            self._handle_recommend()
        else:
            self.send_error(404)

    def do_GET(self):
        # Health check
        self._send_json({"status": "ok", "app": "Study Buddy Expert System"})

    def _read_json(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length <= 0:
                raise ValueError
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError
            return data
        except Exception:
            return None

    def _send_json(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_struggles(self):
        data = self._read_json()
        if data is None:
            self.send_error(400, "Please send valid JSON")
            return
        subject = str(data.get("subject", "")).strip().lower()
        if not subject:
            self.send_error(400, "Choose a subject")
            return
        self._send_json({"struggles": get_struggles(subject)})

    def _handle_recommend(self):
        data = self._read_json()
        if data is None:
            self.send_error(400, "Please send valid JSON")
            return
        subject = str(data.get("subject", "")).strip().lower()
        struggle = str(data.get("struggle", "")).strip().lower()
        time_available = str(data.get("time", "medium")).strip().lower()
        if not subject or not struggle:
            self.send_error(400, "Choose a subject and study challenge")
            return
        self._send_json(recommend(subject, struggle, time_available))
