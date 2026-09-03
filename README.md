# Circular Kids — Epic 1

**Investigate Before I Throw It Away.** A child opens a case on an item that seems
broken, sees what is still good about it, pins down what actually failed, answers a
few clues, and reaches their own verdict — before the site offers one.

Vue 3 + Vite + Bootstrap 5 on the front, one shared rules module on the back.

## Image recognition

Image recognition uses ImageNet-pretrained MobileNetV3 Small with a 23-class
classification head. FastAPI loads the trained PyTorch checkpoint once and
performs inference in memory; the browser uses a same-origin endpoint and keeps
the existing manual-choice fallback if the service is unavailable.

For local development, start the AI service in one PowerShell terminal:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.ai_server:app --host 127.0.0.1 --port 8000
```

Then start the existing Node API and Vite frontend in another:

```powershell
npm run dev
```

During local development, the Node API proxies `/api/image-recognition` and
`/api/ai/health` to `http://127.0.0.1:8000`. The ONNX and legacy TensorFlow.js
artifacts remain available, but are not used by the main recognition path.

Labelled training photos and non-production weights are intentionally
gitignored. `training/artifacts/best_model.pth` is the only checkpoint included
in deployments. See `training/README.md` for the dataset sources, folder
structure, and training command.

## Vercel production

The project uses three Vercel Services so the Vite frontend, existing JavaScript
API Functions, and containerized FastAPI service deploy atomically under one domain.
In the Vercel project's Build and Deployment settings, set **Framework Preset**
to **Services**. No `AI_INFERENCE_URL` is required in production.

Top-level service routing sends `/api/image-recognition` and `/api/ai/health`
directly to the `ai` container. All other `/api/*` requests go to a dedicated
Node service that deploys the existing file-based Functions under `api/`, while
browser routes remain owned by the Vite-only frontend service.
The AI container installs CPU-only PyTorch and listens on Vercel's `PORT`.
