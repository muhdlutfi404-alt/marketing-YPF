# Footage folder (not uploaded to GitHub)

| Folder   | What goes here |
|----------|----------------|
| `raw/`   | Your original MP4/MOV files straight from the phone, GoPro, drone or camera. **Never edited.** |
| `ready/` | Clean copies made by `npm run prepare-footage` (H.264, constant 30 fps, max 1920px). Templates use these. |

Everything in here except this README and the `.gitkeep` files is ignored by Git,
so your large videos stay on your computer and never get pushed to GitHub.

In a template, refer to a clip by its path *inside* `public/`, e.g. `footage/ready/summit-sunrise.mp4`.
