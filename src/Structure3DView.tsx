import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { StructureElement3D } from "./api";

interface Structure3DViewProps {
  elements: StructureElement3D[];
}

const COLORS: Record<StructureElement3D["type"], number> = {
  stem: 0x4a90d9,
  hairpin: 0xe8a33d,
  multiloop: 0x5fb85f,
  interior: 0xb15fd8,
  dangling: 0x999999,
  other: 0xcccccc,
};

const RADII: Record<StructureElement3D["type"], number> = {
  stem: 1.2,
  hairpin: 0.5,
  multiloop: 0.4,
  interior: 0.4,
  dangling: 0.3,
  other: 0.3,
};

export function Structure3DView({ elements }: Structure3DViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || elements.length === 0) return;

    const width = 500;
    const height = 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const center = new THREE.Vector3();
    let pointCount = 0;

    for (const el of elements) {
      const start = new THREE.Vector3(...el.start);
      const end = new THREE.Vector3(...el.end);
      center.add(start).add(end);
      pointCount += 2;

      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      if (length < 1e-6) continue;

      const radius = RADII[el.type];
      const geometry = new THREE.CylinderGeometry(radius, radius, length, 12);
      const material = new THREE.MeshStandardMaterial({ color: COLORS[el.type] });
      const mesh = new THREE.Mesh(geometry, material);

      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      mesh.position.copy(midpoint);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.clone().normalize(),
      );

      scene.add(mesh);
    }

    if (pointCount > 0) center.divideScalar(pointCount);

    let maxDist = 10;
    for (const el of elements) {
      maxDist = Math.max(
        maxDist,
        center.distanceTo(new THREE.Vector3(...el.start)),
        center.distanceTo(new THREE.Vector3(...el.end)),
      );
    }

    camera.position.copy(center.clone().add(new THREE.Vector3(maxDist * 2, maxDist * 1.2, maxDist * 2)));
    camera.lookAt(center);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);
    controls.update();

    let frameId: number;
    function animate() {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, [elements]);

  return <div ref={containerRef} style={{ width: 500, height: 450 }} />;
}
