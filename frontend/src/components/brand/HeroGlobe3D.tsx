"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════════════════
   HeroGlobe3D — the capital-engine centerpiece.

   A bright, cinematic 3D orbital engine: glowing emerald core, rotating
   capital-stream rings, orbiting satellites, rising yield particles, and a
   deep starfield. Rendered with the already-installed three / fiber.

   WebGL hardening: the Canvas only mounts once the container has real
   dimensions AND the browser reports WebGL support. Mounting a WebGL context
   on a 0×0 / hidden element throws "Error creating WebGL context" and can
   white-screen the page (seen during splash boot and post-login page
   transitions). If WebGL fails or is unavailable we render a static core.
   ══════════════════════════════════════════════════════════════════════════ */

function OrbitalRing({
  radius,
  color,
  speed,
  tilt,
  opacity = 0.4,
}: {
  radius: number;
  color: string;
  speed: number;
  tilt: [number, number, number];
  opacity?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z += speed * state.clock.getDelta();
  });
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, 0.006, 8, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

function Satellite({
  radius,
  speed,
  color,
  size = 0.06,
  yOffset = 0,
}: {
  radius: number;
  speed: number;
  color: string;
  size?: number;
  yOffset?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.position.set(
      Math.cos(t) * radius,
      yOffset,
      Math.sin(t) * radius,
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function GlowingCore({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current || !innerRef.current) return;
    groupRef.current.rotation.y += 0.0012 * state.clock.getDelta() * 60;
    const pulse =
      1 + Math.sin(state.clock.elapsedTime * 1.4) * (active ? 0.03 : 0.015);
    innerRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      {/* Outer aura */}
      <mesh>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.05} />
      </mesh>
      {/* Wireframe lattice */}
      <mesh>
        <sphereGeometry args={[0.9, 20, 20]} />
        <meshBasicMaterial
          color="#34d399"
          wireframe
          transparent
          opacity={active ? 0.3 : 0.22}
        />
      </mesh>
      {/* Solid core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.52, 32, 32]} />
        <meshStandardMaterial
          color="#0b3324"
          emissive="#10b981"
          emissiveIntensity={active ? 0.9 : 0.35}
          roughness={0.25}
          metalness={0.8}
        />
      </mesh>
      {/* Equatorial capital streams */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.012, 8, 64]} />
        <meshBasicMaterial color="#6ee7b7" transparent opacity={0.75} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.64, 0.008, 8, 64]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function YieldParticles({ active, count = 140 }: { active: boolean; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions] = useState(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35 + Math.random() * 1.5;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = -1.6 + Math.random() * 3.2;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  });

  const velocities = useMemo(
    () => Array.from({ length: count }, () => 0.004 + Math.random() * 0.012),
    [count],
  );

  useFrame(() => {
    const points = pointsRef.current;
    if (!points) return;
    const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += active ? velocities[i % velocities.length] : velocities[i % velocities.length] * 0.1;
      if (arr[i * 3 + 1] > 1.8) {
        arr[i * 3 + 1] = -1.8;
        const angle = Math.random() * Math.PI * 2;
        const r = 0.35 + Math.random() * 1.5;
        arr[i * 3] = Math.cos(angle) * r;
        arr[i * 3 + 2] = Math.sin(angle) * r;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#34d399"
        size={0.035}
        transparent
        opacity={active ? 0.95 : 0.3}
        sizeAttenuation
      />
    </points>
  );
}

function Starfield() {
  const ref = useRef<THREE.Points>(null);
  const [positions] = useState(() => {
    const count = 900;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 8 + Math.random() * 14;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  });

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.02} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function Scene({ active }: { active: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={2.2} color="#34d399" />
      <pointLight position={[-4, -3, -4]} intensity={0.9} color="#10b981" />

      <Starfield />
      <GlowingCore active={active} />
      <YieldParticles active={active} />

      <OrbitalRing radius={1.45} color="#34d399" speed={0.16} tilt={[1.1, 0.35, 0]} opacity={0.45} />
      <OrbitalRing radius={1.75} color="#10b981" speed={-0.11} tilt={[0.6, -0.5, 0.4]} opacity={0.32} />
      <OrbitalRing radius={2.05} color="#6ee7b7" speed={0.08} tilt={[1.5, 0.8, 0.2]} opacity={0.22} />

      <Satellite radius={1.45} speed={0.7} color="#6ee7b7" size={0.055} />
      <Satellite radius={1.75} speed={-0.5} color="#34d399" size={0.045} yOffset={0.15} />
      <Satellite radius={2.05} speed={0.38} color="#a7f3d0" size={0.04} yOffset={-0.12} />
    </>
  );
}

interface HeroGlobe3DProps {
  active?: boolean;
  className?: string;
  /** Camera distance — larger = more of the orbit in frame (avoids clipping). */
  cameraDistance?: number;
}

/** Static fallback ring used when WebGL is unavailable — keeps the panel intact. */
function StaticCore({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        {[220, 168, 120].map((size, i) => (
          <div
            key={size}
            className={cn(
              "absolute rounded-full border",
              i === 0 ? "border-emerald-500/20" : i === 1 ? "border-emerald-500/30" : "border-emerald-400/40",
            )}
            style={{
              width: size,
              height: size,
              animation: `spin ${18 - i * 4}s linear infinite${i > 0 ? " reverse" : ""}`,
            }}
          />
        ))}
        <div
          className="rounded-full bg-emerald-500/10 border border-emerald-400/50"
          style={{
            width: 64,
            height: 64,
            boxShadow: active ? "0 0 60px rgba(16,185,129,0.5)" : "0 0 30px rgba(16,185,129,0.2)",
          }}
        />
      </div>
    </div>
  );
}

export default function HeroGlobe3D({
  active = true,
  className,
  cameraDistance = 5.0,
}: HeroGlobe3DProps) {
  // ---- WebGL / layout guards ------------------------------------------
  // The Canvas must not mount while its container is hidden or 0-sized
  // (splash boot overlay, post-login page transition). Mounting a WebGL
  // context there throws "Error creating WebGL context" → broken page.
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Detect WebGL support up-front (Chrome/Edge sometimes block it when the
    // GPU process crashed or under memory pressure).
    let supported = false;
    try {
      const probe = document.createElement("canvas");
      supported = !!(
        probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl")
      );
    } catch {
      supported = false;
    }
    if (!supported) {
      setWebglFailed(true);
      return;
    }

    let raf = 0;
    let attempts = 0;
    const check = () => {
      attempts += 1;
      const r = el.getBoundingClientRect();
      const visible = el.offsetParent !== null;
      if (r.width > 4 && r.height > 4 && visible) {
        setReady(true);
        setWebglFailed(false);
        return;
      }
      // Keep waiting up to ~2.5s for the layout to settle; if it never
      // becomes visible, fall back to the static core instead of mounting a
      // doomed WebGL context.
      if (attempts < 25) {
        raf = requestAnimationFrame(check);
      } else {
        setWebglFailed(true);
      }
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-[#020806]",
        active ? "border-emerald-500/25" : "border-white/[0.08]",
        className,
      )}
      style={{
        boxShadow: active
          ? "0 0 80px rgba(16,185,129,0.18), inset 0 0 60px rgba(16,185,129,0.04)"
          : "0 0 60px rgba(255,255,255,0.04)",
      }}
    >
      {/* Grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
        }}
      />
      {/* Constellation mesh */}
      <div className="absolute inset-0 constellation-mesh opacity-25 pointer-events-none" />

      {/* TOP-LEFT status */}
      <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-400/90">
            {active ? "CAPITAL ENGINE · LIVE" : "CAPITAL ENGINE"}
          </span>
        </div>
      </div>

      {/* TOP-RIGHT telemetry */}
      <div className="absolute top-3.5 right-3.5 z-10 text-right">
        <div className="text-[9px] font-mono text-white/30 tracking-wider">GATEWAY</div>
        <div className="text-[9px] font-mono font-bold text-emerald-400 tabular-nums">NODE-XC-001</div>
      </div>

      {/* 3D canvas — only mounts once sized & visible, with static fallback */}
      <div ref={containerRef} className="relative h-[260px] sm:h-[300px] lg:h-[400px]">
        {ready && !webglFailed && (
          <Canvas
            key={`${ready}-${webglFailed}`}
            camera={{ position: [0, 0.2, cameraDistance], fov: 45 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance", failIfMajorPerformanceCaveat: false }}
            onCreated={({ gl }) => {
              // If the browser lost WebGL after all, degrade gracefully.
              const handleLost = (e: Event) => {
                e.preventDefault();
                setWebglFailed(true);
              };
              gl.domElement.addEventListener("webglcontextlost", handleLost);
            }}
          >
            <Scene active={active} />
          </Canvas>
        )}
        {webglFailed && <StaticCore active={active} />}
      </div>

      {/* BOTTOM readout bar */}
      <div className="relative border-t border-emerald-500/15 bg-black/40 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider text-white/35">
          <span className="text-emerald-400">{"\u25CF"}</span> 7 RAILS ARMED
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono tracking-wider text-white/35">
          <span className="text-emerald-400">{"\u25CF"}</span> LATENCY {"<"}1MS
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono tracking-wider text-white/35">
          <span className="text-emerald-400">{"\u25CF"}</span> RESERVES 1:1
        </div>
      </div>
    </div>
  );
}
