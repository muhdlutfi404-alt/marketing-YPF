#!/usr/bin/env python3
"""
GENERATE BACKGROUND PLATES — AI-generated SUPPORTING visuals only (environments, atmospheres).
    .venv-gen/bin/python scripts/story/generate-plates.py <project> [--only name] [--seed N]
Plates are defined in src/edits/<project>/plates.json: {"name": {"prompt": "...", "seed": 7}}
Every prompt is forced to exclude people, faces, food, meat, products, text and logos.
Each image is recorded in public/generated/<project>/manifest.json (prompt, seed, model, licence)
with "reviewed": false. Claude/the owner must look at each image and set reviewed=true before the
safety check lets it into an export.
Model: Stable Diffusion 1.5 (CreativeML OpenRAIL-M — commercial use allowed under its use restrictions).
"""
import json, sys, time
from pathlib import Path
import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler

ROOT = Path(__file__).resolve().parents[2]
MODEL = "stable-diffusion-v1-5/stable-diffusion-v1-5"
NEG = ("people, person, man, woman, face, hands, body, crowd, food, meat, dish, product, package, box, bottle, "
       "text, letters, watermark, logo, signage, brand, lowres, blurry, deformed, jpeg artifacts")

def main():
    project = sys.argv[1]
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    seed_override = int(sys.argv[sys.argv.index("--seed") + 1]) if "--seed" in sys.argv else None
    plates = json.loads((ROOT / "src/edits" / project / "plates.json").read_text())
    out_dir = ROOT / "public/generated" / project
    out_dir.mkdir(parents=True, exist_ok=True)
    man_path = out_dir / "manifest.json"
    manifest = json.loads(man_path.read_text()) if man_path.exists() else {}
    pipe = StableDiffusionPipeline.from_pretrained(MODEL, variant="fp16", torch_dtype=torch.float32,
            cache_dir=str(ROOT / ".models/hf"), safety_checker=None, requires_safety_checker=False)
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config, use_karras_sigmas=True)
    pipe.set_progress_bar_config(disable=True)
    for name, spec in plates.items():
        if only and name != only:
            continue
        seed = seed_override if seed_override is not None else spec.get("seed", 7)
        t = time.time()
        img = pipe(spec["prompt"] + ", no people, empty scene", negative_prompt=NEG, width=512, height=896,
                   num_inference_steps=spec.get("steps", 24), guidance_scale=spec.get("cfg", 7.0),
                   generator=torch.Generator().manual_seed(seed)).images[0]
        f = out_dir / f"{name}.png"
        img.save(f)
        manifest[name] = {"file": f"generated/{project}/{name}.png", "prompt": spec["prompt"], "negative": NEG,
                          "seed": seed, "model": MODEL, "license": "CreativeML OpenRAIL-M",
                          "kind": "AI-generated background (supporting visual, not real footage)",
                          "created": time.strftime("%Y-%m-%dT%H:%M:%S"), "reviewed": False}
        man_path.write_text(json.dumps(manifest, indent=1) + "\n")
        print(f"✓ {name} (seed {seed}) {time.time() - t:.0f}s", flush=True)

if __name__ == "__main__":
    main()
