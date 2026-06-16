import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping
import matplotlib.pyplot as plt

# =========================
# DATASET SETTINGS
# =========================

dataset_path = "../dataset"

IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15

# =========================
# TRAIN DATA AUGMENTATION
# =========================

train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.2,

    rotation_range=20,
    zoom_range=0.2,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    brightness_range=[0.8, 1.2]
)

# =========================
# VALIDATION DATA
# (NO AUGMENTATION)
# =========================

val_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.2
)

# =========================
# LOAD TRAINING DATA
# =========================

train_data = train_datagen.flow_from_directory(
    dataset_path,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    subset="training",
    shuffle=True
)

# =========================
# LOAD VALIDATION DATA
# =========================

val_data = val_datagen.flow_from_directory(
    dataset_path,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="binary",
    subset="validation",
    shuffle=False
)

# =========================
# LOAD PRETRAINED MODEL
# =========================

base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(IMG_SIZE, IMG_SIZE, 3)
)

# Freeze pretrained layers
base_model.trainable = False

# =========================
# BUILD MODEL
# =========================

model = Sequential([

    base_model,

    GlobalAveragePooling2D(),

    Dropout(0.3),

    Dense(128, activation="relu"),

    Dropout(0.3),

    Dense(1, activation="sigmoid")
])

# =========================
# COMPILE MODEL
# =========================

model.compile(
    optimizer=Adam(learning_rate=0.0001),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

# =========================
# EARLY STOPPING
# =========================

early_stop = EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True
)

# =========================
# TRAIN MODEL
# =========================

history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS,
    callbacks=[early_stop]
)

# =========================
# FINE-TUNING PHASE
# =========================

print("\nStarting Fine-Tuning...\n")

base_model.trainable = True

# Freeze first layers
for layer in base_model.layers[:-20]:
    layer.trainable = False

# Recompile model with lower learning rate
model.compile(
    optimizer=Adam(learning_rate=0.00001),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

# Continue training
history_fine = model.fit(
    train_data,
    validation_data=val_data,
    epochs=5,
    callbacks=[early_stop]
)

# =========================
# SAVE MODEL
# =========================

model.save("../backend/waste_classifier.h5")

print("\n✅ Model Trained & Saved Successfully")

# =========================
# EVALUATE MODEL
# =========================

loss, accuracy = model.evaluate(val_data)

print(f"\nValidation Accuracy: {accuracy * 100:.2f}%")
print(f"Validation Loss: {loss:.4f}")

# =========================
# PLOT ACCURACY GRAPH
# =========================

plt.figure(figsize=(10, 5))

plt.plot(
    history.history["accuracy"] +
    history_fine.history["accuracy"],
    label="Training Accuracy"
)

plt.plot(
    history.history["val_accuracy"] +
    history_fine.history["val_accuracy"],
    label="Validation Accuracy"
)

plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.title("Training vs Validation Accuracy")

plt.legend()

plt.show()