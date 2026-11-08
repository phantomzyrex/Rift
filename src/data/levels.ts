import { ChamberLevel, TileType } from '../types/game';

// Helper to create empty grid with border walls
function createGrid(width: number, height: number, defaultTile: TileType = 'floor'): TileType[][] {
  const grid: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    const row: TileType[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push('wall');
      } else {
        row.push(defaultTile);
      }
    }
    grid.push(row);
  }
  return grid;
}

export const LEVELS: ChamberLevel[] = [
  // ==========================================
  // CHAMBER 0: Prologue - The Ruptured Mirror
  // ==========================================
  {
    id: 0,
    name: 'Chamber 0',
    subtitle: 'The Ruptured Mirror',
    narrative: 'The cataclysm shattered your consciousness into twin hemispheres. You feel two bodies answering the same heartbeat.',
    loreFragment: 'Fragment I: "We sought timeless perfection. In freezing the realm, we tore its physical mass away, leaving only an immaculate ghost on one side, and decaying matter on the other."',
    parMoves: 8,
    destabilizationRate: 0.8, // gentle intro
    hint: 'Move with WASD or Arrow Keys. Both reflections respond simultaneously to your touch.',
    pristine: {
      width: 8,
      height: 6,
      tiles: (() => {
        const g = createGrid(8, 6);
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 6, y: 3 },
      switches: [],
      blocks: [],
      shards: [{ id: 'shard_0_p', x: 4, y: 1, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 8,
      height: 6,
      tiles: (() => {
        const g = createGrid(8, 6);
        g[2][4] = 'wall'; // twisted girder obstruction
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 6, y: 3 },
      switches: [],
      blocks: [],
      shards: [{ id: 'shard_0_d', x: 4, y: 4, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 1: Symmetrical Dissonance
  // ==========================================
  {
    id: 1,
    name: 'Chamber I',
    subtitle: 'Symmetrical Dissonance',
    narrative: 'When one vessel encounters an immovable obstacle, the other vessel keeps moving. Use architectural friction to separate your alignments.',
    loreFragment: 'Fragment II: "They are not clones, but echoes. When the marble resists, the rusted soul drifts forward alone."',
    parMoves: 12,
    destabilizationRate: 1.1,
    hint: 'Walk into a wall in Pristine to let your Decayed self advance onto the rusted pressure plate.',
    pristine: {
      width: 8,
      height: 6,
      tiles: (() => {
        const g = createGrid(8, 6);
        g[3][5] = 'phase_barrier'; // Gate closed until Decayed switch is pressed
        g[2][2] = 'wall';
        g[4][2] = 'wall';
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 6, y: 3 },
      switches: [],
      blocks: [],
      shards: [{ id: 'shard_1_p', x: 3, y: 1, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 8,
      height: 6,
      tiles: (() => {
        const g = createGrid(8, 6);
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 6, y: 3 },
      switches: [
        {
          id: 'sw_decayed_1',
          x: 4,
          y: 2,
          world: 'decayed',
          targetId: 'phase_barrier_1',
          type: 'toggle',
          active: false,
          label: 'Relic Valve'
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_1_d', x: 4, y: 4, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 2: Rusted Weight
  // ==========================================
  {
    id: 2,
    name: 'Chamber II',
    subtitle: 'Rusted Weight',
    narrative: 'In the sterile Pristine world, matter cannot be pushed—it is frozen in crystalline stasis. Only in the Decayed realm can heavy iron blocks be shifted.',
    loreFragment: 'Fragment III: "Matter exists only where decay is permitted. The immaculate realm cannot bear the strain of alteration."',
    parMoves: 16,
    destabilizationRate: 1.2,
    hint: 'Push the iron crate in the Decayed world onto the pressure pad to sustain the pristine light bridge.',
    pristine: {
      width: 9,
      height: 7,
      tiles: (() => {
        const g = createGrid(9, 7);
        // Chasm gap that requires light bridge
        g[2][5] = 'chasm';
        g[3][5] = 'light_bridge'; // inactive light bridge
        g[4][5] = 'chasm';
        return g;
      })(),
      playerStart: { x: 2, y: 3 },
      anchor: { x: 7, y: 3 },
      switches: [],
      blocks: [],
      shards: [{ id: 'shard_2_p', x: 2, y: 1, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 9,
      height: 7,
      tiles: (() => {
        const g = createGrid(9, 7);
        g[2][4] = 'wall';
        g[4][4] = 'wall';
        return g;
      })(),
      playerStart: { x: 2, y: 3 },
      anchor: { x: 7, y: 3 },
      switches: [
        {
          id: 'sw_decayed_2',
          x: 5,
          y: 3,
          world: 'decayed',
          targetId: 'bridge_2',
          type: 'pressure',
          active: false,
          label: 'Weight Sensor'
        }
      ],
      blocks: [
        {
          id: 'block_decayed_iron',
          x: 3,
          y: 3,
          world: 'decayed'
        }
      ],
      shards: [{ id: 'shard_2_d', x: 5, y: 5, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 3: The Broken Bridge
  // ==========================================
  {
    id: 3,
    name: 'Chamber III',
    subtitle: 'The Broken Bridge',
    narrative: 'A majestic marble bridge spans the void in the Pristine realm, but in the Decayed world, it collapsed eons ago. Tread carefully across empty air.',
    loreFragment: 'Fragment IV: "One eyes the stars across firm ground; the other dangles over the infinite abyss on crumbling slag."',
    parMoves: 20,
    destabilizationRate: 1.3,
    hint: 'Navigate the Pristine vessel to the stasis activator to manifest floating platforms across the Decayed abyss.',
    pristine: {
      width: 10,
      height: 7,
      tiles: (() => {
        const g = createGrid(10, 7);
        g[1][4] = 'wall';
        g[2][4] = 'wall';
        g[4][4] = 'wall';
        g[5][4] = 'wall';
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 8, y: 3 },
      switches: [
        {
          id: 'sw_pristine_3',
          x: 4,
          y: 3,
          world: 'pristine',
          targetId: 'bridge_decayed_3',
          type: 'toggle',
          active: false,
          label: 'Stasis Relic'
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_3_p', x: 2, y: 1, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 10,
      height: 7,
      tiles: (() => {
        const g = createGrid(10, 7);
        // Abyss chasm across x=4,5,6 except bridge at y=3
        for (let y = 1; y < 6; y++) {
          g[y][4] = 'chasm';
          g[y][5] = 'chasm';
        }
        g[3][4] = 'light_bridge'; // manifests when pristine switch is active
        g[3][5] = 'light_bridge';
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 8, y: 3 },
      switches: [],
      blocks: [
        {
          id: 'block_decayed_3',
          x: 2,
          y: 2,
          world: 'decayed'
        }
      ],
      shards: [{ id: 'shard_3_d', x: 7, y: 5, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 4: Temporal Decay (Crumbling Floors)
  // ==========================================
  {
    id: 4,
    name: 'Chamber IV',
    subtitle: 'Temporal Decay',
    narrative: 'The ground in the Decayed realm is fragile. Stepping upon fractured tiles causes them to disintegrate into the void behind you.',
    loreFragment: 'Fragment V: "Do not retrace footsteps where time has rotted through. A single retreat will cast you into the maw."',
    parMoves: 24,
    destabilizationRate: 1.4,
    hint: 'Decayed crumbling tiles will break once you step off them. Plan a non-overlapping path to the anchor.',
    pristine: {
      width: 10,
      height: 7,
      tiles: (() => {
        const g = createGrid(10, 7);
        g[2][3] = 'wall';
        g[2][6] = 'wall';
        g[4][3] = 'wall';
        g[4][6] = 'wall';
        g[3][7] = 'phase_barrier';
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 8, y: 3 },
      switches: [],
      blocks: [],
      shards: [{ id: 'shard_4_p', x: 5, y: 1, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 10,
      height: 7,
      tiles: (() => {
        const g = createGrid(10, 7);
        // Crumbling tiles path
        g[2][4] = 'crumbling';
        g[3][4] = 'crumbling';
        g[4][4] = 'crumbling';
        g[2][5] = 'crumbling';
        g[4][5] = 'crumbling';
        g[3][5] = 'chasm';
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 8, y: 3 },
      switches: [
        {
          id: 'sw_decayed_4',
          x: 6,
          y: 2,
          world: 'decayed',
          targetId: 'phase_4',
          type: 'toggle',
          active: false,
          label: 'Anchor Key'
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_4_d', x: 6, y: 5, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 5: Quantum Seam & Resonance Beam
  // ==========================================
  {
    id: 5,
    name: 'Chamber V',
    subtitle: 'Quantum Seam',
    narrative: 'A focused beam of high-frequency crystalline resonance fires from Pristine across the rift boundary. Align the reflective block to trigger the Decayed core.',
    loreFragment: 'Fragment VI: "Light alone travels unharmed across the rupture. The seam will transmit energy if clear line-of-sight is maintained."',
    parMoves: 26,
    destabilizationRate: 1.5,
    hint: 'Push the decayed matter to clear the line of sight for the cross-dimensional resonance beam.',
    pristine: {
      width: 11,
      height: 7,
      tiles: (() => {
        const g = createGrid(11, 7);
        g[3][8] = 'phase_barrier';
        return g;
      })(),
      playerStart: { x: 2, y: 3 },
      anchor: { x: 9, y: 3 },
      switches: [],
      blocks: [],
      lasers: [
        {
          id: 'laser_p5',
          x: 1,
          y: 3,
          dir: 'right',
          world: 'pristine',
          crossRift: true
        }
      ],
      shards: [{ id: 'shard_5_p', x: 5, y: 1, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 11,
      height: 7,
      tiles: (() => {
        const g = createGrid(11, 7);
        g[2][5] = 'wall';
        g[4][5] = 'wall';
        return g;
      })(),
      playerStart: { x: 2, y: 3 },
      anchor: { x: 9, y: 3 },
      receivers: [
        {
          id: 'rec_d5',
          x: 8,
          y: 3,
          targetId: 'phase_barrier_5',
          active: false,
          world: 'decayed'
        }
      ],
      blocks: [
        {
          id: 'block_d5_blocker',
          x: 4,
          y: 3,
          world: 'decayed'
        }
      ],
      switches: [],
      shards: [{ id: 'shard_5_d', x: 5, y: 5, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 6: The Singularity Convergence
  // ==========================================
  {
    id: 6,
    name: 'Chamber VI',
    subtitle: 'The Singularity Convergence',
    narrative: 'The dimensional tear reaches critical tension. Both vessels must coordinate switches, push-blocks, fragile chasms, and step onto the twin epicenter anchors simultaneously.',
    loreFragment: 'Fragment VII: "When both vessels touch the epicenter at the exact same instant, the rift will mend. The split soul will be made whole."',
    parMoves: 32,
    destabilizationRate: 1.6,
    hint: 'Coordinate weights and crumbling tiles so that both reflections reach the center anchors at the exact same step.',
    pristine: {
      width: 11,
      height: 8,
      tiles: (() => {
        const g = createGrid(11, 8);
        g[2][4] = 'wall';
        g[5][4] = 'wall';
        g[3][7] = 'light_bridge';
        g[4][7] = 'light_bridge';
        g[2][7] = 'chasm';
        g[5][7] = 'chasm';
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 9, y: 4 },
      switches: [
        {
          id: 'sw_p6',
          x: 3,
          y: 2,
          world: 'pristine',
          targetId: 'bridge_d6',
          type: 'toggle',
          active: false,
          label: 'Pristine Node'
        }
      ],
      blocks: [],
      shards: [
        { id: 'shard_6_p1', x: 3, y: 5, world: 'pristine', collected: false },
        { id: 'shard_6_p2', x: 8, y: 1, world: 'pristine', collected: false }
      ]
    },
    decayed: {
      width: 11,
      height: 8,
      tiles: (() => {
        const g = createGrid(11, 8);
        g[3][5] = 'crumbling';
        g[4][5] = 'crumbling';
        g[2][6] = 'chasm';
        g[3][6] = 'light_bridge';
        g[4][6] = 'light_bridge';
        g[5][6] = 'chasm';
        return g;
      })(),
      playerStart: { x: 1, y: 4 },
      anchor: { x: 9, y: 4 },
      switches: [
        {
          id: 'sw_d6',
          x: 7,
          y: 2,
          world: 'decayed',
          targetId: 'bridge_p6',
          type: 'pressure',
          active: false,
          label: 'Decayed Solenoid'
        }
      ],
      blocks: [
        {
          id: 'block_d6',
          x: 3,
          y: 2,
          world: 'decayed'
        }
      ],
      shards: [
        { id: 'shard_6_d1', x: 6, y: 5, world: 'decayed', collected: false },
        { id: 'shard_6_d2', x: 8, y: 6, world: 'decayed', collected: false }
      ]
    }
  },

  // ==========================================
  // CHAMBER 7: The Entangled Labyrinth
  // ==========================================
  {
    id: 7,
    name: 'Chamber VII',
    subtitle: 'The Entangled Labyrinth',
    narrative: 'Divided corridors wind through the fracture. When one soul is caught in a dead-end, the other must locate the pressure node that releases them.',
    loreFragment: 'Fragment VIII: "The labyrinth exists only because the two minds cannot see each other directly. Each sees only the walls erected by the other\'s doubt."',
    parMoves: 26,
    destabilizationRate: 1.4,
    hint: 'Use the walls in Pristine to offset your position, allowing Decayed to reach the pressure plate at the upper alcove.',
    pristine: {
      width: 11,
      height: 8,
      tiles: (() => {
        const g = createGrid(11, 8);
        g[2][3] = 'wall';
        g[3][3] = 'wall';
        g[4][3] = 'wall';
        g[2][6] = 'wall';
        g[4][6] = 'wall';
        g[5][6] = 'wall';
        g[3][5] = 'phase_barrier';
        g[4][8] = 'phase_barrier';
        return g;
      })(),
      playerStart: { x: 1, y: 2 },
      anchor: { x: 9, y: 4 },
      switches: [
        {
          id: 'sw_p7',
          x: 4,
          y: 5,
          world: 'pristine',
          targetId: 'phase_d7',
          type: 'toggle',
          active: false,
          label: 'Marble Node',
          targetCoords: [{ world: 'decayed', x: 6, y: 4 }]
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_7_p', x: 2, y: 5, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 11,
      height: 8,
      tiles: (() => {
        const g = createGrid(11, 8);
        g[2][4] = 'wall';
        g[3][4] = 'wall';
        g[5][4] = 'wall';
        g[2][7] = 'wall';
        g[3][7] = 'wall';
        g[5][7] = 'wall';
        g[4][6] = 'phase_barrier';
        return g;
      })(),
      playerStart: { x: 1, y: 5 },
      anchor: { x: 9, y: 4 },
      switches: [
        {
          id: 'sw_d7_1',
          x: 4,
          y: 2,
          world: 'decayed',
          targetId: 'phase_p7_1',
          type: 'pressure',
          active: false,
          label: 'Rusted Plate I',
          targetCoords: [{ world: 'pristine', x: 5, y: 3 }]
        },
        {
          id: 'sw_d7_2',
          x: 8,
          y: 2,
          world: 'decayed',
          targetId: 'phase_p7_2',
          type: 'pressure',
          active: false,
          label: 'Rusted Plate II',
          targetCoords: [{ world: 'pristine', x: 8, y: 4 }]
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_7_d', x: 7, y: 5, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 8: Dual Weight Calibration
  // ==========================================
  {
    id: 8,
    name: 'Chamber VIII',
    subtitle: 'Dual Weight Calibration',
    narrative: 'Both dimensions now offer physical mass. A polished marble monolith rests in the Pristine world, and an oxidized iron block sits in the Decayed ruins.',
    loreFragment: 'Fragment IX: "When mass crystallizes in both realms, the weight of the past balances the weight of what might be."',
    parMoves: 28,
    destabilizationRate: 1.5,
    hint: 'Push both blocks onto their respective weight sensors to bridge the abyssal gaps dividing you from the synchronization anchors.',
    pristine: {
      width: 11,
      height: 8,
      tiles: (() => {
        const g = createGrid(11, 8);
        g[2][7] = 'chasm';
        g[3][7] = 'light_bridge';
        g[4][7] = 'light_bridge';
        g[5][7] = 'chasm';
        g[2][4] = 'wall';
        g[5][4] = 'wall';
        return g;
      })(),
      playerStart: { x: 2, y: 3 },
      anchor: { x: 9, y: 3 },
      switches: [
        {
          id: 'sw_p8',
          x: 5,
          y: 2,
          world: 'pristine',
          targetId: 'bridge_d8',
          type: 'pressure',
          active: false,
          label: 'Marble Sensor',
          targetCoords: [{ world: 'decayed', x: 7, y: 4 }, { world: 'decayed', x: 7, y: 5 }]
        }
      ],
      blocks: [
        {
          id: 'block_p8',
          x: 3,
          y: 2,
          world: 'pristine'
        }
      ],
      shards: [{ id: 'shard_8_p', x: 2, y: 5, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 11,
      height: 8,
      tiles: (() => {
        const g = createGrid(11, 8);
        g[2][7] = 'chasm';
        g[3][7] = 'chasm';
        g[4][7] = 'light_bridge';
        g[5][7] = 'light_bridge';
        g[2][4] = 'wall';
        g[5][4] = 'wall';
        return g;
      })(),
      playerStart: { x: 2, y: 4 },
      anchor: { x: 9, y: 4 },
      switches: [
        {
          id: 'sw_d8',
          x: 5,
          y: 5,
          world: 'decayed',
          targetId: 'bridge_p8',
          type: 'pressure',
          active: false,
          label: 'Iron Sensor',
          targetCoords: [{ world: 'pristine', x: 7, y: 3 }, { world: 'pristine', x: 7, y: 4 }]
        }
      ],
      blocks: [
        {
          id: 'block_d8',
          x: 3,
          y: 5,
          world: 'decayed'
        }
      ],
      shards: [{ id: 'shard_8_d', x: 2, y: 2, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 9: Fragile Symmetry
  // ==========================================
  {
    id: 9,
    name: 'Chamber IX',
    subtitle: 'Fragile Symmetry',
    narrative: 'A sprawling field of crumbling tiles stretches across the Decayed realm. Stepping backward is fatal; every footstep must carve an irreversible path forward.',
    loreFragment: 'Fragment X: "Time rots fastest beneath hesitant feet. Walk forward without fear of what you leave behind in ashes."',
    parMoves: 30,
    destabilizationRate: 1.6,
    hint: 'Decayed cannot retrace its steps on crumbling tiles. Use Pristine wall obstacles to hold position while Decayed completes the turn.',
    pristine: {
      width: 11,
      height: 8,
      tiles: (() => {
        const g = createGrid(11, 8);
        g[2][3] = 'wall';
        g[3][3] = 'wall';
        g[5][3] = 'wall';
        g[2][6] = 'wall';
        g[4][6] = 'wall';
        g[5][6] = 'wall';
        g[3][8] = 'phase_barrier';
        return g;
      })(),
      playerStart: { x: 1, y: 4 },
      anchor: { x: 9, y: 4 },
      switches: [],
      blocks: [],
      shards: [
        { id: 'shard_9_p1', x: 4, y: 1, world: 'pristine', collected: false },
        { id: 'shard_9_p2', x: 7, y: 6, world: 'pristine', collected: false }
      ]
    },
    decayed: {
      width: 11,
      height: 8,
      tiles: (() => {
        const g = createGrid(11, 8);
        // Serpentine crumbling tiles
        g[2][3] = 'crumbling';
        g[2][4] = 'crumbling';
        g[2][5] = 'crumbling';
        g[3][5] = 'crumbling';
        g[4][5] = 'crumbling';
        g[4][4] = 'crumbling';
        g[4][3] = 'crumbling';
        g[5][3] = 'crumbling';
        g[5][4] = 'crumbling';
        g[5][5] = 'crumbling';
        g[5][6] = 'crumbling';
        g[4][6] = 'crumbling';
        g[3][6] = 'crumbling';
        g[2][6] = 'chasm';
        g[3][4] = 'chasm';
        return g;
      })(),
      playerStart: { x: 1, y: 2 },
      anchor: { x: 9, y: 4 },
      switches: [
        {
          id: 'sw_d9',
          x: 7,
          y: 4,
          world: 'decayed',
          targetId: 'barrier_p9',
          type: 'toggle',
          active: false,
          label: 'Catalyst Switch',
          targetCoords: [{ world: 'pristine', x: 8, y: 3 }]
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_9_d', x: 8, y: 2, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 10: The Paradox Corridor
  // ==========================================
  {
    id: 10,
    name: 'Chamber X',
    subtitle: 'The Paradox Corridor',
    narrative: 'Polarity has inverted. Stepping on a node opens a gate on the opposite side while sealing another behind you. Find the harmonic balance.',
    loreFragment: 'Fragment XI: "A door opened in one world is a wall cast in the other. True passage requires embracing the paradox."',
    parMoves: 34,
    destabilizationRate: 1.6,
    hint: 'Toggle the switches to shift the polarity of the barriers. You may need to revisit switches as positions change.',
    pristine: {
      width: 12,
      height: 8,
      tiles: (() => {
        const g = createGrid(12, 8);
        g[2][4] = 'wall';
        g[5][4] = 'wall';
        g[3][6] = 'phase_barrier';
        g[4][8] = 'phase_barrier';
        g[2][9] = 'wall';
        g[5][9] = 'wall';
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 10, y: 3 },
      switches: [
        {
          id: 'sw_p10_1',
          x: 5,
          y: 2,
          world: 'pristine',
          targetId: 'barrier_d10_1',
          type: 'toggle',
          active: false,
          label: 'Alpha Valve',
          targetCoords: [{ world: 'decayed', x: 5, y: 4 }]
        },
        {
          id: 'sw_p10_2',
          x: 7,
          y: 5,
          world: 'pristine',
          targetId: 'barrier_d10_2',
          type: 'toggle',
          active: false,
          label: 'Gamma Valve',
          targetCoords: [{ world: 'decayed', x: 8, y: 3 }]
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_10_p', x: 3, y: 1, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 12,
      height: 8,
      tiles: (() => {
        const g = createGrid(12, 8);
        g[2][4] = 'wall';
        g[5][4] = 'wall';
        g[4][5] = 'phase_barrier';
        g[3][8] = 'phase_barrier';
        g[2][9] = 'wall';
        g[5][9] = 'wall';
        return g;
      })(),
      playerStart: { x: 1, y: 4 },
      anchor: { x: 10, y: 4 },
      switches: [
        {
          id: 'sw_d10_1',
          x: 4,
          y: 2,
          world: 'decayed',
          targetId: 'barrier_p10_1',
          type: 'toggle',
          active: false,
          label: 'Beta Valve',
          targetCoords: [{ world: 'pristine', x: 6, y: 3 }]
        },
        {
          id: 'sw_d10_2',
          x: 8,
          y: 5,
          world: 'decayed',
          targetId: 'barrier_p10_2',
          type: 'toggle',
          active: false,
          label: 'Delta Valve',
          targetCoords: [{ world: 'pristine', x: 8, y: 4 }]
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_10_d', x: 4, y: 6, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 11: Temporal Echoes
  // ==========================================
  {
    id: 11,
    name: 'Chamber XI',
    subtitle: 'Temporal Echoes',
    narrative: 'A heavy iron crate must be guided across a manifested light-bridge over an abyss. If the pristine anchor falters, the bridge dissolves and the weight is lost.',
    loreFragment: 'Fragment XII: "Trust is the only bridge spanning the chasm. The vessel on firm stone must hold fast so the vessel on the edge does not fall."',
    parMoves: 38,
    destabilizationRate: 1.7,
    hint: 'Pristine must stand on the stasis node to manifest the Decayed bridge, while Decayed pushes the iron weight across.',
    pristine: {
      width: 12,
      height: 8,
      tiles: (() => {
        const g = createGrid(12, 8);
        g[2][3] = 'wall';
        g[3][3] = 'wall';
        g[5][3] = 'wall';
        g[2][7] = 'wall';
        g[5][7] = 'wall';
        g[4][9] = 'phase_barrier';
        return g;
      })(),
      playerStart: { x: 1, y: 3 },
      anchor: { x: 10, y: 4 },
      switches: [
        {
          id: 'sw_p11',
          x: 4,
          y: 2,
          world: 'pristine',
          targetId: 'bridge_d11',
          type: 'pressure',
          active: false,
          label: 'Stasis Sustain',
          targetCoords: [{ world: 'decayed', x: 5, y: 4 }, { world: 'decayed', x: 6, y: 4 }]
        }
      ],
      blocks: [],
      shards: [{ id: 'shard_11_p', x: 8, y: 1, world: 'pristine', collected: false }]
    },
    decayed: {
      width: 12,
      height: 8,
      tiles: (() => {
        const g = createGrid(12, 8);
        // Gaping abyss across columns 5 and 6
        for (let y = 1; y < 7; y++) {
          g[y][5] = 'chasm';
          g[y][6] = 'chasm';
        }
        g[4][5] = 'light_bridge';
        g[4][6] = 'light_bridge';
        return g;
      })(),
      playerStart: { x: 1, y: 4 },
      anchor: { x: 10, y: 4 },
      switches: [
        {
          id: 'sw_d11',
          x: 8,
          y: 4,
          world: 'decayed',
          targetId: 'barrier_p11',
          type: 'pressure',
          active: false,
          label: 'Receptacle',
          targetCoords: [{ world: 'pristine', x: 9, y: 4 }]
        }
      ],
      blocks: [
        {
          id: 'block_d11',
          x: 3,
          y: 4,
          world: 'decayed'
        }
      ],
      shards: [{ id: 'shard_11_d', x: 8, y: 6, world: 'decayed', collected: false }]
    }
  },

  // ==========================================
  // CHAMBER 12: The Omega Rupture (Grand Finale)
  // ==========================================
  {
    id: 12,
    name: 'Chamber XII',
    subtitle: 'The Omega Rupture',
    narrative: 'The seam has shattered into an incandescent vortex. Here at the primal core of all existence, every rule converged. Realignment demands total synchrony.',
    loreFragment: 'Fragment XIII: "We were never two souls. We were one soul looking into the mirror of time. As the anchor realigns, the crack in the glass seals forever."',
    parMoves: 44,
    destabilizationRate: 1.8,
    hint: 'Coordinate weights in both worlds, navigate crumbling tiles, and reach the twin central anchors simultaneously to achieve absolute harmony.',
    pristine: {
      width: 12,
      height: 9,
      tiles: (() => {
        const g = createGrid(12, 9);
        g[2][4] = 'wall';
        g[3][4] = 'wall';
        g[5][4] = 'wall';
        g[6][4] = 'wall';
        g[3][7] = 'light_bridge';
        g[4][7] = 'light_bridge';
        g[5][7] = 'light_bridge';
        g[2][7] = 'chasm';
        g[6][7] = 'chasm';
        g[4][9] = 'phase_barrier';
        return g;
      })(),
      playerStart: { x: 1, y: 4 },
      anchor: { x: 10, y: 4 },
      switches: [
        {
          id: 'sw_p12_1',
          x: 3,
          y: 2,
          world: 'pristine',
          targetId: 'bridge_d12',
          type: 'pressure',
          active: false,
          label: 'Prism Key',
          targetCoords: [{ world: 'decayed', x: 7, y: 3 }, { world: 'decayed', x: 7, y: 4 }]
        },
        {
          id: 'sw_p12_2',
          x: 3,
          y: 6,
          world: 'pristine',
          targetId: 'phase_d12',
          type: 'toggle',
          active: false,
          label: 'Stasis Core',
          targetCoords: [{ world: 'decayed', x: 9, y: 4 }]
        }
      ],
      blocks: [
        {
          id: 'block_p12',
          x: 2,
          y: 2,
          world: 'pristine'
        }
      ],
      shards: [
        { id: 'shard_12_p1', x: 5, y: 1, world: 'pristine', collected: false },
        { id: 'shard_12_p2', x: 9, y: 7, world: 'pristine', collected: false }
      ]
    },
    decayed: {
      width: 12,
      height: 9,
      tiles: (() => {
        const g = createGrid(12, 9);
        // Crumbling fields and chasms
        g[2][5] = 'crumbling';
        g[3][5] = 'crumbling';
        g[4][5] = 'crumbling';
        g[5][5] = 'crumbling';
        g[6][5] = 'crumbling';
        g[2][7] = 'chasm';
        g[3][7] = 'light_bridge';
        g[4][7] = 'light_bridge';
        g[5][7] = 'chasm';
        g[6][7] = 'chasm';
        g[4][9] = 'phase_barrier';
        return g;
      })(),
      playerStart: { x: 1, y: 4 },
      anchor: { x: 10, y: 4 },
      switches: [
        {
          id: 'sw_d12_1',
          x: 3,
          y: 2,
          world: 'decayed',
          targetId: 'bridge_p12',
          type: 'pressure',
          active: false,
          label: 'Rusted Core',
          targetCoords: [{ world: 'pristine', x: 7, y: 3 }, { world: 'pristine', x: 7, y: 4 }, { world: 'pristine', x: 7, y: 5 }]
        },
        {
          id: 'sw_d12_2',
          x: 3,
          y: 6,
          world: 'decayed',
          targetId: 'phase_p12',
          type: 'toggle',
          active: false,
          label: 'Catalyst Node',
          targetCoords: [{ world: 'pristine', x: 9, y: 4 }]
        }
      ],
      blocks: [
        {
          id: 'block_d12',
          x: 2,
          y: 2,
          world: 'decayed'
        }
      ],
      shards: [
        { id: 'shard_12_d1', x: 5, y: 1, world: 'decayed', collected: false },
        { id: 'shard_12_d2', x: 8, y: 6, world: 'decayed', collected: false }
      ]
    }
  }
];

