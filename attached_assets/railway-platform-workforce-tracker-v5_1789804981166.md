# Railway Platform Workforce & Task Compliance Tracker — v5 Update
### Employee Registration Module (Full Field Set) + Updated Dummy Data

---

## WHAT'S CHANGING FROM v4 (context only — don't paste this section)

- New **Employee Registration** module — replaces the current basic "Add Employee" form with a full onboarding record covering personal details, contact/emergency info, ID & statutory compliance documents, employment details, bank details (for HRMS handoff only), and document uploads.
- This matters specifically for a railway contract — platform staff need police verification and gate-pass clearance to work on railway premises, so those fields are compliance-critical, not optional extras.
- Everything from v1-v4 (sidebar, department drill-down, remarks/needs_redo, HRMS export, full Station+Colony department master) is unchanged.

---

## PART 1 — REPLIT UPDATE PROMPT (paste into the existing Repl's Agent chat)

```
This is an UPDATE to the existing "Platform Workforce Tracker" app. DO NOT
rebuild from scratch. Add a full Employee Registration module, replacing
the current basic Employee add/edit form.

1. EMPLOYEE REGISTRATION FORM (Admin only — Supervisors cannot register
   employees, only view their own team)

   Single scrollable form with collapsible section headers (not a multi-
   step wizard — keep it one screen, sections just organize the fields
   visually). Sections and fields:

   A) Personal Details
      - Full Name (required)
      - Father's/Husband's Name (required)
      - Date of Birth (required)
      - Gender (required — Male/Female/Other)
      - Blood Group (optional)
      - Marital Status (optional)
      - Photograph upload (required)

   B) Contact Details
      - Mobile Number (required, 10-digit validation)
      - Alternate Mobile Number (optional)
      - Email (optional)
      - Emergency Contact Name (required)
      - Emergency Contact Number (required)
      - Current Address (required)
      - Permanent Address (optional — "same as current" checkbox to
        auto-fill)

   C) Identity & Statutory Compliance (railway premises access requires
      these — treat as high-priority fields, not afterthoughts)
      - Aadhaar Number (required, 12-digit validation, mask all but last
        4 digits in every list/table view, store encrypted)
      - PAN Number (optional)
      - Voter ID (optional)
      - Police Verification Status (required — Pending / Verified /
        Rejected)
      - Police Verification Certificate Number (required once Verified)
      - Police Verification Date (required once Verified)
      - Medical Fitness Certificate — Status (Yes/No) + Date
      - ESIC Number (optional)
      - PF/UAN Number (optional)

   D) Employment Details
      - Employee Code (auto-generated, e.g. EMP-101 — not editable)
      - HRMS Employee ID (optional — existing field from v2)
      - Department (required, dropdown — from the Station/Colony master)
      - Job Type (required, dropdown — filtered by selected Department)
      - Shift (required)
      - Date of Joining (required)
      - Employment Type (required — Permanent / Contract / Daily-Wage /
        Temporary)
      - Reporting Supervisor (required, dropdown)
      - Railway Gate Pass / ID Card Number (required for premises access)
      - Uniform Size (optional)
      - Status (Active / Inactive / On Leave / Terminated — default
        Active on registration)

   E) Bank Details (optional at registration — for HRMS payroll handoff
      only; this app never calculates or processes salary)
      - Bank Account Number
      - IFSC Code
      - Bank Name & Branch
      - Account Holder Name (should match employee name — flag a
        mismatch as a warning, not a blocker)

   F) Document Uploads (separate from photograph in section A)
      - Aadhaar Card (front + back)
      - Police Verification Certificate
      - Medical Fitness Certificate
      - Address Proof
      - Any other supporting document (generic upload slot)

2. REGISTRATION COMPLETENESS INDICATOR
   On the Employee list/profile view, show a small completeness badge
   (e.g. "8/10 required items complete") based on required fields +
   required document uploads. Employees missing Police Verification or
   Medical Fitness should show a distinct warning badge (amber/red) since
   these are compliance-blocking for railway premises work — this is the
   kind of thing an auditor will check.

3. DATA MODEL CHANGES
   - Extend Employee table with all fields from sections A-E above.
   - New EmployeeDocument table: id, employee_id, document_type
     (aadhaar_front/aadhaar_back/police_verification/medical_certificate/
     address_proof/other), file_url, uploaded_at, uploaded_by,
     expiry_date (nullable — useful for medical certs that need renewal).
   - Encrypt Aadhaar Number and Bank Account Number at rest. Mask both in
     all UI views except a dedicated "reveal" action logged with who
     viewed it and when (simple audit — don't over-engineer this for
     MVP, but don't skip the masking).

4. KEEP UNCHANGED
   - Department/Job Type master (Station 11 + Colony 4 departments) from
     v4.
   - Sidebar navigation, department drill-down, task/attendance marking,
     remarks/needs_redo, Reports (Daily/Monthly/HRMS Export).
   - Supervisors still cannot access this registration form — Admin only.

5. MIGRATION NOTE
   Additive schema change on Employee (new nullable columns for all new
   fields) + new EmployeeDocument table. Existing employee records don't
   need to be backfilled immediately — a completeness badge will simply
   show them as incomplete until an admin updates their record.
```

---

## PART 2 — UPDATED DUMMY DATA

### 2.1 Sample Full Employee Registration Record (EMP-101)

| Field | Value |
|---|---|
| Employee Code | EMP-101 |
| HRMS Employee ID | HR-8801 |
| Full Name | Ramesh Yadav |
| Father's Name | Baban Yadav |
| Date of Birth | 14-Jun-1992 |
| Gender | Male |
| Blood Group | B+ |
| Marital Status | Married |
| Mobile Number | 98xxxxxx01 |
| Emergency Contact | Sunita Yadav (Spouse) — 98xxxxxx21 |
| Current Address | Near Bus Stand, Guntakal, Andhra Pradesh |
| Aadhaar Number | XXXX-XXXX-4821 (masked) |
| PAN Number | — |
| Police Verification Status | Verified |
| Police Verification Cert. No. | PV/GTL/2024/0187 |
| Police Verification Date | 05-Jan-2024 |
| Medical Fitness | Yes — 10-Jan-2024 |
| ESIC Number | 1102345678901 |
| PF/UAN Number | 101234567890 |
| Department | Platforms |
| Job Type | Platform Sweeping |
| Shift | Morning (06:00–14:00) |
| Employment Type | Contract |
| Date of Joining | 12-Jan-2024 |
| Reporting Supervisor | R. Kulkarni |
| Railway Gate Pass No. | GTL-GP-0456 |
| Uniform Size | L |
| Status | Active |
| Bank Account No. | XXXXXXXX3210 (masked) |
| IFSC Code | SBIN0001234 |
| Bank Name | State Bank of India, Guntakal Branch |
| Account Holder Name | Ramesh Yadav |
| Registration Completeness | 10/10 |

### 2.2 Sample Registration Completeness — Mixed Set (for demoing the badge)

| Emp Code | Name | Police Verification | Medical Fitness | Documents Uploaded | Completeness |
|---|---|---|---|---|---|
| EMP-101 | Ramesh Yadav | Verified | Yes | 5/5 | 10/10 ✅ |
| EMP-103 | Anita More | Verified | Yes | 5/5 | 10/10 ✅ |
| EMP-107 | Meena Kamble | Pending | No | 2/5 | 5/10 ⚠️ |
| EMP-112 | Rekha Chavan | Rejected | Yes | 3/5 | 6/10 🔴 |
| EMP-115 | Ajay Pandit | Pending | No | 1/5 | 3/10 🔴 |

*(EMP-107, EMP-112, EMP-115 would show the compliance warning badge described in Part 1, section 2 — useful for demoing to the client how the admin catches missing paperwork before a railway audit.)*

---

**Handoff note:** paste Part 1 into the existing Repl's Agent chat as an additive update. Part 2.1 shows the full field set filled in for one employee, as a reference for how the form should look once complete; 2.2 is for seeding a realistic mix of complete/incomplete registrations.
