import { useEffect, useRef, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Camera as CameraType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, X, Building2 } from "lucide-react";

// Moscow State University Camera Mapping - Adjusted to match building structure
const UNIVERSITY_CAMERA_MAP: Record<string, { x: number; y: number; z: number; angle: number; location: string }> = {
  // Main Building Entrance (front, at ground level)
  "CAM-MSU-MAIN-ENTRANCE-01": { x: 0, y: 2, z: -45, angle: Math.PI, location: "Main Entrance Center" },
  "CAM-MSU-MAIN-ENTRANCE-02": { x: -15, y: 2, z: -45, angle: Math.PI, location: "Main Entrance Left" },
  "CAM-MSU-MAIN-ENTRANCE-03": { x: 15, y: 2, z: -45, angle: Math.PI, location: "Main Entrance Right" },
  
  // Central Tower (at various heights along the tower)
  "CAM-MSU-TOWER-BASE-01": { x: 0, y: 5, z: 0, angle: 0, location: "Tower Base North" },
  "CAM-MSU-TOWER-BASE-02": { x: 0, y: 5, z: 10, angle: Math.PI, location: "Tower Base South" },
  "CAM-MSU-TOWER-MID-01": { x: -3, y: 30, z: 0, angle: Math.PI / 2, location: "Tower Mid-Level West" },
  "CAM-MSU-TOWER-MID-02": { x: 3, y: 30, z: 0, angle: -Math.PI / 2, location: "Tower Mid-Level East" },
  "CAM-MSU-TOWER-TOP-01": { x: 0, y: 60, z: -2, angle: Math.PI, location: "Tower Top North" },
  "CAM-MSU-TOWER-TOP-02": { x: 0, y: 60, z: 2, angle: 0, location: "Tower Top South" },
  
  // West Wing (along the west side of building)
  "CAM-MSU-WEST-WING-ENTRANCE": { x: -30, y: 2, z: -30, angle: Math.PI / 2, location: "West Wing Entrance" },
  "CAM-MSU-WEST-WING-CORRIDOR-01": { x: -40, y: 2, z: -20, angle: Math.PI / 2, location: "West Corridor 1" },
  "CAM-MSU-WEST-WING-CORRIDOR-02": { x: -40, y: 2, z: 0, angle: Math.PI / 2, location: "West Corridor 2" },
  "CAM-MSU-WEST-WING-CORRIDOR-03": { x: -40, y: 2, z: 20, angle: Math.PI / 2, location: "West Corridor 3" },
  "CAM-MSU-WEST-WING-ROOF": { x: -35, y: 15, z: 0, angle: Math.PI / 2, location: "West Wing Roof" },
  
  // East Wing (along the east side of building)
  "CAM-MSU-EAST-WING-ENTRANCE": { x: 30, y: 2, z: -30, angle: -Math.PI / 2, location: "East Wing Entrance" },
  "CAM-MSU-EAST-WING-CORRIDOR-01": { x: 40, y: 2, z: -20, angle: -Math.PI / 2, location: "East Corridor 1" },
  "CAM-MSU-EAST-WING-CORRIDOR-02": { x: 40, y: 2, z: 0, angle: -Math.PI / 2, location: "East Corridor 2" },
  "CAM-MSU-EAST-WING-CORRIDOR-03": { x: 40, y: 2, z: 20, angle: -Math.PI / 2, location: "East Corridor 3" },
  "CAM-MSU-EAST-WING-ROOF": { x: 35, y: 15, z: 0, angle: -Math.PI / 2, location: "East Wing Roof" },
  
  // Academic Buildings (near front wings)
  "CAM-MSU-LIBRARY-ENTRANCE": { x: -25, y: 2, z: -35, angle: Math.PI / 4, location: "Library Entrance" },
  "CAM-MSU-LIBRARY-READING-HALL": { x: -30, y: 2, z: -40, angle: Math.PI / 4, location: "Library Reading Hall" },
  "CAM-MSU-AUDITORIUM-MAIN": { x: 25, y: 2, z: -35, angle: -Math.PI / 4, location: "Main Auditorium" },
  "CAM-MSU-AUDITORIUM-BALCONY": { x: 25, y: 8, z: -35, angle: -Math.PI / 4, location: "Auditorium Balcony" },
  
  // Student Areas (rear of building)
  "CAM-MSU-CAFETERIA-MAIN": { x: -20, y: 2, z: 35, angle: Math.PI / 2, location: "Main Cafeteria" },
  "CAM-MSU-CAFETERIA-SEATING": { x: -25, y: 2, z: 40, angle: Math.PI / 4, location: "Cafeteria Seating" },
  "CAM-MSU-STUDENT-CENTER": { x: 20, y: 2, z: 35, angle: -Math.PI / 2, location: "Student Center" },
  "CAM-MSU-RECREATION-AREA": { x: 25, y: 2, z: 40, angle: -Math.PI / 4, location: "Recreation Area" },
  
  // Laboratories (side wings)
  "CAM-MSU-LAB-BUILDING-A": { x: -50, y: 2, z: -10, angle: Math.PI / 2, location: "Laboratory Building A" },
  "CAM-MSU-LAB-BUILDING-B": { x: -50, y: 2, z: 10, angle: Math.PI / 2, location: "Laboratory Building B" },
  "CAM-MSU-LAB-CORRIDOR": { x: -45, y: 2, z: 0, angle: Math.PI / 2, location: "Lab Corridor" },
  
  // Administrative
  "CAM-MSU-ADMIN-ENTRANCE": { x: -10, y: 2, z: -42, angle: Math.PI / 4, location: "Administration Entrance" },
  "CAM-MSU-ADMIN-OFFICE": { x: -15, y: 2, z: -38, angle: Math.PI / 4, location: "Administration Office" },
  "CAM-MSU-RECTOR-OFFICE": { x: 0, y: 50, z: 0, angle: 0, location: "Rector's Office" },
  
  // Perimeter & Security (around the building at ground level)
  "CAM-MSU-NORTH-GATE": { x: 0, y: 2, z: -55, angle: Math.PI, location: "North Gate" },
  "CAM-MSU-SOUTH-GATE": { x: 0, y: 2, z: 55, angle: 0, location: "South Gate" },
  "CAM-MSU-WEST-GATE": { x: -55, y: 2, z: 0, angle: Math.PI / 2, location: "West Gate" },
  "CAM-MSU-EAST-GATE": { x: 55, y: 2, z: 0, angle: -Math.PI / 2, location: "East Gate" },
  
  // Parking & Exterior (outside the building perimeter)
  "CAM-MSU-PARKING-NORTH-01": { x: -35, y: 5, z: -60, angle: Math.PI / 4, location: "North Parking Lot 1" },
  "CAM-MSU-PARKING-NORTH-02": { x: 35, y: 5, z: -60, angle: -Math.PI / 4, location: "North Parking Lot 2" },
  "CAM-MSU-PARKING-SOUTH-01": { x: -35, y: 5, z: 60, angle: Math.PI * 0.75, location: "South Parking Lot 1" },
  "CAM-MSU-PARKING-SOUTH-02": { x: 35, y: 5, z: 60, angle: -Math.PI * 0.75, location: "South Parking Lot 2" },
  
  // Garden & Plaza (in front of building)
  "CAM-MSU-PLAZA-CENTER": { x: 0, y: 2, z: -50, angle: Math.PI, location: "Central Plaza" },
  "CAM-MSU-GARDEN-WEST": { x: -30, y: 2, z: -20, angle: Math.PI / 2, location: "West Garden" },
  "CAM-MSU-GARDEN-EAST": { x: 30, y: 2, z: -20, angle: -Math.PI / 2, location: "East Garden" },
  
  // Emergency Points (at building corners)
  "CAM-MSU-EMERGENCY-WEST-01": { x: -48, y: 2, z: -30, angle: Math.PI / 2, location: "West Emergency Exit 1" },
  "CAM-MSU-EMERGENCY-WEST-02": { x: -48, y: 2, z: 30, angle: Math.PI / 2, location: "West Emergency Exit 2" },
  "CAM-MSU-EMERGENCY-EAST-01": { x: 48, y: 2, z: -30, angle: -Math.PI / 2, location: "East Emergency Exit 1" },
  "CAM-MSU-EMERGENCY-EAST-02": { x: 48, y: 2, z: 30, angle: -Math.PI / 2, location: "East Emergency Exit 2" },
};

function mapCameraToPosition(camera: CameraType) {
  const mapped = UNIVERSITY_CAMERA_MAP[camera.name];
  if (mapped) {
    return { ...mapped, name: camera.name };
  }
  return { name: camera.name, x: 0, y: 5, z: 0, angle: 0, location: "Unmapped" };
}

export default function MoscowUniversityPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const floorPlanRef = useRef<HTMLCanvasElement | null>(null);
  const [activeCam, setActiveCam] = useState<string | null>(null);
  const [showFootage, setShowFootage] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'interior'>('3d');
  const [activeFloor, setActiveFloor] = useState<'ground' | 'tower'>('ground');
  const [layersVisible, setLayersVisible] = useState({
    cameras: true,
    accessControl: true,
    sensors: true,
    occupancy: false,
  });

  const { data: cameras = [], isLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  });

  const positions = useMemo(
    () => {
      console.log('Total cameras:', cameras.length);
      console.log('MSU cameras:', cameras.filter(cam => cam.name.startsWith("CAM-MSU-")).length);
      return cameras
        .filter(cam => cam.name.startsWith("CAM-MSU-"))
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
    if (!mount || viewMode !== '3d') return;

    console.log('Initializing 3D view...');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#87ceeb");
    scene.fog = new THREE.Fog("#87ceeb", 100, 400);

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 100, 200);
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
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2.1;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(100, 150, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    scene.add(sunLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: "#2d5016", roughness: 0.8 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Load Moscow State University model
    const loader = new GLTFLoader();
    loader.load(
      '/moscow_state_university.glb',
      (gltf) => {
        const model = gltf.scene;
        
        console.log('Model loaded, bounding box:', model);
        
        // Calculate bounding box to understand model size
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        console.log('Model size:', size);
        console.log('Model center:', center);
        
        // Scale the model appropriately
        // Adjust scale based on model size
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 200; // Target size for the model
        const scale = targetSize / maxDim;
        
        model.scale.set(scale, scale, scale);
        
        // Center the model
        model.position.set(-center.x * scale, 0, -center.z * scale);
        
        console.log('Applied scale:', scale);
        console.log('Applied position:', model.position);
        
        // Enable shadows
        model.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            // Make sure materials are visible
            const mesh = node as THREE.Mesh;
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  mat.needsUpdate = true;
                });
              } else {
                mesh.material.needsUpdate = true;
              }
            }
          }
        });
        
        scene.add(model);
        setModelLoaded(true);
        console.log('Moscow State University model loaded successfully and added to scene');
      },
      (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(2);
        console.log('Loading Moscow State University:', percent + '%');
      },
      (error) => {
        console.error('Error loading university model:', error);
        setModelLoaded(true); // Set to true anyway so cameras are visible
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
      // Camera marker - smaller and more realistic
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

      // FOV Cone - adjusted size
      const fovGeom = new THREE.ConeGeometry(5, 10, 24, 1, true);
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

      // Direction indicator - smaller arrow
      const arrowGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
      const arrowMat = new THREE.MeshStandardMaterial({ color: "#60a5fa" });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(
        pos.x + Math.sin(pos.angle) * 2,
        pos.y,
        pos.z + Math.cos(pos.angle) * 2
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
  }, [positions, viewMode]);

  // Interior Floor Plan Rendering
  useEffect(() => {
    if (viewMode !== 'interior' || !floorPlanRef.current) return;

    const canvas = floorPlanRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('Rendering interior floor plan...');

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    console.log('Canvas size:', width, height);
    
    if (width === 0 || height === 0) {
      // Canvas not ready yet, try again
      setTimeout(() => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }, 100);
      return;
    }
    
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 4;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = -80; i <= 80; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i * scale, -80 * scale);
      ctx.lineTo(i * scale, 80 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-80 * scale, i * scale);
      ctx.lineTo(80 * scale, i * scale);
      ctx.stroke();
    }

    // Building outline
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.strokeRect(-60 * scale, -60 * scale, 120 * scale, 120 * scale);

    // Interior structure based on floor
    const rooms = activeFloor === 'ground' ? [
      { x: -45, y: -50, w: 30, h: 20, label: 'Library', color: '#1e3a5f' },
      { x: 15, y: -50, w: 30, h: 20, label: 'Auditorium', color: '#3a1e5f' },
      { x: -50, y: -25, w: 35, h: 15, label: 'West Wing', color: '#2d4a3a' },
      { x: 15, y: -25, w: 35, h: 15, label: 'East Wing', color: '#2d4a3a' },
      { x: -25, y: -10, w: 50, h: 30, label: 'Central Hall', color: '#3a2f5f' },
      { x: -45, y: 25, w: 25, h: 20, label: 'Cafeteria', color: '#5a3a2a' },
      { x: 20, y: 25, w: 25, h: 20, label: 'Student Center', color: '#5a3a2a' },
      { x: -55, y: -5, w: 15, h: 25, label: 'Lab A', color: '#4a2a3a' },
      { x: -55, y: 5, w: 15, h: 25, label: 'Lab B', color: '#4a2a3a' },
    ] : [
      { x: -20, y: -20, w: 40, h: 40, label: 'Tower Floor', color: '#3a2f5f' },
      { x: -15, y: -15, w: 30, h: 30, label: 'Admin Offices', color: '#2d3a4a' },
      { x: 0, y: 0, w: 10, h: 10, label: 'Rector', color: '#5a2a2a' },
    ];

    // Draw rooms
    rooms.forEach(room => {
      ctx.fillStyle = room.color + '40';
      ctx.fillRect(room.x * scale, room.y * scale, room.w * scale, room.h * scale);
      
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.strokeRect(room.x * scale, room.y * scale, room.w * scale, room.h * scale);
      
      ctx.fillStyle = '#999';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.label, (room.x + room.w / 2) * scale, (room.y + room.h / 2) * scale);
    });

    // Draw cameras
    if (layersVisible.cameras) {
      const floorCameras = positions.filter(cam => 
        activeFloor === 'ground' 
          ? cam.y <= 10
          : cam.y > 10
      );

      floorCameras.forEach(cam => {
        const x = cam.x * scale;
        const z = -cam.z * scale;

        // FOV cone
        ctx.fillStyle = activeCam === cam.name ? '#22d3ee40' : '#60a5fa20';
        ctx.beginPath();
        ctx.moveTo(x, z);
        ctx.arc(x, z, 25, cam.angle - Math.PI / 3, cam.angle + Math.PI / 3);
        ctx.closePath();
        ctx.fill();

        // Camera body
        ctx.fillStyle = activeCam === cam.name ? '#22d3ee' : '#60a5fa';
        ctx.beginPath();
        ctx.arc(x, z, 6, 0, Math.PI * 2);
        ctx.fill();

        // Direction
        ctx.strokeStyle = activeCam === cam.name ? '#22d3ee' : '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, z);
        ctx.lineTo(x + Math.sin(cam.angle) * 12, z + Math.cos(cam.angle) * 12);
        ctx.stroke();

        if (activeCam === cam.name) {
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(cam.name, x, z - 12);
        }
      });
    }

    // Access control
    if (layersVisible.accessControl) {
      const accessPoints = [
        { x: 0, y: -60, label: 'North Gate' },
        { x: 0, y: 60, label: 'South Gate' },
        { x: -60, y: 0, label: 'West Gate' },
        { x: 60, y: 0, label: 'East Gate' },
      ];

      accessPoints.forEach(point => {
        const x = point.x * scale;
        const z = -point.y * scale;

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x - 5, z - 5, 10, 10);
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 5, z - 5, 10, 10);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', x, z + 3);
      });
    }

    // Sensors
    if (layersVisible.sensors) {
      const sensors = [
        { x: 0, y: -30, type: 'wifi' },
        { x: -30, y: 0, type: 'fire' },
        { x: 30, y: 0, type: 'fire' },
        { x: 0, y: 30, type: 'wifi' },
        { x: -40, y: -20, type: 'fire' },
        { x: 40, y: -20, type: 'fire' },
      ];

      sensors.forEach(sensor => {
        const x = sensor.x * scale;
        const z = -sensor.y * scale;

        if (sensor.type === 'wifi') {
          ctx.fillStyle = '#3b82f6';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('📶', x, z + 4);
        } else if (sensor.type === 'fire') {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🔥', x, z + 4);
        }
      });
    }

    // Occupancy heatmap
    if (layersVisible.occupancy) {
      const heatZones = [
        { x: 0, y: -10, r: 20, intensity: 0.7 },
        { x: -30, y: 30, r: 15, intensity: 0.6 },
        { x: 30, y: 30, r: 15, intensity: 0.5 },
      ];

      heatZones.forEach(zone => {
        const gradient = ctx.createRadialGradient(
          zone.x * scale, -zone.y * scale, 0,
          zone.x * scale, -zone.y * scale, zone.r * scale
        );
        gradient.addColorStop(0, `rgba(251, 191, 36, ${zone.intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(zone.x * scale, -zone.y * scale, zone.r * scale, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left - centerX;
      const clickY = e.clientY - rect.top - centerY;

      const floorCameras = positions.filter(cam => 
        activeFloor === 'ground' ? cam.y <= 10 : cam.y > 10
      );

      for (const cam of floorCameras) {
        const camX = cam.x * scale;
        const camZ = -cam.z * scale;
        const dist = Math.sqrt((clickX - camX) ** 2 + (clickY - camZ) ** 2);
        
        if (dist < 10) {
          setActiveCam(cam.name);
          setShowFootage(true);
          return;
        }
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [viewMode, activeFloor, positions, layersVisible, activeCam]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Moscow State University - CCTV Security System</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Iconic university campus with {positions.length} strategically placed cameras
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === '3d' ? 'default' : 'outline'}
            onClick={() => setViewMode('3d')}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            3D View
          </Button>
          <Button
            variant={viewMode === 'interior' ? 'default' : 'outline'}
            onClick={() => setViewMode('interior')}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            Interior Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main View Area */}
        <Card className="p-4 col-span-3 relative">
          {viewMode === '3d' && (
            <>
              <div className="h-[700px]" ref={mountRef} />
              {!modelLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <div className="text-center space-y-3">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading Moscow State University model...</p>
                  </div>
                </div>
              )}
            </>
          )}
          
          {viewMode === 'interior' && (
            <div className="h-[700px] relative">
              <canvas 
                ref={floorPlanRef} 
                className="w-full h-full rounded-lg border border-border bg-[#1a1a1a]"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <Card className="p-4 space-y-3">
          {viewMode === 'interior' && (
            <>
              {/* Floor Selector */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Floor Level</h3>
                <div className="flex gap-2">
                  <Button
                    variant={activeFloor === 'ground' ? 'default' : 'outline'}
                    onClick={() => setActiveFloor('ground')}
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    Ground Floor
                  </Button>
                  <Button
                    variant={activeFloor === 'tower' ? 'default' : 'outline'}
                    onClick={() => setActiveFloor('tower')}
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    Tower Level
                  </Button>
                </div>
              </div>

              {/* Layer Controls */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Layers</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setLayersVisible(prev => ({ ...prev, cameras: !prev.cameras }))}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Cameras</span>
                    </div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded ${
                      layersVisible.cameras ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {layersVisible.cameras ? 'ON' : 'OFF'}
                    </div>
                  </button>

                  <button
                    onClick={() => setLayersVisible(prev => ({ ...prev, accessControl: !prev.accessControl }))}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Access Control</span>
                    </div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded ${
                      layersVisible.accessControl ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {layersVisible.accessControl ? 'ON' : 'OFF'}
                    </div>
                  </button>

                  <button
                    onClick={() => setLayersVisible(prev => ({ ...prev, sensors: !prev.sensors }))}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Sensors</span>
                    </div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded ${
                      layersVisible.sensors ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {layersVisible.sensors ? 'ON' : 'OFF'}
                    </div>
                  </button>

                  <button
                    onClick={() => setLayersVisible(prev => ({ ...prev, occupancy: !prev.occupancy }))}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Occupancy</span>
                    </div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded ${
                      layersVisible.occupancy ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {layersVisible.occupancy ? 'ON' : 'OFF'}
                    </div>
                  </button>
                </div>
              </div>

              <div className="border-t pt-4" />
            </>
          )}

          {/* Camera List */}
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

