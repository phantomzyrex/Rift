import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChamberLevel, Position, PushBlock, Switch, ResonanceShard } from '../types/game';

interface RiftCanvasProps {
  level: ChamberLevel;
  pristinePos: Position;
  decayedPos: Position;
  blocks: PushBlock[];
  switches: Switch[];
  shards: ResonanceShard[];
  crumblingBroken: { world: 'pristine' | 'decayed'; x: number; y: number }[];
  destabilization: number; // 0 to 100
  isSolved: boolean;
  seamOffset: number; // 20 to 80 (default 50)
  onSeamChange?: (offset: number) => void;
  onCellClick?: (world: 'pristine' | 'decayed', x: number, y: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'ash' | 'crystal' | 'seam_spark';
}

export const RiftCanvas: React.FC<RiftCanvasProps> = ({
  level,
  pristinePos,
  decayedPos,
  blocks,
  switches,
  shards,
  crumblingBroken,
  destabilization,
  isSolved,
  seamOffset,
  onSeamChange,
  onCellClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Smooth interpolation coordinates
  const interpPristineRef = useRef<{ x: number; y: number }>({ x: pristinePos.x, y: pristinePos.y });
  const interpDecayedRef = useRef<{ x: number; y: number }>({ x: decayedPos.x, y: decayedPos.y });
  const interpBlocksRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Particles system
  const particlesRef = useRef<Particle[]>([]);

  // Dragging seam state
  const isDraggingSeamRef = useRef<boolean>(false);
  const [isHoveringSeam, setIsHoveringSeam] = useState<boolean>(false);

  // Time tracking for animations
  const animTimeRef = useRef<number>(0);

  // Handle Seam Dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seamPx = (canvas.width * seamOffset) / 100;

    // Check if clicked near seam (within 24px)
    if (Math.abs(x - seamPx) < 24) {
      isDraggingSeamRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seamPx = (canvas.width * seamOffset) / 100;

    setIsHoveringSeam(Math.abs(x - seamPx) < 24);

    if (isDraggingSeamRef.current && onSeamChange) {
      const percentage = Math.max(25, Math.min(75, (x / canvas.width) * 100));
      onSeamChange(percentage);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingSeamRef.current) {
      isDraggingSeamRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Main Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      animTimeRef.current += 0.02;
      const t = animTimeRef.current;

      const width = canvas.width;
      const height = canvas.height;
      const seamX = (width * seamOffset) / 100;

      // 1. Smoothly interpolate positions towards target grid positions
      const lerpSpeed = 0.22;
      interpPristineRef.current.x += (pristinePos.x - interpPristineRef.current.x) * lerpSpeed;
      interpPristineRef.current.y += (pristinePos.y - interpPristineRef.current.y) * lerpSpeed;

      interpDecayedRef.current.x += (decayedPos.x - interpDecayedRef.current.x) * lerpSpeed;
      interpDecayedRef.current.y += (decayedPos.y - interpDecayedRef.current.y) * lerpSpeed;

      blocks.forEach(b => {
        const cur = interpBlocksRef.current.get(b.id) || { x: b.x, y: b.y };
        cur.x += (b.x - cur.x) * lerpSpeed;
        cur.y += (b.y - cur.y) * lerpSpeed;
        interpBlocksRef.current.set(b.id, cur);
      });

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Glitch screen shake if destabilization is high
      let glitchShakeX = 0;
      let glitchShakeY = 0;
      if (destabilization > 40) {
        const intensity = ((destabilization - 40) / 60) * 4;
        if (Math.random() < 0.3) {
          glitchShakeX = (Math.random() - 0.5) * intensity;
          glitchShakeY = (Math.random() - 0.5) * intensity;
        }
      }

      ctx.save();
      ctx.translate(glitchShakeX, glitchShakeY);

      // ==========================================
      // SECTION 1: PRISTINE WORLD (LEFT)
      // ==========================================
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, seamX, height);
      ctx.clip();

      // Background: Deep obsidian with soft crystalline gradient
      const pGrad = ctx.createLinearGradient(0, 0, seamX, height);
      pGrad.addColorStop(0, '#090e17');
      pGrad.addColorStop(1, '#051329');
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, 0, seamX, height);

      // Render Pristine Grid Tiles
      drawWorld(ctx, 'pristine', level.pristine, 0, 0, width, height, t);
      ctx.restore();

      // ==========================================
      // SECTION 2: DECAYED WORLD (RIGHT)
      // ==========================================
      ctx.save();
      ctx.beginPath();
      ctx.rect(seamX, 0, width - seamX, height);
      ctx.clip();

      // Background: Burnt iron and dark soot
      const dGrad = ctx.createLinearGradient(seamX, 0, width, height);
      dGrad.addColorStop(0, '#1c130d');
      dGrad.addColorStop(1, '#0c0704');
      ctx.fillStyle = dGrad;
      ctx.fillRect(seamX, 0, width - seamX, height);

      // Render Decayed Grid Tiles
      drawWorld(ctx, 'decayed', level.decayed, 0, 0, width, height, t);
      ctx.restore();

      // ==========================================
      // SECTION 3: PARTICLES & ATMOSPHERE
      // ==========================================
      updateAndDrawParticles(ctx, width, height, seamX, t);

      // ==========================================
      // SECTION 4: THE CENTRAL RIFT SEAM
      // ==========================================
      drawRiftSeam(ctx, seamX, height, t, destabilization, isSolved);

      // ==========================================
      // SECTION 5: CHROMATIC ABERRATION GLITCH OVERLAY
      // ==========================================
      if (destabilization > 60 && Math.random() < 0.25) {
        drawGlitchScanlines(ctx, width, height, destabilization);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    level,
    pristinePos,
    decayedPos,
    blocks,
    switches,
    shards,
    crumblingBroken,
    destabilization,
    isSolved,
    seamOffset
  ]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Particle System Update
  const updateAndDrawParticles = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    seamX: number,
    t: number
  ) => {
    const particles = particlesRef.current;

    // Spawn crystalline dust in Pristine
    if (particles.length < 90 && Math.random() < 0.35) {
      particles.push({
        x: Math.random() * (seamX - 20),
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        life: 0,
        maxLife: 120 + Math.random() * 100,
        size: 1 + Math.random() * 1.5,
        type: 'crystal'
      });
    }

    // Spawn floating embers & ash in Decayed
    if (particles.length < 90 && Math.random() < 0.5) {
      particles.push({
        x: seamX + 20 + Math.random() * (width - seamX - 40),
        y: height - Math.random() * 40,
        vx: (Math.random() - 0.6) * 0.7,
        vy: -Math.random() * 0.9 - 0.4,
        life: 0,
        maxLife: 100 + Math.random() * 80,
        size: 1.5 + Math.random() * 2.5,
        type: 'ash'
      });
    }

    // Spawn seam electrical sparks
    if (particles.length < 90 && Math.random() < 0.4) {
      particles.push({
        x: seamX + (Math.random() - 0.5) * 8,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.0,
        life: 0,
        maxLife: 25 + Math.random() * 20,
        size: 1.5 + Math.random() * 2,
        type: 'seam_spark'
      });
    }

    // Draw and update
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;

      const progress = p.life / p.maxLife;
      const alpha = Math.sin(progress * Math.PI);

      if (p.type === 'crystal') {
        ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ash') {
        ctx.fillStyle = `rgba(245, 158, 11, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'seam_spark') {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p.life >= p.maxLife || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        particles.splice(i, 1);
      }
    }
  };

  // Draw Specific World (Pristine or Decayed)
  const drawWorld = (
    ctx: CanvasRenderingContext2D,
    world: 'pristine' | 'decayed',
    map: ChamberLevel['pristine'],
    offsetX: number,
    offsetY: number,
    totalWidth: number,
    totalHeight: number,
    t: number
  ) => {
    const isPristine = world === 'pristine';

    // Calculate grid cell size and centering
    const gridCols = map.width;
    const gridRows = map.height;
    const padding = 32;

    const availableW = totalWidth;
    const availableH = totalHeight;

    const cellSize = Math.min(
      (availableW - padding * 2) / gridCols,
      (availableH - padding * 2) / gridRows,
      72
    );

    const startX = (availableW - gridCols * cellSize) / 2;
    const startY = (availableH - gridRows * cellSize) / 2;

    // Draw Floor & Tiles
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const px = startX + x * cellSize;
        const py = startY + y * cellSize;
        const tile = map.tiles[y][x];

        // Check if crumbling tile was broken
        const isBroken = crumblingBroken.some(b => b.world === world && b.x === x && b.y === y);

        if (isBroken || tile === 'chasm') {
          // Void / Abyss
          drawChasmTile(ctx, px, py, cellSize, isPristine, t);
        } else if (tile === 'wall') {
          drawWallTile(ctx, px, py, cellSize, isPristine, t);
        } else if (tile === 'light_bridge') {
          // Check if bridge is active specifically or generally
          const specificActive = switches.find(s =>
            s.active && s.targetCoords && s.targetCoords.some(c => c.world === world && c.x === x && c.y === y)
          );
          const genericActive = switches.find(s =>
            s.active && (!s.targetCoords || s.targetCoords.length === 0) && (s.targetId.includes('bridge') || !s.targetId.includes('barrier'))
          );
          const isBridgeActive = !!(specificActive || genericActive);
          drawLightBridgeTile(ctx, px, py, cellSize, isPristine, isBridgeActive, t);
        } else if (tile === 'phase_barrier') {
          // Check if barrier is lowered specifically or generally
          const specificActive = switches.find(s =>
            s.active && s.targetCoords && s.targetCoords.some(c => c.world === world && c.x === x && c.y === y)
          );
          const genericActive = switches.find(s =>
            s.active && (!s.targetCoords || s.targetCoords.length === 0) && (s.targetId.includes('barrier') || s.targetId.includes('phase') || s.targetId.includes('gate') || !s.targetId.includes('bridge'))
          );
          const isBarrierOpen = !!(specificActive || genericActive);
          drawPhaseBarrierTile(ctx, px, py, cellSize, isPristine, isBarrierOpen, t);
        } else if (tile === 'crumbling') {
          drawCrumblingTile(ctx, px, py, cellSize, isPristine, t);
        } else {
          // Standard Floor
          drawFloorTile(ctx, px, py, cellSize, isPristine, t);
        }
      }
    }

    // Draw Switches
    switches
      .filter(s => s.world === world)
      .forEach(sw => {
        const px = startX + sw.x * cellSize;
        const py = startY + sw.y * cellSize;
        drawSwitch(ctx, px, py, cellSize, sw, isPristine, t);
      });

    // Draw Resonance Shards
    shards
      .filter(s => s.world === world && !s.collected)
      .forEach(shard => {
        const px = startX + shard.x * cellSize;
        const py = startY + shard.y * cellSize;
        drawShard(ctx, px, py, cellSize, isPristine, t);
      });

    // Draw Synchronization Anchor (Epicenter)
    const anchor = map.anchor;
    const anchorPx = startX + anchor.x * cellSize;
    const anchorPy = startY + anchor.y * cellSize;
    drawAnchor(ctx, anchorPx, anchorPy, cellSize, isPristine, isSolved, t);

    // Draw Push Blocks
    blocks
      .filter(b => b.world === world)
      .forEach(b => {
        const interp = interpBlocksRef.current.get(b.id) || { x: b.x, y: b.y };
        const bpx = startX + interp.x * cellSize;
        const bpy = startY + interp.y * cellSize;
        drawPushBlock(ctx, bpx, bpy, cellSize, isPristine, t);
      });

    // Draw Lasers & Receivers
    if (map.lasers) {
      map.lasers.forEach(l => {
        const lpx = startX + l.x * cellSize;
        const lpy = startY + l.y * cellSize;
        drawLaserEmitter(ctx, lpx, lpy, cellSize, l, isPristine, t);
      });
    }
    if (map.receivers) {
      map.receivers.forEach(r => {
        const rpx = startX + r.x * cellSize;
        const rpy = startY + r.y * cellSize;
        drawLaserReceiver(ctx, rpx, rpy, cellSize, r, isPristine, t);
      });
    }

    // Draw Avatar (Character)
    const avatarInterp = isPristine ? interpPristineRef.current : interpDecayedRef.current;
    const apx = startX + avatarInterp.x * cellSize;
    const apy = startY + avatarInterp.y * cellSize;
    drawAvatar(ctx, apx, apy, cellSize, isPristine, isSolved, t);

    // Draw Ghost Silhouette of the other avatar when destabilized
    if (destabilization > 45) {
      const otherAvatar = isPristine ? interpDecayedRef.current : interpPristineRef.current;
      const opx = startX + otherAvatar.x * cellSize;
      const opy = startY + otherAvatar.y * cellSize;
      drawGhostAvatar(ctx, opx, opy, cellSize, !isPristine, destabilization, t);
    }
  };

  // --- Tile Renderers ---

  const drawFloorTile = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    if (isPristine) {
      // Marble floor with soft cyan hairline borders
      ctx.fillStyle = '#0c1524';
      ctx.fillRect(px, py, size, size);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

      // Subtle marble veining sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + size, py + size);
      ctx.stroke();
    } else {
      // Rusted iron floor grating with oxidized copper & moss tints
      ctx.fillStyle = '#16100c';
      ctx.fillRect(px, py, size, size);

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.14)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

      // Grating mesh pattern
      ctx.fillStyle = 'rgba(234, 88, 12, 0.03)';
      ctx.fillRect(px + 4, py + 4, size - 8, size - 8);
    }
    ctx.restore();
  };

  const drawWallTile = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    if (isPristine) {
      // Pristine crystalline marble monolith
      const grad = ctx.createLinearGradient(px, py, px, py + size);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

      // Inner diamond glyph
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.moveTo(px + size / 2, py + 8);
      ctx.lineTo(px + size - 8, py + size / 2);
      ctx.lineTo(px + size / 2, py + size - 8);
      ctx.lineTo(px + 8, py + size / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Rusted jagged twisted iron block
      ctx.fillStyle = '#29170e';
      ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

      // Industrial hazard cross
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 8);
      ctx.lineTo(px + size - 8, py + size - 8);
      ctx.moveTo(px + size - 8, py + 8);
      ctx.lineTo(px + 8, py + size - 8);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawChasmTile = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    // Deep infinite black void
    ctx.fillStyle = '#020617';
    ctx.fillRect(px, py, size, size);

    if (isPristine) {
      // Soft crystalline stasis mist in the abyss
      const pulse = Math.sin(t * 1.5) * 0.15 + 0.15;
      ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
      ctx.beginPath();
      ctx.arc(px + size / 2, py + size / 2, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Faint glowing ember magma fissure below
      const pulse = Math.sin(t * 2) * 0.2 + 0.2;
      ctx.fillStyle = `rgba(220, 38, 38, ${pulse})`;
      ctx.beginPath();
      ctx.arc(px + size / 2, py + size / 2, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawCrumblingTile = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    ctx.fillStyle = '#201610';
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

    // Visible fissures / cracks
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px + 6, py + 8);
    ctx.lineTo(px + size * 0.45, py + size * 0.5);
    ctx.lineTo(px + size - 10, py + size * 0.3);
    ctx.moveTo(px + size * 0.45, py + size * 0.5);
    ctx.lineTo(px + size * 0.55, py + size - 8);
    ctx.stroke();

    ctx.restore();
  };

  const drawLightBridgeTile = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    isActive: boolean,
    t: number
  ) => {
    ctx.save();
    if (isActive) {
      // Solid radiant energy walkway
      const pulse = Math.sin(t * 4) * 0.15 + 0.6;
      ctx.fillStyle = isPristine
        ? `rgba(56, 189, 248, ${pulse * 0.5})`
        : `rgba(245, 158, 11, ${pulse * 0.5})`;
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

      ctx.strokeStyle = isPristine ? '#38bdf8' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

      // Glowing center beam
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 4, py + size / 2 - 2, size - 8, 4);
    } else {
      // Inactive outline over chasm
      ctx.fillStyle = '#020617';
      ctx.fillRect(px, py, size, size);

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isPristine ? 'rgba(56, 189, 248, 0.3)' : 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
    }
    ctx.restore();
  };

  const drawPhaseBarrierTile = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    isOpen: boolean,
    t: number
  ) => {
    ctx.save();
    if (isOpen) {
      // Deactivated barrier - walkable floor with portal outline
      ctx.fillStyle = '#0b1320';
      ctx.fillRect(px, py, size, size);

      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
    } else {
      // Impassable forcefield barrier
      const pulse = Math.sin(t * 5) * 0.2 + 0.7;
      ctx.fillStyle = isPristine
        ? `rgba(14, 165, 233, ${pulse * 0.45})`
        : `rgba(239, 68, 68, ${pulse * 0.45})`;
      ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

      ctx.strokeStyle = isPristine ? '#0284c7' : '#dc2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

      // Barrier bars
      ctx.beginPath();
      for (let i = 1; i <= 3; i++) {
        const x = px + (size / 4) * i;
        ctx.moveTo(x, py + 4);
        ctx.lineTo(x, py + size - 4);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawSwitch = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    sw: Switch,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    const cx = px + size / 2;
    const cy = py + size / 2;
    const radius = size * 0.32;

    // Outer Ring
    ctx.strokeStyle = sw.active
      ? (isPristine ? '#38bdf8' : '#10b981')
      : (isPristine ? '#64748b' : '#78350f');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Center Core
    ctx.fillStyle = sw.active
      ? (isPristine ? '#38bdf8' : '#10b981')
      : (isPristine ? '#1e293b' : '#451a03');
    ctx.beginPath();
    ctx.arc(cx, cy, sw.active ? radius * 0.75 : radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing aura if active
    if (sw.active) {
      ctx.strokeStyle = isPristine ? 'rgba(56, 189, 248, 0.4)' : 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + Math.sin(t * 6) * 4 + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawShard = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    const cx = px + size / 2;
    const floatY = py + size / 2 + Math.sin(t * 3) * 4;

    // Floating diamond shard
    ctx.fillStyle = isPristine ? '#7dd3fc' : '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(cx, floatY - 9);
    ctx.lineTo(cx + 7, floatY);
    ctx.lineTo(cx, floatY + 9);
    ctx.lineTo(cx - 7, floatY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  const drawAnchor = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    isSolved: boolean,
    t: number
  ) => {
    ctx.save();
    const cx = px + size / 2;
    const cy = py + size / 2;

    // Glowing concentric resonance rings
    const ringColor = isSolved
      ? '#ffffff'
      : (isPristine ? '#38bdf8' : '#f59e0b');

    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2;

    // Outer rotating beacon
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.8 * (isPristine ? 1 : -1));
    ctx.strokeRect(-size * 0.35, -size * 0.35, size * 0.7, size * 0.7);
    ctx.restore();

    // Center focal point
    ctx.fillStyle = ringColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawPushBlock = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    const pad = 6;
    const bSize = size - pad * 2;

    if (isPristine) {
      // Marble Monolith
      ctx.fillStyle = '#334155';
      ctx.fillRect(px + pad, py + pad, bSize, bSize);

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + pad, py + pad, bSize, bSize);

      // Geometric cross
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(px + size / 2, py + pad + 4);
      ctx.lineTo(px + size / 2, py + size - pad - 4);
      ctx.stroke();
    } else {
      // Heavy Rusted Iron Crate
      ctx.fillStyle = '#3f1f11';
      ctx.fillRect(px + pad, py + pad, bSize, bSize);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + pad, py + pad, bSize, bSize);

      // Industrial bolts in corners
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(px + pad + 4, py + pad + 4, 2, 0, Math.PI * 2);
      ctx.arc(px + size - pad - 4, py + pad + 4, 2, 0, Math.PI * 2);
      ctx.arc(px + pad + 4, py + size - pad - 4, 2, 0, Math.PI * 2);
      ctx.arc(px + size - pad - 4, py + size - pad - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawLaserEmitter = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    emitter: any,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    const cx = px + size / 2;
    const cy = py + size / 2;

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(px + 8, py + 8, size - 16, size - 16);

    // Laser beam line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 300, cy); // Shoots rightwards across
    ctx.stroke();

    ctx.restore();
  };

  const drawLaserReceiver = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    receiver: any,
    isPristine: boolean,
    t: number
  ) => {
    ctx.save();
    const cx = px + size / 2;
    const cy = py + size / 2;

    ctx.strokeStyle = receiver.active ? '#10b981' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(px + 6, py + 6, size - 12, size - 12);

    ctx.fillStyle = receiver.active ? '#10b981' : '#451a03';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawAvatar = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristine: boolean,
    isSolved: boolean,
    t: number
  ) => {
    ctx.save();
    const cx = px + size / 2;
    const cy = py + size / 2;
    const r = size * 0.32;

    if (isPristine) {
      // Pristine Avatar: Ethereal geometric silhouette, celestial cyan halo
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * 1.8);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      glow.addColorStop(0.4, 'rgba(56, 189, 248, 0.8)');
      glow.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Sharp central figure
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Floating outer orbit ring
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r + Math.sin(t * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Decayed Avatar: Weathered dark obsidian silhouette, fiery amber core
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * 1.8);
      glow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      glow.addColorStop(0.4, 'rgba(245, 158, 11, 0.8)');
      glow.addColorStop(1, 'rgba(234, 88, 12, 0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Dark core
      ctx.fillStyle = '#1c130d';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Smoldering jagged crown
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawGhostAvatar = (
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    size: number,
    isPristineGhost: boolean,
    destabilization: number,
    t: number
  ) => {
    ctx.save();
    const cx = px + size / 2;
    const cy = py + size / 2;
    const r = size * 0.28;
    const alpha = ((destabilization - 45) / 55) * 0.25;

    ctx.strokeStyle = isPristineGhost ? `rgba(56, 189, 248, ${alpha})` : `rgba(245, 158, 11, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  // --- Central Rift Seam Renderer ---
  const drawRiftSeam = (
    ctx: CanvasRenderingContext2D,
    seamX: number,
    height: number,
    t: number,
    destabilization: number,
    isSolved: boolean
  ) => {
    ctx.save();

    // The glowing seam line
    const seamGrad = ctx.createLinearGradient(seamX - 6, 0, seamX + 6, 0);
    seamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)'); // Cyan on left
    seamGrad.addColorStop(0.5, '#ffffff'); // Pure white epicenter
    seamGrad.addColorStop(1, 'rgba(245, 158, 11, 0.9)'); // Amber on right

    ctx.strokeStyle = seamGrad;
    ctx.lineWidth = isSolved ? 5 : 2.5;

    // Draw jagged electrical tear
    ctx.beginPath();
    ctx.moveTo(seamX, 0);

    const segments = 36;
    const segHeight = height / segments;
    const glitchAmp = (destabilization / 100) * 8 + (isSolved ? 10 : 2);

    for (let i = 1; i <= segments; i++) {
      const y = i * segHeight;
      const noise = Math.sin(i * 0.7 + t * 4) * glitchAmp;
      ctx.lineTo(seamX + noise, y);
    }
    ctx.stroke();

    // Interactive Drag Handle indicator in center
    const cy = height / 2;
    ctx.fillStyle = isHoveringSeam ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(seamX, cy, isHoveringSeam ? 8 : 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  const drawGlitchScanlines = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    destabilization: number
  ) => {
    ctx.save();
    const sliceCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < sliceCount; i++) {
      const y = Math.random() * height;
      const h = 2 + Math.random() * 8;
      const offset = (Math.random() - 0.5) * 16;

      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(0, y, width, h);
    }
    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full touch-none select-none ${isHoveringSeam ? 'cursor-ew-resize' : 'cursor-default'}`}
      />
    </div>
  );
};
