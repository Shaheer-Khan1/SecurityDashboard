"""
Digifort API Dummy Data Server
==============================
Serves realistic dummy data in the original Digifort HTTP API schema
(Response.Code / Response.Data / PascalCase fields).

Includes ~100 cameras, ~100 alerts (alarms), and full server/IO/analytics data
structured by Region → Site for regional pie-chart drill-down.

Run:
    python digifort_dummy_server.py
    python digifort_dummy_server.py --export ../dummy_data.json
    python digifort_dummy_server.py --port 8089

Point the Node backend at it:
    $env:DIGIFORT_API_URL="http://127.0.0.1:8089"
"""

from __future__ import annotations

import argparse
import json
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS

# ─── Regional hierarchy (SAIB-style bank security sites) ─────────────────────

REGIONS: list[dict[str, Any]] = [
    {
        "name": "Central Region",
        "sites": ["Riyadh Main Branch", "Riyadh Data Center", "Qassim Branch", "Hail ATM Cluster"],
        "lat_base": 24.7136,
        "lng_base": 46.6753,
    },
    {
        "name": "Eastern Region",
        "sites": ["Dammam HQ", "Al Khobar Branch", "Jubail Industrial", "Hofuf Branch"],
        "lat_base": 26.3927,
        "lng_base": 49.9777,
    },
    {
        "name": "Western Region",
        "sites": ["Jeddah HQ", "Makkah Branch", "Madinah Branch", "Taif Branch"],
        "lat_base": 21.4858,
        "lng_base": 39.1925,
    },
    {
        "name": "Southern Region",
        "sites": ["Abha Branch", "Jazan Branch", "Najran ATM Cluster", "Bisha Branch"],
        "lat_base": 18.2164,
        "lng_base": 42.5053,
    },
    {
        "name": "Northern Region",
        "sites": ["Tabuk Branch", "Arar Branch", "Sakaka Branch", "Yanbu Branch"],
        "lat_base": 28.3838,
        "lng_base": 36.5550,
    },
]

CAMERA_MODELS = [
    ("Bosch DINION IP 5000", 1),
    ("Bosch AUTODOME IP 7000", 1),
    ("Bosch FLEXIDOME IP 8000", 1),
    ("Hikvision DS-2CD2385G1", 1),
    ("Axis P3245-V", 1),
    ("Axis Q6155-E PTZ", 1),
    ("Dahua IPC-HFW5831E", 1),
]

ALARM_EVENT_TYPES = [
    "INTRUSION", "MOTION", "TAMPERING", "LOITERING", "LINE_CROSSING",
    "FIRE", "SMOKE", "FACE_DETECTION", "VEHICLE_DETECTION", "ABANDONED_OBJECT",
]

ALARM_RULES = [
    "Perimeter Breach", "After-Hours Motion", "Door Forced Open",
    "ATM Tamper", "Vault Intrusion", "Parking Lot Loitering",
    "Fire Panel Alarm", "Smoke Detection", "Tailgating Alert",
    "Unauthorized Access",
]

ZONES = ["Perimeter", "Lobby", "ATM Area", "Vault", "Parking", "Server Room", "Teller Line", "Loading Dock"]

# ─── Digifort response envelope ───────────────────────────────────────────────

def digifort_response(data: dict[str, Any], code: int = 0, message: str = "OK") -> dict[str, Any]:
    return {"Response": {"Code": code, "Message": message, "Data": data}}


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def fmt_digifort_ts(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


# ─── Data generation ──────────────────────────────────────────────────────────

def generate_cameras(count: int = 100) -> tuple[list[dict], list[dict], list[dict]]:
    """Returns (cameras, statuses, groups)."""
    cameras: list[dict] = []
    statuses: list[dict] = []
    groups_map: dict[str, list[str]] = {}

    cam_idx = 0
    for region in REGIONS:
        for site in region["sites"]:
            group_id = str(uuid.uuid4())
            group_key = f"{region['name']} / {site}"
            groups_map[group_key] = []

            for pos in range(count // (len(REGIONS) * len(REGIONS[0]["sites"]))):
                cam_idx += 1
                if cam_idx > count:
                    break

                region_code = region["name"][:2].upper().replace(" ", "")
                site_code = "".join(w[0] for w in site.split()[:2]).upper()
                name = f"CAM-{region_code}-{site_code}-{pos + 1:02d}"

                model, device_type = random.choice(CAMERA_MODELS)
                active = random.random() > 0.08
                working = active and random.random() > 0.12
                recording = working and random.random() > 0.15

                lat = region["lat_base"] + random.uniform(-0.08, 0.08)
                lng = region["lng_base"] + random.uniform(-0.08, 0.08)
                ip_octet = 100 + (cam_idx % 150)

                memo = json.dumps({"region": region["name"], "site": site})

                cam = {
                    "Name": name,
                    "Description": f"{site} — {random.choice(ZONES)}",
                    "Active": active,
                    "Model": model,
                    "DeviceType": device_type,
                    "ConnectionAddress": f"10.{cam_idx // 256}.{cam_idx % 256}.{ip_octet % 254 + 1}",
                    "ConnectionPort": 80,
                    "Latitude": f"{lat:.6f}",
                    "Longitude": f"{lng:.6f}",
                    "Memo": memo,
                    "MediaProfiles": "Recording,Visualization",
                    "Group": group_id,
                }
                cameras.append(cam)
                groups_map[group_key].append(name)

                statuses.append({
                    "Name": name,
                    "Active": active,
                    "Working": working,
                    "ActiveTime": random.randint(3600, 864000),
                    "InactiveTime": 0 if working else random.randint(60, 7200),
                    "ConfiguredToRecord": recording or random.random() > 0.3,
                    "WritingToDisk": recording,
                    "RecordingFPS": random.randint(15, 30) if recording else 0,
                    "RecordingHours": round(random.uniform(120, 8760), 1) if recording else 0,
                    "RecordingHoursEstimative": round(random.uniform(200, 9000), 1),
                    "Status": "RECORDING" if recording else ("ONLINE" if working else "OFFLINE"),
                })

            if cam_idx >= count:
                break
        if cam_idx >= count:
            break

    # Pad to exactly `count` if rounding left us short
    while len(cameras) < count:
        cam_idx += 1
        region = REGIONS[cam_idx % len(REGIONS)]
        site = region["sites"][cam_idx % len(region["sites"])]
        name = f"CAM-EXTRA-{cam_idx:03d}"
        cameras.append({
            "Name": name,
            "Description": f"{site} — Extra camera",
            "Active": True,
            "Model": "Bosch DINION IP 5000",
            "DeviceType": 1,
            "ConnectionAddress": f"10.0.{cam_idx}.1",
            "ConnectionPort": 80,
            "Latitude": f"{region['lat_base']:.6f}",
            "Longitude": f"{region['lng_base']:.6f}",
            "Memo": json.dumps({"region": region["name"], "site": site}),
            "MediaProfiles": "Recording,Visualization",
            "Group": str(uuid.uuid4()),
        })
        statuses.append({
            "Name": name, "Active": True, "Working": True,
            "ActiveTime": 3600, "InactiveTime": 0,
            "ConfiguredToRecord": True, "WritingToDisk": True,
            "RecordingFPS": 25, "RecordingHours": 500.0,
            "RecordingHoursEstimative": 600.0, "Status": "RECORDING",
        })

    groups = [
        {"Name": key, "Cameras": cams, "Active": True}
        for key, cams in groups_map.items()
    ]

    return cameras[:count], statuses[:count], groups


def generate_alerts(count: int, cameras: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Generate ~count alerts (alarms) as Digifort AnalyticsRecords + frontend Events alias.
    ~45% ACTIVE (open), ~55% CLOSED.
    """
    analytics_records: list[dict] = []
    frontend_events: list[dict] = []
    base = now_utc()

    for i in range(count):
        cam = cameras[i % len(cameras)]
        memo = json.loads(cam.get("Memo") or "{}")
        region = memo.get("region", "Central Region")
        site = memo.get("site", "Unknown Site")

        is_active = random.random() < 0.45
        alarm_status = "ACTIVE" if is_active else "CLOSED"

        start = base - timedelta(hours=random.randint(1, 720))
        end = None if is_active else start + timedelta(minutes=random.randint(5, 180))

        event_type = random.choice(ALARM_EVENT_TYPES)
        record_code = 98000 + i

        record = {
            "RecordCode": record_code,
            "Camera": cam["Name"],
            "StartDate": fmt_digifort_ts(start),
            "EndDate": fmt_digifort_ts(end) if end else "",
            "Zone": random.choice(ZONES),
            "EventType": event_type,
            "RuleName": random.choice(ALARM_RULES),
            "ObjectClass": random.choice(["Person", "Vehicle", "Unknown", "Unclassified"]),
            "MetadataPresent": False,
            # Alarm-specific extensions for regional pie charts
            "AlarmStatus": alarm_status,
            "Region": region,
            "Site": site,
            "Severity": random.choice(["Critical", "High", "Medium", "Low"]),
            "Description": f"{alarm_status} {event_type} at {site} — {random.choice(ALARM_RULES)}",
        }
        analytics_records.append(record)

        frontend_events.append({
            "id": str(record_code),
            "recordCode": str(record_code),
            "camera": cam["Name"],
            "zone": record["Zone"],
            "eventType": event_type,
            "objectClass": record["ObjectClass"].lower(),
            "ruleName": record["RuleName"],
            "timestamp": start.isoformat(),
            "confidence": round(random.uniform(0.72, 0.99), 2),
            "alarmStatus": alarm_status.lower(),
            "region": region,
            "site": site,
            "severity": record["Severity"],
            "description": record["Description"],
            "isAlarm": True,
        })

    analytics_records.sort(key=lambda r: r["StartDate"], reverse=True)
    frontend_events.sort(key=lambda e: e["timestamp"], reverse=True)
    return analytics_records, frontend_events


def generate_server_info() -> dict:
    uptime = random.randint(500_000, 2_000_000)
    now = now_utc()
    return {
        "Edition": "ENTERPRISE",
        "Version": "7.4.2.0",
        "ReleaseDate": "2026.04.30",
        "ReleaseType": "Beta 3",
        "Platform": "Windows",
        "UpTime": uptime,
        "Date": now.strftime("%Y.%m.%d"),
        "Time": now.strftime("%H.%M.%S") + ".000",
        "DateTime": fmt_digifort_ts(now),
        "UTCDateTime": fmt_digifort_ts(now),
        "ServerType": "MASTER",
    }


def generate_server_usage(cameras: list[dict], alerts: list[dict]) -> dict:
    active = sum(1 for c in cameras if c.get("Active"))
    return {
        "Processor": random.randint(18, 62),
        "GlobalMemory": 8_589_934_592,
        "ServerMemory": random.randint(800_000_000, 2_400_000_000),
        "Connections": random.randint(40, 120),
        "Clients": random.randint(5, 18),
        "InputTraffic": random.randint(80_000, 250_000),
        "OutputTraffic": random.randint(50_000, 180_000),
        "ActiveCameras": active,
        "TotalCameras": len(cameras),
        "ActiveAlarms": sum(1 for a in alerts if a.get("AlarmStatus") == "ACTIVE"),
        "TotalAlarms": len(alerts),
    }


def generate_io_devices() -> tuple[list[dict], list[dict]]:
    devices, statuses = [], []
    for i, (region, io_type) in enumerate([
        ("Central Region", "Alarm Panel"),
        ("Eastern Region", "Door Controller"),
        ("Western Region", "Fire Panel"),
        ("Southern Region", "Motion Sensor Hub"),
        ("Northern Region", "Access Control"),
    ]):
        name = f"IO-{region[:2].upper()}-{io_type[:3].upper()}-{i + 1:02d}"
        active = random.random() > 0.1
        working = active and random.random() > 0.08
        devices.append({
            "Name": name,
            "Description": f"{io_type} — {region}",
            "Active": active,
            "DeviceType": io_type,
            "ConnectionAddress": f"192.168.10.{i + 10}",
            "ConnectionPort": 502,
        })
        statuses.append({
            "Name": name,
            "Active": active,
            "Working": working,
            "Status": "OK" if working else "FAULT",
            "StatusMessage": "Normal operation" if working else "Communication lost",
        })
    return devices, statuses


def generate_global_events() -> list[dict]:
    events = []
    for region in REGIONS:
        events.append({
            "DUID": str(uuid.uuid4()).upper(),
            "Name": f"After-Hours Alert — {region['name']}",
            "Description": f"Triggers when motion detected outside business hours in {region['name']}",
            "Active": True,
            "Latitude": f"{region['lat_base']:.6f}",
            "Longitude": f"{region['lng_base']:.6f}",
        })
    return events


def generate_scheduled_events() -> list[dict]:
    return [
        {"Name": "Nightly Backup", "Description": "System backup at 02:00", "Active": True,
         "Schedule": "Daily 02:00", "LastRun": fmt_digifort_ts(now_utc() - timedelta(hours=6))},
        {"Name": "Weekly Report", "Description": "Security summary email", "Active": True,
         "Schedule": "Sunday 08:00", "LastRun": fmt_digifort_ts(now_utc() - timedelta(days=2))},
        {"Name": "Camera Health Check", "Description": "Ping all cameras", "Active": True,
         "Schedule": "Every 15 min", "LastRun": fmt_digifort_ts(now_utc() - timedelta(minutes=10))},
    ]


def generate_analytics_configs(cameras: list[dict]) -> list[dict]:
    configs = [
        {"Name": "Intrusion — All Sites", "Active": True, "Camera": "All",
         "Events": ["INTRUSION", "LINE_CROSSING"], "Working": True,
         "Status": "OK", "StatusMessage": "Monitoring all regions"},
        {"Name": "Fire & Smoke Detection", "Active": True, "Camera": "All",
         "Events": ["FIRE", "SMOKE"], "Working": True,
         "Status": "OK", "StatusMessage": "Linked to BIS fire panel"},
        {"Name": "ATM Tamper Watch", "Active": True, "Camera": "ATM Area",
         "Events": ["TAMPERING", "LOITERING"], "Working": True,
         "Status": "OK", "StatusMessage": "Active on 24 ATM clusters"},
        {"Name": "Vehicle — Parking Lots", "Active": True, "Camera": "Parking",
         "Events": ["VEHICLE_DETECTION", "ILLEGAL_PARKING"], "Working": True,
         "Status": "OK", "StatusMessage": "Normal"},
        {"Name": "Face Recognition — Entrances", "Active": False, "Camera": "Lobby",
         "Events": ["FACE_DETECTION"], "Working": False,
         "Status": "DISABLED", "StatusMessage": "Pending license upgrade"},
    ]
    return configs


def generate_audit_logs(count: int = 50) -> list[dict]:
    logs = []
    base = now_utc()
    categories = ["USER_ACTION", "SERVER_CONNECTION", "SYSTEM", "SECURITY"]
    actions = [
        "User login successful", "Alarm acknowledged", "Alarm closed",
        "Camera configuration updated", "Failed login attempt",
        "BIS panel event received", "Recording export started",
        "System backup completed", "User password changed",
    ]
    users = ["admin", "operator1", "security_manager", "bis_integration"]
    for i in range(count):
        t = base - timedelta(minutes=random.randint(1, 4320))
        logs.append({
            "ID": str(uuid.uuid4()),
            "Timestamp": fmt_digifort_ts(t),
            "Category": random.choice(categories),
            "Action": random.choice(actions),
            "User": random.choice(users),
            "Details": f"Audit entry {i + 1}",
            "IPAddress": f"10.0.{random.randint(1, 50)}.{random.randint(1, 254)}",
        })
    return sorted(logs, key=lambda l: l["Timestamp"], reverse=True)


def generate_chart_data() -> list[dict]:
    base = now_utc()
    return [
        {
            "time": (base - timedelta(hours=23 - i)).strftime("%H:00"),
            "events": random.randint(2, 18),
            "motion": random.randint(1, 12),
            "alarms": random.randint(0, 6),
        }
        for i in range(24)
    ]


def generate_connections() -> list[dict]:
    users = ["admin", "operator1", "security_manager", "viewer1", "bis_service"]
    return [
        {
            "Username": u,
            "ClientType": random.choice(["WebClient", "SmartClient", "Mobile"]),
            "IPAddress": f"10.0.1.{i + 10}",
            "ConnectedSince": fmt_digifort_ts(now_utc() - timedelta(hours=random.randint(1, 48))),
        }
        for i, u in enumerate(users)
    ]


def build_dataset(camera_count: int = 100, alert_count: int = 100) -> dict[str, Any]:
    cameras, statuses, groups = generate_cameras(camera_count)
    analytics_records, frontend_events = generate_alerts(alert_count, cameras)
    io_devices, io_statuses = generate_io_devices()

    return {
        "cameras": cameras,
        "camera_statuses": statuses,
        "groups": groups,
        "analytics_records": analytics_records,
        "frontend_events": frontend_events,
        "server_info": generate_server_info(),
        "server_usage": generate_server_usage(cameras, analytics_records),
        "io_devices": io_devices,
        "io_statuses": io_statuses,
        "global_events": generate_global_events(),
        "scheduled_events": generate_scheduled_events(),
        "analytics_configs": generate_analytics_configs(cameras),
        "audit_logs": generate_audit_logs(50),
        "chart_data": generate_chart_data(),
        "connections": generate_connections(),
        "licenses": {
            "Cameras": len(cameras),
            "Analytics": 50,
            "LPR": 10,
            "FaceRecognition": 20,
            "Edition": "ENTERPRISE",
            "ExpiryDate": "2027-12-31",
        },
        "master_slave": {"Role": "MASTER", "SlavesConnected": 2, "Status": "OK"},
        "lpr_configs": [
            {"Name": f"LPR-Gate-{i + 1}", "Active": True, "Camera": cameras[i * 10]["Name"],
             "Working": True, "Status": "OK"}
            for i in range(min(5, len(cameras) // 10))
        ],
        "rtsp_config": {"Port": 554, "AuthRequired": True, "MaxClients": 200},
        "rtsp_status": {"ActiveClients": random.randint(5, 40), "Status": "OK"},
        "failover": {"Enabled": True, "Status": "STANDBY", "PrimaryServer": "digifort-master-01"},
    }


# ─── Flask app ────────────────────────────────────────────────────────────────

DATA = build_dataset()
app = Flask(__name__)
CORS(app)


def _filter_by_names(items: list[dict], key: str = "Name") -> list[dict]:
    mask = request.args.get("Cameras") or request.args.get("IODevices") or ""
    if not mask or mask == "*":
        return items
    prefixes = [p.strip().rstrip("*") for p in mask.split(",") if p.strip()]
    if not prefixes:
        return items
    return [item for item in items if any(item.get(key, "").startswith(p) for p in prefixes)]


@app.route("/")
def home():
    active_alarms = sum(1 for a in DATA["analytics_records"] if a["AlarmStatus"] == "ACTIVE")
    return jsonify({
        "name": "Digifort Mock API Server",
        "version": "2.0.0",
        "schema": "Digifort HTTP API (Response/Data/PascalCase)",
        "counts": {
            "cameras": len(DATA["cameras"]),
            "alerts": len(DATA["analytics_records"]),
            "activeAlarms": active_alarms,
            "closedAlarms": len(DATA["analytics_records"]) - active_alarms,
            "regions": len(REGIONS),
            "sites": sum(len(r["sites"]) for r in REGIONS),
        },
        "endpoints": [
            "/Interface/Cameras/GetCameras",
            "/Interface/Cameras/GetGroups",
            "/Interface/Cameras/GetStatus",
            "/Interface/Analytics/Search",
            "/Interface/Analytics/Chart",
            "/Interface/Analytics/GetStatus",
            "/Interface/Analytics/GetAnalyticsConfigurations",
            "/Interface/Server/GetInfo",
            "/Interface/Server/GetUsage",
            "/Interface/IODevices/GetIODevices",
            "/Interface/GlobalEvents/GetGlobalEvents",
            "/Interface/Audit/Search",
        ],
    })


# ── Cameras ──────────────────────────────────────────────────────────────────

@app.route("/Interface/Cameras/GetCameras")
def get_cameras():
    return jsonify(digifort_response({"Cameras": DATA["cameras"]}))


@app.route("/Interface/Cameras/GetGroups")
def get_groups():
    return jsonify(digifort_response({"Groups": DATA["groups"]}))


@app.route("/Interface/Cameras/GetStatus")
def get_camera_status():
    items = _filter_by_names(DATA["camera_statuses"])
    if request.args.get("Active", "").upper() == "TRUE":
        items = [s for s in items if s.get("Active")]
    if request.args.get("Working", "").upper() == "FALSE":
        items = [s for s in items if not s.get("Working")]
    return jsonify(digifort_response({"Cameras": items}))


@app.route("/Interface/Cameras/Activation", methods=["GET", "POST"])
def camera_activation():
    name = request.args.get("Camera") or (request.json or {}).get("camera", "")
    action = request.args.get("Action") or (request.json or {}).get("action", "")
    for cam, status in zip(DATA["cameras"], DATA["camera_statuses"]):
        if cam["Name"] == name:
            active = action.lower() == "activate"
            cam["Active"] = active
            status["Active"] = active
            status["Working"] = active
            status["Status"] = "ONLINE" if active else "OFFLINE"
            return jsonify(digifort_response({"Camera": cam}))
    return jsonify(digifort_response({}, code=404, message="Camera not found")), 404


# ── Analytics / Alerts ───────────────────────────────────────────────────────

@app.route("/Interface/Analytics/Search")
def analytics_search():
    records = list(DATA["analytics_records"])
    events = list(DATA["frontend_events"])

    # Filter by region (custom query param for dashboard drill-down)
    region = request.args.get("Region")
    site = request.args.get("Site")
    alarm_status = request.args.get("AlarmStatus")
    if region:
        records = [r for r in records if r.get("Region") == region]
        events = [e for e in events if e.get("region") == region]
    if site:
        records = [r for r in records if r.get("Site") == site]
        events = [e for e in events if e.get("site") == site]
    if alarm_status:
        records = [r for r in records if r.get("AlarmStatus", "").upper() == alarm_status.upper()]
        events = [e for e in events if e.get("alarmStatus", "").upper() == alarm_status.lower()]

    cameras_filter = request.args.get("Cameras")
    if cameras_filter:
        names = {n.strip() for n in cameras_filter.split(",")}
        records = [r for r in records if r.get("Camera") in names]
        events = [e for e in events if e.get("camera") in names]

    event_types = request.args.get("EventTypes")
    if event_types:
        types = {t.strip() for t in event_types.split(",")}
        records = [r for r in records if r.get("EventType") in types]
        events = [e for e in events if e.get("eventType") in types]

    return jsonify(digifort_response({
        "AnalyticsRecords": records,
        "Events": events,          # alias for Node proxy / frontend
        "Count": len(records),
    }))


@app.route("/Interface/Analytics/Chart")
def analytics_chart():
    return jsonify(DATA["chart_data"])


@app.route("/Interface/Analytics/GetStatus")
@app.route("/Interface/Analytics/GetAnalyticsConfigurations")
def analytics_configs():
    key = "AnalyticsConfigurations"
    return jsonify(digifort_response({key: DATA["analytics_configs"]}))


@app.route("/Interface/Analytics/GetCounters")
def analytics_counters():
    counters = [
        {"ID": str(i + 1), "Name": f"Counter-{c['Name'][:20]}", "Configuration": c["Name"],
         "Value": random.randint(50, 5000), "LastReset": fmt_digifort_ts(now_utc() - timedelta(days=7))}
        for i, c in enumerate(DATA["analytics_configs"])
    ]
    return jsonify(digifort_response({"Counters": counters}))


# ── Server ───────────────────────────────────────────────────────────────────

@app.route("/Interface/Server/GetInfo")
def server_info():
    return jsonify(digifort_response({"Info": DATA["server_info"]}))


@app.route("/Interface/Server/GetUsage")
def server_usage():
    return jsonify(digifort_response({"Stats": DATA["server_usage"]}))


@app.route("/Interface/Server/GetLicenses")
def server_licenses():
    return jsonify(digifort_response({"Licenses": DATA["licenses"]}))


@app.route("/Interface/Server/GetMasterSlaveStatus")
def master_slave():
    return jsonify(digifort_response({"MasterSlave": DATA["master_slave"]}))


# ── IO Devices ───────────────────────────────────────────────────────────────

@app.route("/Interface/IODevices/GetIODevices")
def io_devices():
    return jsonify(digifort_response({"IODevices": DATA["io_devices"]}))


@app.route("/Interface/IODevices/GetStatus")
def io_status():
    return jsonify(digifort_response({"IODevices": DATA["io_statuses"]}))


# ── Users / LPR / RTSP / Failover / Events ───────────────────────────────────

@app.route("/Interface/Users/GetConnections")
def user_connections():
    return jsonify(digifort_response({"Connections": DATA["connections"]}))


@app.route("/Interface/LPR/GetLPRConfigurations")
def lpr_configs():
    return jsonify(digifort_response({"LPRConfigurations": DATA["lpr_configs"]}))


@app.route("/Interface/LPR/GetStatus")
def lpr_status():
    return jsonify(digifort_response({"LPRConfigurations": DATA["lpr_configs"]}))


@app.route("/Interface/RTSP/GetConfig")
def rtsp_config():
    return jsonify(digifort_response({"Config": DATA["rtsp_config"]}))


@app.route("/Interface/RTSP/GetStatus")
def rtsp_status():
    return jsonify(digifort_response({"Status": DATA["rtsp_status"]}))


@app.route("/Interface/Failover/GetStatus")
def failover_status():
    return jsonify(digifort_response({"Failover": DATA["failover"]}))


@app.route("/Interface/GlobalEvents/GetGlobalEvents")
def global_events():
    return jsonify(digifort_response({"GlobalEvents": DATA["global_events"]}))


@app.route("/Interface/ScheduledEvents/GetScheduledEvents")
def scheduled_events():
    return jsonify(digifort_response({"ScheduledEvents": DATA["scheduled_events"]}))


# ── Audit / Bookmarks ────────────────────────────────────────────────────────

@app.route("/Interface/Audit/Search")
def audit_search():
    logs = DATA["audit_logs"]
    category = request.args.get("Category")
    keyword = request.args.get("Keyword", "").lower()
    if category:
        logs = [l for l in logs if l.get("Category") == category]
    if keyword:
        logs = [l for l in logs
                if keyword in l.get("Action", "").lower()
                or keyword in l.get("Details", "").lower()]
    return jsonify(digifort_response({"AuditLogs": logs}))


@app.route("/Interface/Cameras/Bookmarks/Search")
def bookmarks_search():
    return jsonify(digifort_response({"Bookmarks": []}))


@app.route("/Interface/Cameras/Bookmarks/Add", methods=["GET", "POST"])
def bookmarks_add():
    return jsonify(digifort_response({"Bookmark": {"ID": str(uuid.uuid4())}}))


# ── Regional alarm summary (custom helper for pie charts) ────────────────────

@app.route("/Interface/Alarms/GetSummary")
def alarm_summary():
    """Custom endpoint: active/closed alarm counts grouped by region and site."""
    summary: dict[str, Any] = {}
    for record in DATA["analytics_records"]:
        region = record["Region"]
        site = record["Site"]
        status = record["AlarmStatus"]
        summary.setdefault(region, {"active": 0, "closed": 0, "sites": {}})
        key = "active" if status == "ACTIVE" else "closed"
        summary[region][key] += 1
        summary[region]["sites"].setdefault(site, {"active": 0, "closed": 0})
        summary[region]["sites"][site][key] += 1
    return jsonify(digifort_response({"AlarmSummary": summary}))


# ── CLI ──────────────────────────────────────────────────────────────────────

def export_json(path: str) -> None:
    export = {
        "generatedAt": fmt_digifort_ts(now_utc()),
        "schema": "Digifort HTTP API dummy data",
        **DATA,
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2, ensure_ascii=False)
    print(f"Exported dummy data -> {path}")


def print_stats() -> None:
    active = sum(1 for a in DATA["analytics_records"] if a["AlarmStatus"] == "ACTIVE")
    print(f"Cameras:      {len(DATA['cameras'])}")
    print(f"Alerts:       {len(DATA['analytics_records'])}  ({active} active, {len(DATA['analytics_records']) - active} closed)")
    print(f"Regions:      {len(REGIONS)}")
    print(f"Sites:        {sum(len(r['sites']) for r in REGIONS)}")
    print(f"IO Devices:   {len(DATA['io_devices'])}")
    for region in REGIONS:
        region_alerts = [a for a in DATA["analytics_records"] if a["Region"] == region["name"]]
        region_active = sum(1 for a in region_alerts if a["AlarmStatus"] == "ACTIVE")
        print(f"  {region['name']}: {len(region_alerts)} alerts ({region_active} active)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Digifort dummy data server")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8089)))
    parser.add_argument("--export", metavar="FILE", help="Export all dummy data to JSON and exit")
    parser.add_argument("--stats", action="store_true", help="Print data counts and exit")
    args = parser.parse_args()

    print_stats()

    if args.export:
        export_json(args.export)
        raise SystemExit(0)

    print(f"\nStarting Digifort dummy server on http://0.0.0.0:{args.port}")
    print(f"Set backend: $env:DIGIFORT_API_URL=\"http://127.0.0.1:{args.port}\"\n")
    app.run(host="0.0.0.0", port=args.port, debug=False)
