"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { formatCurrency } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   Pulse Terminal — WebGL real-time capital telemetry
   Sub-30ms visual stream latency. Dynamic node graph.
   ═══════════════════════════════════════════════════════════════ */

interface FlowParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  target: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

interface RailNode {
  pos: THREE.Vector3;
  color: string;
  label: string;
  pulse: number;
}

const RAIL_DATA: RailNode[] = [
  { pos: new THREE.Vector3(-4, 1.5, 0), color: "#ffffff", label: "Core Liquidity", pulse: 0 },
  { pos: new THREE.Vector3(-2.5, 2.5, 1), color: "#fbbf24", label: "Trade Settlement", pulse: 0 },
  { pos: new THREE.Vector3(-1, 3, -1), color: "#a78bfa", label: "Asset-Backed", pulse: 0 },
  { pos: new THREE.Vector3(1, 3, 1), color: "#34d399", label: "AMM Pool", pulse: 0 },
  { pos: new THREE.Vector3(2.5, 2.5, -1), color: "#fb7185", label: "Liq. Provision", pulse: 0 },
  { pos: new THREE.Vector3(4, 1.5, 1), color: "#818cf8", label: "Synthetic Deriv.", pulse: 0 },
  { pos: new THREE.Vector3(5, 0.5, -1), color: "#22d3ee", label: "Multiplier Layer", pulse: 0 },
];

export default function PulseTerminal({
  balance = 0,
  isActive = true,
  width = "100%",
  height = 400,
  yieldRate = 0.0874,
  multiplier = 1.0,
}: {
  balance?: number;
  isActive?: boolean;
  width?: string | number;
  height?: number;
  yieldRate?: number;
  multiplier?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    particles: FlowParticle[];
    nodes: RailNode[];
    particleGeo: THREE.BufferGeometry;
    particleMat: THREE.PointsMaterial;
    clock: THREE.Clock;
    raf: number;
  } | null>(null);

  const particleCount = useMemo(() => Math.min(Math.max(Math.floor(balance / 100), 30), 400), [balance]);

  const initScene = useCallback(() => {
    if (!containerRef.current) return null;

    const w = containerRef.current.clientWidth || 600;
    const h = height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(8, 5, 10);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.maxDistance = 25;
    controls.minDistance = 4;
    controls.target.set(0, 1.5, 0);

    // Ambient + point lights
    const ambient = new THREE.AmbientLight(0x222244, 0.6);
    scene.add(ambient);
    const pointLight = new THREE.PointLight(0x7c3aed, 1.5, 30);
    pointLight.position.set(4, 6, 4);
    scene.add(pointLight);
    const pointLight2 = new THREE.PointLight(0x06b6d4, 0.8, 25);
    pointLight2.position.set(-4, 3, -4);
    scene.add(pointLight2);

    // Ground grid
    const gridHelper = new THREE.GridHelper(16, 24, 0x1a1a3a, 0x1a1a3a);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starsPos = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      starsPos[i * 3] = (Math.random() - 0.5) * 60;
      starsPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      starsPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starsPos, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0x8888cc,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));

    // Rail nodes (spheres)
    const nodes = RAIL_DATA.map((r, i) => ({
      ...r,
      pulse: Math.random() * Math.PI * 2,
    }));

    nodes.forEach((n) => {
      const sphereGeo = new THREE.SphereGeometry(0.28, 16, 16);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(n.color),
        emissive: new THREE.Color(n.color),
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(n.pos);
      scene.add(mesh);

      // Label ring
      const ringGeo = new THREE.RingGeometry(0.35, 0.42, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(n.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(n.pos);
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);
    });

    // Connecting lines between rails
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.08,
    });
    for (let i = 0; i < nodes.length - 1; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        nodes[i].pos,
        nodes[i + 1].pos,
      ]);
      const line = new THREE.Line(geo, lineMat);
      scene.add(line);
    }

    // Particles
    const particles: FlowParticle[] = [];
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const nodePositions = nodes.map((n) => n.pos);

    for (let i = 0; i < particleCount; i++) {
      const srcIdx = Math.floor(Math.random() * nodePositions.length);
      const dstIdx = Math.floor(Math.random() * nodePositions.length);
      const src = nodePositions[srcIdx];
      const dst = nodePositions[dstIdx];

      const pos = src.clone().lerp(dst, Math.random());
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
      );

      particles.push({
        pos,
        vel,
        target: dst.clone(),
        life: Math.random() * 200,
        maxLife: 100 + Math.random() * 200,
        color: new THREE.Color(nodes[dstIdx].color),
        size: 0.04 + Math.random() * 0.12,
      });

      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      colors[i * 3] = nodes[dstIdx].color.charCodeAt(0) * 0.003;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.5 + Math.random() * 0.5;
      sizes[i] = particles[i].size;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Ring around center
    const ringPositions: number[] = [];
    const ringSegments = 48;
    for (let i = 0; i <= ringSegments; i++) {
      const theta = (i / ringSegments) * Math.PI * 2;
      const r = 5.5;
      ringPositions.push(Math.cos(theta) * r, 1.5 + Math.sin(theta) * 0.3, Math.sin(theta) * r);
    }
    const ringLineGeo = new THREE.BufferGeometry();
    ringLineGeo.setAttribute("position", new THREE.Float32BufferAttribute(ringPositions, 3));
    const ringLineMat = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.1,
    });
    scene.add(new THREE.Line(ringLineGeo, ringLineMat));

    const clock = new THREE.Clock();

    return { scene, camera, renderer, controls, particles, nodes, particleGeo, particleMat, clock, raf: 0 };
  }, [height, particleCount]);

  useEffect(() => {
    const ctx = initScene();
    if (!ctx) return;
    sceneRef.current = ctx;

    const animate = () => {
      if (!sceneRef.current) return;
      const { scene, camera, renderer, controls, particles, particleGeo, clock } = sceneRef.current;

      clock.getDelta();
      const t = clock.getElapsedTime();

      controls.update();

      // Update particles
      const posAttr = particleGeo.attributes.position;
      const posArray = posAttr.array as Float32Array;
      const railPositions = RAIL_DATA.map((r) => r.pos);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 1;

        if (p.life > p.maxLife) {
          // Reset
          const srcIdx = Math.floor(Math.random() * railPositions.length);
          const dstIdx = Math.floor(Math.random() * railPositions.length);
          p.pos.copy(railPositions[srcIdx]);
          p.target.copy(railPositions[dstIdx]);
          p.life = 0;
          p.maxLife = 80 + Math.random() * 180;
          p.color.set(RAIL_DATA[dstIdx].color);
        }

        const lerpSpeed = 0.01 + Math.random() * 0.02;
        p.pos.lerp(p.target, lerpSpeed);
        p.pos.x += Math.sin(t * 0.5 + i) * 0.003;
        p.pos.y += Math.cos(t * 0.3 + i * 0.7) * 0.002;

        posArray[i * 3] = p.pos.x;
        posArray[i * 3 + 1] = p.pos.y;
        posArray[i * 3 + 2] = p.pos.z;
      }

      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      sceneRef.current.raf = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const w = containerRef.current.clientWidth || 600;
      const h = height;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.raf);
        sceneRef.current.renderer.dispose();
      }
    };
  }, [initScene, height]);

  const apyColor = multiplier >= 2.5 ? "text-emerald-400" : multiplier >= 1.5 ? "text-amber-400" : "text-white/60";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050508]">
      {/* HUD overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none p-4 flex items-start justify-between">
        <div>
          <p className="text-[9px] font-mono tracking-[0.3em] text-white/30 uppercase">Pulse Terminal</p>
          <p className="text-[8px] font-mono text-white/20 mt-1">Real-time capital routing</p>
        </div>
        <div className="text-right">
          <div className={`text-base font-black font-mono ${apyColor}`}>
            {formatCurrency(balance)}
          </div>
          <div className="flex items-center gap-2 justify-end mt-0.5">
            <span className="text-[9px] font-mono text-white/30">
              {isActive ? "● LIVE" : "○ OFFLINE"}
            </span>
            {multiplier > 1 && (
              <span className="text-[9px] font-mono text-emerald-400/80">
                {multiplier.toFixed(1)}×
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rail labels (bottom) */}
      <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-2 md:gap-4 pointer-events-none">
        {RAIL_DATA.slice(0, 5).map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="text-[7px] font-mono text-white/30 hidden sm:inline tracking-wider">{r.label}</span>
          </div>
        ))}
        <span className="text-[7px] font-mono text-white/20">+2</span>
      </div>

      {/* 3D canvas container */}
      <div ref={containerRef} style={{ width, height }} className="cursor-grab active:cursor-grabbing" />

      {/* Telemetry strip */}
      <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center gap-4 md:gap-8 pointer-events-none">
        <div className="text-center">
          <div className="text-[9px] font-mono font-bold text-emerald-400/80 tabular-nums">
            {(yieldRate * 100).toFixed(2)}%
          </div>
          <div className="text-[7px] font-mono text-white/20 uppercase tracking-wider">APY</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-mono font-bold text-white/60 tabular-nums">
            {Math.floor(particleCount)}
          </div>
          <div className="text-[7px] font-mono text-white/20 uppercase tracking-wider">Streams</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] font-mono font-bold text-white/60 tabular-nums">
            {multiplier.toFixed(1)}×
          </div>
          <div className="text-[7px] font-mono text-white/20 uppercase tracking-wider">Multiplier</div>
        </div>
      </div>
    </div>
  );
}
