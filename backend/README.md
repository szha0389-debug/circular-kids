# Independent AI inference backend

This service exposes the existing image-recognition API without the Vite or Node
application. It loads the PyTorch checkpoint once during FastAPI startup.

## Required files

- `backend/ai_server.py`
- `backend/requirements-inference.txt`
- `training/pytorch_model.py`
- `training/classes.json`
- `training/artifacts/best_model.pth`

## Run on a new CPU-only Linux environment

From the repository root:

```sh
python -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements-inference.txt
AI_DEVICE=cpu python -m uvicorn backend.ai_server:app --host 0.0.0.0 --port "${PORT:-8000}"
```

`AI_DEVICE` defaults to `auto`, which uses CUDA when available and otherwise
falls back to CPU. Production CPU deployments should set `AI_DEVICE=cpu`
explicitly.

## Run as a container

The repository ignore rules keep other training artifacts out of Git while
explicitly allowing `training/artifacts/best_model.pth`. Ensure that file is
present in the checkout and Docker build context.

```sh
docker build -f Dockerfile.ai -t circular-kids-ai .
docker run --rm -p 8000:8000 -e PORT=8000 circular-kids-ai
```

## API

- `GET /api/ai/health`
- `POST /api/image-recognition`

The upload field is named `image` and accepts JPEG, PNG, or WebP files smaller
than 6 MB.
