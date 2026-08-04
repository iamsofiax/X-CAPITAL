"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";

/* ══════════════════════════════════════════════════════════════════════
   TwinScene — the Capital Network Twin's 3D core.

   A settlement core at the center of seven capital rails. Capital packets
   stream outward along each rail as instanced glowing dots; peer hubs
   (asset nodes) orbit; a sparse starfield reads as the wider market
   surface; a faint deck grid grounds the field like a mission floor.

   Performance contract:
   - One InstancedMesh per layer (packets, hubs, stars): constant draw
     calls regardless of particle count.
   - No postprocessing. Depth comes from fog + layered additive blending
     (the classic bloom-free "hardware glow").
   - DPR capped at 2, `powerPreference: high-performance`.
   - The frame clock drives rotation; the loop is paused entirely by
     react-three-fiber when the tab is hidden.

   WebGL hardening: the Canvas only mounts if the browser can actually
   create a WebGL context. Mounting it on a machine where WebGL is blocked
   (GPU blacklist, disabled acceleration, remote desktop, crashed GPU
   process) throws "Error creating WebGL context" and trips the page-level
   error boundary — the whole landing page turns into "Something went
   wrong". If WebGL is unavailable we render a static multi-ring twin so
   the section always stays intact.
   ══════════════════════════════════════════════════════════════════════ */

export const RAILS = [
  { label: "Public Markets", accent: "#ffffff", radius: 1.5, speed: 0.14 },
  { label: "Private Equity", accent: "#f59e0b", radius: 1.82, speed: -0.11 },
  { label: "Tokenized Assets", accent: "#a78bfa", radius: 2.14, speed: 0.09 },
  { label: "Commerce-Capital", accent: "#34d399", radius: 2.46, speed: -0.075 },
  { label: "AI Oracle", accent: "#fb7185", radius: 2.78, speed: 0.06 },
  { label: "Infrastructure", accent: "#818cf8", radius: 3.1, speed: -0.05 },
  { label: "Orbital Economy", accent: "#22d3ee", radius: 3.42, speed: 0.043 },
] as const;

const PACKETS_PER_RAIL = 14;
const TOTAL_PACKETS = PACKETS_PER_RAIL * RAILS.length;
const HUB_COUNT = 64;
const STAR_COUNT = 420;
const CORE_RADIUS = 0.52;

// ── Per-instance animation data, built once ─────────────────────────────
interface PacketMeta {
  railIndex: number;
  phase: number;
  speedFactor: number;
}

interface HubMeta {
  radius: number;
  phase: number;
  speed: number;
  yAmp: number;
}

function buildPacketMeta(): PacketMeta[] {
  const metas: PacketMeta[] = [];
  for (let r = 0; r < RAILS.length; r++) {
    for (let p = 0; p < PACKETS_PER_RAIL; p++) {
      metas.push({
        railIndex: r,
        phase: (p / PACKETS_PER_RAIL) * Math.PI * 2 + r * 0.35,
        // Vary speed ±25% so packets never conga-line.
        speedFactor: 0.85 + Math.random() * 0.3,
      });
    }
  }
  return metas;
}

function buildHubMeta(): HubMeta[] {
  const metas: HubMeta[] = [];
  for (let i = 0; i < HUB_COUNT; i++) {
    const radius = 0.85 + Math.random() * 3.4;
    metas.push({
      radius,
      phase: Math.random() * Math.PI * 2,
      speed: (0.05 + Math.random() * 0.12) * (Math.random() > 0.5 ? 1 : -1),
      yAmp: 0.25 + Math.random() * 0.7,
    });
  }
  return metas;
}

// ── Settlement core — the capital clearing engine ──────────────────────
function SettlementCore() {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current || !inner.current) return;
    group.current.rotation.y += 0.0016 * state.clock.getDelta() * 60;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.035;
    inner.current.scale.setScalar(pulse);
  });

  return (
    <group ref={group}>
      {/* Outer aura */}
      <mesh>
        <sphereGeometry args={[CORE_RADIUS * 1.9, 24, 24]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.045} depthWrite={false} />
      </mesh>
      {/* Wireframe lattice — reads as the clearing engine mesh */}
      <mesh>
        <sphereGeometry args={[CORE_RADIUS * 1.45, 18, 18]} />
        <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.28} depthWrite={false} />
      </mesh>
      {/* Solid core */}
      <mesh ref={inner}>
        <sphereGeometry args={[CORE_RADIUS, 24, 24]} />
        <meshStandardMaterial
          color="#0b3324"
          emissive="#10b981"
          emissiveIntensity={0.9}
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>
      {/* Equatorial capital band */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CORE_RADIUS * 1.16, 0.012, 8, 64]} />
        <meshBasicMaterial color="#6ee7b7" transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2.45, 0, 0]}>
        <torusGeometry args={[CORE_RADIUS * 1.34, 0.008, 8, 64]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.45} />
      </mesh>
      {/* Center glow */}
      <pointLight position={[0, 0, 0]} distance={7} intensity={1.4} color="#34d399" />
    </group>
  );
}

// ── Rail rings + orbiting hub nodes ────────────────────────────────────
function RailSystem() {
  const rings = useMemo(() => new Map<number, THREE.Mesh>(), []);
  const hubsRef = useRef<THREE.InstancedMesh>(null);
  const hubMeta = useMemo(buildHubMeta, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Rotate each ring on its local X axis (tilt) for depth.
    for (let i = 0; i < RAILS.length; i++) {
      const mesh = rings.get(i);
      if (mesh) mesh.rotation.z = t * RAILS[i].speed;
    }
    // Hub nodes — each orbits its own radius/phase, slow, purposeful.
    const mesh = hubsRef.current;
    if (!mesh) return;
    for (let i = 0; i < HUB_COUNT; i++) {
      const m = hubMeta[i];
      const a = m.phase + t * m.speed;
      dummy.position.set(
        Math.cos(a) * m.radius,
        Math.sin(t * 0.4 + i) * m.yAmp * 0.32,
        Math.sin(a) * m.radius,
      );
      dummy.scale.setScalar(0.045 + 0.02 * Math.sin(t * 0.6 + i));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {RAILS.map((rail, i) => (
        <mesh
          key={rail.label}
          ref={(el) => {
            if (el) rings.set(i, el);
          }}
          rotation={[i * 0.45 + 0.2, 0.3, 0]}
        >
          <torusGeometry args={[rail.radius, 0.0065, 6, 128]} />
          <meshBasicMaterial color={rail.accent} transparent opacity={0.34} depthWrite={false} />
        </mesh>
      ))}
      <instancedMesh ref={hubsRef} args={[undefined, undefined, HUB_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#6ee7b7" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

// ── Capital packets — money moving along the rails ─────────────────────
function CapitalPackets() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const metas = useMemo(buildPacketMeta, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < TOTAL_PACKETS; i++) {
      const meta = metas[i];
      const rail = RAILS[meta.railIndex];
      const angle = meta.phase + t * rail.speed * meta.speedFactor;
      const radius = rail.radius + 0.01;
      // Slight vertical breathing so packets read as volumetric, not flat.
      const y = Math.sin(t * 1.6 + meta.phase * 3) * 0.03;
      dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const brightness = 0.75 + 0.25 * Math.sin(t * 3 + meta.phase);
      dummy.scale.setScalar(0.05 * brightness);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, TOTAL_PACKETS]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} />
    </instancedMesh>
  );
}

// ── Starfield — the wider market surface ───────────────────────────────
function Starfield() {
  const starsRef = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const col = new THREE.Color();
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5.5 + Math.random() * 9;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const shade = 0.25 + Math.random() * 0.75;
      col.setRGB(shade, shade, shade * 1.05);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    if (starsRef.current) starsRef.current.rotation.y += delta * 0.004;
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ── Mission deck — grounding grid plane ────────────────────────────────
function DeckGrid() {
  return (
    <gridHelper
      args={[14, 26, "#0d2b1e", "#0a1a12"]}
      position={[0, -3.6, 0]}
    />
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 6, 3]} intensity={0.6} color="#ffffff" />

      <DeckGrid />
      <Starfield />
      <SettlementCore />
      <RailSystem />
      <CapitalPackets />
    </>
  );
}

/* ── Static fallback — pure CSS twin when WebGL is unavailable ──────────
   Same visual language: elliptical orbital rings with the seven rail
   accents around a glowing settlement core. Keeps the section intact. */
function StaticTwinFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 80%)",
        }}
      />
      {/* Orbital rings — perspective ellipse via scaleY */}
      <div className="relative h-[200px] w-[200px] sm:h-[240px] sm:w-[240px]">
        {RAILS.map((rail, i) => {
          const pct = Math.round(28 + i * ((100 - 28) / (RAILS.length - 1)));
          return (
            <div
              key={rail.label}
              className="absolute rounded-full border"
              style={{
                width: `${pct}%`,
                height: `${pct}%`,
                left: `${(100 - pct) / 2}%`,
                top: `${(100 - pct) / 2}%`,
                borderColor: `${rail.accent}40`,
                transform: "scaleY(0.42)",
                animation: `twinRingSpin ${36 - i * 3}s linear infinite${i % 2 ? " reverse" : ""}`,
              }}
            />
          );
        })}
        {/* Settlement core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative h-14 w-14 rounded-full border border-emerald-400/50 bg-emerald-500/10"
            style={{ boxShadow: "0 0 36px rgba(16,185,129,0.35)" }}
          >
            <div className="absolute inset-1.5 animate-pulse rounded-full bg-emerald-500/20" />
          </div>
        </div>
      </div>
      {/* Status chip — same corner readout as the 3D scene */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-white/[0.08] bg-black/50 px-2 py-1 backdrop-blur">
        <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">Network Twin</div>
        <div className="font-mono text-[9px] font-bold text-amber-400">STATIC VIEW</div>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 z-10 hidden rounded border border-white/[0.08] bg-black/50 px-2 py-1 text-right backdrop-blur sm:block">
        <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">Settlement</div>
        <div className="font-mono text-[9px] font-bold text-emerald-400 tabular-nums">7/7 ARMED</div>
      </div>

      <style jsx>{`
        @keyframes twinRingSpin {
          from {
            transform: rotate(0deg) scaleY(0.42);
          }
          to {
            transform: rotate(360deg) scaleY(0.42);
          }
        }
      `}</style>
    </div>
  );
}

interface TwinSceneProps {
  className?: string;
}

export default function TwinScene({ className }: TwinSceneProps) {
  const { webglReady, webglFailed, markWebglFailed } = useWebGLSupport();

  return (
    <div className={className}>
      {webglReady && !webglFailed && (
        <Canvas
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
          camera={{ position: [0, 1.15, 6.4], fov: 42 }}
          style={{ background: "transparent" }}
          onCreated={({ gl }) => {
            // If the browser loses WebGL after all, degrade gracefully.
            const handleLost = (e: Event) => {
              e.preventDefault();
              markWebglFailed();
            };
            gl.domElement.addEventListener("webglcontextlost", handleLost);
          }}
        >
          <Scene />
        </Canvas>
      )}
      {webglFailed && <StaticTwinFallback />}
    </div>
  );
}
