import { useEffect, useRef, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Camera as CameraType } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Video, X, Building2, Map, Wifi, Lock, Flame, Users, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shopping Mall Camera Mapping - matches Python server
const MALL_CAMERA_MAP: Record<string, { x: number; y: number; z: number; angle: number; location: string }> = {
  // Main Entrance
  "CAM-ENTRANCE-LEFT": { x: -3, y: 4.5, z: -52, angle: Math.PI, location: "Main Entrance - Left" },
  "CAM-ENTRANCE-RIGHT": { x: 3, y: 4.5, z: -52, angle: Math.PI, location: "Main Entrance - Right" },
  
  // Ground Floor
  "CAM-GF-LOBBY": { x: 0, y: 4, z: -45, angle: 0, location: "Ground Floor Lobby" },
  "CAM-GF-CORRIDOR-WEST": { x: -25, y: 4, z: -35, angle: Math.PI / 2, location: "West Corridor" },
  "CAM-GF-CORRIDOR-EAST": { x: 25, y: 4, z: -35, angle: -Math.PI / 2, location: "East Corridor" },
  "CAM-GF-WEST-WING": { x: -25, y: 4, z: -15, angle: Math.PI / 2, location: "West Wing" },
  "CAM-GF-EAST-WING": { x: 25, y: 4, z: -15, angle: -Math.PI / 2, location: "East Wing" },
  "CAM-GF-STAIRWELL-WEST": { x: -28, y: 4, z: -25, angle: Math.PI / 4, location: "West Stairwell" },
  "CAM-GF-STAIRWELL-EAST": { x: 28, y: 4, z: -25, angle: -Math.PI / 4, location: "East Stairwell" },
  "CAM-GF-STORE-1": { x: -20, y: 4, z: -40, angle: 0, location: "Store 1" },
  "CAM-GF-STORE-2": { x: -15, y: 4, z: -30, angle: -Math.PI / 4, location: "Store 2" },
  "CAM-GF-STORE-3": { x: 15, y: 4, z: -30, angle: Math.PI / 4, location: "Store 3" },
  "CAM-GF-STORE-4": { x: 20, y: 4, z: -40, angle: 0, location: "Store 4" },
  "CAM-GF-COURT-NORTH": { x: 0, y: 5, z: -25, angle: Math.PI, location: "Central Court North" },
  "CAM-GF-FOODCOURT-WEST": { x: -12, y: 4, z: -10, angle: Math.PI / 2, location: "Food Court West" },
  "CAM-GF-FOODCOURT-EAST": { x: 12, y: 4, z: -10, angle: -Math.PI / 2, location: "Food Court East" },
  "CAM-GF-COURT-SOUTH": { x: 0, y: 4, z: -5, angle: 0, location: "Central Court South" },
  
  // Second Floor
  "CAM-2F-LOBBY": { x: 0, y: 8.5, z: -45, angle: 0, location: "2nd Floor Lobby" },
  "CAM-2F-CORRIDOR-WEST": { x: -25, y: 8.5, z: -35, angle: Math.PI / 2, location: "2F West Corridor" },
  "CAM-2F-CORRIDOR-EAST": { x: 25, y: 8.5, z: -35, angle: -Math.PI / 2, location: "2F East Corridor" },
  "CAM-2F-WEST-WING": { x: -25, y: 8.5, z: -15, angle: Math.PI / 2, location: "2F West Wing" },
  "CAM-2F-EAST-WING": { x: 25, y: 8.5, z: -15, angle: -Math.PI / 2, location: "2F East Wing" },
  "CAM-2F-STAIRWELL-WEST": { x: -28, y: 8.5, z: -25, angle: Math.PI / 4, location: "2F West Stairs" },
  "CAM-2F-STAIRWELL-EAST": { x: 28, y: 8.5, z: -25, angle: -Math.PI / 4, location: "2F East Stairs" },
  "CAM-2F-STORE-5": { x: -20, y: 8.5, z: -40, angle: 0, location: "Store 5" },
  "CAM-2F-STORE-6": { x: -15, y: 8.5, z: -30, angle: -Math.PI / 4, location: "Store 6" },
  "CAM-2F-STORE-7": { x: 15, y: 8.5, z: -30, angle: Math.PI / 4, location: "Store 7" },
  "CAM-2F-STORE-8": { x: 20, y: 8.5, z: -40, angle: 0, location: "Store 8" },
  "CAM-2F-BALCONY-SOUTH": { x: 0, y: 8.5, z: -10, angle: 0, location: "Balcony South" },
  
  // Service Area
  "CAM-LOADING-DOCK-LEFT": { x: -3, y: 4, z: 2, angle: 0, location: "Loading Dock Left" },
  "CAM-LOADING-DOCK-RIGHT": { x: 3, y: 4, z: 2, angle: 0, location: "Loading Dock Right" },
  "CAM-SERVICE-CORRIDOR": { x: 0, y: 4, z: 5, angle: 0, location: "Service Corridor" },
  
  // Parking
  "CAM-PARKING-WEST-FRONT": { x: -45, y: 7, z: -40, angle: Math.PI / 4, location: "Parking West Front" },
  "CAM-PARKING-WEST-MID": { x: -45, y: 7, z: -20, angle: Math.PI / 4, location: "Parking West Mid" },
  "CAM-PARKING-WEST-BACK": { x: -45, y: 7, z: 0, angle: Math.PI / 4, location: "Parking West Back" },
  "CAM-PARKING-EAST-FRONT": { x: 45, y: 7, z: -40, angle: -Math.PI / 4, location: "Parking East Front" },
  "CAM-PARKING-EAST-MID": { x: 45, y: 7, z: -20, angle: -Math.PI / 4, location: "Parking East Mid" },
  "CAM-PARKING-EAST-BACK": { x: 45, y: 7, z: 0, angle: -Math.PI / 4, location: "Parking East Back" },
  
  // Perimeter
  "CAM-ROOF-NW-CORNER": { x: -30, y: 12, z: -50, angle: -Math.PI / 4, location: "Roof NW Corner" },
  "CAM-ROOF-NE-CORNER": { x: 30, y: 12, z: -50, angle: Math.PI / 4, location: "Roof NE Corner" },
  "CAM-ROOF-SW-CORNER": { x: -30, y: 12, z: 5, angle: Math.PI / 4, location: "Roof SW Corner" },
  "CAM-ROOF-SE-CORNER": { x: 30, y: 12, z: 5, angle: -Math.PI / 4, location: "Roof SE Corner" },
  "CAM-SIDE-DOOR-WEST": { x: -32, y: 4, z: -35, angle: Math.PI / 2, location: "Side Door West" },
  "CAM-SIDE-DOOR-EAST": { x: 32, y: 4, z: -35, angle: -Math.PI / 2, location: "Side Door East" },
  "CAM-EMERGENCY-EXIT-WEST": { x: -32, y: 4, z: -10, angle: Math.PI / 2, location: "Emergency Exit West" },
  "CAM-EMERGENCY-EXIT-EAST": { x: 32, y: 4, z: -10, angle: -Math.PI / 2, location: "Emergency Exit East" },
};

function mapCameraToPosition(camera: CameraType) {
  const mapped = MALL_CAMERA_MAP[camera.name];
  if (mapped) {
    return { ...mapped, name: camera.name };
  }
  return { name: camera.name, x: 0, y: 4, z: 0, angle: 0, location: "Unmapped" };
}

export default function ShoppingMallPage() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const floorPlanRef = useRef<HTMLCanvasElement | null>(null);
  const [activeCam, setActiveCam] = useState<string | null>(null);
  const [showFootage, setShowFootage] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'interior'>('3d');
  const [activeFloor, setActiveFloor] = useState<'ground' | 'second'>('ground');
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
    () => cameras.map((cam) => mapCameraToPosition(cam)),
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
    scene.background = new THREE.Color("#87CEEB");
    scene.fog = new THREE.Fog("#87CEEB", 100, 300);

    const width = mount.clientWidth;
    const height = mount.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 500);
    camera.position.set(-80, 60, 80);
    camera.lookAt(0, 0, -20);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 30;
    controls.maxDistance = 150;
    controls.target.set(0, 0, -20);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({ color: "#5a8050", roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ===== MALL BUILDING =====
    const mallGroup = new THREE.Group();
    
    // Ground floor main structure (beige/tan)
    const floor1Geo = new THREE.BoxGeometry(60, 5, 50);
    const floor1Mat = new THREE.MeshStandardMaterial({ color: "#d4c4a8", roughness: 0.7 });
    const floor1 = new THREE.Mesh(floor1Geo, floor1Mat);
    floor1.position.set(0, 2.5, -25);
    floor1.castShadow = true;
    floor1.receiveShadow = true;
    mallGroup.add(floor1);

    // Second floor (slightly darker)
    const floor2Geo = new THREE.BoxGeometry(60, 5, 50);
    const floor2Mat = new THREE.MeshStandardMaterial({ color: "#c4b498", roughness: 0.7 });
    const floor2 = new THREE.Mesh(floor2Geo, floor2Mat);
    floor2.position.set(0, 7.5, -25);
    floor2.castShadow = true;
    floor2.receiveShadow = true;
    mallGroup.add(floor2);

    // Roof
    const roofGeo = new THREE.BoxGeometry(62, 0.8, 52);
    const roofMat = new THREE.MeshStandardMaterial({ color: "#8a7a6a", roughness: 0.6 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 10.4, -25);
    roof.castShadow = true;
    mallGroup.add(roof);

    // Glass windows/facade
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#b3d9ff',
      metalness: 0.1,
      roughness: 0.05,
      transparent: true,
      opacity: 0.4,
      transmission: 0.95,
    });

    // Front glass facade (ground floor)
    const frontGlassGeo = new THREE.BoxGeometry(50, 4, 0.2);
    const frontGlass1 = new THREE.Mesh(frontGlassGeo, glassMat);
    frontGlass1.position.set(0, 3, -50.1);
    mallGroup.add(frontGlass1);

    // Front glass facade (second floor)
    const frontGlass2 = new THREE.Mesh(frontGlassGeo, glassMat);
    frontGlass2.position.set(0, 7.5, -50.1);
    mallGroup.add(frontGlass2);

    // Side windows
    for (let i = 0; i < 4; i++) {
      const sideWindowGeo = new THREE.BoxGeometry(0.2, 2, 8);
      const windowLeft1 = new THREE.Mesh(sideWindowGeo, glassMat);
      windowLeft1.position.set(-30.1, 3, -45 + i * 12);
      mallGroup.add(windowLeft1);

      const windowRight1 = new THREE.Mesh(sideWindowGeo, glassMat);
      windowRight1.position.set(30.1, 3, -45 + i * 12);
      mallGroup.add(windowRight1);

      const windowLeft2 = new THREE.Mesh(sideWindowGeo, glassMat);
      windowLeft2.position.set(-30.1, 7.5, -45 + i * 12);
      mallGroup.add(windowLeft2);

      const windowRight2 = new THREE.Mesh(sideWindowGeo, glassMat);
      windowRight2.position.set(30.1, 7.5, -45 + i * 12);
      mallGroup.add(windowRight2);
    }

    // Entrance doors
    const doorGeo = new THREE.BoxGeometry(6, 4, 0.3);
    const doorMat = new THREE.MeshStandardMaterial({ color: "#4a4a4a", roughness: 0.4, metalness: 0.6 });
    const mainDoor = new THREE.Mesh(doorGeo, doorMat);
    mainDoor.position.set(0, 2.5, -50.2);
    mallGroup.add(mainDoor);

    // Signage
    const signGeo = new THREE.BoxGeometry(30, 2, 0.2);
    const signMat = new THREE.MeshStandardMaterial({ color: "#e63946", emissive: "#e63946", emissiveIntensity: 0.5 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 11.5, -50.2);
    mallGroup.add(sign);

    scene.add(mallGroup);

    // ===== PARKING LOTS =====
    const parkingMat = new THREE.MeshStandardMaterial({ color: "#3d3d3d", roughness: 0.8 });
    
    // West parking
    const parkingWest = new THREE.Mesh(new THREE.PlaneGeometry(30, 50), parkingMat);
    parkingWest.rotation.x = -Math.PI / 2;
    parkingWest.position.set(-45, 0.05, -25);
    parkingWest.receiveShadow = true;
    scene.add(parkingWest);

    // East parking
    const parkingEast = new THREE.Mesh(new THREE.PlaneGeometry(30, 50), parkingMat);
    parkingEast.rotation.x = -Math.PI / 2;
    parkingEast.position.set(45, 0.05, -25);
    parkingEast.receiveShadow = true;
    scene.add(parkingEast);

    // Parking lines
    const lineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    for (let side of [-45, 45]) {
      for (let i = 0; i < 9; i++) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(28, 0.15), lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(side, 0.06, -48 + i * 6);
        scene.add(line);
      }
    }

    // ===== CAMERA LIGHT POLES (for parking) =====
    const poleMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.6, metalness: 0.4 });
    [-45, 45].forEach(x => {
      [-40, -20, 0].forEach(z => {
        const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 7, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(x, 3.5, z);
        pole.castShadow = true;
        scene.add(pole);

        // Pole light
        const lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ color: '#ffeb3b' });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(x, 7, z);
        scene.add(light);
      });
    });

    // ===== LANDSCAPING (minimal, purposeful) =====
    const treeMat = new THREE.MeshStandardMaterial({ color: "#2d5a1e", roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#4a3428", roughness: 0.95 });

    // Trees only at entrance for aesthetics
    [-12, -8, 8, 12].forEach(x => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2, 8), trunkMat);
      trunk.position.set(x, 1, -58);
      trunk.castShadow = true;
      scene.add(trunk);

      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), treeMat);
      foliage.position.set(x, 3, -58);
      foliage.castShadow = true;
      scene.add(foliage);
    });

    // ===== CAMERAS =====
    const cameraGroup = new THREE.Group();
    const fovMaterials: Record<string, THREE.MeshStandardMaterial> = {};

    positions.forEach((pos) => {
      // CCTV Camera Housing
      const housingGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 12);
      const housingMat = new THREE.MeshStandardMaterial({ 
        color: '#2a2a2a',
        metalness: 0.6,
        roughness: 0.3,
      });
      const housing = new THREE.Mesh(housingGeo, housingMat);
      housing.position.set(pos.x, pos.y, pos.z);
      housing.rotation.x = Math.PI / 6;
      housing.castShadow = true;
      housing.userData = { name: pos.name, type: "camera" };

      // Mount bracket
      const mountGeo = new THREE.BoxGeometry(0.1, 0.3, 0.15);
      const mount = new THREE.Mesh(mountGeo, housingMat);
      mount.position.set(pos.x, pos.y - 0.2, pos.z);
      mount.userData = { name: pos.name, type: "camera" };

      // Lens
      const lensGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const lensMat = new THREE.MeshPhysicalMaterial({
        color: '#1a1a1a',
        metalness: 0.9,
        roughness: 0.1,
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(pos.x, pos.y + 0.15, pos.z);
      lens.userData = { name: pos.name, type: "camera" };

      // LED indicator
      const ledGeo = new THREE.SphereGeometry(0.05, 6, 6);
      const ledMat = new THREE.MeshBasicMaterial({ color: '#00ff00' });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(pos.x + 0.2, pos.y + 0.1, pos.z);
      led.userData = { name: pos.name, type: "camera" };

      // FOV Cone
      const fovGeom = new THREE.ConeGeometry(6, 12, 24, 1, true);
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

      // Label
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = "rgba(26,32,44,0.95)";
      ctx.roundRect(0, 0, canvas.width, canvas.height, 12);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pos.location, canvas.width / 2, canvas.height / 2);
      const tex = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
      sprite.scale.set(12, 2, 1);
      sprite.position.set(pos.x, pos.y + 4, pos.z);
      sprite.userData = { name: pos.name, type: "label" };

      cameraGroup.add(housing, mount, lens, led, fov, sprite);
    });
    scene.add(cameraGroup);

    // ===== LIGHTING =====
    const ambient = new THREE.AmbientLight('#c9daf5', 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight('#fff5e6', 1.5);
    sun.position.set(100, 120, 80);
    sun.castShadow = true;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.001;
    scene.add(sun);

    const hemi = new THREE.HemisphereLight('#87CEEB', '#5a7c49', 0.5);
    scene.add(hemi);

    // ===== INTERACTION =====
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const resetFovs = () => {
      Object.values(fovMaterials).forEach(mat => {
        mat.color.set("#60a5fa");
        mat.opacity = 0.08;
      });
    };

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

    const returnToAerial = () => {
      setActiveCam(null);
      setShowFootage(false);
      resetFovs();
    };

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

  // Interior Floor Plan Rendering
  useEffect(() => {
    if (viewMode !== 'interior' || !floorPlanRef.current) return;

    const canvas = floorPlanRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 6;

    // Draw floor plan
    ctx.save();
    ctx.translate(centerX, centerY);

    // Grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = -50; i <= 50; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i * scale, -50 * scale);
      ctx.lineTo(i * scale, 50 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-50 * scale, i * scale);
      ctx.lineTo(50 * scale, i * scale);
      ctx.stroke();
    }

    // Building outline
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.strokeRect(-50 * scale, -50 * scale, 100 * scale, 100 * scale);

    // Interior walls and rooms
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;

    // Define rooms based on activeFloor
    const rooms = activeFloor === 'ground' ? [
      { x: -40, y: -45, w: 30, h: 15, label: 'Store 1', color: '#1e3a5f' },
      { x: -40, y: -25, w: 25, h: 20, label: 'Store 2', color: '#1e3a5f' },
      { x: 10, y: -45, w: 30, h: 15, label: 'Store 3', color: '#1e3a5f' },
      { x: 15, y: -25, w: 25, h: 20, label: 'Store 4', color: '#1e3a5f' },
      { x: -20, y: -15, w: 40, h: 25, label: 'Food Court', color: '#2d5016' },
      { x: -15, y: 15, w: 30, h: 20, label: 'Central Court', color: '#3a2f5f' },
      { x: -45, y: -30, w: 8, h: 12, label: 'Stair W', color: '#4a4a4a' },
      { x: 37, y: -30, w: 8, h: 12, label: 'Stair E', color: '#4a4a4a' },
      { x: -10, y: 38, w: 20, h: 10, label: 'Service', color: '#5a3a3a' },
    ] : [
      { x: -40, y: -45, w: 30, h: 15, label: 'Store 5', color: '#1e3a5f' },
      { x: -40, y: -25, w: 25, h: 20, label: 'Store 6', color: '#1e3a5f' },
      { x: 10, y: -45, w: 30, h: 15, label: 'Store 7', color: '#1e3a5f' },
      { x: 15, y: -25, w: 25, h: 20, label: 'Store 8', color: '#1e3a5f' },
      { x: -20, y: -15, w: 40, h: 25, label: 'Balcony Area', color: '#2d5016' },
      { x: -45, y: -30, w: 8, h: 12, label: 'Stair W', color: '#4a4a4a' },
      { x: 37, y: -30, w: 8, h: 12, label: 'Stair E', color: '#4a4a4a' },
    ];

    // Draw rooms
    rooms.forEach(room => {
      // Fill room
      ctx.fillStyle = room.color + '40';
      ctx.fillRect(room.x * scale, room.y * scale, room.w * scale, room.h * scale);
      
      // Room border
      ctx.strokeStyle = '#666';
      ctx.strokeRect(room.x * scale, room.y * scale, room.w * scale, room.h * scale);
      
      // Room label
      ctx.fillStyle = '#999';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.label, (room.x + room.w / 2) * scale, (room.y + room.h / 2) * scale);
    });

    // Draw cameras
    if (layersVisible.cameras) {
      const floorCameras = positions.filter(cam => 
        activeFloor === 'ground' 
          ? !cam.name.includes('2F') && !cam.name.includes('PARKING') && !cam.name.includes('ROOF')
          : cam.name.includes('2F')
      );

      floorCameras.forEach(cam => {
        const x = cam.x * scale;
        const z = -cam.z * scale;

        // Camera icon
        ctx.save();
        ctx.translate(x, z);

        // FOV cone
        ctx.fillStyle = activeCam === cam.name ? '#22d3ee40' : '#60a5fa20';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 35, cam.angle - Math.PI / 4, cam.angle + Math.PI / 4);
        ctx.closePath();
        ctx.fill();

        // Camera body
        ctx.fillStyle = activeCam === cam.name ? '#22d3ee' : '#60a5fa';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Camera direction indicator
        ctx.strokeStyle = activeCam === cam.name ? '#22d3ee' : '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(cam.angle) * 15, Math.cos(cam.angle) * 15);
        ctx.stroke();

        ctx.restore();

        // Camera label
        if (activeCam === cam.name) {
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(cam.name, x, z - 15);
        }
      });
    }

    // Draw access control points
    if (layersVisible.accessControl) {
      const accessPoints = [
        { x: 0, y: 52, label: 'Main Entry' },
        { x: -32, y: 35, label: 'Side Door W' },
        { x: 32, y: 35, label: 'Side Door E' },
        { x: -32, y: 10, label: 'Emergency W' },
        { x: 32, y: 10, label: 'Emergency E' },
      ];

      accessPoints.forEach(point => {
        const x = point.x * scale;
        const z = -point.y * scale;

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x - 6, z - 6, 12, 12);
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 6, z - 6, 12, 12);

        // Lock icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔒', x, z + 4);
      });
    }

    // Draw sensors
    if (layersVisible.sensors) {
      const sensors = [
        { x: 0, y: -25, type: 'wifi' },
        { x: -25, y: -15, type: 'fire' },
        { x: 25, y: -15, type: 'fire' },
        { x: 0, y: 10, type: 'wifi' },
        { x: -15, y: 30, type: 'fire' },
        { x: 15, y: 30, type: 'fire' },
      ];

      sensors.forEach(sensor => {
        const x = sensor.x * scale;
        const z = -sensor.y * scale;

        if (sensor.type === 'wifi') {
          ctx.fillStyle = '#3b82f6';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('📶', x, z + 5);
        } else if (sensor.type === 'fire') {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🔥', x, z + 5);
        }
      });
    }

    // Draw occupancy heatmap
    if (layersVisible.occupancy) {
      const heatZones = [
        { x: -15, y: -10, r: 25, intensity: 0.7 },
        { x: 0, y: 20, r: 20, intensity: 0.5 },
        { x: 20, y: -30, r: 18, intensity: 0.6 },
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

    // Click handler for interior view
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left - centerX;
      const clickY = e.clientY - rect.top - centerY;

      const floorCameras = positions.filter(cam => 
        activeFloor === 'ground' 
          ? !cam.name.includes('2F') && !cam.name.includes('PARKING') && !cam.name.includes('ROOF')
          : cam.name.includes('2F')
      );

      for (const cam of floorCameras) {
        const camX = cam.x * scale;
        const camZ = -cam.z * scale;
        const dist = Math.sqrt((clickX - camX) ** 2 + (clickY - camZ) ** 2);
        
        if (dist < 12) {
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
          <h1 className="text-2xl font-semibold">Shopping Mall - CCTV Security System</h1>
          <p className="text-muted-foreground text-sm mt-1">
            2-story mall with {positions.length} strategically placed cameras - Click any camera to view footage
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
            <Map className="h-4 w-4" />
            Interior Plan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main View Area */}
        <Card className="p-4 col-span-3 relative">
          {viewMode === '3d' ? (
            <div className="h-[700px]" ref={mountRef} />
          ) : (
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
                    variant={activeFloor === 'second' ? 'default' : 'outline'}
                    onClick={() => setActiveFloor('second')}
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    2nd Floor
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
                      <Lock className="h-4 w-4 text-green-500" />
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
                      <Flame className="h-4 w-4 text-red-500" />
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
                      <Users className="h-4 w-4 text-amber-500" />
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Camera Locations</h3>
            <span className="text-xs text-muted-foreground">{positions.length} cams</span>
          </div>
          <div className="space-y-2 max-h-[650px] overflow-auto pr-1">
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {positions.map((cam) => (
              <div
                key={cam.name}
                className={`flex items-start gap-3 text-xs border rounded-lg px-3 py-2 cursor-pointer transition-all ${
                  activeCam === cam.name
                    ? "bg-red-500/10 border-red-500 shadow-sm"
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
            const mount = mountRef.current as any;
            if (mount?.__highlightCamera) {
              // Reset FOV highlighting
              const resetEvent = new CustomEvent('resetFov');
              mount.dispatchEvent(resetEvent);
            }
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

