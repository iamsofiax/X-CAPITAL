"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useHealth } from "@/hooks/useHealth";
import { useWebglReady } from "@/hooks/useWebglReady";

type Spec = {
  id: string;
  label: string;
  min: number;
  max: number;
  baseline: number;
  idealHigh: boolean;
  digits: number;
  unit?: string;
};

const SPECS: Spec[] = [
  { id: "efficiency", label: "Capital Efficiency", min: 0, max: 100, baseline: 0.96, idealHigh: true, digits: 1, unit: "%" },
  { id: "settlement", label: "Settlement Speed", min: 0, max: 50, baseline: 0.44, idealHigh: false, digits: 0, unit: "ms" },
  { id: "liquidity", label: "Liquidity Ratio", min: 0, max: 1, baseline: 0.92, idealHigh: true, digits: 2 },
  { id: "latency", label: "Execution Latency", min: 0, max: 3, baseline: 0.73, idealHigh: false, digits: 1, unit: "ms" },
  { id: "reserves", label: "Reserve Integrity", min: 0, max: 1, baseline: 0.998, idealHigh: true, digits: 3 },
  { id: "oracle", label: "Oracle Health", min: 0, max: 100, baseline: 0.99, idealHigh: true, digits: 1, unit: "%" },
  { id: "network", label: "Network Status", min: 0, max: 1, baseline: 0.5, idealHigh: true, digits: 2 },
  { id: "velocity", label: "Capital Velocity", min: 240000, max: 420000, baseline: 0.55, idealHigh: true, digits: 0 },
  { id: "load", label: "Infrastructure Load", min: 0, max: 100, baseline: 0.63, idealHigh: false, digits: 1, unit: "%" },
];

const NET_LABELS = ["LINKING", "STABLE", "OPTIMAL"] as const;

const RAILS = [
  { label: "Public Markets", accent: "#ffffff", radius: 1.5, speed: 0.14 },
  { label: "Private Equity", accent: "#f59e0b", radius: 1.82, speed: -0.11 },
  { label: "Tokenized Assets", accent: "#a78bfa", radius: 2.14, speed: 0.09 },
  { label: "Commerce-Capital", accent: "#34d399", radius: 2.46, speed: -0.075 },
  { label: "AI Oracle", accent: "#fb7185", radius: 2.78, speed: 0.06 },
  { label: "Infrastructure", accent: "#818cf8", radius: 3.1, speed: -0.05 },
  { label: "Orbital Economy", accent: "#22d3ee", radius: 3.42, speed: 0.043 },
];

const LEGEND = [
  { label: "Core", color: "#10b981" },
  { label: "Rails", color: "#34d399" },
  { label: "Nodes", color: "#6ee7b7" },
];

const TONE = { good: "text-emerald-400", warn: "text-amber-400", bad: "text-red-400" };
const BAR = { good: "bg-emerald-400/80", warn: "bg-amber-400/80", bad: "bg-red-400/80" };

function scaled(spec: Spec, channel: number) {
  const span = spec.max - spec.min;
  return spec.min + span * (spec.idealHigh ? channel : 1 - channel);
}

function toneOf(spec: Spec, channel: number): "good" | "warn" | "bad" {
  if (spec.id === "load") {
    const v = scaled(spec, channel);
    return v > 92 ? "bad" : v > 80 ? "warn" : "good";
  }
  if (
    (spec.id === "settlement" && scaled(spec, channel) > 42) ||
    (spec.id === "latency" && scaled(spec, channel) > 1.6) ||
    (spec.id === "oracle" && 70 > scaled(spec, channel)) ||
    (spec.id === "network" && channel < 0.5)
  ) {
    return "warn";
  }
  return channel > 0.25 ? "good" : "warn";
}

function formatValue(spec: Spec, channel: number) {
  if (spec.id === "network") return NET_LABELS[channel < 0.5 ? 0 : channel < 0.82 ? 1 : 2];
  if (spec.id === "velocity") return `$${(scaled(spec, channel) / 1000).toFixed(0)}K/s`;
  return `${scaled(spec, channel).toFixed(spec.digits)}${spec.unit ?? ""}`;
}

function seedChannels() {
  const next: Record<string, number> = {};
  for (const spec of SPECS) next[spec.id] = Math.min(0.42, 0.28 + 0.12 * spec.baseline);
  return next;
}

function tickChannels(health: ReturnType<typeof useHealth>["health"], t: number) {
  const wave = (base: number, phase: number) =>
    Math.min(1, Math.max(0, base + 0.035 * Math.sin(0.13 * t + phase) + 0.018 * Math.sin(0.29 * t + 1.7 * phase)));
  const oracle = health?.services.find((s) => s.name === "ai-oracle")?.status;
  const net = health?.status === "healthy" ? 1 : health?.status === "degraded" ? 0.72 : 0.36;
  return {
    efficiency: wave(0.96, 0.4),
    settlement: wave(0.44, 1.2),
    liquidity: wave(0.92, 2.1),
    latency: wave(0.73, 0.8),
    reserves: Math.min(1, wave(0.998, 3)),
    oracle: wave(oracle === "operational" ? 0.985 : oracle === "degraded" ? 0.8 : 0.45, 1.6),
    network: wave(net, 0.1),
    velocity: wave(0.55, 2.6),
    load: wave(0.63, 1),
  };
}

function TwinFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
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
      <div className="relative h-[78%] w-[78%] max-h-[340px] max-w-[340px]">
        {RAILS.map((rail, i) => {
          const size = Math.round(28 + (72 / (RAILS.length - 1)) * i);
          return (
            <div
              key={rail.label}
              className="absolute rounded-full border animate-twin-ring"
              style={{
                width: `${size}%`,
                height: `${size}%`,
                left: `${(100 - size) / 2}%`,
                top: `${(100 - size) / 2}%`,
                borderColor: `${rail.accent}40`,
                animationDuration: `${36 - 3 * i}s`,
                animationDirection: i % 2 ? "reverse" : "normal",
              }}
            />
          );
        })}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative h-14 w-14 rounded-full border border-emerald-400/50 bg-emerald-500/15"
            style={{ boxShadow: "0 0 36px rgba(16,185,129,0.35)" }}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-white/[0.08] bg-black/50 px-2 py-1 backdrop-blur">
        <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">Network Twin</div>
        <div className="font-mono text-[9px] font-bold text-amber-400">STATIC VIEW</div>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 z-10 hidden rounded border border-white/[0.08] bg-black/50 px-2 py-1 text-right backdrop-blur sm:block">
        <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">Settlement</div>
        <div className="font-mono text-[9px] font-bold text-emerald-400 tabular-nums">7/7 ARMED</div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeMod = any;

function loadThree(): Promise<ThreeMod> {
  const w = window as Window & { THREE?: ThreeMod };
  if (w.THREE) return Promise.resolve(w.THREE);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-xc-three]");
    if (existing) {
      existing.addEventListener("load", () => resolve(w.THREE), { once: true });
      existing.addEventListener("error", () => reject(new Error("three load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/three@0.160.1/build/three.min.js";
    script.async = true;
    script.dataset.xcThree = "1";
    script.onload = () => resolve(w.THREE);
    script.onerror = () => reject(new Error("three load"));
    document.head.appendChild(script);
  });
}

function fadeMap(THREE: ThreeMod) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grd = ctx.createLinearGradient(0, 0, 256, 0);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(255,255,255,0.8)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 256, 4);
  const tex = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function cometRibbon(THREE: ThreeMod, radius: number, dir: number, span: number) {
  const segs = 48;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const a = -dir * t * span;
    const w = 0.004 + 0.016 * Math.pow(1 - t, 1.35);
    const c = Math.cos(a);
    const s = Math.sin(a);
    positions.push((radius + w) * c, (radius + w) * s, 0, (radius - w * 0.35) * c, (radius - w * 0.35) * s, 0);
    uvs.push(t, 0, t, 1);
    if (i < segs) {
      const b = i * 2;
      indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

function mountTwinScene(host: HTMLDivElement, THREE: ThreeMod, onLost: () => void) {
  const w = host.clientWidth || 560;
  const h = host.clientHeight || 360;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const fit = () => {
    const nw = host.clientWidth || w;
    const nh = host.clientHeight || h;
    const aspect = nw / Math.max(1, nh);
    camera.aspect = aspect;
    camera.fov = aspect < 0.92 ? 46 : 36;
    const radius = 3.72;
    const vFov = (camera.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const dist = 1.06 * Math.max(radius / Math.tan(vFov / 2), radius / Math.tan(hFov / 2));
    camera.position.set(0, dist * 0.2, dist * 0.96);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, true);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
  };
  fit();
  host.appendChild(renderer.domElement);
  renderer.domElement.addEventListener("webglcontextlost", (e: Event) => {
    e.preventDefault();
    onLost();
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(5, 6, 3);
  scene.add(dir);
  const grid = new THREE.GridHelper(12, 24, 0x12382c, 0x07140f);
  grid.position.set(0, -3.2, 0);
  const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMats.forEach((mat: { transparent: boolean; opacity: number }) => {
    mat.transparent = true;
    mat.opacity = 0.22;
  });
  scene.add(grid);

  const starPos = new Float32Array(1260);
  const starCol = new Float32Array(1260);
  const color = new THREE.Color();
  for (let i = 0; i < 420; i++) {
    const a = Math.random() * Math.PI * 2;
    const b = Math.acos(2 * Math.random() - 1);
    const r = 5.5 + 9 * Math.random();
    starPos[3 * i] = r * Math.sin(b) * Math.cos(a);
    starPos[3 * i + 1] = r * Math.sin(b) * Math.sin(a);
    starPos[3 * i + 2] = r * Math.cos(b);
    const l = 0.25 + 0.75 * Math.random();
    color.setRGB(l, l, 1.05 * l);
    starCol[3 * i] = color.r;
    starCol[3 * i + 1] = color.g;
    starCol[3 * i + 2] = color.b;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starCol, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ size: 0.018, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true, depthWrite: false }),
  );
  scene.add(stars);

  const core = new THREE.Group();
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  const cortex = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 1),
    new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  const nucleus = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.34, 0),
    new THREE.MeshStandardMaterial({
      color: 0x04120e,
      emissive: 0x10b981,
      emissiveIntensity: 2.2,
      roughness: 0.18,
      metalness: 0.92,
    }),
  );
  const iris = new THREE.Mesh(
    new THREE.TorusGeometry(0.48, 0.016, 10, 80),
    new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  iris.rotation.x = Math.PI / 2;
  const attention = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.01, 8, 96),
    new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  attention.rotation.x = Math.PI / 2.7;
  const meridians = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.16, depthWrite: false }),
  );
  const coreLight = new THREE.PointLight(0x22d3ee, 1.8, 8);
  const coreLightB = new THREE.PointLight(0xa78bfa, 0.9, 6);
  coreLightB.position.set(0.4, 0.3, 0.2);
  core.add(halo, meridians, cortex, nucleus, iris, attention, coreLight, coreLightB);

  const rigs: { spin: { rotation: { z: number } }; speed: number }[] = [];
  const marker = new THREE.Object3D();
  const heads = [0.02, 0.35, 0.68];
  const streak = fadeMap(THREE);
  RAILS.forEach((rail, i) => {
    const tilt = new THREE.Group();
    tilt.rotation.set(0.42 * i + 0.18, 0.28, 0);
    const spin = new THREE.Group();
    tilt.add(spin);
    scene.add(tilt);

    const dir = rail.speed >= 0 ? 1 : -1;
    const track = (tube: number, opacity: number) =>
      new THREE.Mesh(
        new THREE.TorusGeometry(rail.radius, tube, 10, 180),
        new THREE.MeshBasicMaterial({
          color: rail.accent,
          transparent: true,
          opacity,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
    spin.add(track(0.0045, 0.72));

    const ribbonGeo = cometRibbon(THREE, rail.radius, dir, 1.75);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: streak,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    heads.forEach((headU) => {
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.rotation.z = headU * Math.PI * 2;
      spin.add(ribbon);
      const a = headU * Math.PI * 2;
      const glowHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 10, 10),
        new THREE.MeshBasicMaterial({
          color: rail.accent,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      glowHead.position.set(Math.cos(a) * rail.radius, Math.sin(a) * rail.radius, 0);
      head.position.copy(glowHead.position);
      spin.add(glowHead, head);
    });

    marker.position.set(Math.cos(heads[0] * Math.PI * 2) * rail.radius, Math.sin(heads[0] * Math.PI * 2) * rail.radius, 0);
    const lead = new THREE.PointLight(rail.accent, 2.2, rail.radius * 1.8, 2);
    lead.position.copy(marker.position);
    spin.add(lead);
    rigs.push({ spin, speed: rail.speed * 6.5 });
  });

  core.traverse((obj: { renderOrder: number; material?: { depthTest: boolean } | { depthTest: boolean }[] }) => {
    obj.renderOrder = 4;
    const mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
    mats.forEach((mat) => {
      mat.depthTest = false;
    });
  });
  scene.add(core);

  let raf = 0;
  let last = performance.now();
  const clock0 = last;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - clock0) / 1000;
    core.rotation.y += 0.0022 * dt * 60;
    cortex.rotation.y -= 0.004 * dt * 60;
    cortex.rotation.x += 0.0015 * dt * 60;
    iris.rotation.z = t * 0.35;
    attention.rotation.z = -t * 0.22;
    nucleus.scale.setScalar(1 + 0.04 * Math.sin(1.1 * t));
    coreLight.intensity = 1.7 + 0.7 * (0.5 + 0.5 * Math.sin(1.4 * t));
    stars.rotation.y += 0.004 * dt;
    rigs.forEach((rig) => {
      rig.spin.rotation.z = t * rig.speed;
    });
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const onResize = () => fit();
  window.addEventListener("resize", onResize);
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
  ro?.observe(host);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    ro?.disconnect();
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  };
}

function TwinViewport({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { webglReady, webglFailed, markWebglFailed } = useWebglReady();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!webglReady || webglFailed || failed) return;
    const host = hostRef.current;
    if (!host) return;
    let cleanup = () => {};
    let alive = true;
    loadThree()
      .then((THREE) => {
        if (!alive || !hostRef.current) return;
        cleanup = mountTwinScene(hostRef.current, THREE, () => {
          setFailed(true);
          markWebglFailed();
        });
      })
      .catch(() => {
        setFailed(true);
        markWebglFailed();
      });
    return () => {
      alive = false;
      cleanup();
    };
  }, [webglReady, webglFailed, failed, markWebglFailed]);

  return (
    <div className={className}>
      {webglReady && !webglFailed && !failed && <div ref={hostRef} className="absolute inset-0" />}
      {(webglFailed || failed) && <TwinFallback />}
    </div>
  );
}

function MetricCell({
  spec,
  channel,
  value,
  index = 0,
}: {
  spec: Spec;
  channel: number;
  value: string;
  index?: number;
}) {
  const tone = toneOf(spec, channel);
  const fill = spec.id === "load" ? channel : spec.idealHigh ? channel : 1 - channel;
  return (
    <div
      className="group/met relative overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.015] px-3 py-2.5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.03]"
      style={{ animationDelay: `${60 * index}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[8px] font-mono uppercase tracking-[0.18em] text-white/35">{spec.label}</span>
        <span
          className={cn(
            "h-1 w-1 shrink-0 rounded-full",
            tone === "good" ? "bg-emerald-400" : tone === "warn" ? "bg-amber-400" : "bg-red-400",
          )}
          style={{ boxShadow: "0 0 6px currentColor" }}
        />
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className={cn("font-mono text-sm font-bold tabular-nums leading-none tracking-tight", TONE[tone])}>
          {value}
        </span>
      </div>
      <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn("h-full rounded-full transition-[width] duration-300 ease-out", BAR[tone])} style={{ width: `${Math.round(100 * fill)}%` }} />
      </div>
    </div>
  );
}

const CLOCK0 = typeof performance !== "undefined" ? performance.now() / 1000 : 0;

function useTwinChannels() {
  const { health } = useHealth(30_000);
  const [channels, setChannels] = useState(seedChannels);
  const channelsRef = useRef(channels);
  const healthRef = useRef(health);
  useEffect(() => {
    healthRef.current = health;
  }, [health]);
  useEffect(() => {
    let alive = true;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      if (!alive) return;
      const t = (now - start) / 1000 + CLOCK0;
      const dt = now - ((step as { last?: number }).last ?? now);
      (step as { last?: number }).last = now;
      const lerp = 1 - Math.pow(0.95, Math.min(2, dt / 16.667));
      const target = tickChannels(healthRef.current, t);
      const cur = channelsRef.current;
      let dirty = false;
      for (const spec of SPECS) {
        const next = cur[spec.id] + (target[spec.id as keyof typeof target] - cur[spec.id]) * lerp;
        if (Math.abs(next - cur[spec.id]) > 1e-5) dirty = true;
        cur[spec.id] = next;
      }
      if (dirty) {
        channelsRef.current = { ...cur };
        setChannels(channelsRef.current);
      }
      raf = requestAnimationFrame(step);
    };
    (step as { last?: number }).last = start;
    raf = requestAnimationFrame(step);
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        alive = false;
        cancelAnimationFrame(raf);
      } else if (!alive) {
        alive = true;
        (step as { last?: number }).last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  const values: Record<string, string> = {};
  for (const spec of SPECS) values[spec.id] = formatValue(spec, channels[spec.id]);
  return { channels, values, specs: SPECS };
}

export function CapitalNetworkTwin({ className }: { className?: string }) {
  const { channels, values, specs } = useTwinChannels();
  const { health } = useHealth(30_000);
  const latency = health?.latencyMs ?? "—";
  const net = channels.network;
  const sync = net >= 0.82 ? "SYNC STABLE" : net >= 0.55 ? "SYNC LINKING" : "SYNC REQUESTED";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#02080c]",
        "shadow-[0_0_90px_rgba(34,211,238,0.10)]",
        className,
      )}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.22) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse at center, black 0%, transparent 82%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 0%, transparent 82%)",
        }}
      />
      <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-cyan-300/90">SUPER AGI CORE · LIVE</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] font-mono uppercase tracking-widest text-white/30">
          <span className="hidden sm:inline">GATEWAY {health?.status ?? "REQUEST"}</span>
          <span className="text-emerald-400/80">
            {sync} {latency === "—" ? "" : `· ${latency}ms`}
          </span>
        </div>
      </div>
      <div className="relative aspect-square w-full sm:aspect-auto sm:h-[400px]">
        <TwinViewport className="absolute inset-0" />
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded border border-cyan-400/20 bg-black/55 px-2 py-1 backdrop-blur">
          <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">Super AGI Core</div>
          <div className="font-mono text-[9px] font-bold text-cyan-300">{sync}</div>
        </div>
        <div className="pointer-events-none absolute right-3 top-3 z-10 hidden rounded border border-violet-400/20 bg-black/55 px-2 py-1 text-right backdrop-blur sm:block">
          <div className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/35">Attention</div>
          <div className="font-mono text-[9px] font-bold text-violet-300 tabular-nums">7/7 RAILS</div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 hidden flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 sm:flex">
          {RAILS.map((rail) => (
            <span key={rail.label} className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-wider text-white/40">
              <span className="h-1 w-1 rounded-full" style={{ background: rail.accent }} />
              {rail.label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative grid grid-cols-2 gap-2 border-t border-white/[0.06] bg-black/30 p-3 sm:grid-cols-3 sm:gap-2.5">
        {specs.map((spec, i) => (
          <MetricCell key={spec.id} spec={spec} channel={channels[spec.id]} value={values[spec.id]} index={i} />
        ))}
      </div>
      <div className="relative flex items-center justify-between border-t border-white/[0.06] px-4 py-2 font-mono text-[8px] uppercase tracking-widest text-white/25">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
          SUB-30MS SETTLEMENT MESH
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </span>
        <span className="text-emerald-400/60">RESERVES 1:1</span>
      </div>
    </div>
  );
}
