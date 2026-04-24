#!/usr/bin/env python3
#
# RaceControl Pro – Lichtschranken-Client für Raspberry Pi
#
# Verbindet sich per WebSocket mit dem RaceControl-Backend und sendet
# Zeitmessungen automatisch ein. Das TM1637-Display zeigt die Zeit weiterhin
# lokal an — der Raspi funktioniert auch ohne Backend-Verbindung.
#
# Abhängigkeiten:
#   pip install websocket-client RPi.GPIO
#   pip install git+https://github.com/depklyon/raspberrypi-tm1637 (oder eigene tm1637.py)
#
# License: GNU General Public License v2
# Author : bh2005
#

import json
import time
import threading
import RPi.GPIO as GPIO
from tm1637 import TM1637
import websocket

# ── Konfiguration ─────────────────────────────────────────────────────────────

# IP-Adresse des Laptops, auf dem RaceControl läuft
BACKEND_HOST = "192.168.0.100"
BACKEND_PORT = 8000
BACKEND_WS   = f"ws://{BACKEND_HOST}:{BACKEND_PORT}/ws/timing"

# GPIO-Pins (BCM-Nummerierung)
LS_START_PIN = 17   # Lichtschranke 1 – Start
LS_STOP_PIN  = 27   # Lichtschranke 2 – Stop
RESET_PIN    = 22   # Reset-Taster (Pullup, aktiv LOW)

# TM1637-Display (CLK, DIO)
CLK = 21
DIO = 20

# Mindestzeit in Sekunden — kürzere Läufe werden ignoriert
MIN_TIME = 5.0

# Heartbeat-Intervall in Sekunden
HEARTBEAT_INTERVAL = 5

# ── State ─────────────────────────────────────────────────────────────────────

start_time  = 0.0
measuring   = False
_ws_lock    = threading.Lock()
_ws_conn    = None   # aktive websocket.WebSocketApp Verbindung

# ── Display ───────────────────────────────────────────────────────────────────

display = TM1637(CLK, DIO)
display.brightness(2)
display.show("----")


def _show_time(elapsed: float):
    """Zeigt MM:SS.hh auf dem TM1637 an."""
    minutes    = int(elapsed // 60)
    seconds    = int(elapsed % 60)
    hundredths = int((elapsed * 100) % 100)
    if minutes > 0:
        display.show(f"{minutes:02}{seconds:02}")
    else:
        display.show(f"{seconds:02}{hundredths:02}")


# ── WebSocket-Kommunikation ───────────────────────────────────────────────────

def _send(payload: dict):
    """Sendet JSON an das Backend; schweigt wenn nicht verbunden."""
    with _ws_lock:
        conn = _ws_conn
    if conn is not None:
        try:
            conn.send(json.dumps(payload))
        except Exception:
            pass


def _ws_on_open(ws):
    global _ws_conn
    with _ws_lock:
        _ws_conn = ws
    print(f"[WS] Verbunden mit {BACKEND_WS}")
    display.show("CONN")
    time.sleep(0.8)
    display.show("----")


def _ws_on_message(ws, message):
    """Nachrichten vom Backend (z.B. Startnummer-Anzeige – zukünftig erweiterbar)."""
    try:
        data = json.loads(message)
        print(f"[WS] ← {data}")
    except Exception:
        pass


def _ws_on_error(ws, error):
    print(f"[WS] Fehler: {error}")


def _ws_on_close(ws, close_status_code, close_msg):
    global _ws_conn
    with _ws_lock:
        _ws_conn = None
    print("[WS] Getrennt – reconnect in 3 s …")


def _ws_thread():
    """Hält die WebSocket-Verbindung dauerhaft aufrecht."""
    while True:
        try:
            ws = websocket.WebSocketApp(
                BACKEND_WS,
                on_open=_ws_on_open,
                on_message=_ws_on_message,
                on_error=_ws_on_error,
                on_close=_ws_on_close,
            )
            ws.run_forever(ping_interval=10, ping_timeout=5)
        except Exception as e:
            print(f"[WS] run_forever Fehler: {e}")
        time.sleep(3)


def _heartbeat_thread():
    """Sendet alle HEARTBEAT_INTERVAL Sekunden einen Herzschlag ans Backend."""
    while True:
        time.sleep(HEARTBEAT_INTERVAL)
        _send({"type": "timing_device_heartbeat"})


# ── GPIO-Callbacks ────────────────────────────────────────────────────────────

def _on_start(channel):
    global start_time, measuring
    if not measuring:
        start_time = time.time()
        measuring  = True
        display.show("----")
        print("[LS] Start!")


def _on_stop(channel):
    global start_time, measuring
    if not measuring:
        return

    elapsed  = time.time() - start_time
    measuring = False

    if elapsed < MIN_TIME:
        print(f"[LS] Messung verworfen ({elapsed:.2f} s < {MIN_TIME} s Mindestzeit)")
        display.show("Err ")
        time.sleep(1)
        display.show("----")
        return

    _show_time(elapsed)
    print(f"[LS] Stop! Zeit: {elapsed:.3f} s")

    _send({
        "type":     "timing_result",
        "raw_time": round(elapsed, 3),
        "device":   "gpio-lichtschranke",
    })


def _on_reset(channel):
    global measuring
    measuring = False
    display.show("----")
    print("[LS] Reset")


# ── GPIO-Setup ────────────────────────────────────────────────────────────────

GPIO.setmode(GPIO.BCM)
GPIO.setup(LS_START_PIN, GPIO.IN)
GPIO.setup(LS_STOP_PIN,  GPIO.IN)
GPIO.setup(RESET_PIN,    GPIO.IN, pull_up_down=GPIO.PUD_UP)

GPIO.add_event_detect(LS_START_PIN, GPIO.RISING,  callback=_on_start, bouncetime=50)
GPIO.add_event_detect(LS_STOP_PIN,  GPIO.RISING,  callback=_on_stop,  bouncetime=50)
GPIO.add_event_detect(RESET_PIN,    GPIO.FALLING, callback=_on_reset, bouncetime=200)

# ── Start ─────────────────────────────────────────────────────────────────────

threading.Thread(target=_ws_thread,        daemon=True, name="ws").start()
threading.Thread(target=_heartbeat_thread, daemon=True, name="heartbeat").start()

print(f"[RC] Lichtschranken-Client gestartet")
print(f"[RC] Backend: {BACKEND_WS}")
print(f"[RC] Start-Pin: GPIO{LS_START_PIN}  Stop-Pin: GPIO{LS_STOP_PIN}  Reset: GPIO{RESET_PIN}")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n[RC] Beende …")
    GPIO.cleanup()
