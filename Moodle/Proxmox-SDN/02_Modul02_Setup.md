### Schulungsunterlagen & Übungen: Modul 2

## Lab-Setup und Vorbereitung

Willkommen zu Modul 2. Bevor wir uns in die Konfiguration der SDN-Komponenten stürzen, stellen wir sicher, dass Ihre Lab-Umgebung korrekt vorbereitet ist. Eine solide Basis ist entscheidend für den reibungslosen Ablauf der folgenden Übungen.

### Theoretische Grundlagen

#### Warum ist eine saubere Lab-Umgebung wichtig?

SDN-Konfigurationen greifen tief in die Netzwerkinfrastruktur ein. Fehler bei der Vorbereitung können zu Verbindungsproblemen führen, die es erschweren, zwischen Konfigurationsfehlern und grundlegenden Netzwerkproblemen zu unterscheiden. Eine gut vorbereitete Umgebung ermöglicht es Ihnen, sich voll und ganz auf das SDN-Thema zu konzentrieren.

**Checkliste für die Lab-Vorbereitung:**

  * **Proxmox VE-Version:** Stellen Sie sicher, dass Sie eine aktuelle Version von Proxmox VE (mindestens Version 7.2) verwenden, da die SDN-Funktionen erst seitdem voll integriert sind.

  * **Netzwerk-Redundanz:** Planen Sie, wie Sie Ihren Proxmox-Host mit dem Netzwerk verbinden. Eine dedizierte Netzwerkkarte für das SDN-Lab ist ideal, um die Management-Verbindung des Hosts nicht zu gefährden.

  * **Open vSwitch (OVS):** Wie in Modul 1 besprochen, ist OVS das Herzstück von Proxmox SDN. Es muss auf dem Host installiert sein, bevor die SDN-Konfiguration beginnen kann.

### Praktische Übungen

**Ziel:** In dieser Übung bereiten wir eine saubere Arbeitsumgebung vor und führen die notwendigen Schritte aus, um das SDN-Framework zu initialisieren.

#### Übung 1: Validierung des Lab-Setups

1.  **System-Update:** Führen Sie ein vollständiges System-Update auf Ihrem Proxmox-Node durch, um sicherzustellen, dass alle Pakete aktuell sind.

    ```
    apt update && apt dist-upgrade -y

    ```

2.  **OVS-Installation überprüfen:** Verifizieren Sie, dass das `openvswitch-switch` Paket installiert ist.

    ```
    dpkg -s openvswitch-switch

    ```

    Falls das Paket nicht installiert ist, installieren Sie es wie in Modul 1 beschrieben.

3.  **Netzwerkkonfiguration bereinigen:**

      * Navigieren Sie in der Proxmox-GUI zu `System` -\> `Netzwerk`.

      * Stellen Sie sicher, dass Ihre **Management-IP** auf einer **Linux Bridge (`vmbr0`)** konfiguriert ist, die an eine physische Netzwerkschnittstelle gebunden ist (z.B. `ens18`). Die Bridge sollte für diese Übungen keine anderen IP-Adressen oder Gateways haben, um spätere Konflikte zu vermeiden.

#### Übung 2: Aktivierung des SDN-Frameworks

1.  **Netzwerk-Controller konfigurieren:**

      * Wählen Sie in der Proxmox-GUI den Haupt-Datacenter-Eintrag aus.

      * Navigieren Sie zum Tab **SDN** -\> **Controller**.

      * Klicken Sie auf **Hinzufügen** und wählen Sie **"Proxmox"**.

      * Geben Sie einen Namen für den Controller ein (z.B. `Main-SDN-Controller`) und wählen Sie das zuvor in Modul 1 angelegte OVS Bridge (`ovsbr0`) als den **Bridge-Port**.

2.  **SDN-Controller aktivieren:**

      * Nachdem der Controller erstellt wurde, klicken Sie auf den neu angelegten Controller in der Liste.

      * Wählen Sie **Aktivieren**. Der Controller wird nun initialisiert und ist bereit, SDN-Konfigurationen zu verwalten.

3.  **SDN-Interface-Konfiguration:**

      * Navigieren Sie zum Tab **SDN** -\> **Interfaces**.

      * Klicken Sie auf **Hinzufügen** und wählen Sie **"VNet"**.

      * Geben Sie dem VNet einen Namen (z.B. `public-vnet`) und weisen Sie es dem zuvor erstellten SDN-Controller zu.

      * **WICHTIG:** Lassen Sie alle weiteren Optionen (wie `VLAN Tag`, `IPv4` usw.) leer. Dies wird in den nächsten Modulen konfiguriert.

#### Fragen zur Selbstreflexion:

  * Was ist der Hauptunterschied zwischen der Konfiguration im Tab **"Netzwerk"** und den SDN-Tabs (`Controller`, `Interfaces`)?

  * Welche Aufgabe hat der SDN-Controller im Proxmox-SDN-Framework?

  * Warum haben wir das VNet in Übung 2 ohne weitere Konfigurationen erstellt?

Mit der erfolgreichen Aktivierung des SDN-Controllers und der Vorbereitung der ersten VNet-Schnittstelle sind Sie nun bereit, in Modul 3 die ersten Zonen und Netzwerke zu definieren.

**[Modul 3: Konfiguration der grundlegenden SDN-Komponenten](03_Modul03_Konfiguration.md)**   oder **[zurück zur Übersicht](00_Übersicht_SDN)**