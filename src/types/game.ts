export type WorldType = 'pristine' | 'decayed';

export type TileType =
  | 'floor'
  | 'wall'
  | 'chasm'
  | 'crumbling'
  | 'crumbling_broken'
  | 'light_bridge'
  | 'phase_barrier';

export interface Position {
  x: number;
  y: number;
}

export interface PushBlock {
  id: string;
  x: number;
  y: number;
  world: WorldType;
  /** If true, this block projects a physical presence in the other world too */
  projectsToOtherWorld?: boolean;
}

export interface SwitchTargetCoord {
  world: WorldType;
  x: number;
  y: number;
}

export interface Switch {
  id: string;
  x: number;
  y: number;
  world: WorldType;
  targetId: string;
  type: 'pressure' | 'toggle';
  active: boolean;
  label?: string;
  targetCoords?: SwitchTargetCoord[];
}

export interface LaserEmitter {
  id: string;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  world: WorldType;
  crossRift?: boolean;
}

export interface LaserReceiver {
  id: string;
  x: number;
  y: number;
  targetId: string;
  active: boolean;
  world: WorldType;
}

export interface ResonanceShard {
  id: string;
  x: number;
  y: number;
  world: WorldType;
  collected: boolean;
}

export interface WorldMap {
  width: number;
  height: number;
  tiles: TileType[][]; // [y][x]
  playerStart: Position;
  anchor: Position;
  switches: Switch[];
  blocks: PushBlock[];
  lasers?: LaserEmitter[];
  receivers?: LaserReceiver[];
  shards?: ResonanceShard[];
}

export interface ChamberLevel {
  id: number;
  name: string;
  subtitle: string;
  narrative: string;
  loreFragment: string;
  parMoves: number;
  destabilizationRate: number; // % per second in normal mode
  pristine: WorldMap;
  decayed: WorldMap;
  hint?: string;
}

export interface GameSnapshot {
  pristinePos: Position;
  decayedPos: Position;
  blocks: PushBlock[];
  switches: Switch[];
  crumblingBrokenTiles: { world: WorldType; x: number; y: number }[];
  shards: { id: string; collected: boolean }[];
  moves: number;
  destabilization: number;
}
