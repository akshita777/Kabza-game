# KABZA — The Great Property War
**"Baap ki property hai Badshah, par kabza karke dikha!"**

A complete, production-grade 2D top-down multiplayer territory-capture arcade game where two feuding Indian brothers—**Bade** and **Chhote**—battle to capture their ancestral Indore/Jabalpur family bungalow courtyard while watched and judged by **Dadi**, **Mummy**, **Sharma Ji**, and **Gupta Ji**. Every screen, character interaction, tutorial step, error message, and dynamic banter event is written in authentic **Indori Hindi + Jabalpur-style "Badshah" slang**, powered by a **high-fidelity, realistic 2D visual and texture rendering pipeline**, veteran arcade game-feel mechanics, and authoritative multiplayer.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> This blueprint unifies your confirmed choices, every requirement from the Master Prompt, **6 Veteran Game Design Upgrades**, and a **High-Fidelity Realistic 2D Graphics Pipeline**:

1. **High-Fidelity Realistic 2D Graphics & Texture Engine (New Upgrade)**:
   - **Bespoke AI-Generated Character Portraits & Environment Art**: High-detail illustrated portraits for **Bade**, **Chhote**, **Dadi**, **Mummy**, **Sharma Ji**, and **Gupta Ji**, plus an atmospheric ancestral Indore bungalow backdrop generated via `generate_image`.
   - **Physically Grounded Surface Textures & Cast Shadows**: Offscreen pre-baked high-DPI tilemaps featuring weathered sandstone courtyard slabs (subtle surface grain, bevelled grout lines, micro-pebbles, and seam moss), rich terracotta brick masonry with mortar depth for Chhote, and multi-tone lush grass blades for Bade.
   - **2.5D Depth, Directional Lighting & Ambient Occlusion**: 3D-extruded compound boundary walls and brick pillars with warm golden-hour Indian sunlight casting soft directional drop shadows across the courtyard floor, layered swaying mango tree canopies, realistic water tank reflections, vintage Bajaj scooter metalwork, and articulated top-down character bodies with swinging arms, expressive faces, and footstep dust clouds.
2. **Corner-Assist Input Buffering (120ms Turn Queue)**: Queues 90° turns smoothly at tile intersections so weaving tight loops feels effortless on keyboard (`WASD` / `Arrows`) and mobile touch joystick.
3. **Ancestral "Jugaad" Courtyard Pickups**:
   - **Adrak Wali Kadak Chai (Speed Boost — 5s)**: 1.35× sprint speed with rising steam particles (*"Kadak chai pee li Badshah, ab pakad ke dikha!"*).
   - **Nimbu-Mirchi Nazar Battu (Trail Shield — 4s)**: Protects an exposed trail against one rival cut attempt with a glowing ward aura.
   - **Gupta Ji's Stay Order (Rival Slow — 3s)**: Slaps a legal stay notice on the rival brother, slowing their movement by 35% (*"Stay order lag gaya re!"*).
4. **"Prime Property" High-Value Landmarks**: Three special ancestral zones inside the courtyard—**Babuji's Scooter Spot**, **Sacred Tulsi Chaura**, and **Mango Tree Shade**—grant bonus prestige and trigger dedicated family arguments when captured.
5. **Final 20-Second "Registry Rush" Climax & Arcade Juice**:
   - Radial **tile-flip wave** animations on capture, floating **`+X.X% KABZA!`** popups, 50ms **hit-stop + directional camera shake** on trail cuts, an animated **Badshah Crown (`👑`)** on the leading brother, and a live **Tug-of-War Property Bar** beneath the timer.
6. **Three Complete Play Modes**: **VS Computer** (Easy / Medium / Hard strategic AI), **Online Multiplayer** (`KABZA-XXXX` rooms with `/join/KABZA-XXXX` auto-join & WhatsApp share), and **2P Couch Kabza** (same-keyboard `WASD` vs `Arrow Keys`).

---

## 1. Overview & Core Concept

- **What It Does**: Players control either **Bade** or **Chhote** in a real-time territory-capture battle over their ancestral family plot. Moving outside safe territory leaves an exposed painted trail with glowing bevelled edges; returning to safe territory closes the loop and flood-fills all enclosed neutral or rival land. Cutting the rival's exposed trail eliminates them for **2 seconds** while keeping their already-captured land intact. When the match timer expires (default `2:00`, configurable `1:00` / `2:00` / `3:00`), the brother owning the highest percentage of the courtyard wins the ancestral property.
- **Core Identity**: *"Two brothers. One ancestral property. An entire neighbourhood watching. And a family full of Badshahs."*

---

## 2. Complete Feature, Visual & Content Specification

### 2.1 High-Fidelity Realistic 2D Visual Direction & Asset Pipeline

- **Lighting & Atmosphere**: Warm late-afternoon Indore golden-hour lighting (`#FFF5E4` directional key light from the top-left, casting `rgba(28, 20, 14, 0.32)` soft drop shadows to the bottom-right on all characters, compound pillars, trees, scooter, charpai, and veranda roofs).
- **Pre-Baked Procedural PBR-Style Tile & Ground Shaders**:
  - *Outer Compound Soil & Garden*: Rich organic earth texture layered with scattered pebbles, fallen terracotta shards, realistic multi-layered bush clusters, and stepping-stone pathways (matching reference screenshots 1 & 3).
  - *Courtyard Sandstone Tiles*: High-DPI weathered Dholpur/Kota stone slabs with subtle colour variation per tile, recessed mortar joints, tiny surface pebbles, and organic grass tufts sprouting in tile intersections.
  - *Bade's Captured Territory (Lush Lawn)*: Deep emerald turf with blade texture, soft inner-border bevel, and glowing lime-green active trail with motion particles.
  - *Chhote's Captured Territory (Terracotta Bricks)*: Realistic running-bond red clay bricks with specular highlights, mortar lines, and a glowing crimson active trail.
- **Articulated Top-Down Character Rigs**:
  - Smoothly rotated top-down bodies matching the reference screenshots—broad shoulders, animated pumping arms/hands, walking chappals, distinct hair/sunglasses silhouettes, ground contact shadows, and dynamic overhead expression badges + comic speech bubbles.

---

### 2.2 Regional Language Identity & Dynamic Banter Engine (Indori + Jabalpur "Badshah" Slang)

Every single line of spoken dialogue, UI notification, tutorial prompt, error toast, lobby status, and post-match verdict uses natural **Indori Hindi + Jabalpur Badshah** expressions (*Badshah, Are Badshah!, O Badshah!, Kaa, Kaiko, Kaise re, Apan, Tumko, Hamko, Kya kar diye?, Gajab kar diye, Pakad ke dikha, Hatt re, Chal be, Kaa samjhe?, Bawaal, Jhand, Lappu, Setting, Kabza, Hisaab, Nipat lenge* — never generic Hindi or Mumbai "bhidu" tapori slang).

#### Complete Character Dialogue & Banter Pools (Mandatory + Expanded Context Pools)

- **Bade (Aggressive, Loud, Moustache-Twirling Elder Brother)**:
  - *"Are Badshah, ee poora plot apan ka hai!"*
  - *"Kaiko beech mein aa rahe ho re?"*
  - *"Chhote, zyada hoshiyaari mat dikha!"*
  - *"Abhi batata hoon kiske naam registry hogi!"*
  - *"Are, line kaat diye iski!"*
  - *"Apan se property cheenega? Sapna dekh re!"*
  - *"Dadi ko bol dena, bada beta jeet gaya!"*
  - *"Ee boundary ke andar ab apan ka raj chalega!"*
  - *"Haan Badshah, ab samajh mein aaya?"*
  - *Plus 30+ context-specific lines for mega captures, power-up pickups, trail panic, getting eliminated, taking the lead, falling behind, and final 10-second rush.*
- **Chhote (Quick, Sarcastic, Mischievous Younger Brother)**:
  - *"Are Bade, itna uchhal mat re!"*
  - *"Kaa Badshah, buddhi ghutne mein hai kya?"*
  - *"Plot tumhara hoga, par dimaag toh apan ka hai!"*
  - *"Bade bhai, thoda side ho jao, hawa aane do!"*
  - *"Are re re! Trail bachao apni!"*
  - *"Kya Badshah, registry kara li kya?"*
  - *"Tum bas mooch sambhalo, property apan sambhalte hain!"*
  - *"Aaj Dadi bhi mere side hain, samjhe?"*
  - *"Ee toh trailer tha Badshah!"*
  - *Plus 30+ context-specific lines reacting directly to Bade's captures, cutting Bade's trail, narrow escapes, power-ups, and victory roasts.*
- **Dadi — The Family Judge (Authoritative, Sharp, Watching from Veranda Charpai)**:
  - *"Are nalayako! Property baantni thi, tum dono ne dangal bana diya!"*
  - *"Jo jeetega, usko bhi subah kachra bahar daalna padega!"*
  - *"Badshah log, pehle pair sambhalo, phir zameen!"*
  - *"Are, Sharma Ji ke saamne izzat mat utarwao!"*
  - *"Tum dono se achha toh hamara purana scooter chalta hai!"*
  - *"Kisiko bhi zameen mile, bijli ka bill dono bharoge!"*
- **Mummy — The Ultimate Authority (Commanding, Belan in Hand)**:
  - *"Bas karo dono! Poora mohalla tamasha dekh raha hai!"*
  - *"Badshah, ghar mein bhi itni energy laga liya karo!"*
  - *"Jo haarega, bartan wahi dhoyega!"*
  - *"Registry baad mein, pehle khana kha lo!"*
  - *"Ek aur awaaz aayi toh belan niklega!"*
- **Sharma Ji — The Neighbour (Gossipy, Chai Cup & Newspaper at Boundary Wall)**:
  - *"Are Gupta Ji, aaj toh live property dispute chal raha hai!"*
  - *"Ham toh bas chai peene aaye the, yahan toh Mahabharat ho gaya!"*
  - *"Badshah, ek photo hamare WhatsApp group mein bhi bhejna!"*
  - *"Mohalle mein kal se isi ki charcha hone wali hai!"*
- **Gupta Ji — The Property Broker (Opportunistic, Clipboard & Registry Papers by Gate)**:
  - *"Badshah, jeeto ya haaro, registry mein hamara commission fix hai!"*
  - *"Plot ka rate badh gaya hai, pehle token amount jama karo!"*
  - *"Aap dono lad lo, agreement ham taiyaar kar dete hain!"*
  - *"Boundary idhar hui toh brokerage udhar lagegi!"*

---

### 2.3 Story Opening & 5-Scene Skippable Cinematic Intro

- **Scene 1 — The Ancestral Property**: Rich visual pan across the ancestral Indore family bungalow, courtyard, gate, mango tree, tulsi chaura, hand pump, and old scooter with golden sunlight rays. Text: *"Do bhai."* → *"Ek pushtaini property."* → *"Aur baantne ka naam? Bilkul nahi."*
- **Scene 2 — The Family Dispute**: Bade and Chhote argue face-to-face over the courtyard boundary in Indori-Jabalpur style.
- **Scene 3 — Family Intervention**: High-detail portraits and animations of Dadi on her charpai, Mummy with her belan, Sharma Ji with his newspaper & chai, and Gupta Ji with registry papers.
- **Scene 4 — The Final Decision**: Narration: *"Saalo ka family drama."* → *"Roz ke jhagde."* → *"Registry ka tension."* → *"Ab faisla hoga zameen par!"*
- **Scene 5 — Game Reveal**: **KABZA — THE GREAT PROPERTY WAR** — *"Choose your Badshah. Capture the zameen. Jeeto pushtaini property!"* (Skippable at any time).

---

### 2.4 The Ancestral Property Arena (All 24 Detailed Props + Scrolling Camera + Minimap)

The playable `60 × 60` courtyard grid is framed by a richly textured 2.5D top-down Indian family compound featuring all **24 environmental elements**:
1. Old ancestral bungalow main facade & terracotta roof tiles
2. Central weathered sandstone tiled courtyard
3. North veranda with carved pillars & old family photographs on the wall
4. Woven **Charpai** with bolster pillow (where **Dadi** sits with her walking stick)
5. Shady **Mango tree** with multi-layer canopy and falling leaf particles
6. Sacred **Tulsi plant (Tulsi Chaura)** courtyard shrine
7. Cast-iron **Hand pump** with wet stone puddle detail
8. Vintage **Old scooter** with chrome highlights parked near the gate
9. Rooftop **Water tank** with piping
10. Ornate **Iron gate** & entrance pillars (where **Gupta Ji** stands with clipboard)
11. 2.5D **Boundary wall** with brick columns (where **Sharma Ji** watches with chai & newspaper)
12. Kitchen veranda doorway (where **Mummy** appears waving her belan)
13. Perimeter **Garden**, **Terracotta flower pots**, **Lush bushes**, **Decorative stones**, and **Brick pathways**
14. **Small storage shed**, fluttering **Clothesline**, **Outdoor seating**, **Neighbouring house rooftops**, and **Balcony details**

---

### 2.5 Playable 10-Step Interactive Tutorial, 3-Tier Strategic AI, Couch 2P & Online Multiplayer (`/join/KABZA-XXXX`)

- **10-Step Interactive Tutorial**: Guided by Dadi (*"Are Badshah, pehle chalna seekh lo, phir zameen kabza karna!"*) verifying Movement, Safe Territory, Leaving Safe Territory, Creating an Exposed Trail, Closing a Loop, Capturing Land, Avoiding Trail Collisions, Attacking Enemy Trails, Territory Percentages, and Winning the Match.
- **3-Tier Strategic AI (Easy / Medium / Hard)**: True tactical state-machine bot that carves loops, evaluates threat distances, hunts exposed player trails, and grabs power-ups.
- **Authoritative Online Multiplayer (`KABZA-XXXX`)**: Room creation, unique codes, one-tap copy, WhatsApp/native share, automatic URL join via `/join/KABZA-XXXX`, lobby ready-locking, and Post-Match Family Court verdict sequence.

---

## 3. Technical Architecture & Rendering Pipeline

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         KABZA CLIENT APPLICATION (Next.js)                     │
├────────────────────────┬────────────────────────────┬──────────────────────────┤
│  Screens & Portraits   │  Realistic 2.5D Courtyard  │  Banter & Audio Systems  │
│  ┌──────────────────┐  │  ┌──────────────────────┐  │  ┌────────────────────┐  │
│  │ AI Art Portraits │  │  │ Multi-Layer Canvas   │  │  │ Badshah Banter     │  │
│  │ 5-Scene Intro    │  │  │ - Baked PBR Tilemaps │  │  │ Engine (18 Hooks)  │  │
│  │ Main Menu        │  │  │ - Cast Drop Shadows  │  │  │ - Call & Response  │  │
│  │ Brother Select   │  │  │ - 24 2.5D Props      │  │  │ - Comic Bubbles    │  │
│  │ Online Lobby     │  │  │ - Articulated Rigs   │  │  ├────────────────────┤  │
│  │ /join/[code] URL │  │  │ - Ripple & Particles │  │  │ 5-Channel WebAudio │  │
│  │ 10-Step Tutorial │  │  ├──────────────────────┤  │  │ + Hindi TTS Synth  │  │
│  │ Family Court &   │  │  │ Reference HUD        │  │  │ - Menu/Game/Rush   │  │
│  │ Results Screen   │  │  │ - Tug-of-War & Map   │  │  │ - SFX / Voice / NPC│  │
│  └──────────────────┘  │  └──────────────────────┘  │  └────────────────────┘  │
└───────────┬────────────┴─────────────┬──────────────┴────────────┬─────────────┘
            │                          │                           │
            ▼                          ▼                           ▼
┌──────────────────────────────────────────┐   ┌─────────────────────────────────┐
│     SHARED DETERMINISTIC GAME ENGINE     │   │ AUTHORITATIVE WEBSOCKET SERVER  │
│ - 60x60 Spatial Grid & 120ms Turn Buffer │   │ - Room Manager (KABZA-XXXX)     │
│ - Multi-Pocket BFS Flood-Fill Algorithm  │◄─►│ - 20Hz Authoritative Tick Loop  │
│ - 3-Tier Strategic AI + Power-Up Logic   │   │ - Input Validation & Rate Limit │
│ - 10-Step Interactive Tutorial Verifier  │   │ - Reconnect Session Recovery    │
└──────────────────────────────────────────┘   └─────────────────────────────────┘
```
