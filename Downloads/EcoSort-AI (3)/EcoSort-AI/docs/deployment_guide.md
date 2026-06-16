# EcoSort-AI Smart Waste Management System - Deployment Guide

This document describes how to deploy the **EcoSort-AI** web dashboard, backend services, MySQL database, and set up the ESP32-CAM microcontrollers for production deployment.

---

## 1. Project Directory Layout

The codebase is structured logically to separate backend files, React components, documentation, and trained models:

```
EcoSort-AI/
├── backend/                  # FastAPI Python backend application
│   ├── app.py                # App entrypoint and REST router
│   ├── database.py           # Database models, schemas, and seeds
│   ├── email_service.py      # SMTP alerts handler and templates
│   ├── waste_classifier.h5   # Trained TensorFlow Keras model
│   └── requirements.txt      # Python dependencies manifest
├── frontend/                 # Vite + React single page application
│   ├── src/
│   │   ├── components/       # Layout parts (Navigation sidebar, Toast notifications)
│   │   ├── context/          # State providers (AuthContext, PredictionContext)
│   │   ├── pages/            # View dashboards (User, Admin, Map, History)
│   │   ├── App.jsx           # App wrapper and protected router
│   │   └── index.css         # Global Tailwind imports
│   ├── vite.config.js        # Vite build properties & Tailwind v4 plugins
│   └── package.json          # Node dependencies manifest
└── docs/                     # Guides and hardware code
    ├── esp32_cam.ino         # ESP32 C++ Arduino sketches
    ├── integration_guide.md  # Hardware connections and schemas
    └── deployment_guide.md   # Deployment workflows (this document)
```

---

## 2. Backend Deployment on Render

[Render](https://render.com/) is a cloud hosting provider suitable for Python web services.

### Steps:
1. Sign in to Render and create a **New Web Service**.
2. Connect your GitHub repository containing the `EcoSort-AI` code.
3. Configure the following build and run parameters:
   - **Environment:** `Python`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command (Uvicorn):** `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Add environment variables under the **Environment** tab:
   - `SMTP_USER` = `<your_email@gmail.com>`
   - `SMTP_PASSWORD` = `<your_app_specific_gmail_password>`
   - `ADMIN_EMAIL` = `<admin_alerts_recipient@domain.com>`
   - `MYSQL_HOST` = `<your_mysql_database_host>`
   - `MYSQL_USER` = `<your_mysql_user>`
   - `MYSQL_PASSWORD` = `<your_mysql_password>`
   - `MYSQL_DATABASE` = `ecosort_ai`
5. Click **Deploy Web Service**. Render will install dependencies and start the FastAPI application.

---

## 3. Frontend Deployment on Vercel

[Vercel](https://vercel.com/) is optimized for static and single-page React/Vite builds.

### Steps:
1. Log in to Vercel and click **Add New Project**.
2. Select your repository and configure the directories:
   - **Root Directory:** Select the `frontend` folder.
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Vercel will automatically detect Vite and configure the build process.
4. Click **Deploy**. Vercel will build the React bundles and provide a production domain (e.g. `https://ecosort-ai.vercel.app`).

---

## 4. Production MySQL Setup

For real-world cities and malls, migrate the database from SQLite to a managed MySQL service (e.g. AWS RDS, DigitalOcean Databases, or PlanetScale).

### Steps:
1. Create a MySQL database instance and configure connectivity settings.
2. In the cloud dashboard, create a schema named `ecosort_ai`.
3. Provide the host, username, password, and port parameters as environment variables to the Render backend service (listed in Section 2).
4. On startup, the backend `database.init_db()` script will connect to the MySQL database, check for existing tables, create the 10 required schemas if they do not exist, and seed initial achievements and guides automatically.

---

## 5. ESP32-CAM Microcontroller Flash Guide

To deploy the physical smart bins, flash the ESP32-CAM with the Arduino C++ code:

### Steps:
1. Open the [esp32_cam.ino](file:///c:/Users/bless/Downloads/EcoSort-AI/EcoSort-AI/docs/esp32_cam.ino) sketch in the **Arduino IDE**.
2. Install the ESP32 Board Manager:
   - Open File > Preferences, and add `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json` to Additional Board Manager URLs.
   - Open Tools > Board > Boards Manager, search for `esp32` and install it.
3. Configure Board Settings:
   - Board: `AI Thinker ESP32-CAM`
   - Flash Frequency: `80MHz`
   - Upload Speed: `115200`
4. Update `SSID` and `PASSWORD` inside the sketch to match the site's WiFi router details.
5. Update `server_url_predict` and `server_url_level` variables with the target Render backend domain.
6. Connect the ESP32-CAM to your PC using an FTDI adapter (ensure `GPIO 0` is shorted to `GND` during flashing, then disconnect the short to run).
7. Compile and Upload the code. Open the Serial Monitor to verify successful boot, sensor checks, and network handshakes.
