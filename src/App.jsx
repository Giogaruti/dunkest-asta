import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Users, Play, Pause, RotateCcw, Clock, 
  Search, ShieldAlert, Award, AlertCircle, 
  Volume2, VolumeX, QrCode, Download, Settings, 
  LogOut, UserCheck, Flame, FastForward, Info, BarChart3
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot
} from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyC1jop2ZlePaMqL-6Ng5ZDpQNyxVtDMS5A",
  authDomain: "dunkest-asta.firebaseapp.com",
  projectId: "dunkest-asta",
  storageBucket: "dunkest-asta.firebasestorage.app",
  messagingSenderId: "432619397838",
  appId: "1:432619397838:web:5d4d0ed6769768fdc3669f",
  measurementId: "G-SQE5SHTJ3B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'dunkest-auction-pro';
const analytics = getAnalytics(app);

// ---------------------------------------------------------
// 1. INCOLLA QUI L'INTERO ARRAY JSON DI DUNKEST
// ---------------------------------------------------------
const RAW_DUNKEST_DATA = 
  [
  {
    "First Name": "Nikola",
    "Last Name": "Jokic",
    "Position": "Center",
    "Team": "Denver Nuggets",
    "Cr 26/27": "30,0",
    "Cr": ""
  }
];

// ---------------------------------------------------------
// 2. CONVERSIONE AUTOMATICA PER L'APP
// ---------------------------------------------------------
const NBA_PLAYERS_DB = RAW_DUNKEST_DATA
  .filter(p => p.Position && p.Position !== "Head Coach") // Rimuove gli allenatori
  .map((p, index) => {
    // Conversione del Ruolo
    let role = 'G';
    if (p.Position === 'Forward') role = 'F';
    if (p.Position === 'Center') role = 'C';

    // Parsing del Prezzo (da "30,0" a 30.0)
    const priceStr = p["Cr 26/27"] || "1,0";
    const price = parseFloat(priceStr.replace(',', '.'));

    return {
      id: `p_${index}`,
      name: `${p["First Name"]} ${p["Last Name"]}`.trim(),
      team: p["Team"],
      role: role,
      basePrice: price,
      tier: p.Position // Usa la posizione intera come etichetta
    };
  });


const playBuzzerSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio might be blocked before first user gesture
  }
};

const playBidSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch (e) {}
};

// Dunkest default standard squad: 2 Guards, 2 Forwards, 1 Center + 5 Bench (2G, 2F, 1C) = 10 players
const TOTAL_ROSTER_SIZE = 10;
const ROSTER_SLOT_SCHEMA = {
  G: { starters: 2, bench: 2, total: 4 },
  F: { starters: 2, bench: 2, total: 4 },
  C: { starters: 1, bench: 1, total: 2 }
};

const PHASES = [
  { id: 'guardie_starters', name: '1. Guardie (Titolari)', allowedRoles: ['G'], isBench: false },
  { id: 'ali_starters', name: '2. Ali (Titolari)', allowedRoles: ['F'], isBench: false },
  { id: 'centri_starters', name: '3. Centri (Titolari)', allowedRoles: ['C'], isBench: false },
  { id: 'riserve_libere', name: '4. Riserve (Chiamata Libera G/F/C)', allowedRoles: ['G', 'F', 'C'], isBench: true }
];

export default function App() {
  // Auth & Session
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get('room') || 'DUNKEST25').toUpperCase();
    } catch {
      return 'DUNKEST25';
    }
  });
  const [teamName, setTeamName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active View Tab
  const [activeTab, setActiveTab] = useState('auction'); // 'auction', 'rosters', 'stats', 'admin'
  const [showQRModal, setShowQRModal] = useState(false);

  // Auction State (Synced in Room)
  const [roomData, setRoomData] = useState({
    code: 'DUNKEST25',
    phase: 'guardie_starters',
    initialBudget: 200,
    timerSeconds: 20,
    isTimerPaused: false,
    activeCallerIndex: 0,
    turnDirection: 'clockwise', // 'clockwise' or 'counter-clockwise'
    currentAuction: null, // { player, currentBid, highBidderId, highBidderName, endsAt, bidHistory: [] }
    participants: [], // array of { id, name, teamName, credits, roster: [], isAdmin }
    boughtPlayers: [] // array of player ids already taken
  });

  // Local Timer countdown representation
  const [timeLeft, setTimeLeft] = useState(20);
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [openingBid, setOpeningBid] = useState(1);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!auth) {
      const mockUid = 'local-user-' + Math.random().toString(36).substr(2, 6);
      setUser({ uid: mockUid, isAnonymous: true });
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth initialization error, signing in anonymously:", err);
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn("Local fallback offline mode active.");
          setUser({ uid: 'guest-' + Date.now(), isAnonymous: true });
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      if (usr) setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !hasJoined) return;

    const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
    const unsubscribe = onSnapshot(roomDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
      }
    }, (error) => {
      console.warn("Firestore snapshot error (Falling back to local in-memory room):", error);
    });

    return () => unsubscribe();
  }, [hasJoined, roomCode]);

  useEffect(() => {
    if (!roomData.currentAuction || roomData.isTimerPaused) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((roomData.currentAuction.endsAt - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        clearInterval(interval);
        handleAuctionExpired();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [roomData.currentAuction, roomData.isTimerPaused]);

  const handleAuctionExpired = async () => {
    if (!roomData.currentAuction) return;

    if (soundEnabled) playBuzzerSound();

    const winnerId = roomData.currentAuction.highBidderId;
    const finalPrice = roomData.currentAuction.currentBid;
    const player = roomData.currentAuction.player;

    const updatedParticipants = roomData.participants.map(p => {
      if (p.id === winnerId) {
        return {
          ...p,
          credits: p.credits - finalPrice,
          roster: [...p.roster, { ...player, acquiredPrice: finalPrice }]
        };
      }
      return p;
    });

    const nextCallerIndex = getNextCallerIndex(roomData.activeCallerIndex, updatedParticipants);

    const nextState = {
      ...roomData,
      participants: updatedParticipants,
      boughtPlayers: [...(roomData.boughtPlayers || []), player.id],
      currentAuction: null,
      activeCallerIndex: nextCallerIndex
    };

    triggerStateUpdate(nextState);
    showNotice(`🔥 ASSEGNATO! ${player.name} a ${roomData.currentAuction.highBidderName} per ${finalPrice} crediti!`);
  };

  const getNextCallerIndex = (currentIndex, participantsList) => {
    if (!participantsList || participantsList.length === 0) return 0;
    const step = roomData.turnDirection === 'counter-clockwise' ? -1 : 1;
    let nextIdx = (currentIndex + step + participantsList.length) % participantsList.length;

    let attempts = 0;
    while (attempts < participantsList.length) {
      const candidate = participantsList[nextIdx];
      if (canParticipantBid(candidate, roomData.phase)) {
        return nextIdx;
      }
      nextIdx = (nextIdx + step + participantsList.length) % participantsList.length;
      attempts++;
    }
    return currentIndex;
  };

  const triggerStateUpdate = async (newState) => {
    setRoomData(newState);

    if (db) {
      try {
        const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
        await setDoc(roomDocRef, newState, { merge: true });
      } catch (err) {
        console.error("Firestore update failed:", err);
      }
    }
  };

  const canParticipantBid = (participant, currentPhaseId) => {
    if (!participant) return false;
    const currentPhase = PHASES.find(p => p.id === currentPhaseId) || PHASES[0];

    const guards = participant.roster.filter(p => p.role === 'G').length;
    const forwards = participant.roster.filter(p => p.role === 'F').length;
    const centers = participant.roster.filter(p => p.role === 'C').length;

    if (currentPhase.id === 'guardie_starters') return guards < 2;
    if (currentPhase.id === 'ali_starters') return forwards < 2;
    if (currentPhase.id === 'centri_starters') return centers < 1;
    if (currentPhase.id === 'riserve_libere') {
      return participant.roster.length < TOTAL_ROSTER_SIZE;
    }
    return true;
  };

  const hasSpecificSlotForPlayer = (participant, playerRole) => {
    if (!participant) return false;
    const count = participant.roster.filter(p => p.role === playerRole).length;
    const max = ROSTER_SLOT_SCHEMA[playerRole].total;
    return count < max;
  };

  const getRemainingRequiredSlots = (participant) => {
    return Math.max(0, TOTAL_ROSTER_SIZE - participant.roster.length);
  };

  const getMaxBidAllowed = (participant) => {
    const slotsNeeded = getRemainingRequiredSlots(participant);
    const futureSlots = Math.max(0, slotsNeeded - 1);
    return Math.max(0, participant.credits - futureSlots);
  };

  const handleJoinOrCreate = (asAdmin = false) => {
    if (!teamName.trim() || !managerName.trim()) {
      showNotice("Inserisci sia il tuo nome che il nome della tua franchigia Dunkest!");
      return;
    }

    const currentUserId = user?.uid || `usr_${Date.now()}`;
    const newParticipant = {
      id: currentUserId,
      name: managerName.trim(),
      teamName: teamName.trim(),
      credits: roomData.initialBudget || 200,
      roster: [],
      isAdmin: asAdmin
    };

    const existingIndex = roomData.participants.findIndex(p => p.id === currentUserId);
    let updatedParticipants = [...roomData.participants];

    if (existingIndex >= 0) {
      updatedParticipants[existingIndex] = { ...updatedParticipants[existingIndex], ...newParticipant };
    } else {
      updatedParticipants.push(newParticipant);
    }

    const updatedState = {
      ...roomData,
      code: roomCode.toUpperCase(),
      participants: updatedParticipants
    };

    setIsAdmin(asAdmin);
    setHasJoined(true);
    triggerStateUpdate(updatedState);
    showNotice(`Benvenuto all'asta Dunkest, ${newParticipant.teamName}!`);
  };

  const handleStartNomination = () => {
    if (!selectedNominee) {
      showNotice("Seleziona prima un giocatore dal database!");
      return;
    }

    const currentParticipant = roomData.participants.find(p => p.id === user?.uid);
    if (!currentParticipant) return;

    const maxBid = getMaxBidAllowed(currentParticipant);
    const startPrice = Math.max(1, parseInt(openingBid) || 1);

    if (startPrice > maxBid) {
      showNotice(`Crediti insufficienti! La tua offerta massima consentita è ${maxBid} per poter completare il roster.`);
      return;
    }

    const timerDuration = roomData.timerSeconds || 20;
    const newAuction = {
      player: selectedNominee,
      currentBid: startPrice,
      highBidderId: currentParticipant.id,
      highBidderName: currentParticipant.teamName,
      endsAt: Date.now() + (timerDuration * 1000),
      bidHistory: [
        {
          bidderId: currentParticipant.id,
          bidderName: currentParticipant.teamName,
          amount: startPrice,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]
    };

    const nextState = {
      ...roomData,
      currentAuction: newAuction,
      isTimerPaused: false
    };

    setSelectedNominee(null);
    setOpeningBid(1);
    if (soundEnabled) playBidSound();
    triggerStateUpdate(nextState);
    showNotice(`Asta aperta per ${selectedNominee.name} a base ${startPrice} cr!`);
  };

  const handlePlaceBid = async (deltaOrAmount, isAbsolute = false) => {
    const currentParticipant = roomData.participants.find(p => p.id === user?.uid);
    if (!currentParticipant || !roomData.currentAuction) return;

    if (!hasSpecificSlotForPlayer(currentParticipant, roomData.currentAuction.player.role)) {
      showNotice(`Hai già completato tutti gli slot disponibili per il ruolo ${roomData.currentAuction.player.role}!`);
      return;
    }

    const currentHighBid = roomData.currentAuction.currentBid;
    const targetBid = isAbsolute ? parseInt(deltaOrAmount) : currentHighBid + deltaOrAmount;

    if (isNaN(targetBid) || targetBid <= currentHighBid) {
      showNotice(`L'offerta deve essere superiore all'offerta attuale (${currentHighBid} cr)!`);
      return;
    }

    const maxAllowed = getMaxBidAllowed(currentParticipant);
    if (targetBid > maxAllowed) {
      showNotice(`Non puoi offrire ${targetBid}! Limite massimo con riserva crediti: ${maxAllowed} cr.`);
      return;
    }

    const timerDuration = roomData.timerSeconds || 20;
    const newHistoryEntry = {
      bidderId: currentParticipant.id,
      bidderName: currentParticipant.teamName,
      amount: targetBid,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    const updatedAuction = {
      ...roomData.currentAuction,
      currentBid: targetBid,
      highBidderId: currentParticipant.id,
      highBidderName: currentParticipant.teamName,
      endsAt: Date.now() + (timerDuration * 1000), 
      bidHistory: [newHistoryEntry, ...(roomData.currentAuction.bidHistory || [])]
    };

    const nextState = {
      ...roomData,
      currentAuction: updatedAuction,
      isTimerPaused: false
    };

    if (soundEnabled) playBidSound();
    setCustomBidAmount('');
    triggerStateUpdate(nextState);
  };

  const toggleTimerPause = () => {
    if (!isAdmin) return;
    const nextPaused = !roomData.isTimerPaused;
    let nextEndsAt = roomData.currentAuction?.endsAt;

    if (!nextPaused) {
      nextEndsAt = Date.now() + (timeLeft * 1000);
    }

    const nextState = {
      ...roomData,
      isTimerPaused: nextPaused,
      currentAuction: roomData.currentAuction ? {
        ...roomData.currentAuction,
        endsAt: nextEndsAt
      } : null
    };
    triggerStateUpdate(nextState);
  };

  const resetTimerSeconds = (secs = 20) => {
    if (!isAdmin || !roomData.currentAuction) return;
    const nextState = {
      ...roomData,
      currentAuction: {
        ...roomData.currentAuction,
        endsAt: Date.now() + (secs * 1000)
      }
    };
    triggerStateUpdate(nextState);
  };

  const undoLastBid = () => {
    if (!isAdmin || !roomData.currentAuction || !roomData.currentAuction.bidHistory?.length) return;
    const history = [...roomData.currentAuction.bidHistory];
    if (history.length <= 1) {
      showNotice("Impossibile annullare l'offerta di apertura! Puoi solo annullare l'asta corrente.");
      return;
    }
    history.shift(); 
    const prev = history[0];

    const nextState = {
      ...roomData,
      currentAuction: {
        ...roomData.currentAuction,
        currentBid: prev.amount,
        highBidderId: prev.bidderId,
        highBidderName: prev.bidderName,
        endsAt: Date.now() + (roomData.timerSeconds * 1000),
        bidHistory: history
      }
    };
    triggerStateUpdate(nextState);
    showNotice(`Ultimo rilancio annullato. Offerta ripristinata a ${prev.amount} cr di ${prev.bidderName}`);
  };

  const forceCancelAuction = () => {
    if (!isAdmin) return;
    const nextState = {
      ...roomData,
      currentAuction: null
    };
    triggerStateUpdate(nextState);
    showNotice("Asta annullata dall'amministratore.");
  };

  const setAuctionPhase = (phaseId) => {
    if (!isAdmin) return;
    const nextState = {
      ...roomData,
      phase: phaseId
    };
    triggerStateUpdate(nextState);
    showNotice(`Fase d'asta cambiata in: ${PHASES.find(p => p.id === phaseId)?.name}`);
  };

  const forcePassTurn = () => {
    if (!isAdmin) return;
    const nextIdx = getNextCallerIndex(roomData.activeCallerIndex, roomData.participants);
    const nextState = {
      ...roomData,
      activeCallerIndex: nextIdx
    };
    triggerStateUpdate(nextState);
    showNotice(`Turno passato manualmente a ${roomData.participants[nextIdx]?.teamName || 'Prossimo manager'}`);
  };

  const toggleTurnDirection = () => {
    if (!isAdmin) return;
    const nextDir = roomData.turnDirection === 'clockwise' ? 'counter-clockwise' : 'clockwise';
    triggerStateUpdate({ ...roomData, turnDirection: nextDir });
  };

  const injectMockParticipants = () => {
    const bots = [
      { id: 'bot_1', name: 'Marco (Lakers)', team: 'Showtime Lakers', credits: 200, roster: [], isAdmin: false },
      { id: 'bot_2', name: 'Luca (Celtics)', team: 'Boston Pride', credits: 200, roster: [], isAdmin: false },
      { id: 'bot_3', name: 'Davide (Warriors)', team: 'Splash Town', credits: 200, roster: [], isAdmin: false }
    ];

    const currentList = [...roomData.participants];
    bots.forEach(b => {
      if (!currentList.some(p => p.id === b.id)) {
        currentList.push(b);
      }
    });

    triggerStateUpdate({ ...roomData, participants: currentList });
    showNotice("Aggiunti 3 manager virtuali per testare i turni e i rilanci!");
  };

  const simulateBotBid = () => {
    if (!roomData.currentAuction) {
      showNotice("Nessuna asta in corso per simulare un rilancio!");
      return;
    }
    const bots = roomData.participants.filter(p => p.id.startsWith('bot_') && p.id !== roomData.currentAuction.highBidderId);
    if (!bots.length) {
      showNotice("Nessun bot disponibile per rilanciare.");
      return;
    }
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const newBid = roomData.currentAuction.currentBid + Math.floor(Math.random() * 3) + 1;

    const timerDuration = roomData.timerSeconds || 20;
    const updatedAuction = {
      ...roomData.currentAuction,
      currentBid: newBid,
      highBidderId: bot.id,
      highBidderName: bot.teamName,
      endsAt: Date.now() + (timerDuration * 1000),
      bidHistory: [
        {
          bidderId: bot.id,
          bidderName: bot.teamName,
          amount: newBid,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
        ...(roomData.currentAuction.bidHistory || [])
      ]
    };

    if (soundEnabled) playBidSound();
    triggerStateUpdate({ ...roomData, currentAuction: updatedAuction, isTimerPaused: false });
  };

  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(prev => prev === msg ? null : prev);
    }, 4000);
  };

  // Funzione per uscire dalla stanza in sicurezza
  const handleLeaveRoom = () => {
    setHasJoined(false);
  };

  const currentParticipant = roomData.participants.find(p => p.id === user?.uid);
  const activeCaller = roomData.participants[roomData.activeCallerIndex] || roomData.participants[0];
  const isMyCallingTurn = currentParticipant && activeCaller && currentParticipant.id === activeCaller.id;
  const currentPhaseConfig = PHASES.find(p => p.id === roomData.phase) || PHASES[0];

  const availablePlayers = useMemo(() => {
    const boughtSet = new Set(roomData.boughtPlayers || []);
    return NBA_PLAYERS_DB.filter(p => {
      if (boughtSet.has(p.id)) return false;
      if (!currentPhaseConfig.allowedRoles.includes(p.role)) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(query) || p.team.toLowerCase().includes(query) || p.role.toLowerCase().includes(query);
      }
      return true;
    });
  }, [roomData.boughtPlayers, currentPhaseConfig, searchTerm]);

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="absolute inset-0 bg-radial from-amber-600/10 via-purple-900/10 to-transparent pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">Dunkest Auction</h1>
              <p className="text-xs text-amber-400 font-semibold tracking-widest uppercase">Live Fantasy NBA Draft</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Codice Stanza Asta</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="es. DUNKEST25"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-mono font-bold tracking-widest focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Nome Manager</label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="es. Gianluca"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">Nome Squadra Dunkest</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="es. Boston Clowns o Chicago Bulls"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="pt-2 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleJoinOrCreate(false)}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center space-x-2 border border-slate-700 transition shadow-md"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Entra come Manager</span>
              </button>

              <button
                onClick={() => handleJoinOrCreate(true)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-slate-950 font-black rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/25 transition"
              >
                <ShieldAlert className="w-4 h-4 text-slate-950" />
                <span>Host / Admin</span>
              </button>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <div className="flex items-center text-amber-400 font-semibold mb-1">
                <Info className="w-3.5 h-3.5 mr-1" />
                <span>Regole Squadra Dunkest:</span>
              </div>
              <p>• 10 giocatori totali (4 Guardie, 4 Ali, 2 Centri: 5 titolari + 5 riserve).</p>
              <p>• Offerte sincronizzate in tempo reale con timer 20s e riserva crediti automatica.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Bar */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 animate-bounce">
          <Flame className="w-5 h-5 text-slate-950" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Trophy className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg text-white tracking-wide">DUNKEST AUCTION</span>
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-mono font-semibold border border-amber-500/30">
                STANZA: {roomData.code}
              </span>
              {isAdmin && (
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-red-500/30">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <span>Franchigia: <strong className="text-slate-200">{currentParticipant?.teamName}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{currentParticipant?.credits} Crediti</span>
              <span>•</span>
              <span>Slot: {currentParticipant?.roster.length || 0}/10</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('auction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'auction' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Asta Live</span>
          </button>
          <button
            onClick={() => setActiveTab('rosters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'rosters' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tutte le Rose ({roomData.participants.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'stats' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Statistiche</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeTab === 'admin' ? 'bg-red-500 text-white shadow' : 'text-red-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pannello Host</span>
            </button>
          )}
        </div>

        {/* Header Tools */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={soundEnabled ? "Disattiva suoni" : "Attiva suoni"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={() => setShowQRModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 flex items-center space-x-1.5 transition border border-slate-700"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Invita con QR</span>
          </button>

          {/* PULSANTE LOGOUT */}
          <button
            onClick={handleLeaveRoom}
            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-400 transition-colors flex items-center justify-center"
            title="Esci dalla Stanza"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <span className="text-slate-400 uppercase tracking-wider font-semibold">Fase Attuale:</span>
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full font-bold">
            {currentPhaseConfig.name}
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">Rotazione:</span>
          <span className="text-slate-200 font-medium capitalize hidden sm:inline">
            {roomData.turnDirection === 'clockwise' ? 'Orario ↻' : 'Antiorario ↺'}
          </span>
        </div>

        {/* Caller Turn Indicator */}
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <span className="text-slate-400">Tocca chiamare a:</span>
          <div className={`px-3 py-1 rounded-full font-bold flex items-center space-x-1.5 ${
            isMyCallingTurn 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' 
              : 'bg-slate-800 text-slate-200'
          }`}>
            <UserCheck className="w-3.5 h-3.5" />
            <span>{activeCaller?.teamName || 'In attesa'}</span>
            {isMyCallingTurn && <span className="text-[10px] uppercase font-black tracking-wider ml-1 bg-emerald-500 text-slate-950 px-1.5 rounded">Tocca a te!</span>}
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 max-w-7xl w-full mx-auto">
        {activeTab === 'auction' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Live Bidding Arena */}
            <div className="lg:col-span-8 space-y-6">
              {/* CURRENT PLAYER IN AUCTION BOX */}
              {roomData.currentAuction ? (
                <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                  {/* Timer Bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-slate-800">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        timeLeft <= 5 ? 'bg-red-500 animate-pulse' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (timeLeft / (roomData.timerSeconds || 20)) * 100)}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider ${
                          roomData.currentAuction.player.role === 'G' ? 'bg-blue-500 text-slate-950' :
                          roomData.currentAuction.player.role === 'F' ? 'bg-emerald-500 text-slate-950' : 'bg-purple-500 text-white'
                        }`}>
                          {roomData.currentAuction.player.role === 'G' ? 'Guardia (G)' :
                           roomData.currentAuction.player.role === 'F' ? 'Ala (F)' : 'Centro (C)'}
                        </span>
                        <span className="text-slate-400 font-mono text-xs">{roomData.currentAuction.player.team}</span>
                        <span className="text-amber-400 text-xs font-semibold">Quotaz. Dunkest: {roomData.currentAuction.player.basePrice} cr</span>
                      </div>
                      <h2 className="text-3xl sm:text-4xl font-black text-white mt-1">
                        {roomData.currentAuction.player.name}
                      </h2>
                    </div>

                    {/* Live Digital Countdown Clock */}
                    <div className={`flex flex-col items-center px-4 py-2 rounded-2xl border ${
                      roomData.isTimerPaused 
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-400' 
                        : timeLeft <= 5 
                        ? 'bg-red-950/60 border-red-500 text-red-400 animate-bounce' 
                        : 'bg-slate-950 border-slate-800 text-white'
                    }`}>
                      <div className="flex items-center space-x-1.5 font-mono text-3xl font-black">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span>{timeLeft}s</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        {roomData.isTimerPaused ? 'TIMER SOSPESO' : 'SCADENZA ASTA'}
                      </span>
                    </div>
                  </div>

                  {/* High Bid Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Miglior Offerta Attuale</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-5xl font-black text-amber-400">
                          {roomData.currentAuction.currentBid}
                        </span>
                        <span className="text-lg font-bold text-slate-400">Crediti</span>
                      </div>
                    </div>

                    <div className="text-center sm:text-right">
                      <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">In Vantaggio</p>
                      <p className="text-xl font-bold text-emerald-400 flex items-center justify-center sm:justify-end space-x-2">
                        <span>{roomData.currentAuction.highBidderName}</span>
                        {roomData.currentAuction.highBidderId === currentParticipant?.id && (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40">
                            SEI TU!
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* BIDDING CONTROLS */}
                  {(() => {
                    const hasSlot = hasSpecificSlotForPlayer(currentParticipant, roomData.currentAuction.player.role);
                    const maxAllowed = currentParticipant ? getMaxBidAllowed(currentParticipant) : 0;
                    const canBid = hasSlot && maxAllowed > roomData.currentAuction.currentBid;

                    return (
                      <div className="space-y-4">
                        {!hasSlot ? (
                          <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-2xl flex items-center space-x-3 text-red-300 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                            <span>
                              <strong>Sei spettatore per questo giocatore:</strong> Hai già riempito tutti gli slot per il ruolo {roomData.currentAuction.player.role}.
                            </span>
                          </div>
                        ) : maxAllowed <= roomData.currentAuction.currentBid ? (
                          <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-2xl flex items-center space-x-3 text-amber-300 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
                            <span>
                              <strong>Budget insufficiente:</strong> La tua spesa massima consentita è {maxAllowed} cr per mantenere almeno 1 credito per i restanti slot da riempire.
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                              <span>Offerte Rapide in Sincro:</span>
                              <span>Tuo tetto massimo: <strong className="text-amber-400">{maxAllowed} cr</strong></span>
                            </div>

                            {/* Quick Bid Increment Buttons */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                              <button
                                onClick={() => handlePlaceBid(1)}
                                className="py-3 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-base shadow-lg shadow-amber-500/20 active:scale-95 transition"
                              >
                                +1 ({roomData.currentAuction.currentBid + 1})
                              </button>
                              <button
                                onClick={() => handlePlaceBid(2)}
                                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-base border border-slate-700 active:scale-95 transition"
                              >
                                +2 ({roomData.currentAuction.currentBid + 2})
                              </button>
                              <button
                                onClick={() => handlePlaceBid(5)}
                                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-base border border-slate-700 active:scale-95 transition"
                              >
                                +5 ({roomData.currentAuction.currentBid + 5})
                              </button>
                              <button
                                onClick={() => handlePlaceBid(10)}
                                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-base border border-slate-700 active:scale-95 transition"
                              >
                                +10 ({roomData.currentAuction.currentBid + 10})
                              </button>
                            </div>

                            {/* Manual Custom Amount Bid Input */}
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={roomData.currentAuction.currentBid + 1}
                                max={maxAllowed}
                                value={customBidAmount}
                                onChange={(e) => setCustomBidAmount(e.target.value)}
                                placeholder={`Inserisci rilancio a mano (es. ${roomData.currentAuction.currentBid + 3})...`}
                                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500"
                              />
                              <button
                                onClick={() => {
                                  if (customBidAmount) {
                                    handlePlaceBid(parseInt(customBidAmount), true);
                                  }
                                }}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                              >
                                Conferma Rilancio
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Admin Action Shortcuts */}
                        {isAdmin && (
                          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-slate-400 font-semibold">Azioni Rapide Admin:</span>
                            <button
                              onClick={toggleTimerPause}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-lg border border-slate-700 flex items-center space-x-1"
                            >
                              {roomData.isTimerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                              <span>{roomData.isTimerPaused ? 'Riprendi Tempo' : 'Pausa Tempo'}</span>
                            </button>
                            <button
                              onClick={() => resetTimerSeconds(20)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 flex items-center space-x-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reset 20s</span>
                            </button>
                            <button
                              onClick={undoLastBid}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold rounded-lg border border-slate-700"
                            >
                              Annulla Ultimo Rilancio
                            </button>
                            <button
                              onClick={forceCancelAuction}
                              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 font-bold rounded-lg border border-red-800"
                            >
                              Annulla Asta
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* NO ACTIVE AUCTION -> NOMINATION CONTROLS */
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <h2 className="text-2xl font-black text-white">Chiamata Giocatore</h2>
                      <p className="text-sm text-slate-400">
                        {isMyCallingTurn 
                          ? "🎯 È IL TUO TURNO! Seleziona un giocatore e apri l'asta con un'offerta di base." 
                          : `Turno di ${activeCaller?.teamName || 'un altro manager'}. Puoi comunque esplorare il database.`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-semibold">Filtro Fase:</span>
                      <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full font-bold">
                        {currentPhaseConfig.allowedRoles.join(' / ')}
                      </span>
                    </div>
                  </div>

                  {/* Player Search Bar */}
                  <div className="my-4">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cerca stella NBA per nome, squadra (es. Jokic, Doncic, Celtics)..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Search Results Player List */}
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {availablePlayers.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        Nessun giocatore trovato o tutti i giocatori per questo ruolo sono già stati acquistati.
                      </div>
                    ) : (
                      availablePlayers.map((player) => {
                        const isSelected = selectedNominee?.id === player.id;
                        return (
                          <div
                            key={player.id}
                            onClick={() => setSelectedNominee(player)}
                            className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                                : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                                player.role === 'G' ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' :
                                player.role === 'F' ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40' :
                                'bg-purple-600/30 text-purple-400 border border-purple-500/40'
                              }`}>
                                {player.role}
                              </span>
                              <div>
                                <p className="font-bold text-sm text-white">{player.name}</p>
                                <p className="text-xs text-slate-400">{player.team} • {player.tier}</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block">Dunkest Cr</span>
                                <span className="text-sm font-bold text-amber-400">{player.basePrice}</span>
                              </div>
                              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                                isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'
                              }`}>
                                {isSelected ? '✓' : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Nomination Action Panel */}
                  {selectedNominee && (
                    <div className="mt-6 pt-4 border-t border-slate-800 bg-slate-950/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-amber-400 font-semibold uppercase">Giocatore Selezionato:</span>
                        <h4 className="text-lg font-black text-white">{selectedNominee.name} ({selectedNominee.role} - {selectedNominee.team})</h4>
                      </div>

                      <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-slate-400 font-semibold">Base d'asta:</label>
                          <input
                            type="number"
                            min="1"
                            value={openingBid}
                            onChange={(e) => setOpeningBid(e.target.value)}
                            className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-bold text-amber-400 text-center focus:outline-none"
                          />
                        </div>

                        <button
                          onClick={handleStartNomination}
                          disabled={!isMyCallingTurn && !isAdmin}
                          className={`flex-1 sm:flex-initial py-3 px-6 rounded-xl font-black text-sm flex items-center justify-center space-x-2 transition ${
                            isMyCallingTurn || isAdmin
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-orange-500/25 active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Chiama per Asta</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Testing / Bot Simulation Buttons */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>Modalità Sandbox per testare senza altri dispositivi:</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={injectMockParticipants}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold border border-slate-700"
                      >
                        + Aggiungi 3 Manager Bot
                      </button>
                      {isAdmin && (
                        <button
                          onClick={forcePassTurn}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-semibold border border-slate-700"
                        >
                          Passa Turno
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE BID HISTORY STREAM */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-white flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>Cronologia Rilanci in Tempo Reale</span>
                  </h3>
                  {roomData.currentAuction && (
                    <button
                      onClick={simulateBotBid}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1 rounded-lg border border-slate-700"
                    >
                      🤖 Simula Rilancio Bot
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {roomData.currentAuction?.bidHistory?.length > 0 ? (
                    roomData.currentAuction.bidHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl flex items-center justify-between text-xs transition ${
                          idx === 0
                            ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold'
                            : 'bg-slate-950/40 border border-slate-800/50 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-500">{item.time}</span>
                          <span className="text-white font-semibold">{item.bidderName}</span>
                          {idx === 0 && <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black">LEADER</span>}
                        </div>
                        <span className="font-mono text-base font-black text-amber-400">{item.amount} cr</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs text-center py-4">In attesa del prossimo giocatore e dei rilanci...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: User's Dunkest Roster & Quick Standings */}
            <div className="lg:col-span-4 space-y-6">
              {/* CURRENT USER SQUAD SUMMARY */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-lg text-white">La Tua Franchigia</h3>
                    <p className="text-xs text-amber-400 font-medium">{currentParticipant?.teamName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Crediti Residui</span>
                    <span className="text-2xl font-black text-emerald-400">{currentParticipant?.credits || 0}</span>
                  </div>
                </div>

                {/* Slots Breakdown Table */}
                <div className="mt-4 space-y-2">
                  {/* Guardie */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-blue-400">Guardie (G)</span>
                      <span className="text-slate-400">
                        {currentParticipant?.roster.filter(p => p.role === 'G').length || 0} / 4
                      </span>
                    </div>
                    <div className="space-y-1">
                      {currentParticipant?.roster.filter(p => p.role === 'G').map((p, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-300">
                          <span>{p.name} ({p.team})</span>
                          <span className="text-amber-400 font-mono font-semibold">{p.acquiredPrice} cr</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ali */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-emerald-400">Ali (F)</span>
                      <span className="text-slate-400">
                        {currentParticipant?.roster.filter(p => p.role === 'F').length || 0} / 4
                      </span>
                    </div>
                    <div className="space-y-1">
                      {currentParticipant?.roster.filter(p => p.role === 'F').map((p, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-300">
                          <span>{p.name} ({p.team})</span>
                          <span className="text-amber-400 font-mono font-semibold">{p.acquiredPrice} cr</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Centri */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-purple-400">Centri (C)</span>
                      <span className="text-slate-400">
                        {currentParticipant?.roster.filter(p => p.role === 'C').length || 0} / 2
                      </span>
                    </div>
                    <div className="space-y-1">
                      {currentParticipant?.roster.filter(p => p.role === 'C').map((p, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-300">
                          <span>{p.name} ({p.team})</span>
                          <span className="text-amber-400 font-mono font-semibold">{p.acquiredPrice} cr</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                  <span>Totale Acquistati:</span>
                  <span className="font-bold text-white">{currentParticipant?.roster.length || 0} / 10 Giocatori</span>
                </div>
              </div>

              {/* PARTICIPANTS IN ROOM LIST */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="font-bold text-sm text-white mb-3 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Partecipanti alla Stanza ({roomData.participants.length})</span>
                </h3>

                <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                  {roomData.participants.map((m, idx) => {
                    const isTurn = roomData.activeCallerIndex === idx;
                    return (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isTurn 
                            ? 'bg-amber-500/10 border-amber-500/50' 
                            : 'bg-slate-950/60 border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-slate-500">{idx + 1}.</span>
                          <div>
                            <p className="font-bold text-white flex items-center space-x-1">
                              <span>{m.teamName}</span>
                              {m.isAdmin && <span className="text-[9px] bg-red-500/30 text-red-300 px-1 rounded">ADM</span>}
                            </p>
                            <p className="text-[10px] text-slate-400">{m.name} • {m.roster.length}/10 acq.</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400">{m.credits} cr</span>
                          {isTurn && <span className="block text-[9px] text-amber-400 font-bold uppercase">In Turno</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rosters' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Tutte le Rose della Lega</h2>
                <p className="text-sm text-slate-400">Verifica in tempo reale crediti spesi e slot occupati per ogni franchigia Dunkest.</p>
              </div>

              <button
                onClick={() => {
                  const exportJson = JSON.stringify(roomData.participants, null, 2);
                  navigator.clipboard.writeText(exportJson);
                  showNotice("Riepilogo Rose copiato negli appunti (JSON)!");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Esporta o Copia Rose</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {roomData.participants.map((manager) => {
                const totalSpent = manager.roster.reduce((acc, p) => acc + (p.acquiredPrice || 0), 0);
                return (
                  <div key={manager.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                        <div>
                          <h3 className="font-black text-lg text-white">{manager.teamName}</h3>
                          <p className="text-xs text-slate-400">{manager.name}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Residuo</span>
                          <span className="text-xl font-black text-emerald-400">{manager.credits} cr</span>
                        </div>
                      </div>

                      {/* Roster Players List */}
                      <div className="mt-4 space-y-2">
                        {manager.roster.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-xs">
                            Ancora nessun acquisto effettuato.
                          </div>
                        ) : (
                          manager.roster.map((player, pIdx) => (
                            <div key={pIdx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2">
                                <span className={`w-5 h-5 rounded font-black text-[10px] flex items-center justify-center ${
                                  player.role === 'G' ? 'bg-blue-600 text-white' :
                                  player.role === 'F' ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                                }`}>
                                  {player.role}
                                </span>
                                <span className="font-semibold text-slate-200">{player.name}</span>
                                <span className="text-slate-500 font-mono text-[10px]">({player.team})</span>
                              </div>
                              <span className="font-mono font-bold text-amber-400">{player.acquiredPrice} cr</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                      <span>Spesa Totale: <strong className="text-slate-200">{totalSpent} cr</strong></span>
                      <span>Slot: <strong className="text-white">{manager.roster.length} / 10</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Statistiche dell'Asta Dunkest</h2>
              <p className="text-sm text-slate-400">Analisi approfondita sui crediti spesi, costi medi per ruolo e record acquisti.</p>
            </div>

            {/* Role Breakdown Cards */}
            {(() => {
              const allBought = roomData.participants.flatMap(p => p.roster);
              const guardsBought = allBought.filter(p => p.role === 'G');
              const forwardsBought = allBought.filter(p => p.role === 'F');
              const centersBought = allBought.filter(p => p.role === 'C');

              const avgG = guardsBought.length ? (guardsBought.reduce((a, b) => a + b.acquiredPrice, 0) / guardsBought.length).toFixed(1) : '0';
              const avgF = forwardsBought.length ? (forwardsBought.reduce((a, b) => a + b.acquiredPrice, 0) / forwardsBought.length).toFixed(1) : '0';
              const avgC = centersBought.length ? (centersBought.reduce((a, b) => a + b.acquiredPrice, 0) / centersBought.length).toFixed(1) : '0';

              const topPurchases = [...allBought].sort((a, b) => b.acquiredPrice - a.acquiredPrice).slice(0, 5);

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
                      <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Guardie (G)</span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-3xl font-black text-white">{avgG} cr</span>
                        <span className="text-xs text-slate-400">{guardsBought.length} acquistate</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Costo medio per guardia titolare/riserva</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Ali (F)</span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-3xl font-black text-white">{avgF} cr</span>
                        <span className="text-xs text-slate-400">{forwardsBought.length} acquistate</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Costo medio per ala titolare/riserva</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
                      <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">Centri (C)</span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-3xl font-black text-white">{avgC} cr</span>
                        <span className="text-xs text-slate-400">{centersBought.length} acquistati</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Costo medio per centro titolare/riserva</p>
                    </div>
                  </div>

                  {/* Top 5 Most Expensive Players */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <h3 className="font-bold text-lg text-white mb-4 flex items-center space-x-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span>I Giocatori più Costosi dell'Asta</span>
                    </h3>

                    <div className="space-y-2">
                      {topPurchases.length === 0 ? (
                        <p className="text-slate-500 text-xs py-4 text-center">Nessun giocatore assegnato al momento.</p>
                      ) : (
                        topPurchases.map((player, idx) => (
                          <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono font-black text-amber-400 w-5">#{idx + 1}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                player.role === 'G' ? 'bg-blue-600 text-white' :
                                player.role === 'F' ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                              }`}>
                                {player.role}
                              </span>
                              <div>
                                <span className="font-bold text-sm text-white">{player.name}</span>
                                <span className="text-xs text-slate-400 ml-2">({player.team})</span>
                              </div>
                            </div>
                            <span className="font-mono text-base font-black text-amber-400">{player.acquiredPrice} cr</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-red-400 flex items-center space-x-2">
                <ShieldAlert className="w-6 h-6" />
                <span>Pannello di Controllo Host & Regolatore</span>
              </h2>
              <p className="text-sm text-slate-400">
                Hai il controllo totale su fasi, tempo, turni e crediti dei manager partecipanti.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phase Switcher */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-base">Cambio Fase d'Asta</h3>
                <p className="text-xs text-slate-400">
                  Imposta quale reparto chiamare. Il sistema limita automaticamente le offerte solo a chi ha slot liberi.
                </p>

                <div className="space-y-2">
                  {PHASES.map((p) => {
                    const isCurrent = roomData.phase === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setAuctionPhase(p.id)}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition ${
                          isCurrent
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{p.name}</span>
                        {isCurrent && <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] uppercase font-black">Attiva</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Turn & Rotation Direction */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-white text-base">Gestione Rotazione Chiamante</h3>
                <p className="text-xs text-slate-400">
                  Modifica il senso di chiamata o forza il passaggio di turno in caso di assenze o dubbi.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block font-semibold">Direzione Giro:</span>
                      <span className="text-sm font-bold text-white capitalize">
                        {roomData.turnDirection === 'clockwise' ? 'Senso Orario (1 → 2 → 3)' : 'Senso Antiorario (3 → 2 → 1)'}
                      </span>
                    </div>
                    <button
                      onClick={toggleTurnDirection}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg border border-slate-700"
                    >
                      Inverti Giro
                    </button>
                  </div>

                  <button
                    onClick={forcePassTurn}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center space-x-2"
                  >
                    <FastForward className="w-4 h-4 text-amber-400" />
                    <span>Forza Passaggio di Turno al Prossimo Manager</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Manual Budget and Roster Editor */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-bold text-white text-base">Modifica Manuale Crediti e Franchigie</h3>
              <p className="text-xs text-slate-400">
                Se qualcuno ha fatto un errore o volete correggere i crediti manualmente:
              </p>

              <div className="space-y-3">
                {roomData.participants.map((m, idx) => (
                  <div key={m.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-white text-sm">{m.teamName}</span>
                      <span className="text-slate-400 ml-2">({m.name})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-slate-400">Crediti:</label>
                      <input
                        type="number"
                        value={m.credits}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const nextParts = [...roomData.participants];
                          nextParts[idx] = { ...m, credits: val };
                          triggerStateUpdate({ ...roomData, participants: nextParts });
                        }}
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-center"
                      />

                      <button
                        onClick={() => {
                          const nextParts = roomData.participants.filter(p => p.id !== m.id);
                          triggerStateUpdate({ ...roomData, participants: nextParts });
                        }}
                        className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg"
                        title="Rimuovi manager dalla stanza"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="font-black text-xl text-white">Invita Manager</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              I partecipanti possono inquadrare o inserire il codice stanza per collegarsi dal proprio telefono.
            </p>

            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  window.location.origin + window.location.pathname + `?room=${roomData.code}`
                )}`}
                alt="QR Code Stanza"
                className="w-44 h-44"
              />
            </div>

            <div className="mt-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Codice Stanza Asta</span>
              <span className="font-mono text-xl font-black text-amber-400 tracking-widest">{roomData.code}</span>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(roomData.code);
                showNotice("Codice stanza copiato!");
                setShowQRModal(false);
              }}
              className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition"
            >
              Copia Codice Stanza
            </button>
          </div>
        </div>
      )}
    </div>
  );
}