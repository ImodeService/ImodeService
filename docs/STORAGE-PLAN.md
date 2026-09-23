# Supabase Storage migration plan

Status: **design only — do not start the migration until the owner approves this plan.**

The server size is not the limiting factor. The current browser downloads base64 media into
JavaScript arrays and `localStorage`, whose practical budget is about 5 MB. Base64 also adds
roughly one third to the original file size. Moving the website to a larger server does not
change that browser limit.

The target is: binary content lives in a private Supabase Storage bucket; application rows
keep small references; existing base64 records continue to render; and a technician with no
signal can still attach evidence and send it later.

## Current locations that contain binary data

These are the first migration scope because they grow with every service job:

| Record | Current field | Current shape / writer |
|---|---|---|
| Customer issue | `service_cases.media` (`c.media`) | `[{name,type,size,data}]`; `data` is a data URL (`js/42`) |
| Portal request duplicate | `line_customer_requests.media` | Same attachments as the new case (`js/42`) |
| Field status evidence | `service_cases.field_status_log[].media` | Images/videos inside the case JSON (`js/03`, `js/30`) |
| Corrected field evidence | `field_status_log[].revisions[].media` | Previous photos retained only when an edit changed them (`js/91`) |
| Online/Workshop evidence | tagged `field_status_log[].media` | Online and receiving photos (`service-case-detail.html`) |
| Service report | `before_photos`, `after_photos`, `videos` | Arrays in `service_reports` (`js/03`) |
| Service report signatures | `customer_signature`, `tech_signature` | PNG data URLs in text columns (`js/03`, `js/68`) |

Other base64 fields should use the same helpers after the service-job path is stable:

- QC `qc_records.data.media`;
- quotation signatures in `system_settings.data.quoteApprovals` and `quoteStaffSigns`;
- `machines.photo` and `technicians.photo`;
- warranty `attachment_data` and machine document `file_data`.

They must be inventoried and measured, but they should not be folded into the first rollout.
Changing every upload surface at once would make rollback and fault isolation unsafe.

## Storage model

Use one **private** bucket initially, for example `service-media`. Do not make it public and
do not put the Supabase `service_role` key in browser code.

Suggested immutable object paths:

```text
cases/<case-id>/intake/<uuid>.<ext>
cases/<case-id>/field/<field-entry-id>/<uuid>.<ext>
reports/<report-id>/before/<uuid>.<ext>
reports/<report-id>/after/<uuid>.<ext>
reports/<report-id>/videos/<uuid>.<ext>
reports/<report-id>/signatures/customer/<uuid>.png
reports/<report-id>/signatures/technician/<uuid>.png
```

Never use the original filename as the object key. Keep it only as display metadata. Never
overwrite an existing path when a photo is corrected: a revision may still point at the old
object. A new file gets a new UUID path.

The database should store a reference, not a long-lived signed URL. Signed URLs expire. The
renderer resolves a private `bucket + path` to a short-lived URL and caches that URL only in
memory.

Recommended media reference shape:

```json
{
  "name": "before-motor.jpg",
  "type": "image/jpeg",
  "size": 182340,
  "bucket": "service-media",
  "path": "cases/CASE-ID/field/ENTRY-ID/UUID.jpg",
  "sha256": "optional checksum",
  "storage": true
}
```

Legacy items keep their existing `{data:"data:..."}` shape. For signature text columns, use a
small versioned string such as `storage://service-media/<path>` so the column stays text while
the shared resolver recognises it. Do not store JSON text in one signature field and a URL in
another.

The customer issue and its LINE request currently contain the same attachment twice. Upload
each file once and put the same immutable reference in both records; do not create two Storage
objects.

## Dual-read and switchable writes

The first code release must change reading before changing writing.

Add one shared compatibility layer with these behaviours:

- `mediaKind(value)` recognises legacy data URLs, current `{data}` objects, new Storage
  references, and offline pending references.
- `mediaSource(value)` returns a data URL/object URL immediately when available, or obtains a
  short-lived signed URL for a Storage reference.
- `mediaBlob(value)` converts a legacy data URL or pending IndexedDB object into a Blob for
  upload.
- `uploadMedia(blob, context)` returns the small reference above and never mutates a business
  record until upload verification succeeds.

Both `index.html` and the standalone `service-case-detail.html` need the same rules. Printing,
QC/service-report previews and lightboxes must also resolve references; checking only the
thumbnail UI would leave printed reports broken.

Use a controlled write mode:

```text
inline   old behaviour; useful only for rollback before any Storage-only record exists
hybrid   read both; new online files go to Storage; offline files enter the outbox
storage  same reader; all new files use Storage/outbox and inline creation is disabled
```

The reader remains dual-format indefinitely. There is no benefit in making an old base64 row
unreadable after migration.

## Offline-first upload outbox

Do not put offline Blobs in `localStorage`; that recreates the same limit under another key.
Use IndexedDB for an `imode-media-outbox` containing the Blob, target record, slot, generated
object path, checksum, attempt count and state.

Offline save sequence:

1. Compress/validate the file exactly as today.
2. Store the Blob in IndexedDB and render it through a temporary object URL.
3. Put a small pending reference (`localId`, name/type/size, `uploadState: pending`) in the
   local business record.
4. Queue the business write behind its media uploads. Do not send pending local IDs to other
   devices as if they were valid cloud files.
5. On `online`, application load, tab visibility, manual sync and normal saves, retry the
   outbox with bounded exponential backoff.
6. Upload to the pre-generated immutable path with overwrite disabled; verify path, size and
   (when available) checksum.
7. Replace the pending reference with the Storage reference, then upsert the latest business
   record and wait for database acknowledgement.
8. Only after both Storage and database succeed may the IndexedDB Blob be deleted.

The flush must be idempotent: retrying the same outbox item uses the same object path and must
recognise an already uploaded matching object. A browser crash between upload and row update
must resume at step 7, not upload a duplicate.

Background Sync cannot be the only trigger because iOS support is inconsistent. The visible
page lifecycle triggers above are required. The UI should show `รออัปโหลด`, `กำลังอัปโหลด`,
`อัปโหลดไม่สำเร็จ` and a retry action, without allowing a pending photo to satisfy a closing
gate on a different device.

## Access control

- Authenticated active staff may upload/read media for records they can access.
- The anonymous Customer Portal must **not** receive broad `storage.objects INSERT/SELECT`
  policies. Before production, it needs an Edge Function or narrow RPC that validates an
  opaque, random machine token and returns a short-lived signed upload/read URL scoped to one
  case/request path.
- The current `QR-<machine id>` token is predictable and is not sufficient authorisation.
- Allow only explicit MIME types and extensions; reject SVG/HTML and executable content.
- Enforce per-file and per-request size limits server-side as well as in the browser.
- Use short signed-URL lifetimes and never persist signed URLs in Supabase rows/localStorage.
- Keep bucket listing closed. Possessing the anon key must not reveal object names.

Storage RLS and any Edge Function belong in reviewed, owner-run files. No migration step may
change the existing Supabase URL/key or expose a service-role credential.

## Migration phases

### Phase 0 — measure and back up

- Enable/verify database backups and export a complete logical backup.
- Count data URLs and bytes by field, including nested field revisions and settings signatures.
- Record the row IDs and checksums so the backfill can be proved complete.
- Confirm the Storage region, retention requirement, file-size limits and expected monthly
  volume with the owner.

### Phase 1 — ship the dual reader only

- Add the resolver to every screen, standalone case page, report renderer and print path.
- Keep writes inline.
- Test mixed fixtures: legacy data URL, Storage reference, pending IndexedDB file, missing
  object and expired signed URL.
- This release becomes the minimum rollback version after Storage writes begin.

### Phase 2 — create the private bucket and policies

- Add owner-reviewed SQL/policies and the customer signed-upload path.
- Test that staff can access an assigned case and that anon cannot list/read arbitrary media.
- Test MIME/size rejection and signed-URL expiry.

### Phase 3 — hybrid writes for a pilot group

- Enable new Storage writes for one or two staff accounts/devices first.
- Run online, airplane-mode, browser-restart, duplicate-retry and second-device tests.
- Observe at least a complete service job: intake photo → field evidence → report → signatures
  → admin view/print → close.

### Phase 4 — idempotent historical backfill

- Run a separate migration utility in small batches. It reads one legacy item, uploads it,
  verifies the object, then replaces only that item with its reference.
- Preserve `fieldStatusLog[].revisions[].media`; never flatten or discard history.
- Reuse one object reference for duplicated case/request attachments.
- Write a checkpoint after every row so interruption resumes safely.
- Never delete the base64 value until the replacement row has been read back and verified.
- Keep a failure report; one bad file must not abort or partially rewrite the rest of a row.

### Phase 5 — Storage-only new writes

- Switch all users to Storage/outbox writes while retaining the dual reader.
- Confirm database and localStorage growth is now metadata-only.
- After an agreed observation period and a fresh backup, remove migrated inline payloads in
  batches. Orphan cleanup comes later and must respect every current/revision reference.

Do not perform a big-bang column rewrite and do not drop existing media columns. They are the
backward-compatible envelope for small references.

## Interaction with `js/72-v70StorageGuardScript.js`

`js/72` currently protects navigation/sign-in from `QuotaExceededError` by stubbing `data`
inside top-level `cases[].media` and `lineRequests[].media` **only after it knows the cloud has
the row**. It does not currently shed field-log media, revisions, report photos/videos or
signatures.

During migration:

- leave `js/72` in place for legacy records;
- Storage references contain no `data`, so `mediaBytes()` naturally counts them as zero and
  does not need to stub them;
- pending offline Blobs live in IndexedDB, outside `saveLocal()`, and must never be deleted by
  shed mode;
- a record is not “cloud safe” merely because its row ID exists: the row must contain the final
  Storage reference and the object must be verified;
- once hybrid mode is stable, extend the diagnostic report to include outbox bytes/count, but
  keep the existing guard as a fallback for old inline media.

The guard is not a migration mechanism. It drops only a device cache copy and assumes the full
data is already in Supabase; it must not be used to remove the last offline Blob.

## Acceptance criteria

- A legacy base64 case/report renders and prints unchanged.
- A new Storage-backed case/report renders on the writer and a second device.
- Airplane-mode attachments survive reload, visibly remain pending, and upload after reconnect.
- Retrying after a crash creates no duplicate object and loses no business edit.
- Field correction history still shows/restores the correct media version.
- `รออะไหล่`, Online and Workshop tagged entries keep their existing behaviour.
- Anonymous users cannot list the bucket or retrieve another customer's object.
- After 50 realistic new cases, localStorage growth is small metadata rather than media bytes.
- A failed/expired signed URL degrades to a clear unavailable/retry state, not a broken page.
- Rollback to the last dual-reader release preserves access to both old and new records.

## Decisions required before implementation

1. Final bucket name and retention/deletion policy.
2. Maximum photo/video/document sizes after compression.
3. Whether anonymous customer uploads use an Edge Function or customers receive real Auth
   identities. Broad anon Storage access is not an option.
4. How long signed read URLs should live and whether customers may download originals.
5. Pilot staff/devices and the observation period before historical cleanup.

No code, bucket or database data should be changed until those decisions are approved.
