# Circular Kids

**Investigate Before I Throw It Away.** A child opens a case on an item that seems
broken, checks its condition and safety boundary, compares circular futures, and
can follow what may happen next without the site making the decision for them.

Vue 3 + Vite + Bootstrap 5 on the front, one shared rules module on the back.

## Iteration 3

- **Epic 5 — Follow My Item's Journey:** a short, safety-aware simulation follows
  the selected future and lets the child replay another option already allowed by
  the Epic 2 boundary. Outcomes are described as possible, never as live tracking.
- **Epic 6 — My Rescue Shelf:** optional on-device item stories can be saved,
  updated, grouped, deleted or cleared without an account. Only the item, noticed
  problem, safety boundary, chosen future and later outcome are retained; session
  photos and free-text personal details are never stored.

Run `npm test` for the shared Epic 1–6 rules and `npm run build` for a production
client build.

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
