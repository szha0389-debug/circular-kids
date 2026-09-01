"""Evaluate the trained CNN with the same deterministic validation split."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, default=Path("training/artifacts/circular-kids.keras"))
    parser.add_argument("--data", type=Path, default=Path("training/data"))
    args = parser.parse_args()
    classes = json.loads(Path("training/classes.json").read_text(encoding="utf-8"))
    class_ids = [entry["itemId"] for entry in classes]
    dataset = tf.keras.utils.image_dataset_from_directory(
        args.data,
        labels="inferred",
        label_mode="int",
        class_names=class_ids,
        validation_split=0.2,
        subset="validation",
        seed=42,
        image_size=(128, 128),
        batch_size=32,
    )
    model = tf.keras.models.load_model(args.model)
    probability_batches = []
    label_batches = []
    for images, batch_labels in dataset:
        probability_batches.append(model(images, training=False).numpy())
        label_batches.append(batch_labels.numpy())
    probabilities = np.concatenate(probability_batches)
    labels = np.concatenate(label_batches)
    ranking = np.argsort(probabilities, axis=1)[:, ::-1]
    predictions = ranking[:, 0]
    correct = predictions == labels
    top_confidence = probabilities.max(axis=1)
    top_margin = probabilities[np.arange(len(labels)), ranking[:, 0]] - probabilities[
        np.arange(len(labels)), ranking[:, 1]
    ]
    confidence_bands = {}
    for threshold in (0.2, 0.3, 0.4, 0.5, 0.6):
        accepted = (top_confidence >= threshold) & (top_margin >= 0.05)
        confidence_bands[str(threshold)] = {
            "coverage": float(accepted.mean()),
            "accuracyWhenAccepted": float(correct[accepted].mean()) if accepted.any() else None,
        }
    per_class = {}
    for index, class_id in enumerate(class_ids):
        mask = labels == index
        per_class[class_id] = {
            "samples": int(mask.sum()),
            "top1Accuracy": float(correct[mask].mean()) if mask.any() else 0.0,
        }
    result = {
        "samples": int(len(labels)),
        "top1Accuracy": float(correct.mean()),
        "top3Accuracy": float(np.any(ranking[:, :3] == labels[:, None], axis=1).mean()),
        "top5Accuracy": float(np.any(ranking[:, :5] == labels[:, None], axis=1).mean()),
        "meanTopConfidence": float(probabilities.max(axis=1).mean()),
        "confidenceBands": confidence_bands,
        "perClass": per_class,
    }
    output = Path("training/artifacts/evaluation.json")
    output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
