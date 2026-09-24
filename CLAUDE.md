# I-MODE Plus Service & Maintenance — Claude Code Project Memory

## Role

You are the coding agent for an existing project:

I-MODE Plus Service & Maintenance
Current release: Version 1.0  (see ## Version for the history)

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

**Version 1.0**  (no suffix, no "Beta")

Seven places carry it, and all seven must move together:

| Where | String |
|---|---|
| `index.html` `<title>` | `I-MODE Plus Service & Maintenance · Version 1.0` |
| `index.html` sidebar block | `Version 1.0` (the second line was removed) |
| `index.html` topbar brand | `Version 1.0` |
| `js/06-v68ModulesScript.js` (×2) | rewrites the sidebar block on **every render** (sets the text, removes the sub-line) |
| `service-case-detail.html` `<title>` and brand | its own copy — the page does not share `index.html`'s |

**Editing the markup alone silently reverts**, because `js/06` rewrites the sidebar version
block on every render. That trap has been hit twice.

History, because older entries in this file say otherwise: `V6.8 Service focus` until
2026-09-09 (part 16) → `Beta Service focus` → `Beta 1.0 Service focus full system` on
2026-09-10 → **`Version 1.0`** on 2026-09-24 (Beta and the suffix dropped for the move to the production server), each at the owner's request. An entry before all of them said "Service UAT",
which was wrong. **This section is the current one.** The change logs below record what
happened on a given day; they are not standing instructions.

Do not bump or rename the release — and in particular do not "restore" an older string —
unless explicitly requested.

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

Added later, same rules apply:

`imode_v69_cloud_optout`   set by ตั้งค่าระบบ → ใช้ข้อมูลในเครื่อง; while it is set, js/23
                           will not auto-connect this device to Supabase
`imode_v69_home_usage`     per-account tally that orders the Home quick board
`imode_v70_trash_blob`     recycle-bin payloads too large to travel inside `settings`
`imode_v70_pending_route`  **sessionStorage** — the page the visitor was heading for, kept
                           across the login door because js/28 spends the URL params first.
                           (`imode_v70_tab_authed` existed for one build on 2026-09-11 and was
                           removed again when the door became first-visit-only.)
`imode_v70_case_responded` the ตอบกลับแล้ว stamps recorded on this device, re-applied after a sync
                           that did not carry them, and the only way service-case-detail.html
                           (which never writes) can record one
`imode_v70_field_last_job` `{technicianId: caseId}` — the job each technician had open on หน้างาน
                           last, so opening the module again reopens it instead of re-picking by
                           appointment. Per device on purpose; losing it only changes which job
                           หน้างาน opens with

Clearing `imode_v69_session` signs the user out; clearing `imode_v69_local_pw` restores
the built-in UAT passwords; clearing `imode_v70_trash_blob` makes the large entries in the
bin unrecoverable but leaves their rows visible. None of them destroys business data.

**Two things now live inside `settings` rather than in a key of their own**, because they
have to reach every device: the login accounts (`settings.uatAccounts`,
`settings.uatAccountEdits`) and the recycle bin (`settings.trash`). `mergeSettings()`
spreads the saved object wholesale, so unknown top-level keys survive it — checked, because
a whitelist there is exactly what silently ate four permissions in an earlier session.

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

Added 2026-09-10 by `supabase/05-v70-operational-tables.sql`, already run:

qc_records
petty_cash
spare_parts
purchase_orders

Those four are **`{id, data jsonb, updated_at}` with the whole record in `data`**, unlike
every table above them. That is deliberate — see part 17 §3 — so do not "normalise" them
into columns without reading it first.

Added 2026-09-11 by `supabase/06-v70-case-media.sql` — **NOT YET RUN**:

`service_cases.media jsonb` and `line_customer_requests.media jsonb`, holding the photos and
clips a customer attaches to แจ้งปัญหา. `js/42` probes for the column once per session and
degrades to the old behaviour without it, so the application is unaffected until it is run —
the attachments simply stay on the device that reported the problem. Safe to re-run.

`notifications` is downloaded but never uploaded; there is no `cloudUpsertNotification`.
Addressed notices are derived from the case instead.

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
  pushes one entry on the closed → open transition, and `popstate` closes the popup before
  js/22 restores anything else, so Back returns to the page it was opened from.
- **Popups stack, and `‹` steps down one level.** QR, QC and แก้ไข are all opened from the
  machine popup, so back from them has to mean *that* popup, not an empty page.
  `openModal()` is wrapped: when it is called while a popup is already open it snapshots
  the outgoing title / sub / body / panel class, pushes it on a stack and adds a history
  entry. Going back restores the snapshot — no function is re-run and nothing needs to know
  which popup it came from. A snapshot is raw markup, so a half-filled form is not
  preserved; that is what "back" means, and the popup being returned to in practice is a
  static record detail.
  - `‹` (`imodeModalBack()`) goes one level down, or closes when it is the last one.
  - `×` means done with all of it: `history.go(-depth)` rewinds the whole stack, so one
    Back press afterwards leaves the page instead of reopening what was just closed.
  - **A tab switch is not a new screen.** `openCaseDetail()` calls `openModal()` again for
    every tab it draws; the title is what tells a re-render from a new popup, because a tab
    switch keeps it. Three tab renders still cost one Back press.

### Follow-up: the case workspace has a back button

`service-case-detail.html` gained a `‹` at the top left. It calls `history.back()` when the
visitor came from the application — so the button and the browser's own Back do the same
thing and no entry dangles — and falls back to `index.html?page=cases` for a bookmark or a
pasted link that has nothing to go back to. At ≤640px the `☰` steps aside for it; both went
to the same place and two 40px buttons plus the brand and three tools do not fit 390px.

### Tests after the follow-ups

Four new suites — cloud settings repair (7), modal back button at 1440 and 390 (16 each),
nested popups at 1440 and 390 (18 each), detail page back button (9) — plus every earlier
suite re-run. **279 assertions, 0 failures, 0 JS errors.**

The nested-popup suite walks the reported path exactly: machine popup → QR → back → the
machine popup with its buttons intact, the same for QC and แก้ไข, then a second back to
close; the phone Back button stepping the same way; `×` closing the whole stack and leaving
nothing that reopens it; and three case-detail tab renders still costing one Back press.

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

---

## Session Change Log — 2026-09-10 (part 17): searchable pickers, crop, teams, accounts, bin, tablet

Nine commits, `adf174d` … `466f906`. Nine new JS files, one new stylesheet, one new SQL
file. No storage key renamed, no existing function body in `js/03` rewritten, version
untouched.

| File | What |
|---|---|
| `js/33-v70AccountAdminScript.js` | account administration moves to Settings; the login popup becomes a switcher |
| `js/34-v70CustomerQuoteScript.js` | the customer Home page shows its own quotations |
| `js/35-v70ComboBoxScript.js` | `window.imodeCombo()` — type-to-filter over any `<select>` |
| `js/36-v70NavGroupsScript.js` | the sidebar sorted into six named groups |
| `js/37-v70ImageCropScript.js` | pick a photo, then crop it by hand |
| `js/38-v70TeamAssignScript.js` | a job can belong to several technicians, across teams |
| `js/39-v70AccountManageScript.js` | add / rename / re-password / delete any account |
| `js/40-v70TrashScript.js` | ถังขยะ, categories and a 30-day countdown |
| `js/41-v70OpsSyncScript.js` | QC, petty cash, spare parts and purchase orders reach every device |
| `css/23-v70-responsive.css` | tablet and phone corrections — **must stay the last stylesheet, like css/21** |
| `supabase/05-v70-operational-tables.sql` | the four missing tables — **run and confirmed** |

### 1. `window.imodeCombo()` — the pattern to reuse

Upgrades any `<select>` in place: a text box that filters, arrow keys, Enter to choose,
optional `allowCreate`. **The original `<select>` is kept, hidden, and stays the single
source of truth** — every save path here reads these controls by id as bare globals
(`saveMachine()` does `customerId: maCustomer.value`), so replacing the element would have
meant editing those functions. `pick()` sets `select.value` and dispatches a real `change`
event, so inline `onchange` handlers still fire and nothing downstream knows this exists.

Applied to `#maCustomer` (with create-a-customer), the Settings user picker,
`#onsiteMachineSelect`, `#qCase` and `#qCustomer`.

Three things that will break it:

- `required` has to move from the hidden `<select>` to the visible input. A `display:none`
  control that is `required` and empty makes Chrome refuse the submit **silently**.
- Where a render function rebuilds `innerHTML` on every pass — `renderOnsitePricing()`,
  `renderQuotations()` — apply the combo once (its own `dataset.comboOn` guard) and only
  `refresh()` afterwards. The list is built at open time from the live options.
- An empty first option is dropped from the list unless it carries `data-keep="1"`.
  "— เลือกเครื่อง / ไม่ระบุ —", "ไม่อ้างอิงเคส" and "เลือกลูกค้า" all need it.

### 2. Multi-technician assignment — and the wire format it needed

`c.assignee` **stays one id, the lead**. Fifteen places in `js/03` read it (dashboard
workload, calendar rows, service report header, the report popups) and none were touched.
`c.assignees` is the full list, lead first.

`service_cases` has no `assignees` column and `cloudUpsertCase()` sends an explicit
whitelist, so a new field would be dropped silently. **The list therefore travels inside
the `assignee` column as `"T001,T-LEAD-RD"`, lead first, and is split apart again on the way
in.** A single assignee is still written as plain `"T001"`, so nothing about existing rows
changed. Only two wrappers in `js/38` know this — `cloudUpsertCase` and `fromCaseDb`.

Cost, stated plainly: SQL read directly shows a comma list in that column. When a real
`assignees jsonb` column exists, delete those two wrappers; everything else already speaks
arrays.

Assigning a whole team is a **snapshot** taken at that moment, not a live reference.
`myCases()` in `js/16` and `autoPick()` in `js/32` match any assignee, not only the lead.

### 3. The four operational tables use jsonb, on purpose

`qc_records`, `petty_cash`, `spare_parts`, `purchase_orders` are `{id, data jsonb,
updated_at}` with the whole record in `data`. Every other table maps field-to-column with a
whitelist, which has twice meant a field added in JavaScript was dropped silently and nobody
noticed until a second device was involved. Nothing joins these four and nothing reports on
them in SQL. `system_settings` already worked this way.

Push is a **diff after `saveLocal()`**, not a hook on each save button: receiving a purchase
order also increments the part's stock, and the backup restore and clear-test-data buttons
rewrite all three arrays at once. Pull **merges by id with the newer `updatedAt` winning** —
replacing wholesale, the way `syncCloud()` does, would discard a QC written seconds ago and
not yet pushed.

`pettyCashEntries` / `sparePartsStock` / `purchaseOrders` are `let` inside the `js/04`
IIFE — **not globals of any kind**. `js/04` gained `window.imodeV67Data` (get/set) for this.
`qcRecords` is a top-level `let` in `js/03`, so it can be read *and assigned* by bare
identifier from another classic script.

If the SQL is ever missing, `js/41` recognises PGRST205 / 42P01, warns once and stops. The
application is unaffected — asserted before the tables existed.

### 4. Accounts are data now

`settings.uatAccounts` (created accounts) and `settings.uatAccountEdits` (changes to the
seven built-ins, keyed by original username, `{deleted:true}` for a tombstone). Inside
`settings`, so they sync — an account created on the office PC has to work on the
technician's phone. `mergeSettings()` spreads `raw` wholesale, so unknown top-level keys
survive it; checked, because a whitelist there is exactly what ate four permissions before.

**`js/09`'s `findAccount()`, `verify()` and `login()` all call its own closure
`allAccounts()`, not `window.uatAuth.allAccounts`.** Replacing only the window view leaves a
created account visible in every list and still unable to sign in — the same leak that let a
deleted customer account keep signing in. `js/39` therefore reimplements `verify` and
`findAccount` on `window.uatAuth`, and re-points `window.uatSubmitLogin` at
`window.imodeSignIn`; it called the closure directly and would have bypassed everything.

Refused, each with a reason on screen: deleting the account you are signed in as, deleting
the last account that can reach the screen, renaming the account you are signed in as
(`currentUser.id` is `UAT-<username>`).

### 5. THE BUG THAT MATTERED MOST: `window.<lexical global>` is always `undefined`

Top-level `let` / `const` in a classic script are **lexical globals and never properties of
`window`**. This file has recorded that for `currentUser` since part 5. Three more places
were doing it anyway, and each was silently dead:

| Where | Effect |
|---|---|
| `auth-integration.js` `checkSession()` — `window.currentUser` | `hadUser` permanently false, so `endSession('expired')` never fired. **The absolute expiry and the idle timeout were computed correctly and then never acted on. Sessions never ended.** |
| `auth-integration.js` legacy-migration branch | dead code |
| `js/11` `cfg()` — `window.settings` | always `{}`, so `lineOaUrl()` always returned `''` and `imodeLineAuth.configured()` was **false even with a LIFF ID set** — the LINE scaffold would have stayed inert the day IT supplied one |
| `js/11` `customerForLineUser()` — `window.customers` | always `null`; a LINE profile could never match a customer |

Grep for `window.` followed by any of `settings cases machines customers technicians
currentUser notifications quotations warranties machineDocuments serviceReports supa
cloudSettings qcRecords lineRequests` before believing any of them works. Clean as of this
session.

### 6. The `[hidden]` trap is closed for the whole project

An author `display` rule beats the UA `[hidden]{display:none}`, so `el.hidden=true` silently
does nothing and a button appears dead. Patched one element at a time three times already
(the โมดูลทั้งหมด grid, the Field Service queue panel, the assign panel). Probing everything
the scripts toggle found two more waiting to do it — `#fieldQueue` and `.trash-list` — so
`css/23` ends with `[hidden]{display:none!important}`. **Do not add a fourth one-off.**

### 7. `--window-size` does not give the viewport you asked for

Chrome on Windows clamps a window to about 500px, so `--window-size=390,844` produced a
**500px** viewport. Every "tested at 390px" claim before this session was really 500px, and
the app had never been checked at true phone width. Use
`Emulation.setDeviceMetricsOverride` instead. Half the responsive findings below only exist
under 500px.

### 8. Tablet and phone

Swept every module at 1440 / 1280 / 1024 / 820 / 768 / 430 / 390 / 360, measuring per
element whether content is wider than its box with nothing scrolling above it.
**Clipped elements 41 → 4**, and all four remaining are verified false positives: the
calendar sits inside a deliberate horizontal scroller, and the case-detail bell badge is
absolutely positioned to overhang its chip. No page scrolls sideways at any width, before
or after.

- **The measurement that matters is the content column, not the viewport.** The sidebar is
  208–286px, so at an iPad landscape 1024 the panels are 671px. `.qc-toolbar` (shared with
  petty cash) and the spare-parts toolbar are 3-column grids whose responsive rule fires at
  `max-width:1000px` — 24px too late, i.e. exactly an iPad in landscape.
- The spare-parts grid was an **inline style in `index.html`**, which beats every
  stylesheet, so that page had no responsive behaviour at all. It is `.toolbar-3col` now.
- `.machine-head-copy` (the 10/25/50/100 pager) is `flex:1 1 0%` beside buttons that are
  `flex:1 1 140px`, so below 900px it collapsed to as little as 27px around 269px of
  content, on six pages. It gets its own line.
- `.setting-icon` held "S/M/L" (55px) and "LINE" (47px) in a 42px box — the **card's grid
  track** was the real constraint, so both had to change.
- Tap targets under 28px raised to 32 on the language toggle, the staff-login back link and
  two links on the case detail page.

### 9. `settings.authConfig` — three values set live, not in code

- **`provider:'local'`.** On a cloud-connected device Supabase Auth becomes the only door,
  and only the three accounts from `03-users.sql` exist there, so **`lead_technical`,
  `lead_rd`, `tech_test1` and `R&D_test1` could not sign in on the live site at all** while
  the other three could. The `allowLocalFallback` switch that `auth-integration.js`
  documents **was never implemented — it exists only in that comment.** `provider` is
  implemented, so it is pinned. Undo by creating the four missing users in Supabase →
  Authentication → Users and clearing this.
- **`sessionHours:24` and `idleMinutes:1440`**, for a fair stand left running all day.
  Raising `idleMinutes` alone would have done nothing: the absolute lifetime kills the
  session first. Offline grace is still 7 days on top of that.

All three are pushed to `system_settings`, so every device picks them up on sync.

### 10. Recycle bin

`settings.trash` + `settings.trashRetentionDays` (30). Categories: case, document, account,
employee. Gated on **`settings.manage`, deliberately an existing key** — a script that
pushes a new key into `PERMISSION_CATALOG` must load **before `js/20`**, which repairs roles
against the catalog as it stands at that moment; `js/40` loads after it, so a new key would
be stripped from every role on every reload. `PAGE_PERMISSION` maps a page to an existing
key and is safe to extend.

A payload over 120 KB stays in a device-local overflow store (`imode_v70_trash_blob`) and
only its description travels. A deleted machine document can carry megabytes of base64, and
a few of those would bloat the `system_settings` row until settings sync broke for
everybody — a worse failure than losing an undo. That row says so on screen.

**Delete-forever on a built-in account drops the bin entry and KEEPS the tombstone.**
Clearing the tombstone is what restore does, so purging that way would resurrect the
account.

Cases had no delete anywhere in the application; one was added to the case edit form, gated
on `case.edit`. `deleteMachineDocument()` and `deleteRelatedEmployee()` **removed the row
locally and never touched Supabase**, so a deleted document came back at the next sync.
Both now delete the cloud row too.

### 11. A hang with no error

`js/36`'s `layout()` moves nav items with `appendChild`, which is reported as an
**addedNode**, so its own childList observer read that as "a nav item arrived" and called
`layout()` again — the two spun forever and the tab locked up silently, with nothing in the
console. It never fired until `js/40` added a nav item after `start()`. The observer is
disconnected around `layout()`: a MutationObserver only queues records while it is
observing, so our own moves are never recorded rather than recorded and filtered.

### Tests

330+ assertions across 20 runs at 1440×1000 and 390×844, plus the live site. New suites:
quotation combos (18), sidebar groups (13), cropping (20, plus 9 driving the drag with real
CDP mouse events), multi-assign (23, plus 13 cross-device against the live database),
account management (38 + 17), recycle bin (38), ops sync (15 + 11 live), the responsive
sweep and a code-health probe. Known-benign failures, unchanged: the `sw.js` 404, and
`my-work` bouncing for an admin who holds no `mywork.view`.

Two testing notes worth keeping:

- Drive animation and press-feel with **real CDP mouse events**, not `element.click()`. The
  crop overlay painted above `#modal` but sat at z-index 4000 against its 10000, so every
  pointer event landed on the form underneath and the frame would not drag. A screenshot
  could not have shown it.
- `auth_audit` answers **401** on every sign-in, because `04-anon-uat.sql` covers the eleven
  data tables and not that one. Console noise like the `sw.js` 404; the local audit ring
  buffer is unaffected.

### Open

1. **`04-anon-uat.sql` and `05-v70-operational-tables.sql` mean anyone on the internet can
   read and write this database.** Unchanged, deliberate, UAT only. `petty_cash` is the
   first of the new tables to carry financial figures.
2. The eleven customer records in the live database are **real companies** — pilot customers
   of I-MODE Plus itself, which the owner has confirmed is intended for the fair.
3. `notifications` is still downloaded but never uploaded; addressed notices are derived
   from the case instead (part 16 §5).
4. `renderFieldService()` in `js/03` still filters its queue by the lead only. It matters
   only when an admin previews a technician's queue from ทีมช่าง; the technician's own path
   goes through `js/32`, which was fixed.
5. A team lead still assigns only within their own team. Only an admin can build a
   cross-team crew.
6. `settings.portalNews` and `settings.slaResponse` still have no editor in the UI.

---

## Session Change Log — 2026-09-11 (part 18): customer photos, the quotation that never left, the technician's end of the job

Ten reported items. Five new JS files, one new SQL file, and small edits to four existing
files. No storage key renamed, no Supabase setting touched, version untouched.

| File | What |
|---|---|
| `supabase/06-v70-case-media.sql` | **new — MUST BE RUN ONCE** for item 1 to cross devices |
| `js/42-v70CaseMediaScript.js` | **new** — the customer's attachments are drawn, and travel |
| `js/43-v70QuoteViewScript.js` | **new** — ดูใบเสนอราคา + the missing ส่งให้ลูกค้า step |
| `js/44-v70TechFlowScript.js` | **new** — what happens when a technician finishes |
| `js/45-v70DoneJobsScript.js` | **new** — งานที่สำเร็จแล้ว |
| `js/46-v70LoginGateScript.js` | **new** — a password on every load and every switch |
| `js/01`, `js/32`, `index.html`, `service-case-detail.html` | the boot splash, three buttons, script tags, the attachment collector |

### 1. The customer's photos — two faults, either one enough to lose them

`submitPortalIssue()` has always put the attachments on the case as `c.media`
(`{name,type,size,data}`, `data` a data URL, max 4, shrunk by `js/30` to ~420 KB a photo).

- **Nothing ever drew them.** Not the หน้างาน workspace, not `openCaseDetail()`, not
  `service-case-detail.html` — its `loadAttachments()` walks `fieldStatusLog` and the service
  report and never the case itself. So even on the phone that reported the problem the photos
  were stored and invisible.
- **They never left the phone.** `cloudUpsertCase()` writes an explicit column whitelist and
  `media` is not in it. Probed against the live project:
  `column service_cases.media does not exist`.

`js/42` adds the column to the wire in both directions and draws the block on the หน้างาน
machine card and in the case popup, with a lightbox. **It probes for the column once per
session and only when a case actually carries media**; if the column is missing it warns in
the console and sends the case exactly as before, so not running the SQL does not break case
sync — it just leaves the photos device-local.

Found and fixed in the same area: `service-case-detail.html` stored a MIME type
(`"image/jpeg"`) on log attachments while every reader on that page compares against the bare
word `'image'`, so field-log evidence counted as neither photo nor video and drew as nothing.

### 2. Three buttons off the technician's screens

- **เตือนลูกค้า** off the หน้างาน action row. `sendCustomerReminder()` only writes a local
  notification addressed to nobody — it sends the customer nothing — so on the technician's
  own screen it read as an action that had happened. The function is untouched.
- **The `.context-link-bar`** (Service Case / ลูกค้า / เครื่องจักร / Google Maps / ประกัน /
  เอกสาร) off the *page* copy of the inspection sheet. Every one of those runs `closeModal()`
  — a no-op on a page — then navigates away, so a technician who tapped one mid-inspection
  lost everything typed in. The two popup copies keep theirs.
- **หน้างานช่าง** hidden from a technician's sidebar. The way in is งานของฉัน → tap the job;
  from the sidebar there is no job, so `autoPick()` silently chooses one. **Hidden for
  accounts with a `technicianId` only** — an admin previewing a queue from ทีมช่าง keeps it.
  `applyRoleVisibility()` rewrites `style.display` on every `[data-page]` from the permission
  alone, so this has to re-apply after it or the entry comes straight back.

### 3+5. ดูใบเสนอราคา — new module `quote-view`

Read, print, send, track. Filters: search / status / customer. Row → the real
`quotationDocHTML()` paper in a popup with พิมพ์ / สถานะ / แก้ไข / ส่งให้ลูกค้า. Gated on the
**existing** `quotation.view` key, so it registers nothing in `PERMISSION_CATALOG` and the
"must load before js/20" rule does not apply.

### 4. Why a finished quotation never reached the customer

Not a delivery failure. `saveQuotation()` stamps `status: 'ร่าง'` on every new quotation, and
`js/34` deliberately holds ร่าง back from the customer page so a half-finished calculation
never reads as an offer. Confirmed against the live database: **both rows in `quotations` are
`status: "ร่าง"`.** The only way off ร่าง was a status popup gated behind `quotation.approve`
and buried two clicks into a row.

The fix is the missing step, not a change to the rule: an explicit **ส่งให้ลูกค้า**, offered
as a prompt the moment `saveQuotation()` finishes and again on every draft row in the new
module. The rule that a draft stays private is unchanged.

**Two more bugs found by reading the live rows, both fixed in `js/43`:**

- `quotations.warranty` is a **text** column, so the boolean is stored as the string
  `"false"` — and `fromQuotationDb()` reads it as `!!q.warranty`, which for `"false"` is
  **true**. Every quotation that came back from the cloud claimed to be under warranty, and
  `quotationDocHTML()` zeroes every machine line when it is: the document printed 0.00 for
  the work under a correct Grand Total. The same expression drives the `warrantyMode`
  fallback. Repaired on the way in, so rows already in the database read correctly.
- `cloudUpsertQuotation()` has **no column for the derived breakdown** — `serviceFee`,
  `emergency`, `travel`, `pickup`, `labor`, `partsTotal`, `other`, `discount` are all
  dropped — so a quotation opened on any device but the one that built it was missing its
  Travel, Pickup, Labor and Other lines while the total still counted them.
  `imodeQuoteWithTotals()` recomputes them from the inputs that *are* stored, using js/03's
  own rate helpers. Nothing is written back and no schema changes.

### 6+7+10. The technician's end of the job

**The status contradicted the toast.** `saveServiceReport()` sets `c.status='รอส่งงาน'` —
"waiting to be submitted" — at the exact moment of submission, then says "จบงานแล้ว". The
report *is* the submission, so the case now moves on to **เสร็จสิ้น** and the coordinator
closes it from there. js/03 is not edited: the status is corrected immediately after the save
it belongs to, so the timeline entry, the report record and the cloud push all stay in the one
function that owns them. Only `รอส่งงาน` is touched — a case a coordinator parked at
รออะไหล่, or one already closed, is left alone.

**งานของฉัน holds only unfinished work.** `renderMyWork()` listed every case ever assigned and
merely sorted the closed ones to the bottom, so the list only grew. Closed work leaves it; the
fourth KPI tile becomes สำเร็จแล้ว and a link goes to the archive.

**After a successful submit the technician lands back on งานของฉัน**, which by then no longer
holds the job.

**`js/45` — งานที่สำเร็จแล้ว.** An account with a `technicianId` sees only cases that
technician is on (own crew included — `js/38` keeps the whole crew, not only the lead);
anyone else sees every closed case **plus a ช่าง filter**. Filters: search / ช่าง / ลูกค้า /
สถานะ / เดือน. Gated on **`field.view`, deliberately an existing key** — every technician role
and Admin / Coordinator already hold it.

There is no `closedAt` field and adding one would only apply going forward, so `updatedAt`
— stamped by every path that closes a case — is what the ปิดงาน column shows.

### 8+9. A password every time

- **8 was never a bug.** `bootRoute()` in `js/11` already sent a visitor with no session to
  the door, and still does. What kept the door open was the cached session: `currentUser` is
  restored from `imode_v5_current_user` on every load, and part 17 §9 raised
  `settings.authConfig` to `sessionHours 24 / idleMinutes 1440` for a demo stand left running
  all day. **That convenience is now withdrawn**: `js/46` clears the session at
  DOMContentLoaded — after `bootRoute()`, before js/03's `load` handler calls `renderAll()` —
  and routes to `#page-staff-login`. `js/01` no longer exempts a signed-in device from the
  boot splash, so the dashboard is never painted on the way past.
- **9.** `imodeQuickSwitch()` in `js/33` signed in with `password = username`, the documented
  UAT convention, so switching needed no password at all. `js/46` **replaces** it (there is
  nothing left of the old one to wrap) with a password prompt that goes through the same
  `ImodeAuth` call, so lockout, expiry and the audit trail are unchanged.

**What this costs, plainly:** a technician who reloads, or whose phone browser evicts the
tab mid-job, signs in again. Nothing saved is lost, but it is one more step every time.
Delete `js/46` and revert the one comment block in `js/01` to undo it.

Every customer URL is exempt before anything else in `js/46` runs — `?machineToken=`,
`?serial=`, `#/customer-entry`, `#/customer-portal`, `?page=customer-*`. That test is a copy
of the one in `js/01` and the two must be kept in step.

### Gotchas worth keeping

- **`renderMyWork` is reached three ways and only one goes through `window`.** js/16's own
  `goPage` wrapper calls its *closure* `renderMyWork()`, not `window.imodeRenderMyWork`, so
  wrapping the exported name alone misses the main path. Both `js/42` and `js/44` use a
  **MutationObserver on the element** instead, disconnected around their own writes — a
  MutationObserver only queues records while it is observing, so our own edits are never
  recorded, rather than recorded and filtered, which is what spun a nav observer into an
  infinite loop in part 17 §11.
- A top-level `function` declaration in a classic script **is** a window property, so
  replacing `window.saveServiceReport` changes what `serviceReportForm.onsubmit`'s bare
  identifier resolves to. Asserted by dispatching a real `submit` event rather than calling
  the function by name.
- A top-level `let` is **not**, and `currentUser=null` from another script works because
  assigning to an existing lexical binding is legal in strict mode — only creating an
  implicit global is not.

### Tests

Six headless runs, **141 assertions, 0 failures, 0 JS errors**, at 1440×1000 and 390×844
(`Emulation.setDeviceMetricsOverride`, not `--window-size` — part 17 §7):

- **boot (21)** — cold start reaches the door, admin signs in, both new modules register in
  the right sidebar group, all 19 existing pages still open, both version strings unchanged,
  a reload lands back on the door with the session cleared.
- **flow (45, run twice)** — the whole of items 1/2/3/4/5/6/7/9/10 in one browser: the
  attachment block and its lightbox in the case popup and on หน้างาน, the warranty coercion,
  the recomputed Travel and Other lines, a draft listed as unseen and then sent, หน้างานช่าง
  hidden for a technician, the closed case gone from งานของฉัน, เตือนลูกค้า and the context
  bar gone, submit → เสร็จสิ้น → back on งานของฉัน → present in งานที่สำเร็จแล้ว, a technician
  getting no ช่าง filter and an admin getting one, a wrong password refused on the switcher
  and the right one getting in, no horizontal overflow.
- **customer (12, run twice)** — a draft held back and a sent quotation appearing on the
  customer page, a machine QR still reaching the portal past the login gate with the splash
  released, and the media probe answering `false` with no cloud rather than throwing.
- **submit (6)** — the REAL form submit path, dispatched as an event, and a preview-only call
  leaving the status alone.

`node --check` passes on every file in `js/`, `auth/` and `pages/`, and on the detail page's
inline script.

### Open / risk

1. **`supabase/06-v70-case-media.sql` has not been run.** Until the project owner runs it in
   the SQL Editor, a customer's photos stay on the device that reported the problem. The
   display fix works everywhere immediately; only the transport waits on the column.
2. A submitted case now goes straight to **เสร็จสิ้น**, so `รอส่งงาน` is no longer reached by
   the field path at all. It is still in `settings.statuses` and still selectable by hand.
3. Requiring a password on every load undoes part 17 §9's all-day stand convenience, on
   request. `settings.authConfig.sessionHours` still governs a session's life *within* a page
   view; it no longer survives a reload.
4. Unchanged from part 11: the customer Home page still shows any machine to anyone who has
   its serial or QR.
5. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write
   this database. The new `media` column is covered by the same blanket policy.

---

## Session Change Log — 2026-09-11 (part 19): the admin permission that never came back, ตอบกลับแล้ว, and a requests page

Three reported items. Three new JS files, one new SQL file, and small edits to four existing
files. No storage key renamed, no Supabase setting touched, version untouched.

| File | What |
|---|---|
| `js/47-v70RolePresetGuardScript.js` | **new** — a drifted role is repaired on EVERY load, not once |
| `js/48-v70CaseResponseScript.js` | **new** — ตอบกลับแล้ว stops the response clock |
| `js/49-v70RequestsPageScript.js` | **new** — คำขอจากลูกค้า as a page of its own |
| `supabase/07-v70-case-response.sql` | **new — NOT YET RUN** — `service_cases.responded_at` |
| `js/26`, `js/28`, `index.html`, `service-case-detail.html` | one condition, one dead branch removed, script tags, the SLA card |

### 1. THE ADMIN PERMISSION BUG: every repair in the project refuses to run

Reported: signed in as Admin / Coordinator, pressing ทำใบเสนอราคา answers
"คุณไม่มีสิทธิ์ใช้งานฟังก์ชันนี้" — and the sidebar entry is gone too.

Measured in a browser: on a **fresh profile the role is correct** (33 permissions,
`quotation.view` and `quotation.create` present, `canPermission` true), and a **no-op save
through Settings → ผู้ใช้งานและสิทธิ์ preserves all 33** — so neither the role preset nor
`saveRoles()` is at fault. The fault is a saved settings object that has lost keys, the same
shape as part 14, part 16 and its follow-up. What is new is **why it never heals**:

| Repair | Why it declined |
|---|---|
| `js/12` `migrate()` | returns immediately when `settings.v69RoleScope === SCOPE_VERSION` |
| `js/16` `migrate()` | the same, on `settings.v69Work` |
| `js/20` `repair()` | restores only from `window.imodeSettingsSnapshot`, this device's own pre-boot copy — already stripped once the bad copy has been saved or synced down |

Reproduced exactly: strip `quotation.*` from the Admin role with `v69RoleScope` already at 4,
then reload three times — **31 permissions, `canPermission('quotation.create')` false and the
sidebar entry hidden, every time.** The version flag that was protecting a deliberate untick
was also making real drift permanent.

**`js/47` records the intent instead of gating on a version.** `saveRoles()` is the only way a
permission is ever turned off on purpose, so its wrapper writes down, at the moment of that
save, which preset keys the admin left unticked — **`settings.rolePresetOptOut`**. The repair
then runs on **every load and after every cloud sync**, adding back only preset keys that are
missing and not in that list. It is add-only and convergent: once a load has repaired the
roles the next one writes nothing, and the corrected copy is pushed back so the shared
`system_settings` row stops being wrong for every other device.

Things worth knowing about it:

- **Roles the application defines no preset for are skipped entirely.** `Technical Lead` and
  `R&D Lead` are seeded by js/13, and `permissionPresetForRoleName` falls through to its
  `['dashboard.view']` default for both — applying that to a hand-built role would be wrong.
  `hasPreset()` lists the names the preset function actually recognises. Asserted: both stay
  at 19.
- **A permission unticked *before* this shipped has no opt-out record, so it comes back once.**
  That is the deliberate trade — the reported state is indistinguishable from a deliberate
  untick until the first save records one.
- Consequence of applying the preset honestly: **`Service Manager` went 42 → 43**, gaining
  `mywork.view`. Its preset is "every key", and `allPermissionKeys()` grew after js/16
  registered that one.
- It registers nothing in `PERMISSION_CATALOG`, so the "must load before js/20" rule does not
  apply; it loads **after** js/20 and js/29 on purpose, so it sees the result of every earlier
  repair and its `syncCloud` wrapper is the outermost one.

**The ungated button, left as it is:** the `฿ ทำใบเสนอราคา` in `openCaseDetail()` is rendered
unconditionally (unlike `caseQuotationButton()`, which checks both keys), which is why the
symptom was a toast rather than a missing button. Telling someone they lack the permission is
better than silently hiding it, so it was not changed.

### 2. ตอบกลับแล้ว — the response clock had no off switch

`onClock()` in js/26 is true while a case is open, unassigned and still at `เคสใหม่`, so the
only ways off the clock were to assign the case or move its status. Neither is what happens
first: the coordinator rings the customer back inside the thirty minutes and the case stays
unassigned for hours while a technician and a date are found. So it counted down, went red,
and then counted up past เกินกำหนด for ever.

`js/48` adds the missing step rather than changing the rule. **js/26's edit is one condition**
(`&&!c.respondedAt`); everything else is new. The button appears inside the countdown chip on
the cases table, the mobile cards and มอบหมายงาน, in the case popup, and on the SLA card of
`service-case-detail.html`. Pressing it stamps `respondedAt` / `respondedBy`, stops the clock
and leaves a green `✓ ตอบกลับแล้ว <time>` chip. **The case is still unassigned, still เคสใหม่,
still on มอบหมายงาน — only the clock is settled.** Gated on `case.assign`, so no technician
sees it.

**Two things a plain field on the case could not survive, both found by testing:**

- `syncCloud()` does `cases = a.data.map(fromCaseDb)` — it replaces the array **wholesale** —
  so until the SQL is run a stamp made here is wiped by the next sync, which is worse than not
  travelling at all.
- `service-case-detail.html` reads and never writes, and **handing the visitor back to the
  application does not work any more**: js/46 requires a password on every load, so
  `?page=cases&intent=respond` is spent at the login door and lost. (That is true of the
  page's other hand-offs too — assignTechnician, scheduleService, changeCaseStatus,
  openQuotation all now cost a re-login. Not addressed here.) The `intent=respond` branch that
  was written for js/28 was deleted again once this was measured.

Both are answered by one small device-local key, **`imode_v70_case_responded`**
(`{caseId:{at,by}}`): the detail page writes an entry and updates its own card in place, the
application applies it to the case at boot and again after every sync, and it pushes only what
it really changed and only once the column exists. Deleting the key forgets which clocks were
stopped on this device; no business data is in it.

**`supabase/07-v70-case-response.sql` adds `responded_at timestamptz` and has NOT been run.**
Same degradation as js/42's media column: probed once per session, and the case is sent exactly
as before when it is missing, so case sync is unaffected — the stamp just stays on the device
that made it.

### 3. คำขอจากลูกค้า — a page of its own

Everything a customer sends already landed in `lineRequests` (แจ้งปัญหา, ขอราคา Service,
ขอราคา Warranty, เช็คประกัน) and already travelled through `line_customer_requests`. The only
list was **the last panel at the bottom of the Customers page**, under the customer table and
its pager, where nobody sees it. `js/49` is a new surface over data that already exists — no
storage key, no table, no new field.

- New page `requests`, **first in the งานบริการ sidebar group**, with KPI tiles
  (ใหม่ / กำลังดำเนินการ / เสร็จสิ้น / ทั้งหมด), search, type and status filters, a row per
  request with its photos counted, and a popup with the full detail plus the attachments
  through `imodeCaseMediaHTML()`.
- Actions reuse what already exists: เปิดเคส through the `imodeOpenCase` seam,
  `prepareServiceQuoteFromRequest`, `prepareWarrantyQuoteFromRequest`, `setLineRequestStatus`.
- **The nav entry carries a live count of คำขอใหม่**, because "ให้ขึ้นในนี้" is only true if
  the sidebar says so without being opened first.
- Keyed to **`line.view`, deliberately an existing key** — Admin / Coordinator and Service
  Manager hold it, no technician role does. A file that pushes a new key into
  `PERMISSION_CATALOG` must load before js/20, and this one loads after it.

### Gotchas worth keeping

- **js/26's `renderAll` / `renderCases` wrappers call its CLOSURE `decorate()`, not the
  exported `window.imodeDecorateSla`**, so wrapping the exported name alone never fires on the
  real path — the same trap `renderMyWork` set in part 18. js/48 wraps `renderAll`,
  `renderCases` and `goPage` as well, and keeps a 1s cadence as a backstop.
- **`imodeQuickSwitch` changes who is signed in without reloading the document**, and an open
  popup is not redrawn at all, so a button the new account may not use has to be **removed**,
  not merely not added. Caught by an assertion, not by reading the code.
- **Headless Chrome with no network stalls the parser on `index.html` for ever** — the Google
  Fonts `<link>` never resolves and the document stops parsing after `js/01`, with
  `readyState` stuck at `loading` and no error anywhere. Block `fonts.googleapis.com` and
  `fonts.gstatic.com` alongside the CDNs, or every suite times out looking like a boot failure.

### Tests

Three suites, five runs, **75 assertions, 0 failures, 0 JS errors**, at 1440×1000 and 390×844
(`Emulation.setDeviceMetricsOverride`, not `--window-size` — part 17 §7):

- **permissions (10)** — the fresh baseline; `quotation.*` stripped at the current version and
  healed on the next load with the sidebar entry back; a deliberate untick through the editor
  recorded in `rolePresetOptOut` and surviving a reload while the role's other preset keys
  stay; re-ticking clearing the opt-out and restoring the key; the two Lead roles untouched.
- **flow (24, run at 1440 and at 390)** — the countdown chip and its button, the stamp, the
  clock stopping, status and assignee untouched, the green chip, the clock staying stopped
  across a reload; the requests nav item, its badge, the page, its KPI counts, the row popup
  and the status filter; a technician seeing neither; all 21 pages still reachable, both
  version strings unchanged, no horizontal overflow.
- **detail page (17)** — the SLA card on the clock, the button, the card flipping to Responded
  **in place without leaving the page**, the mirror entry, the page still reading Responded on
  reload, the application applying the mirror on its next load, the mirror re-applying after a
  wholesale replace of `cases`, the popup path, and a technician getting no button anywhere.

`node --check` passes on every file in `js/`, `auth/` and `pages/`, and on the detail page's
inline script.

### Open / risk

1. **`supabase/07-v70-case-response.sql` has not been run.** Until it is, ตอบกลับแล้ว stays on
   the device that pressed it — correct and durable there, thanks to the mirror, but another
   device keeps showing the countdown.
2. `settings.rolePresetOptOut` only records what is unticked **from now on**. A permission an
   admin removed before this shipped is restored once on the next load.
3. Unaddressed, and now documented: **every hand-off from `service-case-detail.html` back into
   the application costs a re-login** because js/46 clears the session on every load, and js/28
   spends `?page=&caseId=&intent=` before the visitor reaches the door — so those intents are
   lost. Only ตอบกลับแล้ว was given a way around it.
4. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.
5. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write
   this database. The new `responded_at` column is covered by the same blanket policy.

### Follow-up (same day): the password belongs to the tab, not to every page load

Reported: "เวลากดปุ่มในหน้าเคสมันต้องล็อคใหม่ตลอด และพอล็อคอินมันก็กลับแดชบอร์ด ทำให้ทำงานไม่ได้",
with a screenshot of the six action buttons on `service-case-detail.html`.

**Measured, not guessed.** Nine exits driven in a browser, one at a time, from a signed-in
session:

| exit | landed on | session |
|---|---|---|
| มอบหมายงาน, นัดหมายบริการ, ทำใบเสนอราคา, เริ่มงานหน้างาน, เปลี่ยนสถานะ | `page-staff-login` | gone |
| the ‹ back arrow, the logo, the notification bell | `page-staff-login` | gone |
| ติดต่อลูกค้า, ตอบกลับแล้ว | stayed on the page | — |

**8 of 9.** The search box and the two `← กลับไปหน้ารายการ` links in the error states make it
10 of 11 exits. The two that survived are the only two that do not leave the document.

**Two causes, stacked.**

1. `service-case-detail.html` is a **separate document**, so every one of those buttons is a
   full page load — and js/46 clears the session on every page load. That was requested in
   part 18 and was harmless then, because nothing made a person walk back and forth between
   the application's two documents. Opening a case does exactly that.
2. js/28's `spendUrl()` deletes `?page=` / `?caseId=` / `?intent=` at `load` + 380 ms —
   **before the visitor can type a password** — so the destination no longer existed by the
   time they were through the door, and `submitStaffLogin()` fell back to the Home board.
   Measured: the query string is already empty while the login page is on screen. (This is
   also why the `intent=respond` branch added earlier in this session was deleted again.)

**The fix, to the owner's instruction — "ล็อคอินแค่ตอนเปิดหน้าเว็บครั้งแรก ก็คือตอนเปิดลิงค์ใหม่":**
`js/50-v70SessionScopeScript.js` makes the door **per browser tab** instead of per page load.

`sessionStorage` is that scope by definition, which is why the marker lives there and not in
`settings` or a cookie: it is created when a tab opens, survives reloads and same-tab
navigation between `index.html` and `service-case-detail.html`, and is gone when the tab
closes. Opening the GitHub Pages link — a new tab, a bookmark, coming back tomorrow — still
asks for a password; moving around inside the application no longer does.

- **`imode_v70_tab_authed`** (sessionStorage) is written by a wrapper on `imodeSignIn`, and
  only when a real session comes back — `{ok:false}` and a thrown error both leave it unset,
  so a failed attempt cannot open the tab. `imodeSignOut` and `uatLogout` clear it.
- **`imode_v70_pending_route`** (sessionStorage) holds the destination across the door. The
  stash runs on `DOMContentLoaded`, which is how it gets ahead of js/28's `load` + 380 ms
  `spendUrl()`; the wrapper on `imodeRoleHomeAfterLogin` — the one funnel every staff door
  uses — consumes it instead of going Home.
- **js/46 is not edited.** Its `DOMContentLoaded` gate cannot be unregistered, so js/50
  registers a later listener that puts the session back when the tab has already been through
  the door. All `DOMContentLoaded` listeners run in one task, so no paint happens in between
  and the login page never flashes. Delete js/50 and the part-18 behaviour returns exactly.

**What this gives up, plainly:** within one tab the session now survives a reload (F5), which
part 18 deliberately did not allow. **Known limitation:** opening the link in a second tab
while the first is in use signs the first one out too, because the gate clears the shared
localStorage session; recovering is one sign-in. Keeping the stored session alive instead
would leave a signed-in record for every other entry point to find, which is the thing part 18
removed.

**Tests.** Re-ran the same nine-exit audit: **0 exits force a re-login**, every one lands on
its real destination (`page-assign`, `page-cases`, `page-quotation`, `page-field-service`,
`page-notifications`, `page-dashboard`), and a deep link through the door now finishes on
`page-quotation` rather than Home. New suite t4, **18 assertions, 0 failures, 0 JS errors**: a
fresh tab meets the door with no session; the marker is written on sign-in; index → detail →
back keeps the session and lands on the case list; a reload in the same tab stays signed in; a
sign-out clears the marker and the next load is the door again; clearing `sessionStorage` —
exactly what a new tab looks like — puts the door back even with a stored session; a wrong
password does not mark the tab; and `?serial=` still opens a customer surface without ever
meeting the staff door.

**Harness note worth keeping:** a native `confirm()` freezes the page *and every
`Runtime.evaluate` with it*, so a suite hangs with no error and no output — it looks exactly
like a boot failure. `prepareQuotation()` can raise one. Auto-accept
`Page.javascriptDialogOpening` in every driver.

### Follow-up (same day): six items after the owner tested the build

| File | What |
|---|---|
| `js/51-v70Time24Script.js` | **new** — every time picker is 24-hour |
| `js/52-v70RecordActionsScript.js` | **new** — delete to the bin, and an explicit แก้ไข on a quotation |
| `js/46`, `js/50` | the front door is withdrawn; only the destination-keeping is left |
| `js/29` | `closeModal()` closes synchronously again — **30 buttons were dead** |
| `js/40` | two new bin types: `quotation`, `machine` |
| `service-case-detail.html` | the customer's photos fall back to the LINE request |

#### 1. "ล็อคอินแค่รอบเดียว ตอนเปลี่ยน Account หรือตอนเข้าเว็บครั้งแรก"

Part 18's gate cleared the session on **every page load**, which stopped being cheap the
moment a case became its own document. It is withdrawn at the source: `gate()` in js/46 no
longer runs, and a visitor with no session at all is sent to the door by js/11's
`bootRoute()`, which has always done that. The session's life is `settings.authConfig`
(sessionHours / idleMinutes) again. **js/46 part 2 is untouched** — switching account still
asks for the password every time, which is the half that was still wanted.

js/50 was written for the per-tab door and is now only the second half of that report: the
destination survives the door. `imode_v70_tab_authed` is gone; `imode_v70_pending_route`
stays.

#### 2. The customer's photos in the case detail

The display code was already right — asserted end to end, the popup and the page both draw
`c.media`. What the owner saw (`รูปภาพ 0 ไฟล์`) was a case reported **before
`06-v70-case-media.sql` was run**, so the photos never left the phone that reported them.
Both SQL files have since been run and verified by a round-trip write.

One real gap was closed while here: `service-case-detail.html` read `c.media` only, while
js/42 in the application also falls back to the matching `line_customer_requests` row —
`submitPortalIssue()` writes the attachments to both. So the same case could show photos in
the popup and none on the page. The page now reads `imode_test_v532_line_requests` and uses
the same fallback.

#### 3. 24-hour time — Chrome ignores `lang`

Measured side by side in a headless Chrome and screenshotted: the page is `<html lang="th">`,
and `lang="th"` and `lang="en-GB"` written **directly on the input** both still rendered
`02:30 PM`. A native `<input type="time">` / `datetime-local` is formatted from the browser's
UI locale and there is no attribute, no CSS and no setting that changes it.

So the visible control is ours: a native date box plus two selects, hours `00`–`23` and
minutes in 5-minute steps (a saved `:07` keeps its own option rather than being rounded).
**The native input stays in the DOM, hidden, keeping its id and its value** — every save path
reads these by bare identifier (`sDate.value`, `slaStart.value`) — and the control writes
`YYYY-MM-DDTHH:MM` / `HH:MM` back and dispatches a real `change`. Same shape as
`window.imodeCombo()`, and the same two traps: `required` is moved off the hidden input
(Chrome refuses the submit silently otherwise), and a MutationObserver re-scans after
`openModal()` replaces the body, disconnected around its own writes.

**Bug caught by the suite and worth keeping:** the listener that mirrors an external write
back into the control also fired on the control's *own* dispatch. Picking a date before an
hour leaves `input.value` empty, so the mirror read that back and wiped the date — nothing
could ever be entered. An `__t24Self` flag around the dispatch is the fix.

#### 4+5. Delete to the bin, and an edit on a quotation

`quotation` and `machine` are registered in **js/40's `TYPES`**, which is where that file says
a new deletable thing belongs — a type registered anywhere else goes into the bin and can
never come out, because the fallback `typeOf()` returns a restore that answers `false`. The
cloud row is deleted too, or `syncCloud()` puts the record straight back.

Buttons: 🗑 in the machine popup and the case popup (js/40's case delete in the edit form
stays), 🗑 in js/43's quotation document, and on each quotation row **✏ แก้ไข + 🗑 ลบ** —
appended after each render rather than by rewriting js/03's template. Deleting a machine that
still has cases states the count first; the cases are not deleted with it.

#### 6. THE ADMIN COULD NOT OPEN THE CUSTOMER PAGE — and 30 other buttons were dead too

Reported as "แอดมินควรจะดูหน้าหลักลูกค้าได้แต่ที่เทสมาดูไม่ได้". Measured: the
`📱 ดูหน้าหลักลูกค้า` button in the machine QR popup left the visitor on `page-machines`.

The cause is not about the portal at all. js/29's `closeModal()` did
`history.go(-depth); return` — **it returned without closing**, leaving the close to the async
popstate. Thirty call sites in this application are written `closeModal();goPage('quotation')`,
and every one of them broke the same way: `goPage` ran while the popup was still open, js/22
pushed an entry for the new page, and then the pending traversal arrived and js/22 restored
the page the popup had been opened from.

`closeModal()` now closes synchronously and decides about the history on the next macrotask,
when the click handler has finished and it is known whether it navigated. If it did, the
rewind is skipped — undoing the navigation it just asked for is worse than leaving a spent
modal entry in the history, whose only symptom is one Back press that does nothing before the
next one works. If it did not, the rewind is exactly as before.

#### Tests

**t5, 31 assertions, run at 1440×1000 and 390×844**, plus every earlier suite:

a first visit meeting the door and a reload *and a new tab* staying signed in while the
account switcher still demands a password · the attachment in the popup, counted on the page
and drawn as a thumbnail · a 24-hour control with the native input hidden behind it, hours
00–23, `required` moved off, and `2026-10-02T18:45` written back · ✏ แก้ไข and 🗑 ลบ on the
quotation row · a quotation and a machine deleted into the bin, listed there and **restored**
· the case popup's delete · the QR popup and the Customers-page button both opening the
customer page with its eight action cards, and the preview exiting cleanly · 21 pages still
reachable, the version string, no horizontal overflow.

#### Harness notes worth keeping

- A native `confirm()` freezes the page **and every `Runtime.evaluate` with it**, so a suite
  hangs with no error and no output — indistinguishable from a boot failure.
  `prepareQuotation()` raises one. Auto-accept `Page.javascriptDialogOpening`.
- Reading `DevToolsActivePort` can throw `EBUSY` while Chrome is still writing it. Retry
  rather than failing the launch.

#### Open / risk

1. Requiring a password only on the first visit is the owner's decision, reversing part 18.
   A device left signed in opens straight into the application until the session expires.
2. A record deleted into the bin has its cloud row deleted immediately; restoring pushes it
   back. A machine's cases, warranties, QC and documents are **not** deleted with it and will
   point at a machine that is gone until it is restored. The count is stated before deleting.
3. `closeModal()` followed by a navigation leaves one spent modal entry in the history, so the
   first Back press after such a button does nothing. The alternative was the button not
   working at all.

### Follow-up (same day): the customer's attachments on the case detail page

Reported from the page in the screenshot: the ปัญหาที่ลูกค้าแจ้ง card showed a grey box and
`＋ เพิ่มไฟล์`, not the photos the customer sent. `loadAttachments()` was already reading
`c.media` (and falling back to the matching `line_customer_requests` row) — what was wrong was
the drawing: three `background-image` tiles, un-clickable, with customer photos, field-log
evidence and service-report photos all mixed into one anonymous row, and a tile with no `data`
rendering as an empty grey box.

`service-case-detail.html` only (no other file touched, no storage key, no schema):

- **Two labelled blocks** in the problem card — `📎 ไฟล์ที่ลูกค้าแนบมากับเคส` and
  `🧰 หลักฐานหน้างาน / ใบตรวจ` — split by the `from:'customer'` flag `loadAttachments()`
  already sets. When the customer attached nothing the first block says so explicitly instead
  of leaving an ambiguous empty row.
- **Real `<img>` tiles, and every tile opens a lightbox** (Escape, backdrop click, a focused
  close button), the same treatment js/42 gives the application. This page is a separate
  document and does not load `css/*`, so the `.cmp-*` styles are restated in its own `<style>`
  rather than shared.
- A tile carries `data-media="<index into caseDetailModel.attachments>"`, handled in the
  existing delegated click listener next to `data-contact`. A data URL is tens of thousands of
  characters and never goes into an attribute.
- `attachmentsHTML()` — the `📍 ดูทั้งหมด` panel — reuses the same blocks, so those tiles are
  clickable too. The `📷 / 🎬` counts and `＋ เพิ่มไฟล์` are unchanged.

**Layout, to the owner's follow-up** (`เอารูปที่ลูกค้าแนบมาไว้บริเวณกรอบสีแดง และรายละเอียดปัญหาไว้ในกรอบสีเขียว`):
the two swapped places. `📝 รายละเอียดปัญหา` is now a panel of its own directly under the card
head, holding the issue text that used to be a bare `<h3>`; the attachments took the row below,
where `＋ เพิ่มไฟล์` used to sit alone — the button moved to the end of that same row, which is
where the original design had it. `mediaTiles()` returns bare tiles and the caller owns the
`.cmp-grid`, so the button can share the grid with them.

Suite: 22 assertions in headless Chrome over http at 1440×1000 and 390×844 — the block, its
label, one tile per attachment, the `<img>` actually decoding (`naturalWidth>0`), the video
tile marked, the field-evidence block kept separate, the counts unchanged, the lightbox opening
on a real image and closing, the panel tiles, a case with no attachments saying so, the
`line_customer_requests` fallback still drawing, and no horizontal overflow. `node --check`
passes on the page's extracted inline script.

### Follow-up (same day): js/42's transport half had never worked — `media` was dropped at the payload

Reported: the case page still said `ลูกค้าไม่ได้แนบรูปหรือวิดีโอมากับเคสนี้`. Measured against
the live project rather than guessed: `service_cases.media` **exists** (06 was run) and the
reported case really holds `media: []`, on both the case row and its `line_customer_requests`
row. So the display was telling the truth — the photos had never arrived.

Driven end to end in a browser (the portal form, a real file put on `#piMediaInput` with
`DOM.setFileInputFiles`, a real `submit` event): localStorage held **2** attachments on the case
and on the request, and the row that reached Supabase held **0**.

**`cloudUpsertCase()` (js/03:1630) does not forward the object it is handed.** It builds an
explicit snake_case payload column by column, and `media` is not one of them — the same
whitelist that part 17 §2 had to route the technician crew around. js/42 was adding `media` to
a *copy of the case* and handing that to the base function, which then built its payload from
scratch and dropped it. `cloudUpsertLineRequest()` is written the same way, so both halves were
silent. Nothing in the console: `cloudUpsert()` succeeded, it just carried one field fewer.

**Fix, in `js/42-v70CaseMediaScript.js` only.** The value is injected into the **payload** at
`cloudUpsert(table,obj)` — the single funnel every table write passes through — keyed by the
row id the payload always carries. The two upsert wrappers register `id → media` immediately
before calling the base function and remove it immediately after; JavaScript is single threaded
and the base awaits `cloudUpsert` inside that window, so no unrelated write can pick it up. The
column probe is unchanged, so a project without `06-v70-case-media.sql` still degrades quietly.

Restating js/03's whitelist inside js/42 would have been the obvious alternative and is exactly
what caused this: **a field added to a case object never reaches `service_cases` unless
`cloudUpsertCase` names it.** Worth checking before adding any new case field.

Verified against the live project, then the four probe rows were deleted: before the fix a
portal report wrote `media: []`; after it, `media` carries both files on the case **and** the
request; and a **fresh browser profile — a second device — downloads the case with both
attachments and the detail page draws them** (`naturalWidth>0`). The 22-assertion detail-page
suite still passes, and `node --check` passes on every file in `js/`, `auth/` and `pages/`.

Note for existing data: cases reported **before** this fix have no photos in the database at
all. They cannot be recovered from another device — they are still on the phone that reported
them, and only there.

### Follow-up (same day): the customer can open a case from ประวัติ Service — read only

Requested: `หน้านี้คือประวัติการแจ้งเซอร์วิสของลูกค้า อยากให้เปิดดูประวัติ รายละเอียดของแต่ละเคส
แต่ไม่สามารถแก้ไขได้ ดูได้อย่างเดียว`.

`showPortalHistory()` (js/03) printed one flat `.portal-history-item` per case — ticket, date,
status, issue line — and nothing opened. Everything a customer would want next was already
stored and had no surface here: the case's `fieldStatusLog`, and its service report's
diagnosis, work performed, recommendation, parts and next PM.

| File | What |
|---|---|
| `js/53-v70PortalCaseViewScript.js` | **new** — the history rows open a read-only case view |
| `index.html` | one `<script src>` after js/52 |

- `window.showPortalHistory` is replaced **at parse time**, so js/08's `install()` — which runs
  at DOMContentLoaded — wraps *this* version and the view keeps the portal's detail-mode
  header, machine-context strip and back arrow for free. js/03 is not edited.
- The rows are real `<button>`s (`data-pcv-case`), opened through one delegated listener so a
  row rendered by any later patch still works.
- The case view shows: วันที่แจ้ง / สถานะ / ประเภทงาน / ความเร่งด่วน / ช่องทาง / นัดหมาย,
  ปัญหาที่แจ้ง, **the files the customer themself attached** through `imodeCaseMediaHTML()` —
  js/42 owns that block and its lightbox, one implementation for both audiences — a
  ความคืบหน้างาน timeline from `fieldStatusLog`, and ผลการให้บริการ from the service report.
  A section with nothing in it is omitted rather than printed empty.
- **Read only is a property of the code, not a promise.** The file renders and nothing else:
  no form, no input, no save call, and it never assigns to `cases`, `serviceReports`,
  localStorage or Supabase. Asserted both ways — zero `form/input/select/textarea` in the view,
  and the case JSON byte-identical before and after opening it.
- While a case is open the header's back arrow returns to the **list**, not to the portal home.
  Derived from the DOM (`[data-pcv-back]` present) rather than from a flag, so it cannot go
  stale, and registered in a DOMContentLoaded listener after js/08's and js/22's so it ends up
  outermost.
- Styles are appended as a `<style>` at runtime, the way js/10 and js/16 do: `css/21` and
  `css/23` have to stay the last two `<link>`s and a new stylesheet would have to follow them.

**The `const` trap, again.** The first version printed raw ISO strings — `fmt` and `fmtDay`
(js/03:254) are `const` arrow functions, so `window.fmt` is `undefined` and the
`window.fmt ? … : raw` fallback silently took the raw branch. Read by bare identifier. The list
of lexical globals in part 17 §5 covers `settings`/`cases`/`currentUser`…; **`fmt`, `fmtDay`
and every other `const` helper in js/03 belong to it too.**

**Harness note worth keeping:** setting `imode_v69_cloud_optout` on a *fresh* profile is too
late — js/23 ships a cloud config with the app, so the first boot connects and writes
`imode_v5_cloud`, after which the opt-out is never consulted again. A suite that seeds cases
must clear **both**, or `syncCloud()` replaces `cases` wholesale a second later and the seeded
rows vanish mid-test. That cost a round of false failures here.

Suite pcv, **22 assertions, run at 1440×1000 and 390×844**, 0 failures: the rows are buttons
with a status chip, the case opens with its facts, the progress timeline, the report, the parts
and the next PM, the view-only line, no editable control anywhere, only the back button (and
the attachment tiles) clickable, the customer's own attachment drawn and decoding, back
returning to the list from both the in-page button and the header arrow, a second back leaving
to the portal home, the case unchanged, and no horizontal overflow. Boot smoke test: 29 pages,
0 page errors, both version strings unchanged. `node --check` passes on every file in `js/`,
`auth/` and `pages/`.

---

## Session Change Log — 2026-09-12 (part 20): pushed, and a customer form sends once

Everything above since `d52bfab` was committed and pushed as **`460fa4a`**, and GitHub Pages
was confirmed serving the fixed js/42 and the new js/53.

Measured before the push, worth keeping: **all 17 rows in `service_cases` and all 18 in
`line_customer_requests` held `media: []`.** No customer attachment had ever reached the
database, because the live site was still running the js/42 without the payload fix. Photos
from cases reported before `460fa4a` are not recoverable from any device but the one that
reported them.

### `js/54-v70SubmitOnceScript.js` — rapid taps made duplicate cases

Reported: "เวลาลูกค้ากดปุ่มส่งเคสรัวๆ เคสมันจะส่งรัวๆ แทนที่มันจะมา 1 เคสแต่มันมา 2".

The three customer forms that create a record — `submitPortalIssue`,
`submitPortalServiceQuoteRequest`, `submitPortalWarrantyRequest` — are async in js/03 and
unshift the record and `saveLocal()` **before** awaiting up to three network round trips. For
that whole wait the form stays on screen with a live button, so each tap was a new record with
a new id and ticket. Reproduced with the network slowed to 1.5 s: **3 taps → 3 cases / 3
requests on each of the three forms.**

js/54 wraps all three (loaded last, so outside js/19's wrapper; all three forms resolve the
window property when they bind or fire). The first submit marks **the form element**
`data-imode-sending`, disables its submit button and relabels it `⏳ กำลังส่ง…`; a further
submit of the same element is swallowed with `preventDefault` (without it the browser falls
back to a native submit and reloads). A reopened form is a new element, so a deliberate second
report still goes through; a `submit` event only fires after the required-field check, so an
incomplete form is never locked; and if the form is somehow still on screen when the submit
settles, it is released rather than left dead. js/03 is not edited.

Suite once, at 390×844 and 1440×1000: 3 taps → exactly 1 record on each form, the button
disabled and reading กำลังส่ง while sending, the success screen replacing the form, a reopened
form still submitting, an empty required field not locking the form, no overflow, 0 page
errors — **46 assertions, 0 failures**, plus the 8-assertion reproduction with js/54 blocked.

---

## Session Change Log — 2026-09-14 (part 21): the case page can write, and twenty other things

Three commits — `f27b5d2`, `ffd271c`, `bc2ff04` — all pushed and confirmed live on GitHub
Pages. Six new JS files, edits to nine existing ones, and one change that invalidates
something this file has said since part 16.

### ⚠ CORRECTION TO EARLIER ENTRIES IN THIS FILE

**`service-case-detail.html` is no longer read-only.** Part 16 §1 says "It never writes",
part 19 says "reads and never writes", and the part-19 follow-up repeats it. As of this
session the page **writes the case status** — locally and to Supabase. The owner was asked
and chose this over handing every click back to the application.

What it actually does now, and the rules that keep it safe:

- **As of 2026-09-15 it also writes the assignee** (part 22 §2) — `CaseWrite.setAssignees()`,
  which is the มอบหมายงาน button. The crew crosses the wire as js/38's comma list in the one
  `assignee` column.
- `CaseWrite.patch()` rewrites the one case inside `imode_test_v532_cases`, then sends only
  the columns that changed with **`update()`, never `upsert()`** — an upsert whose payload
  does not name every column blanks the rest of the row, and `cloudUpsertCase`'s whitelist
  is not available here.
- The connection is read from `imode_v5_cloud`, which js/23 writes on this device the first
  time the application boots. A `<script src="…supabase-js@2">` tag was added to the page.
- With no cloud config the local write still happens and the toast says **the change has not
  left this device** rather than claiming success.
- Nothing else on the page writes. The `ตอบกลับแล้ว` mirror from part 19 is untouched.

**A trap this exposed, worth keeping:** the page's data adapter (`all()` in section 2) reads
storage **once and keeps it**. That is right for a page that only reads and wrong the moment
it writes — the first version saved correctly and then re-rendered from the cached copy, so
the screen never changed. `CaseDetailData.refresh()` clears it and every write calls it.

### 1. Deletes, permissions, the customer's quotation (`f27b5d2`)

- **ปุ่มลบเคสในหน้าเคสเต็มหน้า** — in the footer, not in the six-button action bar. It hands
  the case to the application with `intent=delete`; js/28 and js/50 call the existing
  `imodeDeleteCase()`, which confirms and checks `case.edit`, so a URL carrying that intent
  can neither delete silently nor delete without the permission.
- **สิทธิ์รายบุคคล actually did nothing** — `js/55` (new). Measured: the ROLE side was correct
  all along. Every checkbox on an individual card started **unticked whatever the account
  really held** (js/20's clone ticks `settings.userPermissions[key].permissions`, which is
  empty until somebody saves one), and the card is consulted only when its toggle is on. So
  unticking changed nothing, twice over. Cards are now seeded from the role, any edit switches
  individual mode on with a line saying so, and a seeded-but-untouched card is put back to
  empty just before `saveRoles()` collects it — nothing new is persisted for accounts nobody
  edited. It also refreshes `window.imodeSettingsSnapshot` after a save, closing the path
  where unticking and then pressing ซิงก์ Cloud brought the permission back from the pre-boot
  copy.
- **ลบลูกค้า** — `customer` registered in js/40's `TYPES` (the only place a deletable thing may
  be registered), delete button in the customer popup gated on `customer.edit`. It states how
  many machines / cases / quotations are attached first, deletes the cloud row, and refuses
  บริษัท ไอโมด พลัส จำกัด because `ensureInternalCustomer()` re-creates it.
- **ลูกค้าเปิดดูใบเสนอราคาได้** — `js/56` (new). The rows on ใบเสนอราคาของฉัน become buttons
  that open the real `quotationDocHTML()` paper inside the portal, through js/43's
  `imodeQuoteWithTotals()` so a cloud-loaded quotation keeps its Travel / Pickup / Labor lines
  and is not zeroed by the `warranty:"false"` string. Printing is the existing
  `printQuotation()` — the paper carries `#quotePreviewDoc`, so Save-as-PDF works with no new
  code. Scope is **re-checked on open**, not trusted: the quotation must belong to the scanned
  machine's customer and must not be ร่าง. js/34 gained one attribute and nothing else.

### 2. The quotation carries its case number (`ffd271c`)

Two faults that looked identical on screen. Measured on every route in, reading the `<select>`
and the visible combo box separately:

| route | select | visible box |
|---|---|---|
| `prepareQuotation(caseId)` | CASE-Q1 | **empty** |
| `?page=quotation&caseId=` | CASE-Q1 | **empty** |
| `prepareServiceQuoteFromRequest` (แจ้งปัญหา) | **empty** | empty |
| `prepareServiceQuoteFromRequest` (ขอราคา) | empty | empty |

1. **js/35 — the combo never followed a programmatic `.value`.** Assigning it fires no event,
   and `prepareQuotation()`, `loadCaseIntoQuote()`, `resetQuote()` and `renderQuotations()` all
   set these selects directly. Rather than refresh at a dozen call sites in js/03 and miss the
   next one, **`value` is shadowed on the element itself**, delegating to the prototype
   accessor and resyncing the input afterwards. Reads are unchanged and every combo in the
   project is covered — `qCase`, `qCustomer`, `maCustomer`, the Settings user picker, the
   onsite machine picker. `selectedIndex` is not shadowed; nothing here assigns it.
2. **js/57 (new)** — `prepareServiceQuoteFromRequest` / `prepareWarrantyQuoteFromRequest` never
   touched `qCase`, though `submitPortalIssue()` records the case it opened as `req.caseId`.
   Only the reference is applied; `loadCaseIntoQuote()` is deliberately not re-run, because the
   request has already filled the form with what the customer asked for.

A ขอราคา / ขอต่อ Warranty request still leaves the field empty, because those write a
`lineRequests` row and **no case at all**. ไม่อ้างอิงเคส is the true answer there.

### 3. Twelve requested changes (`bc2ff04`)

| # | where | what |
|---|---|---|
| 1+2 | `js/36` | a **รายงาน** group holding รายงาน + สต๊อกอะไหล่; **ราคาและค่าใช้จ่าย** moved to sit directly after งานบริการ |
| 3+4+9+11 | `js/49` | the requests inbox |
| 5 | `js/40` | the bin's category buttons and a page size |
| 6 | `js/58` (new) | the same for ศูนย์แจ้งเตือน |
| 7+8+12 | `service-case-detail.html` | clickable status circles, split status/edit buttons, case age |
| 10 | `js/16` | the whole bar on มอบหมายงาน opens the picker |

**The group ids in js/36 are an API.** js/43, js/45 and js/49 insert their own page by id
(`'service'`, `'money'`), so a group may be re-ordered and renamed but never renumbered away.
Removing สต๊อกอะไหล่ left คลังและทีมงาน with only ทีมช่าง in it, so it is named **ทีมงาน** now.

**The requests inbox (js/49).** A live `รอมาแล้ว d hh:mm:ss` chip on every row, updated by one
1-second tick that touches only those spans — the list is never re-rendered for the clock, so a
half-typed search and the scroll position survive. A show-how-many control beside the type and
status filters. Every text size went up a step. The **สถานะ** button is gone.

**"เคสไหนเปิดแล้วให้เอาออกจากหน้าคำขอ" could not be taken literally** and the owner was asked.
`submitPortalIssue()` opens a case the moment the customer sends the form, so every แจ้งปัญหา
carries a `caseId` from birth — hiding on that test would have emptied the page of problem
reports entirely and left only quote requests. The test is whether the case has **moved off
`เคสใหม่`**, i.e. whether anybody has acted on it. A line at the top says how many moved and
links to the Service Cases page. A request whose case was deleted stays, because it still needs
attention.

**The bin and the notification centre** share one shape: category cards with the icon, the name
and the count on three separate lines (the old label was an icon and a name crushed into one
11px `<small>`), plus a page size. Both are **scoped** — `.trash-kpi` / `.ntf-kpi` — so the
cases and QC pages keep the compact `.module-kpi-card` they were designed with. js/58 reads the
category off the key each notice already carries (`auto_visit_`, `auto_urgent_`, `auto_part_`,
`auto_submit_`, `auto_warranty_`, `auto_assigned_`, `auto_intake_`, `n_`) and stores nothing;
the base function still owns the badges and they still count everything, not the filtered view.

**The status circles (item 8).** Every step is a button:

- **behind or on** the current step → opens a drawer describing what happened there;
- **exactly one ahead** → moves the case forward;
- **further ahead** → `disabled`; stages cannot be skipped.

Step 4 draws the technician's own **nine-status track underneath**, read from `fieldStatusLog`,
and the case cannot pass it until the technician reaches `จบงาน` or files a report. Clicking the
blocked step **opens that track and says why** instead of refusing silently. Step 5 links to the
documents and the report; step 6 closes the case.

**The ViewModel does not carry the field track.** `buildModel()` builds a page shape with only
what the layout needs, so `fieldStatusLog` is absent and the first version marked nothing done
and never opened the gate. `m.raw` now holds the record as stored, read-only, beside the
ViewModel.

**เปลี่ยนสถานะ used to open the case EDIT form**, which is a different job. It now changes the
status on the page; **แก้ไขเคส** is its own button (item 7). The action bar became
`auto-fit, minmax(168px,1fr)` to hold seven.

**Item 10** sets the row attributes in `renderAssign()`, not in `caseRow()` — that function is
shared with งานของฉัน and งานที่สำเร็จแล้ว, where a row means "open the job", not "assign it".

### Documentation published this session

Three artifacts on claude.ai (private to the owner's account, not in the repo): the business
flow, a complete button-by-button reference with a "สิ่งที่ยังใช้ไม่ได้" section, and six arrow
diagrams. `docs/imode-flow-map.png` (4000×6188) is the six diagrams on one sheet —
**untracked, deliberately, pending the owner's decision on whether it belongs in the repo.**

The reference was produced by crawling the running application in a browser, admin and
technician, every page and every popup. **No button in the project calls a function that does
not exist.** What "ใช้ไม่ได้" means here is measured and worth keeping:

- **`🔔 เตือนลูกค้า`** on หน้างานช่าง writes a local notification and sends the customer
  nothing. Hidden from technicians in part 18; **an admin still sees it.**
- **`settings.sla` — `urgentResponseMin`, `resolutionHours`, `autoEscalateMin`, `workStart`,
  `workEnd` are read by NOTHING** except the summary line under the menu. Only
  `repairWarrantyDays` is really used. The SLA screen saves values that drive nothing, and it
  is a different object from `settings.slaResponse`, which drives the 30-minute clock.
- Gated on missing config: LIFF ID (`''` → LINE scan and auto-login inert), Messaging API token
  (no outgoing LINE), Maps API key (**distance must be typed by hand on every quotation**),
  `backendEndpoint`, and there is no email path at all.

### Tests

`node` is still not installed; syntax is checked by loading each file through `new Function` in
a headless browser. **64 files clean.** Suites this session, each run at 1440×1000 and 390×844:
44 (deletes, permissions, customer delete) · 28 (portal quotation) · 16 (combo boxes) · 28
(sidebar, requests, bin, notifications, assign) · 30 (the case page) · 15 regression.
**0 failures, 0 page errors.**

### Open / risk

1. **The case page now writes.** A status change made there with no cloud config stays on that
   device, and `syncCloud()` replaces `cases` wholesale — so it would be lost. The toast says
   so; the fix is to make sure the device is connected.
2. `เตือนลูกค้า` should be hidden from the admin too, or wired to something real. One line.
3. The SLA settings screen should grey out the four fields that do nothing, or they should be
   implemented. As it stands it reads like the system is timing something.
4. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write
   this database. The case page's new `update()` goes through the same open door.
5. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.
---

## Session Change Log — 2026-09-15 (part 22): the queue empties itself

Seven reported items about work leaving a screen once it has been dealt with. Two new JS
files, small edits to three existing ones and to `service-case-detail.html`. No storage key
renamed, no Supabase setting touched, no schema change, version untouched.

| File | What |
|---|---|
| `js/62-v70RequestQuoteCloseScript.js` | **new** — a quote request closes itself when the quotation is sent |
| `js/63-v70FieldSheetScript.js` | **new** — the Checklist leaves the system; จบงาน asks, then really finishes |
| `js/16-v69WorkAssignScript.js` | มอบหมายงาน lists only what is still waiting |
| `js/49-v70RequestsPageScript.js` | a finished request leaves the inbox too |
| `js/32-v70FieldWorkspaceScript.js` | หน้างาน reopens the job the technician had open last |
| `service-case-detail.html` | the มอบหมายงาน button assigns **on the page** |

### What was already true, measured before changing anything

Two of the seven needed no work, and saying so is the point:

- **Item 4 — tapping a row in งานของฉัน already opens หน้างาน for that case.** Driven in a
  browser: the row click lands on `#page-field-service` with `imodeFieldJobId()` returning
  that case. js/32 has done it since part 17. What looked like a failure is item 7 — entering
  หน้างาน from the module card, where the job was re-picked by appointment.
- **Item 3, first half — a แจ้งปัญหา already leaves the inbox** once its case moves off
  `เคสใหม่` (js/49's `pickedUp()`, part 21). It was the quote requests that could never leave.

And the owner was right about เช็คประกัน: `showPortalWarranty()` answers the customer on the
spot and writes **no request at all**. `warranty_check` is a filter label in js/49 and js/61
that no code path can produce. The thing that does arrive is `warranty_quote` — ขอต่อประกัน.

### 1. มอบหมายงาน is a queue, not a directory

`assignableCases()` listed every open case with the unassigned merely sorted first, so the
two or three that needed a decision were buried under the ones that had already had it. A
case now leaves **the moment it has a technician**. The KPI row becomes
รอมอบหมาย / มอบหมายแล้ว·กำลังทำ / ช่างในระบบ, and a line under it says how many are in flight
with a link to the Service Cases page.

**Consequence, and the reason item 2 had to ship with it:** changing the technician later
cannot be done here any more — the case is not on the page. That is what the case-detail
button is now for.

### 2. The case page assigns, and that is a second thing it writes

`assignTechnician()` used to navigate to `?page=assign`, which after §1 could not have
reassigned anything either, and which since js/46 costs a full page load. It now opens a panel
**on the page**: technicians grouped by team, check boxes, first ticked is the lead.

- `CaseWrite.setAssignees(id, ids, status)` writes `assignee` + `assignees` locally and sends
  **js/38's comma list in the one `assignee` column** — `service_cases` has no `assignees`
  column, so writing anything else would arrive as one technician. `update()`, never `upsert()`,
  as before.
- A case still at `เคสใหม่` moves to `มอบหมายแล้ว` in the same write, exactly as
  `imodeAssignCase()` does it. **No notification is written**: since part 16 §5 the "you have
  been given a job" notice is derived from the case, so the assignee field is the whole message
  and it reaches the technician's device through the case row.
- Team scope is mirrored from js/13's rule, so a team lead still cannot reach outside their own
  team and an admin still sees everybody.
- Gated on `case.assign` at the panel and again at the write.

**The check boxes answer `change`, not `click`.** A click on the label text has the `<span>` as
its target and `closest('[data-assign-tech]')` never finds the input, so a click listener
silently loses every tick made by tapping the name — which is how a phone is used.

### 3. A quote request closes when the quotation is sent

Nothing in the project had ever linked a quotation back to the request it was built from, so
ขอราคา Service and ขอราคา Warranty sat in the inbox for ever however much work was done.

- ทำใบเสนอราคา on a request moves it to `กำลังดำเนินการ` — somebody has it, it is still listed.
- Saving the quotation records the link.
- ส่งให้ลูกค้า marks the request `เสร็จสิ้น`, and js/49's `pickedUp()` now treats that as out of
  the inbox. **Nothing is lost** — ประวัติคำขอ (js/61) keeps every request ever received.

**Where the link lives, and why.** `cloudUpsertQuotation()` writes an explicit whitelist — the
same one that already drops the derived breakdown (part 18 §4) — so a field on the quotation
would never leave the device. It is kept in `settings.quoteRequestLink`, because settings travel
whole. When even that is missing (prepared on one device, sent from another) the send falls back
to matching on customer + machine + kind, and **refuses to guess between two**: a Warranty
request is only ever closed by a `WP` quotation and a Service request only by a non-`WP` one.
The close itself always travels, because `status` is in `cloudUpsertLineRequest()`'s whitelist.

### 5. The Checklist leaves the system

Eleven rows of ปกติ / หมายเหตุ at the top of the technician's sheet. Out of the whole system
at the owner's instruction, **including the printed ใบตรวจ** — which took three changes
together, because leaving any one of them would have printed a lie:

| | |
|---|---|
| the editor | `window.renderChecklistEditor` returns `''` |
| the heading and the "Checklist จะเปลี่ยนตามประเภทงาน" hint | removed from the form markup as it passes through `openModal()` |
| what is stored | `checklistTemplate` is swapped for one returning `[]` **around the call** to `saveServiceReport()` |

`#checklistEditor` itself is **kept, empty and hidden** — `changeReportWorkType()` writes to it
as an id global and would throw without it, the same reason `#fieldQueue` and
`#portalLineIdentity` are still in the document.

**The swap is the part worth remembering.** `saveServiceReport()` does `template.map(...)` with
`document.getElementById('src'+i)?.value||'OK'`, so a hidden editor would have stored a full
pass on eleven points nobody looked at. An async function runs synchronously up to its first
`await`, and `const check=template.map(...)` is well before it, so replacing the template for the
duration of the call is exact and nothing else sees it.

Reports written before this keep their checklist in storage; it simply stops being printed.
**QC's checklist is a different thing** (`QC_CHECKLIST_MASTER`) and is untouched.

### 6. จบงาน asks, then really finishes

`saveFieldStatus()` maps จบงาน to `รอส่งงาน` (js/03 line 978), which is not a closed status, so
the job stayed on งานของฉัน looking exactly as unfinished as before. Pressing it now asks first —
saying whether the ใบตรวจ has been filed, because that is the one thing the technician cannot go
back for once the job has left their list — and on yes the case lands on `เสร็จสิ้น`, the status
the submit path has used since part 18. The job leaves งานของฉัน (js/44 drops closed rows) and is
in งานที่สำเร็จแล้ว (js/45); a technician is taken back to งานของฉัน.

**The hook is `window.saveFieldStatus`, not any one button.** Three screens reach จบงาน through
it — js/32's step bar on the page, js/26's stepper in the popup and js/03's own status modal.
Only that one word is intercepted; every other step is untouched, and a case a coordinator had
parked at `รออะไหล่`, or one already closed, is left alone.

### 7. หน้างาน reopens the job the technician had open last

`autoPick()` re-picked by next appointment, so a technician halfway through a job and coming
back through the module card, the bottom bar or a Home shortcut could be handed a different one.
The last job **opened** is remembered per technician in `imode_v70_field_last_job` and wins, as
long as it is still theirs and still open — closed, reassigned or deleted falls through to the
appointment order. Its own key rather than `settings`: it is a per-device note about where
somebody was looking and it must not travel.

### Tests

Four suites in the session scratchpad, run at 1440×1000 and 390×844, **63 + 11 assertions,
0 failures, 0 page errors**:

- **t1 (15)** — the assign page listing only what waits, its KPI and its in-flight line, a case
  leaving the instant it is assigned; the quote request marked in progress, the link recorded,
  still listed before the send, closed by the send, gone from the inbox, the other request
  untouched, and both still in ประวัติคำขอ.
- **t2 (21)** — a technician's row opening หน้างาน for that case; no checklist rows and no
  Checklist heading on the sheet while the sheet, `#checklistEditor` and `changeReportWorkType()`
  all still work; the module reopening the remembered job; จบงาน asking, the question naming the
  ใบตรวจ, **cancel changing nothing**, accept finishing the case, the job leaving งานของฉัน and
  turning up in งานที่สำเร็จแล้ว, and an ordinary step asking nothing and still saving.
- **t3 (16)** — the printed ใบตรวจ dropping the table of an OLD report that still carries one
  while keeping everything else; the detail page assigning without leaving the page, writing
  `assignee` + `assignees` + `มอบหมายแล้ว`, pre-ticking the existing crew on reopen, a crew of two
  keeping its lead, and the application reading both back through `imodeCaseAssignees()`.
- **t4 (11 ×2)** — 24 sidebar pages open, both version strings, no horizontal overflow, the
  machines pager, the cases KPI, the report popup with its parts editor and both signature pads
  and no checklist, and an unrelated popup still opening.

`node --check` passes on every file in `js/`, `auth/` and `pages/`, and the detail page's inline
script parses through `new Function`.

Known-benign, unchanged: `goPage('my-work')` bounces for an admin (no `mywork.view`, part 13),
and the `sw.js` 404.

**Harness note worth keeping:** `/json/list` on the DevTools endpoint returns extension
background pages too, and its first entry is often one of them — attaching to it gives a session
that navigates nothing and evaluates in the wrong context, with `readyState` complete, no error
and an empty document. Filter for `type=='page'`, and pass `--disable-extensions`.

### Open / risk

1. **The มอบหมายงาน page can no longer change a technician**, by design. The way to do it is the
   case page's own button. Anyone used to the old page will look there first.
2. The quotation → request link lives in `settings.quoteRequestLink` and grows by one short
   string per quotation built from a request. Nothing prunes it.
3. A report saved from now on stores `checklist:[]`. Nothing reads that field except the printed
   sheet, which no longer prints it, but an export written against it would come back empty.
4. จบงาน now closes the case, so a technician who files the ใบตรวจ afterwards has to reach the
   job through งานที่สำเร็จแล้ว. The confirmation says so.
5. Unchanged from part 21: the case page writes, and a write made with no cloud config stays on
   that device — `syncCloud()` replaces `cases` wholesale. The toast says so.
6. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database.
7. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

---

## Session Change Log — 2026-09-15 (part 23): the customer sees the upload, and จบงาน checks the signature

Two reported items. Two new JS files, a progress hook added to one existing file, two script
tags. No storage key, no schema, no Supabase setting, version untouched.

| File | What |
|---|---|
| `js/67-v70UploadProgressScript.js` | **new** — a popup with a real percentage while a customer's file is prepared |
| `js/68-v70CloseSignatureGateScript.js` | **new** — จบงาน is refused while the customer has not signed |
| `js/30-v70MediaShrinkScript.js` | reports a fraction per file through `window.imodeMediaProgress` |
| `index.html` | two `<script src>` tags |

### 1. "ลูกค้าจะไม่รู้ว่าเพิ่มไฟล์แล้วแต่ทำไฟล์ไม่ขึ้น"

A customer taps 📷 / 🎥 เพิ่มไฟล์ and the form does not change for seconds — js/30 shrinks the
file first (a phone photo is 4-8 MB; a clip is re-encoded at playback speed) and only then does
js/03 read it and draw the preview. The only sign of life was one toast, and when the file was
genuinely refused (over 3 MB after shrinking, or a fifth file) the notice was another toast that
read the same way.

Now: a blocking popup with one row per file, each with its own percentage, and a big overall
number. **The percentage is measured, not a timer** — js/30 now reports FileReader's own
progress while the file is read, the encode pass for an image, and `currentTime/duration` for a
video, which is exact because MediaRecorder encodes at playback speed.

- The last stretch (js/03 re-reading the shrunk file and drawing the preview) cannot be measured
  from outside, so the bar **holds at 96% under กำลังบันทึกไฟล์… with a shimmer** rather than
  inventing a number.
- The ending is decided by counting `window.portalIssuePendingMedia` **before and after** — that
  array is what the preview and the submit both read, so it is the truth about whether a file was
  added, and no assumption is made about why one was refused. Added → ✓ เพิ่มไฟล์แล้ว n ไฟล์ and
  it closes itself. Added nothing → it **stays open, in red, with a ปิด button**, which is the
  half of the report that actually mattered.
- Blocking is deliberate: the backdrop swallows the second tap a customer makes when nothing
  seems to happen.
- `window.imodeMediaProgress` is a plain hook, not an event, and js/67 installs it **only while
  its popup is up**. js/30 stands its own toast down exactly while it is installed, so the three
  technician upload paths keep the old toast and nothing else changes for them.
- `removePortalIssueMedia()` re-enters the same function with `{files:[]}` purely to redraw the
  preview. That is not an upload and must not raise a popup — asserted.

### 2. จบงาน checks the customer's signature — and the trap it had to get around

**Every report already "has" a customer signature.** `signatureData(id)` is
`canvas.toDataURL('image/png')` (js/03:1031), and a canvas nobody drew on still answers with a
perfectly valid, transparent PNG. So `r.customerSignature` is a non-empty string on every report
ever saved, signed or not: `if(r.customerSignature)` would have passed every case and looked like
it worked.

`js/68` counts the **ink** instead — the stored PNG is drawn into an offscreen canvas and its
pixels are scanned (a data URL never taints a canvas, so they can be read). A blank pad has none;
a signature has thousands. A canvas that cannot be read resolves **true**, because a technician
holding a real signature must never be blocked by a probe failure.

- Signed → straight through to the existing flow, including js/63's own ยืนยันจบงาน confirmation.
  Nothing about จบงาน changes.
- Not signed → a popup (ยังไม่ได้ลายเซ็นลูกค้า) with a button that opens the ใบตรวจ where the pad
  is, and **the status change does not happen at all** — no timeline entry, no status write.
  The wording separates the two real cases: no inspection sheet at all, or a sheet whose pad was
  left empty.
- The hook is `window.saveFieldStatus`, like js/63, so all three screens that reach จบงาน are
  covered (js/32's step bar, js/26's stepper, js/03's status modal). Only the word จบงาน is
  intercepted. js/68 loads **after js/63**, so it is the outermost wrapper and an unsigned job
  never gets as far as being asked about.
- The ink check needs an image decode, so the wrapper is **asynchronous**. That is safe here:
  js/32's `advance()` removes the temporary `#fieldStatusSelect` when the promise it was given
  settles, and ours settles after the base's, so the controls js/03 reads as id globals are still
  in the document. A second tap inside that window is swallowed by an in-flight guard.

**Not covered, deliberately:** saving the ใบตรวจ itself also closes the job (js/03 sets รอส่งงาน,
js/44 promotes it to เสร็จสิ้น). That door is the report form, where the pad is on screen. The
gate is on the status-update door the owner named.

### Tests

Three suites, six runs at 1440×1000 and 390×844 (`Emulation.setDeviceMetricsOverride`),
**113 assertions, 0 failures, 0 page errors**:

- **up1 (22 + 24)** — the popup appears, names the file and its size, shows a percentage strictly
  between 0 and 100 that only ever rises and reaches 100, the hook is installed while it runs and
  removed afterwards, the file is added, shrunk and previewed; removing a file raises no popup; a
  refused file is reported **in the popup** with its reason, waits instead of closing itself, and
  its ปิด button works; on the phone the card fits and nothing scrolls sideways.
- **sg1 (20 + 21)** — จบงาน blocked with no sheet, blocked with a sheet whose pad is blank (the
  case this file exists for), the wording differing between the two, no status write and no
  timeline entry either time, the button opening the real ใบตรวจ with `#srCustomerSignPad`, an
  ordinary status step untouched and still saving, and a genuinely inked signature letting the
  job finish to เสร็จสิ้น / `fieldStatus จบงาน`.
- **reg1 (13 + 13)** — 24 sidebar pages still open (`my-work` still bounces for an admin, part
  13), both version strings, the machines pager, the cases KPI, `compressPhoto` still returning a
  JPEG under its 420 KB target after the js/30 change, and no horizontal overflow.

`node --check` passes on all 73 files in `js/`, `auth/` and `pages/`.

### Open / risk

1. The upload popup blocks the form while a file is prepared. That is the point, but a customer
   cannot start typing the problem description during those seconds.
2. `imode_v70_field_last_job` and everything else is untouched; the only new global is the
   `window.imodeMediaProgress` hook, which exists only while the popup is up.
3. The signature gate has **no override**. A technician whose customer has left cannot close the
   job from หน้างาน; it has to be closed from the case page, or the customer has to sign.
4. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database.
5. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

---

## Session Change Log — 2026-09-16 (part 24): the ใบตรวจ is readable, the status says who moved it, one stroke is undoable, and a sync stops eating unsent rows

Four pieces of work. Three new JS files, edits to four existing ones. No storage key renamed, no
Supabase setting changed, no schema change, version untouched.

| File | What |
|---|---|
| `js/69-v70StatusLogScript.js` | **new** — records WHY a case status changed: a rule, or a person |
| `js/70-v70SignatureUndoScript.js` | **new** — ↶ ย้อนกลับ on the ใบตรวจ signature pads |
| `js/71-v70SyncMergeScript.js` | **new** — a row the cloud has not got is no longer destroyed by the next sync |
| `service-case-detail.html` | the ใบตรวจ read view, the status-log timeline, both sets of styles |
| `js/12-v69RoleScopeScript.js` | `field.report` added to `ADMIN_ADD` |
| `js/28-v70CaseDetailLink.js` | two new intents: `report`, `report-edit` |
| `index.html` | three `<script src>` tags |

### 1. The admin can read the ใบตรวจ from the case page

Reported against the เอกสาร & รูปภาพ drawer on `service-case-detail.html`. Two separate faults:

- The card drew six summary lines. The record it is built from carries the checklist, the
  diagnosis, the work performed, the parts, the before/after photos and the signatures, and
  `m.reports` has held all of it since part 21 — **nothing was drawing it**.
- The button read `เปิด / พิมพ์ใบตรวจในระบบหลัก` and did `goApp('cases', intent=status)`, which
  opens the case EDIT popup over the case table. It never opened a ใบตรวจ at all.

`reportDocsHTML()` is now a read view: the checklist as a table (NG in red, N/A grey, using the
same six labels `inspectionResultLabel()` maps), diagnosis / work / recommendation, a parts
table with the part number, the photos, and the signatures.

**It is deliberately NOT a copy of the printed A4 sheet.** `serviceReportHTML()` in js/03 stays
the one printable document and `🖨 พิมพ์ / PDF` and `✏ แก้ไขใบตรวจ` hand the visitor back to it
through the two new intents in js/28, which resolve the report with js/03's own
`reportForCase(cid)` so no extra URL parameter has to be spent. Two copies of an official form
is how a field added to one of them silently stops appearing in the other.

**The signatures are shown as images, and the ✔/✕ chips are gone.** `signatureData()` is
`canvas.toDataURL()`, so an untouched pad still yields a valid PNG and `r.customerSignature` is
a non-empty string on every report ever saved — a ✔ beside the word ลายเซ็น was true of all of
them. A blank box looks blank; that is the honest answer, and it is the same fact js/68 had to
count ink pixels to establish.

**`field.report` was the reason แก้ไขใบตรวจ would have refused.** An admin could already READ a
report from หน้ารายงาน (`previewServiceReport()` is not gated) but `openServiceReport()` checks
that key, and it is in the technician preset only. One line in `ADMIN_ADD` fixes it everywhere:
js/47 re-applies the preset on **every** load, so no `SCOPE_VERSION` bump is needed, and a key
that was never in the preset cannot be in `settings.rolePresetOptOut` either.

**Found while testing:** `loadAttachments()` pushes the report's before/after photos into
`m.attachments` with no `from`, and `attachmentsHTML()`'s field block tests `from!=='customer'`
— so once the report card drew its own photos, the same pictures appeared twice in one drawer.
They are tagged `from:'report'` now and excluded there. `renderProblem()`'s block still tests
`from!=='customer'`, because that one says "หน้างาน / ใบตรวจ" and means it.

### 2. ประวัติการเปลี่ยนสถานะ — `js/69`

A case carries its status in ONE string and has never had a history beside it; the only log in
the project is `fieldStatusLog`, which is the technician's nine field statuses, a different
ladder. So the previous value and its cause were gone the moment anything overwrote it, and the
six circles on the case page have to INFER their timestamps from unrelated fields — which is why
a case can show step 2 at 09:57 and step 4 at 09:55 and read backwards. `assignedAt` is not a
field at all: line 649 of that page is literally `assignedAt: c.updatedAt`.

The application already moved a status automatically in six places and manually in three.
Nothing was wrong with any of them; none left a trace.

- **One choke point.** Every path calls `saveLocal()`, so the diff is taken there rather than by
  wrapping six functions, and a path added later is covered for free. It runs BEFORE the base
  call so the entry is persisted by that same save, and it composes over js/41's wrapper.
- **The rule that is running names itself.** Thin wrappers on `saveFieldStatus`, `fieldCheckIn`,
  `saveServiceReport`, `imodeAssignCase` and `saveSchedule` set a hint while they run, so an
  entry says `ระบบเปลี่ยนเอง · ช่าง Check-in ถึงหน้างาน` instead of blaming whoever is signed in.
- **A SYNC IS NOT A TRANSITION.** `syncCloud()` replaces `cases` wholesale, so every case whose
  status differs from this device's copy looks exactly like somebody just changed it. Recording
  during a sync would invent transitions nobody made and attribute them to the current user. The
  recorder is switched off for the duration and only re-reads its snapshot. A case appearing for
  the first time is skipped for the same reason.
- **Kept in `settings.caseStatusLog`**, because settings travel whole while
  `cloudUpsertCase()`'s column whitelist would drop a new field on the case silently — the trap
  that lost the customers' photos in part 18. Capped hard (12 entries per case, 150 cases) the
  way part 17 caps the bin: a settings row that grows without limit breaks settings sync for
  everybody, which is worse than forgetting an old transition.
- `service-case-detail.html` cannot load js/69, so it appends its own entries to the same
  localStorage key and merges at boot. Its entries reach other devices on the application's next
  settings push, not instantly — stated on screen rather than pretended away.

### 3. ↶ ย้อนกลับ on the signature pads — `js/70`

`initSignaturePad()` draws straight onto the canvas and keeps no history, so the only repair for
one wrong stroke was ล้างลายเซ็น — throw the whole signature away with the customer standing
there. Both pad helpers are top-level function declarations and therefore window properties, so
they are **wrapped, never reimplemented**: the base still builds the markup and owns every line
of the drawing logic, and this only snapshots in front of the base's own pointerdown handler.

- A snapshot is `toDataURL()`, not `getImageData()` — a 560×180 ImageData is ~400 KB and twenty
  of them per pad is 8 MB of live memory on a phone. Restoring is therefore an image load, so a
  second press during the first is swallowed rather than queued.
- **ล้างลายเซ็น is undoable too**, deliberately beyond what was asked: pressing it by mistake
  destroys a signature the customer has already given and who has probably left.
- The two buttons are wrapped in a **`<div>`**, not a `<span>`: the ≤640px rule sets
  `.signature-actions span{font-size:9.5px;max-width:65%}` for the hint text and would have
  shrunk both buttons with it.
- Styles are injected as a runtime `<style>`, because css/21 and css/23 must stay the last two
  `<link>` tags.

These are the only signature pads in the project — QC and the warranty document have none.

### 4. "คำขอที่แอดมินไม่ขึ้น และรีเฟรชแล้วประวัติหาย" — measured, then `js/71`

**The reported bug did not reproduce.** Driven end to end against the live project with the
owner's permission (one row, deleted and verified gone afterwards): the request and its case both
reached Supabase, `imodeCloudHealth()` reported `writesOk: 2, writesFailed: 0`, and both survived
a reload. All 14 columns `cloudUpsertLineRequest()` writes exist, `media` exists on both tables,
RLS is not refusing anything, and `system_settings` had been written at 10:59 — so that device
could write. The likeliest explanation is that the test ran while this session was editing files
under a live-reloading server.

**"แอดมินไม่ขึ้น" is not a bug.** js/49's `pickedUp()` drops a request once its case moves off
`เคสใหม่`, which is the owner's own instruction from part 21. The case in question had been taken
all the way to เสร็จสิ้น, so the request had legitimately moved to the Service Cases page, and
ประวัติคำขอ still lists it.

**The flaw that would produce the other half exactly is real, and is now closed.** `syncCloud()`
does `cases = a.data.map(…)` and `lineRequests = j.data.map(…)` — wholesale replacement, then
`saveLocal()` writes it over storage. A customer's report is written locally BEFORE the upload is
awaited, so a failed upload, a closed tab or a dropped connection in between left the row alive
only until the next sync.

`js/71` keeps a row the cloud has never acknowledged and **re-uploads it**, rather than merely
preserving it.

**The trap that makes the obvious fix wrong:** that wholesale replace is also how a delete made
on another device reaches this one — js/52's `cloudDelete()` removes the cloud row, and other
devices notice only by its absence. Blanket protection would resurrect everything anybody deleted
while this device was offline. So every id the cloud returns is remembered in
**`imode_v70_cloud_seen`** (device-local), and a missing row is kept only while its id has never
appeared in a sync. On a device that has never run the file the list is empty, so the **first sync
only seeds it** and protects nothing older than two hours.

Scope is `cases` and `lineRequests`. Adding another table is one entry in `TABLES`, but each one
is a decision about delete propagation, not a free win.

### Harness notes worth keeping

- **`node` is still not installed.** Part 21 is the current truth; part 15's "node v24 is
  installed" is stale. Syntax is checked by pushing each file through `new Function()` in headless
  Chrome, which raises a SyntaxError with a line number where a plain `<script src>` fails
  silently.
- **Chrome's `--dump-dom` cannot be captured into a PowerShell variable** — it comes back empty
  from both `--headless=new` and the old `--headless`. Redirect it to a file and read the file.
- **`w.cases` is `undefined` in a test driver.** The lexical-global trap of part 17 §5 applies to
  the harness too: use `w.eval("…cases…")`, since indirect eval runs in the global scope where the
  binding is reachable.
- **A form's `onsubmit` is attached on a `setTimeout(…,20)`** by `openPortalIssueForm()`.
  Submitting in the same tick hits a form with no handler and does nothing, silently — which one
  driver here mistook for the product's fault for a whole round. Wait, assert
  `typeof form.onsubmit==='function'`, then use `requestSubmit()`.
- **The signature canvas is 560×180 but rendered 130px tall**, and `pos()` scales by
  `canvas.height/rect.height`, so a y beyond the rendered height draws below the canvas and
  nothing appears. A stroke at y=140 produced a false pass; the driver clamps now.
- `--host-resolver-rules="MAP * 127.0.0.1"` is the cheap way to guarantee a suite cannot reach the
  live database. The one test that had to reach it must **not** block `cdn.jsdelivr.net`, or
  supabase-js never loads and `supa` stays null.

### Tests

Syntax clean on all six touched files. Suites, each in the session scratchpad:

ใบตรวจ read view (26, incl. a permission-stripped second pass) · the two intents against a real
app boot (12) · status log, application and case page (29) · signature undo driven with real
pointer events and measured in ink pixels (24) · sync merge, four scenarios including that a
remote delete still propagates (21) · regression (15, run twice) · offline reproduction of the
customer report (12 of 13; the one failure was the driver looking for the pre-js/19 success
wording) · the live end-to-end submit (12). **0 JS errors anywhere.**

### Open / risk

1. `js/71` covers `cases` and `lineRequests` only. Quotations, warranties, documents and service
   reports are still replaced wholesale by a sync.
2. A row that genuinely cannot upload is retried on every sync until it lands. That is intended;
   js/24 reports the failures.
3. `settings.caseStatusLog` starts from 2026-09-16. Nothing before that exists, and the case page
   says so rather than implying the case never moved.
4. The signature history lives in memory: reopening the ใบตรวจ starts a fresh one.
5. An admin can now edit a technician's ใบตรวจ, and nothing records who edited it — reports have
   no audit trail.
6. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database.
7. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

---

## Session Change Log — 2026-09-16 (part 25): a job with a crew was invisible to everyone but its lead

Reported: "มอบหมายช่างแล้วงานไม่ขึ้น". Measured on the live row — `SRV-20260916-005` carries
`assignee='T001,T003,T002,T-LEAD-TECH,T-LEAD-RD'` — and then walked the whole business flow in a
browser, from แจ้งปัญหา to ปิดเคส.

### The defect

js/38 (part 17 §2) keeps a multi-technician crew in the ONE `assignee` column as a comma list,
because `service_cases` has no `assignees` column, and `assigneesOf()` splits it apart again for
anyone who asks through `imodeIsAssignedTo`. **Nine places never asked.** They compared
`c.assignee === <technician id>` against the whole string, which matches nobody once a job has
more than one technician — so the work vanished for every member of the crew including the lead's
own queue screens.

| Fixed | What was invisible |
|---|---|
| `js/03` renderFieldService | **the หน้างาน queue and all four counters** — the reported symptom |
| `js/03` dashboard team workload (×2) | every technician showed 0 jobs |
| `js/03` ทีมช่าง person card | "งานเปิด" showed 0 |
| `js/03` calendar **day** and **week** views | the job appeared only in the LEAD's row |
| `js/03` technician detail popup | the case list was empty |
| `js/26` assignedNotices | the derived "คุณได้รับมอบหมายงาน" |
| `js/26` closed-jobs box on หน้างาน | |
| `js/60` report drill-down by technician | |

One helper, `caseHasTech(c,tid)`, was added beside `techById` in js/03 and the nine expressions
now call it; it delegates to `imodeIsAssignedTo` and keeps the old comparison as the fallback for
a build without js/38. **No function was rewritten and nothing was copied into a second place** —
there is no seam to wrap here, the flaw is inside js/03's own expressions, so they are edited in
place, one expression each.

**Not touched, deliberately:** `techById(c.assignee)` wherever a single NAME is displayed (the
case table, the agenda, the report header). The lead is who is responsible; showing one name is
correct.

**Not broken, checked before assuming:** งานของฉัน, js/16's `visibleTo()` audience filter,
js/38's splitter, and `notifyChanges()` — which already loops every newly added assignee. Several
files (js/16, js/32, js/44, js/45) already call `imodeIsAssignedTo` with the `===` only as a
fallback; those were left alone.

### Tests

A new end-to-end audit in the session scratchpad drives the real controls — the portal form, the
assign popup's checkboxes and appointment field, the หน้างาน step bar, the signature pads — and
walks แจ้งปัญหา → คำขอ → แจ้งเตือน → มอบหมายข้ามทีม → งานของฉัน of the NON-lead → seven field
steps → the จบงาน signature gate → ใบตรวจ → เสร็จสิ้น → งานที่สำเร็จแล้ว → ปิดเคส → the status
history. **62 assertions, 0 failures, 0 JS errors.** Syntax clean on all nine touched files
(js/03 is 468,886 characters); the regression suite is 15/15.

### Three FALSE failures worth remembering

All three were the test's fault, and each was chased to its cause rather than waved away:

1. **An assertion that re-implemented the bug.** It recomputed the dashboard count with
   `c.assignee===t.id` — the very expression under test — so it could only ever fail, fix or no
   fix. Read what the screen actually renders.
2. **`\b` does not work around Thai.** `/\b1\s*งาน\b/` can never match `…พร้อมรับงาน1 งาน`,
   because JavaScript's word boundary is defined on ASCII word characters. The dashboard was
   already correct.
3. **Counting one notification key.** js/26's `dedupe()` drops the derived `auto_assigned_` notice
   when a stored one for the same case exists — by design — so the crew member was being notified
   all along, through `n_…`. Count what the user can see, not one implementation detail.

Two harness notes: `new win().Event(...)` parses as `(new win()).Event` and throws, which killed a
suite silently and left it printing `running…` for ever — put the window in a variable, and give
every driver a `window.onerror` and a watchdog so a dead step still reports what passed.

### Open / risk

1. The comma-list wire format is still the underlying oddity (part 17 §2). When a real
   `assignees jsonb` column exists, js/38's two wrappers go and `caseHasTech` stays as it is.
2. `renderFieldService()` still shows one technician at a time; a crew job now appears in each
   member's queue, which is the intent, but the same job is legitimately listed more than once
   across technicians.
3. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database.
4. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

### Follow-up (same day): the calendar was empty because the appointment never reached the cloud

Reported as "หน้าปฏิทิน มันไม่เห็นซิงค์กับงานเลย". It was not a sync fault and not a calendar
fault: **every calendar view filters on `c.appointment`**, and the live project held

| | |
|---|---|
| assigned, open, **no appointment** | **19 cases** |
| with a real appointment | **1** — `SRV-20260903-001`, and that one had been scheduled through js/16's popup |

`CaseWrite.patch()` in `service-case-detail.html` builds an explicit payload — `updated_at`,
`status`, `assignee` — and **`appointment` was not in it.** `doAssign()` has always required the
date (it refuses and highlights the field without one) and `setAssignees()` has always written it
to the case, so the date reached localStorage and was then destroyed by the next `syncCloud()`,
which replaces `cases` wholesale. Every case assigned from the case page since that panel shipped
lost its date, which is the whole of the 19.

**One line added to the payload.** The same shape of fault as `media` in part 18 and the crew in
part 17 §2: a field added to the object is dropped unless the payload names it. Worth checking
before adding any further field to a case from that page.

**Rescheduling needed nothing new.** The owner also asked to be able to change a date — "บางที
ลูกค้าไม่สะดวก หรือช่างติดภารกิจ". The step-3 drawer's **ตั้ง / แก้นัดหมาย** already opens the same
panel with the current date prefilled, and it is now the reschedule form it always looked like;
it was broken only by the missing column.

Tests: 21 assertions driving the real panel with a stubbed Supabase client, so the PAYLOAD itself
is asserted — the empty-date refusal writes nothing and sends nothing, a saved date appears in
both localStorage and the outgoing row, and a second pass reschedules and sends the new date.
Syntax clean on all nine files; the 62-assertion flow audit is unchanged.

**The 19 cases cannot be repaired automatically** — their dates were never stored anywhere, so
they have to be re-entered by hand from each case's ตั้ง / แก้นัดหมาย. Until then the calendar is
right to show them nowhere.

---

## Session Change Log — 2026-09-17 (part 26): storage ran out, and sixteen requested changes

Sixteen reported items. Seven new JS files, small edits to five existing ones and to
`service-case-detail.html`. No storage key renamed, no Supabase setting touched, no schema
change, version untouched.

| File | What |
|---|---|
| `js/72-v70StorageGuardScript.js` | **new** — saveLocal() stops throwing the caller down with it |
| `js/73-v70FieldScopeScript.js` | **new** — หน้างาน is one job for every role; หน้างานทั้งหมด is its own page |
| `js/74-v70NewJobBadgeScript.js` | **new** — a job not yet opened is highlighted in งานของฉัน |
| `js/75-v70QuoteApprovalScript.js` | **new** — the customer signs to approve; the list is scoped and filtered |
| `js/76-v70CaseFormScript.js` | **new** — work-type rename, two labels, the status picker leaves the form |
| `js/77-v70InspectSheetScript.js` | **new** — ผ่าน / พอใช้ / แก้ไข checklist, PM date rule, satisfaction |
| `js/78-v70ConfirmDialogScript.js` | **new** — the browser's grey confirm box becomes the app's dialog |
| `js/28`, `js/32`, `js/40`, `js/63` | one intent, one setter, two dialogs, two conditions |
| `service-case-detail.html` | the action bar, the field hand-off, its own confirm dialog |

### 0. ITEMS 1 AND 5 WERE ONE BUG, AND IT WAS BREAKING SIGN-IN

Reported as two things — a quota error in the login popup, and ตั้งค่า → "หน้าลูกค้า · สแกน QR"
opening a blank page. Reproduced against the live project, and they are the same fault.

`saveLocal()` — the copy in **js/04**, which overrides js/03's and writes SIXTEEN keys in a row
with **no try/catch** — throws `QuotaExceededError` out of whatever called it:

| caller | what the owner saw |
|---|---|
| `setSessionUser()` → `applySession()` | the error in the login popup, session never completed |
| `ensureMasters()`, on every `renderAll()` | `goPage()` died half way through and left the page it was building empty — **that is item 5**, not a second bug |
| the 11th of 16 `setItem` calls | `serviceReports`, `qcRecords`, `pettyCash`, `spareParts`, `purchaseOrders` were silently never written after that point |

**What is full**, measured on a synced device (Chrome allows about 5 MB):

```
imode_test_v532_cases          3,580,444   of which 3,546,857 is `media`
imode_test_v532_line_requests  1,711,385   of which 1,699,682 is `media`
everything else together         ~234,000
```

97% is the photos and clips customers attach to แจ้งปัญหา — which since part 18 are in
Supabase, so the local copy is a cache of something the server already holds.

**js/72** catches the quota failure, sheds weight and retries, and never throws again. If even
the last rung cannot fit it reports and returns: the in-memory data is still correct and the
cloud push does not go through `saveLocal()`, so a full device must not be allowed to break
sign-in or navigation.

Three things about how it sheds, all of which matter if it is ever changed:

1. **The in-memory arrays are NOT touched.** js/42 injects `media` into the outgoing payload
   *from the case object*, so mutating it would upload stubs over good cloud rows. Only the
   bytes on their way to localStorage are lighter: `cases` and `lineRequests` are swapped for
   shallow clones around the base call and put back in a `finally` — the same technique js/63
   uses for `checklistTemplate`.
2. **A row the cloud has not acknowledged keeps its media whatever happens.** Two signals are
   needed, because neither is enough: js/71's `imode_v70_cloud_seen`, **and** what came down in
   a sync during this page view. js/71's `reconcile()` returns early for a table whose pre-sync
   array was empty, so on a fresh device the `cases` list is never written — relying on it alone
   shed *nothing*, which the suite caught.
3. **A ladder, not a cliff**: budget 900 KB keeping today's work, then without that protection,
   then 200 KB, then only the unacknowledged rows.

Measured after the fix on the same device: **5.3 MB → 2.0 MB**, sign-in works, the customer-entry
page renders, and all five keys that used to be skipped are written.

New key: `imode_v70_storage_shed` (a flag, so the next load starts light instead of throwing once
more to learn the same thing). Clearing it costs one caught exception.

### 2. หน้างาน is ONE job for every role — and the queue gets its own page

js/32 has shown a technician one job since part 17; its `autoPick()` returns `''` for an account
with no `technicianId`, deliberately, so ทีมช่าง could preview a queue. That is why the admin
still saw the old list. **js/73** makes the choice for those accounts *before* js/32 renders,
through a one-line setter added to js/32 (`imodeSetFieldJob`) — `imodeOpenFieldJob()` could not
be used, because it calls `goPage()` and would re-enter the wrapper calling it.

- The job **sticks**: kept per ACCOUNT in `imode_v70_field_last_job_acct`, beside js/32's
  per-technician key rather than inside it. Device-local on purpose.
- **เริ่มหน้างาน on the case page now carries the case** — `&caseId=…&intent=field`, handled by
  one new branch in js/28. Driven end to end: case page → the application → หน้างาน showing
  that case.
- **หน้างานทั้งหมด** (`field-all`) lists every open field job with a search box and a ช่าง
  filter; a row opens that job. Gated on **`case.assign`, deliberately an existing key** — a
  file that pushes a NEW key into `PERMISSION_CATALOG` must load before js/20, and this one
  loads long after it (the decay bug from part 14). A plain technician cannot see it or open it.

### 3. A new job says it is new, once

`imode_v70_seen_jobs` — `{account: {caseId: ts}}`, device-local. Not a field on the case: that
would need a column (`cloudUpsertCase()` writes a whitelist) and would then mean "somebody,
somewhere has seen it", when what is wanted is per-person.

**First run is the trap.** With an empty record every job a technician already holds would light
up on the day this ships, so the first time an account is seen everything currently assigned to
it is marked read, and only what arrives afterwards is new. The chip clears on
`imodeOpenFieldJob` / `imodeOpenAssignedCase` / `imodeOpenCase` — opening it, not scrolling past
it — and the row is redrawn at the moment of the tap.

### 4. The customer signs the quotation

**4.4 first, because it is a real leak and it was measured.** The portal is opened by scanning
ONE machine, but js/34 listed every quotation belonging to that machine's CUSTOMER. Read off the
live project for the machine in the report (MCH-0001):

```
QT-SRV-202609-011  ["MCH-0010"]   <- another machine
QT-SRV-202609-006  ["MCH-0001"]   <- this one
QT-SRV-202609-005  ["MCH-0003"]   <- another machine
QT-SRV-202609-002  ["MCH-0002"]   <- another machine
```

Three of four. A quotation is now listed only when the scanned machine is on it; one with no
machine list at all is still shown, because nothing attributes it elsewhere.

**The other portal pages were checked and are already correct**, so nothing was changed there:
`showPortalHistory()` filters `c.machineId===m.id`, `showPortalDocuments()` filters
`d.machineId===m.id`, `showPortalWarranty()` reads `latestWarrantyForMachine(m.id)`, and js/53's
case view opens only a case from that list. Quotations were the only one keyed to the customer.

**4.1/4.2/4.3.** A signature pad and a name box on the opened quotation, a three-way filter
(ทั้งหมด / อนุมัติแล้ว / ยังไม่ได้อนุมัติ) over the list, and a chip on every row. The office
sees the same chip on ดูใบเสนอราคา — an approval nobody in the office can see is not an approval.

- **Where it lives:** `settings.quoteApprovals` — `{quoteId:{at,by,name,sig}}`.
  `cloudUpsertQuotation()` writes an explicit whitelist, so a field on the quotation would be
  dropped silently (it is already dropping the derived breakdown — part 18 §4). `settings`
  travels whole, so this works today with no SQL for anybody to run. The signature is downscaled
  to 300px before storing and only the 40 most recent images are kept; the record itself is tiny
  and is never dropped, so a quotation stays approved for ever.
- **THE BLANK-PAD TRAP, again:** `signatureData()` is `canvas.toDataURL()` and an untouched
  canvas still answers with a valid transparent PNG. The ink is counted on the live canvas
  before the image is taken — asserted both ways.

### 6+7+8. The case page's action bar is the process

"ก่อนที่จะถึงหน้านี้เนี่ยผมอยากให้แอดมินติดต่อลูกค้าก่อน" — so the bar reads left to right as the
job actually goes: **ติดต่อลูกค้า · ลงรายละเอียดเคส · ทำใบเสนอราคา · นัดหมาย · เริ่มหน้างาน**.
`แก้ไขเคส` is `ลงรายละเอียดเคส` now, because that is what it is for. **เปลี่ยนสถานะ is off the
bar** (item 8): the status is not a sixth thing you do, it is the consequence of the five, and
the six step circles above already change it. `changeCaseStatus()` stays in `HANDLERS` for the
step drawers.

### 9–12. The case form says what the coordinator is doing

- `Remote Support` → **`แก้ไขออนไลน์`**. `serviceTypes` is a SAVED setting, so editing the
  default in js/03 would change nothing on a device that already has settings — the rename is
  applied to the live object on load and again after every sync (which replaces `settings`
  wholesale), and to any record carrying the old string. Checked first: of 31 live cases, none
  does, so it moves no real data today.
- `อาการ / รายละเอียด *` → **`อาการ / รายละเอียดเพิ่มเติมหลังติดต่อลูกค้า *`**
- `หมายเหตุภายใน` → **`หมายเหตุภายในเพิ่มเติม`**
- **The status picker leaves the form.** `#fStatus` is KEPT, hidden — `saveCase()` reads
  `fStatus.value` as an id global and would throw without it, and hiding rather than removing
  means a save from this form preserves the status the case already had. Asserted.

The form markup is rewritten on its way through `openModal()` — js/63's seam — so js/03 keeps
exactly one copy of it.

### 13. The audit, and the dialog

**There is no bare `alert()` left anywhere in js/** — every message goes through `toastMsg()`.
What was still the browser's grey box is `window.confirm()`, in sixteen places. Ten are now the
application's own dialog: the five delete paths, the bin's two permanent deletes, the Onsite →
Quotation price copy, จบงาน, and **เปลี่ยนสถานะ / ปิดเคส on the case page — the one the report
named**, which is a separate document and carries its own copy.

**Six are deliberately left as the browser's box**, and it is worth saying so: js/03 and js/04's
restore-from-backup and clear-all-test-data, js/17's คืนค่ารายชื่อเดิม, js/20's own-role lockout
guard, js/39's account delete, and js/03's start-a-new-quotation. Those wipe or lock something no
bin can bring back, they are reached from the settings screens rather than from the work, and a
box that looks unmistakably like the browser's is the right amount of friction. Styling them is
one entry in js/78's `WRAP` list.

**How, without rewriting ten function bodies.** `window.confirm` is synchronous and a styled
dialog cannot be. So no body is touched: a named function is wrapped, and during the call
`window.confirm` is temporarily replaced by one that RECORDS the question and answers no — the
function returns early having done nothing. The dialog is then shown; on yes the same function
is called again with the same arguments and the questions already answered return true. A
function with two questions therefore takes two rounds, which is why `imodeDeleteMachine` and
`imodeDeleteCustomer` still ask both. **This is only safe for a function that does nothing
irreversible before its confirm**, because that part runs once per round; every name in `WRAP`
was read before being listed. The substitution lasts only the synchronous body and is restored
in a `finally`.

### 14+15+16. The ใบตรวจ

**A checklist comes BACK**, which is worth saying plainly because part 22 took one out on the
owner's own instruction. What went out was eleven rows of ปกติ / หมายเหตุ that stored a full pass
whether or not anybody had looked. This is the opposite: **ผ่าน / พอใช้ / แก้ไข**, nothing
preselected, a 📝 หมายเหตุ button per point opening a popup and toasting เพิ่มหมายเหตุแล้ว, and a
point left unanswered stays unanswered.

- It reuses **js/03's own `checklistTemplate(workType)`** for the labels — twelve points for PM,
  eleven each for Maintenance and Service — so the rows still follow ประเภทใบตรวจ.
- It reuses **js/03's own save path**: the buttons write into hidden `#src<i>` / `#srn<i>`, which
  `saveServiceReport()` already reads, so the answers go into the existing `checklist` jsonb
  column with no schema change.
- **js/63 needed two conditions and nothing else**: do not blank the template while a live
  editor is on screen, and do not strip the printed table when the answers are the new
  vocabulary. An OLD report still prints without its checklist, as instructed.

**Two bugs the suite caught, both of which would have re-created the exact lie part 22 removed:**

1. `checklistTemplate()` returns `result:'OK'` as its default, so building the rows from it (or
   from `reportChecklistForType()`) arrived with every point already ticked ผ่าน. Only the
   LABELS come from the template now; an answer is carried over only from a real earlier report.
2. js/03 line 1061 reads `document.getElementById('src'+i)?.value || 'OK'` — an empty answer
   becomes a PASS on the way into storage. Twelve of twelve points came back answered when three
   had been. The answers are read from the DOM before the base call and written back onto the
   saved report afterwards, so what is stored is the three words plus an empty string.

**15.** `#srNextPm` is disabled and greyed unless ประเภทใบตรวจ is PM. Disabled, not removed: it
keeps its id and its value, so a date already on the report is preserved rather than blanked.

**16.** Five faces and a comment box directly under the two signature pads. Kept in
`settings.caseFeedback` — `{caseId:{rating,comment,at,by}}` — because `service_reports` has no
column for it (checked: 28 columns, none of them satisfaction) and the whitelist would drop a
field on the report. It is also what `service-case-detail.html`'s ประเมินความพึงพอใจ panel has
been waiting for; its `feedback` was hard-coded to `null`.

### THE GOTCHA THIS SESSION COST THE MOST TIME

**A delegated `click` listener on `document` never fires inside a popup.** js/05 line 19 puts a
handler on `#modalPanel` that calls `e.stopPropagation()` — the "ต้องกดกากบาทเท่านั้น" guard —
so nothing inside `#modal` reaches the document. js/16 records this; js/77 walked straight into
it anyway. The symptom is exact and silent: the buttons render, the clicks land, and nothing
happens, with no error. Listeners on DESCENDANTS of the panel still fire, so the sheet is wired
on **both** `document` (for หน้างาน, where it is rendered into the page) and `#modalBody` (for
the two popup screens). Because the panel swallows the event, exactly one of the two ever sees a
given click, so there is no double handling.

Also worth keeping: **the inline script in `service-case-detail.html` is an IIFE**, so
`applyStatus`, `goApp` and the rest are NOT global and cannot be called or stubbed from a test
driver. Drive its real controls instead.

### Tests

Eleven runs across six suites, at 1440×1000 and 390×844
(`Emulation.setDeviceMetricsOverride`, not `--window-size` — part 17 §7).
**275 assertions, 0 failures, 0 page errors.**

- **storage (16), against the LIVE project** — the sign-in that used to throw, shed mode
  engaging, 5.3 MB → 2.0 MB, the five keys that used to be skipped, the settings QR-test button
  reaching a rendered customer-entry page, and the in-memory media still carrying its data URLs.
- **boot (17)** — cold start to the door, all 25 sidebar pages open, every new global present,
  both version strings, no overflow.
- **items 2/3/9–12 (27 ×2)** — the admin's single-job workspace, the job sticking across three
  navigations, หน้างานทั้งหมด and its row click; the NEW chip appearing for exactly the new job,
  not for existing work, and clearing on open; the rename in the list and in the dropdown, both
  labels, the hidden status field and a save that preserves the status.
- **items 13–16 (42 ×2)** — eleven points with three answers and nothing preselected, the three
  answers recorded, pressing one twice clearing it, the note popup and its toast, the sheet
  surviving underneath, PM ครั้งถัดไป following the work type in all three directions, the
  satisfaction block below the pads, and a real submit storing 3 answered of 12 with the note and
  the score.
- **item 4 (27 ×2)** — the other machine's quotation gone and the draft still held back, the
  three filters, the chip both ways, no name refused, a blank pad refused, real ink approving,
  the receipt, and the approval landing in `settings`.
- **items 6/7/8/13 on the case page (19 ×2)** — the five buttons in order, the sixth gone, the
  styled dialog for เปลี่ยนสถานะ and the danger one for ปิดเคส, cancel changing nothing, confirm
  really closing, and the whole เริ่มหน้างาน round trip ending on หน้างาน with that case.
- **cross-checks (12)** — the office row showing อนุมัติแล้ว and not duplicating its chip, the
  two-question delete completing through the dialog and landing in the bin, and หน้างานทั้งหมด
  closed to a plain technician while หน้างาน still opens for them.

`node --check` passes on all 84 files in `js/`, `auth/` and `pages/`, and the case page's inline
script parses through `new Function`. **`node` IS installed (v24.19.0)** — part 24's note that it
is not is stale.

### Open / risk

1. **The storage guard drops the device's CACHE of old attachments, not the attachments.** They
   are re-fetched on the next sync. A device that is offline, has shed, and then reloads will
   show a document glyph instead of an old photo until it is online again. Rows the cloud has
   never acknowledged are never shed.
2. `imode_test_v532_service_reports` is already 832 KB of before/after photos and is heading the
   same way. It is not shed today; if it starts failing, it is one more entry in js/72.
3. **มอบหมายงาน still cannot change a technician** (part 22) and now **หน้างาน no longer shows
   the whole queue** — both are on purpose, but between them an admin's habits have moved twice.
   The way to the queue is หน้างานทั้งหมด.
4. Six confirmations are still the browser's grey box, listed above with the reason.
5. A report saved from now on stores the three-word vocabulary in `checklist`. Anything written
   against `OK` / `NG` / `N/A` — an export, a report — will not recognise it.
6. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database. `settings.quoteApprovals` and `settings.caseFeedback` go through the same open door.
7. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

---

## Session Change Log — 2026-09-18 (part 27): งานบริการมีสองชั้น, and a radio stretched to full width

### First, a gap in this file

Five commits from 2026-09-17 — `5c8ceee`, `78cd7bb`, `8425799`, `9890ce0`, `228fc62` — were
pushed from another machine and **have no entry here**. They carry the quotation sign-off, the
technician Back-to-Home history rule, and the whole Workshop flow (`js/79`, `js/80`, `js/81`, and
a large addition to `service-case-detail.html`). Read their commit messages until this is written
up. `228fc62` says of itself: *tested end to end at 1440 only; the phone width and the earlier
suites were not re-run.*

### 1. THE RADIO BUG: `.scd-ce-f input` was stretching every radio to `width:100%`

Reported with a screenshot of the Workshop options inside ลงรายละเอียดเคส: the dot floating in
the middle of the row, the label squeezed to the right and wrapping.

Two rules in `service-case-detail.html`, **the same specificity (0,1,1)**, and the later one wins:

| line | rule |
|---|---|
| 427 | `.ws-radio input{accent-color:var(--imode-blue)}` |
| 511 | `.scd-ce-f input,…{width:100%;padding:10px 11px;background;border;border-radius}` |

A radio given `width:100%` still draws its dot centred inside that now-full-width box, which is
exactly what the screenshot showed. One rule at (0,3,1) fixes it, and it also repairs the
**บันทึกส่งคืนเครื่อง** form, which had the same fault and had not been reported yet.

Measured after the fix with real geometry rather than by eye: the radio is 13 px wide and sits
10 px from its label's left edge.

### 2. หมวดหมู่งาน — the two-level model

Asked for: *"ปกติแล้วเราจะมี Service, maintenance, PM, online, workshop ใช่มั้ย แต่ทีนี้มันจะมี
หมวดหมู่อยู่ คือ 1. field service 2. workshop 3. online"*. The owner chose **two levels** (pick the
category, then the work type within it), **in the ลงรายละเอียดเคส form only**, and **no schema
change**.

```
Field Service  ช่างไปหน้างานลูกค้า      → Service · Maintenance · PM · ติดตั้งเครื่อง
Workshop       ลูกค้าส่งเครื่องเข้าบริษัท  → Service · Maintenance · PM
Online         แก้ไขทางออนไลน์         → Service · Maintenance
```

Online and Workshop stop being work types and become categories. `ติดตั้งเครื่อง` is kept under
Field Service because `settings.serviceTypes` still holds it and no existing case may become
unrepresentable.

| File | What |
|---|---|
| `js/82-v70CaseCategoryScript.js` | **new** — the model, and the picker in the application's case form |
| `service-case-detail.html` | the same picker in its own ลงรายละเอียดเคส, plus the radio fix |
| `index.html` | one `<script src>` after js/81 |
| `js/03-app-core.js`, `js/53-v70PortalCaseViewScript.js` | one expression each — see §5 |

### 3. Where the pair lives, and the field that was already being thrown away

**`js/79` writes `c.caseType` and NOTHING reads it.** `cloudUpsertCase()` builds an explicit
column list and has no `case_type`, so that value never leaves the device and the next
`syncCloud()` — which replaces `cases` wholesale — wipes it. A second field of that kind would
have died the same way, silently. Checked before designing anything else.

So two columns that already exist carry the pair:

- **`service_type` holds the CATEGORY**, still as one of the five strings the system already
  stores, so every existing reader keeps working untouched — in particular `WS_TYPE`
  (`ลูกค้าส่งเครื่องเข้าบริษัท`) in `js/81` and `isWorkshopCase()`, and `ONLINE_TYPE`
  (`แก้ไขออนไลน์`) in the case page's online section. The category decides it; `PM` and
  `ติดตั้งเครื่อง` keep their own string while the category is Field Service, because that is what
  those two strings have always meant.
- **`field_status_log` holds the exact pair**, as `{caseCat:'set', category, workType}`. A real
  jsonb column, so it travels; the newest entry carrying `caseCat` wins. It is the same shape the
  online tick and the Workshop logistics already use, and its `status` never matches one of the
  technician's nine field-status words, so the field track ignores it.

**Nothing is migrated in bulk.** A case written before this reads its category from its
`service_type`, and its work type from `service_type` (PM, ติดตั้งเครื่อง), else from the marker
js/79 leaves in the note (`ลูกค้าเลือกประเภทเคส: X`), else Service — and it takes the new shape the
first time somebody saves it. A pair the category does not offer (Online + PM) falls back to the
first one it does, so the picker can never open on an impossible combination.

### 4. Both forms keep their old control, hidden

`#fServiceType` and `#ceType` are **kept, with their ids and their full option lists**, and the
two visible selects only ever write into them:

- `saveCase()` reads `fServiceType.value` as an id global and would throw without it — the same
  reason js/76 keeps `#fStatus` and js/03 keeps `#fieldQueue`.
- On the case page, `wireOnlineSection()`, `wireWorkshopForm()` and `saveCaseDetails()` all read
  `#ceType`, and the online tick writes to it.

On the case page the hidden one uses **inline `display:none`, not `[hidden]`** — `.scd-ce-f` has
an author `display` rule that beats the UA `[hidden]` rule, and that page does not load css/23's
`!important` reset. Fourth time this trap has come up.

### 5. The entry had to be kept out of two progress timelines

Putting the pair on `fieldStatusLog` has a cost that only shows up in a browser: **two places
render every entry in that array.** Found by grepping the seven files that read the log, then
checked on screen.

| where | what it is | decision |
|---|---|---|
| `js/53` ความคืบหน้างาน | **the CUSTOMER's** progress list on the portal | filtered out |
| `js/03` ใบตรวจ status timeline | the technician's progress track | filtered out |
| `service-case-detail.html:912` | the case page's internal activity timeline | **kept** — it is an audit view, and the online and Workshop entries already show there |
| `service-case-detail.html:1205` `fieldReached()` | matches the nine field-status words | ignores it already |
| `service-case-detail.html:887` | attachments; needs `media` | the entry carries `media:[]` |

One filtered expression in each of the two, in place, because neither has a seam to wrap. A
หมวดงาน line is a classification, not a step anybody is waiting on — least of all the customer.

### Two bugs the browser found that reading did not

- **Ticking แก้ไขทางออนไลน์ did not move the category.** `wireOnlineSection()` ASSIGNS
  `type.value`, and assigning fires no `change` event, so a listener on `#ceType` alone never sees
  it. The resync now also hangs off the `#ceOnline` checkbox, registered after that handler on the
  same element, so `type.value` already holds แก้ไขออนไลน์ by the time it runs.
- **`applyLanguageTo()` translated "Field Service" into "หน้างานช่าง".** `data-no-i18n="true"` is
  NOT the answer here: that attribute only guards the text-node walker, and `<option>` elements are
  translated by a **separate pass that does not check it** (js/03:320). The option *value* is safe —
  that pass restores it from `dataset.i18nValue` — so only the visible text had to be put back,
  which `js/82` does in a wrapper on `applyLanguageTo`. The case page has no i18n at all, so
  without this the two documents would have disagreed on the name of the same category.

### Tests

Two new suites in the session scratchpad, run at 1440×1000 and 390×844
(`Emulation.setDeviceMetricsOverride`, not `--window-size`): **57 assertions, 0 failures,
0 page errors**, at each width, plus a 9-assertion timeline suite.

- **the model (17)** — three categories, the work list per category, every category →
  service_type mapping including that the category beats PM for a Workshop job, reading a legacy
  case from its type, from js/79's note marker and from the log, the impossible-pair fallback,
  `Remote Support` still reading as Online, and a repeat save writing no duplicate log entry.
- **the application's form (18)** — both selects, `#fServiceType` present and hidden, the work
  list shrinking with the category, the hidden type following, the i18n pass not eating the
  labels, a REAL submit (dispatched as an event; js/03 binds `onsubmit` on a `setTimeout(…,20)`),
  the pair landing in localStorage, and the popup reopening on what was saved.
- **regression (4)** — both version strings, 17 pages still open, no horizontal overflow.
- **the case page (18)** — the picker, the radio measured in pixels, the Workshop box appearing,
  the online tick dragging the category with it, a save writing the pair AND keeping the Workshop
  inbound/outbound entry, no horizontal overflow.
- **the timelines (9)** — a case seeded with a real field status on either side of a
  หมวดงาน entry: the ใบตรวจ timeline shows the two real ones and not the classification, and a
  real customer walk (`?serial=` → ประวัติ Service → open the case) shows the same two and never the
  word หมวดงาน anywhere in the page body.

`node --check` passes on all **87** files in `js/`, `auth/` and `pages/`; the case page's inline
script parses through `new Function`.

### Harness notes worth keeping

- **Chrome builds `webSocketDebuggerUrl` from the request's Host header.** Asking `/json/list`
  with `Host: localhost` hands back `ws://localhost/devtools/page/…` with **no port**; the driver
  then connects to port 80 and dies with a bare "websocket error" after a long hang. Build the URL
  from the target id and the real port instead.
- Node's stdout is block-buffered when redirected or piped, so a hung suite prints **nothing** and
  looks exactly like a boot failure. Write every line with `fs.appendFileSync` to a log file.
- Give every CDP call a timeout. Without one, a single unresolved `Runtime.evaluate` hangs the
  whole run with no error and no output.
- A bash heredoc silently truncated a ~9 KB file mid-line, twice. Check the byte count after
  writing, or use a real file-writing tool for anything large.

### Open / risk

1. The pair lives on the case's `fieldStatusLog`, so **any NEW renderer of that array has to skip
   `caseCat` entries**, the way the two in §5 now do. Two of the five existing consumers needed it.
2. A Workshop PM job stores `service_type = ลูกค้าส่งเครื่องเข้าบริษัท`, so SQL read directly cannot
   tell it from a Workshop repair; the work type is in the log. The same trade as the crew
   comma-list in part 17 §2.
3. `js/79`'s customer form still asks the old five-item ประเภทเคส question. It was deliberately
   not changed — the owner scoped this to the ลงรายละเอียดเคส form — and its answer still feeds
   the picker's default through the note marker.
4. `c.caseType` is still written by js/79 and still read by nothing. Left alone rather than
   removed; it is harmless, but it is not a field to build on.
5. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database.
6. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

---

## Session Change Log — 2026-09-19 (part 28): a bug sweep — dates, money, stock, and three layouts

The owner asked for a full bug hunt rather than a feature ("ตรวจหาบัคทั้งหมด และแก้ไขมัน"). No
new module, no new file, no storage key, no schema change, no Supabase setting, version
untouched. Seven defects were found, every one **measured in a browser before it was touched**
and re-measured after.

| File | What |
|---|---|
| `js/03-app-core.js` | `localISO()` / `todayISO()`; `addMonthsISO`; the travel-zone lookup; the dead `sw.js` registration |
| `js/04-v67EnhanceScript.js` | the six date defaults; **`savePurchaseOrder` stock is a transition, not a state** |
| `service-case-detail.html` | its own `todayISO()`, for the two Workshop date fields |
| `css/23-v70-responsive.css` | §8 the dashboard donut, §9 the pager overlap, §10 the distance box |
| `pages/customer-portal.html` | **deleted** — the superseded copy of the customer page |

### How the sweep was run, because the method found things reading would not have

A CDP driver in the session scratchpad (not added to the repo), carrying every harness note
this file records. Passes, in order: `node --check` on all 92 JS files · all 287 inline
`on*=` handler names resolved at runtime (0 missing) · duplicate element ids (0) · parse-time
captures of a `window.*` defined only in a later file (0 real) · every page walked and every
non-destructive control clicked as admin and as technician · the customer portal walked on a
390px phone · the whole business flow asserted on OUTCOMES (19 assertions) · role permissions
across five consecutive reloads · a responsive sweep at eight widths measuring per-element
clipping · hostile data (quotes, an `img onerror`) through every list and popup · a
rendered-page scan for NaN / undefined / Invalid Date / object Object.

Clean, and worth recording so the next session does not re-derive them: **no handler is
missing, no id is duplicated, escaping holds everywhere (19/19), permissions do not drift any
more, the crew-vs-lead comparison of part 25 has no remaining sites** (all five survivors are
guarded `imodeIsAssignedTo` fallbacks), **only ONE accumulating write exists in the whole
project** (the PO one, below), and no page scrolls sideways at any width from 360 to 1920.

### 1+2. THE DATE BUGS: `toISOString()` is UTC, and this is a UTC+7 country

`new Date().toISOString().slice(0,10)` is the date **in UTC**. Bangkok is UTC+7 with no DST,
so between **00:00 and 06:59 local it answers yesterday** — 7 hours of every 24. It was the
"today" behind 23 expressions: the dashboard's `todayKey`, and the default date on the QC,
petty cash, purchase order, machine document, sales quotation and warranty forms.

The dashboard one is the clearest: `todayList` compares `c.appointment.slice(0,10)` — which is
a **local** `datetime-local` string — against that UTC key. Before 07:00 they disagree and
งานนัดหมายวันนี้ silently falls back to "nearest appointments" instead of today's.

`addMonthsISO()` had the same fault one step worse and **always**, not only before 07:00:
`dateISO(v)` is `new Date(v+'T00:00:00')`, a LOCAL midnight, and `toISOString()` then read it
back in UTC. Measured in Asia/Bangkok, 8 cases of 8 wrong:

```
addMonthsISO('2026-09-19',12)  ->  2027-09-18   (should be 2027-09-19)
addMonthsISO('2026-01-31',12)  ->  2027-01-30
addMonthsISO('2026-03-31', 1)  ->  2026-04-29
```

So **every warranty registered through the UI ended a day early**, and the warranty form
showed it: start 2026-09-19, ระยะเวลา 12 เดือน, สิ้นสุด **2027-09-18**.

`localISO(v)` / `todayISO()` sit beside `dateISO` in js/03 and serialise the date parts the
user actually sees. `service-case-detail.html` is a separate document and carries its own
copy — **the two must stay in step**. `createdAt` / `updatedAt` are full UTC ISO timestamps and
were deliberately not touched; only date-only strings changed. `normalizeDateTimeLocal()`
(js/03:243) was already correct — it does the `getTimezoneOffset()` compensation — and js/66's
period filter is all-local and was already correct too.

### 3. THE TRAVEL CHARGE: the zone bands had gaps, and a gap fell through to 10 THB/km

`getQuoteTravel()` matched `d>=min && d<=max`. The table is written in whole km (0-15, 16-30,
31-50 …) but `#qDistance` is `input type=number step=0.1`, so **15.5 km matched no zone at
all**, fell through to the `zones[length-1]` fallback — Z6, the >180 km per-km rate — and
quoted **155 THB instead of 250**. Measured, all undercharging:

```
15.5 km -> 155 (should be 250)    50.5 km -> 505 (should be 600)
30.5 km -> 305 (should be 400)    80.7 km -> 807 (should be 900)   120.2 km -> 1202 (1300)
```

A zone is now read as an **upper bound** — it covers everything above the previous zone up to
and including its own max — so the first zone whose max is open or `>= d` wins. Every whole-km
value in the documented table is unchanged; only the gaps are filled, and they fill **upward**
(15.5 km is more than 15, so it is the "up to 30" band). That is a pricing decision and is
stated at the code. `getQuoteTravel` is the only zone lookup in the project — js/06's `zones`
is for drawing the rate table, not for pricing — so this is the one fix point.

### 4. THE STOCK BUG: receiving is a transition, not a state

`savePurchaseOrder()` added `obj.qty` to the part whenever the status **read** `รับเข้าแล้ว`,
with no look at what the PO said before. So re-opening an already-received PO and pressing
บันทึก — to fix a supplier, a unit cost, a note — added the whole quantity again, compounding
on every save. Driven in a browser on a part holding 2:

```
receive 5  -> 7      re-save -> 12      re-save -> 17      correct qty 5->8 -> 25
                                                           (it should have been 10)
```

The delta now comes from the transition between the OLD row and the new one. It is idempotent
and also handles the two cases the old code could not: correcting the quantity while already
received (apply only the difference), and taking a received PO back to สั่งซื้อแล้ว / ยกเลิก
(give the stock back). All six transitions asserted.

**This was the only accumulating write in the project** — every other `save*` replaces rather
than adds — which was checked rather than assumed.

### 5+6+7. Three layouts, all measured rather than eyeballed

- **The dashboard status legend was cut off.** `.dashboard-primary` is three fixed `fr`
  columns, so between the 900px breakpoint and about 1600px the donut panel is only ~300px
  wide; `.status-donut-wrap` asks for a hard `220px` first track out of that, leaving the
  legend **87px — its min-content** — so labels broke a character at a time ("มอบ / หมา /
  แล้ว") and css/23 §2's `overflow:hidden` chopped the right edge off each card. The constraint
  is the PANEL's width, not the viewport's, which is why the existing `@media` collapse never
  fired. Fixed with a **container query** scoped by `:has()` to the one panel that holds a
  donut. 1024 and 1920 are untouched; 1280 and 1440 now stack and every label reads in full.
- **The 10/25/50/100 pager overlapped the buttons beside it** at 1024 (iPad landscape) on
  customers / petty cash / spare parts — `flex:1 1 0%` with `min-width:0` squeezed it to 163px
  against 182px of controls, and 19px ran past the 12px gap into the button row.
  `min-width:min-content` lets the already-`flex-wrap:wrap` head wrap instead. Verified
  `overlapPx: 0` at 1440 / 1280 / 1024 / 900 / 768 / 390.
- **The travel-distance box was 26px wide** at 1280 — type `1250` and 35px of it is cut off —
  because the row is grid `minmax(0,1fr) auto` beside a `white-space:nowrap` button, so the
  input is allowed to collapse to nothing. This is the field that feeds `getQuoteTravel()`.
  Flex with wrap and a 90px floor; the Maps button drops to its own line when there is no room,
  which is what the 640px rule already did by hand. `cut: 0` at every width.

### The dead service-worker registration

`js/03` ended its `load` handler with `navigator.serviceWorker.register('sw.js')`. **There is
no `sw.js` in this project and never has been**, so it answered 404 on every page load on every
device, including a customer's phone; the `.catch()` swallowed it but Chrome logged it twice
per boot. Removed. If a PWA is wanted later, ship `sw.js` first, then register.

### `pages/customer-portal.html` deleted

It was the **pre-rename, pre-redesign** copy of the customer page — 7 action buttons, the old
blue header, no news card, no `base` tag. Nothing has referenced it since part 13 renamed the
file to `customer-home.html`, but it was still tracked and still deployed, and its name matches
the section id (`page-customer-portal`) that every stylesheet and function addresses — so it is
exactly the file someone edits by mistake. Recoverable with
`git show HEAD:pages/customer-portal.html`.

### A latent fragility, deliberately NOT patched

Roughly 25 modals bind their submit handler on `setTimeout(()=>xForm.onsubmit=…,20)`. If a
second `openModal()` replaces `#modalBody` inside that 20ms, the id-global is gone and the
timer throws a ReferenceError — and the form then silently does not save. **Every one of the 25
was opened individually and all 25 wired correctly**; the only way to provoke it was a crawler
clicking 24 settings cards in four seconds, and it picked different buttons on each run. No
human path reaches it, so js/03 was not churned for it. Worth knowing if a future patch ever
calls `openModal()` twice in a tick.

### Tests

All suites re-run against the fixed build: boot and 26 pages · the 287 handlers · the business
flow (19) · every modal form wiring (25) · permissions across five reloads · the case detail
page and its 19 actions · hostile data (19) · the จบงาน signature gate (4) · PO transitions (6)
· the fix verification suite (32) · the responsive sweep at eight widths · the customer portal
on a 390px phone. **0 failures, 0 page errors, and the boot console is now silent** — the two
`sw.js` 404s were the only entries left. `node --check` passes on all 92 files in `js/`,
`auth/` and `pages/`, and the detail page's inline script parses.

### Open / risk

1. **Fractional travel distances now price upward** (15.5 km → 400, was 155). That is the
   documented table applied honestly, but it is a price change on any quotation that carried a
   decimal. If the owner would rather round the distance to whole km first, that is a one-line
   change in the same expression.
2. **Warranties already saved keep their one-day-short end date.** The fix applies from now on;
   nothing was migrated, because a stored end date may have been edited by hand.
3. **Stock already corrupted by a re-saved purchase order stays corrupted.** The fix stops it
   happening again; it cannot know how many of the past increments were real.
4. `c.serviceTeam`, `c.checkInAt` and `c.machineTh/En` are set on a case but are **not in
   `cloudUpsertCase`'s column whitelist**, so they do not survive a sync. `serviceTeam` and
   `machineTh/En` have fallbacks and degrade quietly; `checkInAt` simply does not travel. Not
   fixed here — it needs a schema decision, and part 18's rule stands: a field added to a case
   never reaches `service_cases` unless `cloudUpsertCase` names it.
5. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write
   this database.
6. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

---

## Session Change Log — 2026-09-20 (part 29): the owner's test pass — accounts, realtime, the crew, and a purchasing page

Nine items reported after the owner walked the process end to end, plus one defect found while
checking the first of them. Version untouched, no storage key renamed, no schema change.

| File | What |
|---|---|
| `js/09-v68UatAccountsScript.js` | `tech_test1` → T003 (พี่เต้); `R&D_test1` removed |
| `js/23-v69CloudConfigScript.js` | **the login provider ships with the app** — see §0 |
| `js/03-app-core.js` | the ใบตรวจ names the whole crew; the technician card shows its account |
| `js/74-v70NewJobBadgeScript.js` | a bigger chip, and the count on every งานของฉัน entry |
| `js/89-v70PurchasingPageScript.js` | **new** — การจัดซื้อ as a page of its own |
| `service-case-detail.html` | realtime; the whole crew; the customer's satisfaction |
| `index.html` | one `<script src>` |

### 0. THE DEFECT FOUND WHILE CHECKING พี่เต้: a new device cannot sign in

Asked to link `tech_test1` to a technician called พี่เต้, and to check first whether they
already had an account. Reading the live database answered that (พี่เต้ = **T003**, no
account) and turned up something else: **`tech_test1` → `T-TEST-1` and `R&D_test1` → `T-RD-1`
both pointed at technician records that had been deleted.** Those two accounts signed in
perfectly and then saw an empty งานของฉัน and an empty หน้างาน for ever, because every one of
those screens resolves work through `currentUser.technicianId`. Nothing on any screen said so.

Then the sign-in itself proved intermittent, which is worse. Measured on a fresh profile:

```
before syncCloud() lands   settings.authConfig = null
                           -> selectProvider() (auth-integration.js:31) finds no cfg.provider
                              and falls to Auth.autoSelect(['supabase','local'])
                           -> supabase wins, because js/23 has just configured a cloud
                           -> tech_test1: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
after  syncCloud() lands   authConfig.provider === 'local'  ->  the same sign-in works
```

`settings.authConfig` **has no default anywhere in the code** — it exists only in the
`system_settings` row, where part 17 §9 put it. Only three accounts exist in Supabase Auth
(`03-users.sql`), so on any new device, cleared browser or incognito window **four of the six
accounts were rejected until the settings row came down.** A technician opening the site on a
new phone hit it every time and it looked like a wrong password.

`js/23` now writes `provider:'local'` locally if nothing has set it, and re-applies after a
sync (`syncCloud()` replaces `settings` wholesale). It never overrides an explicit value, so
moving the project to Supabase Auth later is still one settings change. Verified: all six
accounts sign in on a fresh profile 1.5s after navigation, before any sync can land.

### 1+2. The accounts

`tech_test1` now points at **T003 (พี่เต้)** and signs in to four open jobs. `R&D_test1` is
removed outright, as instructed. The `R&D` role and js/25's `T-RD-1` seed are untouched —
only the account is gone.

**The technician card now shows which account is linked** (`techAccountLabel()`, one new
`.detail-box`), read through `window.uatAuth` so accounts created or re-pointed in js/39 are
included. A technician with no account reads "ยังไม่มีบัญชี", which is exactly the state that
was invisible above.

### 3. REALTIME: the stream was never the problem — the page was a different document

Reported as the quotation track sitting on รอลูกค้าเซ็น after the customer had signed.
Measured first, two browsers against the live project: an INSERT reached the other device in
5s and a status UPDATE in **0.5s**. `09-v70-realtime-all.sql` had been run.

**`service-case-detail.html` loads supabase-js and js/51 and nothing else** — js/85 is
index.html's, so this page had no subscription of any kind. The one screen an admin sits on
while waiting for a customer was the only one that could not update itself.

New `CaseLive` in that file subscribes to `service_cases` (this case only), `quotations` and
`system_settings`, and writes the incoming row into localStorage in the app's shape before
re-rendering. **Only the fields this page displays are mapped** — restating `fromCaseDb()`
here in full is how two copies drift (part 18's media column). A repaint is skipped when
nothing really changed, so your own writes do not make the page flash, and deferred while a
drawer is open so an update cannot close a panel under the person reading it.

Measured after: **0.5s, no reload, `scdReady` still true.**

### 4+5. The crew, in the two places that showed one name

- **The case page** loaded `loadTechnician(c.assignee)` — one record. New `loadCrew()` reads
  `c.assignees` first and the comma list in `c.assignee` second (js/38's wire format), and the
  มอบหมาย drawer prints one chip per technician with the lead marked. `m.assignment.technician`
  stays the lead, because several expressions read it as a single record. `loadCrew` is
  appended **last** in the `Promise.all`, since everything below reads `r[]` by index.
- **The printed ใบตรวจ** filled ผู้ดำเนินการ with `techById(x.techId)?.name`, and `x.techId` is
  written as `c.assignee||fieldTechId` — the lead, every time. There is no per-step record of
  who pressed the button, so `reportOperatorNames()` prints everybody the case is assigned to,
  keeping the step's own id when it names somebody no longer on the crew. Reads
  "พี่ย้ง · พี่เต้" now.

### 6. The satisfaction score was already being collected and never shown

`loadFeedback()` on the case page returned a hard-coded `null` under a comment saying no such
store existed. **That comment went stale in part 26**: js/77 has been writing
`settings.caseFeedback` from the five faces under the signature pads on the technician's ใบตรวจ
ever since. The live project already held one — `{rating:5, comment:"งานดีคับรู้มือ"}` — while
the panel said the system was not collecting it.

It reads the real record now, and `feedbackHTML()` shows all four things stored: the five faces
with the chosen one lit, the score and its word, the customer's comment, and who took it and
when.

### 7. งานใหม่ was working, and invisible

`js/74` was correct — the chip appears, on the right row, and clears when the job is opened
(all asserted). Two reasons the owner never saw it: the first visit for an account marks
everything currently assigned as read, by design, so nothing lights up until the *next* job
arrives; and a 10px uppercase chip on a 390px screen reads as decoration.

The chip is 11.5px now, and **the count is on every งานของฉัน entry** — the sidebar item and
the mobile bottom bar are both `[data-page]` — so a technician can see that something arrived
without opening the page. `imodeNewJobCount()` already existed; the badge is recomputed rather
than incremented so it cannot drift from the rows.

### 8. การจัดซื้อ

New page + sidebar entry. The ระบบการสั่งซื้ออะไหล่ panel is **moved, not rebuilt**: it carries
`<tbody id="purchaseOrderTable">`, which `renderSpareParts()` in js/04 fills by id on every
render. Rebuilding it would leave js/04 filling a table nobody can see. js/04 is not edited.

Gated on **`parts.view`, deliberately an existing key** — a file that pushes a new key into
`PERMISSION_CATALOG` has to load before js/20, and this one loads long after it. It finds its
nav group through the `spare-parts` page rather than naming one, so a later re-organisation
moves both together. สต๊อกอะไหล่ keeps its own table and KPIs.

### Tests

Every suite re-run: 93 JS files syntax-clean and the case page's inline script parses ·
regression at 1440 and 390 (9 + 9, 27 pages, console silent, no horizontal scroll) · all six
accounts on a fresh cloud device (6) · tech_test1 = พี่เต้ with real jobs (5) · the case page
live against the real database (10: realtime SUBSCRIBED, status in 0.5s, feedback, crew) ·
the technician account row (3) · the report operator column (2) · the new-job chip (4) and the
nav count (6) · the purchasing page (10). **0 failures, 0 page errors.**

### A harness lesson worth keeping

`open(path,'w')` **truncates before it writes**, so a `UnicodeEncodeError` part-way through
left `service-case-detail.html` at **0 bytes**. Restored from a copy taken minutes earlier and
re-applied. Any script that rewrites a file in this project now writes a `.tmp` beside it and
`shutil.move`s it into place, and lone surrogates are avoided by letting Python emit the real
characters rather than `\uD83D` pairs.

### Open / risk

1. **The case page now subscribes to three tables.** It is one channel per open tab; a tab left
   on a case holds it until closed. Same exposure as js/85 and the same blanket RLS.
2. The realtime mapper covers only the fields the page shows. A field added to the case that
   this page starts displaying has to be added there too, or it will update only on reload.
3. `imode_v70_seen_jobs` still marks everything read on an account's first visit, so the first
   batch of jobs never lights up. That is deliberate; it is only worth knowing when testing.
4. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write
   this database.
5. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

### Follow-up (2026-09-20/21): the sidebar animation, and a signature that a render could erase

**The sidebar buttons were too fast.** Slowed transform .26s → .42s and the colour/glow
.2s → .34s. The fold timings for opening and closing a nav group (.34s) are a different
animation and were left alone.

**The value is written in THREE places and css/01 is not the one that wins.** Editing css/01
alone changed nothing — measured, still 0.2s. `js/36` injects
`.side-nav .nav-item{transition:…!important}` at runtime (specificity 0,2,0 and `!important`),
and `css/10-v68-style-correction.css` carries the icon chip's own `!important` copy after
css/01. All three had to move together or the icon lands before the button does. A note now
sits at each one.

**The quotation signatures.** Reported: "ลายเซ็นแรก ok แต่ลายเซ็นที่ 2 พอเซ็นไปแล้วลายเซ็นลูกค้าหาย".
Could **not** be reproduced offline — the walk was driven through the real controls (open the
step-2 drawer, open the document, ink each pad, press บันทึก) and both signatures saved with
`quoteApprovals` intact each time. So the report is a cloud-only path, and two guards were put
in where it can happen:

- **`qsFillCell()` cleared before it decided.** It did `area.innerHTML=''` unconditionally and
  only then put an image back if it had one. `openQuoteDoc()` re-stamps all three cells every
  time it opens, and `finish()` re-opens it after each staff signature — so a render pass whose
  `sig` came through empty wiped the customer's signature off the stored paper. Empty now means
  "nothing new to stamp here", not "clear this box": a render may add to the paper and never
  take away. ล้างลายเซ็น still works, because it removes the record and the document is
  regenerated rather than re-stamped.
- **`CaseLive.applySettings` could import an approval with no image.** `saveStaffSign()` writes
  the WHOLE settings object back to `system_settings` and this subscription hears its own echo;
  a copy that came back without `sig` would delete the signature from this device.
  `mergeApprovals()` keeps whichever copy actually carries the image. Approvals are only ever
  added, so this cannot hide a real change.

**Worth saying plainly:** the second guard is against a hole that only exists because this
session added the subscription. If the owner still sees it, the thing to check is whether the
data is gone or only the drawing —
`JSON.parse(localStorage.imode_v5_settings).quoteApprovals`.

**The satisfaction panel links to the ใบตรวจ.** The owner's first description was read as
"show the score", which was only half of it: they wanted the score *and* a way through to the
sheet it was taken on. `openReportDoc()` opens `reportDocsHTML()` — the read view part 24 built
— on its own, so it stays on this page and costs neither a reload nor the re-login that every
hand-off back into the application still does. The button shows whether or not a rating exists
yet; with none, the sheet is the thing you most want to look at. Nothing was added to the PDF,
as instructed.

**Not exercised in a browser:** that last button. Everything else in parts 28 and 29 was.

### Harness note worth keeping

A patch script that matches a long literal against this project's files will fail for two
reasons that look identical: the script's own file may be stored with **CRLF** while the target
reads back as `\n`, and `service-case-detail.html` contains a **non-breaking space** (U+00A0) in
`textContent=name||' '` that no editor round-trip preserves. Normalise both sides, or —
better — replace **by index between markers** rather than by matching text. And always write a
`.tmp` and `shutil.move` it: `open(path,'w')` truncates before it writes, which left that file
at 0 bytes once this session.

---

## Session Change Log — 2026-09-21 (part 30): the settings blob deleted the signatures

One reported bug: sign ผู้อนุมัติ and ผู้จัดทำ on `service-case-detail.html`, reload, and every
signature is gone — the customer's included — while `index.html` on a local Five Server still
showed them all. One new JS file, small edits to two existing ones and one script tag.

| File | What |
|---|---|
| `js/90-v70SettingsMergeScript.js` | **new** — a settings push may not delete another device's record, and a sync may not delete one this device holds |
| `js/85-v70RealtimeScript.js` | `quoteStaffSigns` and `quoteDocs` added to `SETTING_KEYS`; the {id:record} maps are now unioned, not replaced |
| `service-case-detail.html` | saving one pad no longer empties the other; the same union rule in `CaseLive` |
| `index.html` | one `<script src>` |

### THE BUG: `settings` is one jsonb blob and every device pushes its whole copy

Measured on the live project before anything was written, and the chain is exact:

| | |
|---|---|
| 01:28:45 | the case page saves the two staff signatures. `quotations.authorized_by` / `prepared_by` are real columns and survived; the images went to `system_settings.data.quoteStaffSigns`. **That write was correct** — it reads the row fresh and merges only its own key. |
| 01:28:45 | the application, open elsewhere, hears the `quotations` UPDATE on realtime. js/80's fingerprint changed, so it re-bakes the paper and calls `push()` → `saveLocal()` + `cloudSaveSettings()`. |
| 01:33:31 | `cloudSaveSettings()` (js/03:1727) writes `data: settings` — **the whole in-memory blob, read at boot**. It does not merge; it replaces. |

Read back out of the database afterwards: **`quoteStaffSigns` absent entirely**, `quoteApprovals`
holding only `…-019` and `…-020` with the reported quotation's customer approval gone too, and
the re-baked paper fingerprinted `อนุมัติ|2026-09-21T01:28:45.839Z|||2568||` — the two empty
fields at the end are the staff-signature timestamps the application could not see.

**Nothing was wrong with the signature code.** The flaw is that any key another device added
since this device last read is destroyed on the next push. js/85 made it certain rather than
merely likely: `quoteStaffSigns` was not in its `SETTING_KEYS`, so a running application could
never learn a staff signature existed.

Why the local Five Server looked fine: a different origin, whose localStorage still held the
records the cloud had lost.

### The rule js/90 imposes, in both directions

```
a settings push may not delete an id the cloud has and this device does not
a settings sync may not delete an id this device has and the cloud does not
```

Additive by id only, over `quoteApprovals`, `quoteStaffSigns`, `quoteAccepts`,
`quoteRequestLink`, `caseFeedback`, `caseStatusLog` — all {id:record} maps that only ever grow.
An id present on both sides is left exactly as it is, so a deliberate edit still wins and no
configuration key is involved. The sync half also **heals**: a device that still holds a record
the cloud lost pushes it back on its next sync, which is how signatures already destroyed come
home without anybody re-signing — provided that device loads this file before it syncs again.

**`quoteDocs` is deliberately NOT protected**, although it is the same shape. It is a cache
js/80 re-bakes on a fingerprint change, it holds no signature (`renderPaper()` strips every data
URL), and it is capped at `DOC_CAP=25` — today 71 KB of the row's 108 KB. Protecting it would
mean each device re-adding what another had just trimmed, so the cap would never hold. Where a
merge and a cap do meet (js/69's per-case cap, js/75's `SIG_CAP`) **the merge wins and the cap
becomes approximate**; js/75 is unaffected in practice because it keeps the id and drops only
`.sig`, and an id present on both sides is never touched.

Cost: one ~110 KB read of the settings row before each settings push, of which there are a
handful per session. Loads last, after js/29, js/47 and js/71, so its wrappers are outermost.

### Saving one pad emptied the other

Separately real, and exactly as reported. `saveStaffSign()` ends by calling `openQuoteDoc()`,
which rebuilds the whole panel — and **a rebuilt `<canvas>` is blank**, so ink drawn in the
other pad but not yet saved, and a name typed into it, were thrown away by the act of saving its
neighbour. Pressing บันทึก there then refused ("กรุณาเซ็นชื่อในกรอบก่อนบันทึก") and nothing was
stored. The rebuild is what stamps the signature onto the paper and draws the ✓ chip, so it
stays; `qsCapture()` / `qsRestore()` take what is on screen immediately before it and put it
back immediately after.

### Tests

Three headless suites, **50 assertions, 0 failures, 0 page errors**:

- **M (17)** — the measured chain replayed against stubs: a push keeps the customer signature
  and both staff images the cloud had, adopts them locally, still pushes configuration, does not
  overwrite an id both sides hold; a sync keeps what the incoming copy dropped, still takes what
  the cloud has, still lets configuration come from the cloud, pushes the union back to heal the
  row, converges (a second sync pushes nothing), and a failed pre-read still lets the save through.
- **C (22)** — the real case page driven with real mouse events: ink in both pads, save one, the
  **other pad keeps its ink and its typed name**, both signatures stored, the customer approval
  untouched by either save, all three stamped on the paper, and **all three still there after a
  reload** with both ✓ chips.
- **B (11)** — the application boots with js/90 in the chain, the merging wrapper is installed, a
  push with no cloud resolves rather than throwing, both version strings unchanged, no overflow.

**The control matters here:** suite C run against `git show HEAD:service-case-detail.html`
fails 8 of 22 — the other pad at 0 ink, its name gone, the second signature never stored. The
suite detects the reported bug rather than merely agreeing with the fix.

`node --check` passes on all 94 files in `js/`, `auth/` and `pages/`, and the case page's inline
script parses.

### Open / risk

1. **The signatures already destroyed are not in the database.** `quoteApprovals['QT-SRV-202609-022']`
   and `quoteStaffSigns` were deleted at 01:33:31 and only exist in a browser that has not synced
   since. Loading the fixed build there restores them to the cloud automatically; otherwise they
   must be signed again. The names and dates are real columns and survived.
2. A settings push now costs a read of the row first. If that read fails the push proceeds as
   before rather than losing the save — so an offline device can still clobber.
3. `quoteDocs` is still replaced wholesale, by design. Losing an entry costs a re-bake.
4. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database.

### Follow-up (same day): one button for both signatures, and the phone layout behind it

Asked for: "เพิ่มปุ่มบันทึกทั้ง2ลายเซ็นพร้อมกันไว้ข้างล่างก็ได้นะ".

**`saveStaffSign(key)` is now `saveStaffSigns(keys)`** — one function saves any number of roles
in one pass, and the single-role buttons call it with a list of one. That is not only tidier: two
separate saves meant two separate read-modify-writes of the `system_settings` row, and the second
could read it before the first had landed and push the first back out — the same shape of race
that lost the signatures to begin with. Both together is **one read and one write**, and both
records carry the same timestamp, which is what the suite asserts to prove it was one pass.

- The new `💾 บันทึกลายเซ็นทั้งสอง` spans the pair (`grid-column:1/-1`, the same shape as the
  combined QR print button of part 12). **The two per-role buttons stay** — somebody signing only
  one still presses that one.
- **An empty block is skipped by the combined button** (only one role may be signing) but still
  complained about when its own button is pressed, because pressing that button is a statement
  about that block. **A half-filled block always stops the save**, whichever button was pressed:
  a name with no signature, or a signature with no name.

**The phone layout fault this exposed, pre-existing.** `#scdPanel.is-open` is a grid and
`.scd-modal-card` a flex column, and `min-width:auto` on each let them take their *min-content*
width from `.scd-qdoc{min-width:720px}` — the A4 paper. Measured on a 390px phone: the card came
out **794px wide**, so the pads, ล้างลายเซ็น, both save buttons and the new combined button all
sat half off-screen, and only the paper was ever supposed to scroll. `min-width:0` on
`.scd-modal-card` and `.scd-modal-body` fixes it: card 794 → 390, `.qs-wrap` 720 → 316, nothing
clipped, desktop identical (811 / 400 / 192 before and after).

Confirmed pre-existing by running the same probe against `git show HEAD:service-case-detail.html`
— byte-identical numbers — so it was not introduced by the combined button; it is fixed here
because that button is the thing it was hiding. **The first guess was wrong**
(`min-width:0` on `.scd-qdoc-wrap`, which changed nothing) and the constraint was only found by
walking the ancestor chain in the browser printing each element's width, `display`, `overflow-x`
and `min-width`. Worth doing that before theorising about a width.

Suite C is **42 assertions** now, still 0 failures: the combined button spans the pair and the two
per-role buttons survive; pressing it with nothing signed saves nothing and says why; ink with no
name is refused with the field called out; one role signed saves that one and skips the empty one;
one press saves both, both names reach the quotation row, one timestamp, one toast naming both
roles, both ✓ chips; all three signatures still on the paper after a reload; and on a 390px phone
the button is full width with nothing scrolling sideways.


### Follow-up (same day): the 📷 button, and the field track is readable at last

Two reported items. One edit to `js/32`, one to `service-case-detail.html`.

#### 1. WHERE 📷 บันทึกสถานะพร้อมรูป PUTS THINGS, and why ถัดไป died after it

**Where it stores.** The button calls `openFieldStatusModal(cid)` (js/03:996, rebuilt as a
stepper by js/26). Photos and clips are buffered in `pendingFieldStatusMedia`, and
`saveFieldStatus()` appends **one entry to `c.fieldStatusLog`** on the case:

```
{id, status, note, media:[{type,name,data,size}], createdAt, techId}
```

plus `c.fieldStatus`. That goes to `localStorage.imode_test_v532_cases` and, through
`cloudUpsertCase()`, to `service_cases.field_status_log` (a real jsonb column) — so it does
travel between devices. Nothing new was added; it has always been stored.

**Why the ถัดไป button then stopped working, measured in a browser:**

`closeModal()` is `modal.classList.remove('open')` (js/03:1129) **and nothing else**, so the
popup leaves its own `#fieldStatusSelect` and `#fieldStatusNote` in the document for good.
js/32's `advance()` appends a hidden box carrying **the same two ids** — and a duplicated id
makes the id-global an **HTMLCollection instead of the element**, so `saveFieldStatus()`'s
`fieldStatusNote.value.trim()` reads `undefined` and throws. It is an `async` function, so that
is a rejected promise, and `advance()`'s own `.then(clean,clean)` swallows it.

Measured on the real screen: `window.fieldStatusSelect` came back as `[object HTMLCollection]`
with `value undefined`, and the call rejected with *Cannot read properties of undefined*.
**Nothing saved, nothing in the console, and ถัดไป silently dead for the rest of the session
once the popup had been opened once.** Exactly "กดไปแล้วเหมือนมันเอ๋อ".

Fixed where the duplicate is created: `advance()` parks any existing element holding those two
ids (sets `id=''`), appends its own, and restores them in `clean()`. js/03 is not touched, and
the underlying habit — a closed modal keeping its markup — is left alone because js/29's modal
history stack restores that markup.

#### 2. The nine field circles open what the technician recorded

Item 2 was right that there was nowhere to see it: the note was shown nowhere on the case page
at all, and the photos only as anonymous thumbnails inside เอกสาร & รูปภาพ.

Every circle on the step-3 track is a `<button data-fstep="k">` now. Pressing one slides a panel
down under the track with **เวลา · ช่าง · the note · the photos and clips** of that status;
pressing it again, or ปิด, closes it. A step the technician has not reached says so rather than
being a dead circle. `openField` sits beside `openStep` and is read during render, because
`repaintProgress()` redraws the block — the same shape the drawer already used.

- The tiles reuse `mediaTiles()` and the page's existing lightbox, addressed by their index in
  `caseDetailModel.attachments` and **matched on the data URL**, so there is no index arithmetic
  and no second copy of either. A media item the page cannot match is counted, not hidden.
- `fieldTechName()` resolves `techId` through `imode_v5_tech`; for a crew that id is js/38's
  comma list, so the lead is who the entry is attributed to.
- The slide is a `max-height` transition, opened on the second `requestAnimationFrame` after
  insertion — an element inserted already-open has no start value to animate from.
  `grid-template-rows:0fr/1fr` would be tidier but carries a browser caveat; `max-height:1600px`
  is far above a note plus a row of thumbnails. `prefers-reduced-motion` drops it to a fade.

#### Tests

Two new suites, **37 assertions, 0 failures, 0 page errors**, plus every earlier suite re-run
(M 17 · C 42 · B 11) — **107 in total**.

- **F (15)** — the real workspace as technician_test1: ถัดไป advances; 📷 opens the popup and
  saving from it really writes an entry with the note into `fieldStatusLog`; **then ถัดไป still
  advances**, does not re-save the old note, and advances again on the next press.
  **Before the fix the same suite failed those last three** — field status frozen, log stuck at
  2 entries, no error anywhere — which is the report reproduced exactly.
- **T (22)** — nine circles are buttons; one opens with its note, the technician's **name** (not
  the id), the time, a photo tile that really decodes and a video tile; the panel **starts at
  height 0 and grows** with `max-height` transitioning; switching circles keeps exactly one
  open; an unreached step says so; ปิด closes it; a tile opens the lightbox; **opening circles
  changes no data** (status, fieldStatus and log length unchanged); no overflow at 390px.

`node --check` passes on all 94 files in `js/`, `auth/` and `pages/`.

#### Open / risk

1. The duplicate-id trap is fixed at `advance()`, not at its source. **Any future code that
   creates an element whose id a modal also uses will hit it again**, because `closeModal()`
   still leaves the modal body in the document.
2. The field panel is transient: a realtime repaint of the progress block closes it.

#### Follow-up: the panel slides shut as well

Closing was instant, because `repaintProgress()` removes the element and **a node that is gone
cannot transition**. `closeFieldDetail()` does the collapse by hand and repaints only once it
has finished.

The order matters and is the whole trick:

```
box.style.maxHeight = box.scrollHeight + 'px';   // pin to the REAL height
void box.offsetHeight;                            // reflow, so that is the start value
box.classList.remove('is-open');                  // opacity and margin-top go via CSS
box.style.maxHeight = '0px';                      // inline beats the class, so run it down here
```

Without the pin, `.is-open` is `max-height:1600px`, so removing the class would animate
1600 → 0: nothing appears to move until the value passes the content height, then it snaps.
The inline value has to be set on both sides for the same reason — inline wins, so the class
alone could not take it back down again.

`transitionend` is not trusted on its own (a browser that skips the transition never fires it),
so a 420ms timeout finishes the job and a `data-closing` flag stops the two from both
repainting. The circle drops its ring and its `aria-expanded` immediately rather than staying
lit through the collapse.

**Pressing a DIFFERENT circle still swaps instantly** — sliding out and back in for one press
would cost ~0.7s and read as sluggish rather than as an answer. Under
`prefers-reduced-motion: reduce` it closes at once instead of half-animating.

Suite T is **34 assertions** now, still 0 failures: the collapse **starts at the panel's own
height** (what the pin buys), passes through intermediate heights, never goes back up, ends
removed, the ปิด button takes the same path, a double press while it is collapsing still ends
closed and leaves the track usable, switching circles stays instant, and reduced motion closes
immediately.

**Testing note worth keeping:** reading `style.maxHeight` after `click()` returns always shows
`0px`, because the pin, the reflow and the run-down all happen inside one synchronous handler.
An animation has to be measured by sampling `getBoundingClientRect()` over time, not by
inspecting the style afterwards — the first version of these assertions failed for exactly that
reason while the code was correct.

#### Follow-up: the five main step circles slide too

Asked for after seeing the field panel do it. The drawer under the main track now opens and
closes the same way, and both share one pair of helpers — `slideOpen(id)` / `slideShut(id, after)`
with `slideWrap(id, cls)` and a `slideNext` flag.

**The chrome had to move.** `.scd-stepdrawer` carried the border, padding and background, and
at `max-height:0` those still paint a ~30px empty sliver. They are on a new
`.scd-stepdrawer-in` now; the outer element is a bare slider. Screenshot before and after is
identical.

**Three things that are easy to get wrong here, all found by measuring:**

1. **A repaint that is not a press must not leave the block invisible.** `repaintProgress()`
   replaces the whole progress block, and it is called by `applyStatus()`, by CaseLive and by
   the delete flow — not only by a press. A block re-rendered by one of those has to come back
   *already* open, or it sits at `max-height:0` with nothing left to trigger it. `slideNext`
   names the one block a given render is about to animate; everything else renders with
   `is-open` and `max-height:none`. The first version of the field panel had this bug.
2. **Opening must animate to the block's REAL height, not to the class's cap.** Measured: with
   the cap at 2400px and a 163px drawer, `max-height` passes the content height about **24ms**
   in, so it looked instant however long the transition was — the mirror image of what the cap
   does on the way out. `slideOpen()` sets `scrollHeight` explicitly and drops the cap to
   `none` once it has settled, so nothing can ever be clipped either.
3. **The two directions need different easings.** A declaration on the base selector is the one
   that runs when the class is *removed* (the close); the one on `.is-open` runs when it is
   added. Sharing `cubic-bezier(.22,.9,.3,1)` made the collapse look clipped — it is
   front-loaded, so a 226px panel was already down to 80px 55ms in. Closing eases **in** now.

**Pressing a different circle still swaps in place** for both tracks: sliding out and back in
for one press costs ~0.7s and reads as sluggish. Closing the drawer takes the field panel with
it, since it lives inside.

Suite T is **49 assertions**: the drawer grows and shrinks through intermediate heights, never
reverses direction, the cap is dropped on settle, the chrome really is on the inner element, a
repaint provoked by opening the field panel leaves the drawer open and not stranded, the ปิด
button takes the same path as the circle, switching steps stays instant, the field panel still
opens inside a settled drawer **without being clipped by it**, closing the drawer closes the
panel, and **none of it changes the case**.

**Two testing notes worth keeping**, both of which produced false failures first:

- `data-step` is the **0-based step index**, and a circle one ahead of the case is role `next` —
  it moves the case on or hits the gate, it is not a drawer toggle. Clicking `data-step="3"` on
  a case sitting at step 2 measures the gate, not the drawer. Find a toggling circle by
  behaviour rather than assuming one.
- The page's script is an IIFE, so `repaintProgress()` cannot be called from a driver. Provoke a
  real one instead — opening the field panel repaints the whole progress block.

#### Follow-up: 🖨 พิมพ์ / PDF on the quotation panel

Asked for beside บันทึกลายเซ็นทั้งสอง, so that is where it is. An account that may not sign
gets the same button on a row of its own, because reading and printing a quotation is not the
same permission as signing one.

**It prints the LIVE DOM, not `settings.quoteDocs[id].html`.** js/80 strips every data URL out
of the stored copy on purpose ("the signature rides in quoteApprovals already") and
`qsFillCell()` stamps the three signatures back in when the panel opens — so printing the
stored HTML would come out with three empty boxes, which is the whole thing the owner wants on
paper. A clone of what is on screen is what they are asking to print.

**The styling has to travel with it**, because this page does not load `js/03` and
`printQuotation()` is not available here. `quoteDocCss()` walks `document.styleSheets` and keeps
only the rules that dress the paper — the `.scd-qdoc` selectors, and `:root` for the custom
properties they resolve against — rather than the whole stylesheet, which would drag the modal,
the drawers and the app chrome into a window that has none of those elements. One rule needed
excluding by hand: `#scdPanel.is-open .scd-modal-card:has(.scd-qdoc)` names the paper but is
about the modal.

Then two overrides after the page's own rules, so they win: `@page{size:A4}`, and
`.scd-qdoc{min-width:0}` — inside the modal the paper carries a 720px floor it must not keep
when it *is* the document.

Every `src` is made absolute first: a relative URL inside a `window.open('')` document resolves
against `about:blank`, which is how js/18's QR sheet once printed a broken logo (part 12).
`onload` can already have gone by on a `document.write` page, so a 900ms timeout fires the print
as well, guarded by a flag. A blocked pop-up says so instead of failing silently.

**Verified by rendering, not by grepping.** The print document was built from a REAL paper taken
out of the live `quoteDocs` (`QT-SRV-202609-023`) and rendered at 820px: the full A4 sheet comes
out — logo, company header, QUOTATION title, the item table, Total / VAT / Grand Total, and the
three signature cells **side by side** (`tops [532,532,532]`) with all **4 images decoding**,
signatures included. A first pass with a hand-made stub paper printed as an unstyled stack,
which was the fixture being a stub and not the code — worth knowing before trusting a print test.

Suite C is **56 assertions**: the button is in the row beside the save-both button, pressing it
builds a whole document titled with the quotation id, the signatures are in it as data URLs,
every src is absolute, the paper's rules travelled and the modal's did not, `:root` came along,
A4 and no min-width floor, **it renders in an iframe with its stylesheet, three cells, every
image decoding and the paper wider than 700px**, and a blocked pop-up is reported.

#### Follow-up: save moves the job on, and a recorded step can be corrected — `js/91`

| File | What |
|---|---|
| `js/91-v70FieldStepEditScript.js` | **new** — the อัปเดตสถานะงาน popup |
| `service-case-detail.html` | the office sees the correction history, read only |
| `index.html` | one `<script src>` |

Two things asked for on หน้างานช่าง, and the owner chose both behaviours when asked:

1. **"หลังกดบันทึกสถานะที่เลือกเสร็จไปสถานะต่อไปออโต้"** — the note and the photos describe the
   step just finished, so they are saved against the **current** status and the job then moves on
   by itself. One press instead of two. The button says where it is going: *บันทึก แล้วไปต่อ: …*
2. **"กดกลับมาแก้ไขได้เผื่อเขียนอะไรผิด"** — the numbered chips are pressable. One already
   recorded reopens what was written there; saving **corrects that entry** rather than adding
   another. Every correction keeps the version it replaced, with a 🕘 ประวัติการแก้ไข list and a
   **ใช้ฉบับนี้** button, so a wrong correction can be put back — and the restore is itself kept,
   so it can be undone again.

**THE DEFECT THE FIRST VERSION HAD, caught by the suite.** `saveFieldStatus()` always APPENDS.
Handing it the note therefore left **two entries for the same step** on every single step — the
empty one written on arrival, and a second carrying the note — and the correction history hung
off the older of the two, where nothing would ever look for it. Measured: the ladder filled with
pairs. The note now goes into the entry the step already has; only the move to the NEXT status
goes through js/03, by reusing js/32's `advance()`, so the status write, the cloud push and the
re-render stay in the one function that owns them, and จบงาน still meets js/63's confirmation and
js/68's signature gate. One step, one entry, accumulating what happened there.

**Where the history lives.** `editedAt`, `editedBy` and `revisions[]` on the log entry —
`service_cases.field_status_log`, a real jsonb column already in `cloudUpsertCase()`'s whitelist,
so it travels between devices with the case and needs no SQL from anybody.

**A revision keeps the note always and the photos only when the edit changed them.** A note-only
correction would otherwise copy hundreds of KB of data URLs into the same case row, and this
project has already hit the localStorage ceiling once (part 26). A revision that did not touch
the photos says so on screen, and restoring it puts the note back and leaves the photos alone.
Capped at `REV_CAP` = 5, oldest dropped.

Filling in a step that was recorded **empty** on arrival is not a correction and writes no
revision — otherwise every job would arrive with nine meaningless history rows.

**Why not wrap `saveFieldStatus`:** js/32's step bar and js/26's own ถัดไป buttons call it too
and must NOT auto-advance — they already *are* the advance. Only the one button inside this
popup changes, so its `onclick` is replaced during the enhancement pass and js/03, js/26, js/63
and js/68 are untouched.

**The listener is on `#modalBody`, not `document`** — js/05 stops propagation on `#modalPanel`
(the ต้องกดกากบาทเท่านั้น guard), so a delegated listener on `document` never fires inside a
popup. Recorded in js/16, walked into again in part 26, and it would have silently done nothing
here too.

#### Tests

**187 assertions across six suites, 0 failures, 0 page errors** (E 36 · C 56 · T 52 · M 17 ·
F 15 · B 11). `node --check` clean on all 95 files in `js/`, `auth/` and `pages/`.

- **E (36, new)** — the chips are buttons, only recorded ones are marked, an unreached one says
  so instead of opening; a recorded chip loads what was written, hides the ถัดไป buttons and
  renames the save button; the correction **replaces** the entry and does not add one, is stamped
  edited, keeps the version it replaced, and does **not** move the job backwards; the history
  lists the old wording, ใช้ฉบับนี้ puts it back **and keeps the version it replaced**, the popup
  stays open so the result is visible; leaving edit mode clears the note box; then save+advance
  files the note under the step just finished, moves the job on, adds **exactly one** entry, does
  not list that step twice, and leaves the correction history intact; editing works at 390px.
- **T (52)** — the office sees ✎ แก้ไขล่าสุด, can open the previous version, and has **no restore
  control** there: restoring belongs where the correction is made.

**Suite F broke and was right to.** It matched the save button on the old label
`/บันทึกสถานะ/`, which js/91 renamed. It now finds the button by its id and asserts the new
behaviour — the note filed under the step that was finished, and the job moved on. Matching a
control by its visible wording is what made a passing suite fail for no defect; use the id.

#### Open / risk

1. Saving at รอลูกค้าตรวจรับ now auto-advances into จบงาน, which raises js/63's confirmation and
   js/68's signature gate. That is the gates doing their job, but it is one more prompt than
   before at that one step.
2. A revision's photos are only kept when an edit changed them, so restoring a note-only revision
   deliberately leaves the current photos in place. The history row says so.
3. `latestFor()` corrects the **newest** entry at a status. A job that legitimately passed through
   รออะไหล่ twice has two, and only the later one is editable from the chip.

#### Follow-up: เคสทั้งหมด puts what moved on top, and the customer's แจ้งปัญหา turns red

| File | What |
|---|---|
| `js/92-v70CaseUpdatedScript.js` | **new** — the เคสทั้งหมด tab orders by `updatedAt` and marks what has moved |
| `pages/customer-home.html`, `css/22-v69-customer-home.css` | แจ้งปัญหาเครื่อง wears the หมดประกัน red |
| `index.html` | one `<script src>` |

**1. "โชว์เคสที่มีการอัพเดตล่างสุดขึ้นมาไว้บนๆก่อน และไฮไลท์ว่าอัพเดตล่าสุด พอเปิดดูก็เอาไฮไลท์ออก"**

`renderCases()` sorts by `createdAt` (js/03:504), so a case opened months ago and updated five
minutes ago sits at the *bottom* — exactly the one the coordinator wants. On the **เคสทั้งหมด tab
only**, as asked, the order becomes `updatedAt` and anything that has moved since this account
last opened it carries an `อัปเดตใหม่` chip and a warm tint. Opening it clears the mark. The
other KPI cards are status queues and are untouched; `allTab()` is the single condition.

**The sort is done at `paginateList()`, not by re-ordering the rendered rows.** The pager slices
the list, so re-ordering only the page on screen would be right until the day there is more than
one page and the newest update is on the second. `paginateList()` is handed the whole filtered
list before the slice, which is the only honest place to change the order.

**The "seen" mark is per PERSON and device-local** — `imode_v70_seen_cases`,
`{account: {caseId: the updatedAt that was seen}}`. What the coordinator has looked at says
nothing about what the technician has, and a field added to a case never reaches
`service_cases` unless `cloudUpsertCase()` names it (part 18's rule). Losing the key lights the
list up once.

**The first-run trap, straight from js/74:** with an empty record *every* case would be "updated"
on the day this ships. The first time an account is seen, everything it can already see is
recorded as read; only what moves afterwards is marked.

**2. แจ้งปัญหาเครื่อง in red.** The one button a customer is looking for when something is wrong
now wears the same red as the หมดประกัน pill above it (`.chome-warranty.expired`: `#fdeceb` on
`#f5c9c6` with `#9d2b26` type), including its ledge, its icon chip and its small-caps stripe.

Two things worth keeping about that stylesheet:

- It is addressed **by class (`.chome-report`), not `:nth-child(1)`**. The colours around it are
  positional and would follow the order if the buttons were ever rearranged; this one has to
  follow the meaning.
- **The block had to go AFTER the `:nth-child` colour list.** `.chome-grid > button.chome-report
  i::before` and `.chome-grid > button:nth-child(1) i::before` are both (0,2,2), so on equal
  specificity the later rule wins — measured: placed before them the stripe stayed blue. One
  extra class is also what lets these rules outrank css/21, which is loaded after css/22 and
  dresses every `.portal-action-grid > button`, without reaching for `!important`.

#### Tests

**213 assertions across seven suites, 0 failures, 0 page errors** (U 26 · E 36 · C 56 · T 52 ·
M 17 · F 15 · B 11), plus an 8-assertion check of the customer page. `node --check` clean on all
96 files in `js/`, `auth/` and `pages/`.

- **U (26, new)** — the most recently *updated* case is at the top and the whole list is in
  `updatedAt` order; nothing is marked on a first visit and the account starts with everything
  recorded as read; a case that moves is marked, climbs to the top and carries the chip; opening
  it clears the mark but keeps its place; `imodeOpenCase` records it **before** navigating away;
  a status tab is neither re-ordered nor marked and no chip leaks onto it; returning brings the
  mark back; another account gets its own record; no overflow at 390px.
- **customer page (8)** — the report button's title is byte-identical in colour to the หมดประกัน
  pill, its border and stripe are red, the other buttons are untouched, **it still opens the
  report form**, and nothing scrolls sideways at 390px.

**Two fixture faults that produced false failures**, both worth remembering: seeded `updatedAt`
values of `2026-09-21T09:00Z` were *in the future* relative to a real `new Date()` in UTC+7, so
the case under test correctly refused to climb; and `imodeOpenCase` **navigates** (js/28), so the
page is gone by the next `page.eval` and the result has to be read from localStorage, not from
`cases`.

#### Open / risk

1. The marking is scoped to the เคสทั้งหมด tab because that is what was asked. Widening it to the
   status tabs is one condition in `allTab()`.
2. `imode_v70_seen_cases` grows by one short entry per case per account on that device. Nothing
   prunes it; at a few thousand cases it is still tens of KB, but it is one more thing in a
   localStorage that has hit its ceiling once (part 26).

#### Follow-up: the ช่าง row names everyone assigned to the case

Reported against the field-step panel: it showed one name. It could only ever show one —
`saveFieldStatus()` records `techId: c.assignee||fieldTechId`, and js/38 keeps `c.assignee` as the
**lead** with the crew in `c.assignees` (part 17 §2), so the entry itself never knew the rest.

The crew therefore comes from the case: `m.assignment.crew`, which `loadCrew()` has already
resolved to real technician records (reading `c.assignees` first and the comma list in
`c.assignee` second). One chip each, the lead marked หัวหน้างาน.

**Whoever the entry recorded is added on the end if they are no longer on the case**, greyed and
labelled ไม่ได้อยู่ในเคสแล้ว. A technician taken off a case afterwards still did that step, and
dropping their name would rewrite history.

Suite T is **58 assertions**: the row lists the whole crew and not just the lead, every assigned
technician is named, exactly one is marked as lead, and a step recorded by someone since removed
from the case still names them and says they are no longer on it.

#### Follow-up: the ladder ON THE PAGE is pressable too, and บันทึกสถานะ gets the upload popup

**1. หน้างานช่าง draws its own copy of the nine steps** (js/32's `.fw-ladder`), and only the one
inside the popup had been made pressable — missed the first time round. Pressing a recorded step
on the page opens the popup **already in edit mode for it**, so there is one correction form and
not two.

The click is delegated on `document`, which is right here and would have been wrong in the popup:
the ladder is on the page, not inside `#modal`, so js/05's propagation guard does not apply (that
guard is exactly why the popup's listener sits on `#modalBody`). Delegating also survives every
re-render of `#fwStatus` — and `renderWorkspace()` is reached through js/32's **closure**, not
through `window.imodeRenderFieldWorkspace`, so wrapping the exported name would have missed the
main path, the trap `renderMyWork` set in part 18. The decoration (role, tabindex, the pencil
mark) is applied by an observer on `#fwStatus` disconnected around its own writes; if it ever
misses a pass the clicking still works, because that does not depend on it.

**2. อัปเดตสถานะงาน gets the same upload popup as the customer.** js/67's header used to say the
technician paths keep js/30's toast because they are not used by someone waiting on a phone —
wrong about this one: a photo taken at the machine is exactly as slow to prepare, and
บันทึกสถานะพร้อมรูป is used standing in front of it.

**One popup, two doors.** js/67's wrapper became a function of the counter and the wording rather
than a second copy of the progress UI — the two forms keep their pending files in different
places (`window.portalIssuePendingMedia` for the customer; `pendingFieldStatusMedia`, a top-level
`let` in js/03 and therefore a lexical global that is never on `window`, for the technician).
**js/30 already wraps `addFieldStatusMedia` and reports through `window.imodeMediaProgress`**, so
this path gets a real percentage for free, and js/30's own toast stands down by itself while the
hook is installed, so nothing is said twice. The other two technician paths (`addReportVideos`
and the report photos) keep the toast.

**A CSS gotcha worth keeping:** `content:"\u270e"` is NOT a CSS escape — CSS wants `\270e`, and
`\u` there is only an escaped letter u. The literal character is what the rest of the file uses.

**Verified lightly, at the owner's request** ("นายไม่ต้องเทสเดี๋ยวผมจะเทสเอง"): an 11-assertion smoke
run — the page ladder is marked pressable and keyboard-reachable, recorded steps are
distinguished, clicking one opens the popup in edit mode with that step's note, an unreached one
says so and opens nothing, both upload forms are wrapped and an empty file list still raises no
popup, 0 page errors — plus suites E (36), F (15) and T (58) re-run and `node --check` on all 96
files. **The upload popup itself was not driven with a real file this time.**

---

## OPEN BUG — 2026-09-21: the field track reads as "never happened" on a finished job

**Reported with a screenshot, NOT YET FIXED.** `service-case-detail.html`, case
`SRV-20260917-002` (สถานะ เสร็จสิ้น, step 4 current). The step-3 drawer's nine-step field track
shows **chips 1–8 grey and numbered** — รอลูกค้าตรวจรับ included — while chip 9 จบงาน is blue
with a ✔, and the line between 8 and 9 is green. Opening chip 8 says
*"ยังไม่ถึงขั้นนี้ — ยังไม่มีข้อมูลจากหน้างาน"*, and the badge under the drawer says
**หน้างาน: จบงาน**. The main five-step track above it shows 1–3 as done. So one track says the
work is finished and the other says none of it happened.

**Cause, read out of the code (not yet confirmed against that case's stored data):**

```js
function fieldReached(m){                       // service-case-detail.html
  var hit={};
  fieldLog(m).forEach(function(e){ hit[e.status]=e.createdAt||... });   // ONLY logged steps
  var now=(m.raw&&m.raw.fieldStatus)||...;
  if(now&&!hit.hasOwnProperty(now))hit[now]='';  // plus the current one, with no time
  return hit;
}
...
var on=Object.prototype.hasOwnProperty.call(hit,fs);   // 'done' iff it is in hit
```

A step is drawn as reached **only if it has its own `fieldStatusLog` entry**. A case whose
`fieldStatus` ended at จบงาน with an empty or partial log therefore shows exactly this: every
step grey except the current one, which `fieldReached()` adds by hand with no timestamp. The
ladder is ordered, so being at step 9 means 1–8 were passed whether or not each wrote a row —
and there are real paths that set the status without a per-step row (js/63's จบงาน, a status set
from the case page, a case seeded or synced from elsewhere).

**Direction for the fix** — in `stepDrawerHTML`'s `i===S('service')` branch:

* treat every step whose index is **at or before** `FIELD_STEPS.indexOf(currentFieldStatus)` as
  passed, instead of requiring a log entry;
* keep the two apart visually and in the panel: *recorded* (has an entry, a time, maybe a note
  and photos) vs *passed with nothing recorded*. The detail panel must stop saying
  "ยังไม่ถึงขั้นนี้" for a step the job has clearly gone past — that wording is the actual
  falsehood in the screenshot;
* `รออะไหล่` is a BRANCH, not a stage every job passes (CLAUDE.md, Service Case), so it must not
  be marked passed by index alone — only when it has its own entry.

**Check before fixing:** read that case's real `fieldStatusLog` from the database or the device.
If it is empty the diagnosis above is complete; if it has entries whose `status` strings do not
match `FIELD_STEPS` exactly, the fault is a mismatch instead and the fix is different.

Not caused by this session's work: the same expression has drawn that ladder since part 21, and
the chips-are-buttons change (js/91) only wrapped the contents of each `<li>` — the done /
pending / now classes are still set by the code above.

### Uncommitted at the time of writing — 8 files

`js/91-v70FieldStepEditScript.js` and `js/92-v70CaseUpdatedScript.js` are **new and untracked**;
`service-case-detail.html`, `pages/customer-home.html`, `css/22-v69-customer-home.css`,
`js/67-v70UploadProgressScript.js`, `index.html` and `CLAUDE.md` are modified. Everything in the
entries above from "the 📷 button, and the field track is readable at last" onwards is in that
working tree and **has not been pushed**, so GitHub Pages is still serving `aa4ad0f`.

### 2026-09-21 — the OPEN BUG above is FIXED, and a correction now reaches the office live

**The bug is closed.** It was fixed in the working tree by the owner's other assistant, along the
direction recorded above, and verified here against the exact reported shape (a case at
`fieldStatus: จบงาน` with an EMPTY `fieldStatusLog`):

* `FIELD_MAIN = FIELD_STEPS.filter(x => x !== FIELD_HOLD)` — the hold branch is excluded, which
  is the part that mattered most;
* `fieldReached()` now infers every main step up to `FIELD_MAIN.indexOf(fieldStatus)`;
* the drawer's empty state gained a third wording — `ผ่านขั้นนี้แล้ว แต่ไม่มีรายละเอียด…` — so a
  passed step no longer claims it was never reached.

Measured: 8 of 9 chips read as passed, **รออะไหล่ stays pending**, จบงาน is current, a passed step
says it was passed with nothing recorded, and รออะไหล่ still says it was never reached. 7/7.

#### The half that was still missing: a correction never reached the case page

`CaseLive.applyCase()` compared the log as `(hit.fieldStatusLog||[]).length`. **An edit does not
change the length.** So a technician fixing a note through js/91, or restoring an earlier
version, arrived on the realtime channel, was written onto `hit` — and was then thrown away,
because `before === after` returned false before `writeJ()` ran. The office kept showing the old
wording, and it was not even persisted to that device's localStorage.

`logPrint()` replaces the length with a small fingerprint: `id`, `status`, the note itself, the
edit stamp, and the COUNTS of media and revisions, joined per entry. **Deliberately not
`JSON.stringify(log)`** — an entry carries base64 photos, so that would stringify hundreds of KB
twice on every realtime event. Those six fields are what an edit actually moves; a photo swapped
for another with the same count is caught by the edit stamp js/91 writes beside it.

**Nothing was needed on the application side.** js/85 maps `service_cases` through
`fromCaseDb(row)`, which carries `field_status_log` whole, and accepts a row whose `updatedAt` is
newer — and js/91 stamps `c.updatedAt` on every correction. So the admin's list and every other
technician assigned to the same case already receive it; only this page had its own mapper and
its own comparison, which is exactly why only this page was stale.

**The admin's view of the edit history was already in place** (`sd-frevs` in
`fieldStepDetailHTML`, added earlier the same day): ✎ แก้ไขล่าสุด with the time and the person,
and a 🕘 ประวัติการแก้ไข list of the previous versions, read only — restoring belongs where the
correction is made.

**Verified:** bugcheck 7/7 and suite T 58/58 on the patched page, and the inline script parses.
**Not verified end to end:** the live two-device round trip for a correction. The mapping and the
comparison were read and reasoned about, not driven against the real database.

### 2026-09-21 — Codex handoff work: production guardrails, deploy docs, diagnostics and plans

The five follow-up items in `docs/CODEX-HANDOFF.md` were handled through the requested design
boundary. **No SQL was run, no Supabase project setting was changed, no deployment was made and
no Storage migration code was started.**

#### Production RLS is prepared, with one deliberate safety correction

`supabase/10-production-rls.sql` removes every `uat_anon_all` policy from the 15 application
tables, revokes anon table access, recreates `staff_all` for active Supabase-authenticated
staff, retains narrow authenticated-customer policies, and gives anonymous visitors only
validated INSERT policies on `service_cases` and `line_customer_requests`. The inserts verify
the machine/customer relationship through a SECURITY DEFINER boolean helper in a non-exposed
`imode_private` schema; a linked request must also point at a case for that same pair.

The handoff proposed anonymous SELECT on machines, warranties, documents and “the customer's own
cases”. That cannot be implemented honestly in the current design: the portal has no Supabase
identity, `syncCloud()` selects whole tables, and js/21 makes the token `QR-<machine id>`, which
is predictable. RLS cannot know which QR was scanned. A `using(true)` policy would expose every
company's rows, so the production file grants anon SELECT on **no base data table** and says why.
It must not be run until the portal uses opaque random tokens plus a narrow RPC/Edge Function.

There is a second explicit prerequisite: the portal currently calls `cloudUpsert()`; PostgreSQL
UPSERT needs UPDATE rights, while production grants anon INSERT only. The production portal must
use INSERT (case before linked request) or an atomic validated RPC. `supabase/README.md` now puts
the cut-over in order: backups → production project → real Supabase staff profiles → portal
prerequisites + SQL review/run → switch `settings.authConfig.provider` to `supabase`.

#### Deployment runbook

`docs/DEPLOY.md` contains the nginx static server block, mandatory HTTPS/Let's Encrypt setup,
atomic release guidance, `no-cache, must-revalidate` for HTML/JS/CSS, 30-day image/font caching,
post-deploy curl/browser checks, the LINE OA Public App URL change and rollback. It also records
why `file://` is invalid: `pages/pages.js` must load `pages/customer-home.html` over HTTP(S).

#### Silent client error inbox

`js/93-v70ClientErrorScript.js`, loaded after js/92, captures `window.onerror` and
`unhandledrejection`, strips token-bearing query values, de-duplicates by message, caps capture
at 10 per tab session, keeps a bounded 20-row local queue and flushes through the existing
lexical `supa` client when available. Every reporter path is guarded and failed inserts remain
silent/local, so a missing table cannot create a second failure. New keys:

* `imode_v70_client_errors` — bounded local queue;
* `imode_v70_client_error_session` — session count and duplicate set.

`supabase/11-client-errors.sql` prepares the table: anon/authenticated may INSERT; only an
authenticated admin may SELECT or DELETE; nobody may UPDATE. It was written only and not run.

Measured with a VM smoke harness: two identical `boom` errors produced one queued row, a
different rejected promise produced the second, and a mocked successful Supabase insert emptied
and persisted the empty queue. `node --check js/93-v70ClientErrorScript.js` passed.

#### Current architecture and Storage boundary

`docs/architecture.md` has three Mermaid diagrams derived from the active code: the important
override chains, the Field/Workshop/Online business flow, and all 15 application tables with
their browser/Supabase directions. It calls out `notifications` as download-only and
`system_settings` as one shared jsonb row that is still rewritten whole.

`docs/STORAGE-PLAN.md` is the requested design-only stop point. It inventories base64 in
`c.media`, duplicated line-request media, field entries and revisions, online/workshop evidence,
service-report before/after/video fields and signature PNGs; specifies dual-format readers,
private immutable objects, an IndexedDB offline outbox, phased idempotent backfill, RLS/signed
upload requirements and the exact interaction with js/72's localStorage shedding. No bucket,
SQL policy, upload helper or record migration was created.

---

## Session Change Log — 2026-09-23 (part 31): accounts, the warranty flow, and three mistakes of my own

Worked through the owner's list in one sitting. **Three defects in this session's own earlier
work were found and fixed in the same session** — they are written up first, because each one
is a trap this project can fall into again.

### MY OWN MISTAKES, and what they teach

**1. js/97 cleared a photo it had never been given.** `applyPhotos()` copied `account.photo`
onto the linked technician record and demoUsers person **unconditionally**, so an account with
no photo wrote `''` over a photo the technician record already had. It ran at every boot (so a
photo vanished on reload) and again after every account save (so adding one photo wiped
another) — exactly what the owner reported. An empty value in a MIRROR must mean "this side
says nothing", never "clear the other side". Fixed: `if(!photo)return;` plus
`inheritedPhoto()`, which shows the record's own photo in the account form without copying it
back.

**2. `settings.uatAccountEdits` is applied field by field.** js/39's `merged()` copies a named
list of keys out of the edit patch (`username`, `hash`, `name`, `role`, `team`,
`technicianId`, `accountType`). A key that is not named is **silently dropped on the next
load** — which is why a photo set on one of the seven BUILT-IN accounts came back empty. Same
shape of bug as `cloudUpsertCase`'s column whitelist (part 18). `photo` is now named there, as
`typeof === 'string'` so that clearing one on purpose is kept too. **Any future field on an
account has to be added to that list.**

**3. Grouping at the wrong layer would have emptied the calendar.** The first version of
js/104 wrapped `filteredTechnicians()` to hide the four UAT technician records. That function
is shared with `renderCalendar()` and js/13's team scope, and one of those records currently
carries five open jobs — the calendar would have lost their rows. The wrapper now only changes
its answer while `renderTechnicians()` is the caller, which it knows because that function
calls it synchronously and a flag around the base call is therefore exact.

### What was built

| File | What |
|---|---|
| `js/100-v70ModalMotionScript.js` | **new** — every popup opens with a bounce and closes by shrinking |
| `js/101-v70CustomerEntryPreviewScript.js` | **new** — ดูหน้าหลักลูกค้า opens the scan / serial page |
| `js/102-v70WarrantyPortalScript.js` | **new** — the customer side of the warranty flow, and the portal repaints itself |
| `js/103-v70QuoteModeScript.js` | **new** — ทำใบเสนอราคา is Service or ประกัน, and the form follows |
| `js/104-v70TestTeamScript.js` | **new** — the UAT technician records get their own group on ทีมช่าง |
| `js/97`, `js/98`, `js/39`, `js/43`, `js/90`, `js/14`, `pages/customer-home.html` | photos, account linking, filters, the customer logo |

### THE BUG UNDER THE WARRANTY FLOW: `WP` was never selectable

`qService` in index.html offered **OS / WS / DG and nothing else**, but js/03's
`prepareWarrantyQuoteFromRequest()` does `qService.value='WP'`. A browser drops an assignment
that matches no option, so the select fell back to empty and **every warranty quotation ever
built from a customer request was saved without the WP marker** — the marker js/43 filters on
and js/62 matches a request against. js/03:1467 has been pricing `service==='WP'` at 0 per
machine all along, waiting for a value it could never receive. js/103 adds the option.

Two consequences, both handled: `loadQuotation()` maps WP back to `'OS'` when reopening a
quotation (js/03:1648), so editing a warranty quote silently converted it — js/103 re-applies
WP afterwards. And the type filter on ประวัติใบเสนอราคา also accepts a quotation built from a
**warranty request** (`settings.quoteRequestLink`), so old rows are still grouped correctly.
`warrantyMonths` is deliberately NOT used as evidence: js/03 stores it on every quotation with
a default of 12.

### Accounts

- The person list in the account screen signed people in **with no password**: the row called
  `chooseUser()`, the legacy one-click login. js/46 had closed that door for `imodeQuickSwitch`
  only. The row now goes through the same password prompt.
- The chip on each row printed `u.team` — a TEAM — so changing an account's Role never showed.
  It reads the account's role now, matched by `userId` first and display name second.
- The account list is **grouped by Role**, with the UAT logins in a section of their own,
  recognised by a username ending in `_test` / `_testN`. The group is derived at render time
  and `refresh()` rebuilds the box after every save, so changing a role moves the row with
  nothing to keep in step.
- **เพิ่มบัญชี is a popup** now (js/29 stacks it over the list). `history.back()` resolves on
  popstate, a later task, so the list is waited for before it is rebuilt — what js/29 restores
  is a snapshot of the markup and would not show the account just added.
- **The employee form can create the login** (js/98), or now **link an existing one**, through
  `imodeAccountSave()` — js/39 stays the only writer. `saveTech()` ends with `closeModal()`, so
  the fields are read BEFORE it runs, and the new record is identified by diffing the ids
  because `saveTech()` generates its own and returns nothing.
- **Identity, on the owner's confirmed mapping:** พี่ย้ง = Artivara Polsri (`lead_technician`),
  พี่หนุ่ม = Chaichana Photaya (`lead_rd`), ป๋าหมาก = Samak, พี่เต้ = Narongsak. Duplicate
  records were merged with `dedupeLead()`, which repoints `cases.assignee`/`assignees`,
  `fieldStatusLog[].techId` and `serviceReports.techId` **and pushes the changed rows to the
  cloud** — `syncCloud()` replaces `cases` wholesale, so a merge that only saved locally would
  be undone by the next sync. Patama / Thirapong / Thanawat were removed; a technician record
  is only deleted when nothing points at it.

### Open / risk

1. **Warranty quotations already in the database carry no WP marker.** The type filter finds
   the ones built from a request; one built by hand is invisible to it until somebody opens it
   and saves it again. A backfill was offered and is waiting on the owner's word.
2. `settings.quoteWarrantyType` holds the package type per quotation, because
   `cloudUpsertQuotation()` writes an explicit column list. It is registered in js/90's
   `MAP_KEYS` so a device that has not seen it cannot delete it on a settings push.
3. The warranty quotation still prices as a Service quotation. No package price list exists yet.
4. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write
   this database.

### Follow-up (2026-09-23, same session): the roster of nine, and three more traps

**`js/106`** — งานหน้างาน on a ทีมช่าง card listed nothing: it called `openFieldService(id)` and
left for the field workspace. It now opens a popup of every case that person is on, counted
with js/03's own `caseHasTech()` so a crew member who is not the lead is included — the exact
thing nine expressions in js/03 got wrong in part 25.

**`js/107`** — the account roster the owner specified: nine accounts, everything else removed.
Built-in logins are tombstoned in `uatAccountEdits` (js/09 defines them in code and they cannot
be spliced out of the array); created ones are deleted outright.

**The rule that keeps the deletion safe, and it is not obvious:** an account is a door and can
go freely, but a TECHNICIAN RECORD is what cases, field logs and service reports are attributed
by. `tidyRecords()` deletes only records that nothing points at; one that still carries work is
kept and NAMED IN THE CONSOLE, because moving that work needs a real person's name and this
file is not allowed to guess one (AGENTS.md). The owner asked for the work to be moved first —
that move waits on them saying whose it is.

**js/96 gained a same-name merge.** js/39's `createRecordFor()` creates a technician record for
an account that has none, so an employee who already had one ends up with two — พี่หนุ่ม had
T-LEAD-RD and T1790146531546, both named Chaichana Photaya. The record carrying `employeeId`
wins and the other is emptied into it through `mergeTechInto()` first.

**js/104 was classifying พี่ย้ง as a test record.** `technician_test1` and `lead_technician` both
point at T-LEAD-TECH, and `createRecordFor()` names a record after the account username — so his
card read "technician_test1" and a name-based test matched it. Ownership is checked first now
(`employeeId` → a real person is never a test record), and js/105 restores the record's name from
that employee. **A name is only replaced when the current one is an account username**; a name a
human typed is never touched.

**js/105** also adds the test-account switch (`settings.testAccountsEnabled`). It blocks
`uatAuth.verify`, `uatAuth.findAccount`, `uatAuth.login` AND `ImodeAuth.signIn` — four doors,
because closing one leaves the account able to sign in through another, which is how a deleted
customer account kept working in part 19.

**Open:** `technician_test1` is still linked to พี่ย้ง's record, so while test accounts are
enabled that login sees his jobs. Unlinking it is one call and is waiting on the owner's word.
*(Resolved by the sweep below: the roster deletes that account, so the link goes with it.)*

#### The sweep finishes the job — the UAT cases go with the records

The owner was shown the records `tidyRecords()` had kept because work still pointed at them, and
answered: **"ลบพร้อมเคสได้เลยเพราะเคสนั้นไม่ใช่เคสจริง"**. So js/107 no longer keeps them.

A record that is not on the roster, not linked to an account and carries no `employeeId` is now
removed together with **its cases, their คำขอ, ใบตรวจ and QC records**, locally and in Supabase.

**The one case that is NOT deleted**, and it is not hedging: a case whose crew also holds a record
being kept belongs to a real person, whatever it was created for. Those cases stay; the dead id is
stripped out of `assignees` and out of js/38's comma list in `assignee`, the first survivor becomes
the lead, and the row is pushed back up. The console line says how many went each way.

Two things that make it actually run, both of which the previous version would have got wrong:

- **`VERSION` is bumped 1 → 2.** A device that already ran version 1 kept those records and would
  never have looked again, because `run()` returns early on the flag.
- **The sweep re-runs after `syncCloud()`, once per page view.** `supa` is null while this file is
  parsed, and the sync then replaces `cases`, `technicians` and `settings` wholesale — so a tidy at
  DOMContentLoaded reads an empty or stale device, deletes nothing, and sets the flag anyway. Same
  trap js/96 handles with its own `afterSync()`. It is idempotent: with nothing doomed left it
  returns on the first pass.

`cloudDelete()` is a third copy of the same two lines (js/40 and js/52 have the others) for the
same reason each time — `supa` is a top-level `let` in js/03 and never reaches `window`.

**Not recoverable:** this deletes outright rather than going through js/40's bin, because the
records and their cases are UAT data the owner asked to be gone. The cloud rows are deleted too, so
another device cannot bring them back.

#### THE BUG: every account that lives in `settings` was deleted on every page load

Reported after the owner tried the list: `rungarun`, `pannawit`, `admin`, `samak` and `narongsak`
could not sign in. `apichat` and `phimu` were not tried and were in the same state.

The split is the diagnosis. **Every account js/09 defines IN CODE still worked** — `lead_technician`
and `lead_rd`. **Every account that lives in `settings.uatAccounts` failed.** Nothing was wrong with
the passwords, the hashes (`uatAuth.hash` is js/09's synchronous `sha256`, verified against node) or
js/39's `verify()`.

The chain, and it is the oldest trap in this file wearing new clothes:

| | |
|---|---|
| parse time / DOMContentLoaded | js/96's `seed()` and js/107's `run()` create the accounts and set their flags |
| the same moment | **`supa` is still null**, so their `cloudSaveSettings()` is a silent no-op |
| a moment later | `initCloud()` → `syncCloud()` does `settings = mergeSettings(cloudCopy)` — a **wholesale replace** |
| result | the new accounts and the flag saying they had been created are thrown away **together**, every load, for ever |

js/90 protects `MAP_KEYS` against exactly this, but `uatAccounts` is an array and
`uatAccountEdits` is not in that list — and neither belongs there, because adopting a key the
cloud still has would undo an admin's deliberate restore of a built-in account.

**The fix is the one js/96 already used for technician records and did not extend to accounts:
re-apply on the copy the server sent.** Both files now re-seed inside their `syncCloud` wrapper,
where `supa` exists and the push therefore lands. After one successful boot the shared row carries
the accounts and both re-seeds become no-ops.

Two details that matter:

- **js/107's `afterSync()` ignores `settings.v70Roster` on purpose.** The flag lives in the object
  that was just replaced, so trusting it there is trusting the thing that went missing.
- **js/96's `seed()` no longer trusts its flag alone** — `specAccountsPresent()` checks that the
  accounts SPEC names are really there, matched on `userId` rather than username. A settings copy
  carrying the flag without the accounts is not hypothetical; it is the state the device was in.

**The rule, stated plainly for the next time:** anything written into `settings` before
`initCloud()` has run is lost unless it is written again after `syncCloud()`. A version flag stored
beside the data it guards cannot protect that data, because both go in the same wholesale replace.

#### Login audit — the two password-less doors that were left, and `js/108`

Asked for a weakness hunt with the login weighted first. The method was to list **every place in
the project that assigns `currentUser`** rather than to read the login screens, because a door
nobody renders is still a door. Ten hits; eight are legitimate (the localStorage restore, js/09's
`login()` after `verify()`, `setSessionUser` used by auth-integration, two sign-outs, the backup
restore). Two were real:

1. **`saveManualUser()` — type a name, pick any role, you are in.** The "กรอกชื่อเอง" form at the
   bottom of the legacy login popup sets `currentUser` with a role taken from `settings.roles` —
   a list that contains CEO and Service Manager. No account, no password, no audit entry. js/33
   hides the form with an inline `display:none`, and that is all that was holding it shut: the
   `<form>` is still in the document with a live `onsubmit`, so one line in DevTools, or any later
   patch that re-renders that popup without js/33's hiding pass, brings it back.
2. **`chooseUser()` for a person with no account.** js/17 sends anyone WITH an account to js/46's
   password prompt and **falls through to the original one-click sign-in for anyone without**. That
   was right when the picker was eight demo users; against a nine-account roster it is a way to
   become somebody the account system has never heard of.

`js/108-v70LoginHardenScript.js` refuses both, and refuses rather than removes for the reason js/33
records: `manualLoginForm` is read as an **id global** 20 ms after the popup opens, so deleting it
throws. It works as a wrapper because a top-level `function` declaration **is** a window property,
so replacing `window.saveManualUser` changes what that bare identifier resolves to (part 18).

Both guards are conditional on at least one account existing — a guard that locks everybody out
when something upstream fails is worse than the hole it closes. `imodeLoginDoors()` reports state.

**What the audit did NOT find, checked and clean:** the local password override is consulted in
`auth-local.signIn()` *before* `verify()`, so an admin-set password really does win once js/39
clears the override; js/105's test-account block wraps js/39's `verify`, not js/09's dead closure;
nothing outside the provider calls `uatAuth.login()`; and js/11's LINE auto-login needs a LIFF ID
and a customer `lineUserId`, neither of which exists.

**Three weaknesses that code cannot close, in severity order** — they are the owner's decisions:

1. **Every staff password hash is world-readable.** `settings.uatAccounts[].hash` lives in
   `system_settings`, `04-anon-uat.sql` grants anon SELECT on it, and the publishable key ships in
   js/23 in a public repo. The hash is **unsalted SHA-256** of a short password on an
   obvious pattern, so it falls to a wordlist in seconds. This is not a flaw in the login code; it is what "UAT-only client-side login" has
   always meant, now carrying real staff names. Only moving to Supabase Auth plus
   `10-production-rls.sql` fixes it.
2. **The lockout is client-side** (`imode_v69_auth_lock`), so it slows a person at a keyboard and
   nothing else. Unchanged since part 4 and correctly described there.
3. **`settings.authConfig` is still the fair's setting** — `sessionHours 24`, `idleMinutes 1440`
   (part 17 §9). A shared office PC stays signed in for a day. The code defaults are 12 h / 240
   min; putting them back is a settings change, not a code change.

**Low, then fixed anyway on the owner's instruction** — see `js/109` below. `c.checkInAt` is not in
`cloudUpsertCase()`'s column list so it does not travel, and `saveServiceReport()` only rescues it
once the report is filed.

#### `js/109` — the check-in time, derived instead of transported

Adding `check_in_at` to the payload without adding the column would make PostgREST reject the row,
and that is the **whole** upsert — every case would stop syncing. So the column was not added, and
it turned out not to be needed: `c.checkInAt`, `c.checkInLat` and `c.checkInLng` are written into
the **same `fieldStatusLog` entry** that records the arrival, in both paths that set them
(js/03:1015 reads that entry; js/03:1031 writes both in one statement) — and `field_status_log` is
a real jsonb column already in the whitelist. The value therefore does not have to travel; it is
read back out of the thing that already travels.

js/109 backfills it from the first `ถึงหน้างาน` entry, at boot and after every sync. It derives and
never invents: no entry means no value, and a value already present is never overwritten. Nothing
is pushed, because the log is the source of truth and the case carries it by itself.

**The general lesson:** before adding a column for a field that will not travel, check whether the
value is already inside one of the jsonb columns that do. `field_status_log` carries per-step notes,
media, technician, coordinates and (since part 27) the case category.

#### `js/110` — work done with no signal is no longer thrown away by the next sync

Asked what happens when a technician is on site with no data connection. Measured against the code
rather than assumed, and the answer had a hole in it that js/24's own comment denies.

js/24 returns `{ok:true, offline:true}` for a write made with no client, commented *"the record is
saved locally and the next sync carries it"*. **That is true for a NEW row and false for an EDIT.**
`syncCloud()` replaces `cases` and `serviceReports` wholesale, and js/71's rescue begins with
`if(here[r.id])return` — a case the cloud already knows about is "still present", so the server's
older copy wins silently and the field statuses, notes and photos recorded on site are gone. A
ใบตรวจ is not covered by js/71 at all.

js/110 remembers what this device changed and could not push (`imode_v70_pending_push`, device-local
by definition — it is a note about what THIS device owes the server), keeps the local copy through
the sync and re-uploads it.

- **The guard that makes it safe: a kept row must be NEWER than the server's.** Without it, a device
  reconnecting after two days would overwrite everything done since, turning "last write wins" into
  "last device to find signal wins". When the server copy is newer the offline edit is dropped and
  said so in the console — losing one offline edit to a later real one is the right way round.
- Scope is `cases` and `serviceReports`. **The four operational tables are already safe** — js/41
  merges them by id with the newer `updatedAt` winning, which is what this is doing by hand for the
  two that are replaced wholesale.
- It wraps `cloudUpsert`, the one funnel every table write passes through, and must stay **outside**
  js/24's wrapper to see its return value — so it loads after it, as the numbering enforces.
  A build without js/24 marks nothing rather than marking every write pending for ever.
- `imodeOutbox()` reports what is still owed.

#### `sw.js` + `js/111` — the app opens with no signal

The bigger half of the offline question, done on the owner's instruction. Everything except the
data was fetched from the server on every load, so an open tab kept working offline and a **reload
got a blank screen**. `js/03` used to register a worker at this path and there has never been a
file there — that was the 404 part 28 removed.

**`sw.js` is deliberately NOT the fast strategy.** Same-origin files are **network-first**, and the
cache is only the fallback:

| | |
|---|---|
| same-origin | network first, cache on failure |
| `./assets/` `./vendor/` | cache first — they do not change and they are the big ones |
| cross-origin (CDN, Google Fonts) | network, then cache, then an **empty 200** |
| `supabase.co` / `/rest/v1/` | never touched, never stored |

Cache-first for scripts would be faster and is the wrong trade **here**: this application is
patch-over-patch, and a page running some `js/NN` files from a previous deploy and some from the
current one is not a slower app, it is a broken one — an override applied to a function that
changed underneath it. Network-first guarantees one consistent set whenever there is a network.
The empty 200 for a cross-origin miss exists because a request that *hangs* stops the HTML parser
dead, which this project has hit before (part 19, Google Fonts in headless Chrome).

**The precache list is not in `sw.js`.** A hard-coded list of ~146 paths in a project that adds a
script almost every session is wrong within a week, and the symptom — a file that works online and
is missing offline — is the kind nobody finds, because testing online never shows it. `js/111`
reads `script[src]` and `link[rel=stylesheet]` off the document after `load` and posts what the
page really used. It cannot drift, because it is not a copy of anything. `sw.js` keeps a short
`EXTRA` list only for what the document never references: `pages/customer-home.html` (read by XHR),
`vendor/jsQR.min.js` (lazy) and `service-case-detail.html` (a separate document).

Details that matter if this is touched:

- **`./sw.js`, relative.** The live site is served from a sub-path; an absolute `/sw.js` 404s
  there, and a worker only controls the scope it is served from.
- `install` adds each file separately with the failure tolerated — `cache.addAll` rejects the
  whole install if one path 404s, so one renamed asset would cost every device its offline copy.
- **`imodeDisableOffline()` is the way out and had to exist.** A service worker serving the wrong
  thing is otherwise hard to get rid of from a phone. `imodeOfflineStatus()` reports what is held.
- Bump `VERSION` in `sw.js` to force every device to rebuild; old caches go on activate.
- `docs/DEPLOY.md` has a section on serving it, including that **`sw.js` itself must stay
  `no-cache`**.

**A device still needs one online visit before it can work offline.** With no stored copy the
fallback is a plain Thai page saying exactly that, rather than the browser's error.

**Not driven in a browser this session.** The files parse and the strategy is reasoned from the
code, but a real offline reload on a phone has not been done — that is the test that matters here.

---

## DECISION — 2026-09-23: the system moves to the company's own VPS

**Nothing has been built for this yet.** This is the decision and its reasoning, recorded so the
next session starts from it instead of re-deriving it. The owner chose it at the end of the day
after an analysis of four options.

### What was bought, and the constraint it creates

A Thai Cloud VPS: **4 vCore / 8 GB RAM / 80 GB SSD / 100 Mbps**, already provisioned with
**Windows Server 2025 Standard** (+860 THB/month on top of 1,190; 2,193.50 THB/month with VAT).

Windows is the wrong OS for this stack and that was said plainly — nginx, Docker and the whole
Supabase self-hosting story are Linux-native, and `docs/DEPLOY.md` is written for nginx on Linux.
The licence is billed **monthly**, so switching costs at most one month, and a reinstall to Ubuntu
was the first recommendation. The owner chose to keep the machine as it is, so the plan below is
built around Windows rather than around a reinstall.

### THE CHOSEN ARCHITECTURE — PostgreSQL + PostgREST, native on Windows, no Docker

```
browser  ->  IIS / nginx (HTTPS)  ->  /rest/v1/*  ->  PostgREST.exe  ->  PostgreSQL
```

**Why this and not the alternatives:**

- **Supabase IS PostgreSQL.** Moving to Postgres is not a migration to a different engine, it is
  taking the same engine in-house: all 55 `jsonb` columns work unchanged, every SQL file in
  `supabase/` runs as-is including `10-production-rls.sql`, and the data moves with a plain
  `pg_dump -Fc` / `pg_restore` with no conversion of any kind.
- **PostgREST is the piece that makes a browser able to talk to it at all**, and it ships a
  **Windows binary**. Routing `/rest/v1/` to it is exactly what Supabase's own Kong does, so
  `supabase-js` keeps working against it **with no change beyond the URL and the key**.
- **MySQL was considered and rejected.** A browser cannot talk to MySQL at all, so it means writing
  and then maintaining a REST API forever; the 55 jsonb columns would have to be rebuilt; and **RLS
  does not exist in MySQL**, so the entire security design would move into hand-written API code.
  More work than Postgres for strictly less capability.
- **Docker/WSL2 was avoided on purpose.** Supabase self-hosting needs Linux containers, which on a
  Windows VPS needs WSL2, which needs **nested virtualization the provider may simply not allow**.
  Native `.exe` installs remove that risk entirely.

### The measured surface — why this is a small change, not a rewrite

| | |
|---|---|
| files that touch `supa.` at all | **6** |
| `supa.from(...)` call sites | **25** |
| realtime subscriptions | **8** |
| `jsonb` columns in the schema | **55** |

Everything else — over a hundred `js/NN` files — has no idea a database exists.

### The four code changes, and one of them is a bug this move CREATES

1. **`js/23-v69CloudConfigScript.js`** — the URL and key. The key becomes a JWT with role `anon`
   signed with our own secret, which is what Supabase's key already is.
2. **`sw.js` → `bypass()`** — it recognises live data by the string **`supabase.co`**. Point the app
   at our own domain without changing this and the service worker **starts caching database
   responses**: a technician would be shown yesterday's jobs on a screen that looks entirely
   normal. This is not a pre-existing fault, it is one the move introduces, and it must ship in the
   same change.
3. **`js/85` and `CaseLive` in `service-case-detail.html`** — 8 subscriptions. See below.
4. **Vendor `supabase-js` locally** instead of the jsDelivr CDN, so our own server does not depend
   on someone else's and the offline shell is complete.

### What is actually lost: realtime, and nothing else that is in use

The realtime server is **Elixir and has no Windows build**. Auth (GoTrue) and Storage are also left
behind and **neither matters today**: `settings.authConfig.provider` is `local`, and every file is
base64 inside the rows rather than in object storage.

So the one real loss is the live update — the case page going from a customer's signature to the
office in 0.5 s (part 29 §3). The replacement is **polling**, which will read as roughly 10–15 s.
A full `syncCloud()` on a timer is the wrong way to do it: it downloads every table. The right
shape is a cheap `max(updated_at)` probe per table, then a targeted read.

**If the machine ever becomes Linux, run the whole Supabase compose and realtime comes back with
no code change beyond deleting the polling shim.**

### Migration outline

1. PostgreSQL for Windows (EDB installer), PostgREST `.exe` as a Windows service.
2. A real domain pointed at the VPS, and **HTTPS with win-acme — not optional**: without it the
   camera QR scan, the GPS check-in and the service worker all stop working, because browsers
   refuse those APIs on an insecure origin.
3. Run the `supabase/*.sql` files in order on the new database, then
   `pg_dump` from project `ywlrlfudlxsallanoroq` → `pg_restore`.
4. The four code changes above.
5. **`pg_dump` on a schedule, copied off the machine, and one rehearsed restore.** The VPS's
   "Free / Remote FTP Backup 80 GB" is file-level copying and is **not** a consistent database
   dump. A backup nobody has restored is not a backup.
6. Run one or two people on it in parallel before moving everybody.

### Five hazards to carry into that session

1. **Every existing device will keep talking to the OLD database.** `js/23` fills `cloudSettings`
   only `if(!configured)` — a phone or PC that has ever loaded the app has the old URL in
   `imode_v5_cloud` **for ever**. Half the company would keep writing to Supabase with nobody
   noticing and the data would split in two. js/23 must be changed to force the new endpoint when
   it finds the known old one.
2. **Every QR code already printed carries the old domain.** The GitHub Pages URL must keep
   answering and redirecting, permanently — do not switch it off.
3. **80 GB is smaller than it looks on Windows**: the OS and pagefile take 25–30 GB, leaving
   ~45–50 GB, and every photo, video, signature and document is base64 **inside the database**,
   inflated 33%. `docs/STORAGE-PLAN.md` should be done at the same time as this move, not after it.
4. **Windows Update reboots the machine.** With the database on it, that is the whole company
   stopping. Set Active Hours and a night maintenance window.
5. **One VPS is one point of failure.** Today GitHub Pages and Supabase fail independently.

### The opportunity that should not be wasted

`04-anon-uat.sql` means anyone on the internet can read and write this database, including the
SHA-256 hashes of every staff password (part 31, login audit). **Moving the server does not fix
that by itself** — the anon key still ships in the browser. The cut-over is the moment to run
`10-production-rls.sql` and move the staff login to real authentication, in one change.

**Next session:** write `docs/MIGRATION.md` — the step-by-step with the actual commands for
Postgres and PostgREST on Windows, IIS/nginx, win-acme, the data move, the four code changes and
the backup schedule. That was offered and accepted.

---

## Session Change Log — 2026-09-23 (part 32): the passwords leave the source, and a day of offline work stops disappearing

The owner asked for the offline story to be tested for real — "เช็คระบบตอนที่ช่างไม่มีเน็ต" —
with the login set up first and the build pushed to GitHub Pages so it can be checked on a
phone. Testing it turned up **silent data loss**: a technician who reloads the app on site with
no signal loses everything they record, the moment the signal comes back.

Four files changed. No storage key renamed, no Supabase setting touched, no schema change,
version untouched. `Andriod_app/` is now in `.gitignore` on the owner's instruction.

| File | What |
|---|---|
| `js/107-v70RosterScript.js` | the five staff passwords are SHA-256 hashes, not plaintext |
| `js/96-v70EmployeeAccountScript.js` | the same for `apichat`, `samak`, `narongsak` |
| `js/110-v70OfflineOutboxScript.js` | **two bugs** — the outbox was blind in Local Mode, and it cleared marks without sending |
| `pages/pages.js` | the customer page survives offline |
| `sw.js` | the two document logos are precached |

### 1. THE PLAINTEXT PASSWORDS ARE OUT OF A PUBLIC REPOSITORY

`js/107` held five staff passwords and `js/96` another three as `p:'…'` / `password:'…'`
literals — **plaintext, in a repository that is public on GitHub**, so every staff password was
readable by anyone who opened the raw file. They are not reproduced here, for the same reason. Both files now
carry the SHA-256 hex and nothing else; `hash:window.uatAuth.hash(r.p)` became `hash:r.h`.

Behaviour is identical because the hash is the same value the code used to compute at run time —
`uatAuth.hash` is js/09's own `sha256`, and it was checked against node's crypto on a known
vector (`sha256('admin_test')` matches the constant js/09 already ships) before any password was
converted. A wrong hash here locks a person out silently, so that check came first.

**What this does and does not buy, plainly.** The hash is **unsalted SHA-256** and the pattern
`Imode@0NN` is guessable from one leak, and the hashes also sit in `system_settings`, which
`04-anon-uat.sql` lets anyone SELECT. This removes the plaintext; it does not make the passwords
safe. That waits on the VPS cut-over with Supabase Auth and `10-production-rls.sql`.

**All nine roster accounts were then signed in for real** in a browser, at 1440 and at 390:
rungarun, apichat, pannawit, phimu, admin, lead_technician, lead_rd, samak, narongsak — and a
wrong password refused. `lead_technician` and `lead_rd` are js/09 built-ins and keep the UAT
convention password == username (verified, not assumed).

### 2. THE BUG THAT MATTERED: work done after an offline reload was destroyed on reconnect

Driven end to end against a stand-in for supabase-js (never the real project) and **measured
before and after**, because this is a data-loss claim:

| | before | after |
|---|---|---|
| field status recorded offline, in `cases` | 1 entry with its note | 1 entry with its note |
| the same, after the signal returned and the app synced | **0 — gone** | 1, kept |
| the same, on the server | **never sent** | sent |

The chain, and every link was read rather than guessed:

1. The technician **reloads** on site with no signal. `initCloud()` (js/03:1733) probes with
   `supa.from('service_cases').select('id')`, the probe fails, and its `catch` does `supa=null`.
   The device is in **Local Mode** — asserted.
2. Every typed writer in js/03 begins `if(!supa)return;`, so `cloudUpsertCase()` and
   `cloudUpsertServiceReport()` **never reach `cloudUpsert`**. js/24 therefore never returns
   `{offline:true}`, and js/110's wrapper — which is on `cloudUpsert` — is never called. Nothing
   is marked. `imode_v70_pending_push` was `null`.
3. The signal returns, `syncCloud()` does `cases=a.data.map(fromCaseDb)` — a wholesale replace —
   and js/71 skips the row because its first test is `if(here[r.id])return`: the cloud already
   has that case, so it is "still present".

Nothing on screen said a word. **js/110 §1b** closes it: the two functions this file already
names in `TABLES` are wrapped, and when there is no client the id is marked. That is the one
moment the `cloudUpsert` wrapper cannot observe. A top-level `function` declaration **is** a
window property, so replacing it changes what js/03's own bare `cloudUpsertCase(c)` resolves to.

### 3. The second bug in js/110: it cleared marks without sending

Found by the same suite, filing a ใบตรวจ offline. `restore()` asked **"is ours newer?"** and
dropped the mark otherwise — but those are not opposites. The third case is that the array was
**never replaced** and `next[at]` IS our own row, at our own timestamp, which falls through to
the drop branch: the pending mark was cleared and the record never sent.

That is not a corner case. `syncCloud()` only assigns when the fetch came back with rows
(`if(!k.error&&k.data.length)`), so a table the server has nothing in yet is left alone — which
is exactly why the inspection sheet stayed on the device for ever. Worse, a `Promise.all` that
rejects on a flaky connection leaves **every** array alone while `restore()` still runs, because
js/110's wrapper is `.then(done,done)` — so a bad reconnect would have quietly emptied the whole
outbox.

The test is now **"is theirs strictly newer?"**. Equal means either our own untouched row or the
server echoing back what we wrote, and re-sending is an idempotent upsert either way — a wasted
request is not a lost day of work. **The guard still holds**: a genuinely newer edit from another
device wins, is not overwritten, and the stale mark is cleared rather than retried for ever —
asserted with a second device's edit stamped ten minutes in the future.

### 4. Nothing reconnected when the network came back

The only `online` listeners in the project were js/93's error flush and the auth banner, so a
device that booted with no signal **stayed in Local Mode until somebody reloaded or pressed
เชื่อม Cloud**. The work marked in §2 was safe in localStorage but was not going anywhere, and
the technician had no way to tell.

**js/110 §1c** listens for `online` and for the tab becoming visible, and calls `initCloud()`
**only when the device is actually in Local Mode**, so an already-connected one is untouched.
`initCloud()` ends in `syncCloud()`, which this file wraps, so the re-upload rides along.
Asserted with nothing called by hand: the browser was put back online and the work reached the
server on its own.

### 5. The customer page was broken offline — a sync XHR is not served by the service worker

`pages/pages.js` reads `pages/customer-home.html` with a **synchronous** `XMLHttpRequest`
(part 12 chose that because `fetch()` refuses `file://`). Measured with the worker installed and
the network off:

```
the file IS in the cache            5,680 bytes
fetch('pages/customer-home.html')   200, 5,680 bytes
synchronous XMLHttpRequest          "Failed to execute 'send' on 'XMLHttpRequest'"
```

A sync XHR from the main thread does not go through the worker's fetch handler, so listing the
file in sw.js's `EXTRA` could not help it. Offline the customer page fell back to pages.js's
"open it over http" notice: no machine card, none of the eight action buttons.

It cannot simply become `fetch()` — the markup has to be in the document before any other script
runs, because `goPage()` throws without the section and `renderCustomerPortal()` reads
`portalLineIdentity` / `portalMachineHero` / `portalContent` as id globals, and a QR link renders
the portal during boot. So the last good copy is kept in **`imode_v70_portal_shell`**, the only
store that can be read synchronously, refreshed on every successful load. Offline it is at worst
one deploy behind, which beats a notice. 5.7 KB, and nothing else reads the key.

`sw.js`'s `EXTRA` also gained `imode-document-logo-removeBG.png` and `imode-document-logo.webp`:
js/111 collects `script[src]` and `link[href]` and **not** `img[src]` — deliberately, so a page
of machine photographs is not dragged into the cache — but those two are chrome, not content, and
without them the customer page came up with a broken image where its logo belongs.

### What the offline behaviour actually is now, measured

- **The shell loads with no network.** 145 files cached, the app boots, 0 page errors, the
  sidebar is built. A device still needs **one online visit first**; with no stored copy the
  fallback is a plain Thai page saying so.
- **A technician can SIGN IN with no network.** `settings.authConfig.provider` is `local`
  (js/23 pins it) and `auth-local` hashes and compares in the browser; `signIn()` in
  `auth-core.js` has no `online()` gate. Signing out offline and straight back in was driven and
  works. Only the Supabase provider ever needed network for a first sign-in.
- **The session survives an offline reload**, so usually no sign-in is needed at all.
- `service-case-detail.html` and the customer page both open offline.
- Work recorded offline persists, is marked owed, survives the sync, and is uploaded — including
  a ใบตรวจ.

### Tests

Six suites in the session scratchpad (not added to the repo), **92 assertions, 0 failures,
0 page errors**: offline shell (11) · the technician with no signal (14) · the loss scenario
(10) · reconnect, inspection sheet and the newer-edit guard (13) · regression at 1440 and at
390 (22 each, including all nine sign-ins and 26/26 sidebar pages).

`node --check` passes on all 116 files in `js/`, `auth/`, `pages/` and `sw.js`, and the case
page's inline script parses through `new Function`.

**The suites detect the bugs rather than agreeing with the fixes** — each one was run against the
unfixed code first and failed there: the day of work at 0 entries, the ใบตรวจ never sent, the
customer page with 0 action cards.

### Harness notes worth keeping

- **`cat <<'EOF'` in this shell collapses `\\` to `\`.** It turned the Chrome path into
  `C:Program FilesGoogle…` and `/\s+/g` into `/s+/g`. CLAUDE.md already records heredocs
  truncating a file here; add this to it. Write anything containing backslashes with a real
  file-writing tool, or avoid backslashes entirely.
- **A test stand-in for the database must persist.** The first version of it lived in
  `Page.addScriptToEvaluateOnNewDocument`, so every reload gave it empty tables and reset its
  offline flag — which looks exactly like data loss and was the test's fault. It keeps its tables
  and its flag in localStorage now.
- **`imodeOutbox()` returns COUNTS, not ids.** An assertion searching it for a case id can never
  match; read `imode_v70_pending_push` for the ids. One false failure.
- **The machines pager renders no numbered buttons when there is one page** (js/07), by design.
  Another false failure.
- Node on Windows cannot `require` an MSYS `/c/...` path; give it `C:/...`.

### Verified on the live site, not only locally

Pushed as `b739c17` and GitHub Pages confirmed serving it, then the offline run was repeated
against `https://imodeservice.github.io/ImodeService/` itself with the live database blocked two
ways (the app's own opt-out set before js/23 runs, and `*supabase.co*` blocked at the network
layer), so nothing touched it. **13 assertions, 0 failures**: a secure context, the nine accounts
live, `narongsak` signing in with the hashed password on the deployed build, the worker taking
control at the `/ImodeService/` sub-path scope with **147 files cached**, and then with the
network off — the site opens, the technician is still signed in, 26 sidebar items, no overflow,
0 page errors, and the customer page opens with its nine action cards from the kept shell.

### Open / risk

1. **The hashes are still unsalted SHA-256 and still world-readable** through
   `system_settings` + `04-anon-uat.sql`. Removing the plaintext narrowed the exposure; it did
   not close it.
   **And a password is only out of the repository if it is out of the CHANGE LOG too** — the
   first draft of this entry listed all eight, and part 31 had already printed one of them, which
   would have made the whole exercise pointless. CLAUDE.md is tracked and public. Both were taken
   out before this was committed; do not write a password into this file.
2. **`lead_technician` and `lead_rd` still have password == username.** They are js/09 built-ins
   on the UAT convention this file has documented since part 2, so anyone who reads the repository
   can sign in as either — and both are technician leads. Changing them is one edit in Settings →
   accounts per device, or new hashes in js/09; it was not done here because it was not asked for
   and it would have locked the two of them out without warning.
3. **`imode_v70_portal_shell` can be one deploy stale**, and only offline. If the customer page's
   markup ever changes incompatibly with a released `js/19`, an offline visitor would see the old
   shell. It is refreshed on every successful online load.
4. A row that genuinely cannot upload is retried on every sync until it lands. Intended; js/24
   reports the failures and `imodeOutbox()` says what is owed.
5. `js/110` covers `cases` and `serviceReports`. Quotations, warranties, documents and line
   requests are still replaced wholesale by a sync, so an **edit** to one of those made offline is
   still lost. Each one is a decision about delete propagation, not a free win.
6. **Not tested on a real phone.** Everything above is headless Chrome with
   `Network.emulateNetworkConditions`, including the live-site run. A real device adds things a
   desktop cannot show: iOS Safari's own service-worker behaviour, the browser evicting the tab,
   and airplane mode rather than an emulated offline flag. The owner is checking that.
7. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database.
8. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

---

## Session Change Log — 2026-09-24 (part 33): the documents are A4 at every width, every account is on ทีมงาน, and a flex/grid sweep of every module

Three requests, in the order they arrived. Two new JS files, one new block in the case page,
three additions to `css/23`. No storage key renamed, no Supabase setting touched, no schema
change, version untouched.

| File | What |
|---|---|
| `js/112-v70A4DocViewScript.js` | **new** — every document you open is an A4 page, scaled to fit |
| `js/113-v70TeamAccountsScript.js` | **new** — every login account is listed on ทีมงาน |
| `service-case-detail.html` | its own A4 copy, since it loads nothing from `js/` |
| `css/23-v70-responsive.css` | the three real findings of the flex/grid sweep |
| `index.html` | two `<script src>` tags |

### 1. FLEX AND GRID, every module, measured at phone widths

Asked for: "ลองเทสดูเรื่องพวก Flex และ grid ของโทรศัพท์หน่อยสิ ของทุกโมดุลเลย".

A CDP probe walked **every sidebar page as admin and as technician, plus the whole shell —
topbar, bottom bar and drawer — plus all 29 popups a button can reach**, at 390px and 360px,
using `Emulation.setDeviceMetricsOverride` (part 17 §7: `--window-size` does not give the
viewport you ask for). Per element it measured five things: content wider than its own box, a
box wider than the screen, a flex or grid child escaping its container's content box, two
siblings in the same flex or grid overlapping, and a tap target under 30px.

**Three real findings, all fixed in `css/23`:**

| where | what was measured | fix |
|---|---|---|
| quotation machine line | below 640px css/01 narrows the grid to `28px minmax(0,1fr) 48px 76px 34px`, but `.quote-remove` is a fixed **36×36** — the × sat **2px outside its own 34px track** | the button gives, not the grid: `width:100%;min-width:0` so the 1fr column keeps every pixel |
| ตั้งค่า → ขนาดตัวอักษร | `.font-range` is `width:100%` and Chrome's UA sheet adds `margin:2px` to every `input[type=range]`, so 346px of track plus 2px each side sat **2px outside** its 346px column | `margin-left:0;margin-right:0;box-sizing:border-box` |
| the drawer's first group header | **17px tall** where every other one is 26px — js/36's `.nav-group:first-child{padding-top:2px}` keeps the list tight at the top and shrank the only thing you can tap to fold that group | `min-height:26px`; css/23 is a `<link>` in `<body>` and js/36 injects into `<head>`, so it wins on document order at equal specificity |

**Four findings were FALSE and each one taught the probe something.** They are written down
because the next sweep will hit them again:

1. **`.field-hero` "clipped by 22px".** `.hero-digital::after` is a decorative 240px circle at
   `right:-26px`, clipped on purpose by `overflow:hidden` — and an absolutely positioned
   pseudo-element counts towards `scrollWidth`. The probe now reports an overflow only when
   something **in flow** is really outside the content box.
2. **The notification bell "clipped by 5px".** Its badge is the element's only child and is
   absolutely positioned, so "every child was skipped" was being read as "a text-only box whose
   own label is cut". Only a box with **no element children at all** is judged on its own text
   now. Part 17 §8 had already recorded the same overhang on the case page.
3. **`nav-group` 17px on 26 pages.** A closed drawer sits at `left:-270px` and still has a
   rect, so the probe was measuring the collapsed geometry of something nobody can see. It now
   skips anything entirely outside the viewport — which left the one genuine 17px finding above,
   measured with the drawer really open.
4. **The machines pager "missing".** With one page js/07 renders a summary and no numbered
   buttons, by design.

**Two more things the measurement settled rather than assumed:** at 390px `body.rhome-mode`
hides the sidebar entirely (js/10 line 740), so an admin who has just signed in has no drawer to
open — the test has to leave the Home board first; and above 900px there is no drawer at all,
`#menuBtn` collapses a permanent sidebar, so those assertions are scoped to phone widths.

**Result: 0 findings on 27 pages × 2 roles × 2 widths, and 0 in 29 popups.**

### 2. EVERY DOCUMENT IS AN A4 PAGE — "เวลากดดูในมือถือขนาดมันเพี้ยน"

Asked for: "แบบฟอร์มอะผมอยากให้เวลากดดูให้มันเป็น A4 เสมอ น่ะ ทุกแบบฟอร์มเลยนะ", then
"เวลากดดูในมือถือขนาดมันเพี้ยน". The owner chose **documents** (not the data-entry popups) and
**scale the page down to fit** (not side-scroll, not reflow).

**Measured first, at a 390px viewport, where A4 at 96dpi is 794px:**

```
ใบตรวจ / Service Report   paper 346px wide, own content 882px   -> CUT OFF
เอกสาร QC                  paper 346px, min-height:auto          -> not A4 at all
ใบเสนอราคา                  fluid, never A4 on screen
```

The papers were A4 only inside the print window. On screen they were fluid, so a phone squeezed
a six-column table and a three-cell signature row into 346px — and css/05 even carries
`.qc-a4{width:min(100%,210mm)!important}`, which is the rule that un-A4s the QC document below
794px.

**`js/112`** wraps `openModal()` — the one funnel every on-screen document goes through — and
for each of the five paper roots (`#quotePreviewDoc`, `#serviceReportPrint`, `#qcPrintDoc`,
`#salesQuotePrintDoc`, `#warrantyCertificateDoc`) forces `width:210mm`, puts it in a
window + stage pair, and applies `transform:scale(available/794)` with the window reserving the
**scaled** height. A พอดีจอ / 100% toggle is there for the small print, and at 100% the page
scrolls instead of reflowing.

Things that matter if this is touched:

- **The print path is untouched, and that was checked rather than assumed.** Every print
  function does `window.open` + `outerHTML` of the paper root and writes its own CSS. The A4
  width is applied through a **class**, never an inline style, so what travels into the print
  window is a class name that document has never heard of. Inline would have followed it in.
  The wrapper sits outside the paper, so it does not travel either.
- **`table{min-width:860px}` (css/01 line 21) is why two documents were being cut.** It is a
  global rule so the app's data tables stay readable inside `.table-wrap{overflow:auto}` — and
  impossible inside a 794px page. Reset to `min-width:0` **only inside `.imode-a4-page`**, which
  outranks both it and `.wide-table` without `!important`. Measured after: `contentOverflowsA4`
  went 90 → 0 on the quotation and 88 → 0 on the ใบตรวจ.
- A transform, not a media query: reflowing is what was wrong before, because the layout then
  stops matching the paper and nobody can tell from the screen what will print.
- `ResizeObserver` plus an `img` `load` listener per image, because a document's height changes
  after it is wrapped.

**`service-case-detail.html` carries its own short copy**, since it loads nothing from `js/`.
One thing there needed its own fix: `.scd-qdoc` has `min-width:720px` so the restated
`.quote-paper-*` grids had something to lay out against — and with the fit wrapper inside it,
**720px became the width the scale was computed against**: measured 0.907 and a 720px page on a
390px phone, still needing a sideways drag. The floor is cleared on the element that really
holds a page, which took it to 0.398 / 316px.

**Measured after, at 390px:** all four reachable documents are 794px A4, nothing cut
(`contentOverflowsA4: 0`), scaled to 44% and fitting the screen with no sideways scroll; at
1440px they sit at 100%. The case page: 794px A4 at 39.8%.

`salesQuoteDocHTML` is in `PAPERS` and was **not** exercised: its opener
(`openSalesQuotePreviewRecord`) is inside an IIFE and is not on `window`, so no test could reach
it. It will be wrapped the same way whenever the UI opens it.

### 3. EVERY LOGIN ACCOUNT IS ON ทีมงาน

Asked for: "ตรงบัญชีผู้ใช้อะ อยากให้บัญชีทุกบัญชีขึ้นที่ทีมงานครับ".

The page showed **technician records**, which is a different set from **accounts**. Of the nine
on the roster only four hold a record — `lead_technician`, `lead_rd`, `samak`, `narongsak` — so
rungarun, apichat, pannawit, phimu and admin appeared nowhere on it, and no screen outside
Settings answered "who can sign in".

**`js/113`** wraps `renderTechnicians()` and appends one block: every account, with its name,
username, role, team, and whether it holds a field-technician record.

**What is deliberately NOT done, and it is the whole design decision:** no technician record is
created for the five. A technician record is what cases, field logs, service reports and QC are
attributed **by**, and it feeds the Field Service picker, the calendar rows, the assignment
lists and every team headcount — so giving the CEO one, just to make a card appear, would put
him in the queue to be assigned jobs. Asserted: `technicians.length` is still 4 and the field
picker still has 4 options while 9 cards are on screen.

It also says something nothing else in the app reports: an account pointing at a technician
record that **no longer exists** is flagged, because every screen that resolves work through
`currentUser.technicianId` comes back empty for that person — exactly the state `tech_test1` and
`R&D_test1` were in before part 29.

One button, gated on `users.manage` and checked with `canPermission` rather than `data-perm`
(`applyRoleVisibility()` has already run by the time this block exists), opens
`openAccountAdminModal()` — the account screen that already exists, not a second copy of the form.

### Tests

**164 assertions across eight suites, 0 failures, 0 page errors**, plus the sweeps above:

- the three requests asserted at 390px (31) and 1440px (27) — the drawer measured with it really
  open, all four documents A4 with the toggle working both ways, 9/9 account cards, and
  `technicians` untouched;
- the case page's own A4 at 390px (7) and 1440px (7), driven through the real step-2 drawer;
- regression at 1440 and 390 (22 each): all nine accounts sign in, 26/26 sidebar pages open,
  version strings, the machines pager, the cases KPI, the customer page, no overflow;
- the four offline suites re-run because two script tags were added (11 + 14 + 10 + 13).

`node --check` passes on all **118** files in `js/`, `auth/`, `pages/` and `sw.js`; both inline
blocks of the case page parse; `css/23`'s braces balance.

### Harness notes worth keeping

- **A bare `s.replace('</body>', …)` on `service-case-detail.html` lands inside a print-window
  template string** — there are two `</body>` in that file and the first one is JavaScript. It
  broke the whole inline script in one edit. Use `lastIndexOf`, and splice by index.
- **Writing a JS file with `node -e` and escaped `\n` inside a string literal** produced a real
  newline inside a `console.log("…")` and a regex `/[ \t\n\r]+/` with literal whitespace in it —
  two syntax errors from the same cause. Write the block to a file with a file tool and splice
  it, rather than building it inside a shell-quoted `node -e`.
- **Do not click every `[data-step]` circle to find a drawer.** A circle one ahead of the case
  has role `next` and MOVES the case (part 30). Click the one you mean.
- A control matched by its visible words can be the wrong control: a button reading
  ทำใบเสนอราคา **navigates to the application** and killed a suite mid-run
  ("Inspected target navigated or closed"). Match `data-action`.

### Open / risk

1. **The printed sheet is still laid out at the print window's own width**, not at 210mm — 
   `printQuotation` uses `max-width:1020px`, `printServiceReport` 950px — so the on-screen A4 and
   the printed A4 differ in column widths, and Chrome scales the print to fit the page. Nothing
   is cut either way. Making the print windows 210mm too would make the two identical; it changes
   printed output, so it is the owner's call rather than something to slip in.
2. `salesQuoteDocHTML` is covered by `js/112` but was never opened by a test, because its opener
   is not on `window`.
3. The A4 view is per-device: the พอดีจอ / 100% choice is kept in `imode_v70_a4_zoom`, a new
   localStorage key. Losing it returns to พอดีจอ.
4. The ทีมงาน block lists accounts and is **not** filtered by the team segment above it — the
   line under the heading says so. Accounts have a `team` field but no membership of the
   technician teams that filter drives.
5. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database.
6. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.

### Follow-up (same day): the sideways swipe belongs to the circles, not to the whole card

Reported with two screenshots of `service-case-detail.html` on a phone: swiping across to reach
steps 4 and 5 dragged the open detail drawer off to the left with them, and most of the card
came out blank — "รายละเอียดมันพอดีหน้าจอทำให้มีช่องว่างโผล่มา อยากให้เลื่อนแค่แถบสถานะกลมๆ
ละรายละเอียดของสถานะอยู่กับที่ ส่วนสถานะในรายละเอียดเช่นช่างไรงี้ อยากให้เลื่อนได้แบบตอนนี้ถือว่าดี".

**One CSS cause.** `.scd-progress` carried `overflow-x:auto` and holds **both** the step strip and
the drawer, so one gesture moved both. `.scd-steps` forced the scroll with `min-width:760px` but
was not itself a scroller.

**The strip is its own scroller now, in the shape `.sd-field` has used all along** — no
`min-width` on the container, `flex:1 0 152px` on each item instead, so the row is 5 × 152 =
exactly the 760px it used to demand and scrolls inside its own box. `flex-grow` keeps the desktop
layout identical: measured 269px per step at 1440 with no scroll, 152px with a 760px scrollable
row at 390. `.scd-progress` is `overflow-x:clip` — **not `hidden`**, which would make it a scroll
container on the vertical axis too, and the drawer animates its own height inside it (part 30).

The technician's nine-status ladder inside the drawer was already self-contained
(`.sd-field{overflow-x:auto}` with `flex:1 0 108px`), which is why it kept working and why the
owner was right that that part was already good.

**Measured, and the control is what makes it evidence.** The suite drives the gesture by scrolling
**whichever container really handles it**, found by walking up from the strip — otherwise it
measures the wrong element and passes for the wrong reason, which the first version did.

| | drawer's left edge before → after swiping | |
|---|---|---|
| old CSS, restored at run time | **31px → −401px** | dragged 432px off-screen — the blank card in the screenshot |
| now | **31px → 31px** | and the last step is still reachable |

### 10px of sideways page scroll at 360px — pre-existing, fixed while here

Found by the same run. The case page's topbar is a back arrow, the brand and a 143px tool cluster
(bell, TH, avatar), and `.scd-brand` is `flex:none`, so at 360px it never gave way and the three
controls on the right were pushed **9.6px past the edge**. The brand is the part that can afford
to be shortened, so below 640px it shrinks and ellipsises.

Confirmed pre-existing by measuring the same 10px against the previous build before changing
anything. **0px at 360, 390 and 430 afterwards.**

### Tests

**11 assertions at 360px, 11 at 390px and 8 at 1440px, 0 failures**, plus every earlier suite
re-run: the case page's A4 (7 + 7), the three-request suite (31 + 27), regression (22 + 22).
Both inline blocks of the case page parse.

### Harness note worth keeping

**`service-case-detail.html` is stored CRLF** while most of the repo reads back as `\n`, and
`cat -A` did not show it — `node` did. An anchor containing `\n` will never match in that file.
Anchor on a single line, and join an inserted block with the newline the file already uses.
Backticks inside a comment passed through `node -e` in a shell string are command substitution
and will eat the text; write the patch to a file instead.

### Still outstanding from part 31

`docs/MIGRATION.md` has **not** been written. The DECISION section above is the plan for moving
to the company's VPS; this session was the offline work the owner asked for instead. That
migration note is still the accepted next piece, and it is worth re-reading its five hazards
first — in particular that every device already carries the old database URL in
`imode_v5_cloud` for ever, so `js/23` has to force the new endpoint when it finds the old one.

---

## Session Change Log — 2026-09-24 (part 34): Version 1.0, customer contacts, badges, and three sync bugs

### STATE — everything in this part is pushed

**Pushed and live on GitHub Pages:** `dd6bd71`, `dda6b41`, `56c26f2` — the case-page quotation
freeze, the status circles, the sidebar profile photo, `Data/` in `.gitignore`, Version 1.0, the
UAT wording, the customer A4 quotation, the Sunday-first calendar — and then **`aa45fbf`**
(2026-09-24, pushed at the owner's word the next session), which carries the thirteen files below.

| File | What |
|---|---|
| `js/114-v70CustomerContactsScript.js` | **new** — many contacts per customer |
| `js/115-v70CornerBadgeScript.js` | **new** — orange number circle on button corners |
| `js/116-v70PortalDotsScript.js` | **new** — orange dots on the customer page |
| `supabase/12-customer-contacts.sql` | **new — already RUN by the owner and verified** |
| `js/16` | the My Work permission renamed so it can be found |
| `js/74` | a technician's first job was never flagged new |
| `js/85`, `js/90` | role changes were overwritten by other devices |
| `js/102` | the customer page jumped back to the last screen on every update |
| `sw.js` | revalidate same-origin files; VERSION → `v2-2026-09-24` |
| `service-case-detail.html` | ติดต่อลูกค้า lists the company's contacts |
| `index.html` | three `<script src>` tags (js/114–116) |
| `CLAUDE.md` | this entry |

**Two things still to do by hand, now that it is deployed:** every open tab/device needs one
Ctrl+Shift+R, and role **Admin** must have งานของฉัน unticked **once more** — the cloud row still
holds the stale set (see §4), and nothing in the code can tell a stale set from a deliberate one.

The untracked Thai-named `.txt` in the root is the owner's own file; it was deliberately never
added.

### 1. Version 1.0 — the Version section above is updated

`Beta 1.0 Service focus full system` → **`Version 1.0`** in all seven places, suffix dropped, at
the owner's request (move to the production server). js/06 now `remove()`s the sidebar sub-line.
The login popup no longer says UAT / V6.8.

### 2. Customer contacts — `js/114` + `customers.contacts jsonb`

`customer.contacts = [{id, name, position, note, channels:[{id, type, value}]}]`, types
phone / email / line / whatsapp, any number each, each deletable. The FIRST contact is primary and
is mirrored into the old one-person `contact / phone / email` fields, so no other screen changed.
A customer never edited shows its old fields as one contact (derived, not written).

Transport is js/42's pattern: `cloudUpsertCustomer()` has a column whitelist without `contacts`,
so the value is injected at `cloudUpsert()` keyed by row id, after a one-time column probe; a
device-local mirror `imode_v70_customer_contacts` is put back after `syncCloud()` (which replaces
`customers` wholesale) for as long as the column is missing. `fromCustomerDb` carries it down.

UI: a ผู้ติดต่อ section in the customer popup (after js/52's delete button), listener on
`#modalBody` because js/05 stops propagation at `#modalPanel`. Edit actions need `customer.edit`.
The case page's ติดต่อลูกค้า now lists the company, reporter first, every channel a real link
(`tel:`, `mailto:`, `line.me/ti/p/~id` or `/R/ti/p/@oa`, `wa.me/66…`). 22/22 headless assertions.

**Not tested:** two devices through the real database, and phone widths for the popup.

### 3. Badges — `js/115`, `js/116`, and a js/74 bug

- **js/115**: counts outside the sidebar become an orange circle on the button's corner (mobile
  bottom bar, Home cards) for my-work (js/74), requests (js/49's badge) and notifications
  (`#sideNotifyBadge`). The bottom bar styles every `<span>` as its icon chip, so the badge
  restates its geometry with `!important`. Screenshot-verified at 390px.
- **js/74 bug**: the "seen" baseline was taken lazily by the first `isNew()`, which the filter
  only reaches once the technician HAS a job — so a new technician's first job was baselined as
  read and never flagged. `imodeNewJobCount()` now calls `mine()` first.
- **js/116** customer page: dots on ใบเสนอราคาของฉัน / ประวัติ Service / เอกสารเครื่อง / เช็คประกัน
  and on the individual rows. Seen-state per phone in `imode_v70_portal_seen`; signatures contain
  only what the customer can see change. First visit per machine baselines everything except
  quotations still awaiting the customer's approval; a case the customer reported (เคสใหม่) is
  never new. Wrapping happens at DOMContentLoaded because js/53/56/75 reassign those names.
  14/14 assertions.

### 4. THE ROLE-OVERWRITE BUG — `js/90` + `js/85`

Reported: untick งานของฉัน on role Admin, save, reload — still ticked. Measured: locally it worked;
the live `system_settings` row still had Admin 43/true. `saveRoles()` did push, but **any other
open tab or device pushes its WHOLE settings object the next time it saves anything**, and roles
are an array js/90 never protected.

Fix: `settings.permStamp`, written by a `saveRoles` wrapper only when roles / userPermissions /
rolePresetOptOut really changed (restored if not). In js/90's `adopt()`: the side with the newer
stamp wins for `roles, userPermissions, rolePresetOptOut, systemBehavior` — on push a stale device
takes the cloud's copy first; on sync a device whose save never landed keeps its own and pushes it
back. js/85 now takes those keys live, but only when the incoming stamp is not older.
Tested with a stubbed cloud (saving device wins, stale device adopts, no-op save keeps the old
stamp). **Not tested with two real devices.**

Also: the My Work permission was there all along, as "ดูงานที่ได้รับมอบหมายของตนเอง" under
"งานของช่าง" — renamed to "เมนู งานของฉัน — …" under "งานของฉัน (ช่าง)" (js/16).

### 5. THE PORTAL JUMP — `js/102`

Reported: when a status updates, the customer page jumps to the last screen they opened.
js/102's `repaint()` (hooked on `renderAll`, which every realtime row and sync calls) re-ran the
last read view; `last` was only cleared by a form. So after reading ประวัติ Service and going Home
— or into one case, or one quotation — every update threw the customer back into the list, and
`renderCustomerPortal()` (which rewrites `#portalContent`) wiped a half-typed form.

Now a read view is redrawn only while detail mode is on AND `#portalContent` still holds the node
that view drew; `renderCustomerPortal()` runs only on the Home page. 5/5 assertions; the same
suite against the old js/102 fails 3 — the three reported symptoms.

### 6. The case-page quotation "lost its A4 bar" — NOT reproduced

With the real stored paper of QT-SRV-202609-037 (read from `system_settings.quoteDocs`) at 340px,
first open, close-and-reopen and the real step-2 button all show `A4 · 34% · พอดีจอ / 100%`.
The likely cause is a stale copy: `sw.js` used `fetch(req)`, which honours the HTTP cache, and
GitHub Pages sends `max-age=600`. `sw.js` now fetches same-origin files with `cache:'no-cache'`
(a 304 when unchanged) and VERSION is bumped. If the owner still sees it after a hard reload, ask
whether it was GitHub Pages or Live Server.

### 7. Other fixes pushed today

- `service-case-detail.html`: the A4 observer re-ran on its own label write → an endless rAF loop
  froze "ดูใบเสนอราคาเต็ม"; label written only on change, fit only for new papers. `.scd-steps`
  got `padding:6px 0 4px` because its `overflow-x:auto` clipped the circles' rings.
- js/97: js/09's `login()` calls its CLOSURE `accountToUser()` (`photo:''`), so the sidebar card
  never had the account photo — resolved at render time now.
- js/56 + js/112: the customer's quotation is an A4 page; js/112's toggle now also listens on the
  document (it only listened on `#modalBody`).
- js/03 calendar: month and week start on Sunday; the month grid has a weekday header row
  (hidden 641–900px where css/01 turns it into 2-column cards).

### Decisions recorded today (also in memory)

- **Production = the company VPS on Ubuntu** (the owner can reinstall it as Ubuntu). The Windows
  plan in the DECISION section above is superseded: on Linux the whole Supabase stack self-hosts
  and realtime stays. `docs/MIGRATION.md` for Ubuntu is still to be written.
- **GitHub Pages = the test site**, made public only while testing; staging and production must
  use SEPARATE databases (js/23 will have to choose by hostname). Branches `dev` → test,
  `main` → production.
- **Real data** is in `Data/` (151 customers, 353 machines, 353 warranties, 105 models;
  gitignored). No QR has been printed, so machine ids may change to the file's `M00001` form and
  all test data may be deleted — **but only when the owner says go.** `machinery_images/` was not
  supplied.
- Web server on the VPS: GitHub (private) + Caddy was recommended; not yet confirmed. Domain and
  the VPS IP are still needed from the owner.

### Harness notes worth keeping

- **A bash heredoc in this shell fails on long Thai/markdown text** ("unexpected EOF while looking
  for matching `'`") and runs nothing. Write the text with the Write tool and append the file.
- To inject a large HTML string into a page under test, send it as its own
  `Runtime.evaluate('window.__h='+JSON.stringify(html))`; embedding it inside a template literal
  breaks on its quotes.
- js/74's seen-baseline is taken on the first count, so a test must call `imodeNewJobCount()`
  BEFORE adding the job it expects to be new.
- `imodeOpenAssignedCase` navigates to the case page; use `imodeMarkJobRead` to clear a badge in
  a test that must stay on `index.html`.

---

## Session Change Log — 2026-09-25 (part 35): the escaping helper never escaped anything

A bug sweep, asked for in those words ("ตรวจหาบัคทั้งหมด และแก้ไขมัน... และป้องกัน"). Everything
below was **measured in a browser before it was touched** and re-measured after. Four defects were
found and fixed; five suspicions were measured and turned out NOT to be defects, which is recorded
too so the next session does not chase them again.

| File | What |
|---|---|
| `js/03-app-core.js` | **`window.esc=esc`** — one line that repairs 925 call sites in 48 files; and the travel charge may no longer fall as the distance grows |
| `js/16`, `js/26`, `js/83` | three notification messages stop pre-escaping, now that escaping really happens |
| `css/22-v69-customer-home.css` | the English label on the customer page fits a phone |
| `js/98-v70TechAccountScript.js` | its `<style>` had js/64's id |

### 1. THE ONE THAT MATTERS: `esc2()` has never escaped anything, in 48 files

`esc` is declared at `js/03:248` as **`const`** — a lexical global, so **`window.esc` is
`undefined`**. Forty-eight patch files each carry the identical helper:

```js
function esc2(v){return typeof window.esc==='function'?window.esc(v):String(v==null?'':v)}
```

The test fails, so every call took the fallback — **`String(v)`, which escapes nothing**. There are
**925 `esc2()` call sites**, and every one that writes into `innerHTML` rendered stored text as
live markup.

Measured, with one marker per field so the element names the field it came from: an
`<img src=x onerror=...>` stored in a **machine name, customer name, ticket or channel** executed on
**every page walked** — dashboard, cases, customers, machines, requests, quotation, calendar,
assign, field-all, qc, warranty, documents, reports, notifications — because `renderAll()` renders
every module whatever page is on screen. Seven `<img>` elements were created and the payload ran.

**Who can do it:** anybody who can write a customer or machine name. Staff can, the portal can — and
`04-anon-uat.sql` currently lets **anyone on the internet** write one, so this was reachable from
outside. It is a stored XSS in the admin's browser.

**The fix is one line** — `window.esc=esc;` beside the declaration — because all 48 files ask for
the same property. This is the trap this file has recorded since part 17 §5 for
`currentUser`/`settings`/`cases` and again in part 30 for `fmt`/`fmtDay`; nobody had applied it to
`esc`. **`fmt` and `fmtDay` are still lexical-only** — export them the same way if a patch file
ever needs them.

**The one thing turning it on could break, and did not:** three notification `message:` fields were
built with `esc2()` and then rendered through sinks that escape again (`esc(n.message)` at
js/03:397/1118/1152/1297, and js/58:55). With `esc2` live that would double-escape and show the
user `&amp;`. Those three now hand over the raw text — the sink owns the escaping. Verified: a
company called `S&P "Alpha" <Bangkok> Co., Ltd. it's` reads correctly in 27 places across all 26
pages, and **no rendered text anywhere contains a literal entity**.

**The suite detects the bug, it does not merely agree with the fix.** Re-run with `window.esc`
forced back to `undefined`: **7 injected elements, payload executed**. With the fix: 0 elements,
0 images, payload never ran, and the hostile text is on screen as readable characters — which is
what correct escaping looks like. Console errors over the same walk went 10 → 0, because the
`<img src=x>` that were 404-ing are no longer created.

`service-case-detail.html` is **not** affected: it declares its own `esc` as a function declaration
inside its IIFE and calls it directly, never through `window`.

### 2. The travel charge fell as the distance grew

`getQuoteTravel()` scanned in 1 km steps from 0 to 260: **181–189 km cost LESS than 180 km.**
180 km is a flat 1,900 (Z5); 181 km is the per-km zone at 10 THB/km = **1,810**. A customer further
away paid up to 90 THB less, and it only caught up at 190 km. That is the documented rate card
applied literally — `121–180 = 1,900`, `>180 = 10 THB/km` — so it is the table contradicting itself,
not a coding slip.

A per-km zone is now **floored at the previous zone's flat fee**, read from the zone list itself so
it still holds if the rates are edited in Settings. 181–189 km becomes 1,900; **every distance from
190 km up is untouched** (the per-km figure is already above the floor), and every whole-km value in
the documented table is unchanged. Re-measured across 0–260 km: the curve never falls.

**This is a price change** for one 9 km band. To revert it, delete the `if(Number(z.perKm)>0){...}`
line; to go the other way instead, lower Z5.

### 3. The customer page cut its own labels on every phone

The small-caps English label under each action card is `white-space:nowrap; overflow:hidden`, and
the label box is **95px at 390px, 80px at 360px** while `"BUY / RENEW WARRANTY"` needs **135px**.
Measured: **4 of 9 labels cut at 390px, 6 of 9 at 360px**, 3 at 430px, 1 at 480px, none at 540px and
above. On screen they read "BUY / RENEW W…", "SERVICE QUOTA…", "WARRANTY CHE…" — on the one page
every customer sees.

Below 540px the label now wraps instead of being truncated, with slightly tighter letter spacing so
most still fit one line. The coloured rule is an absolutely positioned `::before` at `top:0` and is
unaffected, and the cards already carry `min-height:112px`, so the second line costs no height.
Re-measured: **0 cut at 360 / 390 / 430 / 480 / 540 / 1024**, and confirmed by screenshot.

### 4. Two `<style>` elements shared one id

`js/64` and `js/98` are different files with different jobs — both happen to be named
`…TechAccountScript` — and both appended a `<style id="v70TechAccountStyle">`. Neither guarded, so
both existed and `getElementById` would always have returned js/64's. No functional consequence
today (CSS applies per element, and nothing reads that id), but it is invalid and exactly the kind
of thing a later `getElementById` walks into. js/98's is `v70TechAccountFormStyle` now.

### Measured and NOT a defect — do not chase these again

- **`ReferenceError: customerForm is not defined`.** The part-28 fragility (≈25 modals bind their
  submit handler on `setTimeout(…,20)`; a second `openModal()` inside that window leaves the
  id-global gone). Opening the customer form on its own wires correctly with no error, and **all 68
  openers on the customers page clicked one at a time produced zero errors**. It only fires when a
  second `openModal()` lands inside 20 ms, which is what a crawler does and a person does not.
  Part 28's decision to leave js/03 alone stands.
- **`window.imodeV67Data is not a function`** — it is an **object** with `.get()`/`.set()`
  (js/04:105), which is exactly how js/41 calls it. The ops sync is fine.
- **Fractional travel bands** (15.5 / 30.5 / 50.5 / 80.7 / 120.2 km) — part 28's fix holds: 400 /
  600 / 900 / 1300 / 1900, none falling through to the per-km zone.
- **Dates** — `todayISO()` is the local date, `addMonthsISO` keeps the day across 31 Jan, 31 Mar and
  31 Dec. Part 28's fix holds.
- **Crew matching** — `caseHasTech()` finds the lead, the second technician and refuses a stranger.
  Part 25's fix holds.
- **`fromQuotationDb`** still reads the string `"false"` as not-under-warranty (part 18's fix holds),
  and `warrantyMode` follows it.

### What was swept, and what it cost

A CDP driver in the session scratchpad (not added to the repo), carrying every harness note this
file records. Passes: `node --check` on all 121 files and both inline blocks of the case page ·
every inline `on*` handler resolved at runtime (981 attributes, 127 distinct functions; the only
"missing" two are `add` and `remove` from `classList.add(` and `this.remove(`, i.e. method calls) ·
duplicate ids at rest and with a popup open · **26 sidebar pages as admin and 7 as technician**,
each checked for errors, wrong landing and sideways scroll · **57 popups** opened, closed and
checked · a per-element geometry sweep of all 26 pages at 390px (in-flow children only, off-screen
elements skipped, deliberate scrollers skipped — the false positives part 33 recorded) · the
customer surface walked card by card, all 9 · hostile data through five lists and two popups ·
an unknown serial · money, dates, stock, crew and signature logic.

**0 page errors and 0 console errors** on every run after the fixes.

### Harness notes worth keeping

- **`node --check` cannot see this class of bug at all.** `esc2()` is syntactically perfect and
  semantically empty. Only running it against hostile data finds it.
- **Put one marker per field in the payload** (`data-f="c.ticket"`), not one generic payload. The
  element that appears then names the field and the render path, which turned a "something is
  unescaped somewhere" into four field names in one run.
- **"Is the substring in `innerHTML`?" is the wrong question.** Correctly escaped text still
  *contains* the characters `onerror=`; `innerHTML` re-serialises a text node, so `>` comes back as
  `&gt;` and the string is there either way. Ask whether an **element** was created
  (`querySelectorAll('*')` with that attribute, or `document.images`). That assertion failed twice
  here for no defect.
- **Always run the control.** Forcing `window.esc` back to `undefined` with
  `Page.addScriptToEvaluateOnNewDocument` proved the suite detects the bug rather than agreeing
  with the fix.
- A clicking crawler is good at reaching states a person cannot, so **attribute every finding to a
  single click with a human-sized gap** before believing it.

### Open / risk

1. **The travel fix is a price change** for 181–189 km (1,810–1,890 → 1,900). One line to revert.
2. `fmt` and `fmtDay` are still lexical-only, so `window.fmt` is `undefined`. Nothing depends on it
   today; part 30 records a patch file that silently printed raw ISO strings because of it.
3. The `setTimeout(…,20)` modal binding is still there in ≈25 modals, deliberately. It is
   crawler-only; if a future patch ever calls `openModal()` twice in a tick it becomes real, and the
   symptom is a form that silently does not save.
4. `c.serviceTeam` and `c.caseType` are written onto a case and are **not** in
   `cloudUpsertCase()`'s column whitelist, so they do not survive a sync. Unchanged from part 28 §4
   and part 27 §open-4; both degrade quietly today.
5. Unchanged from part 15: `04-anon-uat.sql` means anyone on the internet can read and write this
   database — which is what made §1 reachable from outside rather than only by staff.
6. Unchanged from part 11: the customer Home page still shows any machine to anyone who has its
   serial or QR.
