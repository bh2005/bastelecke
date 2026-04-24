#!/usr/bin/env python3
#
# RaceControl Pro – Lichtschranken-Client für Raspberry Pi (MAX7219 Display)
#
# Wie racecontrol_client.py, aber mit MAX7219-LED-Matrix statt TM1637.
# Benötigt luma.led_matrix (SPI) statt tm1637 (I2C).
#
# Abhängigkeiten:
#   pip install websocket-client RPi.GPIO luma.led_matrix Pillow
#
# SPI aktivieren:
#   sudo raspi-config → Interface Options → SPI → Enable
#
# Verkabelung MAX7219 (Standard-SPI-Port 0, CE0):
#   VCC → 3.3V oder 5V   GND → GND
#   CLK → GPIO 11 (SCLK) DIN → GPIO 10 (MOSI)  CS  → GPIO 8 (CE0)
#
# License: GNU General Public License v2
# Author : bh2005
#

import json
import time
import threading
import RPi.GPIO as GPIO
from luma.led_matrix.device import max7219
from luma.core.interface.serial import spi, noop
from luma.core.render import canvas
from PIL import ImageFont
import websocket

# ── Konfiguration ─────────────────────────────────────────────────────────────

BACKEND_HOST = "192.168.0.100"   # IP des RaceControl-Laptops — bitte anpassen
BACKEND_PORT = 8000
BACKEND_WS   = f"ws://{BACKEND_HOST}:{BACKEND_PORT}/ws/timing"

# GPIO-Pins (BCM-Nummerierung)
LS_START_PIN = 17    # Lichtschranke 1 – Start
LS_STOP_PIN  = 27    # Lichtschranke 2 – Stop
RESET_PIN    = 22    # Reset-Taster (Pullup, aktiv LOW)

# MAX7219: Anzahl kaskadierter Module (1 = einzelnes 8×8-Modul)
MAX7219_CASCADED      = 1
MAX7219_BLOCK_ORIENT  = 90    # 0 oder 90 je nach Modulausrichtung
MAX7219_BRIGHTNESS    = 4     # 0–15

# Mindestzeit in Sekunden — kürzere Läufe werden ignoriert
MIN_TIME = 5.0

# Heartbeat-Intervall in Sekunden
HEARTBEAT_INTERVAL = 5

# ── State ─────────────────────────────────────────────────────────────────────

start_time = 0.0
measuring  = False
_ws_lock   = threading.Lock()
_ws_conn   = None

# ── Display ───────────────────────────────────────────────────────────────────

_serial_iface = spi(port=0, device=0, gpio=noop())
_display      = max7219(
    _serial_iface,
    cascaded=MAX7219_CASCADED,
    block_orientation=MAX7219_BLOCK_ORIENT,
    rotate=0,
)
_display.contrast(MAX7219_BRIGHTNESS * 16)   # contrast nimmt 0–255


def _show(text: str):
    """Zeichnet text auf das MAX7219-Display (linke obere Ecke)."""
    with canvas(_display) as draw:
        draw.rectangle(_display.bounding_box, outline="black", fill="black")
        draw.text((0, 0), text, fill="white")


def _show_time(elapsed: float):
    """Zeigt MM:SS.hh (6 Zeichen) auf dem Display."""
    minutes    = int(elapsed // 60)
    seconds    = int(elapsed % 60)
    hundredths = int((elapsed * 100) % 100)
    if minutes > 0:
        _show(f"{minutes:02}{seconds:02}{hundredths:02}")
    else:
        _show(f"  {seconds:02}{hundredths:02}")


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
    _show("Conn")
    time.sleep(0.8)
    _show("----")


def _ws_on_message(ws, message):
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
        _show("----")
        print("[LS] Start!")


def _on_stop(channel):
    global start_time, measuring
    if not measuring:
        return

    elapsed   = time.time() - start_time
    measuring = False

    if elapsed < MIN_TIME:
        print(f"[LS] Messung verworfen ({elapsed:.2f} s < {MIN_TIME} s Mindestzeit)")
        _show("Err ")
        time.sleep(1)
        _show("----")
        return

    _show_time(elapsed)
    print(f"[LS] Stop! Zeit: {elapsed:.3f} s")

    _send({
        "type":     "timing_result",
        "raw_time": round(elapsed, 3),
        "device":   "gpio-lichtschranke-max7219",
    })


def _on_reset(channel):
    global measuring
    measuring = False
    _show("----")
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

_show("----")

print(f"[RC] Lichtschranken-Client gestartet (MAX7219)")
print(f"[RC] Backend: {BACKEND_WS}")
print(f"[RC] Start-Pin: GPIO{LS_START_PIN}  Stop-Pin: GPIO{LS_STOP_PIN}  Reset: GPIO{RESET_PIN}")
print(f"[RC] Display: MAX7219 SPI0/CE0, cascaded={MAX7219_CASCADED}")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n[RC] Beende …")
    _show("    ")
    GPIO.cleanup()
