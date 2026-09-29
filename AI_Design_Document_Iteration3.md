# AI Design Document – Iteration 3

## 1. Overview

Circular Kids uses image classification to help a child identify an item at the start of an investigation. The user can upload or take a photo, and the system suggests one of 23 supported item classes, such as a backpack, mobile phone, mug, or soft toy. The child must confirm the suggestion before it is saved, and a manual item list remains available if recognition is unavailable or incorrect.

The AI feature supports the identification step; it does not decide whether an item is safe, repairable, reusable, or recyclable.

## 2. AI Problem

Children may not know which category or item name to select when starting an investigation. Image classification provides a quick first suggestion from the uploaded photo. The prediction connects the photo-upload step to the existing catalogue and later investigation flow, while keeping the user in control through an explicit confirmation screen.

## 3. AI Workflow

```text
User Image
  → Vue Frontend Upload
  → Node/Vercel Same-Origin API Proxy
  → FastAPI Inference Endpoint
  → Image Validation and Preprocessing
  → MobileNetV3 Classification Model
  → Top-1 Prediction and Top-3 Ranking
  → Confidence Handling
  → Result Displayed for User Confirmation
```

The main code locations are:

- `src/views/IdentifyView.vue`: photo upload, progress, prediction confirmation, and manual fallback interface.
- `src/stores/investigation.js`: holds the selected file in memory and coordinates recognition with the investigation flow.
- `src/services/imageRecognition.js`: sends the multipart image request, validates the response, and maps the result to the catalogue.
- `server.js`: proxies local same-origin AI requests to the Python service without writing the image to disk.
- `api/image-recognition.js`: proxies deployed image-recognition requests to the hosted inference service.
- `backend/ai_server.py`: loads the model once, validates uploads, runs prediction, and returns the top result plus the top-three ranking.
- `training/pytorch_model.py`: defines MobileNetV3, preprocessing, checkpoint loading, and shared prediction logic.
- `training/classes.json`: defines the 23 ordered class labels and user-facing names.
- `training/train.py`, `training/evaluate.py`, and `training/inference.py`: provide training, test evaluation, and command-line inference workflows.

## 4. Data Strategy

The repository defines 23 item classes in `training/classes.json`. Reviewed candidate images are expected under `training/candidates/<itemId>/`. The preparation script validates image files, applies available Open Images bounding boxes, removes exact byte and decoded-pixel duplicates across all classes, and creates mutually exclusive train, validation, and test folders.

The configured split is 70% training, 15% validation, and 15% test, using seed 42. The preparation script records the actual per-class counts in a generated `dataset-summary.json`; those generated data files are not stored in this repository, so this document does not claim a dataset size.

Training uses random resized crops, horizontal flips, small rotations, and modest colour changes as augmentation. Validation, testing, and inference use deterministic preprocessing: EXIF orientation correction, RGB conversion, resize of the shorter edge to 256 pixels, centre crop to 224 × 224 pixels, tensor conversion, and ImageNet mean/standard-deviation normalisation.

## 5. Model Design

The production classifier is a PyTorch/torchvision MobileNetV3 Small model. It starts from ImageNet-pretrained weights and replaces the final classification layer with a 23-class head. Training first updates the classification head while the feature backbone is frozen, then fine-tunes the final feature blocks at a lower learning rate.

At runtime, `backend/ai_server.py` loads `training/artifacts/best_model.pth` once when the service starts. The shared `predict_image()` function converts model logits to softmax probabilities and ranks the requested number of classes. The API currently returns the highest-scoring prediction and a top-three list. The top result is a suggestion only: the child confirms it or chooses another item manually.

## 6. Iteration 3 AI Improvements

### Improvement 1 – Consistent Camera Image Preprocessing

**Before:** Training data was converted to RGB, and evaluation/inference used the same resize, crop, and ImageNet normalisation. However, the shared model path did not consistently apply camera EXIF orientation before transforms. A portrait photo could therefore be presented to the model in its stored orientation rather than the orientation shown by the phone.

**Change:** A shared `canonicalize_image()` step now applies EXIF orientation and RGB conversion before both dataset transforms and inference transforms. The API decoder preserves image metadata until this shared preprocessing step runs.

**Reason:** Phone and tablet photos commonly use EXIF metadata to describe rotation. Handling it in one shared function makes training/evaluation and live inference behaviour easier to understand and maintain.

**Benefit:** Uploaded photos are presented to the classifier in a more consistent orientation without changing the model or the overall architecture.

### Improvement 2 – Clear Low-Confidence Communication

**Before:** The system always returned and displayed the highest-scoring class in the same confident wording, even when its softmax score was low. The child could still reject it, but the interface did not explain the model's uncertainty.

**Change:** The inference API now applies a simple 0.60 confidence policy and labels lower-scoring predictions as `low`, while keeping the top-1 result and top-three response structure. The frontend validates that the confidence is numeric, carries the confidence level into the suggestion, and uses cautious wording for a low-confidence match. Existing confirmation and manual fallback behaviour is unchanged.

**Reason:** A softmax score is not a guarantee that a prediction is correct. Expressing uncertainty avoids presenting every result as equally certain.

**Benefit:** Children receive a clearer prompt to check uncertain suggestions, while the main image-recognition flow remains familiar and usable.

## 7. Design Rationale

Iteration 3 focuses on reliability, maintainability, integration, and user-facing value. Replacing the model, changing the 23-class catalogue, or running a large retraining exercise would introduce substantially more risk and would require new evaluation evidence. The selected improvements strengthen the existing pipeline without changing its architecture, checkpoint, or downstream investigation logic.

## 8. Limitations

- Predictions can be affected by lighting, blur, background clutter, camera angle, and partial views.
- Visually similar classes may receive similar scores.
- The classifier can only suggest the 23 classes represented by its checkpoint; other items require manual selection.
- A confidence score describes the model output but does not guarantee correctness.
- The repository does not contain the generated training dataset, so data diversity and class balance cannot be fully verified from the checkout alone.
- The user must still confirm the result, and image recognition must not be treated as a safety decision.

## 9. Future Improvements

- Collect a larger and more balanced reviewed dataset.
- Compare additional augmentation settings and suitable lightweight model variants.
- Review the confusion matrix to identify commonly confused classes.
- Report class-specific precision, recall, F1, and support from a controlled test set.
- Retrain and compare checkpoints only when reproducible evaluation evidence is available.
- Calibrate confidence thresholds using held-out validation data rather than treating softmax scores as calibrated probabilities.
- Explore clearer top-three alternatives if user testing shows that they improve the confirmation experience.

## 10. Iteration 3 Benefit Realisation

These changes make the existing AI experience more stable and honest. Camera orientation is handled consistently before inference, reducing avoidable input variation. Low-confidence predictions are still useful suggestions, but the interface now communicates uncertainty and asks the child to check carefully. The result is a smoother classification experience with clearer user control and no disruptive model or architecture change.
