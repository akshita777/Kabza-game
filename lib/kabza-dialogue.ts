import { BanterEventType, BrotherId, CharacterSpeaker } from './kabza-types';

export interface DialogueEntry {
  speaker: CharacterSpeaker;
  text: string;
  event: BanterEventType;
  priority: number;
  followUp?: {
    speaker: CharacterSpeaker;
    text: string;
    delayMs: number;
  };
}

export const CHARACTER_METADATA: Record<
  CharacterSpeaker,
  {
    name: string;
    hindiRole: string;
    badgeColor: string;
    borderColor: string;
    bgColor: string;
    textColor: string;
    oneLiner: string;
    description: string;
  }
> = {
  bade: {
    name: 'BADE BHAIYA',
    hindiRole: 'Asli Waris (Self-Declared)',
    badgeColor: '#2E6F40',
    borderColor: '#4E9F3D',
    bgColor: '#1B3B2B',
    textColor: '#D8F3DC',
    oneLiner: 'Are Badshah, ee poora plot apan ka hai! Mooch pe taav deke kabza karenge!',
    description:
      'Aggressive, loud, stocky, and convinced the entire ancestral Indore plot belongs to him by birthright.',
  },
  chhote: {
    name: 'CHHOTE BADSHAH',
    hindiRole: 'Jugaadu Mastermind',
    badgeColor: '#B83B2B',
    borderColor: '#E05A47',
    bgColor: '#4A1C17',
    textColor: '#FFDAD6',
    oneLiner: 'Tum bas mooch sambhalo Bade, property aur dimaag dono apan sambhalte hain!',
    description:
      'Slim, quick-witted, sarcastic, and loves slicing Bade’s exposed trail while wearing sunglasses.',
  },
  dadi: {
    name: 'DADI AMMA',
    hindiRole: 'Supreme Family Judge',
    badgeColor: '#B45309',
    borderColor: '#F59E0B',
    bgColor: '#3B230A',
    textColor: '#FEF3C7',
    oneLiner: 'Are nalayako! Property baantni thi, tum dono ne dangal bana diya!',
    description:
      'Watches every move from her veranda charpai with her walking stick. Delivers the final verdict.',
  },
  mummy: {
    name: 'MUMMY JI',
    hindiRole: 'Belan High Command',
    badgeColor: '#9D174D',
    borderColor: '#EC4899',
    bgColor: '#3B0D22',
    textColor: '#FCE7F3',
    oneLiner: 'Ek aur awaaz aayi toh belan niklega! Jo haarega, bartan wahi dhoyega!',
    description:
      'The ultimate authority in the house. Can stop both Badshahs with one threat of her rolling pin.',
  },
  sharma: {
    name: 'SHARMA JI',
    hindiRole: 'Mohalla CCTV & Gossip Editor',
    badgeColor: '#1D4ED8',
    borderColor: '#60A5FA',
    bgColor: '#172554',
    textColor: '#DBEAFE',
    oneLiner: 'Ham toh bas chai peene aaye the, yahan toh live Mahabharat chalu hai!',
    description:
      'Stationed at the boundary wall with chai and newspaper, broadcasting live updates to the colony WhatsApp group.',
  },
  gupta: {
    name: 'GUPTA JI',
    hindiRole: '2% Commission Broker',
    badgeColor: '#6D28D9',
    borderColor: '#A78BFA',
    bgColor: '#2E1065',
    textColor: '#EDE9FE',
    oneLiner: 'Badshah, jeeto ya haaro, registry mein hamara commission fix hai!',
    description:
      'Stands by the iron gate with registry papers and stamp duty calculator, profiting from every square foot.',
  },
};

/**
 * Complete Indori + Jabalpur "Badshah" Dialogue Database
 * Includes all mandatory lines from the specification plus rich contextual banter and call-and-response pairs.
 */
export const DIALOGUE_POOL: DialogueEntry[] = [
  // ================= MATCH START =================
  {
    speaker: 'bade',
    text: 'Are Badshah, ee poora plot apan ka hai! Aaj faisla ho hi jaaye!',
    event: 'match_start',
    priority: 8,
    followUp: {
      speaker: 'chhote',
      text: 'Are Bade, itna uchhal mat re! Ee toh trailer tha Badshah!',
      delayMs: 1900,
    },
  },
  {
    speaker: 'chhote',
    text: 'Tum bas mooch sambhalo Bade, property apan sambhalte hain!',
    event: 'match_start',
    priority: 8,
    followUp: {
      speaker: 'dadi',
      text: 'Are nalayako! Property baantni thi, tum dono ne dangal bana diya!',
      delayMs: 2000,
    },
  },
  {
    speaker: 'dadi',
    text: 'Badshah log, pehle pair sambhalo, phir zameen! Chalo shuru ho jao!',
    event: 'match_start',
    priority: 8,
    followUp: {
      speaker: 'sharma',
      text: 'Are Gupta Ji, aaj toh live property dispute chal raha hai!',
      delayMs: 1800,
    },
  },

  // ================= SMALL CAPTURE =================
  {
    speaker: 'bade',
    text: 'Ee boundary ke andar ab apan ka raj chalega!',
    event: 'small_capture',
    priority: 4,
  },
  {
    speaker: 'bade',
    text: 'Haan Badshah, ab dekh! Ek-ek eent pe apan ka naam likha hai!',
    event: 'small_capture',
    priority: 4,
  },
  {
    speaker: 'bade',
    text: 'Abhi batata hoon kiske naam registry hogi!',
    event: 'small_capture',
    priority: 4,
  },
  {
    speaker: 'chhote',
    text: 'Plot tumhara hoga, par dimaag toh apan ka hai!',
    event: 'small_capture',
    priority: 4,
  },
  {
    speaker: 'chhote',
    text: 'Bade bhai, thoda side ho jao, hawa aane do!',
    event: 'small_capture',
    priority: 4,
  },
  {
    speaker: 'chhote',
    text: 'Kya Badshah, registry kara li kya? Idhar toh apan ka kabza ho gaya!',
    event: 'small_capture',
    priority: 4,
  },
  {
    speaker: 'chhote',
    text: 'Haan re Badshah, dheere-dheere poora aangan apan kejeb mein aayega!',
    event: 'small_capture',
    priority: 4,
  },

  // ================= LARGE / MEGA CAPTURE =================
  {
    speaker: 'bade',
    text: 'Apan se property cheenega? Sapna dekh re! Poora kona kabza kar liye!',
    event: 'large_capture',
    priority: 9,
    followUp: {
      speaker: 'chhote',
      text: 'Kaa Badshah, itni zameen leke mall kholna hai kya?',
      delayMs: 1800,
    },
  },
  {
    speaker: 'bade',
    text: 'Dadi ko bol dena, bada beta jeet gaya! Gajab kabza kar diye Badshah!',
    event: 'large_capture',
    priority: 9,
    followUp: {
      speaker: 'gupta',
      text: 'Boundary idhar hui toh brokerage udhar lagegi!',
      delayMs: 1800,
    },
  },
  {
    speaker: 'chhote',
    text: 'Aaj Dadi bhi mere side hain, samjhe? Aadha aangan gayab kar diye!',
    event: 'large_capture',
    priority: 9,
    followUp: {
      speaker: 'bade',
      text: 'Chhote, zyada hoshiyaari mat dikha! Abhi hisaab barabar karta hoon!',
      delayMs: 1800,
    },
  },
  {
    speaker: 'chhote',
    text: 'Kaa Badshah, buddhi ghutne mein hai kya? Dekhte-dekhte plot nikal gaya!',
    event: 'large_capture',
    priority: 9,
    followUp: {
      speaker: 'sharma',
      text: 'Badshah, ek photo hamare WhatsApp group mein bhi bhejna!',
      delayMs: 1900,
    },
  },

  // ================= TRAIL EXPOSED RISK =================
  {
    speaker: 'bade',
    text: 'Kaiko beech mein aa rahe ho re? Hatt re udhar!',
    event: 'trail_exposed_risk',
    priority: 6,
  },
  {
    speaker: 'chhote',
    text: 'Are re re! Trail bachao apni! Bade peeche hi pada hai!',
    event: 'trail_exposed_risk',
    priority: 6,
  },
  {
    speaker: 'dadi',
    text: 'Are lappu! Lamba chakkar mat kaat, line kat jayegi re Badshah!',
    event: 'trail_exposed_risk',
    priority: 6,
  },
  {
    speaker: 'sharma',
    text: 'Are bhai sahab, itni lambi line kheench diye, ab bachega kaise re?',
    event: 'trail_exposed_risk',
    priority: 5,
  },

  // ================= TRAIL CUT / ELIMINATION KILL =================
  {
    speaker: 'bade',
    text: 'Are, line kaat diye iski! Haan Badshah, ab samajh mein aaya?',
    event: 'trail_cut_kill',
    priority: 10,
    followUp: {
      speaker: 'chhote',
      text: 'Abey dhokhe se line kaata re! Ruk abhi batata hoon!',
      delayMs: 1700,
    },
  },
  {
    speaker: 'bade',
    text: 'Chhote, zyada hoshiyaari mat dikha! Ek jhatke mein setting bigaad diye!',
    event: 'trail_cut_kill',
    priority: 10,
    followUp: {
      speaker: 'dadi',
      text: 'Tum dono se achha toh hamara purana scooter chalta hai!',
      delayMs: 1800,
    },
  },
  {
    speaker: 'chhote',
    text: 'Kaa Badshah, buddhi ghutne mein hai kya? Kat gayi na line!',
    event: 'trail_cut_kill',
    priority: 10,
    followUp: {
      speaker: 'bade',
      text: 'Kaiko uchhal raha hai re? Abhi wapas aake nipat lenge!',
      delayMs: 1700,
    },
  },
  {
    speaker: 'chhote',
    text: 'Gajab kar diye Badshah! Bade bhaiya ki toh poori mehnat jhand ho gayi!',
    event: 'trail_cut_kill',
    priority: 10,
    followUp: {
      speaker: 'mummy',
      text: 'Bas karo dono! Poora mohalla tamasha dekh raha hai!',
      delayMs: 1800,
    },
  },

  // ================= PLAYER ELIMINATED & RESPAWN =================
  {
    speaker: 'bade',
    text: 'Are bhai Badshah! Galti se pair phisal gaya, abhi wapas aata hoon!',
    event: 'player_eliminated',
    priority: 7,
  },
  {
    speaker: 'chhote',
    text: 'Kaiko tension le rahe ho Badshah? Chhote abhi zinda hai!',
    event: 'player_respawn',
    priority: 6,
  },
  {
    speaker: 'bade',
    text: 'Haan Badshah, wapas maidan mein aa gaye! Ab bacha apni zameen!',
    event: 'player_respawn',
    priority: 6,
  },

  // ================= LANDMARK & POWERUP =================
  {
    speaker: 'bade',
    text: 'Babuji ke scooter ki parking pe ab Bade ka kabza hai Badshah!',
    event: 'landmark_captured',
    priority: 8,
    followUp: {
      speaker: 'dadi',
      text: 'Kisiko bhi zameen mile, bijli ka bill dono bharoge!',
      delayMs: 1800,
    },
  },
  {
    speaker: 'chhote',
    text: 'Are Badshah, prime location pe apan ne jhanda gaad diya!',
    event: 'landmark_captured',
    priority: 8,
    followUp: {
      speaker: 'gupta',
      text: 'Plot ka rate badh gaya hai, pehle token amount jama karo!',
      delayMs: 1800,
    },
  },
  {
    speaker: 'bade',
    text: 'Adrak wali kadak chai mil gayi Badshah! Ab pakad ke dikha!',
    event: 'powerup_picked',
    priority: 7,
  },
  {
    speaker: 'chhote',
    text: 'Jugaad lag gaya Badshah! Ab toh rocket jaise bhaagenge!',
    event: 'powerup_picked',
    priority: 7,
  },

  // ================= LEAD OVERTAKEN & CLOSE MATCH =================
  {
    speaker: 'bade',
    text: 'Sahi khel rahe ho Badshah, par aage toh apan hi rahenge!',
    event: 'lead_overtaken',
    priority: 7,
  },
  {
    speaker: 'chhote',
    text: 'O Badshah! Scoreboard dekh udhar, Chhote aage nikal gaya re!',
    event: 'lead_overtaken',
    priority: 7,
  },
  {
    speaker: 'sharma',
    text: 'Ham toh bas chai peene aaye the, yahan toh Mahabharat ho gaya!',
    event: 'close_match_tension',
    priority: 7,
    followUp: {
      speaker: 'gupta',
      text: 'Aap dono lad lo, agreement ham taiyaar kar dete hain!',
      delayMs: 1800,
    },
  },
  {
    speaker: 'mummy',
    text: 'Badshah, ghar mein bhi itni energy laga liya karo!',
    event: 'close_match_tension',
    priority: 7,
  },
  {
    speaker: 'dadi',
    text: 'Are, Sharma Ji ke saamne izzat mat utarwao!',
    event: 'critical_territory_50pct',
    priority: 8,
  },

  // ================= COUNTDOWN 30s & 10s =================
  {
    speaker: 'mummy',
    text: 'Registry baad mein, pehle khana kha lo! Bas 30 second aur hain!',
    event: 'countdown_30s',
    priority: 9,
    followUp: {
      speaker: 'gupta',
      text: 'Badshah, jeeto ya haaro, registry mein hamara commission fix hai!',
      delayMs: 1900,
    },
  },
  {
    speaker: 'dadi',
    text: 'Are Badshah! Bas 10 second bache hain! Jaldi kabza karo re!',
    event: 'countdown_10s',
    priority: 10,
    followUp: {
      speaker: 'mummy',
      text: 'Ek aur awaaz aayi toh belan niklega!',
      delayMs: 1600,
    },
  },

  // ================= AMBIENT NPC COMMENTARY =================
  {
    speaker: 'dadi',
    text: 'Jo jeetega, usko bhi subah kachra bahar daalna padega!',
    event: 'npc_ambient',
    priority: 3,
  },
  {
    speaker: 'mummy',
    text: 'Jo haarega, bartan wahi dhoyega!',
    event: 'npc_ambient',
    priority: 3,
  },
  {
    speaker: 'sharma',
    text: 'Mohalle mein kal se isi ki charcha hone wali hai!',
    event: 'npc_ambient',
    priority: 3,
  },
  {
    speaker: 'gupta',
    text: 'Plot ka rate badh gaya hai, pehle token amount jama karo!',
    event: 'npc_ambient',
    priority: 3,
  },
];

export interface CinematicSceneSlide {
  id: number;
  tag: string;
  title: string;
  narrationLines: string[];
  dialogues: { speaker: CharacterSpeaker; line: string }[];
  cameraFocus: string;
}

export const CINEMATIC_SCENES: CinematicSceneSlide[] = [
  {
    id: 1,
    tag: 'SCENE 1 · PUSHTAINI BANGLA, INDORE-JABALPUR HIGHWAY',
    title: 'The Ancestral Property',
    narrationLines: [
      'Do bhai.',
      'Ek pushtaini property.',
      'Aur baantne ka naam? Bilkul nahi.',
    ],
    dialogues: [
      {
        speaker: 'sharma',
        line: 'Are Gupta Ji, dekho toh sahi... itna bada aangan, aam ka ped, purana scooter, aur dono bhaiyon mein roz ka bawaal!',
      },
    ],
    cameraFocus: 'courtyard_overview',
  },
  {
    id: 2,
    tag: 'SCENE 2 · AANGAN KA DANGAL',
    title: 'The Family Dispute',
    narrationLines: [
      'Bade ko lagta hai poora plot uske naam hai.',
      'Aur Chhote? Woh kisi ke baap ki sunne ko taiyaar nahi!',
    ],
    dialogues: [
      {
        speaker: 'bade',
        line: 'Are Badshah, ee poora plot apan ka hai! Chhote, zyada hoshiyaari mat dikha!',
      },
      {
        speaker: 'chhote',
        line: 'Are Bade, itna uchhal mat re! Tum bas mooch sambhalo, property apan sambhalte hain!',
      },
    ],
    cameraFocus: 'brothers_standoff',
  },
  {
    id: 3,
    tag: 'SCENE 3 · PARIVAAR AUR MOHALLA PANCHAYAT',
    title: 'Family Intervention',
    narrationLines: [
      'Vakil thak gaye. Rishtedaar bhaag gaye.',
      'Ab Dadi ki charpai, Mummy ka belan, Sharma Ji ki chai, aur Gupta Ji ki registry sab maidan mein!',
    ],
    dialogues: [
      {
        speaker: 'dadi',
        line: 'Are nalayako! Property baantni thi, tum dono ne dangal bana diya!',
      },
      {
        speaker: 'mummy',
        line: 'Bas karo dono! Poora mohalla tamasha dekh raha hai! Ek aur awaaz aayi toh belan niklega!',
      },
      {
        speaker: 'gupta',
        line: 'Badshah, jeeto ya haaro, registry mein hamara commission fix hai!',
      },
    ],
    cameraFocus: 'family_reactions',
  },
  {
    id: 4,
    tag: 'SCENE 4 · AAKHRI FAISLA',
    title: 'The Final Decision',
    narrationLines: [
      'Saalo ka family drama.',
      'Roz ke jhagde.',
      'Registry ka tension.',
      'Ab faisla hoga zameen par!',
    ],
    dialogues: [
      {
        speaker: 'dadi',
        line: 'Badshah log, pehle pair sambhalo, phir zameen! Jiska kabza bada, wahi asli malik!',
      },
    ],
    cameraFocus: 'boundary_zoom',
  },
  {
    id: 5,
    tag: 'THE GREAT PROPERTY WAR BEGINS',
    title: 'KABZA',
    narrationLines: [
      'Baap ki property hai Badshah, par kabza karke dikha!',
      'Choose your Badshah. Capture the zameen. Jeeto pushtaini property!',
    ],
    dialogues: [
      {
        speaker: 'bade',
        line: 'Are Badshah, zameen pe kabza karna hai… dialogue baad mein maarna!',
      },
    ],
    cameraFocus: 'title_reveal',
  },
];

export interface TutorialStepSpec {
  step: number;
  title: string;
  speaker: CharacterSpeaker;
  dialogue: string;
  instruction: string;
  goalHint: string;
}

export const TUTORIAL_STEPS: TutorialStepSpec[] = [
  {
    step: 1,
    title: '1. Pair Chalao Badshah (Movement)',
    speaker: 'dadi',
    dialogue: 'Are Badshah, pehle chalna seekh lo, phir zameen kabza karna!',
    instruction: 'Use WASD, Arrow Keys, or the Touch Joystick to move around your territory.',
    goalHint: 'Move 6 tiles in any direction.',
  },
  {
    step: 2,
    title: '2. Apni Safe Zameen (Safe Territory)',
    speaker: 'bade',
    dialogue: 'Ee apan ka pakka plot hai Badshah! Iske andar koi haath nahi laga sakta!',
    instruction: 'While inside your coloured territory, you are 100% safe from attacks.',
    goalHint: 'Patrol across your safe base tiles.',
  },
  {
    step: 3,
    title: '3. Boundary Paar Karo (Leaving Safe Territory)',
    speaker: 'chhote',
    dialogue: 'Ghar ke andar baithe rahoge toh kabza kaise hoga re? Bahar niklo Badshah!',
    instruction: 'Step outside your colored base onto the neutral sandstone courtyard.',
    goalHint: 'Step onto neutral courtyard tiles.',
  },
  {
    step: 4,
    title: '4. Kacchi Line Kheecho (Creating Exposed Trail)',
    speaker: 'dadi',
    dialogue: 'Dekho Badshah, bahar nikalte hi tumhari kacchi line ban rahi hai. Isko bacha ke rakhna!',
    instruction: 'Move across at least 6 neutral tiles to draw an exposed capture trail.',
    goalHint: 'Extend your exposed trail to 6+ tiles.',
  },
  {
    step: 5,
    title: '5. Ghera Band Karo (Closing the Loop)',
    speaker: 'bade',
    dialogue: 'Ab ghoom ke wapas apni zameen mein ghus jao Badshah, taaki ghera poora ho jaaye!',
    instruction: 'Turn and steer your brother back into your existing safe territory.',
    goalHint: 'Reconnect your trail with your owned territory.',
  },
  {
    step: 6,
    title: '6. Zameen Pe Kabza! (Capturing Land)',
    speaker: 'gupta',
    dialogue: 'Gajab kar diye Badshah! Ghere ke andar ki saari zameen ab aapke naam ho gayi!',
    instruction: 'Capture another loop to reach at least 8% total property ownership.',
    goalHint: 'Reach 8.0% total courtyard ownership.',
  },
  {
    step: 7,
    title: '7. Trail Ki Suraksha (Avoiding Trail Cuts)',
    speaker: 'mummy',
    dialogue: 'Zyada lamba chakkar mat kaato! Agar bhai ne tumhari kacchi line chhoo di toh out ho jaoge!',
    instruction: 'Remember: while your trail is exposed, any touch on your trail eliminates you for 2 seconds.',
    goalHint: 'Make a quick, safe capture and return home.',
  },
  {
    step: 8,
    title: '8. Dushman Ki Line Kaato (Attacking Rival Trails)',
    speaker: 'chhote',
    dialogue: 'Dekho udhar bhai apni line kheench raha hai! Uski kacchi line ke upar se nikal jao Badshah!',
    instruction: 'Run across the opponent’s exposed trail to slice it and eliminate them!',
    goalHint: 'Cut the rival brother’s exposed trail (or reach 14% territory).',
  },
  {
    step: 9,
    title: '9. Percentage Ka Hisaab (Territory Percentages)',
    speaker: 'sharma',
    dialogue: 'Upar meter dekho Badshah! Adrak wali chai peeke speed badhao aur percentage badhao!',
    instruction: 'Watch the top HUD tug-of-war bar or grab a courtyard power-up to expand faster.',
    goalHint: 'Expand your territory to 18.0%.',
  },
  {
    step: 10,
    title: '10. Asli Malik Bano! (Winning the Match)',
    speaker: 'dadi',
    dialogue: 'Shabash Badshah! Timer khatam hone par jiska kabza sabse bada, pushtaini bangla usika!',
    instruction: 'Reach 22% territory to graduate from Dadi’s Kabza Training!',
    goalHint: 'Reach 22.0% territory to complete the tutorial!',
  },
];

export function getPostMatchCourtScript(winner: BrotherId | 'draw', badePct: number, chhotePct: number) {
  if (winner === 'draw') {
    return [
      {
        speaker: 'dadi' as CharacterSpeaker,
        line: `Are gazab! Dono ka kabza bilkul barabar (${badePct.toFixed(1)}%) nikla! Dono hi aadhe-aadhe Badshah ho!`,
      },
      {
        speaker: 'gupta' as CharacterSpeaker,
        line: 'Badshah, barabar bantwara hua toh do-do registry banegi, double commission pakka!',
      },
      {
        speaker: 'sharma' as CharacterSpeaker,
        line: 'Mohalle ke WhatsApp group mein likh deta hoon: Match tie ho gaya, agla round abhi baaki hai!',
      },
      {
        speaker: 'mummy' as CharacterSpeaker,
        line: 'Registry baad mein! Pehle dono ghar ka samaan andar rakho aur bartan baant lo!',
      },
    ];
  }

  const winnerName = winner === 'bade' ? 'Bade Bhaiya' : 'Chhote Badshah';
  const loserSpeaker: CharacterSpeaker = winner === 'bade' ? 'chhote' : 'bade';

  return [
    {
      speaker: 'dadi' as CharacterSpeaker,
      line: `Faisla ho gaya! Aaj ka asli Badshah ${winnerName} hai! (${Math.max(badePct, chhotePct).toFixed(1)}% zameen pe kabza!)`,
    },
    {
      speaker: winner as CharacterSpeaker,
      line:
        winner === 'bade'
          ? 'Dadi ko bol diye the na, bada beta jeet gaya! Haan Badshah, ab samajh mein aaya?'
          : 'Plot tumhara hoga Bade, par dimaag toh apan ka hai! Aaj Dadi bhi mere side hain!',
    },
    {
      speaker: 'gupta' as CharacterSpeaker,
      line: 'Bahut badhiya! Ab registry ki baat kar lein? Token amount aur 2% brokerage nikaalo Badshah!',
    },
    {
      speaker: 'sharma' as CharacterSpeaker,
      line: 'Mohalle mein kal se isi ki charcha hone wali hai! Photo kheench li hai maine!',
    },
    {
      speaker: 'mummy' as CharacterSpeaker,
      line: 'Registry baad mein! Pehle dono ghar ka samaan andar rakho! Jo haara hai woh aaj bartan dhoyega!',
    },
    {
      speaker: loserSpeaker,
      line:
        loserSpeaker === 'bade'
          ? 'Are Badshah, dhokhe se jeeta hai Chhote! Ek rematch laga, abhi hisaab barabar karta hoon!'
          : 'Ee toh trailer tha Badshah! Ek aur match lagao, abhi asli picture dikhata hoon!',
    },
  ];
}
