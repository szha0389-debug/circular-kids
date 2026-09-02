"""Shared MobileNetV3 model, data and checkpoint utilities."""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Callable

import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.utils.data import Dataset
from torchvision import models, transforms

CLASSES_PATH = Path(__file__).with_name("classes.json")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
INPUT_SIZE = 224
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)
MODEL_NAMES = ("mobilenet_v3_small", "mobilenet_v3_large")


def load_classes() -> list[dict[str, str]]:
    return json.loads(CLASSES_PATH.read_text(encoding="utf-8"))


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def resolve_device(requested: str) -> torch.device:
    if requested == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    device = torch.device(requested)
    if device.type == "cuda" and not torch.cuda.is_available():
        raise SystemExit("CUDA was requested but torch.cuda.is_available() is False")
    return device


def build_model(model_name: str, class_count: int, pretrained: bool = True) -> nn.Module:
    if model_name == "mobilenet_v3_small":
        weights = models.MobileNet_V3_Small_Weights.IMAGENET1K_V1 if pretrained else None
        model = models.mobilenet_v3_small(weights=weights)
    elif model_name == "mobilenet_v3_large":
        weights = models.MobileNet_V3_Large_Weights.IMAGENET1K_V2 if pretrained else None
        model = models.mobilenet_v3_large(weights=weights)
    else:
        raise ValueError(f"Unsupported model: {model_name}")
    model.classifier[-1] = nn.Linear(model.classifier[-1].in_features, class_count)
    return model


def train_transform() -> Callable:
    return transforms.Compose([
        transforms.RandomResizedCrop(INPUT_SIZE, scale=(0.70, 1.0), ratio=(0.80, 1.25)),
        transforms.RandomHorizontalFlip(), transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.20, contrast=0.20, saturation=0.15, hue=0.03),
        transforms.ToTensor(), transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])


def eval_transform() -> Callable:
    return transforms.Compose([
        transforms.Resize(256, interpolation=transforms.InterpolationMode.BILINEAR),
        transforms.CenterCrop(INPUT_SIZE), transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])


class ClassFolderDataset(Dataset):
    """Folder dataset whose label order follows classes.json rather than alphabetic order."""
    def __init__(self, split_dir: Path, class_names: list[str], transform: Callable):
        self.transform = transform
        self.samples: list[tuple[Path, int]] = []
        missing: list[str] = []
        for class_index, class_name in enumerate(class_names):
            class_dir = split_dir / class_name
            if not class_dir.is_dir():
                missing.append(class_name)
                continue
            paths = sorted(path for path in class_dir.iterdir()
                           if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS)
            if not paths:
                missing.append(class_name)
            self.samples.extend((path, class_index) for path in paths)
        if missing:
            raise ValueError(f"Missing or empty classes under {split_dir}: {', '.join(missing)}")

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int]:
        path, label = self.samples[index]
        with Image.open(path) as opened:
            image = opened.convert("RGB")
        return self.transform(image), label


def load_checkpoint(path: Path, device: torch.device) -> tuple[nn.Module, dict]:
    checkpoint = torch.load(path, map_location=device, weights_only=False)
    model = build_model(checkpoint["model_architecture"], len(checkpoint["class_names"]), pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device).eval()
    return model, checkpoint


def predict_image(
    model: nn.Module,
    class_names: list[str],
    image: Image.Image,
    device: torch.device,
    top_k: int = 3,
) -> list[dict[str, float | str]]:
    """Return softmax-ranked predictions using evaluation-time preprocessing."""
    if not 1 <= top_k <= len(class_names):
        raise ValueError(f"top_k must be between 1 and {len(class_names)}")
    batch = eval_transform()(image.convert("RGB")).unsqueeze(0).to(device)
    with torch.inference_mode():
        probabilities = model(batch).softmax(dim=1)[0]
        values, indices = probabilities.topk(top_k)
    return [
        {"itemId": class_names[index], "confidence": float(value)}
        for value, index in zip(values.cpu().tolist(), indices.cpu().tolist())
    ]
