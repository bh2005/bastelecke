# Projektübersicht: Proxmox-SDN-Schulungsunterlagen

## Einführung
Dieses Repository (`bastelecke/Moodle/Proxmox-SDN/neu`) enthält Schulungsunterlagen für die Einrichtung und Verwaltung einer Software-Defined Networking (SDN)-Umgebung in Proxmox VE. Ziel des Projekts ist es, Administratoren und IT-Interessierte durch eine strukturierte Reihe von Modulen zu führen, die von grundlegenden SDN-Konzepten bis hin zu fortgeschrittenen Themen wie Monitoring und Optimierung reichen. Die Unterlagen sind speziell auf die Nutzung von Proxmox VE zugeschnitten und bieten praktische Übungen sowie theoretische Erklärungen, um eine skalierbare und sichere Netzwerkinfrastruktur zu erstellen.

## Projektziele
- **Vermittlung von SDN-Kenntnissen**: Bereitstellung einer umfassenden Schulung für die Konfiguration und Verwaltung von SDN in Proxmox VE.
- **Praktische Anwendung**: Schritt-für-Schritt-Anleitungen für die Einrichtung von VNets, Routing, Firewall, Load Balancing und Monitoring.
- **Skalierbarkeit und Flexibilität**: Unterstützung von kleinen bis großen Netzwerken durch die Nutzung von Tools wie FRRouting, HAProxy und Checkmk.
- **Open-Source-Fokus**: Verwendung kostenloser Tools wie die Checkmk Raw Edition, um die Zugänglichkeit für alle Nutzer zu gewährleisten.

## Projektstruktur
Das Repository ist in Module unterteilt, die jeweils einen spezifischen Aspekt der SDN-Konfiguration in Proxmox VE behandeln. Jedes Modul enthält theoretische Erklärungen, praktische Übungen, Fehlerbehebungstipps und Fragen zur Selbstreflexion.

### Module
1. **Einführung in SDN und Proxmox VE**: Überblick über SDN-Konzepte und die Rolle von Proxmox VE.
2. **Installation und Grundkonfiguration von SDN**: Einrichtung des `pve-sdn`-Dienstes und grundlegender Netzwerkkomponenten.
3. **Erstellen und Verwalten von VNets**: Konfiguration von VLAN-basierten VNets (z. B. `vnet-web`, `vnet-db`).
4. **IP-Pool-Management und DHCP**: Einrichtung von IP-Pools und automatische IP-Vergabe.
5. **Inter-VNet-Routing**: Ermöglichen der Kommunikation zwischen VNets.
6. **Firewall-Konfiguration**: Einrichten von Sicherheitsregeln für VNets.
7. **Erweiterte Firewall-Funktionen**: Feinabstimmung und Optimierung der Firewall-Regeln.
8. **Integration mit externen Routern**: Konfiguration statischer Routen für Internetzugriff.
9. **Dynamisches Routing mit BGP**: Einrichtung von BGP und EVPN für automatische Routenverteilung.
10. **Load Balancing in SDN**: Implementierung von HAProxy für die Verteilung von HTTP-Verkehr.
11. **Monitoring und Optimierung**: Überwachung der SDN-Umgebung mit Checkmk Raw Edition und Optimierung basierend auf Metriken.

## Zielgruppe
- **Systemadministratoren**: Mit Grundkenntnissen in Linux und Netzwerkadministration, die Proxmox VE für Virtualisierung nutzen.
- **IT-Studenten und -Enthusiasten**: Personen, die praktische Erfahrungen mit SDN sammeln möchten.
- **Unternehmen**: Teams, die skalierbare und sichere Netzwerkinfrastrukturen aufbauen wollen.

## Technische Anforderungen
- **Proxmox VE**: Version 8.x oder höher mit aktiviertem SDN-Stack.
- **Betriebssystem**: Ubuntu 22.04/24.04 für VMs und Monitoring-Tools.
- **Hardware**: Mindestens ein Proxmox-Knoten mit Unterstützung für VLAN-fähige Netzwerkschnittstellen.
- **Tools**:
  - FRRouting für BGP (Modul 9).
  - HAProxy für Load Balancing (Modul 10).
  - Checkmk Raw Edition für Monitoring (Modul 11).
- **Netzwerk**: Physischer Router/Switch mit VLAN-Unterstützung und BGP-Kompatibilität.

## Installation und Nutzung
1. **Repository klonen**:
   ```bash
   git clone https://github.com/bh2005/bastelecke.git
   cd bastelecke/Moodle/Proxmox-SDN/neu
   ```
2. **Module durcharbeiten**: Jedes Modul ist als eigenständiges Dokument (z. B. Markdown oder PDF) verfügbar und enthält Anleitungen, Shell-Befehle und Konfigurationsbeispiele.
3. **Umgebung einrichten**:
   - Installieren Sie Proxmox VE und aktivieren Sie den SDN-Stack (`pve-sdn`).
   - Richten Sie eine Testumgebung mit mindestens zwei VMs ein (z. B. in `vnet-web` und `vnet-db`).
   - Folgen Sie den Modulen, um VNets, Routing, Firewall, Load Balancing und Monitoring zu konfigurieren.
4. **Monitoring**: Verwenden Sie die Checkmk Raw Edition (siehe Modul 11), um die Leistung Ihrer SDN-Umgebung zu überwachen.

## Beiträge und Erweiterungen
- **Beiträge**: Pull Requests mit neuen Modulen, Korrekturen oder Ergänzungen sind willkommen. Bitte beachten Sie die Contributing-Guidelines im Repository.
- **Erweiterungsmöglichkeiten**:
  - Integration weiterer Monitoring-Tools (z. B. Prometheus/Grafana).
  - Anleitungen für Hochverfügbarkeit (HA) in Proxmox-Clustern.
  - Erweiterte Sicherheitsfunktionen wie Intrusion Detection Systems (IDS).

## Lizenz
Die Unterlagen sind unter der MIT-Lizenz veröffentlicht, sofern nicht anders angegeben. Details finden Sie in der `LICENSE`-Datei des Repositories.

## Kontakt
Für Fragen oder Feedback wenden Sie sich an den Repository-Maintainer:
- **GitHub**: [bh2005](https://github.com/bh2005)
- **Issues**: Eröffnen Sie ein Issue im Repository für Unterstützung oder Vorschläge.

## Ressourcen
- **Proxmox VE Dokumentation**: [pve.proxmox.com](https://pve.proxmox.com)
- **Checkmk Raw Edition**: [checkmk.com/download](https://checkmk.com/download)
- **FRRouting**: [frrouting.org](https://frrouting.org)
- **HAProxy**: [haproxy.org](https://www.haproxy.org)

## Nächste Schritte
Beginnen Sie mit Modul 1, um die Grundlagen von SDN in Proxmox VE zu erlernen, und arbeiten Sie sich durch die Module, um eine voll funktionsfähige SDN-Umgebung aufzubauen. Experimentieren Sie mit den praktischen Übungen, um Ihre Fähigkeiten zu vertiefen, und nutzen Sie Checkmk, um die Leistung Ihrer Umgebung zu überwachen und zu optimieren.