### Schulungsunterlagen & Übungen: Modul 3

## Konfiguration der grundlegenden SDN-Komponenten

Willkommen zu Modul 3. In diesem Modul gehen wir von der Theorie zur Praxis über. Wir werden die Hauptkomponenten des Proxmox SDN-Frameworks kennenlernen – **Zones** und **VNets** – und diese nutzen, um eine einfache, isolierte Netzwerkinfrastruktur aufzubauen.

---

### Theoretische Grundlagen

#### SDN-Kernkonzepte in Proxmox

Die SDN-Funktionalität in Proxmox VE basiert auf zwei entscheidenden Abstraktionsebenen, die es Ihnen ermöglichen, Ihr Netzwerk logisch zu strukturieren:

* **SDN Zones:** Eine Zone ist eine Gruppe von VNets, die eine gemeinsame physische Infrastruktur teilen. Die Zone definiert das zugrunde liegende Netzwerkprotokoll (z. B. VLAN) und ist der Ort, an dem die Kommunikation zwischen den virtuellen Netzwerken gesteuert wird. Jede Zone wird einer physischen oder virtuellen Bridge zugeordnet.
    * **VLAN-Zone:** Die gebräuchlichste Zone. Sie nutzt VLANs, um den Datenverkehr von VNets zu isolieren. Jedes VNet in der Zone erhält eine eindeutige VLAN-ID.
    * **Any-Zone:** Eine spezielle Zone für eine einfachere Konfiguration, die keine VLANs verwendet und alle VNets in ihr als Subnetze auf derselben physischen Bridge behandelt.

* **SDN VNets (Virtuelle Netzwerke):** Ein VNet ist ein logisches Netzwerk, das innerhalb einer Zone existiert. Ein VNet ist ein isolierter Layer-3-Bereich (ein IP-Subnetz), der IP-Adressen für VMs bereitstellt und die Grundlage für Routing- und Firewall-Regeln bildet. VMs können nur innerhalb desselben VNets direkt miteinander kommunizieren.

---

### Praktische Übungen

**Ziel:** Erstellen Sie eine VLAN-basierte Zone und ein VNet, um eine isolierte, private Netzwerkinfrastruktur für Ihre VMs zu schaffen.

#### Übung 1: Erstellen einer SDN VLAN-Zone

1.  **Navigieren:** Gehen Sie in der Proxmox-GUI zu `Datacenter` -> `SDN` -> `Zones`.
2.  **Erstellen:** Klicken Sie auf **Hinzufügen** und wählen Sie **VLAN**.
3.  **Konfigurieren:**
    * **ID:** `private-zone`
    * **Controller:** Wählen Sie den in Modul 2 erstellten Controller (`Main-SDN-Controller`).
    * **Bridge:** Wählen Sie die OVS Bridge (`ovsbr0`), die als SDN-Grundlage dient.
    * **VLAN aware:** Lassen Sie diese Option deaktiviert. **Wichtig:** Da die OVS Bridge bereits VLAN-fähig ist, benötigen Sie hier keine separate Konfiguration.

#### Übung 2: Erstellen eines SDN VNets

1.  **Navigieren:** Wechseln Sie im SDN-Tab zu **VNets**.
2.  **Erstellen:** Klicken Sie auf **Hinzufügen**.
3.  **Konfigurieren:**
    * **ID:** `backend-vnet`
    * **Zone:** Wählen Sie die soeben erstellte Zone (`private-zone`).
    * **VLAN Tag:** Geben Sie eine eindeutige VLAN-ID ein, z.B. `20`.
    * **IPv4 CIDR:** `10.20.1.0/24`
    * **IPv4 Gateway:** `10.20.1.1` (Dies wird das Gateway für alle VMs in diesem VNet).

#### Übung 3: Verbindung einer VM mit dem neuen VNet

1.  **VM-Konfiguration:** Wählen Sie eine Ihrer Test-VMs aus und navigieren Sie zu ihren `Hardware`-Einstellungen.
2.  **Netzwerk-Gerät:** Ändern Sie das zugewiesene Netzwerkgerät. Wählen Sie unter **Bridge** das neu erstellte VNet (`backend-vnet`) aus.
3.  **Starten & Testen:**
    * Starten Sie die VM. Sie sollte automatisch eine IP-Adresse aus dem VNet-Subnetz erhalten.
    * Führen Sie auf der VM einen `ping` auf das VNet-Gateway (`10.20.1.1`) durch, um die Konnektivität zu testen.
    * Führen Sie einen `ping` auf eine IP-Adresse außerhalb des VNets durch. **Wichtig:** Dieser `ping` sollte fehlschlagen, da das Inter-VNet-Routing noch nicht konfiguriert ist.

#### Fragen zur Selbstreflexion:

* Was ist der Zweck des `VLAN Tag` auf VNet-Ebene? Wie hilft es bei der Isolation?
* Was ist das `IPv4 Gateway` in diesem Kontext? Was passiert, wenn es nicht konfiguriert wird?
* Wie unterscheidet sich die manuelle IP-Konfiguration von VMs in Übung 1 von der automatischen Adresszuweisung in dieser Übung?

Nach erfolgreicher Durchführung dieser Übungen haben Sie die grundlegenden Bausteine von SDN in Proxmox eingerichtet und eine VM an ein isoliertes virtuelles Netzwerk angebunden. Im nächsten Modul werden wir uns mit dem automatischen IP-Management (IPAM) beschäftigen.

**[Modul 4: Automatisches IP-Management (IPAM)](04_Modul04_IPAM.md)**   oder **[zurück zur Übersicht](00_Übersicht_SDN.md)**