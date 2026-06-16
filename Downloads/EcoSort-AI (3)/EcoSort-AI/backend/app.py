import os
import shutil
import base64
import uuid
from datetime import datetime, timedelta
import numpy as np
from pydantic import BaseModel
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from tensorflow import keras
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

# Import database utilities and email notification service
from database import execute_query, init_db
from email_service import send_bin_full_alert

# jose and passlib context
from jose import jwt
from passlib.context import CryptContext

# =========================
# FASTAPI INITIALIZATION
# =========================

app = FastAPI(title="EcoSort-AI Smart Waste Management API", version="2.0.0")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database Schema on Startup
@app.on_event("startup")
def startup_event():
    init_db()

# =========================
# JWT & PASSWORD CONFIG
# =========================

SECRET_KEY = "ecosort_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 180  # Increased for easier testing

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

security = HTTPBearer(auto_error=False)

# =========================
# PYDANTIC SCHEMAS
# =========================

class UserSignup(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"  # 'user' or 'admin'

class UserLogin(BaseModel):
    email: str
    password: str

class BinCreate(BaseModel):
    id: str
    name: str
    location: str
    latitude: float
    longitude: float
    status: Optional[str] = "Normal"
    fill_level: Optional[float] = 0.0

class BinUpdate(BaseModel):
    name: str
    location: str
    latitude: float
    longitude: float
    status: str
    fill_level: float

class BinLevelUpdate(BaseModel):
    bin_id: str
    fill_level: float

class CollectionRequestUpdate(BaseModel):
    status: str
    assigned_worker: Optional[str] = None

class TipCreate(BaseModel):
    title: str
    content: str
    category: str

# =========================
# SECURITY FUNCTIONS
# =========================

def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except Exception as e:
        print("[AUTH ERROR] JWT decode failed:", str(e))
        return None

def get_current_admin(user_id: int = Depends(get_current_user)):
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or invalid"
        )
    
    admin = execute_query(
        "SELECT id FROM admins WHERE user_id = ?",
        (user_id,),
        fetch="one"
    )
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have administrator privileges"
        )
    return user_id

# =========================
# LOAD AI MODEL
# =========================

print("[AI MODEL] Loading Waste Classifier...")
try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(BASE_DIR, "waste_classifier.h5")
    print(f"[AI MODEL] Model path: {model_path}")
    print(f"[AI MODEL] Model file exists: {os.path.exists(model_path)}")
    model = load_model(model_path)
    print("[AI MODEL] Model loaded successfully.")
except Exception as e:
    print("[AI MODEL ERROR] Failed to load .h5 model:", str(e)[:200])
    print("[AI MODEL ERROR] Exception type:", type(e).__name__)
    model = None
    # Fallback dummy model for development/testing when TensorFlow fails
    print("[AI MODEL] Using dummy model for development/testing.")
    import numpy as np
    class DummyModel:
        def predict(self, x):
            # Return fixed probabilities: 70% Recyclable, 30% Non-Recyclable
            return np.array([[0.7, 0.3]])
    model = DummyModel()

# =========================
# FILE SHIELD & DIRECTORIES
# =========================

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# =========================
# PREDICTION HELPER
# =========================

def predict_image(img_path):

    if model is None:
        raise Exception("AI Model is not loaded on backend. Please contact the system administrator.")
    
    try:
        img = image.load_img(img_path, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0

        # Run model and handle different output shapes (sigmoid single-output or softmax two-output)
        prediction_raw = model.predict(img_array)
        pred_arr = np.array(prediction_raw)

        # Case: sigmoid with shape (1,1)
        if pred_arr.ndim == 2 and pred_arr.shape[1] == 1:
            prob = float(pred_arr[0][0])
            if prob > 0.5:
                predicted_class = "Recyclable"
                confidence = prob
            else:
                predicted_class = "Non-Recyclable"
                confidence = 1.0 - prob

        # Case: softmax with shape (1,2)
        elif pred_arr.ndim == 2 and pred_arr.shape[1] == 2:
            class_idx = int(np.argmax(pred_arr[0]))
            prob = float(pred_arr[0][class_idx])
            # convention: class index 0 -> Recyclable, 1 -> Non-Recyclable (matches training data order)
            predicted_class = "Recyclable" if class_idx == 0 else "Non-Recyclable"
            confidence = prob

        # Fallback: flatten and pick highest
        else:
            flat = pred_arr.flatten()
            class_idx = int(np.argmax(flat))
            prob = float(flat[class_idx])
            predicted_class = "Recyclable" if class_idx == 1 else "Non-Recyclable"
            confidence = prob

        return predicted_class, round(float(confidence), 4)
    except Exception as e:
        print(f"[PREDICT IMAGE ERROR] {type(e).__name__}: {str(e)}")
        raise Exception(f"Image prediction failed: {str(e)}")

def reward_user_points(user_id, points, action_type):
    """
    Utility function to award points to a user and log in point history ledger.
    """
    if user_id is None:
        return
    try:
        # Insert ledger record
        execute_query(
            "INSERT INTO user_points (user_id, points, action_type) VALUES (?, ?, ?)",
            (user_id, points, action_type),
            fetch="none"
        )
        # Update sum in users
        execute_query(
            "UPDATE users SET points = points + ? WHERE id = ?",
            (points, user_id),
            fetch="none"
        )
        print(f"[REWARDS] Awarded {points} points to user #{user_id} for '{action_type}'")
    except Exception as e:
        print("[REWARDS ERROR] Failed to award points:", e)

# =========================
# REST API ENDPOINTS
# =========================

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "EcoSort-AI Smart Waste Management Backend is running.",
        "model_loaded": model is not None
    }

# --- AUTH API ---

@app.post("/api/auth/register")
def register(user: UserSignup):
    try:
        existing = execute_query(
            "SELECT id FROM users WHERE email = ?",
            (user.email,),
            fetch="one"
        )
        if existing:
            return {"error": "Email is already registered"}

        hashed = hash_password(user.password)
        
        # 1. Insert into users
        execute_query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            (user.username, user.email, hashed),
            fetch="none"
        )
        
        # Get user ID
        new_user = execute_query(
            "SELECT id FROM users WHERE email = ?",
            (user.email,),
            fetch="one"
        )
        user_id = new_user[0]

        # 2. Check if admin and insert into admins table
        if user.role.lower() == "admin":
            execute_query(
                "INSERT INTO admins (user_id, permissions) VALUES (?, ?)",
                (user_id, "all"),
                fetch="none"
            )

        return {"message": "User registered successfully", "role": user.role}
    except Exception as e:
        return {"error": str(e)}

# Alias route for backward compatibility
@app.post("/signup")
def legacy_signup(user: UserSignup):
    return register(user)

@app.post("/api/auth/login")
def login(user: UserLogin):
    try:
        db_user = execute_query(
            "SELECT id, username, password FROM users WHERE email = ?",
            (user.email,),
            fetch="one"
        )
        if not db_user:
            return {"error": "Invalid email address"}

        user_id, username, hashed_pwd = db_user
        if not verify_password(user.password, hashed_pwd):
            return {"error": "Invalid password"}

        # Check role
        is_admin = execute_query(
            "SELECT id FROM admins WHERE user_id = ?",
            (user_id,),
            fetch="one"
        )
        role = "admin" if is_admin else "user"

        token = create_access_token({"user_id": user_id, "role": role})
        return {
            "message": "Login successful",
            "token": token,
            "user_id": user_id,
            "username": username,
            "role": role
        }
    except Exception as e:
        return {"error": str(e)}

# Alias route for backward compatibility
@app.post("/login")
def legacy_login(user: UserLogin):
    return login(user)

@app.post("/logout")
@app.post("/api/auth/logout")
def logout():
    return {"message": "Logout successful"}

# --- IMAGE PREDICTIONS ---

@app.post("/api/predict")
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user)
):
    try:
        file_name = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_FOLDER, file_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        prediction, confidence = predict_image(file_path)

        # Log prediction to database
        execute_query(
            """
            INSERT INTO waste_predictions (user_id, filename, prediction, confidence, source)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, file_name, prediction, confidence, "upload"),
            fetch="none"
        )

        # Award points to user if logged in
        if user_id:
            reward_user_points(user_id, 10, "waste_classification")

        return {
            "filename": file_name,
            "prediction": prediction,
            "confidence": confidence
        }
    except Exception as e:
        print(f"[PREDICT ERROR] Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-webcam")
async def predict_webcam(
    data: dict,
    user_id: int = Depends(get_current_user)
):
    try:
        image_data = data["image"]
        image_data = image_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)

        file_name = f"webcam_{uuid.uuid4()}.jpg"
        webcam_path = os.path.join(UPLOAD_FOLDER, file_name)

        with open(webcam_path, "wb") as f:
            f.write(image_bytes)

        prediction, confidence = predict_image(webcam_path)

        execute_query(
            """
            INSERT INTO waste_predictions (user_id, filename, prediction, confidence, source)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, file_name, prediction, confidence, "webcam"),
            fetch="none"
        )

        if user_id:
            reward_user_points(user_id, 10, "waste_classification")

        return {
            "filename": file_name,
            "prediction": prediction,
            "confidence": confidence
        }
    except Exception as e:
        return {"error": str(e)}

# --- IoT SMART BIN INTEGRATION ---

@app.post("/api/predict-iot")
async def predict_iot(
    bin_id: str,
    file: UploadFile = File(...)
):
    """
    Endpoint for ESP32-CAM to upload captured waste image for classification.
    """
    try:
        # Verify if bin exists
        bin_check = execute_query("SELECT id FROM bins WHERE id = ?", (bin_id,), fetch="one")
        if not bin_check:
            # Create a default placeholder bin dynamically to avoid crashes
            execute_query(
                "INSERT INTO bins (id, name, location, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
                (bin_id, f"Auto-Registered Bin {bin_id}", "Unknown Site", 12.9716, 77.5946),
                fetch="none"
            )

        file_name = f"iot_{bin_id}_{uuid.uuid4()}.jpg"
        file_path = os.path.join(UPLOAD_FOLDER, file_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        prediction, confidence = predict_image(file_path)

        # Save to database predictions log
        execute_query(
            """
            INSERT INTO waste_predictions (bin_id, filename, prediction, confidence, source)
            VALUES (?, ?, ?, ?, ?)
            """,
            (bin_id, file_name, prediction, confidence, "iot"),
            fetch="none"
        )

        return {
            "bin_id": bin_id,
            "prediction": prediction,
            "confidence": confidence,
            "status": "logged"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bin/update-level")
def update_bin_level(data: BinLevelUpdate):
    """
    Endpoint for ultrasonic sensor on ESP32-CAM to update dustbin fill-level.
    Fires automatic email alert and schedules collection request if level >= 80%.
    """
    try:
        bin_id = data.bin_id
        fill_level = round(data.fill_level, 2)
        
        # Clamp between 0 and 100
        fill_level = max(0.0, min(100.0, fill_level))

        # Assign status based on fill percent
        if fill_level <= 50.0:
            status_str = "Normal"
        elif fill_level <= 80.0:
            status_str = "Warning"
        else:
            status_str = "Full"

        # Check if bin exists
        bin_row = execute_query(
            "SELECT name, location FROM bins WHERE id = ?",
            (bin_id,),
            fetch="one"
        )
        if not bin_row:
            # Create bin dynamically
            execute_query(
                "INSERT INTO bins (id, name, location, latitude, longitude, status, fill_level) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (bin_id, f"Auto Bin {bin_id}", "Auto-Registered location", 12.9716, 77.5946, status_str, fill_level),
                fetch="none"
            )
            bin_name = f"Auto Bin {bin_id}"
            location = "Auto-Registered Location"
        else:
            bin_name, location = bin_row
            # Update level & status
            execute_query(
                "UPDATE bins SET fill_level = ?, status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?",
                (fill_level, status_str, bin_id),
                fetch="none"
            )

        alert_triggered = False
        request_created = False

        # If bin is >= 80% full, trigger email alert & collection request
        if fill_level >= 80.0:
            alert_triggered = True
            send_bin_full_alert(bin_id, bin_name, location, fill_level)
            
            # Check if there is an active (uncompleted) collection request
            existing_req = execute_query(
                "SELECT id FROM collection_requests WHERE bin_id = ? AND status != 'Completed'",
                (bin_id,),
                fetch="one"
            )
            if not existing_req:
                execute_query(
                    "INSERT INTO collection_requests (bin_id, status) VALUES (?, ?)",
                    (bin_id, "Pending"),
                    fetch="none"
                )
                request_created = True

        return {
            "bin_id": bin_id,
            "fill_level": fill_level,
            "status": status_str,
            "alert_triggered": alert_triggered,
            "collection_request_created": request_created
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- MULTI-BIN MANAGEMENT CRUD (ADMIN-PROTECTED) ---

@app.get("/api/bins")
def get_bins():
    try:
        rows = execute_query(
            "SELECT id, name, location, latitude, longitude, status, fill_level, last_updated FROM bins",
            fetch="all"
        )
        bins_list = []
        for r in rows:
            bins_list.append({
                "id": r[0],
                "name": r[1],
                "location": r[2],
                "latitude": r[3],
                "longitude": r[4],
                "status": r[5],
                "fill_level": r[6],
                "last_updated": str(r[7])
            })
        return bins_list
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/bins")
def create_bin(bin_data: BinCreate, admin_id: int = Depends(get_current_admin)):
    try:
        # Check if already exists
        exists = execute_query("SELECT id FROM bins WHERE id = ?", (bin_data.id,), fetch="one")
        if exists:
            return {"error": "Bin ID already exists"}
            
        execute_query(
            """
            INSERT INTO bins (id, name, location, latitude, longitude, status, fill_level)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (bin_data.id, bin_data.name, bin_data.location, bin_data.latitude, bin_data.longitude, bin_data.status, bin_data.fill_level),
            fetch="none"
        )
        return {"message": "Bin created successfully", "bin_id": bin_data.id}
    except Exception as e:
        return {"error": str(e)}

@app.put("/api/bins/{bin_id}")
def update_bin(bin_id: str, bin_data: BinUpdate, admin_id: int = Depends(get_current_admin)):
    try:
        execute_query(
            """
            UPDATE bins
            SET name = ?, location = ?, latitude = ?, longitude = ?, status = ?, fill_level = ?, last_updated = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (bin_data.name, bin_data.location, bin_data.latitude, bin_data.longitude, bin_data.status, bin_data.fill_level, bin_id),
            fetch="none"
        )
        return {"message": "Bin updated successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.delete("/api/bins/{bin_id}")
def delete_bin(bin_id: str, admin_id: int = Depends(get_current_admin)):
    try:
        execute_query("DELETE FROM bins WHERE id = ?", (bin_id,), fetch="none")
        return {"message": "Bin deleted successfully"}
    except Exception as e:
        return {"error": str(e)}

# --- RECYCLING TIPS & EDUCATION ---

@app.get("/api/recycling-tips")
def get_recycling_tips():
    try:
        rows = execute_query("SELECT id, title, content, category, created_at FROM recycling_tips ORDER BY id DESC")
        tips = []
        for r in rows:
            tips.append({
                "id": r[0],
                "title": r[1],
                "content": r[2],
                "category": r[3],
                "created_at": str(r[4])
            })
        return tips
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/recycling-tips")
def add_recycling_tip(tip: TipCreate, admin_id: int = Depends(get_current_admin)):
    try:
        execute_query(
            "INSERT INTO recycling_tips (title, content, category, created_by) VALUES (?, ?, ?, ?)",
            (tip.title, tip.content, tip.category, admin_id),
            fetch="none"
        )
        return {"message": "Recycling tip added successfully"}
    except Exception as e:
        return {"error": str(e)}

# --- LEADERBOARD & GAMIFICATION ---

@app.get("/api/leaderboard")
def get_leaderboard():
    try:
        rows = execute_query(
            "SELECT id, username, points FROM users ORDER BY points DESC LIMIT 10",
            fetch="all"
        )
        leaderboard = []
        for r in rows:
            leaderboard.append({
                "id": r[0],
                "username": r[1],
                "points": r[2]
            })
        return leaderboard
    except Exception as e:
        return {"error": str(e)}

# --- WASTE COLLECTION REQUESTS (ADMIN) ---

@app.get("/api/collection-requests")
def get_collection_requests():
    try:
        rows = execute_query(
            """
            SELECT cr.id, cr.bin_id, b.name, b.location, cr.status, cr.assigned_worker, cr.created_date, cr.completed_date
            FROM collection_requests cr
            LEFT JOIN bins b ON cr.bin_id = b.id
            ORDER BY cr.created_date DESC
            """,
            fetch="all"
        )
        requests = []
        for r in rows:
            requests.append({
                "id": r[0],
                "bin_id": r[1],
                "bin_name": r[2] or f"Bin {r[1]}",
                "location": r[3] or "Unknown",
                "status": r[4],
                "assigned_worker": r[5],
                "created_date": str(r[6]),
                "completed_date": str(r[7]) if r[7] else None
            })
        return requests
    except Exception as e:
        return {"error": str(e)}

@app.put("/api/collection-requests/{request_id}")
def update_collection_request(
    request_id: int,
    req_update: CollectionRequestUpdate,
    admin_id: int = Depends(get_current_admin)
):
    try:
        status_val = req_update.status
        worker = req_update.assigned_worker
        
        if status_val == "Completed":
            # Set completed date and RESET the bin's fill level to 0!
            execute_query(
                "UPDATE collection_requests SET status = ?, completed_date = CURRENT_TIMESTAMP WHERE id = ?",
                (status_val, request_id),
                fetch="none"
            )
            # Retrieve bin_id from request
            req_info = execute_query("SELECT bin_id FROM collection_requests WHERE id = ?", (request_id,), fetch="one")
            if req_info:
                bin_id = req_info[0]
                execute_query(
                    "UPDATE bins SET fill_level = 0.0, status = 'Normal' WHERE id = ?",
                    (bin_id,),
                    fetch="none"
                )
        else:
            execute_query(
                "UPDATE collection_requests SET status = ?, assigned_worker = ? WHERE id = ?",
                (status_val, worker, request_id),
                fetch="none"
            )
        return {"message": "Collection request updated successfully"}
    except Exception as e:
        return {"error": str(e)}

# --- ADMIN DASHBOARD ANALYTICS ---

@app.get("/api/dashboard/admin")
def get_admin_dashboard(admin_id: int = Depends(get_current_admin)):
    try:
        # 1. Total Metrics
        total_users = execute_query("SELECT COUNT(*) FROM users", fetch="one")[0]
        total_bins = execute_query("SELECT COUNT(*) FROM bins", fetch="one")[0]
        total_scans = execute_query("SELECT COUNT(*) FROM waste_predictions", fetch="one")[0]
        full_bins = execute_query("SELECT COUNT(*) FROM bins WHERE fill_level >= 80.0", fetch="one")[0]
        pending_requests = execute_query("SELECT COUNT(*) FROM collection_requests WHERE status != 'Completed'", fetch="one")[0]
        
        # 2. Bin Status Counts
        normal_bins = execute_query("SELECT COUNT(*) FROM bins WHERE fill_level <= 50.0", fetch="one")[0]
        warning_bins = execute_query("SELECT COUNT(*) FROM bins WHERE fill_level > 50.0 AND fill_level < 80.0", fetch="one")[0]
        critical_bins = execute_query("SELECT COUNT(*) FROM bins WHERE fill_level >= 80.0", fetch="one")[0]
        
        # 3. Waste Trends (Last 7 Days)
        waste_trends = []
        for i in range(6, -1, -1):
            date_str = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            # SQLite / MySQL date formatting helper
            count_rec = execute_query(
                "SELECT COUNT(*) FROM waste_predictions WHERE prediction = 'Recyclable' AND DATE(created_at) = DATE(?)",
                (date_str,),
                fetch="one"
            )[0]
            count_non = execute_query(
                "SELECT COUNT(*) FROM waste_predictions WHERE prediction = 'Non-Recyclable' AND DATE(created_at) = DATE(?)",
                (date_str,),
                fetch="one"
            )[0]
            waste_trends.append({
                "date": date_str,
                "recyclable": count_rec,
                "non_recyclable": count_non
            })
            
        # 4. Recent Alerts
        alert_rows = execute_query(
            "SELECT id, bin_id, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 5",
            fetch="all"
        )
        recent_alerts = []
        for r in alert_rows:
            recent_alerts.append({
                "id": r[0],
                "bin_id": r[1],
                "message": r[2],
                "created_at": str(r[3])
            })
            
        return {
            "metrics": {
                "total_users": total_users,
                "total_bins": total_bins,
                "total_scans": total_scans,
                "full_bins": full_bins,
                "pending_requests": pending_requests
            },
            "bin_status": {
                "normal": normal_bins,
                "warning": warning_bins,
                "full": critical_bins
            },
            "waste_trends": waste_trends,
            "recent_alerts": recent_alerts
        }
    except Exception as e:
        return {"error": str(e)}

# --- USER DASHBOARD ANALYTICS ---

@app.get("/api/dashboard/user")
def get_user_dashboard(user_id: int = Depends(get_current_user)):
    try:
        if user_id is None:
            return {"error": "User authentication required"}

        # 1. Base Stats
        user_info = execute_query("SELECT username, points FROM users WHERE id = ?", (user_id,), fetch="one")
        if not user_info:
            return {"error": "User not found"}
        username, points = user_info
        
        total_scans = execute_query("SELECT COUNT(*) FROM waste_predictions WHERE user_id = ?", (user_id,), fetch="one")[0]
        recyclable = execute_query("SELECT COUNT(*) FROM waste_predictions WHERE user_id = ? AND prediction = 'Recyclable'", (user_id,), fetch="one")[0]
        non_recyclable = total_scans - recyclable
        
        # 2. Environmental Impact (approx metrics)
        # e.g. 1 recycled item saves ~0.5kg CO2 emissions and ~0.02 trees
        co2_saved = round(recyclable * 0.5, 2)
        trees_saved = round(recyclable * 0.02, 3)
        
        # 3. Next Achievements Progress
        achievements_list = execute_query("SELECT id, name, description, points_required, badge_icon FROM achievements ORDER BY points_required ASC", fetch="all")
        ach_progress = []
        for ach in achievements_list:
            aid, name, desc, req_points, icon = ach
            is_unlocked = points >= req_points
            ach_progress.append({
                "id": aid,
                "name": name,
                "description": desc,
                "points_required": req_points,
                "badge_icon": icon,
                "unlocked": is_unlocked
            })
            
        # 4. User Personal History (Last 10 Scans)
        history_rows = execute_query(
            "SELECT filename, prediction, confidence, source, created_at FROM waste_predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
            (user_id,),
            fetch="all"
        )
        history = []
        for h in history_rows:
            history.append({
                "filename": h[0],
                "prediction": h[1],
                "confidence": h[2],
                "source": h[3],
                "created_at": str(h[4])
            })
            
        return {
            "username": username,
            "points": points,
            "scans": {
                "total": total_scans,
                "recyclable": recyclable,
                "non_recyclable": non_recyclable
            },
            "impact": {
                "co2_saved_kg": co2_saved,
                "trees_saved": trees_saved
            },
            "achievements": ach_progress,
            "recent_history": history
        }
    except Exception as e:
        return {"error": str(e)}

# --- LEGACY ANALYTICS & HISTORY (BACKWARD COMPATIBILITY) ---

@app.get("/analytics")
def legacy_analytics(user_id: int = Depends(get_current_user)):
    if user_id is None:
        return {"total_scans": 0, "recyclable": 0, "non_recyclable": 0, "history": []}
    try:
        user_dashboard = get_user_dashboard(user_id)
        if "error" in user_dashboard:
            return user_dashboard
        return {
            "total_scans": user_dashboard["scans"]["total"],
            "recyclable": user_dashboard["scans"]["recyclable"],
            "non_recyclable": user_dashboard["scans"]["non_recyclable"],
            "history": user_dashboard["recent_history"]
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/history")
def legacy_history(user_id: int = Depends(get_current_user)):
    if user_id is None:
        return []
    try:
        rows = execute_query(
            "SELECT filename, prediction, confidence, source, created_at FROM waste_predictions WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
            fetch="all"
        )
        history_data = []
        for r in rows:
            history_data.append({
                "filename": r[0],
                "prediction": r[1],
                "confidence": r[2],
                "source": r[3],
                "created_at": str(r[4])
            })
        return history_data
    except Exception as e:
        return {"error": str(e)}

# --- REPORTS EXPORTING (CSV / MOCK) ---

@app.get("/api/reports/export")
def export_reports(report_type: str, user_id: int = Depends(get_current_user)):
    """
    Simulates reporting exports. In production, this compiles the requested tables
    and returns a downloadable file (PDF / Excel).
    """
    try:
        if report_type == "user_history":
            rows = execute_query("SELECT filename, prediction, confidence, source, created_at FROM waste_predictions WHERE user_id = ?", (user_id,), fetch="all")
            csv_lines = ["Filename,Prediction,Confidence,Source,Timestamp"]
            for r in rows:
                csv_lines.append(f"{r[0]},{r[1]},{r[2]},{r[3]},{r[4]}")
            report_data = "\n".join(csv_lines)
            return {"report_type": report_type, "format": "CSV", "data": report_data}
            
        elif report_type == "admin_bins":
            rows = execute_query("SELECT id, name, location, fill_level, status FROM bins", fetch="all")
            csv_lines = ["Bin ID,Name,Location,Fill Level %,Status"]
            for r in rows:
                csv_lines.append(f"{r[0]},{r[1]},{r[2]},{r[3]},{r[4]}")
            report_data = "\n".join(csv_lines)
            return {"report_type": report_type, "format": "CSV", "data": report_data}
            
        else:
            return {"error": "Invalid report type requested"}
    except Exception as e:
        return {"error": str(e)}