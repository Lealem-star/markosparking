# Test Plan — Markos Parking

**Document ID:** TP-MARKOS-PARK-001  
**Version:** 1.0  
**Date:** 13 July 2026  
**Related:** [SRS](./SRS-Markos-Parking-v1.0.md) | [Use Cases](./Use-Case-Diagrams-Markos-Parking-v1.0.md)

---

## 1. Introduction

### 1.1 Purpose

This test plan maps QA test cases to SRS requirement IDs (`REQ-*`) for Markos Parking v1.0.

### 1.2 Scope

- Manual functional testing (primary)
- API-level verification where noted
- Role-based access testing
- Integration smoke tests (Chapa, Twilio — staging credentials)

### 1.3 Test environment

| Item | Value |
|------|-------|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:5000` (or configured `BASE_URL`) |
| Database | MongoDB (dev/staging) |
| Browsers | Chrome (latest), mobile viewport 375px |

### 1.4 Test accounts (prepare before execution)

| Role | Purpose |
|------|---------|
| system_admin | Settings, full access |
| director | Staff creation, reports |
| supervisor | Zone-scoped valet mgmt |
| finance_officer | Financial reports, flagged |
| valet (zone A) | Car registration |
| valet (zone B) | Cross-zone isolation tests |

---

## 2. Test case format

| Field | Description |
|-------|-------------|
| **TC-ID** | Unique test case identifier |
| **REQ-ID** | Traced SRS requirement |
| **Priority** | P1 (Must), P2 (Should), P3 (Could) |
| **Type** | Functional, Security, Integration, UI |
| **Preconditions** | Required system state |
| **Steps** | Numbered actions |
| **Expected result** | Pass criteria |

---

## 3. Authentication (AUTH)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-AUTH-001 | REQ-AUTH-001 | P1 | Valid login (valet) | JWT returned; redirect to `/valet` |
| TC-AUTH-002 | REQ-AUTH-001 | P1 | Valid login (system_admin) | Redirect to `/admin/dashboard` |
| TC-AUTH-003 | REQ-AUTH-001 | P1 | Invalid password | Error message; no token |
| TC-AUTH-004 | REQ-AUTH-003 | P1 | Login deactivated user | Access denied |
| TC-AUTH-005 | REQ-AUTH-004 | P1 | Role-based routing | Valet cannot access `/admin/settings` |
| TC-AUTH-006 | REQ-AUTH-005 | P1 | Public register route | Registration disabled / redirected |
| TC-AUTH-007 | REQ-AUTH-006 | P1 | Password reset weak password | Validation error (no upper/lower/digit/special) |
| TC-AUTH-008 | REQ-AUTH-006 | P2 | Password reset valid password | Password updated; can login |
| TC-AUTH-009 | REQ-AUTH-007 | P2 | Switch language to Amharic | UI labels change; persists on reload |

**TC-AUTH-001 Steps:**
1. Open login page
2. Enter valid valet phone and password
3. Submit

---

## 4. Staff management (STAFF)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-STAFF-001 | REQ-STAFF-001 | P1 | Director creates valet | User created; appears in zone accordion |
| TC-STAFF-002 | REQ-STAFF-002 | P1 | System Admin creates director | Director account created |
| TC-STAFF-003 | REQ-STAFF-003 | P1 | Director cannot create director | Error / role not in dropdown |
| TC-STAFF-004 | REQ-STAFF-004 | P1 | Valet requires one zone | Cannot save without zone selection |
| TC-STAFF-005 | REQ-STAFF-005 | P1 | Supervisor multi-zone | Comma-separated zones saved |
| TC-STAFF-006 | REQ-STAFF-005 | P1 | Supervisor all zones (`*`) | All zones checkbox saves `*` |
| TC-STAFF-007 | REQ-STAFF-006 | P1 | Valet inherits zone price level | `user.priceLevel` = zone.priceLevel |
| TC-STAFF-008 | REQ-STAFF-007 | P1 | Zone without price level | Error: zone missing price level |
| TC-STAFF-009 | REQ-STAFF-008 | P1 | Deactivate valet | `isActive=false`; cannot login |
| TC-STAFF-010 | REQ-STAFF-009 | P1 | Supervisor edits zone valet | Success |
| TC-STAFF-011 | REQ-STAFF-009 | P1 | Supervisor edits other-zone valet | Denied (403 or not visible) |
| TC-STAFF-012 | REQ-STAFF-010 | P1 | Director edits system_admin | Denied |
| TC-STAFF-013 | REQ-STAFF-013 | P2 | Filter staff by role | List shows matching roles only |
| TC-STAFF-014 | REQ-STAFF-013 | P2 | Search staff by name | Matching users displayed |
| TC-STAFF-015 | REQ-STAFF-012 | P3 | Welcome SMS on create | SMS sent or logged (staging) |

---

## 5. Parking zones (ZONE)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-ZONE-001 | REQ-ZONE-001 | P1 | Create zone | Zone appears in list with name, location, price level |
| TC-ZONE-002 | REQ-ZONE-002 | P1 | Auto-generated code | "Menahriya" → code `MENAHRIYA` (or similar slug) |
| TC-ZONE-003 | REQ-ZONE-002 | P2 | Duplicate name slug | Second zone gets suffix `_2` |
| TC-ZONE-004 | REQ-ZONE-003 | P1 | Edit zone price level | Saved; mapping table updated |
| TC-ZONE-005 | REQ-ZONE-005 | P1 | Sync valets on price change | All zone valets get new `priceLevel` |
| TC-ZONE-006 | REQ-ZONE-004 | P1 | Toggle inactive | Status button shows Inactive; zone excluded from active lists |
| TC-ZONE-007 | REQ-ZONE-006 | P1 | Delete assigned zone | Error: staff assigned |
| TC-ZONE-008 | REQ-ZONE-006 | P1 | Delete unassigned zone | Zone removed |
| TC-ZONE-009 | REQ-ZONE-007 | P2 | View valets modal | Lists correct valets for zone |
| TC-ZONE-010 | REQ-ZONE-007 | P2 | Supervised-by column | Shows supervisor names |
| TC-ZONE-011 | REQ-ZONE-001 | P1 | Non-admin cannot access Settings zones | Director gets access denied on `/admin/settings` |

---

## 6. Pricing and VAT (PRICE)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-PRICE-001 | REQ-PRICE-001 | P1 | Create price level "Dereja 1" | Appears in price level list |
| TC-PRICE-002 | REQ-PRICE-002 | P1 | Set rates for all 5 car types | All types save hourly + package rates |
| TC-PRICE-003 | REQ-PRICE-004 | P1 | Enable VAT at 15% | VAT applied to package calculations |
| TC-PRICE-004 | REQ-PRICE-004 | P1 | Disable VAT | Package total excludes VAT |
| TC-PRICE-005 | REQ-PRICE-005 | P1 | Package fee includes VAT | `totalWithVat` = base + VAT |
| TC-PRICE-006 | REQ-PRICE-006 | P1 | Delete level used by zone | Error with zone names listed |
| TC-PRICE-007 | REQ-PRICE-006 | P1 | Delete unused level | Level removed |
| TC-PRICE-008 | REQ-PRICE-007 | P1 | Zone mapping table | One row per active zone; correct price level |
| TC-PRICE-009 | REQ-PRICE-008 | P2 | View price level details modal | Read-only pricing table shown |
| TC-PRICE-010 | REQ-PRICE-003 | P2 | Edit hourly rate | Checkout/register uses new rate |

---

## 7. Vehicle operations (PARK)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-PARK-001 | REQ-PARK-001 | P1 | Register hourly car | Car created with status `parked` |
| TC-PARK-002 | REQ-PARK-004 | P1 | Car location = valet zone | `location` matches valet `parkZoneCode` |
| TC-PARK-003 | REQ-PARK-005 | P1 | Duplicate plate while parked | Error: already parked |
| TC-PARK-004 | REQ-PARK-006 | P1 | Register flagged customer plate | Registration blocked |
| TC-PARK-005 | REQ-PARK-002 | P1 | Hourly without payment | No Chapa required; car saved |
| TC-PARK-006 | REQ-PARK-003 | P1 | Package registration | Chapa flow required before save |
| TC-PARK-007 | REQ-PARK-007 | P1 | Valet dashboard | Shows only cars in valet zone |
| TC-PARK-008 | REQ-PARK-008 | P2 | Hourly SMS sent | SMS dispatched (staging) |
| TC-PARK-009 | REQ-PARK-009 | P2 | Package SMS sent | SMS after payment + registration |
| TC-PARK-010 | REQ-PARK-001 | P1 | Missing required fields | Validation errors shown |
| TC-PARK-011 | REQ-PARK-010 | P2 | Checkout car | Status → `checked_out`; timestamp set |

---

## 8. Payments (PAY)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-PAY-001 | REQ-PAY-001 | P1 | Init package Chapa payment | Payment modal opens with correct amount |
| TC-PAY-002 | REQ-PAY-002 | P1 | Verify successful txRef | Transaction status = successful |
| TC-PAY-003 | REQ-PAY-002 | P1 | Verify failed/cancelled txRef | Registration not completed |
| TC-PAY-004 | REQ-PAY-004 | P1 | Pay flagged customer | Payment recorded; flag resolved |
| TC-PAY-005 | REQ-PAY-005 | P1 | Payment reference stored | `paymentReference` on car record |
| TC-PAY-006 | REQ-PAY-003 | P2 | Chapa callback endpoint | 200 response; payment reconciled |
| TC-PAY-007 | REQ-PAY-006 | P3 | Pending payment TTL | Record expires after 24h |

---

## 9. Flagged customers (FLAG)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-FLAG-001 | REQ-FLAG-001 | P1 | Checkout without payment flags car | Appears in flagged list |
| TC-FLAG-002 | REQ-FLAG-002 | P1 | View flagged list | Cars grouped by zone |
| TC-FLAG-003 | REQ-FLAG-007 | P1 | Supervisor sees own zone only | No other-zone flagged cars |
| TC-FLAG-004 | REQ-FLAG-003 | P2 | Filter by zone | List filtered correctly |
| TC-FLAG-005 | REQ-FLAG-004 | P1 | Fee calculation | Amount matches pricing + VAT |
| TC-FLAG-006 | REQ-FLAG-005 | P2 | Notify via SMS | SMS sent to customer phone |
| TC-FLAG-007 | REQ-FLAG-006 | P3 | Export CSV | File downloads with flagged data |

---

## 10. Reporting (RPT)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-RPT-001 | REQ-RPT-001 | P1 | Dashboard loads for office staff | Stats and table visible |
| TC-RPT-002 | REQ-RPT-002 | P2 | Change dashboard date | Data updates for selected date |
| TC-RPT-003 | REQ-RPT-003 | P1 | Financial period report | Revenue breakdown displayed |
| TC-RPT-004 | REQ-RPT-004 | P2 | Export financial PDF | PDF downloads with correct data |
| TC-RPT-005 | REQ-RPT-005 | P1 | Customer vehicle history | History report loads |
| TC-RPT-006 | REQ-RPT-006 | P1 | Valet performance report | Admin report accessible to Director |
| TC-RPT-007 | REQ-RPT-007 | P2 | Compliance report | System Admin and Director only |
| TC-RPT-008 | REQ-RPT-008 | P1 | Finance Officer report tabs | Financial + Customer only |
| TC-RPT-009 | REQ-RPT-009 | P1 | Supervisor no reports menu | `/admin/reports` access denied |

---

## 11. Communication (COMM)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-COMM-001 | REQ-COMM-001 | P2 | Send chat message | Message appears in chat |
| TC-COMM-002 | REQ-COMM-002 | P2 | Receive message real-time | Other user sees without refresh |
| TC-COMM-003 | REQ-COMM-003 | P2 | Unread badge increments | Badge shows count |
| TC-COMM-004 | REQ-COMM-004 | P2 | Registration SMS via Twilio | SMS API called (staging) |

---

## 12. Localization (I18N)

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-I18N-001 | REQ-I18N-001 | P1 | English UI default | Labels in English |
| TC-I18N-002 | REQ-I18N-001 | P1 | Amharic UI | Labels in Amharic after switch |
| TC-I18N-003 | REQ-I18N-002 | P2 | Language persists after logout/login | Same language restored |
| TC-I18N-004 | REQ-I18N-003 | P2 | Upload profile photo | Photo displayed on avatar |
| TC-I18N-005 | REQ-I18N-004 | P3 | Valet theme toggle | Light/dark mode switches |

---

## 13. Security and non-functional

| TC-ID | REQ-ID | Priority | Summary | Expected result |
|-------|--------|----------|---------|-----------------|
| TC-SEC-001 | REQ-NFR-SEC-002 | P1 | API without JWT | 401 Unauthorized |
| TC-SEC-002 | REQ-NFR-SEC-003 | P1 | Valet calls zone CRUD API | 403 Forbidden |
| TC-SEC-003 | REQ-NFR-SEC-003 | P1 | Director calls settings API | 403 Forbidden |
| TC-SEC-004 | REQ-NFR-SEC-001 | P2 | Password stored hashed | DB `password` field is bcrypt hash |
| TC-PERF-001 | REQ-NFR-PERF-003 | P2 | Valet UI on mobile 375px | Forms usable; no horizontal scroll |
| TC-PERF-002 | REQ-NFR-PERF-001 | P2 | Staff list load time | < 3 seconds with 100 users |

---

## 14. End-to-end scenarios (E2E)

| E2E-ID | Scenario | Roles | Steps | Pass criteria |
|--------|----------|-------|-------|---------------|
| E2E-001 | Full zone setup | System Admin | Create price level → create zone → verify mapping | Zone shows correct price level |
| E2E-002 | Valet onboarding | Director, Valet | Create valet → assign zone → valet login → register hourly car | Car in dashboard; SMS sent |
| E2E-003 | Package parking | Valet | Register package → Chapa pay → verify car | Car parked; payment recorded |
| E2E-004 | Flagged recovery | Valet, Finance | Checkout unpaid → flag → finance pays | Flag cleared; payment recorded |
| E2E-005 | Price level change | System Admin, Valet | Edit zone price level → valet registers package | New rate applied to valet |
| E2E-006 | Supervisor scope | Supervisor | View staff → edit in-zone valet → attempt other zone | In-zone OK; other denied |

---

## 15. Test execution summary template

| Module | Total TCs | P1 | P2 | P3 | Passed | Failed | Blocked | Not run |
|--------|-----------|----|----|-----|--------|--------|---------|---------|
| AUTH | 9 | 6 | 3 | 0 | | | | |
| STAFF | 15 | 12 | 2 | 1 | | | | |
| ZONE | 11 | 9 | 2 | 0 | | | | |
| PRICE | 10 | 7 | 3 | 0 | | | | |
| PARK | 11 | 8 | 3 | 0 | | | | |
| PAY | 7 | 5 | 1 | 1 | | | | |
| FLAG | 7 | 4 | 2 | 1 | | | | |
| RPT | 9 | 6 | 3 | 0 | | | | |
| COMM | 4 | 0 | 4 | 0 | | | | |
| I18N | 5 | 2 | 2 | 1 | | | | |
| SEC/NFR | 6 | 3 | 3 | 0 | | | | |
| E2E | 6 | 6 | 0 | 0 | | | | |
| **Total** | **100** | **68** | **28** | **4** | | | | |

---

## 16. Entry and exit criteria

### Entry criteria
- Dev/staging environment deployed
- Test accounts for all 5 roles created
- At least 2 parking zones with price levels configured
- Chapa/Twilio staging credentials available

### Exit criteria
- All P1 test cases passed (or documented waivers)
- No open P1 defects
- E2E-001 through E2E-006 passed
- Test summary signed off by QA lead

---

## 17. Defect severity

| Severity | Definition |
|----------|------------|
| **Critical** | System down, data loss, security breach, payment failure |
| **Major** | Core feature broken for a role; no workaround |
| **Minor** | UI issue, workaround exists |
| **Trivial** | Cosmetic, typo |

---

## 18. REQ-ID coverage matrix

| REQ module | Requirements | Test cases | Coverage |
|------------|-------------|------------|----------|
| AUTH | 7 | 9 | 100% |
| STAFF | 13 | 15 | 100% |
| ZONE | 8 | 11 | 100% |
| PRICE | 8 | 10 | 100% |
| PARK | 10 | 11 | 100% |
| PAY | 6 | 7 | 100% |
| FLAG | 7 | 7 | 100% |
| RPT | 9 | 9 | 100% |
| COMM | 4 | 4 | 100% |
| I18N | 4 | 5 | 100% |
| NFR | 6 | 6 | 100% |

---

*End of Test Plan v1.0*
