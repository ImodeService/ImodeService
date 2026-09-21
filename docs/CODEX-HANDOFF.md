# Handover — I-MODE Plus Service & Maintenance

Written 2026-09-21 for the next agent working on this repo. The owner is waiting on quota and
wants progress made in the meantime.

**Read `CLAUDE.md` in the repo root before touching anything.** It is ~374 KB and it is the real
architecture document: what every patch file does, why, what was measured, and what broke last
time. Do not skim it. Everything below assumes you have read it.

---

## Where the project is right now

- Live on GitHub Pages: `https://imodeservice.github.io/ImodeService/` — HEAD is `61fd56c`.
- It is a **static site**. No build step, no server runtime, no bundler. `index.html` is markup
  only; all behaviour is in `js/01-*.js` … `js/92-*.js`, loaded in numeric order by plain
  `<script src>` tags. A later file overrides an earlier one. That numbering **is** the
  architecture.
- The backend is Supabase (project `service_Imode_test`, ref `ywlrlfudlxsallanoroq`).
- The UAT database was wiped of work records on 2026-09-21 at the owner's instruction. Masters
  were kept: 11 customers (real pilot companies), 42 machines, 5 technicians, 40 warranties,
  4 spare parts, and all configuration/accounts/roles in `system_settings`.
- The owner is preparing to move to a main server: 4 vCore / 8 GB / 80 GB SSD / 100 Mbps. That is
  far more than a static site needs; the spec is not a constraint on anything.

---

## RULES YOU MUST NOT BREAK

These are not style preferences. Each one has already cost this project a day.

1. **`window.<name>` is `undefined` for a top-level `let`/`const`.** `settings`, `cases`,
   `machines`, `customers`, `currentUser`, `supa`, `cloudSettings`, `pendingFieldStatusMedia`,
   and every `const` helper in `js/03` (`fmt`, `fmtDay`, …) are lexical globals. Read them by
   bare identifier. A top-level `function` declaration **is** a window property; a `let` is not.
2. **A field added to a case never reaches `service_cases` unless `cloudUpsertCase()` names it**
   (js/03:1726 builds an explicit column whitelist). Same for quotations and line requests. This
   has silently destroyed data three times — the customers' photos, the technician crew, and the
   appointment date.
3. **`css/21-v69-tactile-buttons.css` and `css/23-v70-responsive.css` must stay the last two
   `<link>` tags.** A new stylesheet has to come after them or inject a `<style>` at runtime.
4. **A script that pushes a new key into `PERMISSION_CATALOG` must load before `js/20`**, which
   repairs roles against the catalog as it stands at that moment. Otherwise the key is stripped
   from every role on every reload. Prefer reusing an existing permission key.
5. **Never reorder or renumber `js/*.js` or `css/*.css`.** The number is the load order.
6. **Do not change the version strings.** `Beta 1.0 Service focus full system` appears in seven
   places and `js/06` rewrites the sidebar copy on every render.
7. **Never run `localStorage.clear()` in product code**, and never run destructive SQL against
   the live database. Write SQL to `supabase/NN-*.sql` and leave it for the owner to run.
8. **A delegated `click` listener on `document` never fires inside a popup** — js/05 calls
   `stopPropagation()` on `#modalPanel`. Listen on `#modalBody` for modal content; `document` is
   correct for anything on the page.
9. **`closeModal()` only removes a class.** The modal markup stays in the DOM, so ids inside it
   persist and can collide with ids you create elsewhere. A duplicated id makes the id-global an
   `HTMLCollection`, not the element.

## How to verify your work

`node` is installed. After JS changes:

```
node --check js/<file>.js          # all 92 files must pass
```

`service-case-detail.html` has one big inline script; check it by extracting and running it
through `new Function`. There is no test runner in the repo — the suites were built in a
scratchpad outside it, deliberately (see the "no unnecessary helper scripts" rule). If you write
tests, keep them out of the repo.

**Syntax passing is not evidence of correctness.** Load the page in a browser and watch for
`ReferenceError`. A script that fails to parse dies silently: the only symptom is that its
globals are missing.

---

## Work to do, in priority order

### 1. Production SQL — RLS and an anon insert policy  *(write only, do not run)*

The single biggest risk. `supabase/04-anon-uat.sql` currently grants
`for all to anon using(true) with check(true)` on every data table, and the publishable key ships
in `js/23` in a public repo — so anyone on the internet can read or delete the whole database.
Acceptable for UAT; not acceptable once real customer records exist.

Write `supabase/10-production-rls.sql` that:

- re-enables the `02-rls.sql` posture (policies `to authenticated`),
- adds a narrow **anon INSERT** policy for `service_cases` and `line_customer_requests` only —
  that is the one path a customer with no account must be able to write (`submitPortalIssue()`),
- grants anon **SELECT** only on what the customer portal genuinely reads: `machines`,
  `machine_warranties`, `machine_documents`, and the customer's own cases. Be conservative and
  document each grant with a comment naming the function that needs it.
- drops the `uat_anon_all` policies from `04-anon-uat.sql`.

Put a header on the file saying it must not be run until staff login has moved to Supabase Auth,
because every staff account today authenticates against the local UAT registry in `js/09` and
would be locked out the moment the policies become `to authenticated`.

**Do not run it.** Add a short section to `supabase/README.md` telling the owner the order:
backups on → create production project → create real staff users → run this → switch
`settings.authConfig.provider`.

### 2. Deploy runbook + nginx config  *(docs only, zero risk)*

Write `docs/DEPLOY.md` covering the move to the new server:

- HTTPS is mandatory, not optional — the QR scanner uses `BarcodeDetector`/`getUserMedia`, which
  need a secure context, and the button is not even rendered without one. Let's Encrypt.
- an nginx server block serving the repo root as static files, with **cache headers**:
  `no-cache, must-revalidate` for `.js`, `.css`, `.html`; `expires 30d` for images and fonts.
  Explain why: there are 92 JS files with no cache-busting and a later file overrides an earlier
  one, so a half-stale cache produces failures that are very hard to diagnose.
- after deploying, set **ตั้งค่าระบบ → LINE OA สำหรับลูกค้า → Public App URL** to the new origin.
  It is currently `https://imodeservice.github.io/ImodeService/`. No printed QR codes exist yet,
  so there is no legacy URL to keep alive — the owner confirmed this.
- a note that the app must be served over http(s), never opened as `file://`: `pages/pages.js`
  reads `pages/customer-home.html` with XHR and the customer page falls back to a notice.

### 3. Error reporting — new `js/93-*.js`  *(additive, safe)*

Nobody finds out when the app breaks for a technician in the field. Add one small patch file
following the existing pattern (an IIFE, wrapping nothing, reading globals by bare identifier):

- a `window.onerror` and `unhandledrejection` listener,
- buffers to a device-local key and posts to a new Supabase table `client_errors`
  (`{id, at, url, message, stack, user, ua}`) when a connection exists,
- **must never throw from inside itself** and must be silent to the user,
- rate-limit: at most N per session, and do not report the same message twice.

Write `supabase/11-client-errors.sql` for the table. Do not run it. Register the script tag at
the end of `index.html`, after `js/92`.

### 4. `docs/architecture.md` — Mermaid diagrams  *(docs only)*

The owner asked for a current diagram; the existing `docs/imode-flow-map.png` is from
2026-09-14 and predates the Workshop flow, the writable case page, the quotation signatures, the
field-note edit history and realtime. Write three Mermaid diagrams GitHub can render:

1. **the override chain** — which patch file wraps which function of which earlier file,
2. **the business flow** — customer report → case → assign + schedule → nine field statuses →
   inspection sheet → เสร็จสิ้น → ปิดเคส, with the Workshop and Online branches,
3. **data flow to Supabase** — the 15 tables, which sync both ways, which are download-only
   (`notifications`), and that `system_settings` is one shared jsonb blob every device rewrites.

All of it is derivable from `CLAUDE.md`. Do not guess; cite the file that does each thing.

### 5. Photos out of the database  *(largest, design first — do not start coding blind)*

The reason the owner had to wipe the database today. Every device's `syncCloud()` downloads every
case and every service report **including base64 photos**, into a localStorage with a 5 MB
ceiling: 23 inspection sheets alone were 5.43 MB. Real use of 50 cases a month will hit the wall
within weeks, and no server spec can help because the limit is in the browser.

The fix is Supabase Storage: upload the file, keep the URL. **Write the plan to
`docs/STORAGE-PLAN.md` first and stop there** — do not begin the migration without the owner
reading it. The plan must cover:

- where base64 lives today (`c.media`, `fieldStatusLog[].media`, `fieldStatusLog[].revisions[].media`,
  `service_reports.before_photos/after_photos/videos`, and the signature PNGs),
- a switchable upload helper so old records with base64 keep rendering while new ones use URLs —
  a big-bang migration of a live database is not acceptable,
- what happens offline: a technician at a machine with no signal must still be able to attach a
  photo and have it upload later,
- js/72's storage guard already sheds media it knows the cloud has; say how it interacts.

---

## Things that are known-broken or deliberately left

- `my-work` bounces for an Admin, who holds no `mywork.view`. Intended.
- `settings.sla`'s `urgentResponseMin`, `resolutionHours`, `autoEscalateMin`, `workStart`,
  `workEnd` are read by nothing. The screen saves values that drive no behaviour.
- `🔔 เตือนลูกค้า` writes a local notification and sends the customer nothing. Hidden from
  technicians; an admin still sees it.
- `notifications` is downloaded but never uploaded; addressed notices are derived from the case.
- Staff accounts are UAT: password equals username, hashes in client source. Must not reach a
  production database.

## Do not do

Do not rewrite the application, migrate to a framework, add a bundler, clean unrelated legacy
code, change storage keys, alter Supabase settings, or add CRM features. Prefer the smallest safe
change, and write what you did and what you measured into `CLAUDE.md` in the same style as the
entries already there.
