# Software Requirements Specification (SRS)

**Project:** Tana Parking (ParkingSystem)  
**Document ID:** SRS-TANA-PARK-001  
**Version:** 1.0  
**Date:** 13 July 2026  
**Status:** Draft — aligned with current implementation  

---

## Document control

| Version | Date | Description |
|--------|------|-------------|
| 1.0 | 13 Jul 2026 | Initial SRS based on implemented system |

**Related documents:**
- [Use Case Diagrams](./Use-Case-Diagrams-Tana-Parking-v1.0.md)
- [Test Plan](./Test-Plan-Tana-Parking-v1.0.md)

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Overall description](#2-overall-description)
3. [Functional requirements](#3-functional-requirements)
4. [External interface requirements](#4-external-interface-requirements)
5. [Non-functional requirements](#5-non-functional-requirements)
6. [Data requirements](#6-data-requirements)
7. [Security and access control](#7-security-and-access-control)
8. [Role matrix](#8-role-matrix)
9. [Assumptions and constraints](#9-assumptions-and-constraints)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for **Tana Parking**, a web-based valet parking management platform for city parking operations.

**Intended audience:** product owners, developers, QA engineers, and stakeholders.

### 1.2 Scope

Tana Parking supports:

- Vehicle registration (hourly and package)
- Zone-based staff organization
- Configurable pricing and VAT
- Online payments (Chapa)
- SMS customer notifications
- Revenue and operational reporting
- Flagged (unpaid) customer recovery
- Internal staff communication

**In scope:** Admin portal, valet portal, REST API, MongoDB, Chapa, Twilio, Socket.IO chat.

**Out of scope (current release):** Customer self-service app, ANPR/hardware, multi-tenant deployments, automated test suite.

### 1.3 Definitions

| Term | Definition |
|------|------------|
| **Parking Zone** | Physical area with code, name, location, and price level |
| **Price Level** | Named tariff (e.g. Dereja 1) with rates per vehicle type |
| **Package** | Prepaid parking: weekly, monthly, yearly |
| **Flagged Customer** | Vehicle checked out without full payment |
| **Valet** | Field attendant registering and managing vehicles |

### 1.4 References

- IEEE Std 830-1998
- Repository: `ParkingSystem` (React 18, Node.js/Express, MongoDB)

---

## 2. Overall description

### 2.1 Product perspective

```
┌─────────────────┐     HTTPS/REST      ┌──────────────────┐
│  React Frontend │ ◄─────────────────► │  Express API     │
│  (Admin/Valet)  │     JWT Auth        │  (Node.js)       │
└─────────────────┘                     └────────┬─────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    ▼                            ▼                            ▼
              ┌──────────┐              ┌─────────────┐              ┌─────────────┐
              │ MongoDB  │              │ Chapa API   │              │ Twilio SMS  │
              └──────────┘              └─────────────┘              └─────────────┘
```

### 2.2 User classes

| User class | Primary goals |
|------------|---------------|
| System Admin | Configure system, zones, pricing, all staff |
| Director | Staff oversight, reports, flagged follow-up |
| Supervisor | Manage valets and activity in assigned zone(s) |
| Finance Officer | Revenue tracking, payment reconciliation |
| Valet Attendant | Register cars, collect payments |

### 2.3 Technology stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Redux, React Query, React Router, i18next, SCSS |
| Backend | Node.js, Express 4, Mongoose, Joi, JWT |
| Database | MongoDB |
| Integrations | Chapa, Twilio, Socket.IO |

### 2.4 Key constraints

- Staff accounts are admin-provisioned (no public registration).
- Zone codes are auto-generated from zone name.
- Valet price level is inherited from parking zone.
- Only System Admin accesses Settings and zone CRUD.

---

## 3. Functional requirements

Format: **REQ-&lt;MODULE&gt;-&lt;NNN&gt;**

### 3.1 Authentication (AUTH)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-AUTH-001 | Users log in with phone number and password | Must |
| REQ-AUTH-002 | System issues JWT on successful login | Must |
| REQ-AUTH-003 | Deactivated users cannot log in | Must |
| REQ-AUTH-004 | Route to `/admin` or `/valet` by role | Must |
| REQ-AUTH-005 | Public self-registration is disabled | Must |
| REQ-AUTH-006 | Password reset with complexity rules | Must |
| REQ-AUTH-007 | Language preference (`en`/`am`) persists | Should |

### 3.2 Staff management (STAFF)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-STAFF-001 | System Admin/Director create staff accounts | Must |
| REQ-STAFF-002 | System Admin creates Director accounts | Must |
| REQ-STAFF-003 | Director creates Supervisor, Finance, Valet | Must |
| REQ-STAFF-004 | Valets assigned exactly one parking zone | Must |
| REQ-STAFF-005 | Supervisors assigned zone(s) or all (`*`) | Must |
| REQ-STAFF-006 | Valet price level auto-assigned from zone | Must |
| REQ-STAFF-007 | Reject valet if zone has no price level | Must |
| REQ-STAFF-008 | Soft-deactivate staff (`isActive = false`) | Must |
| REQ-STAFF-009 | Supervisor manages valets in their zone(s) only | Must |
| REQ-STAFF-010 | Director manages all except System Admin | Must |
| REQ-STAFF-011 | System Admin manages all staff | Must |
| REQ-STAFF-012 | Welcome SMS on user creation (best effort) | Should |
| REQ-STAFF-013 | Staff list search and filters | Should |

### 3.3 Parking zones (ZONE)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-ZONE-001 | System Admin creates zones (name, location, price level) | Must |
| REQ-ZONE-002 | Auto-generate unique zone code from name | Must |
| REQ-ZONE-003 | Edit zone name, location, price level, status | Must |
| REQ-ZONE-004 | Toggle active/inactive from zone list | Must |
| REQ-ZONE-005 | Sync valet price levels when zone price level changes | Must |
| REQ-ZONE-006 | Block zone delete if assigned to staff | Must |
| REQ-ZONE-007 | Show supervisors and valets per zone | Should |
| REQ-ZONE-008 | Migration script for legacy zone codes | Could |

### 3.4 Pricing and VAT (PRICE)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-PRICE-001 | Define named price levels | Must |
| REQ-PRICE-002 | Rates per car type (5 types) | Must |
| REQ-PRICE-003 | Hourly, weekly, monthly, yearly rates | Must |
| REQ-PRICE-004 | Enable/disable VAT and set rate | Must |
| REQ-PRICE-005 | Package fees include VAT | Must |
| REQ-PRICE-006 | Block price level delete if used by zone | Must |
| REQ-PRICE-007 | Zone mapping reflects zone config only | Must |
| REQ-PRICE-008 | View/edit/delete price level details | Should |

### 3.5 Vehicle operations (PARK)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-PARK-001 | Register vehicle with plate, type, phone | Must |
| REQ-PARK-002 | Hourly registration without online payment | Must |
| REQ-PARK-003 | Package registration with Chapa payment | Must |
| REQ-PARK-004 | Car location = valet zone code | Must |
| REQ-PARK-005 | Block duplicate parked plate | Must |
| REQ-PARK-006 | Block registration for flagged customers | Must |
| REQ-PARK-007 | Valet dashboard lists zone cars | Must |
| REQ-PARK-008 | SMS on hourly registration | Should |
| REQ-PARK-009 | SMS on package registration | Should |
| REQ-PARK-010 | Status: parked, checked_out, violation | Must |

### 3.6 Payments (PAY)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-PAY-001 | Chapa integration for package payments | Must |
| REQ-PAY-002 | Verify transactions by txRef | Must |
| REQ-PAY-003 | Chapa callback and webhook handlers | Must |
| REQ-PAY-004 | Flagged customer payment via Chapa | Must |
| REQ-PAY-005 | Record payment method and reference | Must |
| REQ-PAY-006 | Pending package payments expire (24h TTL) | Should |

### 3.7 Flagged customers (FLAG)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-FLAG-001 | Flag checkout with no/zero payment | Must |
| REQ-FLAG-002 | View flagged customers by zone | Must |
| REQ-FLAG-003 | Filter by zone, status, search | Should |
| REQ-FLAG-004 | Calculate fees from pricing + VAT | Must |
| REQ-FLAG-005 | SMS notify flagged customers | Should |
| REQ-FLAG-006 | Export flagged data to CSV | Could |
| REQ-FLAG-007 | Supervisor scoped to their zone(s) | Must |

### 3.8 Reporting (RPT)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-RPT-001 | Daily dashboard by zone and valet | Must |
| REQ-RPT-002 | Ethiopian date picker on dashboard | Should |
| REQ-RPT-003 | Period financial report | Must |
| REQ-RPT-004 | PDF export for financial report | Should |
| REQ-RPT-005 | Customer vehicle history and activity | Must |
| REQ-RPT-006 | Administrative valet performance | Must |
| REQ-RPT-007 | Compliance reports (Admin/Director) | Must |
| REQ-RPT-008 | Finance Officer: financial + customer only | Must |
| REQ-RPT-009 | Supervisor has no Reports access | Must |

### 3.9 Communication (COMM)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-COMM-001 | Group chat for staff and valets | Should |
| REQ-COMM-002 | Real-time updates (Socket.IO) | Should |
| REQ-COMM-003 | Unread message indicator | Should |
| REQ-COMM-004 | Transactional SMS via Twilio | Should |

### 3.10 Localization (I18N)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-I18N-001 | English and Amharic UI | Must |
| REQ-I18N-002 | Profile language preference | Should |
| REQ-I18N-003 | Profile photo upload | Should |
| REQ-I18N-004 | Valet light/dark theme | Could |

---

## 4. External interface requirements

### 4.1 User interfaces

| Interface | Path | Users |
|-----------|------|-------|
| Admin portal | `/admin/*` | Office staff |
| Valet portal | `/valet/*` | Valets |
| Login | `/` | All |

### 4.2 API modules

| Module | Path | Description |
|--------|------|-------------|
| Users | `/user` | Auth, CRUD, profile |
| Parked cars | `/parkedCar` | Register, list, flag |
| Park zones | `/parkZone` | Zone CRUD |
| Pricing | `/pricingSettings` | VAT, price levels |
| Payments | `/payment` | Chapa |
| Reports | `/reports` | Analytics |
| Chat | `/chat` | Messages |
| SMS | `/sms` | Notifications |

---

## 5. Non-functional requirements

| ID | Category | Requirement |
|----|----------|-------------|
| REQ-NFR-PERF-001 | Performance | API lists return within 3s under normal load |
| REQ-NFR-PERF-002 | Performance | Registration completes within 5s (excl. payment) |
| REQ-NFR-PERF-003 | Performance | Mobile-responsive valet UI |
| REQ-NFR-SEC-001 | Security | bcrypt password hashing |
| REQ-NFR-SEC-002 | Security | JWT on authenticated routes |
| REQ-NFR-SEC-003 | Security | RBAC on frontend and backend |
| REQ-NFR-USE-001 | Usability | Clear success/error feedback |
| REQ-NFR-USE-002 | Usability | Amharic font support |

---

## 6. Data requirements

### 6.1 Core entities

- **User** — phone (unique), role, parkZoneCode, priceLevel, isActive
- **ParkZone** — code (unique), name, location, priceLevel, isActive
- **ParkedCar** — licensePlate, location, status, valet_id, payment fields
- **PricingSettings** — priceLevels, vatRate, vatEnabled

### 6.2 Integrity rules

- One active parked record per license plate
- Valet priceLevel synced from zone
- Unique phone numbers and zone codes

---

## 7. Security and access control

Role hierarchy: `system_admin` > `director` > `supervisor` ≈ `finance_officer` > `valet`

Principles: least privilege, zone scoping, settings isolation, pricing inheritance from zone.

---

## 8. Role matrix

| Capability | Sys Admin | Director | Supervisor | Finance | Valet |
|------------|:---------:|:--------:|:----------:|:-------:|:-----:|
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create staff | ✅ | ✅* | ❌ | ❌ | ❌ |
| Manage zone valets | ✅ | ✅ | ✅** | ❌ | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ | ✅*** | ❌ |
| Flagged customers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register cars | ❌ | ❌ | ❌ | ❌ | ✅ |

\* Not System Admin  
\** Zone-scoped  
\*** Financial + customer only

---

## 9. Assumptions and constraints

- Single-organization deployment
- Zones and price levels configured before go-live
- Internet required for payments and SMS
- No automated test suite in current release

---

## 10. Appendices

### Appendix A — Vehicle types

`tripod`, `automobile`, `truck`, `trailer`, `special_vehicles`

### Appendix B — Package durations

`weekly`, `monthly`, `yearly`

### Appendix C — Role identifiers

| ID | Display name |
|----|--------------|
| `system_admin` | System Admin |
| `director` | Bahir Dar City Administration |
| `supervisor` | Parking Supervisor |
| `finance_officer` | Finance Officer |
| `valet` | Valet Attendant |

### Appendix D — Operational workflow

1. System Admin configures VAT, price levels, zones
2. Director creates staff and assigns zones
3. Valets register cars (hourly or package)
4. Unpaid checkouts become flagged customers
5. Finance/Director recover payments and run reports
