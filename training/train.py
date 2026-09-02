"""Two-stage transfer learning for the 23-class Circular Kids classifier."""

from __future__ import annotations

import argparse
from pathlib import Path

import torch
from torch import nn
from torch.optim import AdamW
from torch.utils.data import DataLoader

from pytorch_model import (INPUT_SIZE, MODEL_NAMES, ClassFolderDataset, build_model,
                           eval_transform, load_classes, resolve_device, seed_everything,
                           train_transform)

ROOT = Path(__file__).resolve().parents[1]


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train ImageNet-pretrained MobileNetV3")
    parser.add_argument("--data-dir", type=Path, default=ROOT / "training" / "data-pytorch")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "training" / "artifacts")
    parser.add_argument("--epochs", type=int, default=20, help="Total epochs across both stages")
    parser.add_argument("--freeze-epochs", type=int, default=5, help="Stage 1 head-only epochs")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3, help="Stage 1 learning rate")
    parser.add_argument("--fine-tune-lr", type=float, default=None, help="Default: --lr / 10")
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--num-workers", type=int, default=0)
    parser.add_argument("--device", default="auto", help="auto, cpu, cuda, or cuda:N")
    parser.add_argument("--model", choices=MODEL_NAMES, default="mobilenet_v3_small")
    parser.add_argument("--unfreeze-blocks", type=int, default=3)
    return parser.parse_args()


def set_stage(model: nn.Module, fine_tune: bool, unfreeze_blocks: int) -> None:
    for parameter in model.parameters():
        parameter.requires_grad = False
    for parameter in model.classifier.parameters():
        parameter.requires_grad = True
    if fine_tune:
        for block in model.features[-unfreeze_blocks:]:
            for parameter in block.parameters():
                parameter.requires_grad = True


def run_epoch(model: nn.Module, loader: DataLoader, criterion: nn.Module,
              device: torch.device, optimizer: AdamW | None = None) -> tuple[float, float]:
    training = optimizer is not None
    model.train(training)
    if training:
        # Frozen BatchNorm buffers must not drift while their blocks are frozen.
        for block in model.features:
            if not any(parameter.requires_grad for parameter in block.parameters()):
                block.eval()
    total_loss = correct = total = 0
    context = torch.enable_grad() if training else torch.inference_mode()
    with context:
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            if training:
                optimizer.zero_grad(set_to_none=True)
            logits = model(images)
            loss = criterion(logits, labels)
            if training:
                loss.backward()
                optimizer.step()
            total_loss += loss.item() * labels.size(0)
            correct += (logits.argmax(dim=1) == labels).sum().item()
            total += labels.size(0)
    return total_loss / total, correct / total


def checkpoint_payload(model: nn.Module, optimizer: AdamW, epoch: int,
                       best_val_accuracy: float, class_names: list[str], model_name: str) -> dict:
    return {"model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(), "epoch": epoch,
            "best_val_accuracy": best_val_accuracy, "class_names": class_names,
            "model_architecture": model_name, "input_size": INPUT_SIZE,
            "pretrained_weights": "ImageNet"}


def main() -> None:
    args = arguments()
    if args.epochs < 1 or not 0 <= args.freeze_epochs <= args.epochs:
        raise SystemExit("Require --epochs >= 1 and 0 <= --freeze-epochs <= --epochs")
    if args.unfreeze_blocks < 1:
        raise SystemExit("--unfreeze-blocks must be at least 1")
    seed_everything(args.seed)
    device = resolve_device(args.device)
    class_names = [entry["itemId"] for entry in load_classes()]
    train_dataset = ClassFolderDataset(args.data_dir / "train", class_names, train_transform())
    val_dataset = ClassFolderDataset(args.data_dir / "validation", class_names, eval_transform())
    generator = torch.Generator().manual_seed(args.seed)
    loader_options = dict(batch_size=args.batch_size, num_workers=args.num_workers,
                          pin_memory=device.type == "cuda", persistent_workers=args.num_workers > 0)
    train_loader = DataLoader(train_dataset, shuffle=True, generator=generator, **loader_options)
    val_loader = DataLoader(val_dataset, shuffle=False, **loader_options)
    print(f"Device: {device}")
    if device.type == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(device)}")
    print(f"Model: {args.model}; train={len(train_dataset)} val={len(val_dataset)}")
    print("Loading torchvision ImageNet pretrained weights...")
    model = build_model(args.model, len(class_names), pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    best_path, final_path = args.output_dir / "best_model.pth", args.output_dir / "final_model.pth"
    best_accuracy, optimizer = -1.0, None
    for epoch_index in range(args.epochs):
        fine_tune = epoch_index >= args.freeze_epochs
        if optimizer is None or epoch_index == args.freeze_epochs:
            set_stage(model, fine_tune, args.unfreeze_blocks)
            stage_lr = (args.fine_tune_lr or args.lr / 10) if fine_tune else args.lr
            optimizer = AdamW((p for p in model.parameters() if p.requires_grad),
                              lr=stage_lr, weight_decay=args.weight_decay)
            print(f"Starting stage {'2 (fine-tune)' if fine_tune else '1 (head only)'}, lr={stage_lr:g}")
        train_loss, train_accuracy = run_epoch(model, train_loader, criterion, device, optimizer)
        val_loss, val_accuracy = run_epoch(model, val_loader, criterion, device)
        print(f"Epoch {epoch_index + 1}/{args.epochs}: train loss={train_loss:.4f} "
              f"acc={train_accuracy:.4f}; val loss={val_loss:.4f} acc={val_accuracy:.4f}")
        if val_accuracy > best_accuracy:
            best_accuracy = val_accuracy
            torch.save(checkpoint_payload(model, optimizer, epoch_index + 1, best_accuracy,
                                          class_names, args.model), best_path)
    torch.save(checkpoint_payload(model, optimizer, args.epochs, best_accuracy,
                                  class_names, args.model), final_path)
    print(f"Saved best checkpoint to {best_path}")
    print(f"Saved final checkpoint to {final_path}")


if __name__ == "__main__":
    main()
