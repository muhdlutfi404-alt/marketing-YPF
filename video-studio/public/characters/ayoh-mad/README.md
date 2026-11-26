# AYOH MAD CHARACTER ASSETS

Reusable character assets for all YaPakCik Frozen animation projects.

| Folder | What goes here |
|---|---|
| `00-master/master.png` | The approved MASTER CHARACTER REFERENCE. Never edited, never replaced without the owner's approval. |
| `02-review/` | New pose images waiting for the consistency check. Not usable in videos yet. |
| `01-poses-approved/` | Poses that passed the check AND were approved by the owner. Only these are used in videos. |
| `03-rejected/` | Poses that failed the check (kept with the reason, so the same mistake is not repeated). |

Rules: see `CHARACTER.md` (locked identity, logo rule, honesty). Pose briefs: `POSES.md`. Review results: `REVIEW-LOG.md`.

## Workflow for a new pose
1. Generate the pose in the owner's image tool with `00-master/master.png` attached and the prompt from `POSES.md`.
2. Upload it to the Drive folder → it is copied into `02-review/` as `pose-0N-<name>-vK.png`.
3. Consistency check against the master (face, hair, facial hair, outfit/logo, style, no AI signboard) → result written to `REVIEW-LOG.md` with a side-by-side check image.
4. Owner approves → moved to `01-poses-approved/`. Fails → `03-rejected/` with the reason, and a corrected prompt is suggested.
