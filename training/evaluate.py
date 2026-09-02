"""Evaluate a PyTorch checkpoint once on the independent test split."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import torch
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from torch.utils.data import DataLoader

from pytorch_model import ClassFolderDataset, eval_transform, load_checkpoint, resolve_device

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate on data-pytorch/test only")
    parser.add_argument("--checkpoint", type=Path, default=ROOT / "training" / "artifacts" / "best_model.pth")
    parser.add_argument("--data-dir", type=Path, default=ROOT / "training" / "data-pytorch")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "training" / "artifacts")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--device", default="auto")
    args = parser.parse_args()
    device = resolve_device(args.device)
    model, checkpoint = load_checkpoint(args.checkpoint, device)
    class_names = checkpoint["class_names"]
    dataset = ClassFolderDataset(args.data_dir / "test", class_names, eval_transform())
    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=False,
                        num_workers=args.num_workers, pin_memory=device.type == "cuda",
                        persistent_workers=args.num_workers > 0)
    labels: list[int] = []
    predictions: list[int] = []
    with torch.inference_mode():
        for images, batch_labels in loader:
            predicted = model(images.to(device)).argmax(dim=1).cpu()
            labels.extend(batch_labels.tolist())
            predictions.extend(predicted.tolist())
    indices = list(range(len(class_names)))
    precision, recall, f1, support = precision_recall_fscore_support(
        labels, predictions, labels=indices, zero_division=0)
    matrix = confusion_matrix(labels, predictions, labels=indices)
    result = {
        "checkpoint": str(args.checkpoint), "split": "test", "samples": len(labels),
        "overall_accuracy": float(accuracy_score(labels, predictions)),
        "per_class": {name: {"precision": float(precision[i]), "recall": float(recall[i]),
                             "f1": float(f1[i]), "support": int(support[i])}
                      for i, name in enumerate(class_names)},
        "confusion_matrix": matrix.tolist(), "class_names": class_names,
    }
    args.output_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.output_dir / "evaluation.json"
    json_path.write_text(json.dumps(result, indent=2), encoding="utf-8")
    figure_size = max(10, len(class_names) * 0.55)
    fig, ax = plt.subplots(figsize=(figure_size, figure_size))
    image = ax.imshow(matrix, interpolation="nearest", cmap="Blues")
    fig.colorbar(image, ax=ax, fraction=0.046, pad=0.04)
    ax.set(xticks=indices, yticks=indices, xticklabels=class_names, yticklabels=class_names,
           xlabel="Predicted label", ylabel="True label", title="Test confusion matrix")
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")
    fig.tight_layout()
    figure_path = args.output_dir / "confusion_matrix.png"
    fig.savefig(figure_path, dpi=180)
    plt.close(fig)
    print(json.dumps(result, indent=2))
    print(f"Saved {json_path} and {figure_path}")


if __name__ == "__main__":
    main()
