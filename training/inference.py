"""Run top-k prediction for one image using a PyTorch checkpoint."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import torch
from PIL import Image

from pytorch_model import load_checkpoint, predict_image, resolve_device

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Classify one image")
    parser.add_argument("image", type=Path)
    parser.add_argument("--checkpoint", type=Path, default=ROOT / "training" / "artifacts" / "best_model.pth")
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--device", default="auto")
    args = parser.parse_args()
    device = resolve_device(args.device)
    model, checkpoint = load_checkpoint(args.checkpoint, device)
    if not 1 <= args.top_k <= len(checkpoint["class_names"]):
        raise SystemExit(f"--top-k must be between 1 and {len(checkpoint['class_names'])}")
    with Image.open(args.image) as opened:
        predictions = predict_image(
            model, checkpoint["class_names"], opened, device, top_k=args.top_k
        )
    print(json.dumps({"top1": predictions[0], "top_k": predictions}, indent=2))


if __name__ == "__main__":
    main()
