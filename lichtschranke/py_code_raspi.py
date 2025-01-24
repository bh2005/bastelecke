import RPi.GPIO as GPIO
import time
from tm1637 import TM1637

# GPIO-Pins für die Lichtschranken und den Reset-Taster
lichtschranke1_pin = 17
lichtschranke2_pin = 27
reset_pin = 22

# GPIO-Modus festlegen
GPIO.setmode(GPIO.BCM)
GPIO.setup(lichtschranke1_pin, GPIO.IN)
GPIO.setup(lichtschranke2_pin, GPIO.IN)
GPIO.setup(reset_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# TM1637-Pins (CLK und DIO)
CLK = 21
DIO = 20

# TM1637-Objekt erstellen
display = TM1637(CLK, DIO)
display.brightness(1)

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
            display.show(time_str)
            log_time(minutes, seconds, hundredths)
            print(f"Messung beendet! Zeit: {minutes}:{seconds}:{hundredths:02}")
        else:
            print("Messung zu kurz, mindestens 10 Sekunden erforderlich.")
        measuring = False

def reset_display(channel):
    display.show("000000")
    print("Anzeige zurückgesetzt")

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
