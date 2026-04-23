#!/usr/bin/env python3
"""
Server Web Semplice per visualizzare l'Albero Genealogico
Esegui questo script dalla cartella del progetto e accedi a http://localhost:8000
"""

import http.server
import socketserver
import os
from pathlib import Path

# Cambia nella directory dove si trova questo script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

print("=" * 60)
print("🌳 SERVER WEB - Albero Genealogico Famiglia De Maio")
print("=" * 60)
print(f"📂 Cartella: {os.getcwd()}")
print(f"🔗 Accedi a: http://localhost:{PORT}")
print("=" * 60)
print("Premi CTRL+C per fermare il server")
print("=" * 60)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"\n✅ Server avviato su http://localhost:{PORT}\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n⛔ Server fermato.")
