### Schulungsunterlagen & Übungen: Modul 4

## Automatisches IP-Management (IPAM)

Willkommen zu Modul 4. In diesem Abschnitt werden wir uns das integrierte IP-Management (IPAM) von Proxmox SDN genauer ansehen. Dies ist ein leistungsstarkes Feature, das die manuelle Konfiguration von IP-Adressen für VMs überflüssig macht und die Fehleranfälligkeit in Ihrem virtuellen Netzwerk erheblich reduziert.

-----

### Theoretische Grundlagen

#### Was ist IP-Management (IPAM)?

IPAM steht für IP Address Management. Es handelt sich um ein System, das die Vergabe, Verwaltung und Überwachung von IP-Adressen innerhalb eines Netzwerks automatisiert. In herkömmlichen Umgebungen müssen Administratoren IP-Adressen manuell vergeben und in Tabellen dokumentieren. Dieser Prozess ist zeitaufwändig und anfällig für Fehler wie doppelte IP-Adressen.

#### IPAM in Proxmox SDN

Proxmox VE integriert eine einfache, aber effektive IPAM-Funktion direkt in das SDN-Framework. Anstatt IP-Adressen manuell für jede VM festzulegen, definieren Sie sogenannte **IP-Pools**. Ein IP-Pool ist ein Bereich von IP-Adressen, aus denen das System automatisch Adressen an die VMs in einem bestimmten VNet vergeben kann.

Sobald ein IP-Pool einem VNet zugewiesen ist, können VMs im selben VNet eine IP-Adresse über DHCP anfordern. Das Proxmox SDN stellt dann einen internen DHCP-Server bereit, der die Anfrage verarbeitet und eine freie IP-Adresse aus dem zugewiesenen Pool zuweist.

**Vorteile der Verwendung von IPAM:**

  * **Zeitersparnis:** Keine manuelle Konfiguration von IP-Adressen mehr.
  * **Fehlerreduzierung:** Vermeidung von IP-Adresskonflikten.
  * **Automatisierung:** Neue VMs erhalten automatisch eine IP-Adresse, was die Bereitstellung beschleunigt.
  * **Übersichtlichkeit:** Eine zentrale Stelle zur Verwaltung der IP-Adressbereiche.

-----

### Praktische Übungen

**Ziel:** Erstellen Sie einen IP-Pool und weisen Sie ihn dem VNet zu, das in Modul 3 erstellt wurde. Überprüfen Sie anschließend, ob Ihre VM erfolgreich eine IP-Adresse aus diesem Pool erhalten hat.

#### Übung 1: Erstellen eines IP-Pools

1.  **Navigieren:** Gehen Sie in der Proxmox-GUI zu `Datacenter` -\> `SDN` -\> **IPAM**.
2.  **Erstellen:** Klicken Sie auf **Hinzufügen**.
3.  **Konfigurieren:**
      * **ID:** `backend-pool`
      * **VNet:** Wählen Sie das VNet aus, das Sie in Modul 3 erstellt haben (`backend-vnet`).
      * **IPv4 CIDR:** Geben Sie den Adressbereich an, den Sie für diesen Pool verwenden möchten. Nutzen Sie den gleichen Bereich wie für das VNet, z.B. `10.20.1.0/24`.
      * **Gateway:** Geben Sie das Gateway des VNets an, z.B. `10.20.1.1`.
      * **Pool-Bereich:** Geben Sie einen Bereich für die automatische Adressvergabe an, z.B. `10.20.1.10 - 10.20.1.254`. Das Gateway `10.20.1.1` wird dabei ausgeschlossen.

#### Übung 2: Automatische IP-Zuweisung testen

1.  **VM-Konfiguration:** Wählen Sie Ihre Test-VM aus, die bereits mit dem `backend-vnet` verbunden ist, und starten Sie sie.

2.  **Manuelle Konfiguration entfernen:** Sobald die VM gestartet ist, gehen Sie in ihr internes Betriebssystem (z.B. Debian). Stellen Sie sicher, dass die Netzwerkschnittstelle auf **DHCP** eingestellt ist und nicht mehr manuell konfiguriert wird.

      * **Befehl in Debian/Ubuntu-VM:**

        ```
        sudo nano /etc/network/interfaces

        ```

      * Ändern Sie die Konfiguration von `static` auf `dhcp` und starten Sie den Netzwerkdienst neu (`sudo systemctl restart networking`).

3.  **IP-Adresse überprüfen:** Überprüfen Sie die neu zugewiesene IP-Adresse in der VM mit dem Befehl:

    ```
    ip a

    ```

    Die IP-Adresse sollte aus dem in Übung 1 definierten Pool stammen.

#### Übung 3: Validierung in der Proxmox-GUI

1.  **Navigieren:** Gehen Sie in der Proxmox-GUI zu `Datacenter` -\> `SDN` -\> **VNets**.
2.  **VNet-Übersicht:** Wählen Sie das `backend-vnet` aus der Liste aus.
3.  **IP-Belegung:** Im unteren Bereich finden Sie nun eine Übersicht über die zugewiesenen IP-Adressen. Die IP-Adresse, die Ihre VM erhalten hat, sollte hier als **belegt** angezeigt werden.

#### Fragen zur Selbstreflexion:

  * Welche Rolle spielt der interne DHCP-Server von Proxmox SDN bei der IPAM-Funktion?
  * Was würde passieren, wenn Sie keinen IP-Pool erstellen, aber die VM trotzdem auf DHCP konfiguriert ist?
  * Warum ist es wichtig, den IP-Pool-Bereich so zu definieren, dass das Gateway des VNets ausgeschlossen ist?

Nach Abschluss dieses Moduls sind Sie in der Lage, Ihre virtuellen Netzwerke mit einem funktionierenden IP-Management zu versehen, was einen großen Schritt in Richtung Automatisierung darstellt.

**[Modul 5: Inter-VNet-Routing](05_Modul05_VNet.md)**   oder **[zurück zur Übersicht](00_Übersicht_SDN.md)**