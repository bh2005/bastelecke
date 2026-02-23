# Golf 2 – PF-Motor richtig einstellen
## 1,8l Digifant-Einspritzung / 107 PS

> **Hinweis:** Alle Einstellungen grundsätzlich am **warmen Motor** vornehmen (Betriebstemperatur ~80–90 °C), sofern nicht anders angegeben. Fahrzeug auf ebenem Untergrund, Klimaanlage und große Verbraucher ausschalten.

---

## Benötigtes Werkzeug & Material

- Drehzahlmesser (oder VAG-Diagnosegerät / KTS)
- Zündlichtpistole (Stroboskop)
- Multimeter
- CO-Messgerät (AU-taugliche Abgasanlage)
- Torx- und Schlitzschraubenzieher
- 19er Schlüssel (Kurbelwellenschraube für Zündzeitpunkt)
- Fühlerlehre (Ventilspiel)
- Unterdruckpumpe (zum Testen von Unterdruckdosen)

---

## Das Digifant-System kurz erklärt

Das **Digifant-Steuergerät** übernimmt beim PF-Motor gemeinsam zwei Aufgaben:
- **Zündung** (ersetzt den klassischen Unterbrecherkontakt)
- **Einspritzung** (Einspritzventile, Einspritzzeit)

Wichtige Sensoren, auf die das System angewiesen ist:

| Sensor | Funktion |
|---|---|
| Luftmengenmesser (LMM) | Misst die angesaugte Luftmenge |
| Kühlwassertemperaturgeber (KWG) | Gemisch- und Zündkorrektur nach Temperatur |
| Drosselklappenpotentiometer | Erkennt Lastzustand und Leerlauf |
| Lambdasonde | Gemischregelung im geschlossenen Regelkreis |
| Drehzahlgeber / Hallgeber | Erkennt Drehzahl und Kurbelwellenstellung |

Fällt einer dieser Sensoren aus oder liefert falsche Werte, entstehen typische Symptome wie **hohe Leerlaufdrehzahl, Ruckeln oder schlechtes Warmstarten**.

---

## Schritt 1 – Sichtprüfung & Vorarbeit

1. **Unterdruckschläuche prüfen:** Risse oder abgefallene Schläuche führen zu Falschluft → hohe Leerlaufdrehzahl, Ruckeln. Alle Schläuche am Ansaugtrakt, am LMM und am Verteiler sorgfältig prüfen.
2. **Luftfilter prüfen:** Verschmutzter Luftfilter verfälscht die LMM-Messung → erneuern.
3. **Zündkerzen prüfen:** Elektrodenabstand **0,8 mm**, bei Verschleiß oder Verrußung erneuern. Empfehlung: Bosch Super Plus oder NGK BPR6ES.
4. **Zündkabel, Verteilerkappe und Verteilerläufer prüfen:** Korrosion, Risse und Übergangswiderstand prüfen (Multimeter: Kabelwiderstand max. ~1 kΩ/m).
5. **Kraftstofffilter:** Bei unbekanntem Wechselintervall erneuern.
6. **Motoröl prüfen:** Riecht das Öl nach Benzin? → Hinweis auf defektes Einspritzventil (bleibt offen / tropft nach).

---

## Schritt 2 – Ventilspiel prüfen (kalt, Motor mind. 4h abgestellt)

| Ventile | Sollwert |
|---------|----------|
| Einlass | **0,20 mm** |
| Auslass | **0,30 mm** |

**Vorgehensweise:**
1. Ventildeckel abbauen.
2. Kolben Zylinder 1 auf OT Zündung stellen (Nockenwellenmarken oben / Kerben zeigen zueinander).
3. Fühlerlehre muss leicht klemmend durchgehen.
4. Bei Abweichung: Kontermutter lösen, Einstellschraube drehen, Kontermutter festziehen, nachmessen.
5. Alle 4 Zylinder prüfen (Reihenfolge: 1-3-4-2).

---

## Schritt 3 – Zündzeitpunkt einstellen

> **Sollwert PF-Motor:** **6° v. OT** bei 800–850 U/min (Leerlauf), **Unterdruckschlauch am Verteiler abgezogen und verschlossen**.

**Vorgehensweise:**
1. Motor auf Betriebstemperatur bringen.
2. Drehzahlmesser anschließen (z. B. an Klemme 1 des Zündverteilers).
3. Unterdruckschlauch am Verteiler abziehen und Ende verschließen.
4. Stroboskop an Zündkabel Zylinder 1 anschließen.
5. Stroboskop auf die **Markierungsscheibe an der Kurbelwelle (vorne am Motor)** richten – die Markierung muss bei **6° v. OT** auf der Skala stehen.
6. Bei Abweichung: Verteilerklemme lockern, Verteiler langsam drehen bis Markierung stimmt, dann festziehen.
   - **Im Uhrzeigersinn** drehen → Zündung **früher**
   - **Gegen Uhrzeigersinn** → Zündung **später**
7. Unterdruckschlauch wieder aufstecken und Drehzahl kontrollieren (sollte leicht steigen).

---

## Schritt 4 – Leerlauf & CO-Wert einstellen

Beim Digifant-System gibt es **keine klassische Vergaser-Gemisch-Einstellschraube**. Der CO-Wert wird über eine **Einstellschraube am Luftmengenmesser (LMM)** beeinflusst.

### 4a – Leerlaufdrehzahl

Die Leerlaufdrehzahl wird über die **Bypassluftschraube** am Drosselklappengehäuse eingestellt.

1. Motor warm laufen lassen.
2. Bypassluftschraube am Drosselklappengehäuse aufsuchen (kleine Schlitzschraube mit O-Ring).
3. **Hereindrehen** → Drehzahl sinkt / **Herausdrehen** → Drehzahl steigt.
4. **Solldrehzahl: 800–850 U/min** (Leerlauf, warm, ohne Verbraucher).

### 4b – CO-Wert / Gemisch (LMM-Einstellschraube)

> ⚠️ Diese Einstellung sollte idealerweise mit einem **CO-Messgerät** vorgenommen werden.

1. Am Luftmengenmesser befindet sich eine **kleine Einstellschraube** (oft mit Gummistopfen gesichert – diesen entfernen).
2. **Eindrehen** → Gemisch magert ab (CO sinkt) / **Ausdrehen** → Gemisch fettet an (CO steigt).
3. **Soll-CO-Wert: 0,5–1,5 %** bei Leerlauf (Lambda ≈ 1,0).
4. Nach Einstellung Gummistopfen wieder einsetzen.

---

## Schritt 5 – Sensoren prüfen (bei anhaltenden Problemen)

### Kühlwassertemperaturgeber (KWG)
Ein defekter KWG meldet dem Steuergerät permanent „Motor kalt" → dauerhaft fettes Gemisch, hohe Leerlaufdrehzahl.

**Prüfung mit Multimeter:**
- Kalt (~20 °C): ca. **2,2–2,5 kΩ**
- Warm (~80 °C): ca. **270–300 Ω**
- Kein Wert oder Unterbrechung → KWG tauschen.

### Luftmengenmesser (LMM)
Ein verschmutzter oder defekter LMM liefert falsche Luftmengenwerte → Ruckeln, falsches Gemisch.

**Reinigung:** Mit LMM-Reiniger (Kontaktreiniger für Hitzdraht-LMM) vorsichtig reinigen – **niemals den Messdraht berühren**.

**Prüfung:** Ausgangsspannung bei Leerlauf ca. **1,0–1,2 V**, bei Vollgas steigend auf ~4,5 V.

### Drosselklappenpotentiometer
Erkennt das Steuergerät den Leerlauf nicht korrekt, wird die Leerlaufregelung nicht aktiviert → unruhiger Lauf.

**Prüfung:** Im Leerlauf ca. **0,4–0,6 V** Ausgangsspannung. Bei ruckartigen Sprüngen im Spannungsverlauf beim langsamen Öffnen → Potentiometer tauschen.

### Lambdasonde
Eine alte oder vergiftete Lambdasonde regelt das Gemisch nicht mehr sauber → Ruckeln, erhöhter Verbrauch.

**Prüfung:** Spannung muss im geregelten Betrieb zwischen **0,1 V und 0,9 V pendeln**. Bleibt sie konstant → Sonde defekt.

**Empfehlung:** Lambdasonde alle 60.000 km erneuern.

---

## Schritt 6 – Schlechtes Warmstarten beheben

### 6a – Kraftstoff-Haltedruck (häufigste Ursache)

Nach dem Abstellen muss das Kraftstoffsystem unter Druck stehen bleiben. Fällt der Druck ab, müssen die Einspritzventile beim nächsten Start erst wieder „satt" werden → langes Orgeln.

**Ursachen für Druckverlust:**
- **Kraftstoffdruckregler defekt** → hält Systemdruck nicht → tauschen.
- **Einspritzventil tropft nach** → Zylinder wird überflutet → Benzingeruch, schwarzer Rauch beim Start → Einspritzventile prüfen/tauschen.
- **Rückschlagventil in der Kraftstoffpumpe defekt** → Pumpe tauschen.

**Einfacher Test:** Nach dem Abstellen Zündung 3× kurz an/aus (ohne zu starten) → Pumpe baut Druck auf → dann starten. Springt er so problemlos an → Druckverlust bestätigt.

### 6b – Kühlwassertemperaturgeber (KWG) defekt

Meldet der KWG beim Warmstart fälschlicherweise „Motor kalt", wird zu viel Kraftstoff eingespritzt → Motor säuft ab.

→ KWG prüfen wie in Schritt 5 beschrieben.

### 6c – Hitzestau / Dampfblasen

Nach dem Abstellen steigt die Temperatur im Motorraum kurzzeitig weiter. Liegt die Kraftstoffleitung nah am Krümmer, kann Kraftstoff im System verdampfen.

**Abhilfe:** Kraftstoffleitung mit Hitzeschutzband ummanteln, ggf. neu verlegen.

### 6d – Startverhalten verbessern (Tipps)

| Situation | Empfohlenes Vorgehen |
|---|---|
| Motor warm, springt schlecht an | Gaspedal **nicht** betätigen, einfach starten lassen |
| Motor scheint abgesoffen | Gaspedal **ganz durchdrücken** (Digifant reduziert Einspritzmenge bei Vollast) und starten |
| Langes Orgeln vor dem Anspringen | Zündung 2–3× kurz an/aus, dann starten (Kraftstoffdruck aufbauen) |

---

## Häufige Fehlerquellen beim PF / Digifant

| Problem | Wahrscheinliche Ursache | Maßnahme |
|---|---|---|
| Hohe Leerlaufdrehzahl | Falschluft (Unterdruckschlauch) | Schläuche prüfen/tauschen |
| Hohe Leerlaufdrehzahl | Bypassluftschraube verstellt | Schritt 4a |
| Hohe Leerlaufdrehzahl | KWG defekt (meldet „kalt") | Schritt 5 – KWG tauschen |
| Ruckeln | Zündkerzen / Kabel verschlissen | Zündung erneuern |
| Ruckeln | Zündzeitpunkt falsch | Schritt 3 |
| Ruckeln | LMM verschmutzt / defekt | Reinigen oder tauschen |
| Ruckeln | Lambdasonde alt | Sonde tauschen |
| Schlechtes Warmstarten | Druckverlust im Kraftstoffsystem | Schritt 6a |
| Schlechtes Warmstarten | Einspritzventil tropft nach | Einspritzventile prüfen |
| Schlechtes Warmstarten | KWG defekt | Schritt 5 – KWG tauschen |
| Schwarzer Rauch, fettes Gemisch | LMM oder KWG defekt | Schritt 5 |

---

## Sollwerte PF-Motor auf einen Blick

| Parameter | Sollwert |
|---|---|
| Leerlaufdrehzahl | 800–850 U/min |
| Zündzeitpunkt | 6° v. OT (Unterdruckschlauch ab) |
| Ventilspiel Einlass (kalt) | 0,20 mm |
| Ventilspiel Auslass (kalt) | 0,30 mm |
| Zündkerzenabstand | 0,8 mm |
| CO-Wert Leerlauf | 0,5–1,5 % |
| Kraftstoffdruck | ca. 2,5 bar (Leerlauf) |

---

*Anleitung gilt für VW Golf 2 mit 1,8l PF-Motor, Digifant-Einspritzung, 107 PS (ca. 1987–1991). Bei Unsicherheiten empfiehlt sich das original VW-Reparaturhandbuch sowie eine Diagnose mit VAG-COM / VCDS oder einem KTS-Gerät in einer Kfz-Werkstatt.*