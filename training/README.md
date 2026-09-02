# PyTorch image-classification pipeline

The production pipeline uses torchvision MobileNetV3 Small, ImageNet pretrained
weights, and a 23-class classification head. Small is the default because its
accuracy/size trade-off is appropriate for local browser inference; MobileNetV3
Large remains available through `--model mobilenet_v3_large` for comparison.

All commands below work in PowerShell from the repository root.

## Environment and CUDA

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r training\requirements.txt
python -c "import torch; print(torch.__version__); print('CUDA:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

Install the CUDA-enabled PyTorch wheel appropriate for the machine from the
official PyTorch installer when `torch.cuda.is_available()` is unexpectedly
false. Training uses CUDA automatically when available; `--device cpu`,
`--device cuda`, and `--device cuda:0` override automatic selection.

## 1. Prepare independent splits

Reviewed images stay under `training/candidates/<itemId>/`. The folder names
must match all 23 `itemId` values in `classes.json`.

```powershell
python training\prepare_dataset.py
```

The default output is a new `training/data-pytorch` tree:

```text
training/data-pytorch/
  train/<itemId>/*.jpg
  validation/<itemId>/*.jpg
  test/<itemId>/*.jpg
  dataset-summary.json
```

The default is a per-class 70/15/15 split with seed 42. The script uses every
valid unique candidate (`--per-class 0`), rather than the former temporary cap.
It reads only files directly inside the 23 class folders, so `.invalid` and
`_openimages` directories are not entered. It verifies that images decode,
applies existing Open Images bounding boxes when available, and rejects exact
file (SHA-256) and decoded-pixel duplicates globally, including duplicates
across classes. De-duplication happens before seeded splitting, so one source
image cannot enter multiple splits. It refuses to write into a non-empty output
directory and never overwrites `training/data`.

To build a small disposable smoke dataset without touching the production path:

```powershell
python training\prepare_dataset.py --per-class 3 --output training\data-pytorch-smoke
```

## 2. Train with two-stage transfer learning

```powershell
python training\train.py --data-dir training\data-pytorch --epochs 20 --batch-size 32 --lr 0.001 --seed 42 --num-workers 0 --device auto --model mobilenet_v3_small
```

Images are 224x224. Training uses random resized crop, horizontal flip, ±10°
rotation, and modest brightness/contrast/saturation/hue jitter, followed by the
ImageNet mean/std normalization. Validation and test use deterministic
resize-short-edge-to-256, centre-crop-to-224, and the same normalization.

By default, epochs 1–5 freeze the MobileNetV3 feature backbone and train only
the new classification head. Remaining epochs unfreeze the final three feature
blocks and fine-tune at one tenth of the Stage 1 learning rate. Adjust with
`--freeze-epochs`, `--unfreeze-blocks`, and `--fine-tune-lr`. Loss is
`CrossEntropyLoss`; optimization is AdamW.

Checkpoints are written to:

- `training/artifacts/best_model.pth` — highest validation accuracy
- `training/artifacts/final_model.pth` — final requested epoch

Each contains model and optimizer state, epoch, best validation accuracy, class
order, model architecture, input size, and pretrained-weight provenance.

## 3. Evaluate once on the test set

```powershell
python training\evaluate.py --checkpoint training\artifacts\best_model.pth --data-dir training\data-pytorch --device auto
```

The evaluator reads only `data-pytorch/test`. It writes overall accuracy,
per-class precision/recall/F1/support, and the full confusion matrix to
`training/artifacts/evaluation.json`, plus a plotted matrix at
`training/artifacts/confusion_matrix.png`.

## 4. Classify one image

```powershell
python training\inference.py path\to\photo.jpg --checkpoint training\artifacts\best_model.pth --top-k 3 --device auto
```

The JSON output includes the top-1 class/confidence and the requested top-k
ranking.

## 5. Optional ONNX export

The main application now performs inference through the local FastAPI PyTorch
service in `backend/ai_server.py`, which loads `best_model.pth` directly. You
may still export the reviewed best checkpoint to ONNX for an optional browser
deployment or comparison:

```powershell
python training\export_onnx.py --checkpoint training\artifacts\best_model.pth --output public\model\circular-kids.onnx
```

This updates `public/model/metadata.json`, validates the ONNX graph, and compares
a dummy ONNX Runtime forward pass with PyTorch. Legacy ONNX, TensorFlow/Keras,
and TensorFlow.js artifacts are not deleted by any script.

## Smoke-test boundary

For development verification, use only a temporary three-images-per-class
dataset, one mini-batch, one forward pass, and at most one or two optimizer
steps. Do not run a complete epoch or formal training as part of a code change.
