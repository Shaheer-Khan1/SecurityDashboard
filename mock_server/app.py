"""
Python Mock Server for Digifort API
This simulates the Digifort security platform API responses
for development and testing purposes.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import uuid

app = Flask(__name__)
CORS(app)

# Mock Data Storage
mock_cameras = [
    {"name": "Camera 1 - Main Entrance", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.101", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0060, "group": "Entrance", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "Camera 2 - Parking Lot A", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.102", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0062, "group": "Parking", "status": "online", "working": True, "recordingHours": 120},
    {"name": "Camera 3 - Loading Dock", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.1.103", "connectionPort": 80, "latitude": 40.7125, "longitude": -74.0055, "group": "Loading", "status": "recording", "working": True, "recordingHours": 144},
    {"name": "Camera 4 - Reception", "active": True, "model": "Axis Q1615 Mk III", "deviceType": "IP Camera", "connectionAddress": "192.168.1.104", "connectionPort": 80, "latitude": 40.7129, "longitude": -74.0059, "group": "Interior", "status": "online", "working": True, "recordingHours": 96},
    {"name": "Camera 5 - Server Room", "active": True, "model": "Bosch FLEXIDOME IP", "deviceType": "IP Camera", "connectionAddress": "192.168.1.105", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0058, "group": "Secure", "status": "recording", "working": True, "recordingHours": 200},
    {"name": "Camera 6 - Warehouse A", "active": True, "model": "Samsung Wisenet XND", "deviceType": "IP Camera", "connectionAddress": "192.168.1.106", "connectionPort": 80, "latitude": 40.7131, "longitude": -74.0064, "group": "Warehouse", "status": "online", "working": True, "recordingHours": 72},
    {"name": "Camera 7 - Back Exit", "active": False, "model": "Axis P3255-LVE", "deviceType": "IP Camera", "connectionAddress": "192.168.1.107", "connectionPort": 80, "latitude": 40.7124, "longitude": -74.0052, "group": "Entrance", "status": "offline", "working": False, "recordingHours": 0},
    {"name": "Camera 8 - Hallway B", "active": True, "model": "Hikvision DS-2CD2H85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.1.108", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0057, "group": "Interior", "status": "recording", "working": True, "recordingHours": 110},
    {"name": "Camera 9 - Parking Lot B", "active": True, "model": "Dahua IPC-HFW5442H", "deviceType": "IP Camera", "connectionAddress": "192.168.1.109", "connectionPort": 80, "latitude": 40.7132, "longitude": -74.0066, "group": "Parking", "status": "online", "working": True, "recordingHours": 88},
    {"name": "Camera 10 - Emergency Exit", "active": True, "model": "Axis M3106-L Mk II", "deviceType": "IP Camera", "connectionAddress": "192.168.1.110", "connectionPort": 80, "latitude": 40.7123, "longitude": -74.0050, "group": "Entrance", "status": "recording", "working": True, "recordingHours": 156},
    {"name": "Camera 11 - Cafeteria", "active": True, "model": "Bosch AUTODOME IP", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.111", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0056, "group": "Interior", "status": "online", "working": True, "recordingHours": 64},
    {"name": "Camera 12 - Stairwell A", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.1.112", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0055, "group": "Interior", "status": "recording", "working": True, "recordingHours": 132},
    {"name": "Camera 13 - Roof Access", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.113", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0061, "group": "Secure", "status": "online", "working": True, "recordingHours": 48},
    {"name": "Camera 14 - Perimeter East", "active": True, "model": "Hikvision DS-2CD5A26G0", "deviceType": "IP Camera", "connectionAddress": "192.168.1.114", "connectionPort": 80, "latitude": 40.7134, "longitude": -74.0070, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 180},
    {"name": "Camera 15 - Perimeter West", "active": True, "model": "Dahua IPC-PFW8601", "deviceType": "Multi-sensor", "connectionAddress": "192.168.1.115", "connectionPort": 80, "latitude": 40.7120, "longitude": -74.0045, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 176},
    {"name": "Camera 16 - Gate Control", "active": False, "model": "Axis P1455-LE", "deviceType": "IP Camera", "connectionAddress": "192.168.1.116", "connectionPort": 80, "latitude": 40.7135, "longitude": -74.0072, "group": "Entrance", "status": "error", "working": False, "recordingHours": 0},
]

mock_groups = [
    {"name": "Entrance", "cameras": ["Camera 1 - Main Entrance", "Camera 7 - Back Exit", "Camera 10 - Emergency Exit", "Camera 16 - Gate Control"], "active": True},
    {"name": "Parking", "cameras": ["Camera 2 - Parking Lot A", "Camera 9 - Parking Lot B"], "active": True},
    {"name": "Loading", "cameras": ["Camera 3 - Loading Dock"], "active": True},
    {"name": "Interior", "cameras": ["Camera 4 - Reception", "Camera 8 - Hallway B", "Camera 11 - Cafeteria", "Camera 12 - Stairwell A"], "active": True},
    {"name": "Secure", "cameras": ["Camera 5 - Server Room", "Camera 13 - Roof Access"], "active": True},
    {"name": "Warehouse", "cameras": ["Camera 6 - Warehouse A"], "active": True},
    {"name": "Perimeter", "cameras": ["Camera 14 - Perimeter East", "Camera 15 - Perimeter West"], "active": True},
]

event_types = ["MOTION", "INTRUSION", "FACE_DETECTION", "VEHICLE_DETECTION", "TAMPERING", "LOITERING", "LINE_CROSSING", "ENTER", "EXIT"]

def generate_events(count=50):
    events = []
    now = datetime.now()
    for i in range(count):
        camera = random.choice(mock_cameras)
        event_time = now - timedelta(minutes=random.randint(1, 1440))
        events.append({
            "id": str(uuid.uuid4()),
            "recordCode": f"REC{random.randint(10000, 99999)}",
            "camera": camera["name"],
            "zone": random.choice(["Zone A", "Zone B", "Zone C", "Perimeter", None]),
            "eventType": random.choice(event_types),
            "objectClass": random.choice(["person", "vehicle", "unknown"]),
            "ruleName": random.choice(["Motion Rule 1", "Intrusion Alert", "Perimeter Watch", None]),
            "timestamp": event_time.isoformat(),
            "confidence": round(random.uniform(0.7, 0.99), 2),
        })
    return sorted(events, key=lambda x: x["timestamp"], reverse=True)

def generate_audit_logs(count=30):
    logs = []
    now = datetime.now()
    categories = ["USER_ACTION", "SERVER_CONNECTION", "SYSTEM", "SECURITY"]
    actions = [
        "User login successful",
        "Camera configuration updated",
        "Bookmark created",
        "Video export started",
        "System backup completed",
        "Alert rule modified",
        "User password changed",
        "PTZ control accessed",
        "Recording settings updated",
        "Server connection established",
        "Failed login attempt",
        "Camera offline detected",
        "Storage threshold warning",
    ]
    users = ["admin", "operator1", "security_manager", "viewer1", None]
    
    for i in range(count):
        log_time = now - timedelta(minutes=random.randint(1, 2880))
        logs.append({
            "id": str(uuid.uuid4()),
            "timestamp": log_time.isoformat(),
            "category": random.choice(categories),
            "action": random.choice(actions),
            "user": random.choice(users),
            "details": f"Additional details for log entry {i+1}",
            "ipAddress": f"192.168.1.{random.randint(1, 254)}",
        })
    return sorted(logs, key=lambda x: x["timestamp"], reverse=True)

mock_events = generate_events(50)
mock_audit_logs = generate_audit_logs(30)

mock_bookmarks = [
    {"id": str(uuid.uuid4()), "title": "Suspicious Activity - Main Entrance", "color": "red", "startDate": "2024-12-08", "startTime": "14:30", "endDate": "2024-12-08", "endTime": "14:45", "cameras": ["Camera 1 - Main Entrance"], "remarks": "Person loitering near entrance for extended period", "createdAt": datetime.now().isoformat()},
    {"id": str(uuid.uuid4()), "title": "Vehicle Incident - Parking", "color": "orange", "startDate": "2024-12-07", "startTime": "09:15", "endDate": "2024-12-07", "endTime": "09:25", "cameras": ["Camera 2 - Parking Lot A", "Camera 9 - Parking Lot B"], "remarks": "Minor collision in parking area", "createdAt": datetime.now().isoformat()},
    {"id": str(uuid.uuid4()), "title": "Delivery Verification", "color": "blue", "startDate": "2024-12-06", "startTime": "11:00", "endDate": "2024-12-06", "endTime": "11:30", "cameras": ["Camera 3 - Loading Dock"], "remarks": "Large shipment arrival for verification", "createdAt": datetime.now().isoformat()},
    {"id": str(uuid.uuid4()), "title": "After Hours Access", "color": "yellow", "startDate": "2024-12-05", "startTime": "23:45", "endDate": "2024-12-06", "endTime": "00:15", "cameras": ["Camera 5 - Server Room"], "remarks": "Authorized maintenance access to server room", "createdAt": datetime.now().isoformat()},
    {"id": str(uuid.uuid4()), "title": "Perimeter Check", "color": "green", "startDate": "2024-12-04", "startTime": "06:00", "endDate": "2024-12-04", "endTime": "06:30", "cameras": ["Camera 14 - Perimeter East", "Camera 15 - Perimeter West"], "remarks": "Morning security patrol verification", "createdAt": datetime.now().isoformat()},
]

mock_analytics_configs = [
    {"name": "Motion Detection - All Cameras", "active": True, "camera": "All", "events": ["MOTION"], "working": True, "status": "OK", "statusMessage": "Processing normally"},
    {"name": "Intrusion Detection - Perimeter", "active": True, "camera": "Perimeter Group", "events": ["INTRUSION", "LINE_CROSSING"], "working": True, "status": "OK", "statusMessage": "Active monitoring"},
    {"name": "Face Recognition - Entrance", "active": True, "camera": "Camera 1 - Main Entrance", "events": ["FACE_DETECTION"], "working": True, "status": "OK", "statusMessage": "Database: 1,247 faces"},
    {"name": "Vehicle Detection - Parking", "active": True, "camera": "Parking Group", "events": ["VEHICLE_DETECTION"], "working": True, "status": "OK", "statusMessage": "Active"},
    {"name": "Loitering Detection - Reception", "active": False, "camera": "Camera 4 - Reception", "events": ["LOITERING"], "working": False, "status": "DISABLED", "statusMessage": "Disabled by admin"},
    {"name": "Tampering Alert - All", "active": True, "camera": "All", "events": ["TAMPERING"], "working": True, "status": "OK", "statusMessage": "Monitoring"},
]

mock_counters = [
    {"id": str(uuid.uuid4()), "name": "People Counter - Main Entrance", "configuration": "Motion Detection - All Cameras", "value": 1247, "lastReset": "2024-12-01T00:00:00"},
    {"id": str(uuid.uuid4()), "name": "Vehicle Counter - Parking", "configuration": "Vehicle Detection - Parking", "value": 892, "lastReset": "2024-12-01T00:00:00"},
    {"id": str(uuid.uuid4()), "name": "Deliveries - Loading Dock", "configuration": "Motion Detection - All Cameras", "value": 156, "lastReset": "2024-12-01T00:00:00"},
    {"id": str(uuid.uuid4()), "name": "Security Events", "configuration": "Intrusion Detection - Perimeter", "value": 23, "lastReset": "2024-12-01T00:00:00"},
    {"id": str(uuid.uuid4()), "name": "Face Matches", "configuration": "Face Recognition - Entrance", "value": 487, "lastReset": "2024-12-01T00:00:00"},
    {"id": str(uuid.uuid4()), "name": "After Hours Access", "configuration": "Motion Detection - All Cameras", "value": 12, "lastReset": "2024-12-01T00:00:00"},
]

# Routes

@app.route("/")
def home():
    return jsonify({
        "name": "Digifort Mock API Server",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/Interface/Cameras/GetCameras",
            "/Interface/Cameras/GetGroups",
            "/Interface/Cameras/GetStatus",
            "/Interface/Analytics/GetAnalyticsConfigurations",
            "/Interface/Analytics/GetCounters",
            "/Interface/Analytics/GetStatus",
            "/Interface/Analytics/Search",
            "/Interface/Audit/Search",
            "/Interface/Cameras/Bookmarks/Search",
            "/Interface/Cameras/Bookmarks/Add",
        ]
    })

# Camera Endpoints
@app.route("/Interface/Cameras/GetCameras", methods=["GET"])
def get_cameras():
    return jsonify({"Cameras": mock_cameras})

@app.route("/Interface/Cameras/GetGroups", methods=["GET"])
def get_groups():
    return jsonify({"Groups": mock_groups})

@app.route("/Interface/Cameras/GetStatus", methods=["GET"])
def get_camera_status():
    cameras = request.args.get("Cameras", "").split(",") if request.args.get("Cameras") else None
    if cameras and cameras[0]:
        filtered = [c for c in mock_cameras if c["name"] in cameras]
        return jsonify({"Cameras": filtered})
    return jsonify({"Cameras": mock_cameras})

@app.route("/Interface/Cameras/Activation", methods=["GET", "POST"])
def camera_activation():
    camera_name = request.args.get("Camera") or request.json.get("camera")
    action = request.args.get("Action") or request.json.get("action")
    
    for cam in mock_cameras:
        if cam["name"] == camera_name:
            cam["active"] = action == "activate"
            cam["status"] = "online" if action == "activate" else "offline"
            cam["working"] = action == "activate"
            return jsonify({"success": True, "camera": cam})
    
    return jsonify({"success": False, "error": "Camera not found"}), 404

# Analytics Endpoints
@app.route("/Interface/Analytics/GetAnalyticsConfigurations", methods=["GET"])
def get_analytics_configurations():
    return jsonify({"AnalyticsConfigurations": mock_analytics_configs})

@app.route("/Interface/Analytics/GetCounters", methods=["GET"])
def get_counters():
    return jsonify({"Counters": mock_counters})

@app.route("/Interface/Analytics/ResetCounter", methods=["GET", "POST"])
def reset_counter():
    counter_id = request.args.get("CounterID") or request.json.get("counterId")
    
    for counter in mock_counters:
        if counter["id"] == counter_id:
            counter["value"] = 0
            counter["lastReset"] = datetime.now().isoformat()
            return jsonify({"success": True, "counter": counter})
    
    return jsonify({"success": False, "error": "Counter not found"}), 404

@app.route("/Interface/Analytics/GetStatus", methods=["GET"])
def get_analytics_status():
    return jsonify({"AnalyticsConfigurations": mock_analytics_configs})

@app.route("/Interface/Analytics/Search", methods=["GET"])
def search_analytics():
    # Parse filters from query params
    start_date = request.args.get("StartDate")
    end_date = request.args.get("EndDate")
    cameras = request.args.get("Cameras", "").split(",") if request.args.get("Cameras") else None
    event_types_filter = request.args.get("EventTypes", "").split(",") if request.args.get("EventTypes") else None
    
    filtered_events = mock_events.copy()
    
    if cameras and cameras[0]:
        filtered_events = [e for e in filtered_events if e["camera"] in cameras]
    
    if event_types_filter and event_types_filter[0]:
        filtered_events = [e for e in filtered_events if e["eventType"] in event_types_filter]
    
    return jsonify({"Events": filtered_events})

# Audit Endpoints
@app.route("/Interface/Audit/Search", methods=["GET"])
def search_audit():
    category = request.args.get("Category")
    keyword = request.args.get("Keyword")
    
    filtered_logs = mock_audit_logs.copy()
    
    if category:
        filtered_logs = [l for l in filtered_logs if l["category"] == category]
    
    if keyword:
        keyword_lower = keyword.lower()
        filtered_logs = [l for l in filtered_logs if 
                        keyword_lower in l["action"].lower() or 
                        (l["details"] and keyword_lower in l["details"].lower()) or
                        (l["user"] and keyword_lower in l["user"].lower())]
    
    return jsonify({"AuditLogs": filtered_logs})

# Bookmark Endpoints
@app.route("/Interface/Cameras/Bookmarks/Search", methods=["GET"])
def search_bookmarks():
    keyword = request.args.get("Keyword")
    color = request.args.get("Colors")
    
    filtered_bookmarks = mock_bookmarks.copy()
    
    if keyword:
        keyword_lower = keyword.lower()
        filtered_bookmarks = [b for b in filtered_bookmarks if 
                             keyword_lower in b["title"].lower() or 
                             (b["remarks"] and keyword_lower in b["remarks"].lower())]
    
    if color:
        colors = color.split(",")
        filtered_bookmarks = [b for b in filtered_bookmarks if b["color"] in colors]
    
    return jsonify({"Bookmarks": filtered_bookmarks})

@app.route("/Interface/Cameras/Bookmarks/Add", methods=["GET", "POST"])
def add_bookmark():
    if request.method == "POST":
        data = request.json
    else:
        data = {
            "title": request.args.get("Title"),
            "color": request.args.get("Color", "blue"),
            "startDate": request.args.get("StartDate"),
            "startTime": request.args.get("StartTime"),
            "endDate": request.args.get("EndDate"),
            "endTime": request.args.get("EndTime"),
            "cameras": request.args.get("Cameras", "").split(","),
            "remarks": request.args.get("Remarks"),
        }
    
    new_bookmark = {
        "id": str(uuid.uuid4()),
        "title": data.get("title"),
        "color": data.get("color", "blue"),
        "startDate": data.get("startDate"),
        "startTime": data.get("startTime"),
        "endDate": data.get("endDate"),
        "endTime": data.get("endTime"),
        "cameras": data.get("cameras", []),
        "remarks": data.get("remarks"),
        "createdAt": datetime.now().isoformat(),
    }
    
    mock_bookmarks.insert(0, new_bookmark)
    return jsonify({"success": True, "bookmark": new_bookmark})

@app.route("/Interface/Cameras/Bookmarks/Delete", methods=["DELETE", "POST"])
def delete_bookmark():
    bookmark_id = request.args.get("id") or (request.json.get("id") if request.json else None)
    
    global mock_bookmarks
    original_len = len(mock_bookmarks)
    mock_bookmarks = [b for b in mock_bookmarks if b["id"] != bookmark_id]
    
    if len(mock_bookmarks) < original_len:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Bookmark not found"}), 404

# Dashboard Stats
@app.route("/Interface/Dashboard/Stats", methods=["GET"])
def get_dashboard_stats():
    active_cameras = sum(1 for c in mock_cameras if c["active"])
    recording_cameras = sum(1 for c in mock_cameras if c.get("status") == "recording")
    offline_cameras = sum(1 for c in mock_cameras if not c["active"])
    critical_events = sum(1 for e in mock_events if e["eventType"] in ["INTRUSION", "TAMPERING", "FIRE", "SMOKE"])
    
    return jsonify({
        "totalCameras": len(mock_cameras),
        "activeCameras": active_cameras,
        "recordingCameras": recording_cameras,
        "offlineCameras": offline_cameras,
        "totalEvents": len(mock_events),
        "criticalEvents": min(critical_events, 5),
        "totalStorage": "4 TB",
        "usedStorage": "2.8 TB",
    })

# System Status
@app.route("/Interface/System/Status", methods=["GET"])
def get_system_status():
    return jsonify({
        "serverStatus": "online",
        "cpuUsage": random.randint(30, 60),
        "memoryUsage": random.randint(50, 75),
        "diskUsage": 70,
        "uptime": "14d 6h 32m",
        "lastSync": f"{random.randint(1, 5)} min ago",
    })

# Chart Data
@app.route("/Interface/Analytics/Chart", methods=["GET"])
def get_chart_data():
    hours = []
    now = datetime.now()
    for i in range(24):
        hour_time = now - timedelta(hours=23-i)
        hours.append({
            "time": hour_time.strftime("%H:00"),
            "events": random.randint(20, 100),
            "motion": random.randint(10, 60),
        })
    return jsonify(hours)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8089, debug=True)
