# Training the image classifier

This model is a three-convolution CNN trained from random weights. After the
three pooling stages it uses global average pooling, one 128-unit dense
layer, and a 23-class Softmax output. It does not load a checkpoint,
TensorFlow Hub model, or any other pretrained model.

Global average pooling (rather than flattening the last feature map straight
into the dense layer) keeps the head small on purpose — flattening would cost
roughly 2 million parameters, which overfits badly when training from
scratch on a few hundred photos. Batch normalisation, a light L2 penalty, and
dropout all help the same small-dataset problem. Training and the browser
both resize photos by padding to a square instead of stretching them, so a
tall or wide item (a water bottle, a towel) is not warped before the model
sees it. Class weighting is computed automatically from folder sizes, so an
unevenly photographed class does not get drowned out — balanced folders make
every weight ~1.0, so this only matters if your dataset isn't perfectly
even.

## 1. Collect and label images

Put photos under `training/data/<itemId>/`. The 23 folder names must exactly
match `classes.json`, for example:

```text
training/data/
  soft-toy/
    teddy-001.jpg
  backpack/
    backpack-001.jpg
  ...one folder for every itemId in classes.json...
```

Use photos you have permission to use. Keep the classes reasonably balanced.
The script requires at least 30 images per class, but 100–300 varied images per
class is a more useful starting point. Do not put the same or near-identical
photo in multiple classes.

### Optional open-license candidates

If your assessment permits public images, this helper downloads candidates with
human-verified labels from the Open Images validation and test subsets:

```bash
python training/download_candidates.py --per-class 40
```

Review every file in `training/candidates/<class-id>/`, update the `review`
column in `training/candidates/manifest.csv`, and copy only correctly labelled
photos into `training/data/<class-id>/`. Search results are not reliable labels.
These images count as curated public data, not photos you personally collected.
The generated `report.json` identifies classes that still need your own photos.
`download_commons_gaps.py` downloads all 23 classes from precise Wikimedia
Commons categories while preserving the author, source page, and license.

After reviewing candidates, create a balanced and resized dataset with:

```bash
python training/prepare_dataset.py --per-class 40
```

## 2. Train from scratch

Create a Python environment, install `requirements.txt`, then run:

```bash
python training/train.py --epochs 25
```

The script reserves 20% of each class for validation, prints validation
accuracy, saves the Keras artifact under `training/artifacts/`, and exports the
browser model to `public/model/`.

## 3. Review before adding weights to Git

Generated weights are ignored initially. Check validation accuracy, confusion
between classes, license/privacy of the images, and model size before deciding
whether the small `.bin` weight file should be committed.

Run `python training/evaluate.py` after training to see per-class accuracy
and a `topConfusions` list — which class each class gets mistaken for most
often. That list is the fastest way to tell whether low accuracy is a data
problem (two classes that look alike need more, or more distinct, photos)
rather than a model problem.
