#!/usr/bin/env python3
"""
Minimal Coqui TTS Flask server for local synthesis.

Usage:
  python scripts/coqui_server.py --model tts_models/it/mai/vits --host 0.0.0.0 --port 5510

Endpoints:
  GET  /health         -> 200 OK
  POST /speak          -> form-data { input: text, format: (wav|mp3), speaker: optional }

Produces binary audio in requested format.

Note: This is intended for local development; for production secure the endpoint.
"""
import argparse
import os
import tempfile
from flask import Flask, request, send_file, jsonify

try:
    from TTS.api import TTS
except Exception as e:
    TTS = None

app = Flask(__name__)

tts = None
MODEL_NAME = None

@app.route('/health', methods=['GET'])
def health():
    return jsonify(status='ok', model=MODEL_NAME if MODEL_NAME else None)

@app.route('/voices', methods=['GET'])
def voices():
    try:
        info = {'model': MODEL_NAME}
        # Try common attributes for available speakers
        try:
            if hasattr(tts, 'speakers') and tts.speakers:
                info['voices'] = tts.speakers
            elif hasattr(tts, 'get_speakers'):
                info['voices'] = tts.get_speakers()
            elif hasattr(tts, 'speaker_manager') and hasattr(tts.speaker_manager, 'speakers'):
                info['voices'] = tts.speaker_manager.speakers
        except Exception:
            # ignore internal introspection errors
            pass
        return jsonify(info)
    except Exception as e:
        return jsonify(error=str(e)), 500
@app.route('/speak', methods=['POST'])
def speak():
    if TTS is None:
        return jsonify(error='TTS package not installed. Run pip install "TTS[all]"'), 500
    text = request.form.get('input') or request.form.get('text')
    if not text:
        return jsonify(error='no input provided'), 400
    fmt = (request.form.get('format') or 'wav').lower()
    if fmt not in ('wav','mp3'):
        fmt = 'wav'

    speaker = request.form.get('speaker') or None
    # output temp file
    fd, out = tempfile.mkstemp(suffix='.'+fmt)
    os.close(fd)
    try:
        # Use TTS API to synthesize to file. The TTS implementation chooses the backend.
        if speaker:
            tts.tts_to_file(text=text, speaker=speaker, file_path=out)
        else:
            tts.tts_to_file(text=text, file_path=out)
        # Return file
        return send_file(out, mimetype='audio/' + ('mpeg' if fmt=='mp3' else 'wav'))
    except Exception as e:
        return jsonify(error=str(e)), 500
    finally:
        try:
            os.remove(out)
        except Exception:
            pass

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', default='tts_models/it/mai/vits', help='Coqui TTS model name to use')
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=5510)
    args = parser.parse_args()

    if TTS is None:
        print('TTS package not available. Please install with: pip install "TTS[all]"')
        raise SystemExit(1)

    MODEL_NAME = args.model
    print('Loading TTS model:', MODEL_NAME)
    tts = TTS(MODEL_NAME)
    print('Model loaded. Starting server on %s:%d' % (args.host, args.port))
    app.run(host=args.host, port=args.port)
