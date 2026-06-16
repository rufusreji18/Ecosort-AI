import numpy as np
from tensorflow.keras.preprocessing import image
from model import model

def predict_waste(img_path):

    # Load image
    img = image.load_img(img_path, target_size=(224, 224))

    # Convert image to array
    img_array = image.img_to_array(img)

    # Normalize image
    img_array = img_array / 255.0

    # Expand dimensions
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    prediction_raw = model.predict(img_array)
    pred_arr = np.array(prediction_raw)

    # Handle sigmoid (1,) and softmax (2,) outputs
    if pred_arr.ndim == 2 and pred_arr.shape[1] == 1:
        prob = float(pred_arr[0][0])
        if prob > 0.5:
            result = "Recyclable"
            confidence = prob
        else:
            result = "Non-Recyclable"
            confidence = 1.0 - prob
    elif pred_arr.ndim == 2 and pred_arr.shape[1] == 2:
        class_idx = int(np.argmax(pred_arr[0]))
        prob = float(pred_arr[0][class_idx])
        # convention: class index 0 -> Recyclable, 1 -> Non-Recyclable (matches training data order)
        result = "Recyclable" if class_idx == 0 else "Non-Recyclable"
        confidence = prob
    else:
        flat = pred_arr.flatten()
        idx = int(np.argmax(flat))
        prob = float(flat[idx])
        result = "Recyclable" if idx == 0 else "Non-Recyclable"
        confidence = prob

    return {
        "prediction": result,
        "confidence": round(float(confidence), 2)
    }