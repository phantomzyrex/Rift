import { useState, useEffect, useCallback, useRef } from 'react';
import { ChamberLevel, Position, PushBlock, Switch, TileType, GameSnapshot, ResonanceShard } from '../types/game';
import { LEVELS } from '../data/levels';
import { audioEngine } from '../audio/audioEngine';

export function useRiftGame() {
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const currentLevel: ChamberLevel = LEVELS[levelIndex] || LEVELS[0];

  // Positions
  const [pristinePos, setPristinePos] = useState<Position>(currentLevel.pristine.playerStart);
  const [decayedPos, setDecayedPos] = useState<Position>(currentLevel.decayed.playerStart);

  // Entities
  const [blocks, setBlocks] = useState<PushBlock[]>([]);
  const [switches, setSwitches] = useState<Switch[]>([]);
  const [shards, setShards] = useState<ResonanceShard[]>([]);
  const [crumblingBroken, setCrumblingBroken] = useState<{ world: 'pristine' | 'decayed'; x: number; y: number }[]>([]);

  // Game stats
  const [moves, setMoves] = useState<number>(0);
  const [destabilization, setDestabilization] = useState<number>(0);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [isDefeated, setIsDefeated] = useState<boolean>(false);
  const [defeatReason, setDefeatReason] = useState<string | null>(null);

  // Undo history
  const [history, setHistory] = useState<GameSnapshot[]>([]);

  // Settings
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [stereoSplit, setStereoSplit] = useState<boolean>(true);
  const [seamOffset, setSeamOffset] = useState<number>(50); // 50% center

  // Highest unlocked level
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('rift_max_level');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Track standing on crumbling tile before move
  const previousPristineTileRef = useRef<Position | null>(null);
  const previousDecayedTileRef = useRef<Position | null>(null);

  // Initialize or reset level
  const resetLevel = useCallback((lvlIdx = levelIndex) => {
    const lvl = LEVELS[lvlIdx] || LEVELS[0];
    setPristinePos({ ...lvl.pristine.playerStart });
    setDecayedPos({ ...lvl.decayed.playerStart });

    // Deep copy entities
    const initBlocks: PushBlock[] = [
      ...lvl.pristine.blocks.map(b => ({ ...b })),
      ...lvl.decayed.blocks.map(b => ({ ...b }))
    ];
    setBlocks(initBlocks);

    const initSwitches: Switch[] = [
      ...lvl.pristine.switches.map(s => ({ ...s, active: false })),
      ...lvl.decayed.switches.map(s => ({ ...s, active: false }))
    ];
    setSwitches(initSwitches);

    const initShards: ResonanceShard[] = [
      ...(lvl.pristine.shards || []).map(s => ({ ...s, collected: false })),
      ...(lvl.decayed.shards || []).map(s => ({ ...s, collected: false }))
    ];
    setShards(initShards);

    setCrumblingBroken([]);
    setMoves(0);
    setDestabilization(0);
    setIsSolved(false);
    setIsDefeated(false);
    setDefeatReason(null);
    setHistory([]);
    previousPristineTileRef.current = null;
    previousDecayedTileRef.current = null;
  }, [levelIndex]);

  // Load level when levelIndex changes
  useEffect(() => {
    resetLevel(levelIndex);
  }, [levelIndex, resetLevel]);

  // Unlock levels in storage
  useEffect(() => {
    try {
      localStorage.setItem('rift_max_level', maxUnlockedLevel.toString());
    } catch {
      // ignore
    }
  }, [maxUnlockedLevel]);

  // Destabilization timer loop
  useEffect(() => {
    if (isSolved || isDefeated || zenMode) return;

    const interval = setInterval(() => {
      setDestabilization(prev => {
        const rate = currentLevel.destabilizationRate || 1.0;
        const next = prev + rate * 0.1; // every 100ms
        if (next >= 100) {
          setIsDefeated(true);
          setDefeatReason('Dimensional collapse. The rift breached critical stability.');
          audioEngine.playDesync();
          return 100;
        }
        // Glitch pulse warning sound when near collapse
        if (prev < 80 && next >= 80) {
          audioEngine.playGlitchPulse();
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isSolved, isDefeated, zenMode, currentLevel.destabilizationRate]);

  // Dynamically update audio effects manager whenever destabilization changes
  useEffect(() => {
    audioEngine.updateDestabilization(zenMode ? 0 : destabilization);
  }, [destabilization, zenMode]);

  // Check if tile is walkable
  const isTileWalkable = useCallback((
    world: 'pristine' | 'decayed',
    pos: Position,
    currentSwitches: Switch[],
    currentBroken: { world: 'pristine' | 'decayed'; x: number; y: number }[]
  ): { walkable: boolean; isChasm: boolean; isWall: boolean } => {
    const map = world === 'pristine' ? currentLevel.pristine : currentLevel.decayed;

    // Out of bounds
    if (pos.x < 0 || pos.x >= map.width || pos.y < 0 || pos.y >= map.height) {
      return { walkable: false, isChasm: false, isWall: true };
    }

    // Check if was crumbling and is now broken
    const isBroken = currentBroken.some(b => b.world === world && b.x === pos.x && b.y === pos.y);
    if (isBroken) {
      return { walkable: true, isChasm: true, isWall: false }; // Can step into chasm and fall
    }

    const tile = map.tiles[pos.y][pos.x];

    if (tile === 'wall') {
      return { walkable: false, isChasm: false, isWall: true };
    }

    if (tile === 'phase_barrier') {
      // Barrier is passable if any active switch targets it specifically or generally
      const specificActive = currentSwitches.find(s =>
        s.active && s.targetCoords && s.targetCoords.some(c => c.world === world && c.x === pos.x && c.y === pos.y)
      );
      if (specificActive) {
        return { walkable: true, isChasm: false, isWall: false };
      }
      const genericActive = currentSwitches.find(s =>
        s.active && (!s.targetCoords || s.targetCoords.length === 0) && (s.targetId.includes('barrier') || s.targetId.includes('phase') || s.targetId.includes('gate') || !s.targetId.includes('bridge'))
      );
      if (genericActive) {
        return { walkable: true, isChasm: false, isWall: false };
      }
      return { walkable: false, isChasm: false, isWall: true };
    }

    if (tile === 'light_bridge') {
      // Light bridge is solid if any active switch targets it specifically or generally
      const specificActive = currentSwitches.find(s =>
        s.active && s.targetCoords && s.targetCoords.some(c => c.world === world && c.x === pos.x && c.y === pos.y)
      );
      if (specificActive) {
        return { walkable: true, isChasm: false, isWall: false };
      }
      const genericActive = currentSwitches.find(s =>
        s.active && (!s.targetCoords || s.targetCoords.length === 0) && (s.targetId.includes('bridge') || !s.targetId.includes('barrier'))
      );
      if (genericActive) {
        return { walkable: true, isChasm: false, isWall: false };
      }
      // If inactive, it acts as a chasm!
      return { walkable: true, isChasm: true, isWall: false };
    }

    if (tile === 'chasm') {
      return { walkable: true, isChasm: true, isWall: false };
    }

    return { walkable: true, isChasm: false, isWall: false };
  }, [currentLevel]);

  // Main Movement Function
  const move = useCallback((dx: number, dy: number) => {
    if (isSolved || isDefeated) return;
    audioEngine.init();

    // 1. Snapshot for Undo
    const snapshot: GameSnapshot = {
      pristinePos: { ...pristinePos },
      decayedPos: { ...decayedPos },
      blocks: blocks.map(b => ({ ...b })),
      switches: switches.map(s => ({ ...s })),
      crumblingBrokenTiles: [...crumblingBroken],
      shards: shards.map(s => ({ ...s })),
      moves,
      destabilization
    };

    let nextPristine = { x: pristinePos.x + dx, y: pristinePos.y + dy };
    let nextDecayed = { x: decayedPos.x + dx, y: decayedPos.y + dy };

    let pristineMoved = false;
    let decayedMoved = false;
    let updatedBlocks = [...blocks];

    // Helper: Push block check
    const tryPushBlock = (world: 'pristine' | 'decayed', fromPos: Position, nextPos: Position) => {
      const blockIdx = updatedBlocks.findIndex(b => b.world === world && b.x === nextPos.x && b.y === nextPos.y);
      if (blockIdx === -1) return { canAdvance: true };

      const block = updatedBlocks[blockIdx];
      const targetPos = { x: block.x + dx, y: block.y + dy };

      // Check if target for block is valid
      const targetWalkable = isTileWalkable(world, targetPos, switches, crumblingBroken);
      const isOccupiedByBlock = updatedBlocks.some(b => b.world === world && b.x === targetPos.x && b.y === targetPos.y);

      if (targetWalkable.isWall || isOccupiedByBlock) {
        return { canAdvance: false };
      }

      // Can push block!
      const newBlockList = [...updatedBlocks];
      newBlockList[blockIdx] = { ...block, x: targetPos.x, y: targetPos.y };
      updatedBlocks = newBlockList;
      audioEngine.playPush(world);
      return { canAdvance: true };
    };

    // Check Decayed movement & block push
    const decayedPushResult = tryPushBlock('decayed', decayedPos, nextDecayed);
    const decayedTileWalkable = isTileWalkable('decayed', nextDecayed, switches, crumblingBroken);

    if (decayedPushResult.canAdvance && !decayedTileWalkable.isWall) {
      decayedMoved = true;
    } else {
      nextDecayed = { ...decayedPos };
    }

    // Check Pristine movement & block push
    const pristinePushResult = tryPushBlock('pristine', pristinePos, nextPristine);
    const pristineTileWalkable = isTileWalkable('pristine', nextPristine, switches, crumblingBroken);

    if (pristinePushResult.canAdvance && !pristineTileWalkable.isWall) {
      pristineMoved = true;
    } else {
      nextPristine = { ...pristinePos };
    }

    // If neither moved, play bump sound
    if (!pristineMoved && !decayedMoved) {
      audioEngine.playBump();
      return;
    }

    // Play appropriate footstep SFX
    if (pristineMoved) audioEngine.playFootstep('pristine');
    if (decayedMoved) audioEngine.playFootstep('decayed');

    // Update crumbling tiles: if standing on a crumbling tile before this step, it collapses!
    const newBroken = [...crumblingBroken];
    if (decayedMoved) {
      const currentDecayedTile = currentLevel.decayed.tiles[decayedPos.y]?.[decayedPos.x];
      if (currentDecayedTile === 'crumbling') {
        newBroken.push({ world: 'decayed', x: decayedPos.x, y: decayedPos.y });
      }
    }
    if (pristineMoved) {
      const currentPristineTile = currentLevel.pristine.tiles[pristinePos.y]?.[pristinePos.x];
      if (currentPristineTile === 'crumbling') {
        newBroken.push({ world: 'pristine', x: pristinePos.x, y: pristinePos.y });
      }
    }
    setCrumblingBroken(newBroken);

    // Update switches state based on players or blocks occupying them
    const newSwitches = switches.map(sw => {
      // Check if stepped on
      const isPlayerOn = (sw.world === 'pristine' && nextPristine.x === sw.x && nextPristine.y === sw.y) ||
                         (sw.world === 'decayed' && nextDecayed.x === sw.x && nextDecayed.y === sw.y);
      const isBlockOn = updatedBlocks.some(b => b.world === sw.world && b.x === sw.x && b.y === sw.y);
      const isOccupied = isPlayerOn || isBlockOn;

      let nextActive = sw.active;
      if (sw.type === 'pressure') {
        nextActive = isOccupied;
      } else if (sw.type === 'toggle') {
        if (isPlayerOn) {
          nextActive = !sw.active;
        }
      }

      if (nextActive !== sw.active) {
        audioEngine.playSwitch(nextActive, sw.world);
      }
      return { ...sw, active: nextActive };
    });
    setSwitches(newSwitches);

    // Check Resonance Shards collection
    let recoveredDestabilization = 0;
    const newShards = shards.map(sh => {
      if (sh.collected) return sh;
      const collectedByPristine = sh.world === 'pristine' && nextPristine.x === sh.x && nextPristine.y === sh.y;
      const collectedByDecayed = sh.world === 'decayed' && nextDecayed.x === sh.x && nextDecayed.y === sh.y;
      if (collectedByPristine || collectedByDecayed) {
        audioEngine.playShardCollect();
        recoveredDestabilization += 25; // restore sanity
        return { ...sh, collected: true };
      }
      return sh;
    });
    setShards(newShards);

    if (recoveredDestabilization > 0) {
      setDestabilization(prev => Math.max(0, prev - recoveredDestabilization));
    }

    // Apply movement
    setPristinePos(nextPristine);
    setDecayedPos(nextDecayed);
    setBlocks(updatedBlocks);
    setMoves(m => m + 1);
    setHistory(prev => [...prev, snapshot]);

    // Check Fall / Hazard Death
    const checkPristineFloor = isTileWalkable('pristine', nextPristine, newSwitches, newBroken);
    const checkDecayedFloor = isTileWalkable('decayed', nextDecayed, newSwitches, newBroken);

    if (checkPristineFloor.isChasm) {
      setIsDefeated(true);
      setDefeatReason('The Pristine soul plunged into the frozen stasis abyss.');
      audioEngine.playDesync();
      return;
    }
    if (checkDecayedFloor.isChasm) {
      setIsDefeated(true);
      setDefeatReason('The Decayed vessel fell through the rusted ruins into the void.');
      audioEngine.playDesync();
      return;
    }

    // Check WIN condition:
    // Both avatars must stand on their respective anchors simultaneously!
    const pristineAnchor = currentLevel.pristine.anchor;
    const decayedAnchor = currentLevel.decayed.anchor;

    if (
      nextPristine.x === pristineAnchor.x &&
      nextPristine.y === pristineAnchor.y &&
      nextDecayed.x === decayedAnchor.x &&
      nextDecayed.y === decayedAnchor.y
    ) {
      setIsSolved(true);
      audioEngine.playVictoryHarmony();
      setMaxUnlockedLevel(prev => Math.max(prev, levelIndex + 1));
    }
  }, [
    isSolved,
    isDefeated,
    pristinePos,
    decayedPos,
    blocks,
    switches,
    crumblingBroken,
    shards,
    moves,
    destabilization,
    isTileWalkable,
    currentLevel,
    levelIndex
  ]);

  // Undo move
  const undo = useCallback(() => {
    if (history.length === 0 || isSolved) return;
    const lastSnapshot = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    setPristinePos(lastSnapshot.pristinePos);
    setDecayedPos(lastSnapshot.decayedPos);
    setBlocks(lastSnapshot.blocks);
    setSwitches(lastSnapshot.switches);
    setCrumblingBroken(lastSnapshot.crumblingBrokenTiles);
    setShards(lastSnapshot.shards as ResonanceShard[]);
    setMoves(lastSnapshot.moves);
    setDestabilization(lastSnapshot.destabilization);
    setIsDefeated(false);
    setDefeatReason(null);
  }, [history, isSolved]);

  // Navigate to next level
  const nextLevel = useCallback(() => {
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(prev => prev + 1);
    }
  }, [levelIndex]);

  // Navigate to previous level
  const prevLevel = useCallback(() => {
    if (levelIndex > 0) {
      setLevelIndex(prev => prev - 1);
    }
  }, [levelIndex]);

  // Select specific level
  const goToLevel = useCallback((idx: number) => {
    if (idx >= 0 && idx < LEVELS.length) {
      setLevelIndex(idx);
    }
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          move(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          move(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          move(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          move(1, 0);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          resetLevel();
          break;
        case 'u':
        case 'U':
        case 'z':
        case 'Z':
          if (e.metaKey || e.ctrlKey || e.key === 'u' || e.key === 'U') {
            e.preventDefault();
            undo();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, resetLevel, undo]);

  return {
    levelIndex,
    currentLevel,
    pristinePos,
    decayedPos,
    blocks,
    switches,
    shards,
    crumblingBroken,
    moves,
    destabilization,
    isSolved,
    isDefeated,
    defeatReason,
    canUndo: history.length > 0,
    zenMode,
    audioMuted,
    stereoSplit,
    seamOffset,
    maxUnlockedLevel,
    move,
    undo,
    resetLevel,
    nextLevel,
    prevLevel,
    goToLevel,
    setZenMode,
    setSeamOffset,
    toggleAudio: () => {
      const muted = audioEngine.toggleMute();
      setAudioMuted(muted);
    },
    toggleStereoSplit: () => {
      const nextSplit = !stereoSplit;
      setStereoSplit(nextSplit);
      audioEngine.setStereoSplit(nextSplit);
    }
  };
}
