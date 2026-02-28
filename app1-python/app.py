from flask import Flask, Response
from datetime import datetime
from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST

app = Flask(__name__)

# Métricas
REQUEST_COUNT = Counter('app1_requests_total', 'Total requests para App1 Python')

@app.route("/")
def home():
    REQUEST_COUNT.inc()
    return "Aplicação 1 - Python"

@app.route("/time")
def get_time():
    REQUEST_COUNT.inc()
    # O cache será gerenciado pela camada de infra (Nginx)
    now = datetime.now().isoformat()
    return f"Horário atual (App1): {now}"

@app.route("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)