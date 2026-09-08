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


---

## Session Change Log — 2026-09-08 (part 13): QR scanning, Customer Home, tactile buttons, a usable permission editor

Seven items from the user. One was a question (no code), one was already true and only
needed renaming, the rest are three new files plus edits to four existing ones. No storage
key renamed, no Supabase setting touched, version untouched.

| File | What |
|---|---|
| `vendor/jsQR.min.js` | **new** — QR decoder, vendored not CDN-loaded |
| `js/19-v69CustomerHomeScript.js` | **new** — the page is the customer's Home page now |
| `js/20-v69PermissionEditorScript.js` | **new** — makes Settings → ผู้ใช้งานและสิทธิ์ usable |
| `css/21-v69-tactile-buttons.css` | **new** — raised / pressable buttons |
| `pages/customer-home.html` | **renamed** from `customer-portal.html` |
| `js/14-v69CustomerEntryScript.js` | the scanner |
| `pages/pages.js`, `index.html`, `js/05`, `js/08` | the new file name and the new labels |

### 1. QR scanning actually works in a browser now

`canScan()` required `window.BarcodeDetector`, which exists **only on Chrome/Android and
ChromeOS**. On Chrome and Edge for Windows, Safari and Firefox it is `undefined`, so the
scan button was never rendered at all — that is why "กดเปิดกล้องไม่ได้ด้วย".

- **`vendor/jsQR.min.js`** (jsQR 1.4.0, Apache-2.0, 128 KB) decodes the frames wherever
  BarcodeDetector is missing. Kept in the repo rather than pulled from a CDN so the
  scanner also works offline, from `file://`, and behind a network that blocks CDNs. It is
  **loaded lazily, only on the first scan**, so boot cost is zero. The jsDelivr
  `sourceMappingURL` line was stripped (it points at an absolute CDN path that 404s).
- `getDecoder()` returns one `decode(source) → Promise<string>` either way, so the scan
  loop never knows which engine it got. Frames are scaled to ~640 px before decoding.
- **A photo of the QR works too** — new `🖼 เลือกรูป QR จากเครื่อง` button, same decoder.
  It is the answer for a desktop with no camera and for iOS Safari.
- Camera failures now say which failure it was: permission refused, no camera, or not a
  secure context. **`file://` *is* a secure context in Chrome** (the old comment in js/14
  claiming otherwise was wrong); what fails there is simply that a machine may have no
  camera, and that message is now correct.
- `entryError('')` clears the box instead of showing an empty red strip.

Verified in headless Chrome with **BarcodeDetector absent** (`typeof === 'undefined'`):
a QR generated by the page's own qrcodejs, saved to a PNG and fed through the file input,
decodes and opens that machine's Home page; and with a fake camera device the preview
opens, plays, and stops.

### 2. Why `customer-home.html` has no customer data (asked, not changed)

By design. The file is the **shell only**. `renderCustomerPortal()` fills the three ids
`portalLineIdentity`, `portalMachineHero`, `portalContent` at runtime from the live
`machines` / `customers` / `warranties` / `serviceReports` arrays — localStorage first,
Supabase when cloud is configured. Opening the file on its own therefore shows the layout
with empty slots; opening it through the app shows the real machine. Nothing to fix.

### 3+4. Tactile buttons — `css/21-v69-tactile-buttons.css`

The customer's seven service buttons and the technician's module cards were flat: nothing
rose under the finger, nothing pressed down. They now use the **same dimensional recipe the
app already had** for `.action-3d-orange` (css/01, V5.25): a solid colour ledge
(`0 5px 0 …`) under the element, a 2 px lift on hover, and a real press on `:active` where
the ledge collapses to a hairline and the element travels down into it. Icons sit on their
own raised chip.

Covers: `.portal-action-grid > button`, the portal detail buttons, `.centry-scan`,
`.centry-scan-file`, `.rhome-login-btn`, `.rhome-modcard` + its icon, `.rhome-modtoggle`,
`.work-row`, `.field-job-card`, and the action buttons in My Work / Field Service / Assign.

Three things that matter if this file is ever edited:

- **It must stay the last stylesheet.** js/10 and js/16 append their `<style>` blocks to
  `<head>` at runtime; a `<link>` inside `<body>` comes after those in document order, so
  these rules win at equal specificity without `!important`. The link sits right after
  css/20's.
- `.rhome-modcard:active` is written as `:active:not(.is-launch)` — the launch animation
  owns the transform, and a finger still down would otherwise fight it.
- `prefers-reduced-motion: reduce` keeps the depth and drops the travel.

Press behaviour is asserted with real CDP mouse events, measuring
`getBoundingClientRect().top` at rest → hover → pressed.

### 5. The permission editor was unusable, not broken

`saveRoles()` was always correct. The problem was reaching it: the modal rendered **all 8
roles and all 13 users as full 43-checkbox cards at once — 23,511 px tall** — with the save
button at the very bottom. Roughly 27 screens of scrolling to save one tick.

`js/20-v69PermissionEditorScript.js` **rearranges the modal the base function already
built**; it does not rewrite the editor and it writes nothing itself.

- **A role tab strip.** One role card visible at a time. Every card **stays in the DOM,
  only `display:none`** — `saveRoles()` collects
  `#roleList .role-card:not(.user-permission-card)`, so a card that is *removed* is a role
  that is *deleted* on save. A `MutationObserver` on `#roleList` keeps the strip in step
  with Add Role and the inline Delete button.
- **A user dropdown** for the individual permissions, same reason. Built once: rebuilding
  it on every tick reset it to the first user and threw the admin out of the card they
  were editing. Only the option label refreshes.
- **The real login accounts are in the list now.** `allLoginUsers()` returns the 8
  hard-coded `demoUsers` plus whoever is signed in, so `technician_test1`,
  `technician_test2`, `lead_technical` and `lead_rd` could not be given an individual
  permission at all. Their cards are **cloned from the one the base function rendered**, so
  there is one card template, not two.
- **A sticky save bar** at the bottom of the modal.
- **A lock-out guard**: unticking `settings.manage` on your own role asks for confirmation
  first, because after saving you cannot reopen this screen.

Modal height went **23,511 px → 3,374 px**. Verified end to end: an admin enables
individual permissions for `technician_test1`, saves, signs in as that technician, and
`canPermission()` follows the override (gains `dashboard.view`, loses `qc.view`).

**Gotcha worth keeping:** `applyLanguageTo(modal)` runs on a `setTimeout(0)` after
`openModal()` and walks every text node, so it translated the role name on the tab
("Technician" → "ช่าง") while the card it selects still said Technician. A role name is
data, not a UI label — `data-no-i18n="true"` on the container is the opt-out the function
already honours.

Also fixed while here: the **mobile bottom-nav `＋ รับเคส` FAB now carries
`data-perm="case.create"`**, so it is hidden for technicians like the topbar button
already was. It was the last ungated new-case entry point.

### 6+7. The customer page is the customer Home page

`?machineToken=` already opened the portal directly (verified — an earlier probe suggesting
otherwise was a stale test token, not a bug). What was missing was the name.

- `pages/customer-portal.html` → **`pages/customer-home.html`**. `pages/pages.js` reads the
  new name.
- **The section id stays `page-customer-portal`.** `goPage()`, `renderCustomerPortal()`,
  `exitCustomerPortal()`, css/17 and css/20 all address it by that name; renaming it would
  be a rename with no behaviour behind it. `js/19` accepts **`goPage('customer-home')`** and
  the **`#/customer-home`** hash and translates both, so the new name works everywhere.
  `window.imodeGoCustomerHome()` is the one call that resolves to the Home page when a
  machine is known and to the machine-entry page when it is not.
- Labels the user sees: header `หน้าหลักลูกค้า · Customer Home`, the green identity strip,
  `PAGE_INFO['customer-portal']`, the Customers-page button `▦ ดูหน้าหลักลูกค้า ›`, and the
  machine popup's `📱 ดูหน้าหลักลูกค้า`.
- The circle Home page (`#page-customer-home` of part 3) is gone and stays gone; js/14
  still maps a customer with no machine to the entry page.

### Tests

Eight headless suites, **97 assertions, 0 failures, 0 JS errors**, at 1440×1000 and
390×844, plus a forced `prefers-reduced-motion` run and a `file://` run:

customer-home rename + QR entry (12) · scanning with jsQR and a fake camera (8) ·
permission editor structure and save (17) · press-feel + regression: 18 pages, both version
strings, machines pager, cases KPI, QR popup with two codes and one combined print button,
sign-out → door, no horizontal overflow (24) · individual permission end to end (10) ·
standalone page file, no preview `<head>` leaking into `<main>`, portal exit, `file://`,
reduced motion (18) · picker/tab selection stability (5) · FAB gating (3).

`node` is still not installed, so validation remains headless-Chrome only.

### Testing note worth keeping

`--user-data-dir` does **not** guarantee a fresh browser: if a Chrome from an earlier run is
still alive it owns the debug port, and the new launch silently talks to the old instance
with its old localStorage. A long detour was spent chasing a "migration that does not
migrate" that was really a stale profile. Kill `chrome.exe` before launching, and re-derive
any test fixture (a `qrToken` is regenerated per profile) inside the same browser you
assert in.

### Open / risk

1. **The Home page still shows any machine to anyone who knows its serial or token.** The
   no-login decision from part 11 is unchanged and this session did not narrow it; the
   scanner just made that path easier to use.
2. jsQR is vendored, so updating it if a CVE ever lands is now this project's job.
3. `my-work` is technician-only by design — an Admin holds no `mywork.view` and
   `goPage('my-work')` bounces. Grant it in Settings → Roles if a coordinator should see it.

### Follow-up (same day): งานของฉัน was missing from the technician's sidebar

Reported from a real browser: a technician's sidebar showed only เครื่องจักร / QC เครื่อง /
ปฏิทินงาน / เอกสารเครื่องจักร / การแจ้งเตือน — no งานของฉัน.

The nav entry was never the problem; `ensureNav()` in js/16 has always inserted it. The
**permission** was gone. `TECHNICIAN_PERMS` in `js/12-v69RoleScopeScript.js` predates
`mywork.view`, and that array **replaces** a technician role's permissions in two places —
the migration, and the `ชุดสิทธิ์มาตรฐาน` button in Settings → Roles. Pressing that button
on any technician role therefore deleted งานของฉัน from their sidebar without saying so.

- `mywork.view` added to `TECHNICIAN_PERMS` (js/12).
- `WORK_VERSION` in js/16 bumped **1 → 2**, so its add-only migration re-runs once and
  gives the key back to every technician-ish role already saved without it. Additive: no
  other permission is touched, and Admin still holds no `mywork.view`.

Verified against a seeded copy of the reported state (roles stripped of `mywork.view`,
`v69Work=1`): after one reload the key is back on Technician, Technician - Technical,
Technician - R&D and both lead roles, งานของฉัน is the **first** sidebar item for a
technician and opens `#page-my-work`, and pressing ชุดสิทธิ์มาตรฐาน no longer unticks it.
Suite w2, 11 assertions.

**Still not in the sidebar for anyone: Field Service.** `index.html` has no
`data-page="field-service"` nav item at all — it is reached from the Home board only. Left
as it is; it was not asked for.

---

## Session Change Log — 2026-09-08 (part 14): the customer report flow, and a permission bug that was eating modules

The user described the intended flow and asked what is done, what is extra and what is
missing. Tracing it end to end in a browser turned up one defect far more serious than
anything on the list.

### 0. THE BUG: every module keyed to a late-registered permission disappeared on the second page load

`mergeSettings()` (js/03 line 140) runs `normalizeRoleSetting()` → `migrateLegacyPermissions()`,
which does

```js
text.filter(x => allPermissionKeys().includes(x))
```

— it drops every saved permission whose key is not in `PERMISSION_CATALOG` **at that
moment**. js/12 registers `onsite.view`, `parts.view`, `pettycash.view` and js/16 registers
`mywork.view`, and **both run after js/03**. So on every page load those four keys were
stripped from every role, and the next `saveLocal()` wrote the stripped set back.

Their migrations repaired it — but each is guarded by a version flag, so only the **first**
load ever repaired it. Measured on a clean profile:

| load | Admin / Coordinator | Technician |
|---|---|---|
| #1 | 33 permissions | 13 |
| #2 | **30** | **12** |
| #3+ | 30 | 12 |

From the second load on, **Onsite, Spare Parts, Petty Cash and งานของฉัน were unreachable
for everyone, the Admin included** — `goPage()` bounced them. This is why the user's own
screenshot showed Admin at 30/43, and why งานของฉัน was missing from the technician's
sidebar. The previous session's diagnosis (the ชุดสิทธิ์มาตรฐาน button) was wrong: that
button could do it too, but this happened on its own, every reload.

**Fix, in two parts:**

1. `js/01-v69QrBootGuard.js` — the first script in the document — now takes
   `window.imodeSettingsSnapshot`, a copy of the saved settings **before any script can
   rewrite them**. Reading storage later is not enough: several patch scripts call
   `saveLocal()` while booting, so by then storage already holds the stripped set.
2. `js/20-v69PermissionEditorScript.js` runs `repairStrippedRolePermissions()` at parse
   time: for each role it puts back any permission that is in the snapshot **and** in the
   now-complete catalog. It restores, it never grants — a permission an admin genuinely
   unticked is not in the snapshot either, so it stays off (asserted).
3. `SCOPE_VERSION` in js/12 bumped 2 → 3, one-time, so installs that already saved the
   stripped set get the four keys back.

**Any future script that pushes to `PERMISSION_CATALOG` must load before js/20**, or its
keys will keep being stripped. That is written at the repair.

### 1. The flow, traced end to end

Customer scans machine QR → Home page → แจ้งปัญหา → admin → assign → technician:

| Step | State |
|---|---|
| QR → customer Home page with machine data | worked already |
| แจ้งปัญหา creates a Service Case | worked already — `submitPortalIssue()` writes both a `lineRequests` row and a real case (`เคสใหม่`, no assignee, `channel:'LINE OA'`) |
| Case reaches the admin | it reached the **Assign page**, but **nobody was told** — `buildNotifications()` announced appointments, urgent cases, waiting parts and submissions, never intake |
| Admin assigns → technician notified | worked already |
| Case appears in งานของฉัน | worked already — it was only unreachable because of the permission bug above |

**Added: `intakeNotices()` in js/16.** One notice per open, unassigned case
(`🆕/📱 เคสใหม่รอมอบหมาย`, with ticket, customer, machine and channel), shown only to
accounts that hold `case.assign`, and it disappears the moment the case is assigned. A
technician never sees it.

Nothing was needed for path 2 (LINE rich menu → scan / serial → Home page) or path 3 (chat
with the admin in LINE, admin opens the case by hand): the first already works and the
third is a human process.

### 2. QR and serial — "every one must work"

Audited all 40 demo machines: **every machine has a `qrToken`, every token resolves to its
own machine, and every serial resolves to its own machine.** `ensureMasters()` backfills a
token on every `renderAll()`, so a machine created with no data at all still gets one —
verified by adding a machine with no customer, no model and no serial: its QR opens the
Home page and the card renders with dashes.

One real hole closed: **a serial shared by two machines used to silently open the first
one** — one company could have been shown another company's machine. `findMachines()` now
returns every match and the entry page **asks which machine** when more than one answers,
listing name, model, serial and customer. `findMachine()` returns a machine only when the
answer is unambiguous.

Machines with no serial can only be reached by their QR; that is inherent (there is nothing
to type) and their QR is guaranteed.

### 3. The Customer Home page, rebuilt to the supplied design

`pages/customer-home.html` (markup) + `css/22-v69-customer-home.css` (new) +
`js/19-v69CustomerHomeScript.js` (the card and the entrance).

- **Header**: logo | I-MODE Plus / Customer Service Center / tagline | ×.
- **Machine information card**: photo left, labelled rows right — ชื่อเครื่องจักร, โมเดล,
  ซีเรียลนัมเบอร์, ชื่อลูกค้า, สถานะการรับประกัน as a coloured pill with the expiry date
  under it. Built in js/19 from the same helpers `renderCustomerPortal()` uses
  (`portalMachine`, `customerById`, `latestWarrantyForMachine`, `warrantyState`,
  `machineFamilyPhoto`), **after** the base function runs. js/03 is not edited: remove
  js/19 and the original card comes back. The machine-image priority (own photo →
  family reference, shown `contain` → No Image) is preserved.
- **Eight action cards**: icon chip, title, subtitle, a small-caps English label with a
  coloured rule, and a chevron. The eighth spans the row: **ข่าวสาร / ประกาศ**. There is no
  news module in this application, so it reads `settings.portalNews` (`{title,date,body}`)
  and says plainly that there is nothing yet rather than faking content.
- **Footer**: TRUST • EXPERTISE • ALWAYS WITH YOU.
- `class="portal-action-grid"` is kept on the grid because js/08 and css/20 find the grid
  by that name to hide it in detail mode.

**The entrance the user asked for**: every button pops in one after the next.
`playEntrance()` stamps `--chome-i` on each button synchronously right after the render,
before the first paint, and css/22 runs `chomePopIn` with `animation-delay: var(--chome-i) *
70ms` and `backwards` fill, so a button is never seen in place before it pops. Measured:
8 buttons at 0/70/140/…/490 ms, each really travelling (706 px → 688 px on the 6th).
`prefers-reduced-motion: reduce` degrades to a 200 ms fade with no stagger.

### 4. Technician page

- **Field Service now has a sidebar entry** (`🧰 หน้างานช่าง`, after เคสงานบริการ). It had
  none for any role — the technician's main workspace was reachable only from the Home
  board.
- **The Field Service page shows only งานของฉัน.** `คิวเข้าหาลูกค้า` listed the same jobs
  again, row for row. Its panel is `hidden` rather than deleted, because
  `renderFieldService()` writes into `#fieldQueue` as an id global and would throw without
  it; `.field-layout` is now one column and the ปฏิทินเต็ม button moved into the remaining
  panel head. `.field-queue-panel[hidden]{display:none!important}` is needed because
  `.panel` has an author `display` rule that beats the UA `[hidden]` rule — the same trap
  as the `โมดูลทั้งหมด` grid in part 6.

### Tests

14 headless suites, **155 assertions, 0 failures, 0 JS errors**, at 1440×1000 and 390×844,
plus forced `prefers-reduced-motion` and `file://` runs. New this session:

- **y1 (8)** — permission decay: Admin holds 33 and Technician 13 across five consecutive
  reloads, every page still reachable, and a deliberately unticked permission is *not*
  resurrected by the repair.
- **y4 (10)** — the whole flow in one browser: QR → report → admin is notified → assign →
  technician notified → งานของฉัน → Field Service shows one panel.
- **y5/y6 (17)** — the new page: 8 cards, the machine card, the stagger indices, the real
  animation delays and travel, reduced motion, the news panel, no sideways scroll.
- **y7 (9)** — the QR/serial audit over all 40 machines, a machine with no data at all, and
  the duplicate-serial chooser.

### Open / risk

1. **The Home page still shows any machine to anyone who has its serial or QR.** Unchanged
   from part 11 and now easier to reach. Still the one deliberate decision worth revisiting.
2. `settings.portalNews` has no editor yet — an admin cannot add an announcement from the
   UI, only through the settings object.
3. `my-work` remains technician-only by design; an Admin holds no `mywork.view`.

### Follow-up (same day): white header, and the LINE / QR strip removed

Two changes to the customer Home page, both in `css/22-v69-customer-home.css`.

- **The header is white.** It was I-MODE blue with white type; it is now a white-to-#f7faff
  gradient with the type in the wordmark's own navy (`#0c225e` title, `#2b5fae` subtitle,
  `#6b7d9e` tagline), a hairline bottom border and a soft shadow. Everything css/01 sets
  for a dark ground is restated: the `×` becomes a light chip with dark type, and the white
  chip js/14 puts behind the logo (`.centry-portal-logo`) is neutralised — the wordmark is
  already navy on transparent, so on white the chip only showed as a box.
- **The green `หน้าหลักลูกค้า · ใช้งานผ่าน QR หรือ LIFF` strip is gone**, together with the
  LINE OA button inside it. `#portalLineIdentity` is **hidden, not deleted**:
  `renderCustomerPortal()` in js/03 and `updateLineIdentity()` in js/08 both write to it by
  id and would throw if it were removed — the same reason `#fieldQueue` is kept.

Suite z1, 14 assertions: the header background and all three text colours, the close chip,
the logo chip removed, the strip element still present but `display:none`, the LINE mini
button not visible, and the machine card / 8 action cards / no overflow unaffected.

### Follow-up (same day): the printed QR did not work on a customer's phone

Reported from the live GitHub Pages site: scanning a printed machine QR on a phone showed
**ไม่พบข้อมูลเครื่องจาก QR Code**.

`ensureMasters()` minted the token with `'QR-'+uid()` — **random, and generated
independently in every browser**. With no shared database, the office PC and the customer's
phone each invented a different token for the same machine, so a printed QR could never
resolve anywhere but the machine that printed it. Machine ids and serials come from
`js/02-demo-data.js` and are identical on every device, which is exactly why typing the
serial always worked and scanning never did. Verified with two fresh profiles: ids matched,
serials matched, tokens did not.

**`js/21-v69StableQrScript.js` (new)**

- `qrToken` is now **`QR-<machine id>`** — derived, so two devices compute the same value
  without talking to each other. Hung off a wrapper around `ensureMasters()`, which is
  where the random token was minted and which runs on every `renderAll()`, so a machine
  added on the Machines page gets a stable token as soon as it is saved.
- **QRs printed before this change must be reprinted**; their random token no longer
  resolves. Nothing that used to work stops working — no QR had ever worked on a second
  device.
- **A URL for the LINE rich menu**, which did not exist: `initPortalFromUrl()` only
  understood `?machineToken=` and `#/customer-portal`, both of which need a machine already
  chosen. Now `#/customer-entry` (or `?page=customer-entry`) opens the scan / serial page,
  and `?serial=<serial>` opens that machine's Home page directly — an unknown serial lands
  on the entry page with the box prefilled rather than on an empty form. It routes on
  DOMContentLoaded *after* js/11's `bootRoute()` has sent the session-less visitor to the
  staff door, because js/21 registers its listener later.

**Forced dark mode.** The phone repainted the white customer page dark and inverted the
machine photograph. `<meta name="color-scheme" content="light">` in index.html and
`:root{color-scheme:only light}` in css/22 — some Android browsers honour only one of the
two.

**Still true and worth repeating:** a machine the office *adds* does not exist on a
customer's phone at all, whatever its token, until Supabase is connected. Only the seeded
machines are shared. Also worth setting **ตั้งค่าระบบ → ตั้งค่า LINE OA → Public App URL**
(`lnPublic`) to the public site, or a QR generated from Live Server points at
`127.0.0.1:5500` and works on nothing but that PC.

Suite q2, 14 assertions: the token is derived from the id, two devices compute the same
one, device A's QR opens the Home page on device B with the right machine, both rich-menu
routes, the `?serial=` deep link and its unknown-serial fallback, and color-scheme pinned.
**16 suites, 183 assertions, 0 failures, 0 JS errors.**

### Follow-up (same day): the project is a git repository now

It was not one — every deployment meant uploading through the GitHub web UI and deleting
the stale files by hand, which is also how a renamed file (`customer-portal.html` →
`customer-home.html`) can end up served alongside its replacement.

- `git init` on `E:\ImodeService-main`, `user.email = service@imode.co.th`, branch `main`,
  one commit of all 80 tracked files. `.gitignore` was already correct (logs, backups with
  real customer data, credentials).
- Remote added, **nothing pushed** — the user asked for the commands rather than the push.
  `origin = https://github.com/ImodeService/ImodeService.git`
- Windows needed `git config --global --add safe.directory E:/ImodeService-main` first;
  E: does not record ownership and git refuses the repo without it.

**The live site is served from a sub-path**: `https://imodeservice.github.io/ImodeService/`,
not the domain root. Verified the whole app under that prefix with a rewriting test server —
boot, the 22 stylesheets, the customer page markup (not the fallback), the QR URL keeping
the prefix, `?machineToken=`, `#/customer-entry`, `?serial=` and the `./vendor/jsQR.min.js`
resolution all work, because every path in the project is relative. So the rich-menu link
is **`https://imodeservice.github.io/ImodeService/#/customer-entry`**.

Suite q3, 10 assertions, covers the sub-path deployment.

### Follow-up (same day): the Android Back button — `js/22-v69HistoryScript.js`

The application had **no routing at all** — `goPage()` only toggles `.page.active` and
nothing had ever touched `history`. On a phone the hardware / gesture Back button therefore
did the only thing left to it: leave the site. A customer who opened แจ้งปัญหาเครื่อง and
pressed Back lost the page; a technician who opened a module from the Home board left the
app.

**One history entry per screen, and nothing else.**

- The `goPage()` wrapper pushes an entry whenever the visible page actually changed. It is
  the **outermost** wrapper (js/22 loads last) because several earlier ones redirect —
  `customer-home` → `customer-portal`, `dashboard` → the first page a role may open — so
  the requested name is not always the name that ends up on screen.
- Detail views inside the customer Home page (แจ้งปัญหา, เช็คประกัน, ประวัติ …) never go
  through `goPage()`: js/08 swaps `#portalContent` and adds `.imode-portal-detail-mode` to
  the shell. A `MutationObserver` on that class is the choke point every path shares,
  including any added later.
- `popstate` leaves the detail view first (it is drawn *inside* the page, not instead of
  it), then restores the page.
- The portal's own ← button calls `history.back()` instead of returning home directly, so
  it consumes its entry rather than leaving a stale one behind.

**Deliberately not a router.** The URL never changes: pushing a path would 404 on a GitHub
Pages refresh and need a rewrite rule, and pushing a hash would fight `initPortalFromUrl()`,
which reads `#/customer-portal`. Every entry carries the same URL and a state object, which
is all Back needs.

**Boot replaces, it does not push.** The app routes itself several times while starting —
the QR guard, `bootRoute()` sending a session-less visitor to the staff door,
`initPortalFromUrl()` opening a scanned machine. Those would leave Back presses that appear
to do nothing, so until `load` + 500 ms every navigation `replaceState`s the single initial
entry. Measured: two entries at the login door, not five.

**Gotcha:** `window.imodePortalBackHome` is defined inside js/08's own DOMContentLoaded
`install()`, so it does **not** exist while js/22 is being parsed. Capturing it at parse
time silently produced a Back button that left the page but not the detail view — the first
version did exactly that. It is captured in `start()` instead, which runs after js/08's
listener because js/08 registered its one first.

Suites b1 (16) and b2 (17): module → module → Back through the staff Home board, sidebar
navigation three deep, the customer report form, **Back straight after submitting a case**,
the entry page → machine → Back, the portal's own ← arrow consuming its entry, and the boot
not stacking dead entries.

### Follow-up (same day): the result screen after reporting, and why the admin sees nothing

**1. The report result screen.** `submitPortalIssue()` replaced `#portalContent` with a bare
"รับแจ้งปัญหาแล้ว" and stopped there — a dead end with no way back and no sight of the case
just opened. `js/19` now wraps it (it is a top-level function declaration in js/03, so
`window.submitPortalIssue` and the binding the form reads are the same property, and
`openPortalIssueForm()` picks the override up when it wires the form). The screen now shows

- **✅ ทำรายการสำเร็จ** with the ticket number,
- **รายการแจ้งเคสของเครื่องนี้** — every case for that machine, newest first, with a status
  chip,
- **กลับหน้าหลัก**,
- and a `toastMsg()` confirmation.

**2. The photo-of-QR button is gone** from the machine-entry page, as asked, along with its
file input, its `decodeImageFile()` decoder and its styles. `vendor/jsQR.min.js` stays —
the camera path still needs it wherever `BarcodeDetector` is missing. The camera error
messages no longer offer the photo option.

**3. Why a case reported on a phone never reaches the admin — not a bug**

Measured on the live site: `localStorage.imode_v5_cloud` is null, `cloudSettings.url` is
empty, `supa` is null, the Settings badge reads **Local Mode**, and a fresh device has
`cases.length === 0`.

Every device keeps its **own** localStorage. The customer's phone writes the case to the
phone; the admin's PC reads its own copy. They never meet. Nothing in the frontend can fix
this — `submitPortalIssue()` already calls `cloudUpsertCase(c)` and `cloudUpsertLineRequest(req)`,
and both are no-ops while `supa` is null. Same device → same browser works and is covered by
suite y4.

The fix is to connect the database, in this order:

1. Supabase → new project, keep the **Project URL** and **anon key**.
2. SQL Editor → run **`supabase/00-tables.sql`** only.
3. In the app: ตั้งค่าระบบ → ฐานข้อมูล Cloud → paste both → **เชื่อม Cloud**.

**Do not run `02-rls.sql` yet.** Its policies grant insert `to authenticated` only
(lines ~158 and ~172), and part 12 removed customer accounts — an anonymous customer would
be denied and the portal would stop being able to open a case at all. Turning RLS on needs
that decision revisited first: either an explicit anon-insert policy for `service_cases` and
`line_customer_requests`, or moving the write behind `settings.lineConfig.backendEndpoint`,
which `sendPortalBackend()` already posts to.

Suite c2, 16 assertions: the photo button and its input are gone, the scan button and serial
box remain, the success banner with its ticket, the case list growing from one to two
reports, the status chip, the toast, and กลับหน้าหลัก returning to the Home page through the
new history entry.

### Follow-up (same day): the Supabase project state, measured

Project `service_Imode_test`, ref `ywlrlfudlxsallanoroq`. Probed over the REST API with the
publishable key the user supplied (the new name for the anon key; the app's placeholder
already reads `sb_publishable_...`).

| Check | Result |
|---|---|
| API URL | `https://ywlrlfudlxsallanoroq.supabase.co` — the user had been reading the **dashboard** URL, which is not it |
| The 11 data tables | all present, all empty (`00-tables.sql` was run) |
| `profiles`, `auth_audit` | present — so **`01-schema.sql` and `02-rls.sql` were run too** |
| Read | 200 everywhere, but that proves nothing: RLS filters rows, so a blocked read and an empty table look identical |
| Write | **`42501 new row violates row-level security policy`** on `service_cases`, `line_customer_requests`, `customers`, `machines` |

So RLS is on and its policies grant writes `to authenticated` only. Nobody in this
application is ever `authenticated` in Supabase's sense — customers have had no accounts
since part 12, and staff sign in against the local UAT registry, not Supabase Auth. **Every
`cloudUpsert()` would therefore fail silently** (it only `console.warn`s), which is worse
than staying in Local Mode.

Three ways out, in order of how much work they are:

1. **UAT now:** `alter table public.<t> disable row level security;` on the 11 data tables.
   Everything works immediately; anyone holding the publishable key can read and write, so
   no real customer data until this is revisited.
2. **Scoped anon policies:** the same posture as (1) but explicit — insert for `anon` on
   `service_cases` and `line_customer_requests`, read where needed.
3. **Production:** move the staff login to Supabase Auth (`auth/auth-supabase.js` is
   already written and switches on by itself once a URL and key are configured), which
   makes the `to authenticated` policies in `02-rls.sql` meaningful again, and add one
   anon-insert policy for the two tables a customer with no account has to write to.

Not run from here: disabling RLS is a security change on someone else's database and
belongs to the project owner. The test row used to prove the write path was deleted.

### Follow-up (same day): the shared database is live — `js/23-v69CloudConfigScript.js`

The owner disabled RLS on the 11 data tables (`Success. No rows returned` is the right
answer for `alter table`). Re-probed: **all 11 tables now accept writes** (201), reads work,
and the test rows were deleted again.

One thing still stood between that and a working flow. `cloudSettings` is read from
`localStorage.imode_v5_cloud` **per device** (js/03:189). Staff can type the URL and key
into ตั้งค่าระบบ → ฐานข้อมูล Cloud; **a customer scanning a machine QR on their own phone
never can**, so that phone stayed in Local Mode and the case it wrote never left it. That
was the actual reason a reported case did not reach the office.

`js/23` ships the connection with the application: if this device has no cloud config and
has not deliberately disconnected, it fills `cloudSettings` in before `initCloud()` runs in
the boot sequence. `disconnectCloud()` is wrapped to remember an explicit
ใช้ข้อมูลในเครื่อง in `imode_v69_cloud_optout`, and `saveCloudSettings()` clears it, so the
script never silently reconnects a device someone chose to take offline.

**The publishable key is in the repo on purpose.** It is public by design — every browser
that opens a configured app receives it. What protects the data is Row Level Security, and
RLS is off right now, so *anyone who reads the file can read and write this database*. That
is a deliberate UAT choice on a project named `service_Imode_test`; the header of js/23
says so, and says not to put real customer records in it until RLS is back on with policies
that match how people actually sign in.

**Verified end to end against the real project** (suite e2, 15 assertions, three separate
browser profiles):

customer's phone auto-connects → QR → แจ้งปัญหา → the case is in Supabase
(`SRV-…`, `assignee: null`) along with its `line_customer_requests` row → **the admin's PC,
a different profile, boots, syncs, and has the case**: the เคสใหม่รอมอบหมาย notification, a
row on มอบหมายงาน, and the ticket on the Service Cases page → assign → `assignee: T001`,
`status: มอบหมายแล้ว` back in Supabase → **the technician's phone, a third profile, sees it
in งานของฉัน**. Test rows deleted afterwards; the tables are empty again.

Harness note: `cdp.py` now sets `imode_v69_cloud_optout` on every test document, so the
other suites stay offline and never write to the live project. A suite that means to
exercise the cloud sets `cdp.CLOUD = True` first (e1, e2).

---

## Session Change Log — 2026-09-09 (part 15): the cloud was never actually writable

The user reported that after following the previous session's steps the data still did not
travel — open the link in a second browser and it is gone — and supplied
`supabase/imode-seed-2026-09-08T08-56-53.sql`, exported with `export-local-to-sql.js`.

### The seed file was never the problem

Checked before touching anything: every column the file writes exists in the live schema
(all 9 tables, including `"sourceOrder"`), it parses to 11 customers / 41 machines /
5 technicians / 3 cases / 40 warranties / 1 line request / 1 report / 1 quotation /
1 settings row, Thai text is intact, and `qrToken` is already the stable `QR-<id>` form
from js/21. The live GitHub Pages site was also already serving js/23 with the right URL
and key. Nothing on the application side was wrong.

### THE BUG: 02-rls.sql locked the database against the only role the app ever uses

Every policy in `02-rls.sql` is `to authenticated`. Nobody in this application is ever
authenticated with Supabase — customers have had no accounts since part 12, and staff sign
in against the local UAT registry in js/09. Every request therefore carries the anon key,
and the previous session's `disable row level security` had been undone (almost certainly
by re-running `02-rls.sql` while following the checklist).

Proved with a canary insert on all 11 tables: **`42501 new row violates row-level security
policy`, every one.**

Three things made it invisible, which is why two sessions were lost to it:

| | |
|---|---|
| `cloudUpsert()` | `catch(e){console.warn(e)}` — a rejected write is swallowed |
| a `select` under RLS | returns **HTTP 200 with zero rows**, not an error, so it cannot be told apart from an empty table — and `syncCloud()`'s `if(!c.error && c.data.length)` guards simply never fire |
| `initCloud()` | decides the connection is healthy on that read alone, so the badge said **"Cloud Connected" while nothing could be read or written** |

Corollary worth keeping: **a read returning 0 rows under RLS is not evidence the table is
empty.** An earlier probe in this session reported "all 11 tables empty" on exactly that
basis and could not actually distinguish the two.

### Fix

| File | What |
|---|---|
| `supabase/04-anon-uat.sql` | **new** — RLS stays ON; adds one `uat_anon_all` policy per table, `for all to anon, authenticated`, `using (true) with check (true)` |
| `js/24-v69CloudHealthScript.js` | **new** — a rejected write is no longer silent |
| `index.html` | one `<script src>` after js/23 |

Policies rather than `disable row level security`: identical access, but visible in the
dashboard and it **survives a re-run of `02-rls.sql`**, which drops and recreates only its
own `staff_all` / `customer_*` policies. That is the exact failure that just happened.

`js/24` replaces `window.cloudUpsert` — reimplemented, not delegated, because the original
catches internally so a wrapper can never see whether the write landed. It is the same
single statement plus an outcome record: one toast per session, the real reason written
into the settings page line, plus `imodeCloudHealth()` and `imodeCloudSelfTest()`, the
latter being the check that separates "empty table" from "not allowed to read it".
`supa` and `cloudSettings` are read by bare identifier — they are top-level `let` in js/03
and so absent from `window`.

### Seeding

Once the policy was in, the 104 rows were pushed **through PostgREST rather than the SQL
Editor** (a scratchpad script parsing the same .sql file into JSON and upserting with
`Prefer: resolution=merge-duplicates`): same rows, same upsert-on-id, no 145 KB paste to
hang the editor, and per-table confirmation of what landed. All tables verified afterwards.

### Verified end to end

A **fresh Chrome profile with no localStorage and no opt-out, against the live GitHub Pages
site**, downloads 41 machines / 11 customers / 3 cases / 5 technicians / 40 warranties /
1 quotation, and `?serial=1234` opens the customer Home page with 8 action cards and no
horizontal overflow.

The proof that this is really cloud data and not the local demo seed: **`เทสท์นา`
(IM-1234, serial 1234)**, a machine the user added by hand. It is not in
`js/02-demo-data.js`; it exists only in Supabase, and the fresh profile shows it.

Boot suite on the local build, desktop 1440×1000 and mobile 390×844: 0 JS errors,
25 pages, `#page-staff-login` active, portal section present, no horizontal overflow, both
V6.8 strings unchanged.

### Corrections to earlier notes in this file

- **`node` IS installed now — v24.19.0.** `node --check` works again and passed on every
  file in `js/`, `auth/` and `pages/`. Several earlier entries say it is unavailable.
- **The repository moved from `E:` to `G:`.** The old
  `git config --global --add safe.directory E:/ImodeService-main` no longer applies;
  `G:/ImodeService-main` was added.
- `git` is not on `PATH` in this shell — it is at `C:\Program Files\Git\cmd\git.exe`.

### Open / risk

1. **`04-anon-uat.sql` means anyone on the internet can read and write this database.** The
   publishable key ships in js/23 and that repo is public. Identical exposure to the
   previous `disable row level security`, now written down explicitly in the file header.
   Acceptable only as UAT on `service_Imode_test`. No real customer records until the staff
   login moves to Supabase Auth (`auth/auth-supabase.js` is written and self-enables) and
   `02-rls.sql` comes back with a narrow anon INSERT policy for `service_cases` and
   `line_customer_requests`.
2. The seed export contains real company names, addresses and phone numbers. It is
   correctly covered by `.gitignore` (`imode-seed-*.sql`) — keep it that way.
3. Pre-existing and untouched: `sw.js` does not exist, so `js/03:1639` logs a 404 on every
   boot. Harmless — the registration is `.catch(()=>{})` — but it is real console noise.
4. A machine added on one device now does reach the others, but only because that device
   can write. Nothing reconciles a conflicting edit; last write wins.

---

## Session Change Log — 2026-09-09 (part 16): Beta Service focus

Ten requested items plus the version rename. Four new patch scripts, one new standalone
page, and small edits to five existing files. No storage key renamed, no Supabase setting
touched, no existing function body rewritten.

| File | What |
|---|---|
| `service-case-detail.html` | **new** — the full-page Service Case workspace |
| `js/25-v70BetaScript.js` | **new** — beta technician records + the role-aware bottom bar |
| `js/26-v70CaseFlowScript.js` | **new** — response clock, assignment notice, status stepper |
| `js/27-v70RowClickScript.js` | **new** — the row is the button |
| `js/28-v70CaseDetailLink.js` | **new** — list to detail page, and `?page=` back |
| `index.html` | version strings, `data-perm` on เพิ่มนัดหมาย, 4 script tags |
| `js/06`, `js/09`, `js/10`, `js/12` | version override, 2 accounts, clickable identity block, permission repair |

### Version

`V6.8 Service focus` becomes **`Beta Service focus`**, in all four places it is written:
`<title>`, the sidebar `Version Beta`, the topbar `Service focus · Beta`, and the
sidebar rewrite inside `js/06` that runs on every render — editing the markup alone would
have silently reverted, the same trap as the technicians label in part 6.

### 1. `service-case-detail.html` — the case is a page, not a popup

A standalone document with its own scoped CSS and JS, opened as
`service-case-detail.html?caseId=<id>`. It does **not** reuse `css/01`; the theme tokens
are restated at the top of the file, which is what keeps it editable without touching the
application.

- **It reads real data.** `CaseDetailData` is a **read-only** adapter over the same
  localStorage keys the application persists to, so a case opened here is the real case.
  It never writes. `USE_CLOUD` is the Supabase seam (off); `USE_MOCK_DATA` is the third
  fallback and is used **only** when the id resolves to nothing, so the layout is still
  reviewable on an empty device — and it says so on screen when it does.
- Layout follows the approved reference: breadcrumb, case header (number, customer,
  status, priority, รับแจ้ง / ช่องทาง / ผู้ติดต่อ) beside an SLA card, the 6-step progress
  bar, 6 large action buttons, ปัญหาที่ลูกค้าแจ้ง (the strongest card) beside a large
  machine card, 5 compact module buttons, back link.
- **Customer Satisfaction is not one of the six steps.** It sits after ปิดเคส as an
  after-service item, and hold states (รออะไหล่, the field sub-status) are badges, never
  steps — a case waiting for parts is still at กำลังให้บริการ.
- **No standalone เอกสารเครื่อง card.** Machine documents belong inside
  ประวัติการบริการเครื่องนี้, per the brief.
- **Machine image priority is preserved** — own `m.photo`, then a family reference
  (labelled ภาพอ้างอิง, `object-fit:contain`), then No Image. A reference image is only
  displayed, never written back.
- **SLA is computed, not decorated.** New and unassigned uses the 30-minute response clock;
  scheduled counts down to the appointment; รออะไหล่ reads On Hold; with nothing to measure
  it says ยังไม่มีกำหนด SLA rather than inventing "On Time".
- Actions carry `data-action` and are named as the brief specifies
  (`assignTechnician`, `scheduleService`, `contactCustomer(channel)`, `openQuotation`,
  `openFieldService`, `changeCaseStatus`, `openMachineHistory` and the rest). They either
  open a panel on the page or hand off to the module that really does the job. **Nothing
  fakes a successful write.** `contactCustomer` opens `tel:` / `mailto:` when the customer
  has one and says what is missing when they do not; LINE says the Messaging API is not
  connected rather than pretending to send.
- Missing `caseId` gives a clean ไม่พบหมายเลขเคส state with a way back. It never throws.

### 2. The list opens the page — `js/28`

`window.imodeOpenCase` is the single seam every list already calls; it now navigates to
the page. **`openCaseDetail()` itself is deliberately not redirected** — `advanceCase()`
and several related lists reopen it as a popup mid-flow, and navigating away from those
would be a regression. `openCaseFromRow` and `imodeOpenAssignedCase` point at the seam.

Coming back, `?page=<module>` lands on that module (`?caseId=` and `?intent=` are
conveniences that no-op when the case is not on this device). js/21 keeps `customer-entry`.

### 3. The row is the button — `js/27`

Every master list lost its trailing button column; the row opens the record and the
buttons that were in it are cloned into the popup that opens.

Done by reading each rendered row **after the fact** rather than by rewriting ten row
templates in `js/03`: the button whose `onclick` matches the list's "open" action becomes
the row's activation, the rest travel to the popup, and the cell they lived in plus its
`<th>` are hidden. Nothing is invented, permission-dependent buttons (the quotation
button) keep working, and a button a later patch adds is carried along for free. A moved
button is skipped when the popup already offers the same `onclick`, so the warranty popup
does not end up with two แก้ไข.

Covered: cases, customers, machines, QC, warranty, petty cash, machine documents, spare
parts, quotations, service reports, purchase orders — table and mobile card.

**Buttons in a content column are left alone** — 🗺 Maps in the customer address cell and
ใบรับประกัน in the warranty เอกสาร cell are data, not the trailing action cluster.

### 4. Response clock on a new case — `js/26`

An open, unassigned `เคสใหม่` carries `⏱ ตอบกลับภายใน 30 นาที` plus a live countdown on
its own row (cases table, mobile card, and the มอบหมายงาน page). At **10 minutes** left
the chip and the whole row turn light red; past the deadline they turn deeper red and read
เกินกำหนด. Assigning the case stops the clock and clears the highlight — the clock measures
the office's response, not the repair. Configurable in `settings.slaResponse`
(`minutes`, `warnMinutes`); one 1-second tick updates text and two class names only, never
a re-render.

### 5. THE ASSIGNMENT NOTICE NEVER LEFT THE COORDINATOR'S PC

`notifications` is written locally and **`js/03` never uploads that table** —
`syncCloud()` downloads `notifications`, but there is no `cloudUpsertNotification` and
`cloudUpsert` is never called for it. So the notice written by `notifyAssignment()` in
js/16 existed only on the device that did the assigning. On the same device it worked,
which is why the existing suite passed.

Fixed by **deriving** the notice from the case instead of syncing a table: the case
already travels and its `assignee` is the whole message. `assignedNotices()` emits
`auto_assigned_<id>` for a technician's own cases while they are still at
`มอบหมายแล้ว` / `นัดหมายแล้ว`, so every device computes the same notice, it clears itself
once the technician starts the job, and a stored notice for the same case is de-duplicated.

### 6. Beta accounts

| Username | Password | Role | Technician record |
|---|---|---|---|
| `tech_test1` | `tech_test1` | Technician | `T-TEST-1` ช่างทดสอบ 1 |
| `R&D_test1` | `R&D_test1` | Technician - R&D | `T-RD-1` R&D ทดสอบ 1 |

R&D holds **exactly** the technician module set — it points at the existing
`Technician - R&D` role rather than a new permission list, so only the name differs.
`findAccount()` lower-cases both sides, so the username may be typed in any case; the hash
is of the exact string, so the **password stays case sensitive** (asserted). The two
technician records are seeded by `js/25` with the same one-time guard js/13 uses.

### 7. The mobile bottom bar is built from the role

It was five hard-coded buttons over `grid-template-columns:repeat(5,1fr)`.
`applyRoleVisibility()` hides a button whose page the role may not open, and a
`display:none` child is removed from the grid — which is why the reported phone showed a
bar with two buttons pinned left and an empty half.

Now: candidates filtered by the role's own permissions, 5 slots (the FAB costs one),
always ending in เพิ่มเติม, with the column count set inline from what is really visible.

- technician / R&D: งานของฉัน · หน้างาน · QC · ปฏิทิน · แจ้งเตือน · เพิ่มเติม
- admin: หน้าหลัก · เคส · ＋รับเคส · มอบหมาย · ปฏิทิน · เพิ่มเติม

Six columns on a 390px phone ellipsised the Thai labels, so `is-tight` drops the label to
7.6px at six or more.

### 8. Status goes one step at a time, and finished work does not vanish

- **The nine-value dropdown is a stepper.** A primary `ถัดไป: <next status>` button, a
  visual step strip, and รออะไหล่ as its own branch button. The main path **skips
  รออะไหล่** deliberately — waiting for parts is a branch, not a stage every job passes
  through. The full list is still there under เลือกสถานะเอง, because the workflow branches
  and a technician sometimes has to go back.
- The modal is rebuilt rather than wrapped (the dropdown is the thing being replaced), but
  **every id the save path reads keeps its name** — the `<select id="fieldStatusSelect">`
  is still there inside the disclosure — so `saveFieldStatus()` in js/03 runs untouched.
- **`renderFieldService()` drops any case at ปิดเคส**, which is what "the job disappeared"
  was: closing a job removed it from the technician's only screen. Closed jobs now sit in
  a collapsed งานที่ปิดแล้ว group.
- **`renderAll()` does not refresh งานของฉัน / มอบหมายงาน** — they are rendered only by the
  `goPage` wrapper in js/16 — so a status change made from either page left a stale list on
  screen. Both are re-rendered now when they are the active page.

### 9. เพิ่มนัดหมาย is hidden for a plain technician

One attribute: `data-perm="calendar.edit"` on the calendar button. `TECHNICIAN_PERMS` has
`calendar.view` but not `calendar.edit`, so a technician loses it while admins and team
leads keep it. `openScheduleModal()` already required the same permission.

### 10. The Home identity block opens the Dashboard

It is a real `<button>` with an `aria-label`, a focus ring and a `แดชบอร์ด ›` chip. On a
phone the sidebar is behind the drawer, so this was the only thing on the Home board with
nowhere to go. A role without `dashboard.view` is not dead-ended — the `goPage` wrapper in
js/12 sends it to the first page the role can open.

### THE PERMISSION BUG BEHIND "QC หายจาก sidebar ของ admin"

On a fresh profile the Admin / Coordinator role is correct — 33 permissions, `qc.view`
included — and the QC nav item, the roles editor and `saveRoles()` were all verified
correct in a browser. So the reported symptom was a **saved settings object that had lost
keys**, not a rendering bug; the same phone had also lost `dashboard.view` and `case.view`,
which is why its bottom bar had collapsed to two buttons.

`ADMIN_ADD` in js/12 only ever re-added the seven keys it introduced. The admin migration
now adds back the **whole documented Admin / Coordinator preset**, and `SCOPE_VERSION` is
bumped 3 to 4 so it runs once. It is add-only: a permission an admin deliberately unticked
is not in the preset either — asserted, along with stability across three reloads.

### Tests

Nine suites, ten headless runs, **195 assertions, 0 failures, 0 JS errors**, at
1440x1000 and 390x844 plus a forced `prefers-reduced-motion` run:

beta items — version, both new accounts, case-sensitive passwords, both bottom bars,
calendar button gating, identity block to dashboard (29) · permission repair against a
deliberately stripped copy of the reported state, including that a real untick survives
(12) · response clock at three ages, counting down, stopping on assign; the assignment
notice reaching the right technician and no one else; the stepper; closed jobs kept (28) ·
row click across every list, buttons moved into the popup, keyboard Enter, no duplicates,
survives a re-render (23) · the detail page from real data, 6 steps, 6 actions, 5 modules,
the adapter's named loaders, both error states (38) · round trip back into the app and the
390px layout (12) · regression: 19 pages, the machines pager, cases KPI, the QR popup with
two codes and one combined print button, stable QR tokens, `?serial=`, `?machineToken=`,
sign-out to the door (19 desktop + 19 mobile) · งานของฉัน through five status changes (8) ·
reduced motion (7).

`node --check` passes on every file in `js/`, `auth/` and `pages/`, and on the detail
page's extracted script.

### Harness note worth keeping

Give every headless Chrome its **own** `--remote-debugging-port` (bind port 0 and read it
back). Killing `chrome.exe` and reusing 9222 is not enough — a dying instance still owns
the port long enough for the next launch to attach to it, and the symptom is a page that
looks half-loaded with `window.imodeSignIn` undefined. Also: `websocket-client` sends an
`Origin` header that Chrome's DevTools endpoint rejects, so pass `suppress_origin=True`;
and wrap stdout with `line_buffering=True` or a piped suite writes nothing until it exits.

### Follow-up (same day): the cloud copy of settings was undoing every permission repair

Reported from a live browser: an **admin** got "คุณไม่มีสิทธิ์ใช้งานฟังก์ชันนี้" when
pressing **QC** in the machine popup, while QR and แก้ไข on the same popup worked and
QC เครื่อง was visible in the sidebar.

On a fresh profile everything passes, so the row in `system_settings` was read directly:

```
Admin / Coordinator  ->  31 permissions
  qc.view      true      <- why the sidebar looked fine
  qc.edit      FALSE     <- why openQcModal() denied it
  qc.approve   FALSE
v69RoleScope: 3
```

**Boot order is the whole bug.** js/12, js/16 and js/20 all repair `settings` at parse
time; a moment later `initCloud()` → `syncCloud()` does
`settings = mergeSettings(cloudCopy)` and **replaces the repaired object wholesale** with
the copy in `system_settings`, which still carried the stripped role and the old version
number. Every repair was correct and every repair was thrown away on the same page load,
which is why reloading never helped and why the previous session's `SCOPE_VERSION` bump
appeared to do nothing on this device.

`js/29-v70ModalHistoryScript.js` wraps `syncCloud` and re-applies the same three
migrations to what the cloud actually sent. When they change something it saves locally
**and pushes the corrected settings back up**, so the shared copy stops being wrong for
every other device too. It converges: the copy it uploads carries the current version
number, so the next sync leaves it alone. A fingerprint of the role permissions decides
whether anything really moved, so a sync that changes nothing never writes.

**No manual database edit was needed or made** — the first device to load the fixed build
repairs the row.

### Follow-up: one close button, and Back closes a popup

- **The QR popup had two dismiss buttons.** `openMachineQR()` in js/05 appended its own
  `✕ ปิดหน้าต่าง` row under the modal that already has `×`. Removed. Note this is not the
  ยกเลิก rule from 2026-09-05: a data-entry form's explicit Cancel button still stays.
- **A `‹` back button in the modal head**, left of the title, on every popup.
- **The phone Back button closes the popup instead of leaving the page.** js/22 gives every
  screen a history entry; a modal is a screen too. A `MutationObserver` on `#modal`'s class
  pushes one entry on the closed → open transition only — `openCaseDetail()` calls
  `openModal()` again for every tab, and those must not stack — and `popstate` closes it
  before js/22 restores anything else, so Back returns to the page the popup was opened
  from. `closeModal()` (the `×` and the new `‹`) calls `history.back()` instead, so the
  entry is consumed rather than left behind for a Back press that would do nothing.

### Follow-up: the case workspace has a back button

`service-case-detail.html` gained a `‹` at the top left. It calls `history.back()` when the
visitor came from the application — so the button and the browser's own Back do the same
thing and no entry dangles — and falls back to `index.html?page=cases` for a bookmark or a
pasted link that has nothing to go back to. At ≤640px the `☰` steps aside for it; both went
to the same place and two 40px buttons plus the brand and three tools do not fit 390px.

### Tests after the follow-ups

Three new suites — cloud settings repair (7), modal back button run at 1440 and 390 (16
each), detail page back button (9) — plus every earlier suite re-run. **243 assertions,
0 failures, 0 JS errors.**

### Open / risk

1. **A case row no longer opens the popup**; it leaves for `service-case-detail.html`. The
   popup code is untouched and still reachable from `openCaseDetail()` elsewhere, per the
   brief's "keep the legacy popup".
2. The detail page **reads** localStorage and cannot write. Every edit still happens in the
   application; the action buttons hand the visitor there.
3. `settings.slaResponse` has no editor — 30 / 10 minutes are the defaults in code.
4. The derived assignment notice covers `มอบหมายแล้ว` / `นัดหมายแล้ว` only. A case
   reassigned while already in progress is not re-announced.
5. Unchanged from part 11: the customer Home page still shows any machine to anyone who has
   its serial or QR.
