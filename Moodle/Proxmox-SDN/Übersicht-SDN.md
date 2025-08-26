### Schulungsangebot: Übungskurs zu SDN mit Proxmox VE

**Kursname:** Software-Defined Networking (SDN) mit Proxmox – Virtuelle Netzwerke für die Cloud-Infrastruktur

**Kursbeschreibung:**
Dieser praxisorientierte Übungskurs vermittelt Ihnen das nötige Wissen, um das Software-Defined Networking (SDN) von Proxmox VE effektiv einzusetzen. Von den theoretischen Grundlagen bis zur praktischen Umsetzung komplexer Netzwerkkonfigurationen lernen Sie, wie Sie Ihre virtuelle Umgebung sicherer, flexibler und einfacher verwalten. Der Kurs legt den Fokus auf praktische Übungen, um das Gelernte direkt anzuwenden.

**Zielgruppe:**
* Systemadministratoren, die virtuelle Infrastrukturen mit Proxmox VE betreiben.
* IT-Experten, die sich mit den Konzepten der Netzwerkvirtualisierung vertraut machen wollen.
* Mitarbeiter in Rechenzentren und Cloud-Umgebungen.
* Teilnehmer, die von klassischen Netzwerk-Topologien zu einem softwarebasierten Ansatz wechseln möchten.

**Voraussetzungen:**
* Solide Grundkenntnisse in Proxmox VE.
* Grundlegendes Verständnis von TCP/IP, Routing und VLANs.
* Kenntnisse im Umgang mit der Linux-Befehlszeile.

**Kursziele:**
Nach Abschluss des Kurses sind Sie in der Lage:
* Die Prinzipien und Vorteile von SDN zu verstehen und zu erklären.
* Die SDN-Funktionalität in Proxmox VE zu aktivieren und zu konfigurieren.
* Virtuelle Netzwerke (VNets) und Zonen (Zones) zu erstellen und zu verwalten.
* Automatisches IP-Management (IPAM) für VNets einzurichten.
* Inter-VNet-Routing und Firewall-Regeln auf SDN-Ebene zu konfigurieren.
* Häufige Probleme bei der SDN-Einrichtung zu diagnostizieren und zu beheben.

---

### Kursstruktur (Vorschlag für 2 volle Tage)

#### **Tag 1: Grundlagen und einfache SDN-Implementierung**

**Modul 1: Einführung in SDN und Proxmox VE**
* Was ist SDN und warum ist es in virtualisierten Umgebungen wichtig?
* Überblick über die Proxmox VE-Netzwerkinfrastruktur: Linux Bridge vs. Open vSwitch.
* Vorteile des Proxmox-SDN-Frameworks.

**Modul 2: Lab-Setup und Vorbereitung**
* Einrichtung einer Übungsumgebung mit Proxmox (z. B. auf einem Einzel-Host mit verschachtelter Virtualisierung).
* Aktivierung der SDN-Funktionalität in Proxmox.

**Modul 3: Konfiguration der grundlegenden SDN-Komponenten**
* **Theorie & Praxis:**
    * Erstellen von **Zones** (einfachere VLAN-basierten Zonen).
    * Erstellen der ersten **VNets** (virtuelle Netzwerke).
    * Zuordnung von VMs zu den VNets.
    * Praktische Übungen: Kommunikation innerhalb eines VNets und Isolierung.

**Modul 4: Automatisches IP-Management (IPAM)**
* **Theorie & Praxis:**
    * Einführung in die Proxmox-IPAM-Funktion.
    * Konfiguration von IP-Pools und deren Zuweisung zu VNets.
    * Automatische Zuweisung von IP-Adressen an die VMs.

#### **Tag 2: Fortgeschrittene SDN-Konfiguration und Troubleshooting**

**Modul 5: Inter-VNet-Routing**
* **Theorie & Praxis:**
    * Grundlagen des Routings in Proxmox-SDN.
    * Konfiguration von Gateways und Routing-Regeln, um die Kommunikation zwischen verschiedenen VNets zu ermöglichen.
    * Praktische Übungen: Aufbau eines Multi-Tier-Netzwerks (z. B. Web-Tier, App-Tier, DB-Tier).

**Modul 6: SDN-Firewall und Sicherheitsregeln**
* **Theorie & Praxis:**
    * Einführung in die SDN-Firewall.
    * Erstellung von Sicherheitsregeln (Allow/Deny) auf VNet-Ebene.
    * Praktische Übungen: Absicherung der einzelnen Tiers im Multi-Tier-Netzwerk.

**Modul 7: SDN Troubleshooting**
* Häufige Fehlkonfigurationen und Probleme.
* Diagnose-Tools und Protokollanalyse.
* Best Practices für eine stabile SDN-Infrastruktur.

**Modul 8: Ausblick**
* Integration von externen Routern und BGP (Optional).
* Zusammenfassung und Q&A.

**Benötigte Lab-Umgebung (pro Teilnehmer oder pro Gruppe):**
* Ein PC oder Server mit Proxmox VE 7.x oder 8.x.
* Mindestens 16 GB RAM (32 GB empfohlen).
* Mindestens 4 CPU-Kerne.
* Ausreichend Speicherplatz (SSD empfohlen).
* Aktivierte Hardware-Virtualisierung (VT-x / AMD-V) für die verschachtelte Virtualisierung der Übungs-VMs.