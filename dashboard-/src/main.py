import cv2
import mediapipe as mp
import numpy as np
import math
from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse
import uvicorn
from typing import AsyncIterator
import json
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import asyncio
import logging
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Initialize MediaPipe FaceMesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# 3D model points (approximate)
model_points = np.array([
    (0.0, 0.0, 0.0),          # Nose tip
    (0.0, -330.0, -65.0),     # Chin
    (-225.0, 170.0, -135.0),  # Left eye left corner
    (225.0, 170.0, -135.0),   # Right eye right corner
    (-150.0, -150.0, -125.0), # Left mouth corner
    (150.0, -150.0, -125.0)   # Right mouth corner
])

def rotation_matrix_to_euler_angles(R):
    sy = math.sqrt(R[0,0] * R[0,0] +  R[1,0] * R[1,0])
    singular = sy < 1e-6

    if not singular:
        x = math.atan2(R[2,1], R[2,2])
        y = math.atan2(-R[2,0], sy)
        z = math.atan2(R[1,0], R[0,0])
    else:
        x = math.atan2(-R[1,2], R[1,1])
        y = math.atan2(-R[2,0], sy)
        z = 0

    return np.array([math.degrees(x), math.degrees(y), math.degrees(z)])

class VideoCamera:
    def __init__(self):
        self.cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # Added CAP_DSHOW for Windows
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        self.yaw_smooth = 0
        self.pitch_smooth = 0
        self.alpha = 0.6

    def __del__(self):
        self.cap.release()

    def get_frame(self):
        success, frame = self.cap.read()
        if not success:
            return None, {}

        # Flip the frame horizontally for a later selfie-view display
        frame = cv2.flip(frame, 1)
        metrics = self.process_frame(frame)
        
        # Ensure the frame is encoded properly
        try:
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if not ret:
                return None, {}
            return buffer.tobytes(), metrics
        except Exception as e:
            print(f"Error encoding frame: {e}")
            return None, {}

    def process_frame(self, frame):
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        metrics = {"attention_score": 0, "gaze_score": 0}

        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark

            # Extract iris landmarks
            left_iris = landmarks[468]
            right_iris = landmarks[473]

            # Get eye corners
            left_eye_left = landmarks[33]
            left_eye_right = landmarks[133]
            right_eye_left = landmarks[362]
            right_eye_right = landmarks[263]

            # Calculate gaze ratios
            left_eye_width = left_eye_right.x - left_eye_left.x
            left_iris_x = left_iris.x - left_eye_left.x
            left_ratio = left_iris_x / left_eye_width if left_eye_width != 0 else 0.5

            right_eye_width = right_eye_right.x - right_eye_left.x
            right_iris_x = right_iris.x - right_eye_left.x
            right_ratio = right_iris_x / right_eye_width if right_eye_width != 0 else 0.5

            avg_gaze_ratio = (left_ratio + right_ratio) / 2

            # Head pose estimation
            image_points = np.array([
                (landmarks[4].x * frame.shape[1], landmarks[4].y * frame.shape[0]),
                (landmarks[152].x * frame.shape[1], landmarks[152].y * frame.shape[0]),
                (landmarks[33].x * frame.shape[1], landmarks[33].y * frame.shape[0]),
                (landmarks[263].x * frame.shape[1], landmarks[263].y * frame.shape[0]),
                (landmarks[61].x * frame.shape[1], landmarks[61].y * frame.shape[0]),
                (landmarks[291].x * frame.shape[1], landmarks[291].y * frame.shape[0])
            ], dtype="double")

            focal_length = frame.shape[1]
            center = (frame.shape[1]/2, frame.shape[0]/2)
            camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype="double")

            dist_coeffs = np.zeros((4,1))

            (success, rotation_vector, translation_vector) = cv2.solvePnP(
                model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
            )

            if success:
                R, _ = cv2.Rodrigues(rotation_vector)
                angles = rotation_matrix_to_euler_angles(R)
                yaw, pitch, _ = angles

                # Exponential smoothing
                self.yaw_smooth = self.alpha * yaw + (1 - self.alpha) * self.yaw_smooth
                self.pitch_smooth = self.alpha * pitch + (1 - self.alpha) * self.pitch_smooth

                # Calculate scores
                head_yaw_threshold = 30
                head_pitch_threshold = 25

                yaw_score = max(0, 1 - abs(self.yaw_smooth) / head_yaw_threshold)
                pitch_score = max(0, 1 - abs(self.pitch_smooth) / head_pitch_threshold)
                head_score = (yaw_score + pitch_score) / 2 * 100

                gaze_threshold = 0.25
                gaze_diff = abs(avg_gaze_ratio - 0.5)
                gaze_score = max(0, 1 - gaze_diff / gaze_threshold) * 100

                attention_score = 0.6 * head_score + 0.4 * gaze_score

                metrics = {
                    "attention_score": round(attention_score, 1),
                    "gaze_score": round(gaze_score, 1),
                    "head_yaw": round(self.yaw_smooth, 1),
                    "head_pitch": round(self.pitch_smooth, 1)
                }

        return metrics

camera = None

def get_camera():
    global camera
    if camera is None:
        camera = VideoCamera()
    return camera

@app.on_event("shutdown")
async def shutdown_event():
    global camera
    if camera:
        del camera

async def generate_frames() -> AsyncIterator[bytes]:
    camera = get_camera()
    while True:
        frame_bytes, _ = camera.get_frame()
        if frame_bytes is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        await asyncio.sleep(0.033)  # Approximately 30 FPS

@app.get("/video-feed")
async def video_feed():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/metrics")
async def get_metrics():
    try:
        camera = get_camera()
        _, metrics = camera.get_frame()
        logger.info(f"Calculated metrics: {metrics}")  # Debug log
        return metrics
    except Exception as e:
        logger.error(f"Error calculating metrics: {e}")
        return {"attention_score": 0, "gaze_score": 0, "error": str(e)}

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html>
        <head>
            <title>Attention Analysis</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    text-align: center;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: white;
                    border-radius: 10px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .video-feed {
                    margin: 20px 0;
                }
                .video-container {
                    position: relative;
                    width: 640px;
                    height: 480px;
                    margin: 0 auto;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .video-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .metrics {
                    margin: 20px 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                h1 {
                    color: #2c3e50;
                    margin-bottom: 30px;
                }
                h2 {
                    color: #34495e;
                    font-size: 1.5em;
                }
                p {
                    color: #2c3e50;
                    font-size: 1.1em;
                    margin: 10px 0;
                }
                .loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 1.2em;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Attention Analysis System</h1>
                <div class="video-feed">
                    <h2>Live Video Feed</h2>
                    <div class="video-container">
                        <div class="loading" id="loading">Loading video feed...</div>
                        <img src="/video-feed" onload="document.getElementById('loading').style.display='none'" />
                    </div>
                </div>
                <div class="metrics" id="metricsDiv">
                    <h2>Real-time Metrics</h2>
                    <p id="attentionScore">Attention Score: --</p>
                    <p id="gazeScore">Gaze Score: --</p>
                    <p id="headYaw">Head Yaw: --</p>
                    <p id="headPitch">Head Pitch: --</p>
                </div>
            </div>
            <script>
                function updateMetrics() {
                    fetch('/metrics')
                        .then(response => response.json())
                        .then(data => {
                            document.getElementById('attentionScore').textContent = `Attention Score: ${data.attention_score}%`;
                            document.getElementById('gazeScore').textContent = `Gaze Score: ${data.gaze_score}%`;
                            document.getElementById('headYaw').textContent = `Head Yaw: ${data.head_yaw}°`;
                            document.getElementById('headPitch').textContent = `Head Pitch: ${data.head_pitch}°`;
                        })
                        .catch(error => console.error('Error fetching metrics:', error));
                }
                
                // Update metrics every second
                setInterval(updateMetrics, 1000);
            </script>
        </body>
    </html>
    """



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True, workers=1) 


