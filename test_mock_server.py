"""
Quick test script to verify mock server is returning Moscow University cameras
"""
import requests
import json

print("Testing Mock Server...")
print("=" * 60)

try:
    # Test the cameras endpoint
    response = requests.get("http://localhost:8089/Interface/Cameras/GetCameras")
    
    if response.status_code == 200:
        data = response.json()
        cameras = data.get("Cameras", [])
        
        print(f"✓ Mock server is running")
        print(f"✓ Total cameras returned: {len(cameras)}")
        
        # Count cameras by type
        msu_cameras = [c for c in cameras if c['name'].startswith('CAM-MSU-')]
        hs_cameras = [c for c in cameras if c['name'].startswith('CAM-HS-')]
        mall_cameras = [c for c in cameras if not c['name'].startswith('CAM-MSU-') and not c['name'].startswith('CAM-HS-')]
        
        print(f"\nCamera Breakdown:")
        print(f"  - Moscow University (CAM-MSU-*): {len(msu_cameras)}")
        print(f"  - High School (CAM-HS-*): {len(hs_cameras)}")
        print(f"  - Shopping Mall: {len(mall_cameras)}")
        
        if len(msu_cameras) > 0:
            print(f"\n✓ SUCCESS: Moscow University cameras are being returned!")
            print(f"\nFirst 5 MSU cameras:")
            for cam in msu_cameras[:5]:
                print(f"  - {cam['name']}: {cam['group']}")
        else:
            print(f"\n✗ ERROR: No Moscow University cameras found!")
            
    else:
        print(f"✗ Error: Mock server returned status {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("✗ Error: Cannot connect to mock server at http://localhost:8089")
    print("  Make sure the mock server is running: python mock_server/app.py")
except Exception as e:
    print(f"✗ Error: {e}")

print("=" * 60)






