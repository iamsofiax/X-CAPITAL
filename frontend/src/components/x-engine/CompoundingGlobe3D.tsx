"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Flame, Sparkles } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";

/* ══════════════════════════════════════════════════════════════════════════
   CompoundingGlobe3D — 3D compounding centerpiece for the Uplink.

   Real math drives the visuals:
   - Balance scales the central globe (bigger principal → bigger core).
   - Live accrual spawns rising yield particles.
   - Orbital rings rotate continuously — slow, steady, alive.
   Numbers use A = P(1 + r)^(elapsedHours / 24) so the counters move.
   ══════════════════════════════════════════════════════════════════════════ */

function realCompound(p: number, r: number, t: number): number {
  return p * Math.pow(1 + r, t);
}

interface RingProps {
  radius: number;
  color: string;
  speed: number;
  tilt: [number, number, number];
  opacity?: number;
}

function OrbitalRing({ radius, color, speed, tilt, opacity = 0.35 }: RingProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.z += speed * state.clock.getDelta();
  });
  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, 0.004, 8, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

interface SatelliteProps {
  radius: number;
  speed: number;
  color: string;
  size?: number;
}

function Satellite({ radius, speed, color, size = 0.05 }: SatelliteProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.position.set(
      Math.cos(t) * radius,
      0,
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

interface YieldParticlesProps {
  active: boolean;
  count?: number;
}

function YieldParticles({ active, count = 90 }: YieldParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions] = useState(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.4 + Math.random() * 1.1;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = -1.2 + Math.random() * 2.4;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  });

  const velocities = useMemo(
    () => Array.from({ length: count }, () => 0.003 + Math.random() * 0.008),
    [count],
  );

  useFrame(() => {
    const points = pointsRef.current;
    if (!points) return;
    const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const speed = velocities[i % velocities.length];
      // Rise while armed, otherwise drift slowly
      arr[i * 3 + 1] += active ? speed : speed * 0.08;
      // Wrap to bottom when they pass the top
      if (arr[i * 3 + 1] > 1.4) {
        arr[i * 3 + 1] = -1.4;
        const angle = Math.random() * Math.PI * 2;
        const r = 0.4 + Math.random() * 1.1;
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
        opacity={active ? 0.9 : 0.25}
        sizeAttenuation
      />
    </points>
  );
}

interface GlowingCoreProps {
  balance: number;
}

function GlowingCore({ balance }: GlowingCoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  // Scale the core with balance — bigger principal, bigger core
  const scale = useMemo(() => {
    const clamped = Math.min(Math.max(balance, 0), 1_000_000);
    return 0.55 + (Math.log10(clamped + 10) / 6.5) * 0.75;
  }, [balance]);

  useFrame((state) => {
    if (!groupRef.current || !innerRef.current) return;
    groupRef.current.rotation.y += 0.0018 * state.clock.getDelta() * 60;
    if (balance > 0) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.02;
      innerRef.current.scale.setScalar(scale * pulse);
    } else {
      innerRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer glow shell */}
      <mesh>
        <sphereGeometry args={[scale * 1.45, 32, 32]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.045} />
      </mesh>
      {/* Wireframe lattice */}
      <mesh>
        <sphereGeometry args={[scale * 1.12, 20, 20]} />
        <meshBasicMaterial
          color="#34d399"
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>
      {/* Solid core */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#0b3324"
          emissive="#10b981"
          emissiveIntensity={balance > 0 ? 0.5 : 0.12}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      {/* Equatorial band — reads as rotating capital stream */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[scale * 0.82, 0.008, 8, 64]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[scale * 0.66, 0.006, 8, 64]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

interface SceneProps {
  balance: number;
  isArmed: boolean;
}

function Scene({ balance, isArmed }: SceneProps) {
  const active = isArmed && balance > 0;
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={1.4} color="#34d399" />
      <pointLight position={[-3, -2, -3]} intensity={0.5} color="#10b981" />

      <GlowingCore balance={balance} />

      {/* Orbital rings */}
      <OrbitalRing radius={1.3} color="#10b981" speed={0.12} tilt={[1.1, 0.35, 0]} opacity={0.3} />
      <OrbitalRing radius={1.55} color="#34d399" speed={-0.09} tilt={[0.6, -0.5, 0.4]} opacity={0.24} />
      <OrbitalRing radius={1.8} color="#6ee7b7" speed={0.07} tilt={[1.5, 0.8, 0.2]} opacity={0.16} />

      {/* Satellites */}
      <Satellite radius={1.3} speed={0.55} color="#34d399" size={0.045} />
      <Satellite radius={1.55} speed={-0.4} color="#10b981" size={0.035} />
      <Satellite radius={1.8} speed={0.3} color="#6ee7b7" size={0.03} />

      <YieldParticles active={active} />
    </>
  );
}

/* ── DOM overlay: live count-up numbers ─────────────────────────────────── */

function useCountUp(target: number, durationMs = 1200): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    if (from === target) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
      else prevRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return display;
}

/* ── Static fallback — pure CSS engine when WebGL is unavailable ─────────
   Concentric orbital rings around a glowing core, matching the 3D scene.
   Keeps the section (and its live math readouts) intact. */
function StaticEngineFallback({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 75%)",
        }}
      />
      <div className="relative h-[180px] w-[180px] sm:h-[220px] sm:w-[220px]">
        {[1.3, 1.55, 1.8].map((radius, i) => {
          const pct = Math.round((radius / 2.1) * 100);
          return (
            <div
              key={radius}
              className="absolute rounded-full border"
              style={{
                width: `${pct}%`,
                height: `${pct}%`,
                left: `${(100 - pct) / 2}%`,
                top: `${(100 - pct) / 2}%`,
                borderColor: i === 0 ? "rgba(16,185,129,0.5)" : i === 1 ? "rgba(52,211,153,0.4)" : "rgba(110,231,183,0.3)",
                transform: "scaleY(0.5)",
                animation: `engineRingSpin ${28 - i * 7}s linear infinite${i % 2 ? " reverse" : ""}`,
              }}
            />
          );
        })}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative h-14 w-14 rounded-full border border-emerald-400/50 bg-emerald-500/10"
            style={{ boxShadow: "0 0 36px rgba(16,185,129,0.35)" }}
          >
            <div className="absolute inset-1.5 animate-pulse rounded-full bg-emerald-500/20" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur">
          <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-400 animate-pulse" : "bg-white/20")} />
          <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-400/80">
            {active ? "COMPOUNDING · STATIC" : "NODE STANDBY"}
          </span>
        </div>
      </div>
      <style jsx>{`
        @keyframes engineRingSpin {
          from {
            transform: rotate(0deg) scaleY(0.5);
          }
          to {
            transform: rotate(360deg) scaleY(0.5);
          }
        }
      `}</style>
    </div>
  );
}

interface CompoundingGlobe3DProps {
  balance: number;
  dailyRate?: number;
  isArmed?: boolean;
  nodeId?: string;
  className?: string;
}

export default function CompoundingGlobe3D({
  balance,
  dailyRate = 0.015,
  isArmed = false,
  nodeId,
  className,
}: CompoundingGlobe3DProps) {
  const active = isArmed && balance > 0;
  const startRef = useRef(Date.now());
  const { webglReady, webglFailed, markWebglFailed } = useWebGLSupport();

  // Live accrual — A = P(1 + r)^(elapsedHours / 24)
  const [liveAccrual, setLiveAccrual] = useState(0);
  useEffect(() => {
    if (!active) {
      setLiveAccrual(0);
      return;
    }
    const tick = () => {
      const elapsedHours = (Date.now() - startRef.current) / (1000 * 60 * 60);
      const accr = balance > 0 ? realCompound(balance, dailyRate, elapsedHours / 24) - balance : 0;
      setLiveAccrual(Math.max(0, accr));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [balance, dailyRate, active]);

  const animatedBalance = useCountUp(balance);
  const proj7d = balance * Math.pow(1 + dailyRate, 7);
  const proj30d = balance * Math.pow(1 + dailyRate, 30);
  const proj90d = balance * Math.pow(1 + dailyRate, 90);
  const animatedProj90d = useCountUp(proj90d);

  const glowIntensity = active
    ? "0 0 80px rgba(16,185,129,0.20), inset 0 0 60px rgba(16,185,129,0.04)"
    : "0 0 60px rgba(255,255,255,0.04)";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[#020806]",
        className,
      )}
      style={{
        borderColor: active ? "rgba(16,185,129,0.28)" : "rgba(255,255,255,0.08)",
        boxShadow: glowIntensity,
      }}
    >
      {/* Grid backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
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

      {/* ── MACHINED HEADER — institutional instrumentation strip ── */}
      <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-emerald-400/90">
            {active ? "CAPITAL ENGINE · LIVE" : "CAPITAL ENGINE"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono tracking-wider">
          <span className="text-white/25">GATEWAY</span>
          <span className="font-bold text-emerald-400/90 tabular-nums">
            NODE-{nodeId ? nodeId.toUpperCase().slice(0, 8) : "XC-001"}
          </span>
        </div>
      </div>

      {/* 3D canvas — WebGL-gated: canvas or static CSS fallback */}
      <div className="relative h-[360px] md:h-[440px]">
        {webglReady && !webglFailed ? (
          <Canvas
            camera={{ position: [0, 0.4, 3.4], fov: 45 }}
            dpr={[1, 1.8]}
            onCreated={({ gl }) => {
              // If the browser loses WebGL after all, degrade gracefully.
              const handleLost = (e: Event) => {
                e.preventDefault();
                markWebglFailed();
              };
              gl.domElement.addEventListener("webglcontextlost", handleLost);
            }}
          >
            <Scene balance={balance} isArmed={isArmed} />
          </Canvas>
        ) : webglFailed ? (
          <StaticEngineFallback active={active} />
        ) : null}

        {/* Status badge */}
        {webglReady && !webglFailed && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur">
              <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-400 animate-pulse" : "bg-white/20")} />
              <span className="text-[9px] font-mono font-bold tracking-wider text-emerald-400/80">
                {active ? "COMPOUNDING · 3D" : "NODE STANDBY"}
              </span>
            </div>
            {nodeId && (
              <span className="text-[9px] font-mono text-white/25 tracking-wider">
                NODE {nodeId}
              </span>
            )}
          </div>
        )}

        {/* Live accrual — top right */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-4 right-4 text-right"
            >
              <div className="text-[9px] font-mono text-emerald-400/60 tracking-wider">LIVE ACCRUAL</div>
              <motion.div
                key={Math.round(liveAccrual * 100)}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                className="text-lg md:text-xl font-black font-mono text-emerald-300 tabular-nums"
              >
                +{formatCurrency(liveAccrual)}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration on injection */}
        <AnimatePresence>
          {balance > 0 && active && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.4, y: -30 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <Rocket className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]" />
                  <Sparkles className="w-6 h-6 text-emerald-300" />
                </div>
                <p className="text-[10px] font-black text-emerald-400 tracking-[0.3em] mt-2">CAPITAL INJECTED</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM INSTRUMENTATION BAR — live rail status ── */}
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

      {/* Number readouts — driven by REAL compound math */}
      <div className="relative border-t border-white/[0.05] px-5 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[9px] font-mono text-white/30 tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-emerald-400/70" /> BALANCE
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-white tabular-nums mt-0.5">
              {formatCurrency(animatedBalance)}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/30 tracking-wider">7-DAY PROJECTION</div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-400 tabular-nums mt-0.5">
              {formatCurrency(proj7d)}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/30 tracking-wider">30-DAY PROJECTION</div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-400 tabular-nums mt-0.5">
              {formatCurrency(proj30d)}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono text-white/30 tracking-wider">90-DAY PROJECTION</div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-300 tabular-nums mt-0.5">
              {formatCurrency(animatedProj90d)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <span className="text-[9px] font-mono text-white/20">A = P(1+r)<sup>t</sup> · {(dailyRate * 100).toFixed(2)}%/day</span>
          <span className="text-[9px] font-mono text-emerald-400/50">{balance > 0 ? "REAL-TIME COMPOUNDING" : "FUND TO ACTIVATE"}</span>
        </div>
      </div>
    </div>
  );
}
