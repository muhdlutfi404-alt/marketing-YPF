# Mobile upload — feasibility test (17 Nov 2026)

Upload page (private): https://claude.ai/artifact/K795iYzCCeQQhmXxA5xjdb · source: `tools/studio-upload/index.html`

## Part 1 — storage & retrieval (run by Claude) ✅ PASSED
| Check | Result |
|---|---|
| Real clip | `lv_0_20261116225603.mp4`, 99,899,572 bytes (1080×1916, 92.5 s, H.264/AAC) |
| Split | 7 pieces × 15 MiB, each with a 16-byte `YPFC` header + SHA-256 per piece |
| Stored on claude.ai | 7/7 accepted as `video/mp4` assets |
| Downloaded back | 7/7, every piece fingerprint MATCH |
| Reassembled | 99,899,572 bytes, whole-file SHA-256 identical, `cmp` byte-for-byte identical, plays with 0 decode errors |
| Record | clip document saved and read back (project `frozen-uploads`) |

## Limits measured
- **1 GiB (1,073,741,824 bytes) of storage per upload page**, max 5,000 files per page.
- 20 MiB max per stored file (pieces are 15 MiB).
- Files persist with the page (deleted only if the page is deleted); independent of the cloud session.
- Retrieval: one download call per piece (≈1–2 s each).

## Part 2 — phone upload (run by the owner) ⏳ PENDING
1. Multi-select 10–30 clips from the Android gallery.
2. Per-file progress and speed.
3. Interrupt (airplane mode 10 s) → resumes; re-choose a file → finished pieces skipped.
4. One large 4K clip (stay under the page's free space).
