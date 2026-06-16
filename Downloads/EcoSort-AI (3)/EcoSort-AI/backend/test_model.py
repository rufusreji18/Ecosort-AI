import os
import sys

model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'waste_classifier.h5')
print(f'Model path: {model_path}')
print(f'File exists: {os.path.exists(model_path)}')
if os.path.exists(model_path):
    print(f'File size: {os.path.getsize(model_path)} bytes')

try:
    print('Importing TensorFlow...')
    from tensorflow.keras.models import load_model
    print('Loading model...')
    model = load_model(model_path)
    print('✓ Model loaded successfully!')
    print(f'Model type: {type(model)}')
except Exception as e:
    print(f'✗ Error loading model: {e}')
    import traceback
    traceback.print_exc()
