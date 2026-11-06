export type BrotherId = 'bade' | 'chhote';

export type CharacterSpeaker = 'bade' | 'chhote' | 'dadi' | 'mummy' | 'sharma' | 'gupta';

export type CharacterExpression =
  | 'idle'
  | 'walking'
  | 'running'
  | 'turning'
  | 'angry'
  | 'smug'
  | 'smirking'
  | 'laughing'
  | 'surprised'
  | 'panic'
  | 'celebrating'
  | 'defeated';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type GameMode = 'vs_ai' | 'online_multiplayer' | 'couch_2p' | 'tutorial';

export type ScreenState =
  | 'CINEMATIC_INTRO'
  | 'MAIN_MENU'
  | 'CHARACTER_SELECT'
  | 'MULTIPLAYER_MENU'
  | 'MULTIPLAYER_LOBBY'
  | 'PRE_MATCH_INTRO'
  | 'PLAYING'
  | 'FAMILY_COURT'
  | 'RESULTS';

export type PowerUpType = 'CHAI_SPEED' | 'NIMBU_SHIELD' | 'STAY_ORDER';

export type LandmarkId = 'SCOOTER_SPOT' | 'TULSI_CHAURA' | 'MANGO_SHADE';

export type BanterEventType =
  | 'match_start'
  | 'small_capture'
  | 'large_capture'
  | 'landmark_captured'
  | 'powerup_picked'
  | 'trail_exposed_risk'
  | 'trail_cut_kill'
  | 'player_eliminated'
  | 'player_respawn'
  | 'lead_overtaken'
  | 'falling_behind'
  | 'close_match_tension'
  | 'critical_territory_50pct'
  | 'countdown_30s'
  | 'countdown_10s'
  | 'match_end_win'
  | 'match_end_loss'
  | 'match_end_draw'
  | 'npc_ambient';

export interface GridPoint {
  x: number;
  y: number;
}

export interface TurnBufferItem {
  dir: Direction;
  timestamp: number;
}

export interface PlayerState {
  id: BrotherId;
  name: string;
  numericId: 1 | 2; // 1 = Bade, 2 = Chhote
  x: number; // Continuous grid coordinate (0..GRID_W-1)
  y: number; // Continuous grid coordinate (0..GRID_H-1)
  gridX: number;
  gridY: number;
  dir: Direction;
  nextDir: Direction;
  speed: number; // tiles per second
  inSafeZone: boolean;
  trail: GridPoint[];
  territoryCells: number;
  territoryPct: number;
  eliminations: number;
  deaths: number;
  largestCapturePct: number;
  isEliminated: boolean;
  respawnTimer: number;
  expression: CharacterExpression;
  expressionTimer: number;
  activePowerUp: PowerUpType | null;
  powerUpTimer: number;
  hasShield: boolean;
  slowTimer: number;
  spawnOrigin: GridPoint;
}

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  label: string;
  hindiTitle: string;
  spawnTime: number;
  duration: number;
}

export interface LandmarkZone {
  id: LandmarkId;
  name: string;
  hindiName: string;
  x: number;
  y: number;
  radius: number;
  owner: BrotherId | null;
}

export interface TileFlipEffect {
  x: number;
  y: number;
  owner: 1 | 2;
  progress: number; // 0 to 1
  delay: number; // seconds before flip starts
}

export interface FloatingPopup {
  id: string;
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface ActiveSpeechBubble {
  id: string;
  speaker: CharacterSpeaker;
  speakerName: string;
  text: string;
  event: BanterEventType;
  createdAt: number;
  duration: number;
  priority: number;
}

export interface SupportingNPCState {
  id: 'dadi' | 'mummy' | 'sharma' | 'gupta';
  name: string;
  title: string;
  worldX: number; // in tile coordinates (can be outside 0..GRID_W-1)
  worldY: number;
  animState: 'idle' | 'reacting' | 'talking';
  animTimer: number;
  currentLine: string | null;
}

export interface GameSettings {
  menuMusicVolume: number;
  gameplayMusicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  commentaryVolume: number;
  muted: boolean;
  voiceEnabled: boolean;
  matchDuration: 60 | 120 | 180;
  reducedMotion: boolean;
  showMinimap: boolean;
  graphicsQuality: 'high' | 'medium';
}

export interface LobbyPlayerInfo {
  sessionId: string;
  name: string;
  character: BrotherId | null;
  ready: boolean;
  connected: boolean;
  ping: number;
  isHost: boolean;
}

export interface MultiplayerRoomInfo {
  roomCode: string;
  status: 'lobby' | 'countdown' | 'playing' | 'finished';
  players: LobbyPlayerInfo[];
  matchDuration: number;
  hostSessionId: string;
}

export interface MatchStats {
  winner: BrotherId | 'draw';
  badePct: number;
  chhotePct: number;
  diffPct: number;
  badeEliminations: number;
  chhoteEliminations: number;
  badeLargestCapture: number;
  chhoteLargestCapture: number;
  durationSeconds: number;
  landmarksOwned: Record<LandmarkId, BrotherId | null>;
}

export const ASSET_PATHS = {
  badePortrait: '/assets/images/portrait_bade_brother_1793734589813.jpg',
  chhotePortrait: '/assets/images/portrait_chhote_brother_1793734590858.jpg',
  dadiPortrait: '/assets/images/portrait_dadi_judge_1793734592123.jpg',
  mummyPortrait: '/assets/images/portrait_mummy_authority_1793734593661.jpg',
  bungalowHero: '/assets/images/ancestral_bungalow_hero_1793734595188.jpg',
} as const;

export const GRID_W = 56;
export const GRID_H = 56;
export const TOTAL_TILES = GRID_W * GRID_H;
export const TILE_SIZE = 44;
