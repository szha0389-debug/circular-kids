"""Train Circular Kids' small CNN from random weights.

No model hub, checkpoint, transfer learning, or pretrained weights are used.
Each immediate child directory of --data-dir is one itemId from classes.json.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLASSES_PATH = Path(__file__).with_name("classes.json")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
IMAGE_SIZE = (128, 128)


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the 23-class Circular Kids CNN")
    parser.add_argument("--data-dir", type=Path, default=Path(__file__).with_name("data"))
    parser.add_argument("--output-dir", type=Path, default=ROOT / "public" / "model")
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--minimum-images", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def load_classes() -> list[dict[str, str]]:
    return json.loads(CLASSES_PATH.read_text(encoding="utf-8"))


def validate_dataset(data_dir: Path, class_ids: list[str], minimum: int) -> None:
    problems: list[str] = []
    for class_id in class_ids:
        folder = data_dir / class_id
        count = (
            sum(1 for path in folder.rglob("*") if path.suffix.lower() in IMAGE_EXTENSIONS)
            if folder.is_dir()
            else 0
        )
        if count < minimum:
            problems.append(f"{class_id}: {count} images (need at least {minimum})")

    unexpected = sorted(
        path.name for path in data_dir.iterdir() if path.is_dir() and path.name not in class_ids
    ) if data_dir.is_dir() else []
    if unexpected:
        problems.append("unexpected class folders: " + ", ".join(unexpected))

    if problems:
        raise SystemExit("Dataset validation failed:\n- " + "\n- ".join(problems))


def make_model(class_count: int):
    import tensorflow as tf

    # This entire network starts with random parameters. Only standard layers
    # are kept here so the trained model converts cleanly to TensorFlow.js.
    return tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(*IMAGE_SIZE, 3)),
            tf.keras.layers.Rescaling(1.0 / 255),
            tf.keras.layers.Conv2D(16, 3, padding="same", activation="relu"),
            tf.keras.layers.MaxPooling2D(),
            tf.keras.layers.Conv2D(32, 3, padding="same", activation="relu"),
            tf.keras.layers.MaxPooling2D(),
            tf.keras.layers.Conv2D(64, 3, padding="same", activation="relu"),
            tf.keras.layers.MaxPooling2D(),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(class_count, activation="softmax"),
        ],
        name="circular_kids_cnn",
    )


def main() -> None:
    args = arguments()
    classes = load_classes()
    class_ids = [entry["itemId"] for entry in classes]
    validate_dataset(args.data_dir, class_ids, args.minimum_images)

    import tensorflow as tf
    tf.keras.utils.set_random_seed(args.seed)

    # tensorflowjs imports TensorFlow Decision Forests even when converting a
    # plain Keras CNN. TF-DF has no Windows binary, so provide an unused module
    # placeholder on Windows. This does not alter training or model layers.
    if os.name == "nt":
        sys.modules.setdefault(
            "tensorflow_decision_forests",
            types.ModuleType("tensorflow_decision_forests"),
        )
    import tensorflowjs as tfjs

    common = dict(
        directory=args.data_dir,
        labels="inferred",
        label_mode="int",
        class_names=class_ids,
        validation_split=0.2,
        seed=args.seed,
        image_size=IMAGE_SIZE,
        batch_size=args.batch_size,
    )
    train_data = tf.keras.utils.image_dataset_from_directory(subset="training", **common)
    validation_data = tf.keras.utils.image_dataset_from_directory(subset="validation", **common)
    autotune = tf.data.AUTOTUNE
    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal", seed=args.seed),
            tf.keras.layers.RandomRotation(0.05, seed=args.seed + 1),
            tf.keras.layers.RandomZoom(0.1, seed=args.seed + 2),
        ]
    )
    train_data = train_data.map(
        lambda images, labels: (augmentation(images, training=True), labels),
        num_parallel_calls=autotune,
    ).prefetch(autotune)
    validation_data = validation_data.prefetch(autotune)

    model = make_model(len(classes))
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()
    best_weights_path = ROOT / "training" / "artifacts" / "best.weights.h5"
    best_weights_path.parent.mkdir(parents=True, exist_ok=True)
    model.fit(
        train_data,
        validation_data=validation_data,
        epochs=args.epochs,
        callbacks=[
            tf.keras.callbacks.ModelCheckpoint(
                best_weights_path,
                monitor="val_accuracy",
                mode="max",
                save_best_only=True,
                save_weights_only=True,
            ),
            tf.keras.callbacks.EarlyStopping(
                monitor="val_accuracy", mode="max", patience=8, restore_best_weights=True
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss", factor=0.5, patience=2, min_lr=0.00005
            ),
        ],
    )
    # ModelCheckpoint also covers the case where the requested epoch limit is
    # reached before EarlyStopping fires.
    model.load_weights(best_weights_path)
    loss, accuracy = model.evaluate(validation_data, verbose=0)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    keras_path = ROOT / "training" / "artifacts" / "circular-kids.keras"
    keras_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(keras_path)
    for old_model_file in (
        list(args.output_dir.glob("group*.bin"))
        + list(args.output_dir.glob("model.json"))
        + list(args.output_dir.glob("metadata.json"))
    ):
        old_model_file.unlink()
    tfjs.converters.save_keras_model(model, args.output_dir)
    metadata = {
        "classes": classes,
        "inputSize": IMAGE_SIZE[0],
        "validationAccuracy": accuracy,
        "validationLoss": loss,
        "trainedFromRandomWeights": True,
        "seed": args.seed,
    }
    (args.output_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    print(f"Saved browser model to {args.output_dir}")
    print(f"Validation accuracy: {accuracy:.4f}")


if __name__ == "__main__":
    main()
