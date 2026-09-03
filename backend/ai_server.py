"""In-memory PyTorch image-recognition API for the local application."""

from __future__ import annotations

from contextlib import asynccontextmanager
from io import BytesIO
import logging
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

from training.pytorch_model import load_checkpoint, load_classes, predict_image, resolve_device


ROOT = Path(__file__).resolve().parents[1]
CHECKPOINT_PATH = ROOT / "training" / "artifacts" / "best_model.pth"
MAX_IMAGE_BYTES = 4_000_000
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
logger = logging.getLogger("circular_kids.ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = None
    app.state.device = resolve_device("auto")
    app.state.class_names = []
    app.state.classes_by_id = {}
    app.state.model_error = None
    try:
        classes = load_classes()
        classes_by_id = {entry["itemId"]: entry for entry in classes}
        model, checkpoint = load_checkpoint(CHECKPOINT_PATH, app.state.device)
        class_names = checkpoint["class_names"]
        if len(class_names) != 23 or set(class_names) != set(classes_by_id):
            raise RuntimeError("Checkpoint class mapping does not match training/classes.json")
        app.state.model = model
        app.state.class_names = class_names
        app.state.classes_by_id = classes_by_id
        logger.info("AI model loaded")
        logger.info("Model: %s", checkpoint["model_architecture"])
        logger.info("Classes: %d", len(class_names))
        logger.info("AI inference device: %s", app.state.device)
    except Exception as error:  # Keep health available so startup faults are diagnosable.
        app.state.model_error = str(error)
        logger.exception("AI model failed to load")
    yield


app = FastAPI(title="Circular Kids AI inference", lifespan=lifespan)


def require_model() -> None:
    if app.state.model is None:
        raise HTTPException(status_code=503, detail="The image-recognition model is unavailable.")


def decode_image(payload: bytes) -> Image.Image:
    try:
        with Image.open(BytesIO(payload)) as opened:
            opened.verify()
        with Image.open(BytesIO(payload)) as opened:
            return opened.convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as error:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.") from error


@app.get("/api/ai/health")
def health() -> JSONResponse:
    loaded = app.state.model is not None
    body = {
        "status": "ok" if loaded else "unavailable",
        "modelLoaded": loaded,
        "device": str(app.state.device),
        "classes": len(app.state.class_names),
    }
    return JSONResponse(status_code=200 if loaded else 503, content=body)


@app.post("/api/image-recognition")
async def image_recognition(image: UploadFile = File(...)) -> dict:
    require_model()
    suffix = Path(image.filename or "").suffix.lower()
    if image.content_type not in ALLOWED_MIME_TYPES or suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=400, detail="Use a JPEG, PNG, or WebP image.")
    payload = await image.read(MAX_IMAGE_BYTES + 1)
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(payload) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Use an image smaller than 4 MB.")
    decoded = decode_image(payload)
    try:
        predictions = predict_image(
            app.state.model, app.state.class_names, decoded, app.state.device, top_k=3
        )
    except Exception as error:
        logger.exception("Image-recognition inference failed")
        raise HTTPException(status_code=500, detail="Image recognition could not complete.") from error

    named_predictions = [
        {**entry, "name": app.state.classes_by_id[entry["itemId"]]["name"]}
        for entry in predictions
    ]
    logger.info("Recognized image: %s (%.2f)", named_predictions[0]["itemId"], named_predictions[0]["confidence"])
    return {"success": True, "prediction": named_predictions[0], "topPredictions": named_predictions}
