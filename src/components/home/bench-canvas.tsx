"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import { CanvasTexture, NeutralToneMapping, PMREMGenerator, SRGBColorSpace, type Group, type Mesh, type Scene, type WebGLRenderer } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const SCALE = 4.6 / 32;

function gridTexture(dark: boolean, width: number, height: number, ox: number, oy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(256, width >> 1);
  canvas.height = Math.max(256, height >> 1);
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, dark ? "#121418" : "#fbfbfa");
  gradient.addColorStop(1, dark ? "#0c0d10" : "#f1f2f2");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const vignette = context.createRadialGradient(canvas.width * ox, canvas.height * oy, 0, canvas.width * ox, canvas.height * oy, canvas.height * 0.9);
  vignette.addColorStop(0, dark ? "rgba(120,128,140,0.22)" : "rgba(255,255,255,0.9)");
  vignette.addColorStop(1, dark ? "rgba(120,128,140,0)" : "rgba(255,255,255,0)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const step = Math.round(canvas.height / 14);
  context.lineWidth = 1;
  for (let x = (canvas.width * ox) % step; x < canvas.width; x += step) {
    const fade = Math.abs(x - canvas.width * ox) / canvas.width;
    context.strokeStyle = dark ? `rgba(200,210,225,${0.06 * (1 - fade * 1.6)})` : `rgba(20,24,30,${0.09 * (1 - fade * 1.6)})`;
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, canvas.height);
    context.stroke();
  }
  context.strokeStyle = dark ? "rgba(200,210,225,0.05)" : "rgba(20,24,30,0.07)";
  for (let y = (canvas.height * oy) % step; y < canvas.height; y += step) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(canvas.width, y + 0.5);
    context.stroke();
  }
  return canvas;
}

function mountStudio(gl: WebGLRenderer, scene: Scene, dark: boolean) {
  const pmrem = new PMREMGenerator(gl);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = environment;
  scene.environmentIntensity = dark ? 0.7 : 0.85;
  gl.toneMapping = NeutralToneMapping;
  gl.toneMappingExposure = dark ? 1.05 : 1;
  return () => {
    environment.dispose();
    pmrem.dispose();
  };
}

function Studio({ dark }: { dark: boolean }) {
  const { gl, scene } = useThree();
  useEffect(() => mountStudio(gl, scene, dark), [dark, gl, scene]);
  return null;
}

function paintBackground(scene: Scene, texture: CanvasTexture | null) {
  scene.background = texture;
  return () => {
    texture?.dispose();
  };
}

function Bench({
  dark,
  still,
  solid,
  ox,
  oy,
  camZ,
}: {
  dark: boolean;
  still: boolean;
  solid: boolean;
  ox: number;
  oy: number;
  camZ: number;
}) {
  const group = useRef<Group>(null);
  const work = useRef<Mesh>(null);
  const aim = useRef({ x: 0.42, y: -0.22 });
  const { camera, size, scene, invalidate } = useThree();
  const texture = useMemo(() => {
    const canvas = gridTexture(dark, size.width, size.height, ox, oy);
    if (!canvas) return null;
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return map;
  }, [dark, ox, oy, size.height, size.width]);

  useEffect(() => paintBackground(scene, texture), [scene, texture]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (still) return;
      aim.current.x = 0.42 + (event.clientX / window.innerWidth - 0.5) * 0.9;
      aim.current.y = -0.22 + (event.clientY / window.innerHeight - 0.5) * 0.6;
      invalidate();
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [invalidate, still]);

  useFrame((state) => {
    if (!group.current) return;
    const fov = "fov" in camera ? camera.fov : 30;
    const cam = camera.position.z || camZ;
    const vh = 2 * cam * Math.tan(((fov / 2) * Math.PI) / 180);
    const vw = vh * (size.width / Math.max(1, size.height));
    group.current.rotation.y += (aim.current.x - group.current.rotation.y) * 0.06;
    group.current.rotation.x += (aim.current.y - group.current.rotation.x) * 0.06;
    const t = state.clock.elapsedTime;
    group.current.position.x = (ox - 0.5) * vw;
    group.current.position.y = -(oy - 0.5) * vh + (still ? 0 : Math.sin(t * 1.1) * 0.08);
    if (work.current) work.current.position.z = 0.75 + (still ? 0 : Math.sin(t * 1.6) * 0.06);
  });

  function part(x: number, y: number, w: number, h: number, z = 0.55): [number, number, number] {
    return [(x + w / 2 - 16) * SCALE, (16 - (y + h / 2)) * SCALE + 2.5 * SCALE, z];
  }

  return (
    <group ref={group} rotation={[-0.22, 0.42, 0.05]}>
      <RoundedBox args={[4.6, 4.6, 0.7]} radius={0.28} smoothness={8}>
        {solid ? (
          <meshPhysicalMaterial color="#e6ecf2" roughness={0.2} metalness={0.05} />
        ) : (
          <MeshTransmissionMaterial
            transmission={1}
            thickness={2.2}
            roughness={0.12}
            ior={1.45}
            chromaticAberration={0.02}
            anisotropicBlur={0.1}
            distortion={0}
            samples={6}
            resolution={512}
            attenuationColor="#e6ecf2"
            attenuationDistance={5}
            background={texture ?? undefined}
          />
        )}
      </RoundedBox>
      <RoundedBox args={[20 * SCALE, 2.6 * SCALE, 0.55]} radius={0.06} position={part(6, 19, 20, 2.6)}>
        <meshPhysicalMaterial color="#8c8f94" metalness={1} roughness={0.32} anisotropy={0.9} clearcoat={0.4} clearcoatRoughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[2.4 * SCALE, 5 * SCALE, 0.45]} radius={0.05} position={part(8.5, 21, 2.4, 5)}>
        <meshPhysicalMaterial color="#8c8f94" metalness={1} roughness={0.32} anisotropy={0.9} />
      </RoundedBox>
      <RoundedBox args={[2.4 * SCALE, 5 * SCALE, 0.45]} radius={0.05} position={part(21.1, 21, 2.4, 5)}>
        <meshPhysicalMaterial color="#8c8f94" metalness={1} roughness={0.32} anisotropy={0.9} />
      </RoundedBox>
      <RoundedBox args={[5 * SCALE, 2.6 * SCALE, 0.4]} radius={0.05} position={part(8.5, 15.4, 5, 2.6)}>
        <meshPhysicalMaterial color="#17140f" metalness={0.6} roughness={0.35} clearcoat={1} />
      </RoundedBox>
      <RoundedBox ref={work} args={[7 * SCALE, 7 * SCALE, 0.95]} radius={0.12} position={part(16, 11, 7, 7, 0.75)}>
        <meshPhysicalMaterial
          color="#ff5410"
          roughness={0.18}
          transmission={solid ? 0 : 0.25}
          metalness={0}
          thickness={1}
          ior={1.5}
          clearcoat={1}
          emissive="#000000"
          emissiveIntensity={0}
          attenuationColor="#ff4a00"
          attenuationDistance={1.6}
        />
      </RoundedBox>
    </group>
  );
}

export function BenchCanvas({
  dark,
  still,
  solid,
  mobile,
}: {
  dark: boolean;
  still: boolean;
  solid: boolean;
  mobile: boolean;
}) {
  const ox = mobile ? 0.5 : 0.75;
  const oy = mobile ? 0.46 : 0.4;
  const camZ = mobile ? 17 : 18;
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.5]}
      frameloop={still ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, position: [0, 0.2, camZ], near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
      }}
    >
      <Studio dark={dark} />
      <directionalLight color="#ffffff" intensity={2.2} position={[3, 5, 6]} />
      <pointLight color="#dfe8ff" intensity={18} distance={20} position={[-3, -2, 3]} />
      <Bench dark={dark} still={still} solid={solid} ox={ox} oy={oy} camZ={camZ} />
    </Canvas>
  );
}
