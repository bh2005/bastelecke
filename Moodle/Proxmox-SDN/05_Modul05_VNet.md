### Schulungsunterlagen & Übungen: Modul 5

## Inter-VNet-Routing

Willkommen zu Modul 5. In den vorherigen Modulen haben Sie gelernt, wie Sie isolierte virtuelle Netzwerke (VNets) erstellen. Nun ist es an der Zeit, die Kommunikation zwischen diesen isolierten Netzwerken zu ermöglichen. In diesem Modul beschäftigen wir uns mit dem Routing auf SDN-Ebene, um eine flexible und sichere Kommunikation zu gewährleisten.

---

### Theoretische Grundlagen

#### Was ist Inter-VNet-Routing?

Inter-VNet-Routing ist der Prozess, bei dem Datenpakete zwischen verschiedenen virtuellen Netzwerken (VNets) weitergeleitet werden. Im Gegensatz zu traditionellen Netzwerken, wo ein physischer Router oder Switch diese Aufgabe übernimmt, wird in einer SDN-Umgebung das Routing softwaredefiniert und vom zentralen Controller verwaltet.

Das Proxmox SDN-Framework verwendet die `IP-Pool`- und `VNet`-Einstellungen, um die Routing-Entscheidungen zu treffen. Jedes VNet, das über ein **IPv4-Gateway** verfügt, kann so konfiguriert werden, dass es Datenpakete an andere VNets im selben SDN-Controller sendet. Dies ermöglicht den Aufbau von Multi-Tier-Anwendungen, bei denen beispielsweise ein Frontend-VNet mit einem Backend-VNet kommunizieren muss, aber das Backend-VNet von außen isoliert bleibt.

**Routing in Proxmox SDN:**

* **Implizites Routing:** Das Proxmox SDN konfiguriert automatisch Routing-Regeln zwischen den VNets, die dem gleichen SDN-Controller zugeordnet sind. Sobald Sie ein **IPv4 Gateway** in einem VNet definieren, dient dieses als "Tür" für den ausgehenden und eingehenden Datenverkehr.
* **VNet-Routing-Tabellen:** Für komplexere Konfigurationen oder um das automatische Routing zu überschreiben, können Sie explizite Routing-Regeln erstellen. Dies wird im Kontext von Proxmox über die VNet-Konfiguration gesteuert, die festlegt, wohin der Traffic für bestimmte Subnetze geleitet werden soll.

---

### Praktische Übungen

**Ziel:** Erstellen Sie ein zweites, isoliertes VNet und konfigurieren Sie das Routing, um die Kommunikation zwischen beiden VNets zu ermöglichen.

#### Übung 1: Erstellen eines zweiten VNets

1.  **Navigieren:** Gehen Sie in der Proxmox-GUI zu `Datacenter` -> `SDN` -> **VNets**.
2.  **Erstellen:** Klicken Sie auf **Hinzufügen**.
3.  **Konfigurieren:**
    * **ID:** `frontend-vnet`
    * **Zone:** Wählen Sie die in Modul 3 erstellte Zone (`private-zone`).
    * **VLAN Tag:** Geben Sie eine neue, eindeutige VLAN-ID ein, z.B. `30`.
    * **IPv4 CIDR:** `10.30.1.0/24`
    * **IPv4 Gateway:** `10.30.1.1`

#### Übung 2: Verbindung einer VM mit dem neuen VNet

1.  **VM-Konfiguration:** Wählen Sie eine Ihrer Test-VMs aus und navigieren Sie zu ihren `Hardware`-Einstellungen.
2.  **Netzwerk-Gerät:** Ändern Sie das zugewiesene Netzwerkgerät. Wählen Sie unter **Bridge** das neu erstellte VNet (`frontend-vnet`) aus.
3.  **Starten & Testen:**
    * Starten Sie die VM. Sie sollte automatisch eine IP-Adresse aus dem VNet-Subnetz erhalten.
    * Führen Sie auf der VM einen `ping` auf das VNet-Gateway (`10.30.1.1`) durch, um die Konnektivität zu testen.
    * Führen Sie nun einen `ping` auf eine der VMs im `backend-vnet` durch (z.B. `10.20.1.10`). **Wichtig:** Dieser `ping` sollte jetzt erfolgreich sein, da das SDN-Framework automatisch das Routing zwischen den beiden VNets konfiguriert hat.

#### Übung 3: Zusätzliches Routing konfigurieren

1.  **Navigieren:** Gehen Sie zu `Datacenter` -> `SDN` -> **VNets**.
2.  **VNet bearbeiten:** Wählen Sie das `backend-vnet` aus und klicken Sie auf **Bearbeiten**.
3.  **Hinzufügen einer Route:** Im Abschnitt **IP-Routes** können Sie eine explizite Route hinzufügen.
    * **Destination:** `10.30.1.0/24` (das Subnetz des Frontend-VNets)
    * **Gateway:** `10.20.1.1` (das Gateway des Backend-VNets, das in diesem Kontext als nächster Hop fungiert)
    
    Obwohl Proxmox VE dies standardmäßig implizit macht, ist diese Übung wichtig, um zu verstehen, wie Sie explizite Routen festlegen können. Dies ist nützlich, wenn das automatische Routing nicht den gewünschten Zweck erfüllt oder Sie komplexere Topologien abbilden müssen.

#### Fragen zur Selbstreflexion:

* Welche Rolle spielt das **IPv4 Gateway** jedes VNets im Kontext des Inter-VNet-Routings?
* Warum ist der **ping** von der `frontend-vnet`-VM zur `backend-vnet`-VM erfolgreich, ohne dass Sie manuelle Routen auf den VMs hinzufügen mussten?
* Wie würden Sie eine Situation beschreiben, in der Sie eine explizite Route wie in Übung 3 hinzufügen müssten?

Nach Abschluss dieses Moduls sind Sie in der Lage, mehrschichtige, isolierte Anwendungsarchitekturen innerhalb von Proxmox VE zu entwerfen und umzusetzen.

**[Modul 6: SDN-Firewall und Sicherheitsregeln](06_Modul06_FW.md)**   oder **[zurück zur Übersicht](00_Übersicht_SDN.md)**