# ❄️ WINTER MAZE — Christmas Edition

A festive maze arcade game for the browser: guide a round muncher through snowy
mazes, collect magic snowflakes, freeze winter monsters with crystals and unlock
holiday skins. Every sprite, maze and sound is generated in code; the game uses
no external art or audio files.

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `pnpm dev`       | Vite dev server with hot reload               |
| `pnpm build`     | Type-check (`tsc -b`) + production build      |
| `pnpm preview`   | Serve the production build locally            |
| `pnpm test`      | Vitest unit tests (mazes, movement, AI, saves)|
| `pnpm lint`      | ESLint (TypeScript + React hooks rules)       |
| `pnpm typecheck` | TypeScript only                               |

Requires Node 20+.

## How to play

| Input                     | Action                                   |
| ------------------------- | ---------------------------------------- |
| `WASD` / arrow keys       | Move (turns are buffered, press early)   |
| `Esc` / `Space` / `P`     | Pause / resume                           |
| Swipe or on-screen D-pad  | Move on touch devices                    |
| `↑` `↓` `Enter`           | Navigate the main menu                   |

- **Snowflakes**: 10 pts. Collect every snowflake and crystal to clear the level.
- **Magic crystals**: 50 pts. Freeze all monsters for a few seconds; catch them for 200 → 400 → 800 → 1600.
- **Golden stars**: 500 pts. These are rare; there are 1–2 per maze.
- **Gifts**: appear at the start spot after 55 and 125 snowflakes. Each gives coins plus one random bonus: an extra life, a sleigh speed boost, +1000 pts or extra coins.

### Monsters

| Monster        | Behaviour                                            |
| -------------- | ---------------------------------------------------- |
| Blizzard Yeti  | Chases your exact tile; speeds up near the end        |
| Frost Wisp     | Aims 4 tiles ahead of you to cut you off              |
| Coal Goblin    | Chases from afar, retreats to its corner up close     |
| Rogue Elf      | Flanks you, using the Yeti's position as a pivot     |

Monsters alternate between *scatter* and *chase* waves. They reverse direction
when a wave changes. When frozen they wander at random. Once caught, their
eyes fly back to the house to regenerate.

### Difficulty

Difficulty changes the actual game rules:

|                 | Easy  | Normal | Hard        |
| --------------- | ----- | ------ | ----------- |
| Lives           | 5     | 3      | 2           |
| Monster speed   | 70 %  | 86 %   | 98 %        |
| Optimal turns   | 55 %  | 85 %   | 100 % + true shortest-path pursuit |
| Freeze time     | 9 s   | 6.5 s  | 4 s         |
| House release   | slow  | medium | fast        |
| Coin multiplier | ×1    | ×1.5   | ×2          |

Each later level also makes monsters faster and shortens crystal time.

### Coins & skins

Coins come from clearing levels (based on score and difficulty), from level
challenges (Flawless, Monster hunter, Stargazer, Sleigh speed) and from gifts.
Spend them in **Skins** on Santa, Snowman, Gingerbread, Reindeer and Ice
Crystal. Skins are purely cosmetic and use the same hitbox and speed.

## Project structure

```
src/
  core/            framework-free services
    audio.ts         WebAudio synth: original music loops + SFX, volume buses
    difficulty.ts    difficulty presets
    progress.ts      persistent store (single source of truth → LocalStorage)
    rules.ts         points, gift triggers, coin rewards, challenges
    skins.ts         skin catalogue
    storage.ts       save schema, validation/repair of corrupted saves
  game/            game logic (no React)
    maze.ts          map parsing, tunnels, BFS path search
    movement.ts      grid-locked movement with buffered turns
    ai.ts            enemy personalities and steering
    bridge.ts        typed event bridge between Phaser and React
    levels/          one file per map + registry
    scene/           Phaser scene, Player/Enemy actors, procedural textures
    createGame.ts    Phaser bootstrap
  art/             Canvas2D drawing routines shared by Phaser and the React UI
  ui/
    components/      reusable UI (buttons, backdrop, snowfall, garland, previews…)
    screens/         Main menu, Level select, Difficulty, Skins, Settings, Game
    play/            HUD, D-pad, pause / level-complete / game-over panels
    hooks/
  styles/          SCSS partials (tokens, menu, screens, collection, play)
```

**Architecture notes**

- React handles menus and overlays, and Phaser handles the playfield. They
  communicate only through `GameBridge`: the scene emits `hud`, `phase`,
  `levelComplete`, `gameOver` and `coins` events, and the UI sends `pause`,
  `resume`, `restartLevel`, `nextLevel`, `newRun` and `direction` commands.
- Movement is grid-locked. Actors change direction only at tile centres, so
  nothing can clip through walls. A unit test checks every map for unreachable
  pickups and dead ends.
- Phaser is lazy-loaded when a game starts. Leaving the game destroys the Phaser
  instance and the bridge, and the scene drops its subscriptions on shutdown.
- Saves are validated field by field. Missing or corrupted data falls back to
  defaults instead of crashing.

### Adding a level

1. Copy `src/game/levels/christmasVillage.ts`, then change the map and theme.
   Map legend: `#` wall, `_` void, `.` snowflake, `o` crystal, `*` star,
   ` ` corridor, `-` gate, `E` monster house, `P` player start.
2. Append it to `LEVELS` in `src/game/levels/index.ts`.
3. Run `pnpm test`. The map validation suite checks reachability, dead ends and
   the house connection.

## Saved data

LocalStorage key `winter-maze/save/v1` stores: best score (overall and per
level), coins, unlocked and selected skins, difficulty, unlocked levels, sound
and display settings, and lifetime stats. **Settings → Reset progress** clears
progress but keeps settings.

## Credits

All code, graphics (Canvas2D/SVG) and music (WebAudio synthesis, original
melodies) were created for this project. Fonts are open-source (SIL OFL) and
bundled via Fontsource: Bungee, Bungee Shade, Press Start 2P and Fredoka.
Icons come from Lucide (ISC).
