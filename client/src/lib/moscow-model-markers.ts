import * as THREE from "three";
import type { ModelPosition } from "./moscow-model-layout";

const RAY_ORIGIN_Y = 400;
const CAMERA_SURFACE_OFFSET = 0.55;
const IOT_SURFACE_OFFSET = 0.35;
const GROUND_FALLBACK_Y = 0.5;

/** Collect raycast targets from a loaded GLB scene. */
export function collectModelMeshes(root: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  root.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      meshes.push(node as THREE.Mesh);
    }
  });
  return meshes;
}

/** Snap a horizontal (x, z) point onto the topmost model surface below it. */
export function snapYToModel(
  x: number,
  z: number,
  meshes: THREE.Mesh[],
  raycaster: THREE.Raycaster,
  offset = CAMERA_SURFACE_OFFSET,
): number {
  if (meshes.length === 0) return GROUND_FALLBACK_Y;

  const origin = new THREE.Vector3(x, RAY_ORIGIN_Y, z);
  const direction = new THREE.Vector3(0, -1, 0);
  raycaster.set(origin, direction);
  const hits = raycaster.intersectObjects(meshes, false);

  if (hits.length > 0) {
    // Use the lowest hit so markers sit on ground/plaza/walkways, not rooftops.
    const surface = hits[hits.length - 1];
    return surface.point.y + offset;
  }
  return GROUND_FALLBACK_Y;
}

export function snapPositionToModel(
  pos: ModelPosition,
  meshes: THREE.Mesh[],
  raycaster: THREE.Raycaster,
): ModelPosition {
  const offset = pos.kind === "iot" ? IOT_SURFACE_OFFSET : CAMERA_SURFACE_OFFSET;
  const y = snapYToModel(pos.x, pos.z, meshes, raycaster, offset);
  return { ...pos, y };
}

/** Dome-style CCTV camera mesh oriented to look along +Z (use group.rotation.y for heading). */
export function createCctvMarkerGroup(active = false): THREE.Group {
  const group = new THREE.Group();
  const bodyColor = active ? 0x0891b2 : 0x374151;
  const domeColor = active ? 0x67e8f9 : 0xf9fafb;

  const bracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.35, 0.55),
    new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.4, roughness: 0.5 }),
  );
  bracket.position.y = 0.18;
  group.add(bracket);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.6),
    new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.4, roughness: 0.5 }),
  );
  arm.position.set(0, 0.35, -0.15);
  group.add(arm);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: domeColor, metalness: 0.35, roughness: 0.35 }),
  );
  dome.position.y = 0.42;
  group.add(dome);

  const lensHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.24, 0.3, 14),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.7, roughness: 0.25 }),
  );
  lensHousing.rotation.x = Math.PI / 2;
  lensHousing.position.set(0, 0.32, 0.42);
  group.add(lensHousing);

  const lensGlass = new THREE.Mesh(
    new THREE.CircleGeometry(0.14, 14),
    new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      emissive: 0x0369a1,
      emissiveIntensity: active ? 0.8 : 0.35,
      metalness: 0.2,
    }),
  );
  lensGlass.position.set(0, 0.32, 0.58);
  group.add(lensGlass);

  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 8, 8),
    new THREE.MeshStandardMaterial({
      color: active ? 0xef4444 : 0x22c55e,
      emissive: active ? 0xef4444 : 0x22c55e,
      emissiveIntensity: 1.2,
    }),
  );
  led.position.set(0.28, 0.48, 0.05);
  group.add(led);

  group.scale.setScalar(1.35);
  return group;
}

/** Draw a CCTV icon on the interior floor-plan canvas. */
export function drawCctvIcon2d(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  active: boolean,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const body = active ? "#0891b2" : "#374151";
  const dome = active ? "#67e8f9" : "#f3f4f6";

  ctx.fillStyle = body;
  ctx.fillRect(-7, -2, 14, 8);

  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.arc(0, -2, 6, Math.PI, 0);
  ctx.fill();

  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(0, 2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = active ? "#ef4444" : "#22c55e";
  ctx.beginPath();
  ctx.arc(5, -4, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = active ? "#22d3ee" : "#60a5fa";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(14, 2);
  ctx.stroke();

  ctx.restore();
}
