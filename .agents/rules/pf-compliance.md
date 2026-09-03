# Provident Fund (PF) Compliance Module Rules & Architecture

## Overview
This document specifies the rules, schemas, and architectural patterns established for the Provident Fund (PF) Statutory Compliance Module in the Enterprise HR Management System.

---

## Key Rules & Guidelines

### 1. Database Persistence & DTO Validation Scoping
- PF configurations (`PfConfiguration`) are uniquely bound to `Company(id)` via `companyId`.
- API endpoints:
  - `GET /compliance/pf/configuration`: Fetches prefilled company configuration from DB.
  - `PUT /compliance/pf/configuration`: Saves updated statutory parameters to DB.
  - `DELETE /compliance/pf/configuration`: Resets/clears company registration in DB.
  - `DELETE /compliance/pf/configuration/versions/:versionId`: Removes specific version history log entry.
- **DTO Payload Requirement**: When saving to `PUT /compliance/pf/configuration`, send strictly whitelisted `UpdatePfConfigDto` properties (`companyId`, `establishmentCode`, `pfWageCeiling`, `employeePfRate`, `employerEpsRate`, `employerEpfRate`, `edliRate`, `adminRate`, `minAdminCharge`, `allowHigherWage`) to prevent NestJS `ValidationPipe` non-whitelisted property exceptions.
- Client-side extras (`pfRegNumber`, `pfApplicable`, `effectiveFrom`) and `historyVersionLogs` are stored in state and `localStorage` for seamless offline/fallback persistence.

---

### 2. Version History Management
- Each update generates an incremental version log (`v1.0`, `v1.1`, etc.) containing version number, effective date, author, and notes.
- Individual version items can be deleted via the Trash action icon on each version log item.
- Resetting/clearing a registration truncates version logs and resets inputs cleanly.

---

### 3. Number Input UX Handling
- Numeric rate & ceiling input fields use `type="text" inputMode="decimal"` and string-based state (`number | string`).
- This permits complete backspacing and clearing of values without `0` sticking or re-inserting into input fields.
- On form submit, blank string inputs fall back cleanly to 0 or statutory defaults before dispatching to backend.
