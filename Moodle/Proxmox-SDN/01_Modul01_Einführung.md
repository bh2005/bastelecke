### Schulungsunterlagen & Übungen: Modul 1

## Einführung in SDN und Proxmox VE

Willkommen zu Modul 1 unseres Kurses. In diesem Modul legen wir das theoretische Fundament für das Verständnis von Software-Defined Networking (SDN) und dessen Integration in Proxmox VE. Anschließend führen wir erste praktische Übungen durch, um die grundlegenden Netzwerk-Konzepte in Proxmox zu vertiefen.

---

### Theoretische Unterlagen

#### Was ist Software-Defined Networking (SDN)?

SDN ist ein Ansatz zur Verwaltung von Netzwerken, der die traditionelle Kopplung von Netzwerk-Hardware und -Steuerung aufhebt. Im traditionellen Netzwerk sind Steuerungsebene (**"Control Plane"**) und Datenebene (**"Data Plane"**) fest miteinander verbunden – jeder Switch und Router verwaltet seine eigenen Regeln.

Bei SDN werden diese beiden Ebenen getrennt:
* Die **Datenebene** besteht aus den physischen und virtuellen Netzwerkgeräten (Switches), die einfach Pakete weiterleiten.
* Die **Steuerungsebene** ist zentralisiert und wird von einem Controller verwaltet, der die "Intelligenz" des Netzwerks enthält. Dieser Controller gibt den Netzwerkgeräten die Regeln vor.



**Hauptvorteile von SDN:**
1.  **Zentralisierung:** Das gesamte Netzwerk wird von einem zentralen Punkt aus verwaltet.
2.  **Automatisierung:** Regeln können dynamisch und automatisiert angewendet werden, ohne jedes Gerät einzeln zu konfigurieren.
3.  **Flexibilität:** Netzwerkkonfigurationen lassen sich schnell an die Bedürfnisse der virtuellen Maschinen anpassen.

#### Proxmox VE-Netzwerk-Grundlagen

Proxmox VE unterstützt standardmäßig zwei grundlegende Netzwerk-Modelle:

* **Linux Bridge (`vmbrX`):** Dies ist die einfachste und am häufigsten verwendete Methode. Eine Linux Bridge funktioniert wie ein virtueller Switch, an den virtuelle Maschinen angeschlossen werden können. Sie leitet den Traffic zwischen den VMs und den physischen Netzwerkkarten weiter. Sie ist ideal für einfache Netzwerke ohne fortgeschrittene Anforderungen.

* **Open vSwitch (`ovsbrX`):** Open vSwitch (OVS) ist ein Open-Source-Software-Switch, der deutlich mehr Funktionen bietet als eine Standard-Linux-Bridge. OVS unterstützt erweiterte Protokolle wie **VLAN-Tagging**, Trunking und Link-Aggregation (LACP), was es zur Grundlage für das Proxmox SDN-Framework macht.

Proxmox SDN ist eine Erweiterung, die auf der Flexibilität von Open vSwitch aufbaut.

---

### Übungsaufgaben

Diese Übungen sollen Ihnen ein Gefühl für die Proxmox-Netzwerkkonfiguration geben und Sie auf das nächste Modul vorbereiten.

**Übungsaufgabe 1: Erstellung einer Linux Bridge**

1.  Melden Sie sich im Proxmox-Webinterface an.
2.  Navigieren Sie zu Ihrem Node und klicken Sie auf **System** > **Netzwerk**.
3.  Klicken Sie auf **Erstellen** und wählen Sie **Linux Bridge**.
4.  Geben Sie der Bridge einen Namen (z. B. `vmbr5`), fügen Sie einen **Kommentar** hinzu (`Übung Linux Bridge`) und lassen Sie das Feld **Ports/Bridge Ports** leer.
5.  Klicken Sie auf **Erstellen**. Führen Sie die Konfigurationsänderungen über den **"Apply Configuration"**-Button aus.
6.  Erstellen Sie eine neue VM (oder verwenden Sie eine bestehende) und weisen Sie ihr die neu erstellte Bridge (`vmbr5`) als Netzwerkgerät zu.
7.  Starten Sie die VM und bestätigen Sie die Konnektivität.

**Übungsaufgabe 2: Vorbereitung für SDN mit Open vSwitch**

1.  Navigieren Sie wieder zu **System** > **Netzwerk**.
2.  Klicken Sie auf **Erstellen** und wählen Sie **Open vSwitch Bridge**.
3.  Geben Sie der Bridge einen Namen (z. B. `ovsbr0`), fügen Sie einen Kommentar hinzu (`Grundlage für SDN`) und ordnen Sie einen physischen Port zu, an den das Netzwerk angeschlossen ist (z. B. `enp3s0`).
4.  Klicken Sie auf **Erstellen** und bestätigen Sie die Konfiguration.
5.  Erstellen Sie eine weitere VM und verbinden Sie diese mit der neuen OVS Bridge (`ovsbr0`).

**Fragen zur Selbstkontrolle:**
* Was ist der Hauptunterschied in der Konfiguration der beiden Bridges im Proxmox-Interface?
* Welche Rolle wird die OVS Bridge im späteren SDN-Setup spielen?
* Wie können Sie die Änderungen über die Befehlszeile überprüfen (`nano /etc/network/interfaces`)?

Im nächsten Modul gehen wir einen Schritt weiter und verwenden die vorbereitete OVS Bridge, um die SDN-Funktionen zu aktivieren und unsere erste VNet-Struktur zu erstellen.

**[Modul 2: Lab-Setup und Vorbereitung](02_Modul02_Setup.md)**   oder **[zurück zur Übersicht](00_Übersicht_SDN.md)**