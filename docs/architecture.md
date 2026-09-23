# I-MODE Plus Service & Maintenance architecture

Current as of 2026-09-21. The application is a static, classic-script web application.
`index.html` is markup; `js/03-app-core.js` defines the original application and later
numbered files wrap or replace its globals in load order. The number in each filename is
therefore part of the runtime architecture, not cosmetic organisation.

Top-level `let` / `const` bindings such as `cases`, `settings`, `currentUser` and `supa` are
shared lexical globals but are not properties of `window`. Patch files must access those by
bare identifier. Top-level function declarations are window properties and form the override
chains below.

## 1. Active override chains

An arrow means “the later file captures the version on its left and installs an outer
wrapper”. The rightmost node in a chain is the active exported function. A replacement is
labelled explicitly because it does not call the earlier implementation.

```mermaid
flowchart TB
  subgraph NAV["Navigation · window.goPage"]
    G03["03 app-core"] --> G09["09 UAT accounts"] --> G10["10 role home"] --> G12["12 role scope"]
    G12 --> G14["14 customer entry"] --> G16["16 work assign"] --> G19["19 customer home"]
    G19 --> G22["22 history"] --> G25["25 beta"] --> G32["32 field workspace"]
    G32 --> G40["40 trash"] --> G43["43 quote view"] --> G44["44 tech flow"]
    G44 --> G45["45 done jobs"] --> G49["49 requests"] --> G60["60 drill and bars"]
    G60 --> G61["61 request log"] --> G73A["73 field scope A"] --> G73B["73 field scope B"]
    G73B --> G74["74 new-job badge"] --> G75["75 quote approval"] --> G83["83 quote accept"]
    G83 --> G87["87 topbar scroll"] --> G89["89 purchasing · active"]
  end

  subgraph SYNC["Cloud pull · window.syncCloud"]
    S03["03 app-core"] --> S23["23 cloud config"] --> S29["29 modal history"] --> S38["38 team assignment"]
    S38 --> S41["41 operational tables"] --> S43["43 quote view"] --> S45["45 done jobs"]
    S45 --> S47["47 role presets"] --> S48["48 case response"] --> S49["49 requests"]
    S49 --> S65["65 individual permissions"] --> S69["69 status log"] --> S71["71 merge unsynced"]
    S71 --> S72["72 storage guard"] --> S76["76 case form"] --> S83["83 quote accept"]
    S83 --> S90["90 settings merge · active"]
  end

  subgraph WRITE["Important write chains"]
    L03["03 saveLocal"] -. "replaced" .-> L04["04 saveLocal"] --> L41["41 ops diff push"]
    L41 --> L69["69 case-status audit"] --> L72["72 quota guard · active"]

    C03["03 cloudUpsertCase"] --> C38["38 crew in assignee"] --> C42["42 customer media"]
    C42 --> C48["48 responded stamp · active"]

    F03["03 saveFieldStatus"] --> F63["63 finish confirmation"] --> F68["68 signature gate"]
    F68 --> F78["78 app confirmation dialog · active"]

    SS03["03 cloudSaveSettings"] --> SS90["90 merge additive maps · active"]
  end

  subgraph RENDER["Case and detail rendering"]
    RC03["03 renderCases"] --> RC26["26 case flow"] --> RC92["92 updated-first · active"]
    P03["03 paginateList"] --> P92["92 updated-first before slice · active"]
    D03["03 openCaseDetail"] --> D42["42 media"] --> D48["48 response"]
    D48 --> D52["52 record actions"] --> D88["88 case popup · active"]
  end

  subgraph BOOT["Cloud boot and diagnostics"]
    I03["03 initCloud"] --> I85["85 Realtime"] --> I93["93 client-error flush · active"]
  end
```

The diagram covers the high-risk chains rather than every exported helper. `renderAll()` has
the same shape: `js/04` replaces the core renderer, then `js/06`, `26`, `49`, `61`, `73`,
`74`, `75`, `76`, `80`, `83` and `89` wrap it. A call made through a closure can bypass a
later `window.*` wrapper, so each change still has to trace the actual caller.

Sources: [`js/03-app-core.js`](../js/03-app-core.js),
[`js/04-v67EnhanceScript.js`](../js/04-v67EnhanceScript.js),
[`js/41-v70OpsSyncScript.js`](../js/41-v70OpsSyncScript.js),
[`js/63-v70FieldSheetScript.js`](../js/63-v70FieldSheetScript.js),
[`js/68-v70CloseSignatureGateScript.js`](../js/68-v70CloseSignatureGateScript.js),
[`js/71-v70SyncMergeScript.js`](../js/71-v70SyncMergeScript.js),
[`js/72-v70StorageGuardScript.js`](../js/72-v70StorageGuardScript.js),
[`js/85-v70RealtimeScript.js`](../js/85-v70RealtimeScript.js),
[`js/90-v70SettingsMergeScript.js`](../js/90-v70SettingsMergeScript.js),
[`js/92-v70CaseUpdatedScript.js`](../js/92-v70CaseUpdatedScript.js), and
[`js/93-v70ClientErrorScript.js`](../js/93-v70ClientErrorScript.js).

## 2. Business flow

The case is the centre of the workflow. `รออะไหล่` is a conditional hold, not a required
stage. Workshop and Online are categories with different execution tracks; they do not use
the onsite GPS/field ladder.

```mermaid
flowchart TD
  A["Customer Portal / LINE OA / Phone / Email"] --> B["Customer + Machine master"]
  B --> C["Service Case · เคสใหม่"]
  C -. "quotation when required" .-> Q["Quotation → customer acceptance/signature"]
  Q -. "approved / referenced" .-> C
  C --> D["มอบหมายแล้ว · assign lead and crew"]
  D --> E["นัดหมายแล้ว · calendar/appointment"]
  E --> K{"Case category"}

  subgraph FIELD["Field Service · js/03, 32, 44, 63, 68, 91"]
    K -->|"Field"| F1["1 กำลังเดินทาง"]
    F1 --> F2["2 ถึงหน้างาน + GPS check-in"]
    F2 --> F3["3 เริ่มตรวจเช็ก"]
    F3 --> F4["4 กำลัง PM / Maintenance"]
    F4 --> F5["5 กำลังซ่อม Service"]
    F5 --> F7["7 ทดสอบเครื่อง"]
    F5 -. "parts required" .-> F6["6 รออะไหล่ · hold"]
    F6 -. "parts ready" .-> F5
    F6 -. "ready to test" .-> F7
    F7 --> F8["8 รอลูกค้าตรวจรับ"]
    F8 --> FR["Inspection / Service Report + photos + signatures"]
    FR --> F9["9 จบงาน"]
  end

  subgraph WORKSHOP["Workshop · js/79, 81 and service-case-detail.html"]
    K -->|"Workshop"| WQ["Quotation required first; work may begin before signature"]
    WQ --> WR["Receive machine + inbound/outbound logistics"]
    WR --> W1["รอตรวจ → กำลังตรวจ → กำลังซ่อม"]
    W1 -. "parts required" .-> W2["รออะไหล่ · hold"]
    W2 -. "parts ready" .-> W1
    W1 --> W3["ทดสอบ → พร้อมส่งคืน"]
    W3 --> WQC["Mandatory Pre-Delivery QC"]
    WQC --> WH["Return / deliver machine"]
  end

  subgraph ONLINE["Online · js/76, 79, 82 and service-case-detail.html"]
    K -->|"Online"| O1["Record online work, note and attachments"]
    O1 --> O2["Coordinator presses ปิดเคส online"]
  end

  F9 --> DONE["เสร็จสิ้น"]
  WH --> DONE
  O2 --> DONE
  DONE --> REVIEW["Admin checks report, history, QC and hand-off"]
  REVIEW --> CLOSED["ปิดเคส"]
```

Field corrections replace the selected `fieldStatusLog` entry, retain up to five revisions,
stamp `editedAt` / `editedBy`, and move through Supabase Realtime without changing the log
length. The standalone case page infers passed main steps when an old case has a partial log,
but never infers the optional `รออะไหล่` branch.

Sources: [`js/03-app-core.js`](../js/03-app-core.js),
[`js/32-v70FieldWorkspaceScript.js`](../js/32-v70FieldWorkspaceScript.js),
[`js/63-v70FieldSheetScript.js`](../js/63-v70FieldSheetScript.js),
[`js/68-v70CloseSignatureGateScript.js`](../js/68-v70CloseSignatureGateScript.js),
[`js/79-v70IssueCaseTypeScript.js`](../js/79-v70IssueCaseTypeScript.js),
[`js/81-v70WorkshopScript.js`](../js/81-v70WorkshopScript.js),
[`js/82-v70CaseCategoryScript.js`](../js/82-v70CaseCategoryScript.js),
[`js/91-v70FieldStepEditScript.js`](../js/91-v70FieldStepEditScript.js), and
[`service-case-detail.html`](../service-case-detail.html).

## 3. Browser and Supabase data flow

The “15 tables” below are the application data plane. `profiles`, `auth_audit` and the new
optional `client_errors` inbox are support tables and are intentionally outside that count.

```mermaid
flowchart LR
  UI["Pages, modals and service-case-detail.html"] <--> MEM["Lexical in-memory arrays / settings"]
  MEM <--> LS["localStorage cache\nexisting imode_* keys"]

  subgraph CORE["10 bidirectional application tables · js/03"]
    T1["service_cases"]
    T2["technicians"]
    T3["customers"]
    T4["machines"]
    T5["quotations"]
    T6["machine_warranties"]
    T7["machine_documents"]
    T8["line_customer_requests"]
    T9["service_reports"]
    T10["system_settings · one shared jsonb row"]
  end

  subgraph OPS["4 bidirectional jsonb tables · js/41"]
    O1["qc_records"]
    O2["petty_cash"]
    O3["spare_parts"]
    O4["purchase_orders"]
  end

  N["notifications\ndownload only"]
  RT["Supabase Realtime · js/85\nrow events for core operational state"]
  MERGE["Safety wrappers\njs/71 pending-row merge\njs/90 additive settings merge\njs/72 local media shedding"]

  MEM <--> |"pull at sync + explicit upserts"| CORE
  MEM <--> |"diff push + merge pull"| OPS
  N --> |"syncCloud SELECT; no upload path"| MEM
  CORE -. "postgres_changes" .-> RT
  RT -. "mutate one row + repaint" .-> MEM
  MERGE -. "guards writes and pulls" .-> MEM

  AUTH["profiles + auth_audit\nSupabase Auth support"]
  ERR["client_errors\njs/93 best-effort INSERT"]
  UI -. "sign-in/session" .-> AUTH
  UI -. "silent diagnostics" .-> ERR
```

`system_settings` deserves special attention: the application stores all configuration and
several cross-device operational maps in one row (`id = main`) and `cloudSaveSettings()`
rewrites the whole JSON document. `js/90` preserves IDs for known additive maps before a
write/sync, but this is still a shared last-writer-sensitive blob, not field-level storage.

`notifications` is the one application table that is downloaded but has no cloud upload
function. Several visible alerts are derived locally from cases instead. The four operational
tables store each complete record in a `data jsonb` column so new JavaScript fields are not
silently dropped by a column whitelist.

Sources: [`js/03-app-core.js`](../js/03-app-core.js),
[`js/41-v70OpsSyncScript.js`](../js/41-v70OpsSyncScript.js),
[`js/71-v70SyncMergeScript.js`](../js/71-v70SyncMergeScript.js),
[`js/72-v70StorageGuardScript.js`](../js/72-v70StorageGuardScript.js),
[`js/85-v70RealtimeScript.js`](../js/85-v70RealtimeScript.js),
[`js/90-v70SettingsMergeScript.js`](../js/90-v70SettingsMergeScript.js),
[`supabase/00-tables.sql`](../supabase/00-tables.sql), and
[`supabase/05-v70-operational-tables.sql`](../supabase/05-v70-operational-tables.sql).
