# Trained model output

`training/export_onnx.py` writes `circular-kids.onnx` and `metadata.json` here
after PyTorch training. These files are retained for optional browser deployment
or comparison. The main Vue recognition path now calls the local FastAPI PyTorch
service, which loads `training/artifacts/best_model.pth` directly.

The older TensorFlow.js `model.json` and `group*.bin` files are retained as
legacy artifacts until a trained ONNX replacement has been reviewed.
