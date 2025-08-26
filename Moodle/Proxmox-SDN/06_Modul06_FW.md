### Schulungsunterlagen & Übungen: Modul 6

## SDN-Firewall und Sicherheitsregeln

Willkommen zu Modul 6. Jetzt, da Sie Ihre virtuellen Netzwerke erfolgreich aufgebaut und das Routing zwischen ihnen konfiguriert haben, ist es entscheidend, diese Infrastruktur zu sichern. Dieses Modul widmet sich der Proxmox SDN-Firewall und wie Sie damit flexible Sicherheitsregeln auf Netzwerkebene definieren können, um den Datenverkehr zu steuern und unerwünschte Zugriffe zu blockieren.

---

### Theoretische Grundlagen

#### Firewall-Ebenen in Proxmox

Proxmox VE bietet verschiedene Ebenen, auf denen Sie Firewall-Regeln anwenden können:

1.  **Datacenter-Ebene:** Globale Regeln, die für alle Nodes und VMs gelten.
2.  **Node-Ebene:** Regeln, die für alle VMs auf einem bestimmten physischen Host gelten.
3.  **VM-Ebene:** Regeln, die nur für eine spezifische virtuelle Maschine gelten.
4.  **SDN-Ebene:** Regeln, die auf der Ebene der virtuellen Netzwerke (VNets) angewendet werden. **Dies ist der Fokus dieses Moduls.**

Die **SDN-Firewall** ist die logischste und mächtigste Ebene für die Kontrolle des Datenverkehrs zwischen Ihren virtuellen Netzwerken. Sie ermöglicht es Ihnen, Sicherheitsrichtlinien zentral für ganze VNets zu definieren, anstatt Firewall-Regeln einzeln auf jeder VM zu konfigurieren. Dies vereinfacht die Verwaltung erheblich, insbesondere in großen Umgebungen.

#### Funktionsweise der SDN-Firewall

Die SDN-Firewall nutzt die Informationen über die VNets und deren IP-Pools, um den Datenverkehr an den virtuellen Gateways zu filtern. Sie können Regeln definieren, um:
* Den Zugriff zwischen verschiedenen VNets zu steuern (z. B. `frontend-vnet` darf auf das `backend-vnet` zugreifen, aber nicht umgekehrt).
* Bestimmte Dienste zu erlauben oder zu blockieren (z. B. nur Port 80 und 443 vom Frontend zum Backend).
* Den Internetzugriff für bestimmte VNets zu beschränken.

---

### Praktische Übungen

**Ziel:** Sichern Sie die in Modul 5 erstellte Multi-Tier-Umgebung, indem Sie Firewall-Regeln hinzufügen, die nur den notwendigen Datenverkehr erlauben.

#### Übung 1: Erstellen einer VNet-Firewall-Regel

1.  **Navigieren:** Gehen Sie in der Proxmox-GUI zu `Datacenter` -> `SDN` -> **VNets**.
2.  **VNet-Firewall aktivieren:** Wählen Sie Ihr `backend-vnet` aus und gehen Sie zum Tab **Firewall**. Wenn die Firewall noch nicht aktiv ist, klicken Sie auf **Aktivieren**.
3.  **Standard-Regel hinzufügen:** Klicken Sie auf **Hinzufügen** und wählen Sie die Option `IPv4`.
    * **Action:** Wählen Sie `DENY`.
    * **Direction:** Wählen Sie `IN` (Eingehender Traffic).
    * **Kommentar:** `Standardregel: Alles verbieten`
    
    Diese Regel bewirkt, dass jeglicher eingehender Traffic auf dem `backend-vnet` standardmäßig blockiert wird.

#### Übung 2: Erlauben des benötigten Verkehrs

Jetzt, da alles blockiert ist, erlauben wir gezielt den benötigten Traffic. Wir gehen davon aus, dass Ihre Frontend-VM auf einen Webserver (Port 80) im Backend zugreifen muss.

1.  **Regel hinzufügen:** Im selben Firewall-Tab des `backend-vnet` klicken Sie erneut auf **Hinzufügen**.
2.  **Konfigurieren:**
    * **Action:** `ACCEPT`.
    * **Direction:** `IN`.
    * **Source:** Geben Sie das CIDR-Subnetz Ihres Frontend-VNets ein (`10.30.1.0/24`). Dies ist der entscheidende Schritt, um den Zugriff nur aus diesem spezifischen Netzwerk zu erlauben.
    * **Destination:** Lassen Sie dieses Feld leer (gilt für alle Ziele im Backend-VNet).
    * **Protocol:** `TCP`.
    * **Destination Port:** `80` (für HTTP).
    * **Kommentar:** `Erlaube HTTP von Frontend`

#### Übung 3: Testen der Firewall-Regeln

1.  **Validierung:** Führen Sie von Ihrer VM im `frontend-vnet` einen Test `ping` auf eine VM im `backend-vnet` durch. Der Ping-Befehl sollte jetzt **fehlschlagen**, da er nicht von den explizit erlaubten Regeln abgedeckt wird.
2.  **Dienst-Test:** Führen Sie von der Frontend-VM einen `telnet` oder `curl`-Befehl auf den Webserver im Backend durch (z. B. `curl 10.20.1.10`). Dieser Befehl sollte **erfolgreich** sein, da Sie Port 80 explizit freigegeben haben.

#### Fragen zur Selbstreflexion:

* Was ist der Vorteil der Firewall auf SDN-Ebene gegenüber der Firewall auf VM-Ebene?
* Warum ist die Reihenfolge der Regeln wichtig? Was würde passieren, wenn die `DENY`-Regel nach der `ACCEPT`-Regel platziert würde?
* Wie würden Sie eine Regel erstellen, um SSH-Zugriff (Port 22) nur von Ihrem Heimnetzwerk (`82.165.13.0/24`) zu erlauben?

Nach Abschluss dieses Moduls sind Sie in der Lage, mehrschichtige, isolierte Anwendungsarchitekturen innerhalb von Proxmox VE zu entwerfen und umzusetzen.

**[Modul 5: Inter-VNet-Routing](05_Modul05_VNet.md)**   oder **[zurück zur Übersicht](00_Übersicht_SDN.md)**