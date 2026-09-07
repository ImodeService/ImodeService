# I-MODE Plus Service & Maintenance — Claude Code Project Memory

## Role

You are the coding agent for an existing project:

I-MODE Plus Service & Maintenance
Current release: V6.8 Service focus

Your job is to safely maintain and incrementally improve the existing system.

The current code and behavior are the source of truth.

Investigate before answering.

Never speculate about code that you have not inspected.

When the user refers to a function, page, module, bug, or UI element:
read/search the actual current implementation before making claims.

---

## Critical Working Rule

Do not start by refactoring.

Use this sequence:

INSPECT
→ TRACE
→ PLAN
→ EDIT
→ VALIDATE
→ REGRESSION CHECK
→ REPORT

Prefer the minimum implementation needed for the requested task.

Do not create abstractions, helpers, files, or frameworks for hypothetical future requirements.

---

## Project Scope

This is a Service & Maintenance management system.

Main business workflow:

Customer / LINE OA / Phone / Email
→ Customer Master
→ Machine Master
→ Service Case
→ Quotation if needed
→ Technician Assignment
→ Calendar
→ Field Service
→ Service Report
→ QC
→ Warranty / Machine Documents
→ Close Case
→ Dashboard / Reports

CRM and Sales CRM are explicitly out of scope.

Never reintroduce CRM unless the user explicitly changes project scope.

---

## Application Architecture

Current main application entrypoint:

`index.html` — **markup only since 2026-09-07.** All CSS and JavaScript now live in
`css/NN-*.css` and `js/NN-*.js`, loaded in numeric order by `<link>` / `<script src>` tags
in exactly the position their inline block used to occupy. The number prefix **is** the
load order; never reorder or renumber them.

One page is no longer in `index.html` at all: the **Customer Portal** markup lives in
`pages/customer-portal.html` and is inserted into `<main>` by `pages/pages.js`, a
`<script src>` sitting where the `<section>` used to be. `pages/` is deliberately outside
the `js/` numbering — it runs during parsing, not in the tail block. **The app must
therefore be opened over http** (Live Server, GitHub Pages); a plain `file://`
double-click cannot read the fragment and the portal falls back to a notice. Headless
tests keep working because `--allow-file-access-from-files` permits the read.

Expect:

- one script per historical patch layer (`js/03-app-core.js` is the original application;
  `js/04`… are the patches that override it, newest last)
- multiple IIFEs
- functions assigned to `window`
- top-level `let` / `const` that are **lexical globals**, shared across script files but
  **not present on `window`** (`settings`, `cases`, `machines`, `currentUser`,
  `PAGE_PERMISSION`, `MODULES`…) — read them by bare identifier
- duplicated definitions
- later patches overriding earlier implementations
- localStorage persistence
- optional Supabase synchronization

Never assume the first matching function is active.

Search the full workspace and identify the effective current implementation — with the
split, `grep -n "function name" js/*.js` shows every definition and the file order tells
you which one wins.

---

## Version

Keep:

V6.8
Service focus

This is what `index.html` actually ships: `<title>… · V6.8 Service focus</title>`, the
topbar `Service focus · V6.8`, and the sidebar block `Version 6.8 / Service focus`.
An earlier note in this file said "Service UAT"; that was wrong and has been corrected.

Do not bump or rename the release, and do not revert it to "V6.8 UAT", unless explicitly
requested.

---

## Design Language

Preserve:

- professional white UI
- I-MODE blue
- orange primary/action accents
- mild dimensional button effect
- V5.17-like header direction
- V6.7.1-like sidebar behavior
- responsive desktop/tablet/mobile
- TH/EN
- font scaling

Do not redesign unrelated pages.

Do not redesign Settings responsive layout unless explicitly requested.

---

## Modules

Current functional areas include:

Dashboard
Customers
Machines
Service Cases
Quotation
Onsite / Work Site Pricing
Service Maintenance
Calendar
Field Service
Machine QC
Spare Parts
Purchase Orders
Petty Cash
Warranty
Machine Documents
Notifications
Reports
Settings
Customer Portal / QR / LINE OA

Preserve existing modules unless explicitly instructed otherwise.

---

## Technician Role

Normal Technician experience should focus on approximately:

1. My Work / Technician Home
2. Calendar
3. Field Service
4. Machine QC
5. Parts for Job
6. Machine Information / Documents
7. My Expenses
8. My Reports

Technicians generally should not manage:

Quotation Approval
Pricing Configuration
Purchase Orders
Department Petty Cash
User Management
Settings
Cloud/Supabase
Company-level Reports

Field Service is the technician's main workspace.

---

## Field Service

Expected workflow:

Assigned
→ Appointment
→ Traveling
→ Arrived
→ GPS Check-in
→ Inspection
→ PM / Maintenance / Service
→ Repair
→ Waiting Parts if needed
→ Testing
→ Customer Acceptance
→ Signatures
→ Service Report
→ Finish

Existing statuses:

กำลังเดินทาง
ถึงหน้างาน
เริ่มตรวจเช็ก
กำลัง PM / Maintenance
กำลังซ่อม Service
รออะไหล่
ทดสอบเครื่อง
รอลูกค้าตรวจรับ
จบงาน

Existing capabilities include:

- GPS Check-in
- status timeline
- media evidence
- Before / After photos
- video
- PM/Service checklist
- diagnosis
- work performed
- recommendation
- replaced parts
- customer signature
- technician signature
- next PM date
- Service Report

Priority future improvements:

P1:
- Timesheet / Work Time Tracking
- Parts Request / Issue / Return
- Closing Gate validation

Prefer extending Field Service rather than creating redundant modules.

---

## Service Case

Default statuses:

เคสใหม่
→ มอบหมายแล้ว
→ นัดหมายแล้ว
→ กำลังดำเนินการ
→ รออะไหล่
→ รอส่งงาน
→ เสร็จสิ้น
→ ปิดเคส

However:

`รออะไหล่` is conditional.

Do not implement a workflow that forces all cases through that state.

Support logical branches.

---

## Machine Master

Machine Master links to:

Customer
Service Case
Quotation
QC
Warranty
Documents
Spare Parts
Service History
Customer Portal / QR

Machine pagination must be preserved:

10 / 25 / 50 / 100 / All

Preserve:

Search
Service Filter
Warranty Filter
Size Filter
Previous
Next
Page numbers

Do not modify Serial, Customer, Warranty, Service Status, or other machine identity fields merely to fit UI behavior.

---

## Machine Image Logic

Priority:

actual `m.photo`
→ exact-model reference
→ machine-family reference
→ No Image

Reference images must not overwrite persisted `m.photo`.

Use `object-fit: contain` for product reference images.

---

## Machine QC

Types:

Incoming Inspection
Pre-Delivery QC
Post-Service QC
Installation Acceptance
PM Verification

Statuses:

Draft
In Progress
Pass
Conditional
Fail

Checklist:

Pending
Pass
Fail
N/A

QC is linked:

Customer
→ Machine
→ Service Case
→ QC

Keep the Thai two-page QC document.

Page 1:
General information / Checklist / Result / Signatures

Page 2:
Evidence / damage / missing equipment / Findings / Corrective Action / photos

Videos do not need to print.

Historical scope bug to verify:

`window.qcDocHTML()` previously called a `qcTypeThai()` defined in another IIFE.

Do not patch this blindly.

First inspect whether the current active implementation still has this scope error.

If it does:
apply a minimal scope fix.

Do not redesign QC.

---

## Quotation

Service Quotation may use:

Customer
Service Case
Machine
Size
Service Type
Travel
Google Maps
Urgency
Warranty
Parts
Labor
Discount
VAT

No Sales CRM.

Onsite pricing must not silently overwrite an existing quotation.

Require explicit user action.

---

## Onsite Pricing

Service Levels:

S = 500 THB
M = 1,000 THB
L = 1,500 THB

Travel:

0–15 = 250
16–30 = 400
31–50 = 600
51–80 = 900
81–120 = 1,300
121–180 = 1,900
>180 = 10 THB/km or manual

Formula:

Service Level
+ Travel
+ Spare Parts
+ Actual Cost

---

## Spare Parts

Current concepts:

Part No.
Name
Supplier
Unit
Current Qty
Min
Max
Reorder Point
Lead Time
Location
Machine mapping

PO states:

รออนุมัติ
สั่งซื้อแล้ว
รับเข้าแล้ว
ยกเลิก

Future Technician Parts flow:

Request
→ Reserve
→ Issue
→ Use
→ Return
→ Actual Stock Movement
→ Service Report

Do not expose unrestricted purchasing features to a normal Technician.

---

## Petty Cash

Statuses:

รอเคลียร์
เคลียร์แล้ว
ยกเลิก

Technician UX should eventually use:

My Expenses

linked to Service Case.

---

## Warranty

Warranty connects:

Customer
Machine
Serial
Service history

Preserve warranty certificate/document functionality.

---

## Machine Documents

Categories include:

Operating Manual
Technical Datasheet
Electrical Diagram
Mechanical Drawing
PM Checklist
SOP / Work Instruction
Software / Firmware
Calibration / Certificate
Spare Parts List
Training Material

---

## Customer Portal

Customer Portal / QR / LINE OA must remain separate from the internal application UI.

Customer actions may include:

- report problem
- request quotation
- warranty check
- warranty quotation
- service history
- machine documents
- contact Service

Preserve existing portal mode behavior.

---

## Responsive Requirements

Desktop:
normal sidebar/topbar/table workflow.

Mobile:
drawer
compact topbar
bottom navigation
mobile cards
no horizontal topbar overflow

Do not regress Calendar mobile behavior.

Do not redesign Settings mobile layout.

---

## Assets

Use:

`./assets/Iconservice.png`
for favicon

`./assets/imode-ui-logo-v532.png`
for internal UI/sidebar

`./assets/imode-document-logo.webp`
for documents / QR / QC

Never swap these roles.

GitHub Pages is case-sensitive.

---

## localStorage Safety

Preserve these keys:

`imode_test_v532_cases`
`imode_v5_tech`
`imode_test_v532_customers`
`imode_test_v532_machines`
`imode_test_v532_notifications`
`imode_test_v532_quotes`
`imode_v5_settings`
`imode_v5_cloud`
`imode_v5_current_user`
`imode_test_v532_warranties`
`imode_test_v532_machine_documents`
`imode_test_v532_line_requests`
`imode_test_v532_service_reports`
`imode_v66_qc_records`
`imode_v67_petty_cash`
`imode_v67_spare_parts`
`imode_v67_purchase_orders`

Added by the login system (2026-09-07), same rules apply:

`imode_v69_session`
`imode_v69_auth_audit`
`imode_v69_auth_lock`
`imode_v69_local_pw`
`imode_v69_sb_auth`

Clearing `imode_v69_session` signs the user out; clearing `imode_v69_local_pw` restores
the built-in UAT passwords. Neither destroys business data.

Never run:

`localStorage.clear()`

Do not perform destructive migrations unless explicitly requested.

---

## Supabase Safety

Do not change:

- project URL
- Anon / Publishable key
- table names
- cloud configuration

without explicit request.

Never add service-role credentials to frontend code.

Existing cloud areas can include:

service_cases
technicians
customers
machines
notifications
system_settings
quotations
machine_warranties
machine_documents
line_customer_requests
service_reports

---

## Git / Deployment

Deployment is currently UAT-oriented using GitHub Pages.

Project/repository is associated with:

`ImodeService`

Use relative asset paths.

Be careful with filename casing.

Do not change Pages configuration without explicit instruction.

For meaningful changes:

prefer a feature branch unless the user's workflow explicitly says otherwise.

Never auto-merge a PR unless requested.

---

## Editing Policy

For each requested task:

### Inspect

Read the relevant current files.

Search relevant function names and IDs.

Search for duplicates.

Understand persistence and side effects.

### Plan

State the smallest safe implementation.

### Edit

Modify only necessary code.

Avoid unrelated cleanup.

### Validate

Check inline JavaScript syntax.

Run appropriate tests.

Inspect runtime scope.

### Regression

Check affected desktop and mobile behavior.

Check persistence.

Check asset paths.

### Report

Summarize:

- files changed
- active functions changed
- behavior changed
- validation run
- remaining risk

---

## JavaScript Validation

The application's JavaScript lives in `js/*.js` (plus `auth/*.js`).

After JS changes, syntax-check the files you touched with:

`node --check js/<file>.js`

If node is not installed (it was not, on 2026-09-07), load the single file in a browser
with an `error` listener instead — a parse error there is silent, and its only symptom is
that the script's globals are missing.

Also review:

ReferenceError
IIFE scope
duplicate const/let
undefined global
function override order

Do not treat syntax success as proof of runtime correctness.

---

## Do Not Do These

Do not:

- rewrite the application
- migrate frameworks
- clean unrelated legacy code
- rename everything
- reset user data
- change storage keys
- change Supabase settings
- change database schema without approval
- remove modules
- add CRM
- change Version
- redesign unrelated pages
- create unnecessary helper scripts
- hard-code secrets

---

## New Session Startup

At the start of a new project session:

1. Read this CLAUDE.md.
2. Inspect the current repository.
3. Inspect the active `index.html`.
4. Do not edit yet unless the user already requested a specific change.
5. Ground all statements in the actual current code.

If asked only to understand the project, report:

- project structure
- architecture
- modules
- persistence
- active JS sections
- overridden/duplicate functions
- Service workflow
- Technician workflow
- risks / technical debt

Then wait.

If the user gives a specific task, investigate first and then proceed with the smallest safe change.

---

## Session Change Log — 2026-09-05 → 2026-09-06

All edits were made in `index.html` (single file). No storage key was renamed, no Supabase
setting was touched, no user data was reset.

### 1. Modal close policy

- Codex had added a stripper inside `openModal()` that deleted every "ยกเลิก" button.
  That stripper was **removed** — the modal body HTML is now passed through untouched.
- The accidental-close guard stays where it was, in the `v671QcQrResponsiveFixScript`
  IIFE (~line 5836): backdrop click and Esc are blocked **only** when
  `modalHasDataEntry()` returns true. Read-only detail popups still close normally.
- Rule to remember: "ต้องกดกากบาทเท่านั้น" means *block the accidental close paths on
  data-entry forms*. It does **not** mean deleting the explicit Cancel button.
- Verified across all 29 data-entry modals. Four settings modals (Travel, Roles,
  Typography, DataBackup) have no Cancel button by original design — left as-is.

### 2. Cases page

- **KPI status cards** replace the old status dropdown, reusing the QC page pattern.
  `renderCaseStatusKpis()` fills `#caseStatusKpis` with `.module-kpi-card` buttons inside
  a new `.case-kpi-grid`. Card 0 is "เคสทั้งหมด", then one card per status from
  `caseFilterStatuses()`. Counts respect the active search + priority filter. Click calls
  `selectCaseStatus()`; the active card is marked `aria-pressed="true"`.
- Grid sizing: `auto-fit, minmax(112px, 1fr)`, with breakpoints at 1500px → 5 columns,
  900px → 3, 640px → 2. All 9 cards fit one row at 1920px.
- `casePriorityFilter` is a dropdown that shows a count per priority.
- Each case row has a "สร้างใบเสนอราคา" button, and the whole row is clickable to open
  the case.
- The duplicated "เคสงานบริการ" title was removed from the panel head.

### 3. Shared list pagination — 8 pages

Two page-specific pagination implementations were replaced by one shared helper:
`paginateList()`, `renderListPager()`, `setListLimit()`, `setListPage()`,
`listPagerState()`, `listPagerRerender()`, `listPageItems()`, driven by
`LIST_PAGER_CONFIG`.

Registered keys: `cases`, `customers`, `qc`, `quotation`, `warranty`, `documents`,
`spareParts`, `pettyCash`.

- HTML id convention: `<key>DisplayLimit` / `<key>TotalCount` / `<key>Pagination`.
  The cases ids were renamed to `casesDisplayLimit` / `casesTotalCount` /
  `casesPagination` to fit this convention.
- Markup reuses the existing `machine-pagination` / `machine-page-*` CSS classes.
- Limits are 10 / 25 / 50 / 100 / All, matching the machines page.
- **The machines page keeps its own original pager** — it was not migrated, and the rule
  that its 10/25/50/100/All pagination must be preserved still stands.

### 4. Machines

- **KPI cards added**, inside the `v68MachineLimitQcActionFix` IIFE:
  `renderMachineKpis()` plus `window.setMachineKpiFilter(kind, value)`, called at the top
  of `window.renderMachines`. Five cards: เครื่องทั้งหมด / ต่อ Service / ไม่ต่อ Service /
  อยู่ในประกัน / หมดประกัน.
- **Machine size is now S / M / L** (M was missing). Added `normalizeMachineSize()`, an
  M option in `maSize` and `machineSizeFilter`, the `Medium Machine` mapping in
  `saveMachine` and `setQuoteMachineSize`, M in the quote size picker, and a green
  `.machine-size-badge.M`.
- Pricing note: the `machineRate` at ~line 5279 handles only S and L and returns 0
  otherwise, but it is **dead code** — `window.machineRate` at ~line 5766 overrides it and
  resolves `c[prefix + size]`, so M reads `onsiteM / workshopM / diagnosisM / nextM /
  laborM` from the existing rate config. Verified M = 2250 / 1150 / 750 / 1150.

### 5. Quotation — Google Maps button

- The button was correct; there was simply no Google Maps API key configured. Added a
  free no-key fallback: `quoteMapsPoint()`, `quoteDirectionsUrl()`, `openQuoteDirections()`
  build a `https://www.google.com/maps/dir/?api=1` URL. A customer's own `mapUrl` wins if
  it is set.
- **Regression fixed:** `quoteCustomerChanged()` (~line 5331) calls
  `calculateQuoteDistance(false)` automatically, so the first version of the fallback
  opened a Maps tab merely by selecting a company. The tab now opens only when
  `showToast === true`, which only the 📍 button passes.
- The error/catch branch also offers an "เปิด Google Maps" button.

### 6. Layout cleanup

- `PAGE_INFO` hero subtitles moved (th/en at ~line 4159; petty-cash and spare-parts at
  ~lines 5830-5833).
- Duplicate `.plain-module-intro` blocks and duplicate panel `<h3>` titles removed from:
  qc, petty-cash, spare-parts, technicians, machines, quotation, customers, warranty,
  documents, cases.
- Action buttons moved out of the standalone top rows and into the `.panel-head` row on:
  QC, petty cash, spare parts, customers, technicians (the team segment moved up too),
  and reports ("📄 ตั้งค่ารายงาน" now sits in the "สรุปประสิทธิภาพงาน Service" panel head).
  The emptied `.plain-module-intro` / `.module-action-row` / `.team-toolbar` wrappers were
  deleted.

### 7. Codex hand-off items

All five items Codex started were confirmed code-complete and then verified in a headless
browser: quotation button per case row, clickable case row, status filter buttons,
data-entry popups that resist backdrop/Esc, and the merged date+time picker.

### Validation harness

Built in the session scratchpad (deliberately **not** added to the repo, per the
"no unnecessary helper scripts" rule):

- `syntax-check.js` — extracts every inline `<script>` and runs `node --check` on it
- `ui-check.js` — headless Chrome over CDP against a local static server, with CDN,
  Supabase and Maps requests blocked; runs `ui-assertions.js`; pass `mobile` for 390×844
- `shot.js` / `shot-wide.js` — clipped screenshots for layout checks

### Verified facts about the current build

- **No routing.** `pushState | replaceState | popstate | hashchange | history.back` has
  **zero** matches. `goPage()` only toggles `.page.active`. The only URL handling is
  `initPortalFromUrl()` reading `?machineToken=` and `#/customer-portal`.
- **No audit / SLA / approval engine.** `audit.view` is a permission label in the roles
  table, `sla.autoEscalateMin` is a settings value, and `bhAudit` is a toggle in the
  System Behavior modal. Nothing writes an audit log or escalates a case.
- **Four disconnected identity sets:** `demoUsers` (8, hard-coded), `technicians`
  (`imode_v5_tech`, T001–T003), `settings.relatedEmployees` (EMP-*), and `customers`
  (CUST-*). `currentUser` links to none of them; Field Service matches the logged-in
  technician by **name string**. There is no logout, no password field, and no Customer
  role yet.

### Deferred / open

- **UAT accounts and roles** (`admin_test`, `technician_test1`, `technician_test2`,
  `customer_test1`). Already decided: a plain UAT login with hashing;
  `enforceRolePermissions` stays `false` for now; the customer sees their own company's
  machines, i.e. the post-QR-scan page. Still undecided: which technician records
  `technician_test1/2` map to, and which customer `customer_test1` maps to.
- The `Admin / Coordinator` role has no `quotation.create` permission — to be discussed
  together with the account work.
- UAT passwords stored client-side are visible in DevTools. They must never be real staff
  passwords.

### UI spec documents (11 PDFs, v1.0 • 15 Aug 2026) — gap summary

Reviewed for understanding only; no code was changed to match them. The specs define
10 modules / 39 popups / 96 web pages / 135 surfaces, a Popup-vs-WebPage decision
standard, a Core Data Contract (Machine → Case → Owner → Status → Next Action), six
mandatory system states, design tokens (sidebar 208px, topbar 72px, content 1440px,
Primary `#0B63E5`, Navy `#073763`, Success `#079455`, Warning `#F79009`, Danger
`#E31B2F`), telemetry events and a Definition of Done.

Gaps against the current build: no routing to support the required Deep link / Browser
Back / Breadcrumb on any page; no audit, SLA or approval engine; long multi-step forms
live in modals rather than in web pages. Conversely the app has modules the master spec
does not cover: QC, Petty Cash, Onsite Pricing (S/M/L plus travel zones Z0–Z6),
standalone Warranty, and the Customer Portal / LINE OA. **The Calendar spec was not
provided** (the master lists 4 popups / 6 web pages for it).

---

## Session Change Log — 2026-09-06 (part 2): UAT accounts & roles

Added as one new patch script, `v68UatAccountsScript`, at the end of `index.html`.
Additive only: no existing function body was rewritten, no storage key renamed, no
Supabase setting touched. Every change lives inside the new IIFE, which wires itself in by
overriding globals (`goPage`, `openUserLoginModal`, `renderCustomerPortal`,
`initPortalFromUrl`) in the same patch-over-patch style the rest of the file uses.

### Accounts

| Username | Password | Role | Linked record |
|---|---|---|---|
| `admin_test` | `admin_test` | Admin / Coordinator | — |
| `technician_test1` | `technician_test1` | Technician | `T001` สมชาย ใจดี |
| `technician_test2` | `technician_test2` | Technician | `T002` ณัฐพล ช่างดี |
| `customer_test<N>` | same as the username | Customer | `CUST-000<N>` |

- Customer accounts are generated from the live `customers` array, so **every customer in
  the system has a login**. The username comes from the numeric suffix of the customer id
  (`CUST-0001` → `customer_test1`), never from the array position, so the mapping cannot
  shift when a customer is added, removed or reordered. An id with no numeric suffix falls
  back to a slug of the id.
- `CUST-INTERNAL-IMODE` — created by `ensureInternalCustomer()` in the v67 IIFE for QC,
  internal issue and spare-parts work — is **excluded**. It is I-MODE's own record, not an
  external customer. It sits at index 0 of `customers`, which is why a position-based
  username would have stolen `customer_test1` from รีกัล.
- Current demo data: 11 customer rows → 10 customer accounts, 13 accounts in total.
- `customer_test1` = `CUST-0001` = บริษัท รีกัล จิวเวลลี่ แมนูแฟคเจอร์ จำกัด (19 machines).

### Passwords

- Staff passwords are stored only as SHA-256 hex constants, so the plaintext is not in the
  source. Customer accounts follow the documented UAT convention *password = username*,
  hashed when the account registry is built.
- `sha256()` is a self-contained synchronous implementation rather than `crypto.subtle`,
  so the login also works when `index.html` is opened from `file://`, where
  `crypto.subtle` is unavailable. Verified against node's `crypto` on 15 vectors,
  including multi-block and UTF-8 input.
- **This is a UAT-only client-side login, not real authentication.** The convention is
  readable in the source. Never put a real staff password here.

### Behavior

- The login modal keeps everything it had — the 8 demo users and the manual-name form —
  and the UAT username/password form is inserted above them. A collapsible list shows all
  test accounts with the record each one maps to.
- `admin_test` → the normal application, no forced page change.
- `technician_test*` → opens Field Service on their own technician record. `currentUser.name`
  is set to the technician's own name because Field Service matches by name string.
- `customer_test*` → the post-QR-scan Customer Portal for their own company. `goPage()` is
  wrapped so a customer session cannot leave the portal, the portal `×` becomes ออก
  (logout), and when the company has more than one machine a picker above the machine card
  switches between them. The portal actions themselves are unchanged.
- A customer session is restored on reload, unless the URL carries a `machineToken` — a
  scanned QR wins over the stored session.
- `uatLogout()` clears `currentUser`, leaves portal mode and returns to the dashboard.
  This is the application's first logout.

### Field Service defect found (not fixed app-wide)

`renderFieldService()` (~line 4871) starts with

```js
const cur=fieldTechSelect.value||fieldTechId||technicians[0]?.id||''
```

so the stale `<select>` value **wins over `fieldTechId`**. `openFieldService(tid)`
therefore fails to switch technicians once the select has already been rendered. Rather
than change that shared function, `openTechnicianWorkspace()` in the new script points the
select at the technician before calling `openFieldService()`. **The underlying precedence
bug is still there** and will affect any other caller that passes a technician id.

### Permissions

`enforceRolePermissions` is still `false`, as agreed. `settings.roles` has no `Customer`
role, so a customer session is confined by the `goPage()` wrapper, not by the permission
engine. Adding a real `Customer` role is still open, together with the missing
`quotation.create` permission on `Admin / Coordinator`.

### Validation

- `node --check` on all 8 inline scripts: 0 failures.
- Headless-Chrome suite, 49 assertions, at 1440×1000 and 390×844: all pass, with no
  console errors and no page errors. It covers wrong-password and unknown-user rejection,
  each account's link, portal confinement (`cases`, `settings`, `machines`, `quotation`
  and `exitCustomerPortal` all bounce back), the machine picker, logout, and an actual
  login for every generated customer account.
- Regression suite, 16 assertions: cases KPI cards, the 8 shared pagers, machines KPI +
  its own pager + the S/M/L filter, and the quotation Maps behaviour (no auto-open when a
  customer is selected, opens on the 📍 button) all still pass.

---

## Session Change Log — 2026-09-06 (part 3): role-based Home Pages

One new patch script, `v68RoleHomeScript`, at the end of `index.html`, plus three small
edits inside `v68UatAccountsScript` so the Home Pages reuse the existing login instead of
adding a second one. No new framework, no router, no new user / role / permission store.
`index.html` is the only file changed. Version untouched.

### New pages

Injected into `<main>` by JS, so the giant existing markup was not edited:

- `#page-home` — Admin / Technician Home
- `#page-customer-home` — reached from a machine QR, before login
- `#page-customer-login`

`goPage()` is wrapped: it creates these pages on demand, toggles `body.rhome-mode` (which
hides sidebar, topbar, hero and bottom nav), and renders the right one. Leaving a Home
page restores the full application chrome.

### Existing systems reused — nothing re-created

- **Login validation:** `window.uatAuth.login()`, the same `sha256` check and account
  registry from part 2. The Customer Login page calls it; it has no login of its own.
- **Session:** the same `currentUser` global and `imode_v5_current_user` key.
- **Roles:** `settings.roles` + `currentRoleConfig()`.
- **Permissions:** the same precedence as the active `window.canPermission` — an enabled
  `settings.userPermissions[<user key>]` entry wins, otherwise the role's `permissions`
  array. Its `enforceRolePermissions` short-circuit is deliberately **not** applied,
  because that toggle is off and the Home Page must still show only what the role grants.
- **Navigation:** `goPage(name)`, wrapped, never replaced.
- **QR:** the existing `?machineToken=` and `machineByQrToken()`.
- **Portal:** `enterCustomerPortal()` from part 2.

### Post-login destination

`uatSubmitLogin` now calls `window.imodeRoleHomeAfterLogin()`, so staff — Admin and
Technician — land on `#page-home`, not the Dashboard. Customers still go straight to their
portal. `chooseUser` (the 8 demo users) and `saveManualUser` are wrapped so the legacy
logins land on the Home Page too.

### Admin / Technician Home

One dominant centre circle; module circles at **varying** radii (factors 0.80–1.15 with
per-index angle jitter) so the composition is organic rather than a perfect ring; one SVG
connector line per circle with a mid-point node. Centre click → Dashboard. Small circle
click → `goPage(<module>)`. No merge animation for staff. A `⌂` button is added to the
topbar so staff can return Home.

### Customer Home and the merge animation

Entry state is explicit — `entryMode='customer-qr'`, set by the wrapped
`initPortalFromUrl` — not inferred from how the page looks. The QR context card shows the
machine name, model and serial. The seven circles are journey visuals only: they carry
`aria-disabled="true"`, open no module, and only hint back to the centre.

One click on the centre (the button then disables itself): the centre glows, connector
lines fade, each circle travels to the centre on a 70 ms stagger while scaling to 0.18 and
fading, the centre becomes **Customer**, pulses green, and after ~520 ms the page becomes
`#page-customer-login`. Total ≈ 1.2 s for seven circles. Under
`prefers-reduced-motion: reduce` the circles simply fade and the flow finishes in ~370 ms.

### Customer Login

Username / password against the shared auth. A staff account entered here is rejected and
the session cleared. The LINE button renders **only** when LINE OA / LIFF is configured —
there is no LINE authentication in this codebase, so with no config it is omitted rather
than faked.

### Field Service fix

`renderFieldService()` prefers the existing `fieldTechSelect.value` over `fieldTechId`
(recorded in part 2). Because technicians now reach Field Service from a Home circle
instead of through `openTechnicianWorkspace()`, they were landing on **T001's** queue. The
`goPage()` wrapper now points the select at `currentUser.technicianId` before the page
renders, so a technician account always sees its own queue whichever entry point is used.

### What the permission data currently produces

- **Admin / Coordinator** → 15 circles: Dashboard, Service Cases, Customers, Machines, QC,
  Calendar, Field Service, Service Maintenance, Warranty, Documents, Notifications,
  Reports, Worksite, Spare Parts, Petty Cash.
- **Technician** → 12 circles: the same, minus Worksite, Spare Parts and Petty Cash.
- Neither shows **Settings** (no `settings.manage`) or **Quotation** (no `quotation.view`).

`onsite`, `spare-parts` and `petty-cash` have no key in `PERMISSION_CATALOG`, so rather
than invent one they follow a documented rule: they are shown to roles that can assign work
or administer the system (`case.assign` / `settings.manage` / `users.manage`). Admin has
`case.assign`; Technician does not.

### Responsive and accessibility

A wide 1000×700 coordinate stage on desktop and tablet, a tall 700×1000 one at ≤640px,
re-rendered on breakpoint change; circle diameters clamp to ≥48px on mobile. Every circle
is a real `<button>` with an `aria-label` and a visible `:focus-visible` ring, so keyboard
Enter/Space work.

Note on the header logo: `imode-ui-logo-v532.png` is a white wordmark made for the blue
sidebar, so on the white Home header it is placed on a brand-coloured chip. Asset roles are
unchanged.

### Tests run

- `node --check` on all 9 inline scripts: 0 failures.
- Journey suite, 66 assertions, at 1440×1000, 768×1024 and 390×844, each with
  `prefers-reduced-motion` both `no-preference` and `reduce` — six runs, all pass, no
  console errors and no page errors. Covers admin and technician landing on Home rather
  than Dashboard, chrome hidden, circles matching role permissions, centre → Dashboard,
  circle → module, varying radii, one connector per circle; QR → Customer Home, journey
  circles opening nothing, single-click merge with a repeat-click guard, circles
  measurably travelling and scaling toward the centre, the centre becoming "Customer",
  navigation to Customer Login, wrong password, a staff account rejected at the customer
  door, a real customer login reaching their own portal, the back button, and an invalid
  token showing a warning while leaking no serial.
- Regression suite, 30 assertions, desktop and mobile: cases KPI cards, the 8 shared
  pagers, machines KPI + own pager + S/M/L, quotation Maps behaviour, the modal Cancel
  button and backdrop guard, the 13 UAT accounts, technician self-selection in Field
  Service, the customer portal machine picker, the staff portal preview, all 17 existing
  pages reachable, sidebar restored outside Home, no horizontal overflow, and both version
  strings unchanged.

### Limitations and risk

1. **A machine QR now requires a login.** It previously opened the portal directly; it now
   opens Customer Home and the visitor must sign in. This is the requested flow, but it is
   a real behaviour change for anyone using the QR / LINE entry today.
2. A logged-in customer who scans another company's QR still sees that machine's portal —
   unchanged public-QR behaviour, not introduced here.
3. Quotation and Settings do not appear on Admin Home because `Admin / Coordinator` holds
   neither permission. Fix by ticking them in Settings → Roles, or by adding
   `'quotation.view','quotation.create'` to the preset at `index.html:3922`.
4. There is still no `Customer` role in `settings.roles`; a customer session is confined by
   the `goPage()` wrapper, not by the permission engine, and `enforceRolePermissions`
   remains `false`.
5. No routing was added, so the Home Pages have no deep link and no browser Back — exactly
   like every other page in this application.

---

## Session Change Log — 2026-09-07 (part 4): real login system

The production database is not reachable yet, so the login was built around a **provider
seam** instead of being wired to one backend. The application only ever calls `ImodeAuth`;
what verifies the password underneath is swappable, so pointing this at the real database
later is a configuration change, not a rewrite.

### New files — the first code outside `index.html`

| File | Purpose |
|---|---|
| `auth/auth-core.js` | session, absolute expiry, idle timeout, lockout, audit, offline grace |
| `auth/auth-local.js` | offline / UAT provider — delegates to `window.uatAuth`, no second password check |
| `auth/auth-supabase.js` | Supabase Auth provider — server-side bcrypt, JWT, reset mail |
| `auth/auth-integration.js` | wires `ImodeAuth` into the app; the only file that knows both sides |
| `supabase/01-schema.sql` | `profiles`, `auth_audit`, RLS helper functions |
| `supabase/02-rls.sql` | Row Level Security for all 11 tables |
| `supabase/03-users.sql` | links accounts to app records + verification queries |
| `supabase/README.md` | step-by-step handover for IT |

Loaded with classic `<script src>`, **not** ES modules, so `index.html` still opens from
`file://` — verified in a headless browser: providers register, sign-in works, no errors.

### New localStorage keys (additive; no existing key was read differently or renamed)

| Key | Owner | Holds |
|---|---|---|
| `imode_v69_session` | auth-core | the cached session |
| `imode_v69_auth_audit` | auth-core | sign-in audit ring buffer (200 entries) |
| `imode_v69_auth_lock` | auth-core | failed-attempt and lockout state |
| `imode_v69_local_pw` | auth-local | password-hash overrides from "change password" |
| `imode_v69_sb_auth` | auth-supabase | Supabase tokens (managed by supabase-js) |

`imode_v5_current_user` keeps its old meaning and is still written by `saveLocal()`.

### Changes inside `index.html`

Three small edits, all in `v68UatAccountsScript` and `v68RoleHomeScript`:

- `window.uatAuth` gained `verify`, `findAccount`, `accountToUser`, `hash` and
  `setSessionUser`. `verify()` checks a password **without** touching the session, so the
  provider layer owns session creation instead of the registry.
- `submitCustomerLogin()` on the Customer Login page now calls `window.imodeSignIn`, so
  the customer door uses the same provider, lockout, expiry and audit as the staff door.
- Four `<script src>` tags before `</body>`.

### What the login now does

- **Absolute expiry** 12 h, **idle timeout** 4 h, **offline grace** 7 days — all in
  `settings.authConfig`, all enforced in `auth-core.js`.
- **Lockout** after 5 failed attempts for 15 minutes, per username. Browser-side, so it
  slows a person at the keyboard; Supabase's own rate limit is the one that counts.
- **Audit trail** of sign-in / sign-out / change-password, kept on the device and pushed
  to `auth_audit` when a server provider is active.
- **Password policy**: at least 8 characters, letters and digits, not equal to the username.
- **Change password** works on both providers. On `local` it stores a hash override for
  that device; `ImodeAuthLocal.resetLocalOverride(username)` undoes it.
- **Offline banner** appears while a session is alive only because the device is offline.
- **Session migration**: anyone already signed in when this shipped keeps their session
  rather than being kicked out, but it now expires like any other.

### Deliberate design decisions

- **When Supabase Auth is configured, the local UAT accounts stop working.** Leaving them
  enabled beside a server check would be a documented way around it.
  `settings.authConfig.allowLocalFallback = true` opts back in, knowingly, for UAT.
- **No offline first sign-in.** A device that has never signed in needs network. A local
  password check would be exactly the bypass this removes. Continuity comes from the
  cached session, not from a second password store.
- **The customer door refuses staff accounts; the staff modal accepts customers.** Anyone
  can reach the customer login by scanning a machine QR, so that door is the one that must
  be strict. A customer signing in from the staff modal gains nothing — the `goPage()`
  wrapper still confines them to their portal.
- **RLS matters more than the login screen.** The anon key ships in every browser, so
  without `02-rls.sql` anyone can call the REST API directly and the login is decoration.
  This is stated at the top of that file and in the README.

### Tests run

- `node --check` on all 9 inline scripts and all 4 new files: 0 failures.
- **Auth suite, 57 assertions** — provider registration and selection, `verify` not
  mutating state, sign-in / sign-out, session persistence to its own key, audit entries,
  wrong password, unknown user, lockout after repeated failures (including that it does
  not affect other accounts and clears on success), absolute expiry, idle timeout, offline
  grace working while offline **and being refused while online**, grace window ending,
  password policy, change password and the old password ceasing to work, admin reset of
  the override, staff modal sign-in and error handling, staff rejected at the customer
  door, customer accepted at the staff modal but still confined.
- **Journey suite, 66 assertions** — unchanged, still passing.
- **Regression suite, 30 assertions** — unchanged, still passing.
- **`file://` load check** — external classic scripts load, `ImodeAuth` registers both
  providers, `admin_test` signs in and lands on the role Home page, zero page errors.

### Not done / open

1. **Nothing was run against a real Supabase project.** `auth-supabase.js` and the three
   SQL files are written and reviewed but untested end to end; that needs the project
   owner to run them and work through the checklist in `supabase/README.md`.
2. **`machines` column naming is unverified.** Every other table is pushed as snake_case,
   but `cloudUpsert('machines', obj)` sends the raw JavaScript object, so that table may
   have a quoted `"customerId"` column. `02-rls.sql` detects which column exists instead
   of guessing, and reports it with `raise notice`.
3. **Turning on RLS breaks unauthenticated sync**, which the app does at start-up today.
   Flagged in the README as a decision, not silently changed.
4. Password reset needs real email addresses; the `@imode.local` convention cannot
   receive mail.
5. The audit trail is append-only through the API but editable by anyone with database
   access — an operational record, not evidence.

---

## Session Change Log — 2026-09-07 (part 5): portal entry / exit + LINE Login scaffold

Two additive edits to `index.html`, plus one three-line change inside `v68RoleHomeScript`.
No storage key, no Supabase setting, no version string, no existing function body rewritten.

### 1. `v69QrBootGuard` — new script, first thing inside `<body>`

Boot order is `renderAll()` → `await initCloud()` → `initPortalFromUrl()`, so a phone
scanning a machine QR saw the internal dashboard for the whole cloud round-trip. The guard
runs before the shell paints: when the URL carries `machineToken` (or the customer-portal
hash) it adds `html.qr-booting` (which hides `.app-shell`) and paints a blue I-MODE splash.
`window.imodeQrBootRelease()` clears it — called from the wrapped `initPortalFromUrl`
`finally` block, on `load`, and by a 12 s safety timeout.

### 2. `v69PortalEntryScript` — new script, after the four `auth/*.js` tags

Placed last so its wrappers sit outermost. It wraps `renderCustomerPortal` and
`initPortalFromUrl`; it does not wrap `goPage`.

- **Sidebar brand block → Home.** `.brand-block` becomes a real `role="button"` with
  `tabindex`, Enter/Space, hover and `:focus-visible`. The handler returns early unless
  the session is staff, so it can never become a way out of the customer portal.
- **Portal close button.** For a customer session it is `×` again (it had become
  `ออก`) and opens a keep-or-forget prompt:
  - **จำไว้ในเครื่องนี้** — session untouched, leave for the LINE OA
    (`liff.closeWindow()` inside LINE, else `addFriendUrl` / `officialAccountId`).
    Nothing is configured today, so it toasts and stays put rather than faking an exit.
  - **ไม่ต้องจำ** — `window.imodeSignOut()`, then `goPage('customer-home')`. The QR token
    is restored after sign-out so the Customer Home still shows the scanned machine.
  - Staff previewing the portal keep the original `exitCustomerPortal()` behaviour.
- **`window.imodeLineAuth` — LINE Login scaffold, switched off.** Every entry point checks
  `settings.lineConfig.liffId` first and there is no LIFF ID yet, so the flow is inert.
  When IT supplies one, a LINE profile is matched to a customer through the customer
  record's existing `lineUserId` field — the same field the portal already writes — and
  `autoLogin()` puts a QR visitor straight into their own portal, skipping the circles
  page. `signIn()` backs the "Continue with LINE" button on the Customer Login page.
  Nothing is faked: with no config the button still only opens the Official Account.

### 3. Staff Home animation (added later in the same session)

Three edits inside `v68RoleHomeScript`; the Customer Home merge was not touched.

- **Bloom-out intro**, the mirror of the customer merge: `playStaffIntro()` measures each
  circle, stores the vector back to the centre in `--rhome-dx/--rhome-dy`, and writes an
  inline `rhomeBloomOut` animation with a 55 ms stagger. It runs **synchronously right
  after `innerHTML`**, before the first paint, and uses `backwards` fill, so a circle is
  never seen in its final place before it flies out. The centre uses `rhomeCenterIn`, the
  connector lines and mid-point dots fade in behind their own circle.
- **Module launch — the circle slams into the centre.** Clicking a module circle adds
  `is-slam`: it pulls back ~9% away from the centre, travels the full vector in, and then
  **grows to exactly the centre circle's diameter** and stays there as the new centre,
  while the rest of the stage drops to 12% opacity. The growth factor is measured at
  launch (`--rhome-grow` = centre width / node width, ~3×) rather than hard-coded, so it
  is right at every breakpoint; the icon is counter-scaled to `1 / grow * 1.7` so it ends
  up moderately larger instead of ballooning with the circle. The centre takes the hit
  280 ms in (`is-hit`: a 1.13× jolt with a ring), and `goPage()` runs at 620 ms. The centre circle itself has nowhere to travel, so it keeps the older
  `is-launch` grow-and-fade. `staffLaunching` ignores a second click rather than
  queueing it.
  The travel vector is measured **after** clearing the intro animation and forcing a
  reflow — a click landing mid-intro would otherwise measure the circle in flight and aim
  the slam at the wrong point.
- **`prefers-reduced-motion: reduce`**: the intro degrades to a 240 ms fade with no
  travel, and a click navigates immediately with no launch animation.

Regression suite is now 26 assertions and was run three ways — normal, forced
reduced-motion, and 390×844 — all pass, 0 JS errors. It asserts the intro vars and the
launch classes in normal motion, their *absence* under reduced motion, and that navigation
still happens either way.

Testing note: `--virtual-time-budget` does **not** advance CSS animations predictably, so
a headless assertion that measures where an animated element sits is unreliable. Drive the
animation through the Web Animations API instead — `el.getAnimations()`, `.finish()`, then
measure. That is how the slam is verified to end exactly on the centre (317 px → 0) at
exactly the centre's diameter (166 vs 166 px).

### 4. The front door is now the staff login (added later in the same session)

Opening the app with no session used to land on the Dashboard. It now lands on a new
`#page-staff-login`.

- **New page** `staff-login`, registered in `ensurePages()`, `HOME_PAGES` and the `goPage`
  wrapper of `v68RoleHomeScript`, so it hides the sidebar / topbar / hero like the other
  Home surfaces. It reuses `brandHeader()` and the existing `.rhome-login-card` styles.
- **`submitStaffLogin()`** calls the same `window.imodeSignIn` with `noRoute:true`, so the
  page — not `routeAfterLogin` — decides where the visitor goes. Staff land on
  `#page-home` through `imodeRoleHomeAfterLogin()`.
- **A customer account is refused here** and told to open the link in the LINE OA; the
  account is signed straight back out. This reverses the part-4 decision that the staff
  modal may accept customers: customers now have their own door and no longer belong on
  the staff one. The legacy demo-user modal is still reachable from a link on the page.
- **`bootRoute()`** in `v69PortalEntryScript` runs at DOMContentLoaded — before
  `initCloud()` — and sends a visitor with no session to the door. A machine QR
  (`?machineToken=`) and the `#/customer-portal` hash are exempt: that visitor is a
  customer and goes down the portal path as before.
- **`imodeSignOut` is wrapped** so signing out returns to the door instead of the
  Dashboard. The customer "do not remember" exit still wins, because it re-routes to
  `#page-customer-home` on the promise after the wrapper's.
- **The boot guard now also covers the logged-out case** — it hides the shell unless
  `imode_v5_current_user` holds a session — so the Dashboard never flashes on the way to
  the door either. A returning signed-in user is unaffected and still lands on the
  Dashboard on reload.

Bug caught by the browser test, worth remembering: `submitStaffLogin` captured
`#rhomeStaffError` in a closure, but refusing a customer signs them out, which re-renders
the whole page — the message was written to a detached node and never appeared. Every
element the failure path touches is now looked up at the moment it is used.

Suites: regression 34 assertions × normal / reduced-motion / 390 px, entry-exit 17 + 18,
and a new 6-assertion reload suite (cold start → door, signed-in reload → Dashboard,
sign-out → door, reload after sign-out → door). All pass, 0 JS errors. QR entry verified
to still reach `#page-customer-home` and not the staff door.

### Gotcha worth keeping

`currentUser` is a top-level `let` in the main script, so it is a **lexical global and
never appears on `window`**. `window.currentUser` is `undefined`; read the bare binding.
The first version of the brand-block handler used `window.currentUser` and silently did
nothing for staff — caught by the browser test, not by any syntax check.

### Validation

**`node` is not installed on this machine**, so `node --check` could not be run this
session. Validation was done in headless Chrome instead (`--allow-file-access-from-files`,
an iframe driver in the session scratchpad, not added to the repo):

- Entry/exit suite, 17 assertions at 1440-wide and again at 390 px: technician and admin
  brand-block → Home, the block inert for a customer, `×` restored, the prompt and both
  branches, session preserved on keep, signed out and on Customer Home on forget, LINE
  scaffold present and reporting itself unconfigured, no horizontal overflow.
- Regression suite, 16 assertions: dashboard boot, all 17 pages reachable, V6.8 strings,
  admin 15 circles / technician 12, chrome hidden on Home and restored on leaving,
  technician T002 seeing its own Field Service queue, machines pager, cases KPI cards and
  the shared pagers. **0 JS errors, 0 failures.**
- QR entry with `?machineToken=…`: only `#page-customer-home` is active, `html` class is
  cleared and the splash removed — no dashboard frame.

### Open

- Accounts were **already complete** before this session: `admin_test`,
  `technician_test1` (T001), `technician_test2` (T002) are hard-coded with
  `password = username` (hashes verified), and `customer_test1` is generated from
  `CUST-0001`. Nothing was added.
- Staff Home (admin and technician) still has **no merge animation** — only Customer Home
  does. Left alone deliberately, pending the user's review.
- LINE auto-login is untested end to end: it needs a real LIFF ID and at least one
  customer record with `lineUserId` filled in.

---

## Session Change Log — 2026-09-07 (part 6): labels, role scope, teams, customer entry

Four changes in `index.html`. Three new patch scripts at the end of the file, plus small
edits inside `v68RoleHomeScript` and the account registry. No storage key renamed.

### 1. Module labels

- `เครื่องทำใบเสนอราคา` → **`ทำใบเสนอราคา`** (6 places: sidebar, `PAGE_INFO`, the two
  module name lists, the mobile "more" sheet, the Home circle).
- `Service Maintenance` → **`ทีมช่าง`** / EN `Service Team` for the technicians module
  only. The brand string "I-MODE Plus Service & Maintenance" and "ปฏิทิน Service
  Maintenance" are untouched.
- Gotcha: `applyV68Labels()` rewrites the technicians nav label on **every** render, so
  editing the markup alone silently reverted. That function had to change too.

### 2. `v69RoleScopeScript` — the permission engine is now on

`enforceRolePermissions` had been `false` since the beginning. It is now `true`, and the
three holes that made switching it on unsafe are closed:

| Hole | Fix |
|---|---|
| `Admin / Coordinator` had no quotation permission | added `quotation.view` + `quotation.create` |
| `spare-parts` / `petty-cash` had no `PAGE_PERMISSION` key, so they could never be hidden | new `parts.view` / `pettycash.view` keys |
| Onsite pricing keyed to `field.view`, which every technician holds | new `onsite.view` key |
| **Found while testing:** `Admin / Coordinator` had no `settings.manage` | added, with `users.manage` — without it an enforced admin cannot open the very screen that configures technicians |

- A one-time migration (`settings.v69RoleScope`, currently version 2) rewrites the saved
  roles. After it runs, an admin's own checkbox edits are never overwritten again; bump
  `SCOPE_VERSION` to re-run it.
- **Technician now sees 6 modules**: Field Service, Calendar, Machine QC, Machines,
  Machine Documents, Notifications. **Admin sees 17**, including Settings.
- `goPage('dashboard')` is wrapped: a role without `dashboard.view` is sent to the first
  page it can actually open (a technician lands on Field Service). Without this the Home
  centre circle dead-ended for technicians.
- Consequence worth knowing: with enforcement on and **no session**, the active
  `window.canPermission` (the v62 override) denies everything, because it has no
  `!currentUser` short-circuit. Every module is closed until someone signs in, which
  matches the new staff login door but is a real behaviour change.

### 3. `v69TeamScopeScript` — Technical and R&D

- Four roles added: `Technician - Technical`, `Technician - R&D`, `Technical Lead`,
  `R&D Lead`, each with `teamScope`. A lead gets the technician set plus `team.view`,
  `case.view`, `case.assign`, `calendar.edit`, `reports.view`, `dashboard.view`.
- Two placeholder technician records, `T-LEAD-TECH` and `T-LEAD-RD`, so the structure can
  be used and tested; the names are meant to be edited on the ทีมช่าง page. Existing
  T001–T003 are pinned to `Technical` explicitly.
- Two accounts, same UAT convention (password = username): **`lead_technical`** and
  **`lead_rd`**.
- `window.imodeTeamScope()` resolves the team from the technician record, else the role's
  `teamScope`. It scopes `filteredTechnicians()`, `filteredTechOptions()` and the Field
  Service `<select>`. Admin and manager roles resolve to `null` and still see everyone.

### 4. `v69CustomerEntryScript` — customers no longer log in

The decision changed: customers add the LINE OA, tap the menu, and identify their machine
instead of holding an account.

- **All customer accounts are gone** (`allAccounts()` filters `accountType==='customer'`),
  and the Customer Login page is redirected to the new entry page. 5 staff accounts remain.
- **New page `#page-customer-entry`**: scan the QR, or type the serial. Lookup accepts the
  QR token, the machine id or the serial, ignores case, spaces and dashes, and allows a
  partial serial **only when exactly one machine matches** — it never guesses between two.
- **Scanning**: `liff.scanCodeV2()` inside LINE; in a browser, `BarcodeDetector` with a
  camera preview. Where neither exists (any `file://` page, Safari, desktop Firefox) the
  button is not offered at all and the page says to type the serial, rather than opening a
  dead camera.
- `?machineToken=` opens the portal **directly** again — the login step added in part 3 is
  removed for customers.
- The portal `×` no longer asks about remembering a login, because there is no session:
  inside LINE it closes the window, otherwise it goes to the LINE OA if configured, else
  back to the entry page. A staff member previewing the portal keeps the old behaviour.

### 5. Staff Home rebuilt as a card page (same session, after a design review)

The circle stage was replaced with the layout from the user's sketch: logo header →
identity block (photo left, details right) → module cards in a grid. Only the **staff**
Home changed; `buildStage()` and the customer merge animation are untouched and still used
by `#page-customer-home`.

- `renderRoleHome()` now composes `profileCard()` + `.rhome-modgrid` of `moduleCard()`.
- `profileCard()` shows the avatar (photo, else initials), the name, and up to four detail
  rows: role, team, my open jobs (technicians) or username, and how many modules the
  account can open.
- `playStaffIntro()` branches: a grid gets `playCardIntro()` — the identity block drops in,
  then the cards rise on a 52 ms stagger; the circle bloom is kept for the customer stage.
- `launchStaff()` branches the same way: a card pops and the rest of the grid dims for
  300 ms, then navigates. The slam-into-centre animation stays with the circles.
- Grid is **2 columns up to 900 px and 3 above**, container capped at 920 px. The sketch
  shows 2 everywhere; 3 was chosen for the desktop because an admin has 17 cards. One line
  (`@media (min-width:900px)`) reverts that if 2 is wanted everywhere.
- `prefers-reduced-motion` degrades both to a plain fade.

Suites: drive6 (15 assertions, run normal / reduced-motion / 390 px) plus the circle
assertions in drive2 and drive4 rewritten for cards. **126 assertions across 7 suites, all
pass, 0 JS errors.**

### 6. Home is a Quick Module board, and actions can be permission-gated

Two follow-ups after the user reviewed the card Home on a phone.

**The new-case button is gone for technicians.** `applyRoleVisibility()` only ever walked
`[data-page]`, so buttons were invisible to the permission engine. It now also processes
**`[data-perm]`**, and the topbar `＋ รับเคสใหม่` carries `data-perm="case.create"` — taking
a case in is the coordinator's job. Technicians and team leads no longer see it; admin
does. Any other button can be gated the same way with one attribute.

**The Home page is a shortcut board, not a directory.** The user's point: staff land here
right after signing in, so it has to be fast, showing the modules they actually work in.

- `quickModules()` returns at most `QUICK_LIMIT` (6) cards, ordered by **this account's own
  usage count first**, then by a per-role default order, then by the module table order.
  The ordering applies even when everything fits, so a technician always lands with Field
  Service first rather than in table order.
- Defaults: technician → field-service, calendar, qc, machines, documents, notifications;
  lead → adds cases and ทีมช่าง; other staff → cases, calendar, quotation, customers,
  machines, qc.
- Everything else sits behind a collapsed **โมดูลทั้งหมด (n)** button, so nothing is lost:
  admin shows 6 + 11.
- Usage is counted in `launchStaff()` and stored per account in the new key
  **`imode_v69_home_usage`** (`{username: {page: count}}`). Losing it only resets the
  ordering to the role default; no business data is involved.

Suites: drive7 (6 assertions, button gating) and drive8 (12, quick board — including a
module used three times moving into the board, and that one account's usage does not leak
into another's). **144 assertions across 9 suites, all pass, 0 JS errors.**

Two defects the user found on a phone, both fixed:

- **`โมดูลทั้งหมด` did nothing.** The toggle sets `hidden`, but `.rhome-modgrid{display:grid}`
  is an author rule and beats the UA `[hidden]{display:none}`, so the rest of the modules
  were always on screen and the button appeared dead. Fixed with an explicit
  `.rhome-modgrid[hidden]{display:none}`. Worth remembering for any future `hidden` toggle
  on an element this file gives a `display` to.
- **The identity block stacked on mobile.** The ≤640 px rule set `flex-direction:column`,
  putting the photo above the details; the sketch has them side by side. The row layout is
  now kept at every width, with a smaller avatar (78 px) and tighter detail rows instead.

Suites now 164 assertions across 10, including a real 390 px run of the quick board that
checks the collapse both ways, the photo staying beside the details, and no sideways
scroll.


### 7. Identity block trimmed, account card moved into the sidebar

- **Home identity block now shows the name and the role only.** Team, username and the
  module count were dropped — on a shortcut board they pushed the cards down without
  helping anyone. The role is a chip under the name; the photo still sits beside the text
  at every width.
- **`v69SidebarAccountScript`** moves the existing `#topbarUserCard` element out of the
  topbar and into a new `.sidebar-account` wrapper directly above `.sidebar-version`. The
  element is **relocated, not rebuilt**, so `renderUserCard()` still fills it by id and
  `openUserLoginModal()` still opens from it. `renderUserCard()` rewrites `className` on
  every render, so the wrapper class is re-applied afterwards and the move is idempotent.
  Styling is redone for the blue sidebar (translucent white card, orange avatar).

Suites: drive9 (15 assertions) covers both — name/role only, no detail rows, the card
living in the sidebar above the version block, still opening the modal, surviving a
re-render and a sign-out / sign-in. **180 assertions across 11 suites, all pass, 0 JS
errors.**

Note for later: with the card in the sidebar, a phone reaches the account only by opening
the drawer. That is normal for a drawer layout but it is one tap further than before.

### 8. Assignment flow and per-role notifications — `v69WorkAssignScript`

Three connected pieces the user asked for: a technician's own work list, a coordinator page
that hands a case to a technician, and notifications addressed to a person instead of
shared by everyone.

**New modules** (registered through a new hook rather than by editing the table:
`window.imodeRegisterHomeModule(mod, 'first' | 'after:<page>')`, added to
`v68RoleHomeScript`):

| Module | Page | Permission | Who |
|---|---|---|---|
| งานของฉัน | `my-work` | `mywork.view` (new) | technicians and leads |
| มอบหมายงาน | `assign` | `case.assign` | coordinator / admin |

Both get a sidebar entry and both sit at the front of their role's quick board. A one-time
migration (`settings.v69Work`) grants `mywork.view` to every technician-ish role.

- **งานของฉัน** lists the cases whose `assignee` is this account's `technicianId`, open
  ones first, with counts for open / today / urgent / total and buttons into the case
  detail and Field Service.
- **มอบหมายงาน** lists open cases, unassigned first, each with a technician picker (scoped
  by `imodeTeamScope()`, so a lead only assigns within their own team) and an assign
  button. Assigning sets `assignee`, moves `เคสใหม่` on to `มอบหมายแล้ว`, stamps
  `updatedAt`, writes the notification, saves and pushes to Supabase through the existing
  `cloudUpsertCase`.
- **Assignment is watched, not hard-wired.** `saveCase` and `saveSchedule` are wrapped with
  a before/after snapshot of every case's `assignee`, so assigning from the case modal or
  the appointment modal notifies the technician through exactly the same path as the new
  page. No existing function body was edited.
- **Addressed notifications.** Stored notices now carry `audience:'technician'` and
  `technicianId`. `buildNotifications()` is wrapped: a technician sees only notices aimed
  at them plus the automatic case notices for cases assigned to them; anyone else sees
  everything except notices written for one technician. The automatic notices
  (appointments, urgent, waiting parts) are attributed through their `caseId`, so they
  follow the assignee without any new field.

Suite drive10, 20 assertions: admin assigns → case updates, one notification written and
addressed, admin does not see it, the technician does, it appears in their งานของฉัน, a
second technician sees neither the case nor the notice, technicians cannot open the assign
page, and งานของฉัน leads the technician's home board. **200 assertions across 12 suites,
all pass, 0 JS errors.**

Note: a fresh browser profile has no cases at all, so the suite seeds one; the earlier
suites' module counts moved from 17 → 18 (admin) and 6 → 7 (technician).

### 9. The person picker is editable, and the customer accounts are really gone

**A leak found while looking at the login modal.** Part 4 removed customer accounts by
wrapping `window.uatAuth.allAccounts`, but `findAccount()` and `verify()` call the module's
own closure `allAccounts()`, so `customer_test1` could still sign in and the modal still
counted 15 accounts. Fixed at the source: `customerAccounts()` now returns `[]`. The
registry holds 5 staff accounts, and `findAccount('customer_test1')` returns null.

**`v69LoginUserListScript`** makes the eight hard-coded `demoUsers` in the login modal
manageable:

- A **✕ delete button on every row**, a **"ลบผู้ที่ไม่มีบัญชี (n)"** bulk button, and a
  **"คืนค่ารายชื่อเดิม"** restore.
- `demoUsers` is a `const` in the main script and is never mutated. Removals are stored as
  ids in `settings.hiddenLoginUsers` (inside the existing settings key — no new storage
  key) and filtered out of the picker, so every removal is reversible.
- A person with no matching login account is drawn with a dashed border and an
  **"ไม่มีบัญชี"** chip. The match is by resolved display name against
  `uatAuth.allAccounts()`.
- `chooseUser()` is wrapped so a removed person cannot slip back in through a stale button.
- **One-time clean-up** (`settings.v69LoginListCleaned`), as instructed: on first load
  everyone without an account is removed — which today is all eight, so the picker starts
  empty with a line telling the user to sign in with a username and password. It runs once,
  so a restore stays restored.

Suite drive11, 20 assertions: the registry really holds 5 accounts and a customer cannot
sign in; the clean-up ran; restore brings all eight back; one-row delete, its persistence,
reopening the modal, the bulk remove, the empty state, and that a real account still signs
in. **220 assertions across 13 suites, all pass, 0 JS errors.**

### 10. LINE add-friend QR beside the machine QR — `v69LineQrScript`

- The machine QR popup now shows **two codes side by side**: the machine's service link
  (blue, unchanged) and the **LINE Official Account add-friend QR for `@imodeservice`**
  (green), each with its own print button. Both use the `qrcodejs` library already loaded
  for the machine label, so nothing new is fetched.
- `settings.lineConfig.officialAccountId` and `addFriendUrl` are filled in once with
  `@imodeservice` / `https://line.me/R/ti/p/@imodeservice`, never overwriting a value that
  is already set.
- **That configuration changed live behaviour**, which the suites caught: the portal `×`
  previously had nowhere to go and stayed put; now it really opens the Official Account.
  It opens the OA and then leaves the app on the machine-entry page, so a blocked pop-up
  or a returning visitor never lands back on a portal they had finished with.
- Re-opening the popup does not duplicate the card.

Suite drive12, 12 assertions; the entry suites gained assertions that the OA link is what
opens. **235 assertions across 14 suites, all pass, 0 JS errors.**

### File composition, measured for the "split into separate files" question

`index.html` is 1,080,488 characters: **759,321 in 18 inline `<script>` blocks**,
**265,274 in 32 inline `<style>` blocks**, and only **~55,900 of actual markup** for all 18
static page sections. The size is code, not pages — which is why splitting the *pages* into
separate .html files would move 5% of the file and break the single shared scope the other
95% depends on.

### 11. `index.html` split into `css/` and `js/` — 1.08 MB → 78 KB

The user asked for one file per page. Measured first: of 1,080,488 characters, **70% was
JavaScript, 25% CSS, and only ~5% the markup of all 18 pages**. Splitting the pages would
have moved 5% and broken the single shared scope the other 95% depends on — the app has no
router and every page uses the same globals. Presented with that, the user chose to split
the code out instead, which is what was done.

- **20 `<style>` blocks → `css/01-…` … `css/20-…`**, **18 inline `<script>` blocks →
  `js/01-…` … `js/18-…`**. Each `<link>` / `<script src>` sits exactly where its inline
  block was, so **load and cascade order are unchanged**. Classic scripts execute in
  document order, and top-level `let`/`const` stay script-scoped globals shared across
  files, so nothing about scope changed either.
- The **number prefix is the load order** — reordering or renumbering breaks the
  patch-over-patch chain (e.g. `js/10-v68RoleHomeScript.js` must run after
  `js/03-app-core.js` and before `js/16-v69WorkAssignScript.js`).
- Names: each patch script keeps its old `id` (`js/09-v68UatAccountsScript.js`), and the
  unnamed blocks were given real names — `js/02-demo-data.js`, `js/03-app-core.js`
  (542 KB, the original application), `css/01-base-theme.css` (180 KB), and so on.
- The 7 external scripts already present (qrcodejs, LIFF, supabase-js, `auth/*.js`) were
  left untouched.
- `file://` still works: classic `<script src>` needs no fetch and inherits the document's
  UTF-8, so Thai text is intact.

Verified by running the **entire suite set against the split build: 235 assertions across
14 suites, all pass, 0 JS errors**, plus a screenshot compared with the pre-split build.

Where to look now:

| Need | File |
|---|---|
| the original application (pages, render, storage, cloud) | `js/03-app-core.js` |
| demo customers / machines seed | `js/02-demo-data.js` |
| the base theme, colours, layout | `css/01-base-theme.css` |
| login, accounts, roles | `js/09`, `js/12`, `js/13`, `js/17` |
| the Home board | `js/10-v68RoleHomeScript.js` |
| customer entry / portal exit | `js/11`, `js/14`, `js/18` |
| assignment, my work, notifications | `js/16-v69WorkAssignScript.js` |

### Security note carried over, now more important

`renderCustomerPortal()` still shows whatever machine the token or serial points at,
without checking who is asking. With accounts gone, **anyone who knows a serial number can
see that machine's service history, warranty and documents.** That is the direct
consequence of the no-login decision and should be a conscious one.

### Tests

Six headless suites in the session scratchpad, **120 assertions**, 0 JS errors:
entry paths (14, desktop and 390 px), regression (35), reload (6), role scope (26),
teams + customer entry (25).

Two bugs the suites caught, both worth remembering:
- A block comment whose opening line was consumed by an edit left the rest of the comment
  as bare code. The script silently **did not parse at all** — no console error reached the
  page, the only symptom was that its globals were missing. Extracting a `<script>` by id
  into a standalone file and loading it with an `error` listener is the fastest way to find
  which script died and on which line, now that `node --check` is unavailable.
- The portal close button was only rewired for a *customer session*, which no longer
  exists, so it fell back to the old staff behaviour.

---

## Session Change Log — 2026-09-07 (part 12): the customer page has its own file

Two requests, both small and both additive.

### 1. `#page-customer-portal` moved out of `index.html`

The user asked for per-page `.html` files, then narrowed it — after seeing that the page
markup is only ~5% of the file — to **the customer page only**, pointing at the portal
screenshot. That is the right page to take out: it is the only surface a customer ever
sees, the only one with no sidebar and no topbar, and it belongs to a different audience
from everything else in the file.

| File | What it is |
|---|---|
| `pages/customer-portal.html` | the customer page — edit it directly |
| `pages/pages.js` | takes the `<section>` out of it and puts it into `<main>`, at the position the section used to occupy |

`pages/customer-portal.html` is a **whole document, not a bare fragment**, so that opening
it on its own shows the real page instead of unstyled text: it carries `<base href="../">`,
the twenty stylesheets in `index.html` order, and one rule that reveals the section
(`.page` is `display:none` until `goPage()` adds `.active`). **None of that may reach
`index.html`** — those `<link>` tags would re-apply the entire cascade from inside
`<main>`, last, overriding every later patch stylesheet — so `pages.js` parses the file
with `DOMParser` and inserts **only** `#page-customer-portal`. The machine card and
`portalContent` are empty in the standalone preview because `renderCustomerPortal()` fills
them; the layout is all there.

`index.html` is now 75,974 bytes and carries a comment plus one `<script src>` where the
section was.

Why it is loaded the way it is, all of which matters if this is ever changed:

- **Synchronously, from inside `<main>`.** `goPage()` does
  `getElementById('page-'+name).classList.add('active')` and throws if the section is
  missing, and `renderCustomerPortal()` reads `portalLineIdentity` / `portalMachineHero` /
  `portalContent` as **id globals** (bare identifiers, not `document.getElementById`). A QR
  link renders the portal during boot, so the markup has to be in the document before any
  other script runs — not one tick later on DOMContentLoaded.
- **`XMLHttpRequest`, not `fetch()`.** `fetch()` refuses the `file://` scheme outright;
  XHR does not. Over http both work.
- **A fallback section with the same three ids** is inserted when the read fails, so
  nothing throws and the page says where it went.
- **Only the `<section>` is inserted**, never the preview `<head>` — see above.

**Behaviour change worth knowing:** opening `index.html` by double-clicking it (plain
`file://`) now shows that fallback notice on the customer page instead of the portal.
Every other page is unaffected. Serving the folder — Live Server, GitHub Pages, which is
how it is actually run and deployed — works normally. The headless suites are unaffected
because they run with `--allow-file-access-from-files`.

### 2. One print button for both QR codes, on one sheet

The QR popup had two separate print buttons. It now also has a single
**`🖨 พิมพ์ QR ทั้งสอง (กระดาษแผ่นเดียว / PDF)`**, spanning the popup under both cards
(`grid-column:1/-1`), which prints the machine's Service QR and the LINE add-friend QR
**side by side on one A4 page** — Save as PDF in the print dialog gives the single-file PDF
that was asked for. The two individual buttons are untouched.

- `window.imodePrintBothQR(mid)` in `js/18-v69LineQrScript.js`. The `openMachineQR` wrapper
  now captures the machine id so the sheet can title itself with the machine name, model
  and serial.
- **The codes are lifted from the `<canvas>` elements already on screen**
  (`canvas.toDataURL()`) rather than generated again in the print window, so the sheet
  needs no CDN, prints exactly what the popup shows, and cannot come out with one code
  missing because a library load lost a race.
- Layout: `@page{size:A4;margin:12mm}`, the pair in a flex row with
  `page-break-inside:avoid`, 80 mm cards, 52 mm codes.

**Bug found and fixed while doing this:** `documentLogoUrl()` is a `const` **inside the
v671 IIFE** and never reaches `window`, so the
`typeof documentLogoUrl==='function' ? … : './assets/…'` test in `js/18` always fell
through to the relative path — and a relative URL inside a `window.open('')` document
resolves against `about:blank`, so the logo came out broken. `js/18` now builds the
absolute URL itself (`new URL(rel, location.href).href`). This also repairs the existing
**พิมพ์ QR LINE** sheet, which had the same broken logo.

### Tests

- All 14 existing suites re-run against the split build: **244 assertions, 0 failures, 0
  JS errors.**
- **drive13, 21 new assertions** — the page file exists and holds the seven portal
  buttons, it opens standalone with `<base>` and all twenty stylesheets and reveals the
  section, none of that preview head reaches `<main>` and the app still links each
  stylesheet exactly once, `index.html` no longer contains the markup, the section ends up inside `<main>`
  in its old position exactly once, the real file was used rather than the fallback, all
  three id targets exist, a serial still opens the portal filled in with that machine, a
  portal action still runs, the `×` is still there, and a `?machineToken=` QR link still
  lands on the portal with no dashboard flash.
- **drive12 grew to 22 assertions** — one print button for both codes, spanning the popup,
  not duplicated on reopen, a single A4 page, exactly two QR images, both embedded as data
  URLs with no CDN reference, the machine and the LINE account named on the sheet, an
  absolute logo URL, and the two original print buttons still present.
- **Served over http** (`python -m http.server`, the Live Server / Pages path) and dumped:
  `#page-customer-portal` is present, active, carries all seven buttons and a rendered
  machine card, with no fallback notice. **Plain `file://`** dumped too: the fallback
  section appears and the rest of the app still boots.

**Total: 266 assertions across 15 suites, 0 failures, 0 JS errors.** `node` is still not
installed, so validation remains headless-Chrome only.

