"""Export a trained PyTorch MobileNetV3 checkpoint for onnxruntime-web."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch

from pytorch_model import IMAGENET_MEAN, IMAGENET_STD, load_checkpoint

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Export checkpoint to ONNX")
    parser.add_argument("--checkpoint", type=Path, default=ROOT / "training" / "artifacts" / "best_model.pth")
    parser.add_argument("--output", type=Path, default=ROOT / "public" / "model" / "circular-kids.onnx")
    parser.add_argument("--metadata", type=Path, default=ROOT / "public" / "model" / "metadata.json")
    parser.add_argument("--opset", type=int, default=17)
    args = parser.parse_args()
    model, checkpoint = load_checkpoint(args.checkpoint, torch.device("cpu"))
    input_size = checkpoint["input_size"]
    dummy = torch.randn(1, 3, input_size, input_size)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(model, dummy, args.output, input_names=["images"], output_names=["logits"],
                      dynamic_axes={"images": {0: "batch"}, "logits": {0: "batch"}},
                      opset_version=args.opset, do_constant_folding=True, dynamo=False)
    onnx.checker.check_model(onnx.load(args.output))
    expected = model(dummy).detach().numpy()
    actual = ort.InferenceSession(str(args.output), providers=["CPUExecutionProvider"]).run(
        ["logits"], {"images": dummy.numpy()})[0]
    if actual.shape != expected.shape or not np.allclose(actual, expected, rtol=1e-3, atol=1e-4):
        raise RuntimeError("ONNX Runtime verification did not match PyTorch output")
    classes_by_id = {entry["itemId"]: entry for entry in json.loads(
        (ROOT / "training" / "classes.json").read_text(encoding="utf-8"))}
    metadata = {
        "classes": [classes_by_id[name] for name in checkpoint["class_names"]],
        "model": checkpoint["model_architecture"], "format": "ONNX",
        "inputSize": input_size, "resizeSize": 256, "inputLayout": "NCHW",
        "inputName": "images", "outputName": "logits",
        "normalization": {"mean": IMAGENET_MEAN, "std": IMAGENET_STD},
        "pretrainedWeights": checkpoint.get("pretrained_weights", "ImageNet"),
        "bestValidationAccuracy": checkpoint["best_val_accuracy"],
    }
    args.metadata.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Exported {args.output}")
    print(f"Updated {args.metadata}")
    print("ONNX checker and ONNX Runtime dummy inference passed")


if __name__ == "__main__":
    main()
