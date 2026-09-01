# Circular Kids — Epic 1

**Investigate Before I Throw It Away.** A child opens a case on an item that seems
broken, sees what is still good about it, pins down what actually failed, answers a
few clues, and reaches their own verdict — before the site offers one.

Vue 3 + Vite + Bootstrap 5 on the front, one shared rules module on the back.

## Image recognition

Image recognition uses a small three-convolution CNN defined in
`training/train.py`. It starts from random weights and predicts the 23 concrete
items in the catalogue; it does not load CLIP, a model hub, a checkpoint, or any
other pretrained model. The trained Keras model is exported to TensorFlow.js and
runs locally in the browser, so photos are not uploaded and file names are not
used for prediction.

Labelled training photos and generated weights are intentionally gitignored.
See `training/README.md` for the dataset sources, folder structure, and training command.
