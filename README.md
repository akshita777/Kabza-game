# KABZA — THE GREAT PROPERTY WAR
**"Baap ki property hai Badshah, par kabza karke dikha!"**

A complete 2D top-down multiplayer territory-capture arcade game set in a ridiculous ancestral-property dispute between two brothers (**Bade** and **Chhote**) in Indore/Jabalpur, Madhya Pradesh.

---

## 1. Quick Start & Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
- To test **Online Multiplayer** locally, create a room in one browser window/tab (`KABZA-XXXX`) and open the generated `/join/KABZA-XXXX` invitation link in a second browser window/tab.

---

## 2. Game Concept & Core Mechanics

Two brothers (**Bade Bhaiya** and **Chhote Badshah**) have inherited their ancestral family bungalow and courtyard. Neither wants to share it.
- **Safe Territory**: Bade owns the **Lush Green Lawn**; Chhote owns the **Red Terracotta Bricks**. Inside your owned territory, you are completely safe.
- **Exposed Trail & Loop Capture**: Step onto neutral sandstone courtyard tiles (or rival territory) to paint a vulnerable trail. Return to your safe territory to close the loop—our **Multi-Pocket Exterior BFS Flood-Fill** algorithm immediately captures all enclosed tiles!
- **Trail Cutting & Elimination**: Run across your brother's exposed trail to eliminate him! Eliminated brothers lose their active unclosed trail and respawn inside their safe territory after **2.0 seconds** while keeping their already-captured land.
- **Corner-Assist Input Buffering**: A 120ms turn pre-buffer queues 90° turns smoothly at tile intersections.
- **Ancestral "Jugaad" Courtyard Pickups**:
  - ☕ **Adrak Wali Kadak Chai**: 1.35× sprint speed boost for 5.5s.
  - 🍋 **Nimbu-Mirchi Nazar Battu**: Protects your exposed trail against 1 enemy cut attempt.
  - 📜 **Gupta Ji's Stay Order**: Slows your rival brother by 35% for 4.0s.
- **Final 20-Second "Registry Rush"**: Music tempo accelerates and both brothers get a 1.15× adrenaline boost in the final 20 seconds.

---

## 3. Characters & Indori-Jabalpur "Badshah" Banter Engine

All spoken lines, subtitles, tutorial steps, error messages, and post-match verdicts follow a natural **Indori Hindi + Jabalpur-style "Badshah"** identity:
- **Bade**: Stocky, handlebar moustache, aggressive, teal shirt.
- **Chhote**: Slim, sunglasses on messy hair, sarcastic, red floral shirt.
- **Dadi Amma (Supreme Family Judge)**: Watches from her veranda charpai with her walking stick and delivers the Post-Match Family Court verdict.
- **Mummy Ji (The Ultimate Authority)**: Appears at the kitchen veranda with her wooden *belan* (rolling pin).
- **Sharma Ji (The Neighbour)**: Watches over the east boundary wall with his newspaper and chai cup, updating the colony WhatsApp group.
- **Gupta Ji (The Property Broker)**: Waits at the south iron gate with his clipboard and stamp-duty calculator for his 2% brokerage commission.

---

## 4. Game Modes & Controls

- **Play vs Computer**: Compete against a state-machine strategic AI bot across **Easy (Lappu)**, **Medium (Chalu)**, and **Hard (Asli Badshah)** difficulties.
- **Online Multiplayer (`/join/KABZA-XXXX`)**: Authoritative server-managed rooms with instant Room Code copy, Invite Link copy, WhatsApp Share, Native Share, and automatic URL joining.
- **2P Couch Kabza**: Same-keyboard 2-player local showdown (**Bade on `WASD`** vs **Chhote on `Arrow Keys`**).
- **10-Step Interactive Tutorial**: Live courtyard training guided by Dadi and the family.

---

## 5. Architecture & Tech Stack Reference

![KABZA — Full Tech Stack & Architecture](public/assets/images/kabza_architecture_and_tech_stack.jpg)

### Full Tech Stack Reference

| Category | Technology | Version | Primary Architectural Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15.4.9 | Fullstack SSR, dynamic join links (`/join/[code]`), API Routes |
| **Language** | TypeScript | 5.9.3 | Strict end-to-end type contracts between Server & Client |
| **Frontend Library** | React | 19.2.1 | Reactive UI components, hooks lifecycle, view transitions |
| **Styling & Motion** | Tailwind CSS v4 + Motion | v4 / 12.23 | Heritage dark UI theme (`#0D1117`) & spring-physics transitions |
| **Rendering API** | HTML5 Canvas 2D Context | Native | 60 FPS camera lerping, procedural sandstone/grass/brick textures |
| **Audio Synthesis** | Web Audio + Web Speech API | Native | Zero-asset Dholak/Tabla oscillators + dynamic Hindi TTS banters |
| **Networking** | REST Polling & Base64 Stream | HTTP/JSON | Compressed 3.1KB Uint8Array board snapshots with instant join URL |

---

### System Architecture Flow

```mermaid
flowchart TD
    subgraph PRESENTATION["PRESENTATION LAYER (Next.js Client / UI / Canvas)"]
        RouterEntry["Next.js App Router Entry<br/>app/page.tsx | app/join/[code]/page.tsx"]
        KabzaApp["KabzaApp (Master Orchestrator)<br/>components/kabza/KabzaApp.tsx<br/>Screen State: Intro | Menu | Lobby | Game | Court"]
        GameHUD["GameHUDAndCanvas<br/>components/kabza/GameHUDAndCanvas.tsx<br/>Territory %, Rush Timer, MiniMap, Virtual D-Pad & Keyboard Bindings"]
        Court["FamilyCourtAndResults<br/>components/kabza/FamilyCourtAndResults.tsx<br/>Dadi Amma Verdict, Mummy Ji Belan Rule, Match Statistics, Confetti & Rematch"]
        Renderer["KabzaCourtyardRenderer<br/>lib/kabza-renderer.ts<br/>Canvas 2D, Particle System, Procedural Tiles, Lerped Camera"]
        Audio["KabzaAudioEngine<br/>lib/kabza-audio.ts<br/>Web Audio Oscillators (Dholak/Sitar), Web Speech Dialogue Narrator"]

        RouterEntry -->|"Mounts Root UI"| KabzaApp
        KabzaApp -->|"Mode: Playing"| GameHUD
        KabzaApp -->|"Mode: Results"| Court
        GameHUD -->|"Render Loop (60 FPS)"| Renderer
        GameHUD -->|"Trigger SFX / Tempo"| Audio
    end

    subgraph ISOMORPHIC["ISOMORPHIC / HEADLESS ENGINE LAYER"]
        MPClient["KabzaMultiplayerClient<br/>lib/kabza-multiplayer-client.ts<br/>State Deserializer (Base64 -> Uint8Array)<br/>Input Dispatcher & Invite Generator"]
        Engine["SharedKabzaEngine<br/>lib/kabza-engine.ts<br/>• 56x56 Uint8Array Grid (3,136 Tiles)<br/>• Multi-Pocket Exterior BFS Flood-Fill<br/>• 120ms Input Turn Buffering<br/>• Trail Cut Elimination & 2.0s Respawn<br/>• State-Machine Strategic Bot AI<br/>• Pickups: Kadak Chai, Nimbu-Mirchi, Stay Order"]
        Dialogue["Banter & Dialogue Engine<br/>lib/kabza-dialogue.ts<br/>Indori-Jabalpuri Mohalla Banters<br/>(Bade, Chhote, Dadi, Mummy, Sharma, Gupta)"]

        KabzaApp -->|"Online MP Direction Input"| MPClient
        MPClient -->|"Apply Synchronized Frame"| Engine
        GameHUD -->|"Game State Snapshots"| Engine
        GameHUD -->|"Local Mode Inputs"| Engine
        Engine -->|"Audio Cue Callbacks"| Audio
        Engine -->|"Banter Events"| Dialogue
    end

    subgraph SERVER["SERVER RUNTIME & STATE STORE"]
        APIGateway["Next.js API Gateway<br/>app/api/rooms/route.ts<br/>GET /api/rooms (Poll GameState)<br/>POST /api/rooms (Actions: Join, Pick, Ready, Input)"]
        RoomManager["KabzaRoomManager (In-Memory Room Store)<br/>lib/kabza-server-store.ts<br/>• Authoritative Room Instances (KABZA-XXXX)<br/>• 'First-Pick Locks Both' Role Assignment<br/>• Room Lifecycle: Lobby -> Countdown -> Playing -> Finished<br/>• 20Hz Tick Loop & Base64 Compression Engine"]

        MPClient <-->|"HTTP POST Actions / GET Polling (20Hz)"| APIGateway
        APIGateway -->|"Dispatch Room Action"| RoomManager
        RoomManager -->|"Runs Authoritative Engine Instance per Room"| Engine
    end
```

