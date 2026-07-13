# Use Case Diagrams — Tana Parking

**Document ID:** UCD-TANA-PARK-001  
**Version:** 1.0  
**Date:** 13 July 2026  
**Related:** [SRS](./SRS-Tana-Parking-v1.0.md) | [Test Plan](./Test-Plan-Tana-Parking-v1.0.md)

---

## 1. Overview

This document provides UML use-case diagrams per functional module. Actors:

| Actor | Description |
|-------|-------------|
| **System Admin** | Full platform configuration |
| **Director** | Operations leadership |
| **Supervisor** | Zone-scoped valet management |
| **Finance Officer** | Revenue and payment oversight |
| **Valet** | Field parking operations |
| **Customer** | Passive — receives SMS, pays via Chapa |
| **Chapa** | External payment gateway |
| **Twilio** | External SMS provider |

---

## 2. System context (high level)

```mermaid
flowchart TB
    subgraph actors [External Actors]
        SA[System Admin]
        DIR[Director]
        SUP[Supervisor]
        FIN[Finance Officer]
        VAL[Valet]
        CUS[Customer]
        CHA[Chapa]
        SMS[Twilio]
    end

    subgraph system [Tana Parking System]
        WEB[Web Application]
        API[REST API]
        DB[(MongoDB)]
    end

    SA --> WEB
    DIR --> WEB
    SUP --> WEB
    FIN --> WEB
    VAL --> WEB
    WEB --> API
    API --> DB
    API --> CHA
    API --> SMS
    CHA --> CUS
    SMS --> CUS
    VAL -.registers cars for.-> CUS
```

---

## 3. Module: Authentication (AUTH)

```mermaid
flowchart LR
    subgraph AUTH [Authentication]
        UC1([Login])
        UC2([Logout])
        UC3([Reset Password])
        UC4([Select Language])
    end

    VAL --> UC1
    SA --> UC1
    DIR --> UC1
    SUP --> UC1
    FIN --> UC1
    VAL --> UC2
    SA --> UC2
    VAL --> UC3
    SA --> UC3
    VAL --> UC4
    SA --> UC4
```

| Use case | Actor(s) | Description |
|----------|----------|-------------|
| UC-AUTH-01 Login | All staff | Authenticate with phone + password; receive JWT |
| UC-AUTH-02 Logout | All staff | End session, clear credentials |
| UC-AUTH-03 Reset password | All staff | Change password with validation rules |
| UC-AUTH-04 Select language | All staff | Set EN/AM preference in profile |

---

## 4. Module: Staff management (STAFF)

```mermaid
flowchart TB
    subgraph STAFF [Staff Management]
        UC1([Create Staff])
        UC2([Edit Staff])
        UC3([Deactivate Staff])
        UC4([Reactivate Staff])
        UC5([Assign Parking Zone])
        UC6([Filter Staff List])
    end

    SA --> UC1
    DIR --> UC1
    SA --> UC2
    DIR --> UC2
    SUP --> UC2
    SA --> UC3
    DIR --> UC3
    SUP --> UC3
    SA --> UC4
    DIR --> UC4
    SUP --> UC4
    UC1 --> UC5
    UC2 --> UC5
    SA --> UC6
    DIR --> UC6
    SUP --> UC6
```

| Use case | Actor(s) | Preconditions | Postconditions |
|----------|----------|---------------|----------------|
| UC-STAFF-01 Create staff | System Admin, Director | Actor can create target role | User record created; welcome SMS sent |
| UC-STAFF-02 Edit staff | System Admin, Director, Supervisor* | Actor can manage target user | User updated; valet price level synced from zone |
| UC-STAFF-03 Deactivate staff | System Admin, Director, Supervisor* | Target not self | `isActive = false`; user cannot login |
| UC-STAFF-04 Reactivate staff | System Admin, Director, Supervisor* | User inactive | `isActive = true` |
| UC-STAFF-05 Assign zone | System Admin, Director | Zone has price level (valet) | `parkZoneCode` set; price level inherited |
| UC-STAFF-06 Filter staff | All staff managers | Staff list loaded | Filtered view by role/zone/status |

\* Supervisor: valets in assigned zone(s) only.

---

## 5. Module: Parking zones (ZONE)

```mermaid
flowchart TB
    subgraph ZONE [Parking Zone Management]
        UC1([Create Parking Zone])
        UC2([Edit Parking Zone])
        UC3([Toggle Zone Status])
        UC4([View Zone Valets])
        UC5([View Supervisors])
        UC6([Delete Parking Zone])
    end

    SA --> UC1
    SA --> UC2
    SA --> UC3
    SA --> UC4
    SA --> UC5
    SA --> UC6
    UC1 -.auto-generates code.-> UC1
    UC2 -.syncs valet pricing.-> UC2
```

| Use case | Actor | Main flow |
|----------|-------|-----------|
| UC-ZONE-01 Create zone | System Admin | Enter name, location, price level → code auto-generated |
| UC-ZONE-02 Edit zone | System Admin | Update fields → valets in zone synced if price level changed |
| UC-ZONE-03 Toggle status | System Admin | Active ↔ Inactive on zone list |
| UC-ZONE-04 View valets | System Admin | Modal lists valets assigned to zone |
| UC-ZONE-05 View supervisors | System Admin | Table shows supervisors covering zone |
| UC-ZONE-06 Delete zone | System Admin | Blocked if staff assigned; else removed |

---

## 6. Module: Pricing and VAT (PRICE)

```mermaid
flowchart TB
    subgraph PRICE [Pricing Configuration]
        UC1([Create Price Level])
        UC2([Edit Price Level])
        UC3([Delete Price Level])
        UC4([View Price Level Details])
        UC5([Configure VAT Rate])
        UC6([View Zone Mapping])
    end

    SA --> UC1
    SA --> UC2
    SA --> UC3
    SA --> UC4
    SA --> UC5
    SA --> UC6
    DIR --> UC6
```

| Use case | Actor | Business rules |
|----------|-------|----------------|
| UC-PRICE-01 Create level | System Admin | Unique name; rates for 5 car types × 4 durations |
| UC-PRICE-02 Edit level | System Admin | Update hourly/package rates per car type |
| UC-PRICE-03 Delete level | System Admin | Blocked if assigned to any parking zone |
| UC-PRICE-04 View details | System Admin | Read-only pricing table modal |
| UC-PRICE-05 Configure VAT | System Admin | Enable/disable; set percentage; history tracked |
| UC-PRICE-06 Zone mapping | System Admin, Director | Read-only table: zone name → price level |

---

## 7. Module: Vehicle operations (PARK)

```mermaid
sequenceDiagram
    actor Valet
    participant UI as Valet Portal
    participant API as Backend API
    participant DB as MongoDB
    participant SMS as Twilio

    Valet->>UI: Fill registration form
    Valet->>UI: Select service type
    alt Hourly
        UI->>API: POST /parkedCar
        API->>DB: Create ParkedCar (parked)
        API->>SMS: Send confirmation SMS
        API-->>UI: Success
    else Package
        UI->>API: Init Chapa payment
        Note over UI: See PAY module
        UI->>API: POST /parkedCar (after payment)
        API->>DB: Create ParkedCar
        API-->>UI: Success
    end
```

```mermaid
flowchart LR
    subgraph PARK [Vehicle Operations]
        UC1([Register Hourly Car])
        UC2([Register Package Car])
        UC3([View Parked Cars])
        UC4([Check Out Car])
    end

    VAL[Valet] --> UC1
    VAL --> UC2
    VAL --> UC3
    VAL --> UC4
```

| Use case | Actor | Extensions |
|----------|-------|------------|
| UC-PARK-01 Register hourly | Valet | E1: Duplicate plate → error; E2: Flagged customer → blocked |
| UC-PARK-02 Register package | Valet | Includes Chapa payment (UC-PAY-01) |
| UC-PARK-03 View parked cars | Valet | Scoped to valet zone |
| UC-PARK-04 Check out car | Valet | May trigger flagging if unpaid (UC-FLAG-01) |

---

## 8. Module: Payments (PAY)

```mermaid
flowchart TB
    subgraph PAY [Payment Processing]
        UC1([Pay Package via Chapa])
        UC2([Verify Transaction])
        UC3([Pay Flagged Balance])
        UC4([Handle Webhook])
    end

    VAL --> UC1
    FIN --> UC3
    DIR --> UC3
    SA --> UC3
    CHA[Chapa] --> UC2
    CHA --> UC4
    UC1 --> UC2
    UC3 --> UC2
```

| Use case | Actor | Flow |
|----------|-------|------|
| UC-PAY-01 Package payment | Valet | Init payment → Chapa modal → verify txRef → create car |
| UC-PAY-02 Verify transaction | System, Chapa | GET verify endpoint; confirm successful status |
| UC-PAY-03 Flagged payment | Finance, Director, Admin | Calculate fee → Chapa → update car payment |
| UC-PAY-04 Webhook | Chapa | POST callback/webhook; reconcile payment state |

---

## 9. Module: Flagged customers (FLAG)

```mermaid
flowchart TB
    subgraph FLAG [Flagged Customers]
        UC1([View Flagged List])
        UC2([Filter Flagged])
        UC3([Calculate Outstanding Fee])
        UC4([Collect Payment])
        UC5([Notify Customer SMS])
        UC6([Export CSV])
    end

    SA --> UC1
    DIR --> UC1
    SUP --> UC1
    FIN --> UC1
    VAL --> UC1
    UC1 --> UC2
    UC2 --> UC3
    UC3 --> UC4
    UC4 --> UC5
    SA --> UC6
    FIN --> UC6
```

| Use case | Actor | Zone scope |
|----------|-------|------------|
| UC-FLAG-01 View flagged | Office staff, Valet | Supervisor/valet: own zone(s) |
| UC-FLAG-02 Filter | All viewers | By zone, status, search |
| UC-FLAG-03 Calculate fee | System | Pricing + VAT from settings |
| UC-FLAG-04 Collect payment | Finance, Director, Admin | Chapa modal |
| UC-FLAG-05 Notify SMS | Authorized staff | Twilio integration |
| UC-FLAG-06 Export CSV | System Admin, Finance | Download flagged list |

---

## 10. Module: Reporting (RPT)

```mermaid
flowchart TB
    subgraph RPT [Reports]
        UC1([View Daily Dashboard])
        UC2([Financial Period Report])
        UC3([Export Financial PDF])
        UC4([Customer Reports])
        UC5([Administrative Reports])
    end

    SA --> UC1
    DIR --> UC1
    SUP --> UC1
    FIN --> UC1
    SA --> UC2
    DIR --> UC2
    FIN --> UC2
    SA --> UC3
    DIR --> UC3
    FIN --> UC3
    SA --> UC4
    DIR --> UC4
    FIN --> UC4
    SA --> UC5
    DIR --> UC5
```

| Use case | Actor | Access |
|----------|-------|--------|
| UC-RPT-01 Dashboard | All office staff | Revenue + cars by zone/valet/date |
| UC-RPT-02 Financial report | Admin, Director, Finance | Period revenue breakdown |
| UC-RPT-03 PDF export | Admin, Director, Finance | Download period report |
| UC-RPT-04 Customer reports | Admin, Director, Finance | History, activity |
| UC-RPT-05 Admin reports | Admin, Director | Staff performance, compliance |

---

## 11. Module: Communication (COMM)

```mermaid
flowchart LR
    subgraph COMM [Communication]
        UC1([Send Chat Message])
        UC2([Read Chat Messages])
        UC3([View Unread Count])
    end

    SA --> UC1
    DIR --> UC1
    SUP --> UC1
    FIN --> UC1
    VAL --> UC1
    SA --> UC2
    VAL --> UC2
    VAL --> UC3
```

| Use case | Actor | Technology |
|----------|-------|------------|
| UC-COMM-01 Send message | All staff + valets | Socket.IO + REST |
| UC-COMM-02 Read messages | All staff + valets | Polling / socket |
| UC-COMM-03 Unread badge | All chat users | Real-time counter |

---

## 12. Module: Localization (I18N)

```mermaid
flowchart LR
    subgraph I18N [Localization]
        UC1([Switch UI Language])
        UC2([Upload Profile Photo])
        UC3([Toggle Valet Theme])
    end

    VAL --> UC1
    SA --> UC1
    VAL --> UC2
    SA --> UC2
    VAL --> UC3
```

---

## 13. Use case → SRS traceability

| Use case ID | SRS requirements |
|-------------|------------------|
| UC-AUTH-* | REQ-AUTH-001 – 007 |
| UC-STAFF-* | REQ-STAFF-001 – 013 |
| UC-ZONE-* | REQ-ZONE-001 – 007 |
| UC-PRICE-* | REQ-PRICE-001 – 008 |
| UC-PARK-* | REQ-PARK-001 – 010 |
| UC-PAY-* | REQ-PAY-001 – 006 |
| UC-FLAG-* | REQ-FLAG-001 – 007 |
| UC-RPT-* | REQ-RPT-001 – 009 |
| UC-COMM-* | REQ-COMM-001 – 004 |
| UC-I18N-* | REQ-I18N-001 – 004 |

---

## 14. Actor participation summary

```mermaid
mindmap
  root((Tana Parking))
    System Admin
      Settings
      All Reports
      All Staff
      Zones
    Director
      Staff Mgmt
      Reports
      Flagged
    Supervisor
      Zone Valets
      Dashboard
      Flagged
    Finance Officer
      Reports
      Flagged
      Dashboard
    Valet
      Register Cars
      Parked List
      Flagged
      Chat
```
