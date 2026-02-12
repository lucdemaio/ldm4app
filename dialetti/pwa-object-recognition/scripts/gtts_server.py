#!/usr/bin/env python3
"""
Small Flask server using gTTS (Google Translate TTS) to synthesize MP3.
Usage:
  python scripts/gtts_server.py --host 127.0.0.1 --port 5520
Endpoints:
  GET /health -> {status: 'ok'}
  POST /speak -> form-data { input: text, format: 'mp3' }
Returns binary audio/mp3
Note: gTTS relies on Google Translate web endpoints and requires network.
"""
import argparse
import tempfile
import os
from flask import Flask, request, send_file, jsonify, render_template_string
from flask_cors import CORS

try:
    from gtts import gTTS
except Exception:
    gTTS = None

app = Flask(__name__)
# Allow cross-origin requests (useful when calling from http://localhost:8000)
CORS(app)

# Simple index page to test the server via browser
INDEX_HTML = '''<!doctype html>
<html>
  <head><meta charset="utf-8"><title>gTTS Local Server</title></head>
  <body>
    <h3>gTTS Local Server</h3>
    <p>Endpoints:</p>
    <ul>
      <li><a href="/health">/health</a></li>
      <li><a href="/speak">/speak (POST)</a></li>
    </ul>
    <form id="sform" method="post" action="/speak" enctype="multipart/form-data">
      <label>Testo: <input name="input" value="Ciao dal server locale" style="width:320px"/></label>
      <label>Formato: <select name="format"><option value="mp3">mp3</option><option value="wav">wav</option></select></label>
      <button type="submit">Sintetizza</button>
    </form>
    <p style="font-size:12px;color:#666">Note: usa l'API /speak con POST form-data (input, format)</p>
  </body>
</html>
'''

@app.route('/', methods=['GET'])
def index():
    return render_template_string(INDEX_HTML)

@app.route('/health', methods=['GET'])
def health():
    return jsonify(status='ok', engine='gTTS')

@app.route('/speak', methods=['POST'])
def speak():
    if gTTS is None:
        return jsonify(error='gTTS not installed; run pip install gTTS flask'), 500
    text = request.form.get('input') or request.form.get('text')
    if not text:
        return jsonify(error='no input provided'), 400
    try:
        tts = gTTS(text, lang='it')
        fd, out = tempfile.mkstemp(suffix='.mp3')
        os.close(fd)
        tts.write_to_fp(open(out, 'wb'))
        return send_file(out, mimetype='audio/mpeg')
    except Exception as e:
        return jsonify(error=str(e)), 500
    finally:
        try:
            os.remove(out)
        except Exception:
            pass

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=5520)
    args = parser.parse_args()
    print('Starting gTTS server on %s:%d' % (args.host, args.port))
    app.run(host=args.host, port=args.port)
