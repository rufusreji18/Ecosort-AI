# EcoSort-AI Smart Waste Management System - Integration Guide

This document describes the hardware integration, database schema, and REST API specification for the **EcoSort-AI** Smart Waste Management System.

---

## 1. System Architecture

The smart dustbin uses an ESP32-CAM microcontroller connected with an HC-SR04 ultrasonic sensor to calculate fill levels and capture waste images automatically on significant level changes.

```
+--------------------+                 +--------------------------+
|  ESP32-CAM Node    |                 |   FastAPI Backend Server  |
|                    |                 |                          |
|  - HC-SR04 Sensor  | -- (WiFi/HTTP) -> - Predict API            |
|  - Camera Module   |                 | - Level Update API       |
+--------------------+                 +--------------------------+
                                                    |
                                           +--------+--------+
                                           |                 |
                                           v                 v
                                    +------------+    +------------+
                                    | DB Ledger  |    | SMTP Alert |
                                    | (SQLite/   |    | Mailer     |
                                    |  MySQL)    |    +------------+
                                    +------------+
```

---

## 2. Database Design & Relationships

The database utilizes 10 core tables to organize telemetry data, user profiles, and logs:

```
                  +------------------+
                  |      users       |
                  +------------------+
                  | id (PK)          | <---+
                  | username         |     |
                  | email (Unique)   |     |
                  | password         |     | (1 to 1)
                  | points           |     |
                  +------------------+     |
                           |               |
             (1 to Many)   | (1 to Many)   |
             +-------------+------+        |
             |                    |        |
             v                    v        |
     +---------------+    +--------------+ |
     |  user_points  |    |    admins    | |
     +---------------+    +--------------+ |
     | id (PK)       |    | id (PK)      |-+
     | user_id (FK)  |    | user_id (FK) |
     | points        |    +--------------+
     | action_type   |           |
     +---------------+           | (1 to Many)
                                 v
                       +------------------+
                       |  recycling_tips  |
                       +------------------+
                       | id (PK)          |
                       | title            |
                       | content          |
                       | created_by (FK)  |
                       +------------------+

  +------------------+                  +-----------------------+
  |      bins        |                  |  waste_predictions    |
  +------------------+                  +-----------------------+
  | id (PK)          | <--------------+ | id (PK)               |
  | name             | (1 to Many)    | | user_id (FK, Null)    |
  | location         |                | | bin_id (FK, Null)     |
  | latitude         |                | | filename              |
  | longitude        |                | | prediction            |
  | status           |                | | confidence            |
  | fill_level       |                | | source (upload/iot)   |
  | last_updated     |                +-----------------------+
  +------------------+
      |          |
      | (1 to M) | (1 to Many)
      v          v
+------------+ +---------------------+
|alerts logs | | collection_requests |
+------------+ +---------------------+
| id (PK)    | | id (PK)             |
| bin_id(FK) | | bin_id (FK)         |
| message    | | status              |
| type       | | assigned_worker     |
+------------+ +---------------------+
```

---

## 3. REST API Specification

All request payloads are JSON, unless specified otherwise (e.g. multipart/form-data for file uploads). Standard route paths are prefixed with `/api`.

### 3.1 Authentication

#### `POST /api/auth/register`
Creates a user profile. Admins can register by passing `"role": "admin"`.
* **Request Header:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "username": "green_citizen",
  "email": "user@ecosort-ai.com",
  "password": "secure_password",
  "role": "user"
}
```
* **Response (Success 200):**
```json
{
  "message": "User registered successfully",
  "role": "user"
}
```

#### `POST /api/auth/login`
Authenticates user and returns a JWT token containing `user_id` and `role`.
* **Request Header:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "email": "user@ecosort-ai.com",
  "password": "secure_password"
}
```
* **Response (Success 200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user_id": 4,
  "username": "green_citizen",
  "role": "user"
}
```

---

### 3.2 IoT Integration

#### `POST /api/predict-iot`
Processes Captured frame bytes from ESP32-CAM and runs waste classification model.
* **Query Parameters:** `bin_id=bin_1`
* **Request Header:** `Content-Type: multipart/form-data`
* **Request Body (Binary payload):** Image file binary
* **Response (Success 200):**
```json
{
  "bin_id": "bin_1",
  "prediction": "Recyclable",
  "confidence": 0.9654,
  "status": "logged"
}
```

#### `POST /api/bin/update-level`
Updates the fill-level. Triggered by ESP32 ultrasonic readings.
* **Request Header:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "bin_id": "bin_1",
  "fill_level": 82.5
}
```
* **Response (Success 200):**
```json
{
  "bin_id": "bin_1",
  "fill_level": 82.5,
  "status": "Full",
  "alert_triggered": true,
  "collection_request_created": true
}
```

---

### 3.3 Dashboard Telemetry

#### `GET /api/dashboard/user`
Retrieves points balance, CO2 equivalents saved, unlocked milestones, and recent scan logs.
* **Request Header:** `Authorization: Bearer <JWT_TOKEN>`
* **Response (Success 200):**
```json
{
  "username": "green_citizen",
  "points": 120,
  "scans": {
    "total": 12,
    "recyclable": 8,
    "non_recyclable": 4
  },
  "impact": {
    "co2_saved_kg": 4.0,
    "trees_saved": 0.16
  },
  "achievements": [
    {
      "id": "beginner",
      "name": "Beginner Recycler",
      "description": "Classify your first waste item",
      "points_required": 10,
      "badge_icon": "🌱",
      "unlocked": true
    }
  ],
  "recent_history": []
}
```
