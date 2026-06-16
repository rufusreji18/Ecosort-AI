/**
 * EcoSort-AI Smart Waste Management System
 * ESP32-CAM with HC-SR04 Ultrasonic Sensor Integration
 * 
 * Hardware Setup:
 * - ESP32-CAM (AI-Thinker module)
 * - HC-SR04 Ultrasonic Sensor:
 *   - VCC -> 5V (from external power source, common ground)
 *   - GND -> GND
 *   - Trig -> GPIO 12
 *   - Echo -> GPIO 13
 * - Built-in Flash LED -> GPIO 4
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>

// =========================
// CONFIGURATIONS (Change these)
// =========================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server endpoints
const char* bin_id = "bin_1";
const char* server_url_predict = "http://127.0.0.1:8000/api/predict-iot";
const char* server_url_level = "http://127.0.0.1:8000/api/bin/update-level";

// Distance sensor configs
const int TRIG_PIN = 12;
const int ECHO_PIN = 13;
const float MAX_BIN_DEPTH_CM = 100.0; // Total height of the bin in cm
const int MEASURE_INTERVAL_MS = 30000; // Check levels every 30 seconds

// Camera Pin Definitions (AI-Thinker Model)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define FLASH_LED_PIN      4

unsigned long lastMeasureTime = 0;
float lastLevel = -1.0;

void setup() {
  Serial.begin(115200);
  Serial.println("\n[SYSTEM] EcoSort-AI IoT Dustbin Initializing...");

  // Setup Flash LED
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW); // Turn off initially

  // Setup Ultrasonic Sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Initialize Camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFMT_JPEG;

  // Frame size parameters: UXGA, SXGA, XGA, SVGA, VGA, CIF, QVGA
  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[CAMERA ERROR] Camera init failed with error 0x%x\n", err);
    return;
  }
  Serial.println("[CAMERA] Camera setup successful.");

  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check WiFi Connection status
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastMeasureTime >= MEASURE_INTERVAL_MS) {
    lastMeasureTime = currentMillis;

    // 1. Measure fill-level
    float fillLevel = measureFillLevel();
    Serial.printf("[SENSOR] Current Bin Fill Level: %.2f%%\n", fillLevel);

    // Send update to API
    sendLevelUpdate(fillLevel);

    // 2. Classify waste if item is newly thrown
    // Trigger condition: if fill level increased suddenly (e.g. by > 5%)
    if (lastLevel >= 0.0 && (fillLevel - lastLevel) > 5.0) {
      Serial.println("[DETECTION] Sudden fill-level increase detected! Capturing waste image...");
      captureAndUploadImage();
    }
    
    lastLevel = fillLevel;
  }
}

// =========================
// AUXILIARY FUNCTIONS
// =========================

void connectToWiFi() {
  Serial.printf("[WIFI] Connecting to SSID: %s\n", ssid);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] WiFi Connected!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI ERROR] Connection timed out. Running offline...");
  }
}

float measureFillLevel() {
  // Clear trigger
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Set trigger HIGH for 10 microseconds
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read Echo travel duration in microseconds
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  // Calculate distance in cm
  float distanceCm = duration * 0.0343 / 2.0;
  
  if (duration == 0 || distanceCm > MAX_BIN_DEPTH_CM) {
    // Timeout or reading error
    return 0.0;
  }

  // Calculate percentage of waste fill level
  // Closer distance to sensor -> Higher waste volume
  float fillPercent = ((MAX_BIN_DEPTH_CM - distanceCm) / MAX_BIN_DEPTH_CM) * 100.0;
  return max(0.0f, min(100.0f, fillPercent));
}

void sendLevelUpdate(float fillLevel) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(server_url_level);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON Payload
  String jsonPayload = "{\"bin_id\":\"" + String(bin_id) + "\",\"fill_level\":" + String(fillLevel) + "}";
  
  Serial.print("[API HTTP] Updating fill level... ");
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("Response Code: %d\n", httpResponseCode);
    Serial.println("[API RESPONSE] " + response);
  } else {
    Serial.printf("Error updating level. HTTP Error Code: %d\n", httpResponseCode);
  }
  http.end();
}

void captureAndUploadImage() {
  if (WiFi.status() != WL_CONNECTED) return;

  // Flash LED on capture
  digitalWrite(FLASH_LED_PIN, HIGH);
  delay(500); // Wait for sensor to adjust to lighting

  camera_fb_t* fb = esp_camera_fb_get();
  digitalWrite(FLASH_LED_PIN, LOW); // Turn off flash

  if (!fb) {
    Serial.println("[CAMERA ERROR] Frame buffer acquisition failed.");
    return;
  }

  Serial.println("[API HTTP] Uploading captured frame for AI classification...");

  WiFiClient client;
  HTTPClient http;
  
  // Connect to target URL
  String url = String(server_url_predict) + "?bin_id=" + String(bin_id);
  http.begin(url);
  
  // Set multipart boundaries
  String boundary = "----EcoSortBoundary" + String(millis(), HEX);
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

  // Construct multipart payload segments
  String header = "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"file\"; filename=\"iot_capture.jpg\"\r\n";
  header += "Content-Type: image/jpeg\r\n\r\n";
  
  String footer = "\r\n--" + boundary + "--\r\n";
  
  size_t totalLength = header.length() + fb->len + footer.length();
  http.addHeader("Content-Length", String(totalLength));

  // Stream data out
  int responseCode = http.sendRequest("POST", (uint8_t*)header.c_str(), header.length());
  
  if (responseCode == 100) { // HTTP 100 Continue
    // Stream image binary buffer
    client.write(fb->buf, fb->len);
    // Stream boundary footer
    client.write((uint8_t*)footer.c_str(), footer.length());
  }

  // Release camera buffer frame
  esp_camera_fb_return(fb);

  // Process response
  int httpCode = http.POST(""); // Complete the request
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[API HTTP] Classification Result: Code %d\n", httpCode);
    Serial.println("[API RESPONSE] " + response);
  } else {
    Serial.printf("[API HTTP ERROR] Image upload failed: Code %d\n", httpCode);
  }
  http.end();
}
