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

# Mock Data Storage - Shopping Mall CCTV System
mock_cameras = [
    # Main Entrance (2 cameras)
    {"name": "CAM-ENTRANCE-LEFT", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.101", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0060, "group": "Entrance", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-ENTRANCE-RIGHT", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.102", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0061, "group": "Entrance", "status": "recording", "working": True, "recordingHours": 168},
    
    # Ground Floor (16 cameras)
    {"name": "CAM-GF-LOBBY", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.103", "connectionPort": 80, "latitude": 40.7129, "longitude": -74.0060, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-CORRIDOR-WEST", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.1.104", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0062, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-CORRIDOR-EAST", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.1.105", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0058, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-WEST-WING", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.1.106", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0063, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-EAST-WING", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.1.107", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0057, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-STAIRWELL-WEST", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.1.108", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0064, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-STAIRWELL-EAST", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.1.109", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0056, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-STORE-1", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.110", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0062, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-STORE-2", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.111", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0060, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-STORE-3", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.112", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0058, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-STORE-4", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.113", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0056, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-COURT-NORTH", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.114", "connectionPort": 80, "latitude": 40.7129, "longitude": -74.0059, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-FOODCOURT-WEST", "active": True, "model": "Hikvision DS-2CD2H85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.1.115", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0061, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-FOODCOURT-EAST", "active": True, "model": "Hikvision DS-2CD2H85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.1.116", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0057, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-GF-COURT-SOUTH", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.117", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0059, "group": "GroundFloor", "status": "recording", "working": True, "recordingHours": 168},
    
    # Second Floor (12 cameras)
    {"name": "CAM-2F-LOBBY", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.118", "connectionPort": 80, "latitude": 40.7129, "longitude": -74.0060, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-CORRIDOR-WEST", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.1.119", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0062, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-CORRIDOR-EAST", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.1.120", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0058, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-WEST-WING", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.1.121", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0063, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-EAST-WING", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.1.122", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0057, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-STAIRWELL-WEST", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.1.123", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0064, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-STAIRWELL-EAST", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.1.124", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0056, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-STORE-5", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.125", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0062, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-STORE-6", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.126", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0060, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-STORE-7", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.127", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0058, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-STORE-8", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.1.128", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0056, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-2F-BALCONY-SOUTH", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.129", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0059, "group": "SecondFloor", "status": "recording", "working": True, "recordingHours": 168},
    
    # Service Area (3 cameras)
    {"name": "CAM-LOADING-DOCK-LEFT", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.130", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0061, "group": "Service", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-LOADING-DOCK-RIGHT", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.131", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0059, "group": "Service", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-SERVICE-CORRIDOR", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.1.132", "connectionPort": 80, "latitude": 40.7125, "longitude": -74.0060, "group": "Service", "status": "recording", "working": True, "recordingHours": 168},
    
    # Parking (6 cameras)
    {"name": "CAM-PARKING-WEST-FRONT", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.133", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0065, "group": "Parking", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-PARKING-WEST-MID", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.134", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0065, "group": "Parking", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-PARKING-WEST-BACK", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.135", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0065, "group": "Parking", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-PARKING-EAST-FRONT", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.136", "connectionPort": 80, "latitude": 40.7130, "longitude": -74.0055, "group": "Parking", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-PARKING-EAST-MID", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.137", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0055, "group": "Parking", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-PARKING-EAST-BACK", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.1.138", "connectionPort": 80, "latitude": 40.7126, "longitude": -74.0055, "group": "Parking", "status": "recording", "working": True, "recordingHours": 168},
    
    # Perimeter (8 cameras)
    {"name": "CAM-ROOF-NW-CORNER", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.139", "connectionPort": 80, "latitude": 40.7131, "longitude": -74.0064, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-ROOF-NE-CORNER", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.140", "connectionPort": 80, "latitude": 40.7131, "longitude": -74.0056, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-ROOF-SW-CORNER", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.141", "connectionPort": 80, "latitude": 40.7125, "longitude": -74.0064, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-ROOF-SE-CORNER", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.1.142", "connectionPort": 80, "latitude": 40.7125, "longitude": -74.0056, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-SIDE-DOOR-WEST", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.1.143", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0066, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-SIDE-DOOR-EAST", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.1.144", "connectionPort": 80, "latitude": 40.7128, "longitude": -74.0054, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-EMERGENCY-EXIT-WEST", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.1.145", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0066, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-EMERGENCY-EXIT-EAST", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.1.146", "connectionPort": 80, "latitude": 40.7127, "longitude": -74.0054, "group": "Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    
    # HIGH SCHOOL CAMERAS (34 cameras)
    # Main Entrance
    {"name": "CAM-HS-MAIN-ENTRANCE-01", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.2.101", "connectionPort": 80, "latitude": 40.7150, "longitude": -74.0070, "group": "HighSchool-Entrance", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-MAIN-ENTRANCE-02", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.2.102", "connectionPort": 80, "latitude": 40.7150, "longitude": -74.0071, "group": "HighSchool-Entrance", "status": "recording", "working": True, "recordingHours": 168},
    
    # Main Hallways
    {"name": "CAM-HS-HALLWAY-CENTRAL-01", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.2.103", "connectionPort": 80, "latitude": 40.7151, "longitude": -74.0070, "group": "HighSchool-Hallways", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-HALLWAY-CENTRAL-02", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.2.104", "connectionPort": 80, "latitude": 40.7152, "longitude": -74.0070, "group": "HighSchool-Hallways", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-HALLWAY-CENTRAL-03", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.2.105", "connectionPort": 80, "latitude": 40.7153, "longitude": -74.0070, "group": "HighSchool-Hallways", "status": "recording", "working": True, "recordingHours": 168},
    
    # West Wing
    {"name": "CAM-HS-WEST-HALLWAY-01", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.2.106", "connectionPort": 80, "latitude": 40.7151, "longitude": -74.0073, "group": "HighSchool-WestWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-WEST-HALLWAY-02", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.2.107", "connectionPort": 80, "latitude": 40.7152, "longitude": -74.0073, "group": "HighSchool-WestWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-WEST-HALLWAY-03", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.2.108", "connectionPort": 80, "latitude": 40.7153, "longitude": -74.0073, "group": "HighSchool-WestWing", "status": "recording", "working": True, "recordingHours": 168},
    
    # East Wing
    {"name": "CAM-HS-EAST-HALLWAY-01", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.2.109", "connectionPort": 80, "latitude": 40.7151, "longitude": -74.0067, "group": "HighSchool-EastWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-EAST-HALLWAY-02", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.2.110", "connectionPort": 80, "latitude": 40.7152, "longitude": -74.0067, "group": "HighSchool-EastWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-EAST-HALLWAY-03", "active": True, "model": "Axis Q1615", "deviceType": "IP Camera", "connectionAddress": "192.168.2.111", "connectionPort": 80, "latitude": 40.7153, "longitude": -74.0067, "group": "HighSchool-EastWing", "status": "recording", "working": True, "recordingHours": 168},
    
    # Classrooms
    {"name": "CAM-HS-CLASSROOM-A101", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.2.112", "connectionPort": 80, "latitude": 40.7150, "longitude": -74.0072, "group": "HighSchool-Classrooms", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-CLASSROOM-A102", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.2.113", "connectionPort": 80, "latitude": 40.7151, "longitude": -74.0072, "group": "HighSchool-Classrooms", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-CLASSROOM-B201", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.2.114", "connectionPort": 80, "latitude": 40.7150, "longitude": -74.0068, "group": "HighSchool-Classrooms", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-CLASSROOM-B202", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.2.115", "connectionPort": 80, "latitude": 40.7151, "longitude": -74.0068, "group": "HighSchool-Classrooms", "status": "recording", "working": True, "recordingHours": 168},
    
    # Common Areas
    {"name": "CAM-HS-CAFETERIA-01", "active": True, "model": "Hikvision DS-2CD2H85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.2.116", "connectionPort": 80, "latitude": 40.7154, "longitude": -74.0071, "group": "HighSchool-CommonAreas", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-CAFETERIA-02", "active": True, "model": "Hikvision DS-2CD2H85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.2.117", "connectionPort": 80, "latitude": 40.7154, "longitude": -74.0069, "group": "HighSchool-CommonAreas", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-CAFETERIA-03", "active": True, "model": "Hikvision DS-2CD2H85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.2.118", "connectionPort": 80, "latitude": 40.7154, "longitude": -74.0070, "group": "HighSchool-CommonAreas", "status": "recording", "working": True, "recordingHours": 168},
    
    # Library
    {"name": "CAM-HS-LIBRARY-01", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.2.119", "connectionPort": 80, "latitude": 40.7152, "longitude": -74.0074, "group": "HighSchool-Library", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-LIBRARY-02", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.2.120", "connectionPort": 80, "latitude": 40.7151, "longitude": -74.0074, "group": "HighSchool-Library", "status": "recording", "working": True, "recordingHours": 168},
    
    # Gymnasium
    {"name": "CAM-HS-GYM-01", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.2.121", "connectionPort": 80, "latitude": 40.7153, "longitude": -74.0067, "group": "HighSchool-Gymnasium", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-GYM-02", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.2.122", "connectionPort": 80, "latitude": 40.7154, "longitude": -74.0066, "group": "HighSchool-Gymnasium", "status": "recording", "working": True, "recordingHours": 168},
    
    # Stairwells
    {"name": "CAM-HS-STAIR-WEST-01", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.2.123", "connectionPort": 80, "latitude": 40.7150, "longitude": -74.0074, "group": "HighSchool-Stairwells", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-STAIR-EAST-01", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.2.124", "connectionPort": 80, "latitude": 40.7150, "longitude": -74.0066, "group": "HighSchool-Stairwells", "status": "recording", "working": True, "recordingHours": 168},
    
    # Emergency Exits
    {"name": "CAM-HS-EXIT-WEST-01", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.2.125", "connectionPort": 80, "latitude": 40.7152, "longitude": -74.0075, "group": "HighSchool-Exits", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-EXIT-EAST-01", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.2.126", "connectionPort": 80, "latitude": 40.7152, "longitude": -74.0065, "group": "HighSchool-Exits", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-EXIT-REAR-01", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.2.127", "connectionPort": 80, "latitude": 40.7155, "longitude": -74.0070, "group": "HighSchool-Exits", "status": "recording", "working": True, "recordingHours": 168},
    
    # Parking & Exterior
    {"name": "CAM-HS-PARKING-01", "active": True, "model": "Hikvision DS-2CD2T85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.2.128", "connectionPort": 80, "latitude": 40.7150, "longitude": -74.0076, "group": "HighSchool-Exterior", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-PARKING-02", "active": True, "model": "Hikvision DS-2CD2T85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.2.129", "connectionPort": 80, "latitude": 40.7152, "longitude": -74.0076, "group": "HighSchool-Exterior", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-PARKING-03", "active": True, "model": "Hikvision DS-2CD2T85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.2.130", "connectionPort": 80, "latitude": 40.7154, "longitude": -74.0076, "group": "HighSchool-Exterior", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-PLAYGROUND-01", "active": True, "model": "Axis P1455-LE", "deviceType": "IP Camera", "connectionAddress": "192.168.2.131", "connectionPort": 80, "latitude": 40.7154, "longitude": -74.0064, "group": "HighSchool-Exterior", "status": "recording", "working": True, "recordingHours": 168},
    
    # Administrative Offices
    {"name": "CAM-HS-OFFICE-MAIN-01", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.2.132", "connectionPort": 80, "latitude": 40.7149, "longitude": -74.0071, "group": "HighSchool-Administration", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-HS-OFFICE-PRINCIPAL-01", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.2.133", "connectionPort": 80, "latitude": 40.7149, "longitude": -74.0072, "group": "HighSchool-Administration", "status": "recording", "working": True, "recordingHours": 168},
    
    # MOSCOW STATE UNIVERSITY CAMERAS (50 cameras)
    # Main Building Entrance
    {"name": "CAM-MSU-MAIN-ENTRANCE-01", "active": True, "model": "Axis P3717-PLE", "deviceType": "Panoramic Camera", "connectionAddress": "192.168.3.101", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5309, "group": "MSU-MainEntrance", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-MAIN-ENTRANCE-02", "active": True, "model": "Axis P3717-PLE", "deviceType": "Panoramic Camera", "connectionAddress": "192.168.3.102", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5308, "group": "MSU-MainEntrance", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-MAIN-ENTRANCE-03", "active": True, "model": "Axis P3717-PLE", "deviceType": "Panoramic Camera", "connectionAddress": "192.168.3.103", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5310, "group": "MSU-MainEntrance", "status": "recording", "working": True, "recordingHours": 168},
    
    # Central Tower
    {"name": "CAM-MSU-TOWER-BASE-01", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.104", "connectionPort": 80, "latitude": 55.7030, "longitude": 37.5309, "group": "MSU-Tower", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-TOWER-BASE-02", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.105", "connectionPort": 80, "latitude": 55.7028, "longitude": 37.5309, "group": "MSU-Tower", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-TOWER-MID-01", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.106", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5308, "group": "MSU-Tower", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-TOWER-MID-02", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.107", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5310, "group": "MSU-Tower", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-TOWER-TOP-01", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.108", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5309, "group": "MSU-Tower", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-TOWER-TOP-02", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.109", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5309, "group": "MSU-Tower", "status": "recording", "working": True, "recordingHours": 168},
    
    # West Wing
    {"name": "CAM-MSU-WEST-WING-ENTRANCE", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.3.110", "connectionPort": 80, "latitude": 55.7030, "longitude": 37.5305, "group": "MSU-WestWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-WEST-WING-CORRIDOR-01", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.111", "connectionPort": 80, "latitude": 55.7031, "longitude": 37.5305, "group": "MSU-WestWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-WEST-WING-CORRIDOR-02", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.112", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5305, "group": "MSU-WestWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-WEST-WING-CORRIDOR-03", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.113", "connectionPort": 80, "latitude": 55.7027, "longitude": 37.5305, "group": "MSU-WestWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-WEST-WING-ROOF", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.114", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5306, "group": "MSU-WestWing", "status": "recording", "working": True, "recordingHours": 168},
    
    # East Wing
    {"name": "CAM-MSU-EAST-WING-ENTRANCE", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.3.115", "connectionPort": 80, "latitude": 55.7030, "longitude": 37.5313, "group": "MSU-EastWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-EAST-WING-CORRIDOR-01", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.116", "connectionPort": 80, "latitude": 55.7031, "longitude": 37.5313, "group": "MSU-EastWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-EAST-WING-CORRIDOR-02", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.117", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5313, "group": "MSU-EastWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-EAST-WING-CORRIDOR-03", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.118", "connectionPort": 80, "latitude": 55.7027, "longitude": 37.5313, "group": "MSU-EastWing", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-EAST-WING-ROOF", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.119", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5312, "group": "MSU-EastWing", "status": "recording", "working": True, "recordingHours": 168},
    
    # Academic Buildings
    {"name": "CAM-MSU-LIBRARY-ENTRANCE", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.3.120", "connectionPort": 80, "latitude": 55.7031, "longitude": 37.5307, "group": "MSU-Academic", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-LIBRARY-READING-HALL", "active": True, "model": "Dahua IPC-HFW5831E", "deviceType": "IP Camera", "connectionAddress": "192.168.3.121", "connectionPort": 80, "latitude": 55.7031, "longitude": 37.5306, "group": "MSU-Academic", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-AUDITORIUM-MAIN", "active": True, "model": "Axis P3717-PLE", "deviceType": "Panoramic Camera", "connectionAddress": "192.168.3.122", "connectionPort": 80, "latitude": 55.7031, "longitude": 37.5311, "group": "MSU-Academic", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-AUDITORIUM-BALCONY", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.123", "connectionPort": 80, "latitude": 55.7031, "longitude": 37.5311, "group": "MSU-Academic", "status": "recording", "working": True, "recordingHours": 168},
    
    # Student Areas
    {"name": "CAM-MSU-CAFETERIA-MAIN", "active": True, "model": "Hikvision DS-2CD2H85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.3.124", "connectionPort": 80, "latitude": 55.7027, "longitude": 37.5307, "group": "MSU-StudentAreas", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-CAFETERIA-SEATING", "active": True, "model": "Hikvision DS-2CD2H85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.3.125", "connectionPort": 80, "latitude": 55.7027, "longitude": 37.5306, "group": "MSU-StudentAreas", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-STUDENT-CENTER", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.126", "connectionPort": 80, "latitude": 55.7027, "longitude": 37.5311, "group": "MSU-StudentAreas", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-RECREATION-AREA", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.127", "connectionPort": 80, "latitude": 55.7027, "longitude": 37.5312, "group": "MSU-StudentAreas", "status": "recording", "working": True, "recordingHours": 168},
    
    # Laboratories
    {"name": "CAM-MSU-LAB-BUILDING-A", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.3.128", "connectionPort": 80, "latitude": 55.7030, "longitude": 37.5304, "group": "MSU-Laboratories", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-LAB-BUILDING-B", "active": True, "model": "Samsung Wisenet PNM", "deviceType": "IP Camera", "connectionAddress": "192.168.3.129", "connectionPort": 80, "latitude": 55.7028, "longitude": 37.5304, "group": "MSU-Laboratories", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-LAB-CORRIDOR", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.130", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5304, "group": "MSU-Laboratories", "status": "recording", "working": True, "recordingHours": 168},
    
    # Administrative
    {"name": "CAM-MSU-ADMIN-ENTRANCE", "active": True, "model": "Hikvision DS-2CD2385", "deviceType": "IP Camera", "connectionAddress": "192.168.3.131", "connectionPort": 80, "latitude": 55.7031, "longitude": 37.5308, "group": "MSU-Administration", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-ADMIN-OFFICE", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.132", "connectionPort": 80, "latitude": 55.7031, "longitude": 37.5307, "group": "MSU-Administration", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-RECTOR-OFFICE", "active": True, "model": "Axis P3245-V", "deviceType": "IP Camera", "connectionAddress": "192.168.3.133", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5309, "group": "MSU-Administration", "status": "recording", "working": True, "recordingHours": 168},
    
    # Perimeter & Security
    {"name": "CAM-MSU-NORTH-GATE", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.134", "connectionPort": 80, "latitude": 55.7033, "longitude": 37.5309, "group": "MSU-Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-SOUTH-GATE", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.135", "connectionPort": 80, "latitude": 55.7025, "longitude": 37.5309, "group": "MSU-Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-WEST-GATE", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.136", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5303, "group": "MSU-Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-EAST-GATE", "active": True, "model": "Axis Q6155-E", "deviceType": "PTZ Camera", "connectionAddress": "192.168.3.137", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5315, "group": "MSU-Perimeter", "status": "recording", "working": True, "recordingHours": 168},
    
    # Parking & Exterior
    {"name": "CAM-MSU-PARKING-NORTH-01", "active": True, "model": "Hikvision DS-2CD2T85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.3.138", "connectionPort": 80, "latitude": 55.7032, "longitude": 37.5307, "group": "MSU-Parking", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-PARKING-NORTH-02", "active": True, "model": "Hikvision DS-2CD2T85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.3.139", "connectionPort": 80, "latitude": 55.7032, "longitude": 37.5311, "group": "MSU-Parking", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-PARKING-SOUTH-01", "active": True, "model": "Hikvision DS-2CD2T85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.3.140", "connectionPort": 80, "latitude": 55.7026, "longitude": 37.5307, "group": "MSU-Parking", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-PARKING-SOUTH-02", "active": True, "model": "Hikvision DS-2CD2T85G1", "deviceType": "IP Camera", "connectionAddress": "192.168.3.141", "connectionPort": 80, "latitude": 55.7026, "longitude": 37.5311, "group": "MSU-Parking", "status": "recording", "working": True, "recordingHours": 168},
    
    # Garden & Plaza
    {"name": "CAM-MSU-PLAZA-CENTER", "active": True, "model": "Axis P3717-PLE", "deviceType": "Panoramic Camera", "connectionAddress": "192.168.3.142", "connectionPort": 80, "latitude": 55.7030, "longitude": 37.5309, "group": "MSU-Plaza", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-GARDEN-WEST", "active": True, "model": "Axis P1455-LE", "deviceType": "IP Camera", "connectionAddress": "192.168.3.143", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5307, "group": "MSU-Plaza", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-GARDEN-EAST", "active": True, "model": "Axis P1455-LE", "deviceType": "IP Camera", "connectionAddress": "192.168.3.144", "connectionPort": 80, "latitude": 55.7029, "longitude": 37.5311, "group": "MSU-Plaza", "status": "recording", "working": True, "recordingHours": 168},
    
    # Emergency Points
    {"name": "CAM-MSU-EMERGENCY-WEST-01", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.3.145", "connectionPort": 80, "latitude": 55.7030, "longitude": 37.5304, "group": "MSU-Emergency", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-EMERGENCY-WEST-02", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.3.146", "connectionPort": 80, "latitude": 55.7028, "longitude": 37.5304, "group": "MSU-Emergency", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-EMERGENCY-EAST-01", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.3.147", "connectionPort": 80, "latitude": 55.7030, "longitude": 37.5314, "group": "MSU-Emergency", "status": "recording", "working": True, "recordingHours": 168},
    {"name": "CAM-MSU-EMERGENCY-EAST-02", "active": True, "model": "Axis M3106-L", "deviceType": "IP Camera", "connectionAddress": "192.168.3.148", "connectionPort": 80, "latitude": 55.7028, "longitude": 37.5314, "group": "MSU-Emergency", "status": "recording", "working": True, "recordingHours": 168},
]

mock_groups = [
    {"name": "Entrance", "cameras": ["CAM-ENTRANCE-LEFT", "CAM-ENTRANCE-RIGHT"], "active": True},
    {"name": "GroundFloor", "cameras": ["CAM-GF-LOBBY", "CAM-GF-CORRIDOR-WEST", "CAM-GF-CORRIDOR-EAST", "CAM-GF-WEST-WING", "CAM-GF-EAST-WING", "CAM-GF-STAIRWELL-WEST", "CAM-GF-STAIRWELL-EAST", "CAM-GF-STORE-1", "CAM-GF-STORE-2", "CAM-GF-STORE-3", "CAM-GF-STORE-4", "CAM-GF-COURT-NORTH", "CAM-GF-FOODCOURT-WEST", "CAM-GF-FOODCOURT-EAST", "CAM-GF-COURT-SOUTH"], "active": True},
    {"name": "SecondFloor", "cameras": ["CAM-2F-LOBBY", "CAM-2F-CORRIDOR-WEST", "CAM-2F-CORRIDOR-EAST", "CAM-2F-WEST-WING", "CAM-2F-EAST-WING", "CAM-2F-STAIRWELL-WEST", "CAM-2F-STAIRWELL-EAST", "CAM-2F-STORE-5", "CAM-2F-STORE-6", "CAM-2F-STORE-7", "CAM-2F-STORE-8", "CAM-2F-BALCONY-SOUTH"], "active": True},
    {"name": "Service", "cameras": ["CAM-LOADING-DOCK-LEFT", "CAM-LOADING-DOCK-RIGHT", "CAM-SERVICE-CORRIDOR"], "active": True},
    {"name": "Parking", "cameras": ["CAM-PARKING-WEST-FRONT", "CAM-PARKING-WEST-MID", "CAM-PARKING-WEST-BACK", "CAM-PARKING-EAST-FRONT", "CAM-PARKING-EAST-MID", "CAM-PARKING-EAST-BACK"], "active": True},
    {"name": "Perimeter", "cameras": ["CAM-ROOF-NW-CORNER", "CAM-ROOF-NE-CORNER", "CAM-ROOF-SW-CORNER", "CAM-ROOF-SE-CORNER", "CAM-SIDE-DOOR-WEST", "CAM-SIDE-DOOR-EAST", "CAM-EMERGENCY-EXIT-WEST", "CAM-EMERGENCY-EXIT-EAST"], "active": True},
    
    # High School Groups
    {"name": "HighSchool-Entrance", "cameras": ["CAM-HS-MAIN-ENTRANCE-01", "CAM-HS-MAIN-ENTRANCE-02"], "active": True},
    {"name": "HighSchool-Hallways", "cameras": ["CAM-HS-HALLWAY-CENTRAL-01", "CAM-HS-HALLWAY-CENTRAL-02", "CAM-HS-HALLWAY-CENTRAL-03"], "active": True},
    {"name": "HighSchool-WestWing", "cameras": ["CAM-HS-WEST-HALLWAY-01", "CAM-HS-WEST-HALLWAY-02", "CAM-HS-WEST-HALLWAY-03"], "active": True},
    {"name": "HighSchool-EastWing", "cameras": ["CAM-HS-EAST-HALLWAY-01", "CAM-HS-EAST-HALLWAY-02", "CAM-HS-EAST-HALLWAY-03"], "active": True},
    {"name": "HighSchool-Classrooms", "cameras": ["CAM-HS-CLASSROOM-A101", "CAM-HS-CLASSROOM-A102", "CAM-HS-CLASSROOM-B201", "CAM-HS-CLASSROOM-B202"], "active": True},
    {"name": "HighSchool-CommonAreas", "cameras": ["CAM-HS-CAFETERIA-01", "CAM-HS-CAFETERIA-02", "CAM-HS-CAFETERIA-03"], "active": True},
    {"name": "HighSchool-Library", "cameras": ["CAM-HS-LIBRARY-01", "CAM-HS-LIBRARY-02"], "active": True},
    {"name": "HighSchool-Gymnasium", "cameras": ["CAM-HS-GYM-01", "CAM-HS-GYM-02"], "active": True},
    {"name": "HighSchool-Stairwells", "cameras": ["CAM-HS-STAIR-WEST-01", "CAM-HS-STAIR-EAST-01"], "active": True},
    {"name": "HighSchool-Exits", "cameras": ["CAM-HS-EXIT-WEST-01", "CAM-HS-EXIT-EAST-01", "CAM-HS-EXIT-REAR-01"], "active": True},
    {"name": "HighSchool-Exterior", "cameras": ["CAM-HS-PARKING-01", "CAM-HS-PARKING-02", "CAM-HS-PARKING-03", "CAM-HS-PLAYGROUND-01"], "active": True},
    {"name": "HighSchool-Administration", "cameras": ["CAM-HS-OFFICE-MAIN-01", "CAM-HS-OFFICE-PRINCIPAL-01"], "active": True},
    
    # Moscow State University Groups
    {"name": "MSU-MainEntrance", "cameras": ["CAM-MSU-MAIN-ENTRANCE-01", "CAM-MSU-MAIN-ENTRANCE-02", "CAM-MSU-MAIN-ENTRANCE-03"], "active": True},
    {"name": "MSU-Tower", "cameras": ["CAM-MSU-TOWER-BASE-01", "CAM-MSU-TOWER-BASE-02", "CAM-MSU-TOWER-MID-01", "CAM-MSU-TOWER-MID-02", "CAM-MSU-TOWER-TOP-01", "CAM-MSU-TOWER-TOP-02"], "active": True},
    {"name": "MSU-WestWing", "cameras": ["CAM-MSU-WEST-WING-ENTRANCE", "CAM-MSU-WEST-WING-CORRIDOR-01", "CAM-MSU-WEST-WING-CORRIDOR-02", "CAM-MSU-WEST-WING-CORRIDOR-03", "CAM-MSU-WEST-WING-ROOF"], "active": True},
    {"name": "MSU-EastWing", "cameras": ["CAM-MSU-EAST-WING-ENTRANCE", "CAM-MSU-EAST-WING-CORRIDOR-01", "CAM-MSU-EAST-WING-CORRIDOR-02", "CAM-MSU-EAST-WING-CORRIDOR-03", "CAM-MSU-EAST-WING-ROOF"], "active": True},
    {"name": "MSU-Academic", "cameras": ["CAM-MSU-LIBRARY-ENTRANCE", "CAM-MSU-LIBRARY-READING-HALL", "CAM-MSU-AUDITORIUM-MAIN", "CAM-MSU-AUDITORIUM-BALCONY"], "active": True},
    {"name": "MSU-StudentAreas", "cameras": ["CAM-MSU-CAFETERIA-MAIN", "CAM-MSU-CAFETERIA-SEATING", "CAM-MSU-STUDENT-CENTER", "CAM-MSU-RECREATION-AREA"], "active": True},
    {"name": "MSU-Laboratories", "cameras": ["CAM-MSU-LAB-BUILDING-A", "CAM-MSU-LAB-BUILDING-B", "CAM-MSU-LAB-CORRIDOR"], "active": True},
    {"name": "MSU-Administration", "cameras": ["CAM-MSU-ADMIN-ENTRANCE", "CAM-MSU-ADMIN-OFFICE", "CAM-MSU-RECTOR-OFFICE"], "active": True},
    {"name": "MSU-Perimeter", "cameras": ["CAM-MSU-NORTH-GATE", "CAM-MSU-SOUTH-GATE", "CAM-MSU-WEST-GATE", "CAM-MSU-EAST-GATE"], "active": True},
    {"name": "MSU-Parking", "cameras": ["CAM-MSU-PARKING-NORTH-01", "CAM-MSU-PARKING-NORTH-02", "CAM-MSU-PARKING-SOUTH-01", "CAM-MSU-PARKING-SOUTH-02"], "active": True},
    {"name": "MSU-Plaza", "cameras": ["CAM-MSU-PLAZA-CENTER", "CAM-MSU-GARDEN-WEST", "CAM-MSU-GARDEN-EAST"], "active": True},
    {"name": "MSU-Emergency", "cameras": ["CAM-MSU-EMERGENCY-WEST-01", "CAM-MSU-EMERGENCY-WEST-02", "CAM-MSU-EMERGENCY-EAST-01", "CAM-MSU-EMERGENCY-EAST-02"], "active": True},
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
