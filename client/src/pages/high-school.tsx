import { useEffect, useRef, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Camera as CameraType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, X, Building2, Map } from "lucide-react";

// High School Camera Mapping
const HIGH_SCHOOL_CAMERA_MAP: Record<string, { x: number; y: number; z: number; angle: number; location: string }> = {
  // Main Entrance
  "CAM-HS-MAIN-ENTRANCE-01": { x: 0, y: 3, z: -40, angle: Math.PI, location: "Main Entrance" },
  "CAM-HS-MAIN-ENTRANCE-02": { x: 5, y: 3, z: -40, angle: Math.PI, location: "Main Entrance Right" },
  
  // Main Hallways
  "CAM-HS-HALLWAY-CENTRAL-01": { x: 0, y: 3, z: -20, angle: 0, location: "Central Hallway 1" },
  "CAM-HS-HALLWAY-CENTRAL-02": { x: 0, y: 3, z: 0, angle: 0, location: "Central Hallway 2" },
  "CAM-HS-HALLWAY-CENTRAL-03": { x: 0, y: 3, z: 20, angle: 0, location: "Central Hallway 3" },
  
  // West Wing
  "CAM-HS-WEST-HALLWAY-01": { x: -20, y: 3, z: -20, angle: Math.PI / 2, location: "West Hallway 1" },
  "CAM-HS-WEST-HALLWAY-02": { x: -20, y: 3, z: 0, angle: Math.PI / 2, location: "West Hallway 2" },
  "CAM-HS-WEST-HALLWAY-03": { x: -20, y: 3, z: 20, angle: Math.PI / 2, location: "West Hallway 3" },
  
  // East Wing
  "CAM-HS-EAST-HALLWAY-01": { x: 20, y: 3, z: -20, angle: -Math.PI / 2, location: "East Hallway 1" },
  "CAM-HS-EAST-HALLWAY-02": { x: 20, y: 3, z: 0, angle: -Math.PI / 2, location: "East Hallway 2" },
  "CAM-HS-EAST-HALLWAY-03": { x: 20, y: 3, z: 20, angle: -Math.PI / 2, location: "East Hallway 3" },
  
  // Classrooms
  "CAM-HS-CLASSROOM-A101": { x: -15, y: 3, z: -25, angle: Math.PI / 4, location: "Classroom A101" },
  "CAM-HS-CLASSROOM-A102": { x: -15, y: 3, z: -15, angle: Math.PI / 4, location: "Classroom A102" },
  "CAM-HS-CLASSROOM-B201": { x: 15, y: 3, z: -25, angle: -Math.PI / 4, location: "Classroom B201" },
  "CAM-HS-CLASSROOM-B202": { x: 15, y: 3, z: -15, angle: -Math.PI / 4, location: "Classroom B202" },
  
  // Common Areas
  "CAM-HS-CAFETERIA-01": { x: -10, y: 3, z: 25, angle: Math.PI / 2, location: "Cafeteria West" },
  "CAM-HS-CAFETERIA-02": { x: 10, y: 3, z: 25, angle: -Math.PI / 2, location: "Cafeteria East" },
  "CAM-HS-CAFETERIA-03": { x: 0, y: 3, z: 30, angle: 0, location: "Cafeteria Center" },
  
  // Library
  "CAM-HS-LIBRARY-01": { x: -25, y: 3, z: -5, angle: Math.PI / 2, location: "Library Entrance" },
  "CAM-HS-LIBRARY-02": { x: -30, y: 3, z: -10, angle: Math.PI / 4, location: "Library Reading Area" },
  
  // Gymnasium
  "CAM-HS-GYM-01": { x: 25, y: 3, z: 10, angle: -Math.PI / 2, location: "Gym Entrance" },
  "CAM-HS-GYM-02": { x: 30, y: 3, z: 15, angle: -Math.PI / 4, location: "Gym Court" },
  
  // Stairwells
  "CAM-HS-STAIR-WEST-01": { x: -25, y: 3, z: -30, angle: Math.PI / 4, location: "West Stairwell" },
  "CAM-HS-STAIR-EAST-01": { x: 25, y: 3, z: -30, angle: -Math.PI / 4, location: "East Stairwell" },
  
  // Emergency Exits
  "CAM-HS-EXIT-WEST-01": { x: -35, y: 3, z: 0, angle: Math.PI / 2, location: "West Emergency Exit" },
  "CAM-HS-EXIT-EAST-01": { x: 35, y: 3, z: 0, angle: -Math.PI / 2, location: "East Emergency Exit" },
  "CAM-HS-EXIT-REAR-01": { x: 0, y: 3, z: 40, angle: 0, location: "Rear Exit" },
  
  // Parking & Exterior
  "CAM-HS-PARKING-01": { x: -40, y: 5, z: -30, angle: Math.PI / 4, location: "Parking Lot North" },
  "CAM-HS-PARKING-02": { x: -40, y: 5, z: 0, angle: Math.PI / 4, location: "Parking Lot Central" },
  "CAM-HS-PARKING-03": { x: -40, y: 5, z: 30, angle: Math.PI / 4, location: "Parking Lot South" },
  "CAM-HS-PLAYGROUND-01": { x: 40, y: 5, z: 30, angle: -Math.PI / 4, location: "Playground Area" },
  
  // Administrative Offices
  "CAM-HS-OFFICE-MAIN-01": { x: -5, y: 3, z: -35, angle: Math.PI / 2, location: "Main Office" },
  "CAM-HS-OFFICE-PRINCIPAL-01": { x: -10, y: 3, z: -35, angle: Math.PI / 4, location: "Principal's Office" },
};

function mapCameraToPosition(camera: CameraType) {
  const mapped = HIGH_SCHOOL_CAMERA_MAP[camera.name];
  if (mapped) {
    return { ...mapped, name: camera.name };
  }
  return { name: camera.name, x: 0, y: 3, z: 0, angle: 0, location: "Unmapped" };
}

export default function HighSchoolPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [activeCam, setActiveCam] = useState<string | null>(null);
  const [showFootage, setShowFootage] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const { data: cameras = [], isLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const positions = useMemo(
    () => {
      console.log('Total cameras:', cameras.length);
      console.log('High school cameras:', cameras.filter(cam => cam.name.startsWith("CAM-HS-")).length);
      cameras.forEach(cam => {
        if (cam.name.startsWith("CAM-HS-")) {
          console.log('HS Camera:', cam.name);
        }
      });
      return cameras
        .filter(cam => cam.name.startsWith("CAM-HS-"))
        .map((cam) => mapCameraToPosition(cam));
    },
    [cameras]
  );

  const activeCamera = useMemo(
    () => positions.find(p => p.name === activeCam),
    [positions, activeCam]
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#87ceeb");
    scene.fog = new THREE.Fog("#87ceeb", 50, 200);

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(-60, 40, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI / 2.1;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(50, 80, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -80;
    sunLight.shadow.camera.right = 80;
    sunLight.shadow.camera.top = 80;
    sunLight.shadow.camera.bottom = -80;
    scene.add(sunLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: "#2d5016", roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Load the high school model (optional - cameras will still work without it)
    const loader = new GLTFLoader();
    loader.load(
      '/high-school/source/Truong.glb',
      (gltf) => {
        const model = gltf.scene;
        
        // Scale and position the model
        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, 0, 0);
        
        // Enable shadows
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        
        scene.add(model);
        setModelLoaded(true);
        console.log('High school model loaded successfully');
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
      },
      (error) => {
        console.error('Error loading model (continuing without 3D model):', error);
        setModelLoaded(true); // Set to true anyway so we can see cameras
      }
    );

    // Camera markers
    const cameraGroup = new THREE.Group();
    scene.add(cameraGroup);

    const fovMaterials: Record<string, THREE.MeshStandardMaterial> = {};

    const resetFovs = () => {
      Object.values(fovMaterials).forEach(mat => {
        mat.color.set("#60a5fa");
        mat.opacity = 0.08;
      });
    };

    positions.forEach(pos => {
      // Camera marker
      const markerGeo = new THREE.SphereGeometry(0.8, 16, 16);
      const markerMat = new THREE.MeshStandardMaterial({ 
        color: "#60a5fa",
        emissive: "#60a5fa",
        emissiveIntensity: 0.5,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(pos.x, pos.y, pos.z);
      marker.userData = { name: pos.name, type: "camera" };
      cameraGroup.add(marker);

      // FOV Cone
      const fovGeom = new THREE.ConeGeometry(4, 8, 24, 1, true);
      const fovMat = new THREE.MeshStandardMaterial({
        color: '#60a5fa',
        opacity: 0.08,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      fovMaterials[pos.name] = fovMat;
      const fov = new THREE.Mesh(fovGeom, fovMat);
      fov.position.set(pos.x, pos.y, pos.z);
      fov.rotation.x = -Math.PI / 2;
      fov.rotation.y = pos.angle;
      fov.userData = { name: pos.name, type: "fov" };
      cameraGroup.add(fov);

      // Direction indicator
      const arrowGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
      const arrowMat = new THREE.MeshStandardMaterial({ color: "#60a5fa" });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(
        pos.x + Math.sin(pos.angle) * 1.5,
        pos.y,
        pos.z + Math.cos(pos.angle) * 1.5
      );
      arrow.rotation.x = Math.PI / 2;
      arrow.rotation.z = -pos.angle;
      cameraGroup.add(arrow);
    });

    const highlightCamera = (name: string) => {
      resetFovs();
      const mat = fovMaterials[name];
      if (mat) {
        mat.color.set("#22d3ee");
        mat.opacity = 0.25;
      }
      setActiveCam(name);
      setShowFootage(true);
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(cameraGroup.children, true);
      if (intersects.length > 0) {
        const name = intersects[0].object.userData?.name;
        if (name) highlightCamera(name);
      }
    };
    renderer.domElement.addEventListener("click", onClick);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let frameId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    (mount as any).__highlightCamera = highlightCamera;

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      mount.innerHTML = "";
    };
  }, [positions]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">High School - CCTV Security System</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Comprehensive campus security with {positions.length} strategically placed cameras
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main View Area */}
        <Card className="p-4 col-span-3 relative">
          <div className="h-[700px]" ref={mountRef} />
          {!modelLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
              <div className="text-center space-y-3">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading high school model...</p>
              </div>
            </div>
          )}
        </Card>

        {/* Sidebar - Camera List */}
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Cameras ({positions.length})</h3>
          <div className="space-y-2 max-h-[650px] overflow-auto pr-1">
            {isLoading && <p className="text-sm text-muted-foreground">Loading cameras...</p>}
            {!isLoading && positions.length === 0 && (
              <p className="text-sm text-muted-foreground">No cameras available.</p>
            )}
            {positions.map((cam) => (
              <div
                key={cam.name}
                className={`flex items-center justify-between text-sm border rounded-md px-2 py-2 cursor-pointer transition-colors ${
                  activeCam === cam.name
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-card hover:bg-muted/50 border-border"
                }`}
                onClick={() => {
                  const mount = mountRef.current as any;
                  if (mount?.__highlightCamera) {
                    mount.__highlightCamera(cam.name);
                  }
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-xs">{cam.location}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {activeCam === cam.name ? '🔴 VIEWING' : 'Click for footage'}
                  </p>
                </div>
                <div
                  className={`h-2 w-2 rounded-full mt-1 flex-shrink-0 ${
                    activeCam === cam.name ? "bg-red-500 animate-pulse" : "bg-green-500"
                  }`}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Camera Footage Modal */}
      {showFootage && activeCam && activeCamera && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowFootage(false);
            setActiveCam(null);
          }}
        >
          <div 
            className="bg-background rounded-lg shadow-2xl max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{activeCamera.location}</h3>
                  <p className="text-xs text-white/80">{activeCam}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowFootage(false);
                  setActiveCam(null);
                }}
                className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Feed */}
            <div className="aspect-video bg-black relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto animate-pulse">
                      <Video className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="text-white font-medium">🔴 LIVE FEED</p>
                    <p className="text-white/60 text-sm mt-1">Camera {activeCam}</p>
                  </div>
                </div>
              </div>
              {/* Timestamp Overlay */}
              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded text-white text-sm font-mono">
                {new Date().toLocaleString()}
              </div>
              {/* Recording Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600/90 px-3 py-1.5 rounded">
                <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">REC</span>
              </div>
            </div>

            {/* Footer - Camera Info */}
            <div className="p-4 bg-muted/30 border-t grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="font-medium">{activeCamera.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Position</p>
                <p className="font-medium">
                  X:{activeCamera.x.toFixed(1)} Y:{activeCamera.y.toFixed(1)} Z:{activeCamera.z.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="font-medium text-green-600">● Online</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Resolution</p>
                <p className="font-medium">1920x1080 HD</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

