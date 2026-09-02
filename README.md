# Circular Kids — Epic 1

**Investigate Before I Throw It Away.** A child opens a case on an item that seems
broken, sees what is still good about it, pins down what actually failed, answers a
few clues, and reaches their own verdict — before the site offers one.

Vue 3 + Vite + Bootstrap 5 on the front, one shared rules module on the back.

## Image recognition

Image recognition uses ImageNet-pretrained MobileNetV3 Small with a 23-class
classification head. A small local FastAPI service loads the trained PyTorch
checkpoint once and performs inference in memory; the browser sends the selected
photo to the same local machine and keeps the existing manual-choice fallback if
the service is unavailable.

For local development, start the AI service in one PowerShell terminal:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.ai_server:app --host 127.0.0.1 --port 8000
```

Then start the existing Node API and Vite frontend in another:

```powershell
npm run dev
```

The existing Node API proxies `/api/image-recognition` and `/api/ai/health` to
the local Python service, so Vite and production both retain same-origin API
requests. The ONNX and legacy TensorFlow.js artifacts remain available, but are
not used by the main recognition path.

Labelled training photos and generated weights are intentionally gitignored.
See `training/README.md` for the dataset sources, folder structure, and training command.
