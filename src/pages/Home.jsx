import React, { useState, useEffect, useRef } from 'react';
import { Crosshair, Cpu, Wind, Zap, ArrowUpRight, Activity, Map, ChevronLeft, ChevronRight, Mail, Phone, Send, MapPin } from 'lucide-react';
import * as THREE from 'three';
import aboutPilotImage from '../assets/Gemini_Generated_Image_a5upz4a5upz4a5up.png';
import introVideoSrc from '../assets/Video Project.mp4';
import resumePdf from '../assets/resume.pdf';
import ChatWidget from '../components/chat/ChatWidget.jsx';

// --- MATH UTILS ---
const lerp = (start, end, factor) => start + (end - start) * factor;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700;800&family=Space+Grotesk:wght@300;400;500;700;900&display=swap');

  :root {
    --f1-red: #ff1801;
    --carbon: #f4f4f5;
    --cyan: #00ffff;
  }

  body, html {
    background-color: var(--carbon);
    color: #18181b;
    font-family: 'Space Grotesk', sans-serif;
    margin: 0; padding: 0;
    overflow-x: hidden;
    cursor: none;
    scroll-behavior: smooth;
  }

  @media (hover: none) and (pointer: coarse) {
    body, html { cursor: auto; }
    .custom-cursor { display: none !important; }
  }

  .font-syncopate { font-family: 'Syncopate', sans-serif; }

  .noise-overlay {
    position: fixed; inset: 0; z-index: 9997; pointer-events: none; opacity: 0.04;
    background-image: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
  }
  
  .bg-grid {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background-image: 
      linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px);
    background-size: 80px 80px;
    mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
    -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
  }
  
  .tech-grid {
    background-size: 50px 50px;
    background-image:
      linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
  }

  .text-outline {
    color: transparent;
    -webkit-text-stroke: 1px rgba(24, 24, 27, 0.2);
  }

  /* --- REALISTIC F1 LIGHTS --- */
  .f1-gantry {
    background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
    border: 1px solid rgba(255,255,255,0.05);
    box-shadow: 0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
    border-radius: 16px;
    padding: 24px 32px;
    display: flex; gap: 24px;
  }
  .f1-light-housing {
    background: #000; padding: 12px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px;
    box-shadow: inset 0 4px 10px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05);
  }
  .f1-light {
    width: 48px; height: 48px; border-radius: 50%; background: #110000; box-shadow: inset 0 4px 8px rgba(0,0,0,0.9);
    transition: background 0s, box-shadow 0s;
  }
  .f1-light.on {
    background: #fff; box-shadow: 0 0 20px 5px var(--f1-red), 0 0 60px 15px var(--f1-red), inset 0 0 10px rgba(255,255,255,0.8);
  }

  /* --- REVEAL UTILS --- */
  .intro-fade-out { opacity: 0; transform: scale(1.1); transition: opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1), transform 2s cubic-bezier(0.22, 1, 0.36, 1); pointer-events: none; }
  .site-reveal { opacity: 0; transform: translateY(40px) scale(0.98); transition: opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1), transform 1.5s cubic-bezier(0.22, 1, 0.36, 1); }
  .site-reveal.visible { opacity: 1; transform: translateY(0) scale(1); }
  .reveal-block { opacity: 0; transform: translateY(40px); transition: opacity 1s cubic-bezier(0.25, 1, 0.5, 1), transform 1s cubic-bezier(0.25, 1, 0.5, 1); will-change: opacity, transform; }
  .reveal-block.is-visible { opacity: 1; transform: translateY(0); }

  /* --- CUSTOM CURSOR --- */
  .cursor-dot { position: fixed; width: 8px; height: 8px; background: var(--f1-red); border-radius: 50%; pointer-events: none; z-index: 10000; transform: translate(-50%, -50%); }
  .cursor-trail {
    position: fixed; width: 40px; height: 40px; border: 1px solid rgba(255, 24, 1, 0.5); border-radius: 50%; pointer-events: none; z-index: 9999;
    transform: translate(-50%, -50%); transition: width 0.3s, height 0.3s, border-color 0.3s, background 0.3s;
  }
  body:hover .cursor-trail.active { width: 80px; height: 80px; border-color: rgba(0,0,0,0.1); background: rgba(0, 0, 0, 0.05); backdrop-filter: blur(2px); }

  /* --- TRACK ANIMATION --- */
  .track-path { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: drawTrack 4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
  @keyframes drawTrack { to { stroke-dashoffset: 0; } }

  .glass-panel { background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 30px 60px rgba(0,0,0,0.05); }
  .glass-panel-dark { background: rgba(20, 20, 20, 0.55); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255,255,255,0.10); }
  .text-glow { text-shadow: 0 0 30px rgba(255, 24, 1, 0.4); }
  ::-webkit-scrollbar { display: none; }
  
  @keyframes spin-slow { 100% { transform: rotate(360deg); } }
  @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
  @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 0; } 100% { transform: scale(0.8); opacity: 0.5; } }
  .animate-spin-slow { animation: spin-slow 20s linear infinite; }
  .animate-spin-reverse { animation: spin-reverse 15s linear infinite; }
  .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
  
  @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  .bg-grid-dark {
    background-size: 40px 40px;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  }

  /* --- INTRO VIDEO (after lights) --- */
  .intro-video-overlay {
    position: fixed; inset: 0; z-index: 10050;
    display: flex; align-items: center; justify-content: center;
    padding: clamp(8px, 2vmin, 20px);
    background: #000;
    transition: opacity 1.15s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: opacity;
  }
  .intro-video-overlay--enter { opacity: 0; }
  .intro-video-overlay--enter.is-ready { opacity: 1; }
  .intro-video-overlay.intro-video-overlay--exit { opacity: 0; pointer-events: none; }
  .intro-video-frame {
    width: min(98vw, 1920px);
    height: min(92vh, calc(100dvh - 24px));
    max-height: min(92vh, calc(100vh - 24px));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: none;
    box-shadow: none;
    transition: opacity 1.1s cubic-bezier(0.22, 1, 0.36, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
    transform-origin: center center;
  }
  .intro-video-frame video {
    display: block;
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .intro-video-frame--enter { opacity: 0; transform: translateY(12px) scale(0.985); }
  .intro-video-frame--enter.is-ready { opacity: 1; transform: translateY(0) scale(1); }
  .intro-video-overlay.intro-video-overlay--exit .intro-video-frame { opacity: 0; transform: translateY(-8px) scale(0.99); }
`;

// --- CUSTOM CURSOR ---
const CustomCursor = () => {
  const dotRef = useRef(null);
  const trailRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const trailPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateMouse = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', updateMouse);

    const render = () => {
      trailPos.current.x = lerp(trailPos.current.x, pos.current.x, 0.15);
      trailPos.current.y = lerp(trailPos.current.y, pos.current.y, 0.15);
      if (dotRef.current) { dotRef.current.style.left = `${pos.current.x}px`; dotRef.current.style.top = `${pos.current.y}px`; }
      if (trailRef.current) { trailRef.current.style.left = `${trailPos.current.x}px`; trailRef.current.style.top = `${trailPos.current.y}px`; }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    const handleMouseOver = (e) => {
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('.interactive') || e.target.closest('canvas')) {
        trailRef.current.classList.add('active');
      } else {
        trailRef.current.classList.remove('active');
      }
    };
    window.addEventListener('mouseover', handleMouseOver);
    return () => { window.removeEventListener('mousemove', updateMouse); window.removeEventListener('mouseover', handleMouseOver); };
  }, []);

  return (
    <div className="custom-cursor hidden md:block">
      <div ref={dotRef} className="cursor-dot" />
      <div ref={trailRef} className="cursor-trail" />
    </div>
  );
};

// --- MAGNETIC COMPONENT ---
const Magnetic = ({ children, strength = 40, className = "" }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e; const { height, width, left, top } = ref.current.getBoundingClientRect();
    setPosition({ x: ((clientX - (left + width / 2)) / width) * strength, y: ((clientY - (top + height / 2)) / height) * strength });
  };
  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={className}
      style={{ transform: `translate(${position.x}px, ${position.y}px)`, transition: "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)" }}>
      {children}
    </div>
  );
};

const Reveal = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } }, { threshold: 0.2, rootMargin: "0px 0px -50px 0px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`reveal-block ${isVisible ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
};

// --- FEATURE 1: INTERACTIVE WIND TUNNEL CANVAS ---
const WindTunnel = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId; let particles = [];
    const numParticles = window.innerWidth < 768 ? 50 : 150;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; initParticles(); };
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({ x: Math.random() * canvas.width, y: (Math.random() * canvas.height * 0.8) + (canvas.height * 0.1), baseY: 0, speed: 2 + Math.random() * 3, life: Math.random() });
        particles[i].baseY = particles[i].y;
      }
    };

    const handleMouseMove = (e) => { const rect = canvas.getBoundingClientRect(); mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }; };
    const handleMouseLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };

    canvas.addEventListener('mousemove', handleMouseMove); canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resize); resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;
      const radius = 120;
      ctx.lineWidth = 1.5;

      particles.forEach(p => {
        p.x += p.speed;
        if (p.x > canvas.width) { p.x = 0; p.y = p.baseY; p.life = 0; }
        let targetY = p.baseY; const dx = p.x - mx; const dy = p.y - my; const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius) { const force = (radius - dist) / radius; const direction = dy > 0 ? 1 : -1; targetY = p.baseY + (direction * force * 80); }
        p.y += (targetY - p.y) * 0.1; p.life += 0.01;
        const opacity = Math.min(1, p.life * 2) * (1 - (p.x / canvas.width));
        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.15})`;
        ctx.beginPath(); ctx.moveTo(p.x - p.speed * 10, p.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      });

      if (mx > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, radius);
        grad.addColorStop(0, 'rgba(255, 24, 1, 0.05)'); grad.addColorStop(1, 'rgba(255, 24, 1, 0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(mx, my, radius, 0, Math.PI * 2); ctx.fill();
      }
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => { window.removeEventListener('resize', resize); canvas.removeEventListener('mousemove', handleMouseMove); canvas.removeEventListener('mouseleave', handleMouseLeave); cancelAnimationFrame(animationFrameId); };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-[400px] cursor-none rounded-3xl bg-white border border-black/5 shadow-sm" />;
};

// --- FEATURE 2: LIVE CIRCUIT TOPOLOGY ---
const LiveCircuit = () => {
  const [speed, setSpeed] = useState(240); const [gear, setGear] = useState(6); const [throttle, setThrottle] = useState(80);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed(prev => Math.max(80, Math.min(350, prev + (Math.random() * 40 - 20))));
      setGear(Math.floor(Math.random() * 4) + 4);
      setThrottle(Math.floor(Math.random() * 40) + 60);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-3xl p-8 flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden group">
      <div className="relative w-full max-w-md aspect-[4/3] flex items-center justify-center">
        <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-xl">
          <path id="track-path" d="M 50 150 C 50 50, 150 50, 200 100 C 250 150, 350 50, 350 150 C 350 250, 200 280, 150 200 C 100 120, 50 250, 50 150 Z" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
          <path className="track-path" d="M 50 150 C 50 50, 150 50, 200 100 C 250 150, 350 50, 350 150 C 350 250, 200 280, 150 200 C 100 120, 50 250, 50 150 Z" fill="none" stroke="#18181b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle r="6" fill="#ff1801" className="drop-shadow-[0_0_8px_rgba(255,24,1,0.8)]"><animateMotion dur="6s" repeatCount="indefinite" rotate="auto"><mpath href="#track-path" /></animateMotion></circle>
          <line x1="180" y1="60" x2="220" y2="140" stroke="rgba(0,0,0,0.2)" strokeWidth="1" strokeDasharray="4 4" /><text x="210" y="70" className="font-syncopate text-[8px] fill-zinc-400">SECTOR 1</text>
        </svg>
      </div>
      <div className="flex flex-col flex-1 w-full gap-6">
        <div className="flex items-center gap-3 border-b border-black/5 pb-4"><Map className="text-[#ff1801] w-5 h-5" /><span className="font-syncopate text-[10px] tracking-[0.3em] text-zinc-500">LIVE QUALIFYING / SECTOR 2</span></div>
        <div className="grid grid-cols-2 gap-6">
          <div><div className="font-syncopate text-[9px] tracking-widest text-zinc-400 mb-2">VELOCITY</div><div className="font-syncopate text-4xl font-black text-zinc-900 tabular-nums">{Math.floor(speed)} <span className="text-sm text-zinc-400">KM/H</span></div></div>
          <div><div className="font-syncopate text-[9px] tracking-widest text-zinc-400 mb-2">GEAR</div><div className="font-syncopate text-4xl font-black text-[#ff1801] tabular-nums">{gear}</div></div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between font-syncopate text-[9px] tracking-widest text-zinc-500 mb-2"><span>THROTTLE APPLICATION</span><span>{throttle}%</span></div>
          <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-zinc-900 rounded-full transition-all duration-300" style={{ width: `${throttle}%` }}></div></div>
        </div>
      </div>
    </div>
  );
};

// --- STEERING WHEEL: CARBON FIBER TEXTURE ---
const createCarbonFiberTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const isDark = (i + j) % 2 === 0;
      ctx.fillStyle = isDark ? '#111111' : '#1a1a1a';
      ctx.fillRect(i * 16, j * 16, 16, 16);
      ctx.beginPath();
      ctx.moveTo(i * 16, j * 16);
      ctx.lineTo(i * 16 + 16, j * 16 + 16);
      ctx.strokeStyle = isDark ? '#222222' : '#0a0a0a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 4);
  return tex;
};

// --- STEERING WHEEL: DYNAMIC F1 SCREEN RENDERER ---
const drawF1Dash = (ctx, data) => {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, 1024, 512);

  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  for (let i = 0; i < 1024; i += 16) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke(); }
  for (let j = 0; j < 512; j += 16) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(1024, j); ctx.stroke(); }

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 1004, 492);
  ctx.beginPath();
  ctx.moveTo(320, 70); ctx.lineTo(320, 502);
  ctx.moveTo(704, 70); ctx.lineTo(704, 502);
  ctx.moveTo(10, 70); ctx.lineTo(1014, 70);
  ctx.moveTo(704, 256); ctx.lineTo(1014, 256);
  ctx.moveTo(10, 340); ctx.lineTo(320, 340);
  ctx.stroke();

  const totalLeds = 15;
  const ledW = 48;
  const gap = 12;
  const startX = 512 - ((totalLeds * ledW) + ((totalLeds - 1) * gap)) / 2;
  for (let i = 0; i < totalLeds; i++) {
    let color = '#1a1a1a';
    let glow = 0;
    if (i < data.rpmLeds) {
      glow = 20;
      if (i < 5) color = '#00ff00';
      else if (i < 10) color = '#ff0000';
      else color = '#0088ff';
    }
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.beginPath();
    ctx.roundRect(startX + i * (ledW + gap), 20, ledW, 30, 4);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = data.gear === '8' ? '#0088ff' : '#ffffff';
  ctx.font = 'bold 260px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.gear, 512, 310);

  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 130px "Space Grotesk", sans-serif';
  ctx.fillText(Math.floor(data.speed), 165, 210);
  ctx.fillStyle = '#888888';
  ctx.font = '30px "Space Grotesk", sans-serif';
  ctx.fillText('km/h', 165, 280);

  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 80px "Space Grotesk", sans-serif';
  ctx.fillText(Math.floor(data.soc) + '%', 165, 430);
  ctx.fillStyle = '#888888';
  ctx.font = '24px "Space Grotesk", sans-serif';
  ctx.fillText('ERS SOC', 165, 480);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 65px "Space Grotesk", sans-serif';
  ctx.fillText(data.lapTime, 859, 150);
  ctx.fillStyle = '#888888';
  ctx.font = '24px "Space Grotesk", sans-serif';
  ctx.fillText('LAP TIME', 859, 210);

  const isFaster = data.delta < 0;
  ctx.fillStyle = isFaster ? '#00ff00' : '#ff0000';
  ctx.font = 'bold 70px "Space Grotesk", sans-serif';
  ctx.fillText((isFaster ? '' : '+') + data.delta.toFixed(3), 859, 340);
  ctx.fillStyle = '#888888';
  ctx.font = '24px "Space Grotesk", sans-serif';
  ctx.fillText('DELTA', 859, 390);

  ctx.fillStyle = '#ffff00';
  ctx.font = 'bold 60px "Space Grotesk", sans-serif';
  ctx.fillText('56.5', 859, 450);
  ctx.fillStyle = '#888888';
  ctx.font = '20px "Space Grotesk", sans-serif';
  ctx.fillText('BBAL', 859, 485);
};

// --- FEATURE 3: STEERING WHEEL 3D VIEWER ---
const SteeringWheel3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // In dev (StrictMode) effects can run twice; ensure a single canvas.
    mountRef.current.innerHTML = '';

    let width = mountRef.current.clientWidth;
    let height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const fillLight = new THREE.PointLight(0x0088ff, 1.5, 10);
    fillLight.position.set(-3, -2, 3);
    scene.add(fillLight);
    const accentLight = new THREE.PointLight(0xff1801, 1.5, 10);
    accentLight.position.set(3, 2, 3);
    scene.add(accentLight);

    const wheelGroup = new THREE.Group();
    wheelGroup.scale.set(1.24, 1.24, 1.24);
    scene.add(wheelGroup);

    const carbonTex = createCarbonFiberTexture();
    const carbonMat = new THREE.MeshStandardMaterial({
      map: carbonTex, color: 0x444444, roughness: 0.5, metalness: 0.8,
    });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.7 });

    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-1.2, 0.9);
    bodyShape.lineTo(1.2, 0.9);
    bodyShape.quadraticCurveTo(1.6, 0.9, 1.7, 0.5);
    bodyShape.lineTo(1.8, -0.6);
    bodyShape.quadraticCurveTo(1.7, -1.0, 1.3, -1.0);
    bodyShape.lineTo(-1.3, -1.0);
    bodyShape.quadraticCurveTo(-1.7, -1.0, -1.8, -0.6);
    bodyShape.lineTo(-1.7, 0.5);
    bodyShape.quadraticCurveTo(-1.6, 0.9, -1.2, 0.9);

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 });
    bodyGeo.translate(0, 0, -0.1);
    const bodyMesh = new THREE.Mesh(bodyGeo, carbonMat);
    bodyMesh.castShadow = true;
    wheelGroup.add(bodyMesh);

    const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.05, 0.1), bezelMat);
    bezel.position.set(0, 0.25, 0.15);
    wheelGroup.add(bezel);

    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 1024;
    screenCanvas.height = 512;
    const screenCtx = screenCanvas.getContext('2d');
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.minFilter = THREE.LinearFilter;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: screenTex }));
    screen.position.set(0, 0.25, 0.21);
    wheelGroup.add(screen);

    const buildCapsule = (mat, px, py, pz, rotZ) => {
      const g = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.2, 16), mat);
      g.add(shaft);
      const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      capTop.position.y = 0.6;
      g.add(capTop);
      const capBot = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat);
      capBot.position.y = -0.6;
      g.add(capBot);
      g.position.set(px, py, pz);
      g.rotation.z = rotZ;
      return g;
    };
    wheelGroup.add(buildCapsule(gripMat, -1.6, -0.1, 0.05, -0.15));
    wheelGroup.add(buildCapsule(gripMat, 1.6, -0.1, 0.05, 0.15));

    const createBtn = (x, y, color) => {
      const bGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 16);
      const bMat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
      const b = new THREE.Mesh(bGeo, bMat);
      b.rotation.x = Math.PI / 2;
      b.position.set(x, y, 0.15);
      return b;
    };
    wheelGroup.add(createBtn(-1.1, 0.6, 0xff0000));
    wheelGroup.add(createBtn(-1.1, 0.3, 0x00ff00));
    wheelGroup.add(createBtn(-1.1, 0.0, 0x00ffff));
    wheelGroup.add(createBtn(1.1, 0.6, 0x00ff00));
    wheelGroup.add(createBtn(1.1, 0.3, 0xffff00));
    wheelGroup.add(createBtn(1.1, 0.0, 0x0000ff));

    const createDial = (x, y, color) => {
      const dGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.15, 24);
      const dMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
      const d = new THREE.Mesh(dGeo, dMat);
      d.rotation.x = Math.PI / 2;
      d.position.set(x, y, 0.15);
      const accGeo = new THREE.BoxGeometry(0.04, 0.25, 0.05);
      const accMat = new THREE.MeshStandardMaterial({ color });
      const acc = new THREE.Mesh(accGeo, accMat);
      acc.position.set(0, 0.05, 0.08);
      d.add(acc);
      d.rotation.z = (Math.random() - 0.5) * 2;
      return d;
    };
    wheelGroup.add(createDial(-0.7, -0.5, 0xff0000));
    wheelGroup.add(createDial(0, -0.6, 0x00ff00));
    wheelGroup.add(createDial(0.7, -0.5, 0x0088ff));

    let simData = { speed: 80, gear: '2', rpm: 6000, maxRpm: 12500, rpmLeds: 0, lapTime: '1:14.321', delta: -0.154, soc: 89, throttle: true };
    let mouseX = 0;

    const onMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (simData.throttle) {
        simData.rpm += 120;
        simData.speed += (simData.rpm / 10000) * 1.5;
        if (simData.rpm > simData.maxRpm) {
          simData.rpm = 8500;
          let nextGear = parseInt(simData.gear) + 1;
          if (nextGear > 8) { simData.throttle = false; nextGear = 8; }
          simData.gear = nextGear.toString();
        }
      } else {
        simData.speed -= 4.0;
        simData.rpm -= 350;
        if (simData.speed < 80) {
          simData.throttle = true; simData.gear = '2'; simData.rpm = 6000;
        } else if (simData.rpm < 7000 && parseInt(simData.gear) > 2) {
          simData.gear = (parseInt(simData.gear) - 1).toString(); simData.rpm = 11000;
        }
      }

      simData.rpmLeds = Math.max(0, Math.min(15, Math.floor(((simData.rpm - 7000) / (simData.maxRpm - 7000)) * 15)));
      drawF1Dash(screenCtx, simData);
      screenTex.needsUpdate = true;

      wheelGroup.rotation.x = 0;
      wheelGroup.rotation.y = 0;
      wheelGroup.rotation.z = lerp(wheelGroup.rotation.z, -mouseX * 1.2, 0.1);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      width = mountRef.current.clientWidth;
      height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.innerHTML = '';
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full overflow-hidden" />;
};

// --- CINEMATIC LIGHTS OUT INTRO ---
const CinematicLightsOut = ({ onComplete }) => {
  const [activeLights, setActiveLights] = useState(0);
  const [isLightsOut, setIsLightsOut] = useState(false);

  useEffect(() => {
    let timeouts = [];
    for (let i = 1; i <= 5; i++) { timeouts.push(setTimeout(() => setActiveLights(i), i * 800)); }
    const totalOnTime = 5 * 800; const holdTime = 1500;
    timeouts.push(setTimeout(() => { setActiveLights(0); setIsLightsOut(true); setTimeout(onComplete, 200); }, totalOnTime + holdTime));
    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 transition-all duration-1000 ${isLightsOut ? 'intro-fade-out' : 'opacity-100'}`}>
      <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(255, 24, 1, 0.15) 0%, transparent 60%)', opacity: activeLights > 0 && !isLightsOut ? (activeLights * 0.2) : 0 }} />
      <div className="relative z-10 f1-gantry">
        {[1, 2, 3, 4, 5].map((col) => (
          <div key={col} className="f1-light-housing">
            <div className={`f1-light ${activeLights >= col ? 'on' : ''}`} />
            <div className={`f1-light ${activeLights >= col ? 'on' : ''}`} />
          </div>
        ))}
      </div>
      <div className={`mt-16 text-center font-syncopate text-[10px] tracking-[0.5em] text-zinc-400 uppercase transition-opacity duration-300 ${isLightsOut ? 'opacity-0' : 'opacity-100'}`} style={{ fontFamily: 'Syncopate, sans-serif' }}>
        {activeLights === 0 ? 'SYSTEM STANDBY' : activeLights < 5 ? 'GRID FORMATION' : 'HOLD POSITION'}
      </div>
    </div>
  );
};

// --- INTRO VIDEO (plays after signal lights, before main site) ---
const IntroVideoOverlay = ({ src, onComplete }) => {
  const [enterReady, setEnterReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEnterReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
    if (!isMuted) {
      videoRef.current.volume = 1;
      videoRef.current.play().catch(() => {});
    }
  }, [isMuted]);

  const finish = () => {
    if (exiting) return;
    setExiting(true);
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch (_) { /* noop */ }
    }
    window.setTimeout(onComplete, 1150);
  };

  return (
    <div
      className={`intro-video-overlay ${exiting ? 'intro-video-overlay--exit' : `intro-video-overlay--enter ${enterReady ? 'is-ready' : ''}`}`}
      role="presentation"
    >
      <div
        className={`intro-video-frame intro-video-frame--enter relative bg-black ${enterReady ? 'is-ready' : ''}`}
      >
        <video
          ref={videoRef}
          className="bg-black"
          src={src}
          playsInline
          muted={isMuted}
          autoPlay
          preload="auto"
          onEnded={finish}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.22) 100%)',
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => setIsMuted((prev) => !prev)}
        className="interactive absolute top-8 right-8 z-10 font-syncopate text-[9px] tracking-[0.35em] text-zinc-300 hover:text-white border border-white/20 hover:border-[#ff1801]/60 rounded-full px-5 py-2.5 bg-black/40 backdrop-blur-sm transition-all duration-500"
      >
        {isMuted ? 'UNMUTE' : 'MUTE'}
      </button>
      <button
        type="button"
        onClick={finish}
        className="interactive absolute bottom-8 right-8 z-10 font-syncopate text-[9px] tracking-[0.35em] text-zinc-400 hover:text-white border border-white/20 hover:border-[#ff1801]/60 rounded-full px-5 py-2.5 bg-black/40 backdrop-blur-sm transition-all duration-500"
      >
        SKIP
      </button>
    </div>
  );
};

const ChampionshipProjects = () => {
  const projects = [
    { id: 1, title: 'Youtube Video Downloader', description: 'AI-powered tool to download YouTube videos with automatic quality selection.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'AI', 'YouTube API'], accent: 'red' },
    { id: 2, title: 'Spanish Chatbot', description: 'Conversational AI chatbot trained specifically for Spanish language interactions.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'NLP', 'TensorFlow'], accent: 'blue' },
    { id: 3, title: 'Image Captioning with Blip', description: 'Advanced image captioning system using BLIP model for accurate descriptions.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'BLIP', 'Computer Vision'], accent: 'gold' },
    { id: 4, title: 'Movie Recommendation', description: 'Intelligent movie recommendation system based on user preferences and behavior.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'Machine Learning', 'Collaborative Filtering'], accent: 'red' },
    { id: 5, title: 'House Price Prediction', description: 'ML model to predict house prices based on location, features, and market trends.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'Regression', 'Scikit-learn'], accent: 'blue' },
    { id: 6, title: 'Next Word Prediction using LSTM', description: 'Deep learning model using LSTM networks for intelligent text completion.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'LSTM', 'Keras'], accent: 'gold' },
    { id: 7, title: 'Face Detection Model', description: 'Real-time face detection system with high accuracy and performance.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'OpenCV', 'Deep Learning'], accent: 'red' },
    { id: 8, title: 'Real Time Image Captioning', description: 'Live image captioning system that generates descriptions in real-time.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'CNN', 'Real-time Processing'], accent: 'blue' },
    { id: 9, title: 'Gesture Math Solver', description: 'AI system that solves mathematical equations drawn using hand gestures.', category: 'AI/ML', status: 'Completed', technologies: ['Python', 'Computer Vision', 'Gesture Recognition'], accent: 'gold' },
    { id: 10, title: 'Temperature Converter', description: 'A simple and efficient temperature conversion app for Android.', category: 'Android', status: 'Completed', technologies: ['Android', 'Java/Kotlin'], accent: 'red' },
    { id: 11, title: 'Weather App', description: 'Real-time weather forecasting app with location-based updates.', category: 'Android', status: 'Completed', technologies: ['Android', 'Java', 'Weather API'], accent: 'blue' },
    { id: 12, title: 'Fitness Tracking App', description: 'Comprehensive fitness app with workout plans and progress tracking.', category: 'Android', status: 'Completed', technologies: ['Android', 'Kotlin', 'SQLite'], accent: 'gold' },
    { id: 13, title: 'Railway Ticket App', description: 'Mobile application for booking and managing railway tickets.', category: 'Android', status: 'Completed', technologies: ['Android', 'Java', 'Firebase'], accent: 'red' },
    { id: 14, title: 'Music Player App', description: 'Feature-rich music player with playlist management and audio controls.', category: 'Android', status: 'Completed', technologies: ['Android', 'Kotlin', 'MediaPlayer API'], accent: 'blue' },
    { id: 15, title: 'Alumnit', description: 'Social networking platform where alumni can connect and interact with each other.', category: 'Android', status: 'Completed', technologies: ['Android', 'Java', 'Firebase', 'Social Features'], accent: 'gold' },
    { id: 16, title: 'To Do List', description: 'Task management application to organize and track daily activities.', category: 'Web', status: 'Completed', technologies: ['HTML', 'CSS', 'JavaScript'], accent: 'red' },
    { id: 17, title: 'Age Calculator', description: 'Simple web application to calculate age based on date of birth.', category: 'Web', status: 'Completed', technologies: ['HTML', 'CSS', 'JavaScript'], accent: 'blue' },
    { id: 18, title: 'To Do List API', description: 'To-Do List API with Spring Boot with full CRUD functionality and in memory database.', category: 'Backend REST API', status: 'Completed', technologies: ['Java', 'Spring Boot', 'Spring Data JPA', 'H2 In-Memory Database'], accent: 'red' },
    { id: 19, title: 'Microphone to Speaker', description: 'Capturing the mic --> Sending data --> Playing audio', category: 'Backend Application', status: 'Completed', technologies: ['Java', 'Spring Boot', 'Maven'], accent: 'red' },
    { id: 20, title: 'Real-Time Chat Application', description: 'This application allows multiple users to join different chat rooms and exchange messages in real-time using WebSockets.', category: 'Client-Server Application', status: 'Completed', technologies: ['Java', 'Spring Boot', 'Spring WebSocket', 'Maven'], accent: 'red' },
    { id: 21, title: 'URL shortener service', description: 'A fully functional URL shortener service with a web UI, built using Java and Spring Boot.', category: 'Backend REST API', status: 'Completed', technologies: ['Java', 'Spring Boot', 'Spring Data JPA', 'Spring Security'], accent: 'red' },
    { id: 22, title: 'Blog API with Spring Boot', description: 'The project includes full CRUD (Create, Read, Update, Delete) functionality for posts and comments, secured by a modern JWT-based authentication system.', category: 'Backend REST API', status: 'Completed', technologies: ['Java', 'Spring Boot', 'Spring Data JPA', 'Spring Security'], accent: 'red' },
  ];

  const accentToColor = (accent) => {
    if (accent === 'blue') return '#00ffff';
    if (accent === 'gold') return '#fbbf24';
    return '#ff1801';
  };

  const total = projects.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const stageRef = useRef(null);
  const animTimeoutRef = useRef(null);
  const dragStateRef = useRef({ dragging: false, startX: 0, pointerId: null });
  const [cardOffset, setCardOffset] = useState(330);

  useEffect(() => {
    const update = () => {
      const el = stageRef.current;
      if (!el) return;
      const w = el.clientWidth;
      setCardOffset(Math.min(380, Math.max(260, w * 0.46)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const go = (dir) => {
    if (!dir) return;
    if (animTimeoutRef.current) window.clearTimeout(animTimeoutRef.current);

    // Bubble-like transition: push the current card slightly, switch content, then bring it back.
    setDragX(dir * 90);
    animTimeoutRef.current = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + dir + total) % total);
      setDragX(0);
    }, 170);
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragStateRef.current.dragging = true;
    dragStateRef.current.startX = e.clientX;
    dragStateRef.current.pointerId = e.pointerId;
    setDragX(0);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      // ignore
    }
  };

  const onPointerMove = (e) => {
    if (!dragStateRef.current.dragging) return;
    const dx = e.clientX - dragStateRef.current.startX;
    // Keep the drag limited so the card never flies away.
    setDragX(Math.max(-140, Math.min(140, dx)));
  };

  const finishDrag = (e) => {
    if (!dragStateRef.current.dragging) return;
    const dx = e.clientX - dragStateRef.current.startX;
    dragStateRef.current.dragging = false;
    dragStateRef.current.pointerId = null;
    const threshold = 70;
    if (dx > threshold) go(-1);
    else if (dx < -threshold) go(1);
    else setDragX(0);
  };

  return (
    <section id="championship-projects" className="py-28 px-6 md:px-12 relative border-t border-black/5 bg-zinc-50 overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <Reveal>
          <div className="mb-16 text-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full border border-[#ff1801]/30 bg-[#ff1801]/10 font-syncopate text-[9px] tracking-[0.35em] text-[#ff1801] uppercase">
              RACE RESULTS
            </span>
            <h2
              className="mt-6 text-3xl md:text-5xl font-syncopate font-black uppercase tracking-tighter text-zinc-900"
              style={{ fontFamily: 'Syncopate, sans-serif' }}
            >
              CHAMPIONSHIP <span className="text-[#ff1801]">PROJECTS</span>
            </h2>
            <div className="w-20 h-[2px] bg-[#ff1801] mx-auto mt-5" />
            <p className="text-zinc-500 text-sm font-light mt-6 max-w-2xl mx-auto">
              Projects engineered for peak performance and user experience.
            </p>
          </div>
        </Reveal>

        <div className="relative mx-auto h-[520px] w-full max-w-5xl">
          <button
            type="button"
            aria-label="Previous projects"
            onClick={() => go(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 border border-white/10 text-zinc-200 transition-all duration-300 hover:border-[#ff1801]/60"
          >
            <ChevronLeft className="w-5 h-5 text-[#ff1801]" />
          </button>

          <div
            ref={stageRef}
            className="relative h-[520px] w-full"
            style={{ perspective: 1200 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
          >
            {(() => {
              const front = projects[activeIndex];
              if (!front) return null;

              const prevIndex = (activeIndex - 1 + total) % total;
              const nextIndex = (activeIndex + 1) % total;
              const prev = projects[prevIndex];
              const next = projects[nextIndex];

              const renderCard = (project, pos) => {
                // pos: -1 (previous), 0 (active), 1 (next)
                if (!project) return null;

                const accentColor = accentToColor(project.accent);
                const absPos = Math.abs(pos);

                // Active card remains centered; side cards only move slightly
                // so they look like a 3D stack behind it (like a bubble swipe).
                const rotateY = pos === 0
                  ? Math.max(-16, Math.min(16, (-dragX / 140) * 16))
                  : pos * -10 + (-dragX / 140) * 2;

                const x = pos === 0
                  ? dragX
                  : pos * (cardOffset * 0.26) + dragX * 0.08 * pos;

                const y = absPos * 8;
                const scale = pos === 0 ? 1 : 0.90;
                const opacity = pos === 0 ? 1 : 0.45;
                const zIndex = pos === 0 ? 70 : 52 - absPos * 2;

                return (
                  <div
                    key={`${project.id}-${pos}`}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: 'min(560px, 92vw)',
                      zIndex,
                      opacity,
                      pointerEvents: pos === 0 ? 'auto' : 'none',
                      transform: `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) rotateY(${rotateY}deg) scale(${scale})`,
                      transition: dragStateRef.current.dragging
                        ? 'none'
                        : 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 450ms ease',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div
                      className="h-[470px] glass-panel-dark rounded-3xl overflow-hidden border border-white/10"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(20,20,20,0.7) 0%, rgba(8,8,8,0.85) 100%)',
                      }}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            `radial-gradient(700px 260px at 40% 20%, ${accentColor}22 0%, transparent 55%), ` +
                            'radial-gradient(600px 220px at 20% 80%, rgba(0,255,255,0.10) 0%, transparent 60%)',
                        }}
                      />

                      <div className="relative z-10 h-full p-7">
                        <div className="flex items-start justify-between gap-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 font-syncopate text-[11px] tracking-[0.25em] text-zinc-200 uppercase">
                            {project.category}
                          </span>
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 font-syncopate text-[11px] tracking-[0.25em] text-zinc-200 uppercase"
                            style={{ borderColor: `${accentColor}33` }}
                          >
                            {project.status}
                          </span>
                        </div>

                        <div className="mt-5">
                          <h3 className="font-syncopate text-3xl font-black text-white leading-tight">
                            {project.title}
                          </h3>
                          <p
                            className="mt-3 text-zinc-300 text-base leading-relaxed"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: '17px',
                            }}
                          >
                            {project.description}
                          </p>
                        </div>

                        <div className="mt-6">
                          <div className="font-syncopate text-sm tracking-[0.25em] text-[#ff1801] uppercase mb-3 font-semibold">
                            Technologies
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech) => (
                              <span
                                key={tech}
                                className="px-3 py-1.5 rounded-full text-[15px] bg-white/5 text-zinc-200 border border-white/10"
                                style={{ color: accentColor }}
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {renderCard(prev, -1)}
                  {renderCard(front, 0)}
                  {renderCard(next, 1)}
                </>
              );
            })()}
          </div>

          <button
            type="button"
            aria-label="Next projects"
            onClick={() => go(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-12 h-12 rounded-full bg-black/40 border border-white/10 text-zinc-200 transition-all duration-300 hover:border-[#ff1801]/60"
          >
            <ChevronRight className="w-5 h-5 text-[#ff1801]" />
          </button>
        </div>
      </div>
    </section>
  );
};

const ContactSectionF1 = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mailTo = () => {
    const to = 'viveksuvarna063@gmail.com';
    const subject = `Portfolio inquiry from ${formData.name || 'a visitor'}`;
    const body = [
      `Name: ${formData.name || '-'}`,
      `Email: ${formData.email || '-'}`,
      '',
      formData.message || '-',
    ].join('\n');
    const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    // Use mailto so we don't depend on external email providers.
    mailTo();
    window.setTimeout(() => setIsSubmitting(false), 800);
  };

  return (
    <section id="contact" className="py-28 px-6 md:px-12 relative border-t border-white/10 bg-zinc-900 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(45deg, rgba(0,0,0,0.15) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.15) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.15) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.15) 75%)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px',
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <Reveal>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 mb-14">
            <div className="text-center md:text-left flex-1">
              <span className="inline-flex items-center px-4 py-2 rounded-full border border-[#ff1801]/30 bg-[#ff1801]/10 font-syncopate font-semibold text-[15px] tracking-[0.35em] text-[#ff1801] uppercase">
                FINISH LINE
              </span>
              <h2 className="mt-6 text-3xl md:text-5xl font-syncopate font-black uppercase tracking-tighter text-zinc-100" style={{ fontFamily: 'Syncopate, sans-serif' }}>
                START YOUR <span className="text-[#ff1801]">ENGINES</span>
              </h2>
              <p className="text-zinc-300 text-sm font-light mt-6 max-w-2xl text-[18px]">
                Ready to accelerate your project? Send a message and I&apos;ll get back to you.
              </p>
            </div>

            <div className="flex-shrink-0">
              <div className="glass-panel-dark rounded-3xl px-6 py-5 border border-white/10">
                <div className="font-syncopate text-4xl font-black text-white leading-none">
                  24H
                </div>
                <div className="font-syncopate text-xs tracking-[0.25em] text-zinc-400 uppercase mt-2">
                  Response time
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <Reveal>
              <div className="glass-panel-dark rounded-3xl p-7 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#ff1801]/15 border border-[#ff1801]/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#ff1801]" />
                  </div>
                  <div>
                    <div className="font-syncopate text-xs tracking-[0.25em] text-zinc-400 uppercase">Email</div>
                    <div className="mt-1 font-syncopate text-zinc-200 text-[13px]">viveksuvarna063@gmail.com</div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="glass-panel-dark rounded-3xl p-7 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#00ffff]/10 border border-[#00ffff]/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#00ffff]" />
                  </div>
                  <div>
                    <div className="font-syncopate text-xs tracking-[0.25em] text-zinc-400 uppercase">Phone</div>
                    <div className="mt-1 font-syncopate text-zinc-200 text-[13px]">+91 7756029366</div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="glass-panel-dark rounded-3xl p-7 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-zinc-200" />
                  </div>
                  <div>
                    <div className="font-syncopate text-xs tracking-[0.25em] text-zinc-400 uppercase">Location</div>
                    <div className="mt-1 font-syncopate text-zinc-200 text-[13px]">Mumbai, India</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-2">
            <Reveal>
              <div className="glass-panel-dark rounded-3xl p-8 md:p-10 border border-white/10">
                <h3 className="font-syncopate text-2xl font-black text-[#ff1801] uppercase tracking-[0.1em]">
                  LET&apos;S COLLABORATE
                </h3>

                <form onSubmit={onSubmit} className="mt-8 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-syncopate text-xs tracking-[0.25em] text-zinc-400 uppercase mb-2">
                        Name
                      </label>
                      <input
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ff1801]/60 transition-colors"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-syncopate text-xs tracking-[0.25em] text-zinc-400 uppercase mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ff1801]/60 transition-colors"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-syncopate text-xs tracking-[0.25em] text-zinc-400 uppercase mb-2">
                      Project details
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                      className="w-full min-h-[150px] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#ff1801]/60 transition-colors resize-none"
                      placeholder="Tell me about your project requirements, timeline, and goals..."
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
                    <div className="text-zinc-400 text-sm">
                      You&apos;ll open your email app to send the message.
                    </div>
                    <Magnetic strength={45}>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="relative group w-full md:w-auto px-10 py-4 rounded-full bg-white text-black font-syncopate font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 rounded-full bg-[#ff1801] blur-[18px] opacity-0 group-hover:opacity-20 transition-all duration-500" />
                        <div className="relative flex items-center gap-3 justify-center">
                          {isSubmitting ? 'LAUNCHING...' : 'SEND MESSAGE'}
                          <Send className="text-black group-hover:text-black w-5 h-5" />
                        </div>
                      </button>
                    </Magnetic>
                  </div>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  const [introPhase, setIntroPhase] = useState('lights'); // lights | video | done

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-900 selection:bg-[#ff1801] selection:text-white font-sans relative tech-grid">
      <style>{styles}</style>
      <CustomCursor />
      <div className="noise-overlay" />
      <ChatWidget />

      {introPhase === 'lights' && <CinematicLightsOut onComplete={() => setIntroPhase('video')} />}
      {introPhase === 'video' && <IntroVideoOverlay src={introVideoSrc} onComplete={() => setIntroPhase('done')} />}

      <div className={`site-reveal ${introPhase === 'done' ? 'visible' : ''}`}>
        <nav className="fixed w-full z-40 top-0 py-6 px-8 flex justify-between items-center glass-panel border-b border-black/5">
          <Magnetic strength={20} className="interactive">
            <a href="#" className="font-syncopate text-xl md:text-2xl font-black tracking-[0.2em] cursor-pointer">
              GRID<span className="text-[#ff1801]">.</span>START
            </a>
          </Magnetic>
          
          <div className="hidden md:flex space-x-12 font-syncopate text-xs tracking-[0.3em] font-bold items-center">
            {[
              { label: 'Telemetry', href: '#telemetry' },
              { label: 'Aero', href: '#aerodynamics' },
              { label: '3D CAD', href: '#cad-vault' },
            ].map((item) => (
              <Magnetic key={item.label} strength={40} className="interactive">
                <a href={item.href} className="hover:text-[#ff1801] transition-colors relative group">
                  {item.label}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-[#ff1801] transition-all duration-300 group-hover:w-full"></span>
                </a>
              </Magnetic>
            ))}
          </div>
        </nav>

        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
          <div className="bg-grid"></div>
          <div className="absolute top-1/4 right-10 text-outline text-[20vw] font-syncopate font-black select-none pointer-events-none opacity-50 z-0 leading-none">
            07
          </div>
          
          <div className="relative z-10 container mx-auto px-6 flex flex-col justify-center items-start">
            <Reveal>
              <div className="flex items-center gap-4 mb-8">
                <Crosshair className="text-[#ff1801] animate-[spin_10s_linear_infinite]" size={24} />
                <span className="font-syncopate text-xs tracking-[0.4em] font-bold">SCUDERIA APEX // CAR #07</span>
              </div>
            </Reveal>
            
            <Reveal delay={100}>
              <h1 className="font-syncopate text-6xl md:text-[8rem] font-black leading-[0.85] tracking-tighter mb-6 relative">
                <span className="block hover:text-[#ff1801] transition-colors duration-500 interactive text-[83px]">VIVEK</span>
                <span className="block ml-0 md:ml-32 text-[83px]">SUVARNA</span>
              </h1>
            </Reveal>
            
            <Reveal delay={200} className="md:ml-32 max-w-xl">
              <p className="text-xl md:text-2xl font-medium text-zinc-600 mb-12 border-l-2 border-[#ff1801] pl-6 text-[43px]">
                SOFTWARE DEVELOPER.<br></br> Accelerating through code at breakneck speeds.
              </p>
              
              <Magnetic strength={50} className="interactive">
                <a
                  href={resumePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group inline-block"
                >
                  <div className="absolute inset-0 bg-[#ff1801] blur-[20px] opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                  <div className="relative border border-black hover:border-[#ff1801] bg-white rounded-full px-10 py-6 font-syncopate font-bold text-sm tracking-[0.2em] flex items-center gap-4 transition-all duration-300 text-[8x]">
                    INITIALIZE CV 
                    <ArrowUpRight className="group-hover:rotate-45 group-hover:text-[#ff1801] transition-transform duration-300" size={20} />
                  </div>
                </a>
              </Magnetic>
            </Reveal>
          </div>
          
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50">
            <span className="font-syncopate text-[10px] tracking-[0.3em]">SCROLL</span>
            <div className="w-[1px] h-16 bg-black relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-[#ff1801] animate-[translateY_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </section>

        <div className="py-4 border-y border-black/5 bg-zinc-100 overflow-hidden relative z-20">
          <div className="flex whitespace-nowrap opacity-70" style={{ animation: 'marquee 30s linear infinite' }}>
            {[...Array(10)].map((_, i) => (
              <span key={i} className="mx-8 font-syncopate text-sm font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-8" style={{ fontFamily: 'Syncopate, sans-serif' }}>
                APEX PRECISION <span className="w-1 h-1 rounded-full bg-[#ff1801] inline-block"></span> POLE POSITION <span className="w-1 h-1 rounded-full bg-[#ff1801] inline-block"></span>
              </span>
            ))}
          </div>
        </div>

        <section id="driver-profile" className="py-28 px-6 md:px-12 relative border-t border-black/5 bg-zinc-50 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <div className="mb-14 text-center">
                <span className="inline-flex items-center px-4 py-2 rounded-full border border-[#ff1801]/30 bg-[#ff1801]/10 font-syncopate text-[9px] tracking-[0.35em] text-[#ff1801] uppercase">
                  Driver Profile
                </span>
                <h2 className="mt-6 text-3xl md:text-5xl font-syncopate font-black uppercase tracking-tighter text-zinc-900" style={{ fontFamily: 'Syncopate, sans-serif' }}>
                  ABOUT THE <span className="text-[#ff1801]">PILOT</span>
                </h2>
                <div className="w-20 h-[2px] bg-[#ff1801] mx-auto mt-5"></div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="rounded-[2rem] overflow-hidden bg-[#090909] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-5 p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-white/10">
                    <div className="relative w-full max-w-[420px] mx-auto aspect-[4/5] rounded-3xl overflow-hidden border border-[#ff1801]/30 bg-gradient-to-b from-[#2c0503] via-[#160505] to-[#0b0b0b]">
                      <img
                        src={aboutPilotImage}
                        alt="Vivek driver profile"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                      <div className="absolute top-4 right-4 rounded-2xl px-4 py-3 bg-[#111827]/70 border border-white/10 text-center">
                        <div className="font-syncopate text-[8px] tracking-widest text-zinc-400">WINS</div>
                        <div className="font-syncopate text-2xl font-black text-[#ff1801] leading-none mt-1">15</div>
                      </div>
                      <div className="absolute bottom-4 left-4 rounded-2xl px-4 py-3 bg-[#0f172a]/70 border border-white/10 text-center">
                        <div className="font-syncopate text-lg font-black text-[#00ffff] leading-none">300+</div>
                        <div className="font-syncopate text-[8px] tracking-widest text-zinc-400 mt-1">KM/H</div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 p-6 md:p-10">
                    <h3 className="font-syncopate text-2xl md:text-3xl text-[#ff1801] font-black uppercase">PRECISION ENGINEERING</h3>
                    <p className="mt-5 text-zinc-300 leading-relaxed max-w-2xl text-[16px]">
                      I&apos;m a passionate software developer with expertise in creating innovative applications and AI-powered solutions. With a strong foundation in multiple programming languages and a keen interest in emerging technologies, I strive to build impactful digital experiences.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 flex items-center justify-center gap-3">
                        <Crosshair className="w-4 h-4 text-[#ff1801]" />
                        <span className="font-syncopate text-sm tracking-[0.2em] text-white uppercase">Frontend</span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 flex items-center justify-center gap-3">
                        <Cpu className="w-4 h-4 text-[#00ffff]" />
                        <span className="font-syncopate text-sm tracking-[0.2em] text-white uppercase">Backend</span>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="font-syncopate text-xs tracking-[0.25em] text-[#ff1801] uppercase mb-4">Racing Technologies</div>
                      <div className="flex flex-wrap gap-2">
                        {['Java', 'Kotlin', 'Dart', 'Python', 'AI/ML', 'Web Development', 'JavaScript', 'Firebase', 'Flutter', 'Mobile Development'].map((tech) => (
                          <span key={tech} className="px-3 py-1.5 rounded-full text-[15px] bg-white/5 text-zinc-200 border border-white/10">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <blockquote className="mt-8 border-l-2 border-[#ff1801] pl-4 text-zinc-400 italic">
                      "Success in racing and coding comes from the same principle: never stop improving, and always push the limits."
                    </blockquote>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="cad-vault" className="py-32 relative border-t border-black/5 bg-gradient-to-b from-zinc-50 to-zinc-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <Reveal>
              <div className="flex flex-col mb-16 text-center items-center">
                <h2 className="text-3xl md:text-5xl font-syncopate font-black uppercase tracking-tighter flex items-center gap-6 justify-center" style={{ fontFamily: 'Syncopate, sans-serif' }}>
                  <span className="w-12 h-[2px] bg-[#ff1801] hidden md:block"></span>
                  LABORATORY <span className="text-zinc-400">CAD.</span>
                  <span className="w-12 h-[2px] bg-[#ff1801] hidden md:block"></span>
                </h2>
                <p className="text-zinc-500 text-sm font-light mt-6 max-w-md">
                  Fully interactive procedural WebGL steering wheel. Live telemetry dashboard with real-time RPM, gear, ERS and lap delta — move your cursor left or right to steer.
                </p>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative w-full h-[600px] glass-panel rounded-3xl overflow-visible cursor-move group">
                {/* Clipped UI/background layer (keeps rounded corners clean) */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden bg-white text-zinc-900">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff1801] rounded-full blur-[150px] opacity-[0.08]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ffff] rounded-full blur-[150px] opacity-[0.06]"></div>
                    <div className="absolute inset-0 bg-grid opacity-60"></div>
                  </div>

                  <div className="relative z-20 h-full w-full flex flex-col">
                    <div className="p-6 flex items-start justify-between gap-6">
                      <div className="font-syncopate text-[9px] tracking-[0.4em] text-zinc-500 bg-white/80 px-4 py-2 rounded-full border border-black/5">
                        MOVE MOUSE HORIZONTALLY TO STEER
                      </div>
                      <div className="hidden md:flex flex-col gap-2 items-end pointer-events-none">
                        <div className="flex items-center gap-2 bg-black/5 border border-black/10 rounded-full px-3 py-1.5">
                          <Cpu className="text-[#00ffff] w-3 h-3" />
                          <span className="font-syncopate text-[8px] tracking-widest text-zinc-500">PU MAP : MODE 4</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/5 border border-black/10 rounded-full px-3 py-1.5">
                          <Wind className="text-zinc-700 w-3 h-3" />
                          <span className="font-syncopate text-[8px] tracking-widest text-zinc-500">DRS : ARMED</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/5 border border-black/10 rounded-full px-3 py-1.5">
                          <Zap className="text-yellow-400 w-3 h-3" />
                          <span className="font-syncopate text-[8px] tracking-widest text-zinc-500">MGU-K : RECOVERY HIGH</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative flex-1 min-h-0" />

                    <div className="p-6 pt-4 flex flex-col items-center gap-4">
                      <Magnetic strength={40}>
                        <button className="relative group" type="button">
                          <div className="absolute inset-0 bg-[#ff1801] blur-[30px] opacity-10 group-hover:opacity-30 transition-all duration-500"></div>
                          <div className="relative glass-panel rounded-full px-8 md:px-12 py-5 font-syncopate font-bold text-xs md:text-sm tracking-[0.3em] uppercase flex items-center gap-4 transition-all duration-500 hover:scale-[1.02]">
                            INITIALIZE DRS <ArrowUpRight className="group-hover:rotate-45 transition-transform duration-300 text-[#ff1801] w-5 h-5" />
                          </div>
                        </button>
                      </Magnetic>

                      <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4 font-syncopate text-[9px] tracking-[0.4em] text-zinc-400">
                        <div className="flex gap-8">
                          <a href="linkedin.com/in/viveksuvarna" className="hover:text-zinc-900 transition-colors">LINKEDIN</a>
                          <a href="#" className="hover:text-zinc-900 transition-colors">TWITTER</a>
                          <a href="#" className="hover:text-zinc-900 transition-colors">YOUTUBE</a>
                        </div>
                        <div>SCUDERIA &copy; 2026</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unclipped 3D layer (can overflow without being cut) */}
                <div className="absolute inset-0 z-10 overflow-visible pointer-events-none">
                  <SteeringWheel3D />
                </div>
                <div className="absolute bottom-6 right-6 z-30 flex gap-2 items-center pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-[#ff1801] animate-pulse"></div>
                  <span className="font-syncopate text-[8px] tracking-widest text-zinc-400">WEBGL RENDER ENGINE</span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <ChampionshipProjects />

        <section id="telemetry" className="py-32 px-6 md:px-12 relative overflow-hidden border-t border-black/5 bg-zinc-50">
          <div className="max-w-7xl mx-auto">
            <Reveal>
              <h2 className="text-4xl md:text-6xl font-syncopate font-black uppercase tracking-tighter mb-20 flex flex-col" style={{ fontFamily: 'Syncopate, sans-serif' }}>
                <span className="text-zinc-300">LIVE TELEMETRY</span>
                <span>DATA HUD.</span>
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              <Reveal className="lg:col-span-7" delay={200}>
                <div className="glass-panel h-[500px] rounded-3xl p-8 relative flex items-center justify-center overflow-hidden group">
                  <div className="absolute top-6 left-6 flex items-center gap-3"><Activity className="text-[#ff1801] w-5 h-5" /><span className="font-syncopate text-[10px] tracking-[0.3em] text-zinc-500" style={{ fontFamily: 'Syncopate, sans-serif' }}>CORE SENSORS</span></div>
                  <div className="relative w-80 h-80 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full animate-spin-slow opacity-20" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="#000" strokeWidth="0.5" strokeDasharray="4 4" /></svg>
                    <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] animate-spin-reverse opacity-80" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="#ff1801" strokeWidth="1" strokeDasharray="60 40" strokeLinecap="round" /></svg>
                    <div className="absolute w-16 h-16 bg-[#ff1801]/20 rounded-full animate-pulse-ring"></div>
                    <div className="absolute w-4 h-4 bg-[#ff1801] rounded-full" style={{ boxShadow: '0 0 20px rgba(255,24,1,0.6)' }}></div>
                    <div className="absolute top-1/4 left-0 -translate-x-1/2 font-syncopate text-xs text-right" style={{ fontFamily: 'Syncopate, sans-serif' }}><div className="text-zinc-500 mb-1">BRAKE BIAS</div><div className="text-zinc-900 font-bold">54.2%</div></div>
                    <div className="absolute bottom-1/4 right-0 translate-x-1/2 font-syncopate text-xs text-left" style={{ fontFamily: 'Syncopate, sans-serif' }}><div className="text-zinc-500 mb-1">ERS DEPLOY</div><div className="text-[#ff1801] font-bold">ACTIVE</div></div>
                  </div>
                </div>
              </Reveal>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <Reveal delay={300} className="flex-1">
                  <div className="h-full glass-panel rounded-3xl p-8 flex flex-col justify-between group hover:border-[#ff1801]/40 transition-colors">
                    <div className="flex justify-between items-start"><span className="font-syncopate text-[10px] tracking-[0.3em] text-zinc-500" style={{ fontFamily: 'Syncopate, sans-serif' }}>PEAK VELOCITY</span><Zap className="text-zinc-400 group-hover:text-[#ff1801] transition-colors w-5 h-5" /></div>
                    <div className="mt-8"><div className="text-6xl md:text-7xl font-syncopate font-black tracking-tighter text-zinc-900" style={{ fontFamily: 'Syncopate, sans-serif' }}>342 <span className="text-xl text-[#ff1801] align-top">KM/H</span></div><div className="w-full h-1 bg-black/5 mt-6 rounded-full overflow-hidden"><div className="h-full bg-[#ff1801] w-[85%] rounded-full"></div></div></div>
                  </div>
                </Reveal>
                <Reveal delay={400} className="flex-1">
                  <div className="h-full bg-white border border-black/5 rounded-3xl p-8 flex flex-col justify-between group shadow-sm">
                    <div className="flex justify-between items-start"><span className="font-syncopate text-[10px] tracking-[0.3em] text-zinc-500" style={{ fontFamily: 'Syncopate, sans-serif' }}>LATERAL G-FORCE</span><Crosshair className="text-zinc-400 w-5 h-5" /></div>
                    <div className="text-6xl md:text-7xl font-syncopate font-black tracking-tighter mt-8 text-zinc-900" style={{ fontFamily: 'Syncopate, sans-serif' }}>5.8 <span className="text-xl text-zinc-400">G</span></div>
                  </div>
                </Reveal>
              </div>
            </div>
            <Reveal delay={200}><LiveCircuit /></Reveal>
          </div>
        </section>

        <section id="aerodynamics" className="py-32 relative border-t border-black/5 bg-zinc-100 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <Reveal>
              <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                <h2 className="text-3xl md:text-5xl font-syncopate font-black uppercase tracking-tighter flex items-center gap-6" style={{ fontFamily: 'Syncopate, sans-serif' }}>
                  <span className="w-12 h-[2px] bg-[#ff1801] inline-block"></span>
                  AERO<span className="text-zinc-400">DYNAMICS.</span>
                </h2>
                <p className="text-zinc-500 text-sm font-light max-w-xs mt-6 md:mt-0">
                  Interactive fluid simulation. Move your cursor over the tunnel to deflect aerodynamic airflow.
                </p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="relative group p-2 glass-panel rounded-[2rem]">
                <div className="absolute top-8 left-8 z-10 flex items-center gap-2"><Wind className="text-[#ff1801] w-4 h-4" /><span className="font-syncopate text-[10px] tracking-widest text-zinc-900 font-bold" style={{ fontFamily: 'Syncopate, sans-serif' }}>WIND TUNNEL SIMULATION ACTIVE</span></div>
                <WindTunnel />
              </div>
            </Reveal>
          </div>
        </section>

        <ContactSectionF1 />

        <footer className="py-40 flex flex-col items-center justify-center relative overflow-hidden bg-zinc-100 border-t border-black/5">
          <div className="absolute inset-0 opacity-30"></div>
          <Reveal>
            <Magnetic strength={50}>
              <button
  className="relative group interactive"
  type="button"
  onClick={() => window.open("https://github.com/Viveks063", "_blank")}
>
                <div className="absolute inset-0 bg-[#ff1801] blur-[30px] opacity-10 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="relative glass-panel border border-black/10 hover:border-[#ff1801] rounded-full px-12 py-8 font-syncopate font-bold text-sm md:text-xl tracking-[0.3em] uppercase flex items-center gap-6 transition-all duration-500 hover:scale-105" style={{ fontFamily: 'Syncopate, sans-serif' }}>
                  INITIALIZE GITHUB <ArrowUpRight className="group-hover:rotate-45 transition-transform duration-300 text-[#ff1801] w-6 h-6" />
                </div>
              </button>
            </Magnetic>
          </Reveal>
          <Reveal delay={200} className="mt-32 w-full max-w-7xl px-12 flex flex-col md:flex-row justify-between items-center gap-8 font-syncopate text-[13px] tracking-[0.4em] text-zinc-500 relative z-10" style={{ fontFamily: 'Syncopate, sans-serif' }}>
          <div className="flex gap-12">
    <a
      href="https://linkedin.com/in/viveksuvarna"
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-zinc-900 transition-colors"
    >
      LINKEDIN
    </a>

    
  </div>
            <div className="flex items-center gap-2">&copy; {new Date().getFullYear()} Vivek Suvarna</div>
          </Reveal>
        </footer>
      </div>
    </div>
  );
}

