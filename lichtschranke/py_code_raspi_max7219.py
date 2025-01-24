#!/usr/bin/env python3

import RPi.GPIO as GPIO
import time
from luma.led_matrix.device import max7219
from luma.core.interface.serial import spi, noop
from luma.core.render import canvas
from PIL import ImageFont

# GPIO-Pins für die Lichtschranken und den Reset-Taster
lichtschranke1_pin = 17
lichtschranke2_pin = 27
reset_pin = 22

# GPIO-Modus festlegen
GPIO.setmode(GPIO.BCM)
GPIO.setup(lichtschranke1_pin, GPIO.IN)
GPIO.setup(lichtschranke2_pin, GPIO.IN)
GPIO.setup(reset_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# MAX7219-Setup
serial = spi(port=0, device=0, gpio=noop())
device = max7219(serial, cascaded=1, block_orientation=90, rotate=0)
device.contrast(1)

start_time = 0
measuring = False

def start_measurement(channel):
    global start_time, measuring
    if not measuring:
        start_time = time.time()
        measuring = True
        print("Messung gestartet!")

def stop_measurement(channel):
    global start_time, measuring
    if measuring:
        end_time = time.time()
        elapsed_time = end_time - start_time
        if elapsed_time >= 10:  # Mindestzeit von 10 Sekunden
            minutes = int(elapsed_time // 60)
            seconds = int(elapsed_time % 60)
            hundredths = int((elapsed_time * 100) % 100)
            time_str = f"{minutes:02}{seconds:02}{hundredths:02}"
            show_time(time_str)
            log_time(minutes, seconds, hundredths)
            print(f"Messung beendet! Zeit: {minutes:02}:{seconds:02}:{hundredths:02}")
        else:
            print("Messung zu kurz, mindestens 10 Sekunden erforderlich.")
        measuring = False

def reset_display(channel):
    show_time("000000")
    print("Anzeige zurückgesetzt")

def show_time(time_str):
    with canvas(device) as draw:
        draw.text((0, 0), time_str, fill="white")

def log_time(minutes, seconds, hundredths):
    with open("zeitmessung_log.txt", "a") as log_file:
        log_file.write(f"{minutes:02}:{seconds:02}:{hundredths:02}\n")

# Event-Detektion für die Lichtschranken und den Reset-Taster
GPIO.add_event_detect(lichtschranke1_pin, GPIO.RISING, callback=start_measurement)
GPIO.add_event_detect(lichtschranke2_pin, GPIO.RISING, callback=stop_measurement)
GPIO.add_event_detect(lichtschranke1_pin, GPIO.RISING, callback=stop_measurement)
GPIO.add_event_detect(reset_pin, GPIO.FALLING, callback=reset_display, bouncetime=200)

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    GPIO.cleanup()
