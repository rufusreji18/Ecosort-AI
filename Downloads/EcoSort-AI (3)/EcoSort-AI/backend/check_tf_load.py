import os
import tensorflow as tf

print('tf', tf.__version__)
from tensorflow.keras.models import load_model
print('loader', load_model.__module__)
model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'waste_classifier.h5')
print('model_path', model_path)
print('exists', os.path.exists(model_path))
model = load_model(model_path)
print('loaded', type(model))
