import os
import tensorflow as tf

# Load trained AI model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "waste_classifier.h5")
model = tf.keras.models.load_model(model_path)

print("AI Model Loaded Successfully")