import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy, Users, Play, Pause, RotateCcw, Clock,
  Search, ShieldAlert, Award, AlertCircle,
  Volume2, VolumeX, QrCode, Download, Settings,
  LogOut, UserCheck, Flame, FastForward, Info, BarChart3, Trash2, Ban, CheckCircle, Menu, X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
import {
  getFirestore, doc, setDoc, deleteDoc, onSnapshot, runTransaction
} from 'firebase/firestore';

/* STREAMING_CHUNK:Firebase Configuration... */
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

/* STREAMING_CHUNK:Time Synchronization Logic... */
let globalTimeOffset = 0;
export const getNow = () => Date.now() + globalTimeOffset;

const syncTimeWithNetwork = async () => {
  try {
    const start = Date.now();
    const res = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' }).catch(() => null);
    const dateHeader = res?.headers?.get('date');

    if (dateHeader) {
      const serverTime = new Date(dateHeader).getTime();
      const latency = (Date.now() - start) / 2;
      globalTimeOffset = serverTime - (start + latency);
    } else {
      const fallbackRes = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', { cache: 'no-store' });
      const data = await fallbackRes.json();
      const serverTime = new Date(data.utc_datetime).getTime();
      const latency = (Date.now() - start) / 2;
      globalTimeOffset = serverTime - (start + latency);
    }
  } catch (e) {
    console.warn("Sync orario fallito, si utilizza l'orologio locale", e);
  }
};
syncTimeWithNetwork();

/* STREAMING_CHUNK:Persistent ID Logic... */
const getOrCreateUserId = () => {
  let uid = sessionStorage.getItem('dunkest_session_uid');
  if (!uid) {
    uid = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('dunkest_session_uid', uid);
  }
  return uid;
};

/* STREAMING_CHUNK:Audio Handlers... */
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
  } catch (e) {}
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

/* STREAMING_CHUNK:Dunkest Schema Rules... */
const TOTAL_ROSTER_SIZE = 13;
const ROSTER_SLOT_SCHEMA = {
  G: { starters: 4, total: 5 },
  F: { starters: 4, total: 5 },
  C: { starters: 2, total: 3 }
};

const PHASES = [
  { id: 'guardie_starters', name: '1. Guardie Titolari (G)', allowedRoles: ['G'], isBench: false },
  { id: 'ali_starters', name: '2. Ali Titolari (F)', allowedRoles: ['F'], isBench: false },
  { id: 'centri_starters', name: '3. Centri Titolari (C)', allowedRoles: ['C'], isBench: false },
  { id: 'riserve_libere', name: '4. Riserve (Asta Libera)', allowedRoles: ['G', 'F', 'C'], isBench: true }
];

/* STREAMING_CHUNK:App Component Initialization... */
export default function App() {
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) return urlRoom.trim().toUpperCase();
      
      const savedRoom = sessionStorage.getItem('dunk_roomCode');
      if (savedRoom) return savedRoom;
      return 'DUNKEST25';
    } catch {
      return 'DUNKEST25';
    }
  });
  const [teamName, setTeamName] = useState(() => sessionStorage.getItem('dunk_teamName') || '');
  const [managerName, setManagerName] = useState(() => sessionStorage.getItem('dunk_managerName') || '');
  const [hasJoined, setHasJoined] = useState(() => sessionStorage.getItem('dunk_hasJoined') === 'true');
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('dunk_isAdmin') === 'true');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('auction');
  const [showQRModal, setShowQRModal] = useState(false);
  const [playersDB, setPlayersDB] = useState([]);
  const [isPlayersLoading, setIsPlayersLoading] = useState(true);
  
  const [maxUsers, setMaxUsers] = useState(8);

  const [roomData, setRoomData] = useState({
    code: 'DUNKEST25',
    phase: 'guardie_starters',
    initialBudget: 200,
    timerSeconds: 20,
    maxUsers: 8,
    isTimerPaused: false,
    activeCallerIndex: 0,
    turnDirection: 'clockwise',
    currentAuction: null,
    participants: [],
    boughtPlayers: [],
    completedAuctions: []
  });

  const [timeLeft, setTimeLeft] = useState(20);
  const [customBidAmount, setCustomBidAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNominee, setSelectedNominee] = useState(null);
  const [openingBid, setOpeningBid] = useState(1);
  const [notification, setNotification] = useState(null);

  /* STREAMING_CHUNK:Fetching Players and Auth Setup... */
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await fetch('players.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const rawJson = await response.json();
        
        const mappedPlayers = rawJson.map((p, index) => {
          if (p.Position === 'Head Coach') return null; 
          
          let role = 'G';
          if (p.Position === 'Forward') role = 'F';
          if (p.Position === 'Center') role = 'C';
          const priceParsed = parseFloat((p["Cr 26/27"] || "1,0").replace(',', '.')) || 4.0;
          return {
            id: `p_${index}`,
            name: `${p["First Name"]} ${p["Last Name"]}`.trim(),
            team: p.Team || p.team || '',
            role: role,
            basePrice: priceParsed,
            tier: p.Position
          };
        }).filter(Boolean);
        
        setPlayersDB(mappedPlayers);
      } catch (error) {
        console.error("Failed to load players.json:", error);
        showNotice("Errore nel caricamento del file giocatori. Assicurati che players.json esista nella cartella public.");
      } finally {
        setIsPlayersLoading(false);
      }
    };
    fetchPlayers();

    const localId = getOrCreateUserId();
    const initAuth = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
        await signInAnonymously(auth);
      } catch (err) {
        console.warn("Auth offline/anonimo fallback attivo.");
        setUser({ uid: localId, isAnonymous: true });
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      if (usr) {
        setUser({ ...usr, uid: localId });
      }
    });

    const clockSyncInterval = setInterval(syncTimeWithNetwork, 300000);

    return () => {
      unsubscribe();
      clearInterval(clockSyncInterval);
    };
  }, []);

  /* STREAMING_CHUNK:Firestore Synchronization... */
  useEffect(() => {
    if (!db || !hasJoined) return;
    const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
    const unsubscribe = onSnapshot(roomDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        const myId = user?.uid;
        if (myId && data.participants && !data.participants.some(p => p.id === myId)) {
             setHasJoined(false);
             sessionStorage.removeItem('dunk_hasJoined');
             showNotice("Sei stato rimosso dalla stanza.");
             return;
        }
        
        setRoomData(data);
      } else {
        setHasJoined(false);
        sessionStorage.removeItem('dunk_hasJoined');
        showNotice("La stanza è stata eliminata.");
      }
    }, (error) => {
      console.warn("Firestore snapshot error:", error);
    });
    return () => unsubscribe();
  }, [hasJoined, roomCode, user?.uid]);

  /* STREAMING_CHUNK:Timezone-Independent Timer Logic... */
  useEffect(() => {
    if (!roomData.currentAuction || roomData.currentAuction.status === 'pending') return;
    if (roomData.isTimerPaused) {
       setTimeLeft(roomData.currentAuction.pausedTimeLeft || 20);
       return;
    }

    const interval = setInterval(() => {
      const now = getNow();
      let diff = Math.max(0, Math.ceil((roomData.currentAuction.endsAt - now) / 1000));
      
      const maxTimer = roomData.timerSeconds || 20;
      if (diff > maxTimer) diff = maxTimer;
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        handleAuctionExpired();
      }
    }, 100); 

    return () => clearInterval(interval);
  }, [roomData.currentAuction, roomData.isTimerPaused]);

  /* STREAMING_CHUNK:Processing Robust Auction Expiration & Confirmation... */
  const handleAuctionExpired = async () => {
    if (!roomData.currentAuction || roomData.currentAuction.status === 'pending') return;
    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(roomDocRef);
        if (!snap.exists()) return;
        const currentData = snap.data();
        
        if (!currentData.currentAuction || currentData.currentAuction.status === 'pending') return;

        if (!currentData.isTimerPaused && getNow() < currentData.currentAuction.endsAt) {
            return;
        }

        transaction.update(roomDocRef, {
          currentAuction: {
            ...currentData.currentAuction,
            status: 'pending'
          }
        });
        
        if (soundEnabled) playBuzzerSound(); 
      });
    } catch (err) {}
  };

  const forceEndAuction = async () => {
    if (!isAdmin || !roomData.currentAuction || roomData.currentAuction.status === 'pending') return;
    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(roomDocRef);
        if (!snap.exists()) return;
        const currentData = snap.data();
        
        if (!currentData.currentAuction || currentData.currentAuction.status === 'pending') return;

        transaction.update(roomDocRef, {
          currentAuction: {
            ...currentData.currentAuction,
            status: 'pending'
          }
        });
        
        if (soundEnabled) playBuzzerSound(); 
      });
    } catch (err) {}
  };

  const confirmAuctionAssignment = async () => {
    if (!isAdmin || !roomData.currentAuction || roomData.currentAuction.status !== 'pending') return;
    try {
      let assignmentMsg = "";
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(roomDocRef);
        if (!snap.exists()) return;
        const currentData = snap.data();
        
        if (!currentData.currentAuction || currentData.currentAuction.status !== 'pending') return;

        const winnerId = currentData.currentAuction.highBidderId;
        const finalPrice = currentData.currentAuction.currentBid;
        const player = currentData.currentAuction.player;

        const updatedParts = currentData.participants.map(p => {
          if (p.id === winnerId) {
            return {
              ...p,
              credits: p.credits - finalPrice,
              roster: [...p.roster, { ...player, acquiredPrice: finalPrice }]
            };
          }
          return p;
        });

        const nextCallerIdx = getNextCallerIndex(currentData.activeCallerIndex, updatedParts, currentData);

        const newHistoryLog = {
          playerName: player.name,
          playerRole: player.role,
          playerTeam: player.team,
          winnerName: currentData.currentAuction.highBidderName,
          price: finalPrice,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        transaction.update(roomDocRef, {
          participants: updatedParts,
          boughtPlayers: [...(currentData.boughtPlayers || []), player.id],
          completedAuctions: [newHistoryLog, ...(currentData.completedAuctions || [])].slice(0, 50),
          currentAuction: null,
          activeCallerIndex: nextCallerIdx
        });
        
        assignmentMsg = `ASSEGNATO! ${player.name} a ${currentData.currentAuction.highBidderName} per ${finalPrice} cr!`;
      });
      if (assignmentMsg) showNotice(assignmentMsg);
    } catch (err) {}
  };

  /* STREAMING_CHUNK:Defining Phase Validation & Restrictions... */
  const getNextCallerIndex = (currentIndex, participantsList, serverRoomData = roomData) => {
    if (!participantsList || participantsList.length === 0) return 0;
    const step = serverRoomData.turnDirection === 'counter-clockwise' ? -1 : 1;
    let nextIdx = (currentIndex + step + participantsList.length) % participantsList.length;

    let attempts = 0;
    while (attempts < participantsList.length) {
      const candidate = participantsList[nextIdx];
      if (canParticipantBid(candidate, serverRoomData.phase)) {
        return nextIdx;
      }
      nextIdx = (nextIdx + step + participantsList.length) % participantsList.length;
      attempts++;
    }
    return currentIndex;
  };

  const hasSpecificSlotForPlayer = (participant, playerRole, phaseId) => {
    if (!participant) return false;
    const count = participant.roster.filter(p => p.role === playerRole).length;
    const isReservePhase = phaseId === 'riserve_libere';
    const max = isReservePhase ? ROSTER_SLOT_SCHEMA[playerRole].total : ROSTER_SLOT_SCHEMA[playerRole].starters;
    return count < max;
  };

  const hasTeamSlotForPlayer = (participant, teamAbbr) => {
    if (!participant || !teamAbbr) return true;
    const count = participant.roster.filter(p => p.team === teamAbbr).length;
    return count < 2;
  };

  const canParticipantBid = (participant, currentPhaseId) => {
    if (!participant) return false;
    
    if (currentPhaseId === 'riserve_libere') {
      return participant.roster.length < TOTAL_ROSTER_SIZE;
    }
    
    const phaseConfig = PHASES.find(p => p.id === currentPhaseId);
    if (!phaseConfig) return false;
    const activeRole = phaseConfig.allowedRoles[0];
    return hasSpecificSlotForPlayer(participant, activeRole, currentPhaseId);
  };

  const getRemainingRequiredSlots = (participant) => {
    return Math.max(0, TOTAL_ROSTER_SIZE - participant.roster.length);
  };

  const getMaxBidAllowed = (participant) => {
    const slotsNeeded = getRemainingRequiredSlots(participant);
    const futureSlots = Math.max(0, slotsNeeded - 1);
    return Math.max(0, participant.credits - futureSlots);
  };

  /* STREAMING_CHUNK:Safe Room Join Logic... */
  const handleJoinOrCreate = async (asAdmin = false) => {
    const cleanRoom = roomCode.trim().toUpperCase();
    const tName = teamName.trim();
    const mName = managerName.trim();

    if (!cleanRoom) {
      showNotice("Inserisci un codice stanza!");
      return;
    }
    if (!tName || !mName) {
      showNotice("Inserisci sia il tuo nome che il nome della tua franchigia Dunkest!");
      return;
    }

    const currentUserId = user?.uid || getOrCreateUserId();
    const newParticipant = {
      id: currentUserId,
      name: mName,
      teamName: tName,
      credits: 200, 
      roster: [],
      isAdmin: false
    };

    if (db) {
      try {
        const roomDocRef = doc(db, 'rooms', cleanRoom);
        
        await runTransaction(db, async (transaction) => {
          const roomSnap = await transaction.get(roomDocRef);
          
          if (!roomSnap.exists()) {
            if (!asAdmin) {
              throw new Error("La stanza non esiste. Devi prima crearla come Host.");
            }
            const serverData = {
              code: cleanRoom,
              phase: 'guardie_starters',
              initialBudget: 200,
              timerSeconds: 20,
              maxUsers: parseInt(maxUsers) || 8,
              isTimerPaused: false,
              activeCallerIndex: 0,
              turnDirection: 'clockwise',
              currentAuction: null,
              participants: [{ ...newParticipant, isAdmin: true }],
              boughtPlayers: [],
              completedAuctions: []
            };
            transaction.set(roomDocRef, serverData);
            return { joinedAsAdmin: true };
          } else {
            if (asAdmin) {
              throw new Error("Questa stanza esiste già! Non puoi crearne una nuova con questo codice. Accedi come Manager.");
            }
            
            const serverData = roomSnap.data();
            const list = serverData.participants || [];
            
            const existingIdx = list.findIndex(p => p.teamName.toLowerCase() === tName.toLowerCase());
            
            if (existingIdx >= 0) {
              list[existingIdx] = { ...list[existingIdx], id: currentUserId, name: mName };
            } else {
              if (list.length >= (serverData.maxUsers || 8)) {
                throw new Error(`Stanza piena! È stato raggiunto il limite massimo di ${serverData.maxUsers || 8} franchigie.`);
              }
              list.push(newParticipant);
            }
            
            transaction.update(roomDocRef, { participants: list });
            return { joinedAsAdmin: existingIdx >= 0 ? list[existingIdx].isAdmin : false };
          }
        }).then((result) => {
          sessionStorage.setItem('dunk_roomCode', cleanRoom);
          sessionStorage.setItem('dunk_teamName', tName);
          sessionStorage.setItem('dunk_managerName', mName);
          sessionStorage.setItem('dunk_hasJoined', 'true');
          sessionStorage.setItem('dunk_isAdmin', String(result.joinedAsAdmin));
          
          setIsAdmin(result.joinedAsAdmin);
          setHasJoined(true);
          showNotice(`Benvenuto all'asta Dunkest, ${tName}!`);
        }).catch((err) => {
          showNotice(err.message || "Errore durante l'accesso alla stanza.");
        });

      } catch (err) {
        console.error("Transazione fallita:", err);
        showNotice("Errore di rete. Riprova.");
      }
    }
  };

  /* STREAMING_CHUNK:Opening new auction nominations... */
  const handleStartNomination = async () => {
    if (!selectedNominee) {
      showNotice("Seleziona prima un giocatore dal database!");
      return;
    }
    const currentParticipant = roomData.participants.find(p => p.id === user?.uid);
    if (!currentParticipant) return;

    if (!hasSpecificSlotForPlayer(currentParticipant, selectedNominee.role, roomData.phase)) {
      showNotice(`Non hai slot disponibili per questo ruolo nella fase corrente.`);
      return;
    }
    if (!hasTeamSlotForPlayer(currentParticipant, selectedNominee.team)) {
      showNotice(`Non puoi aprire l'asta: hai già raggiunto il limite di 2 giocatori per i ${selectedNominee.team}.`);
      return;
    }

    const maxBid = getMaxBidAllowed(currentParticipant);
    const startPrice = Math.max(1, parseInt(openingBid) || 1);

    if (startPrice > maxBid) {
      showNotice(`Crediti insufficienti! La tua offerta massima consentita è ${maxBid}.`);
      return;
    }

    const timerDuration = roomData.timerSeconds || 20;
    const now = getNow();
    const localEndsAt = now + (timerDuration * 1000);
    const serverExpirationThreshold = localEndsAt + 1500; 

    const newAuction = {
      player: selectedNominee,
      currentBid: startPrice,
      highBidderId: currentParticipant.id,
      highBidderName: currentParticipant.teamName,
      status: 'active',
      endsAt: localEndsAt,
      pausedTimeLeft: timerDuration,
      serverExpirationThreshold: serverExpirationThreshold,
      bidHistory: [
        {
          bidderId: currentParticipant.id,
          bidderName: currentParticipant.teamName,
          amount: startPrice,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]
    };

    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await setDoc(roomDocRef, { currentAuction: newAuction, isTimerPaused: false }, { merge: true });
      setSelectedNominee(null);
      setOpeningBid(1);
      if (soundEnabled) playBidSound();
      showNotice(`Asta aperta per ${selectedNominee.name} a base ${startPrice} cr!`);
    } catch(e) {}
  };

  /* STREAMING_CHUNK:Processing synchronous bids... */
  const handlePlaceBid = async (deltaOrAmount, isAbsolute = false) => {
    const currentParticipant = roomData.participants.find(p => p.id === user?.uid);
    if (!currentParticipant || !roomData.currentAuction) return;

    if (roomData.currentAuction.status === 'pending') {
      showNotice("L'asta è terminata ed è in attesa di conferma dall'admin.");
      return;
    }

    if (!hasSpecificSlotForPlayer(currentParticipant, roomData.currentAuction.player.role, roomData.phase)) {
      showNotice(`Hai già completato tutti gli slot disponibili per questo ruolo.`);
      return;
    }
    
    if (!hasTeamSlotForPlayer(currentParticipant, roomData.currentAuction.player.team)) {
      showNotice(`Hai già raggiunto il limite massimo di 2 giocatori per i ${roomData.currentAuction.player.team}.`);
      return;
    }

    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(roomDocRef);
        if (!snap.exists()) return;
        const currentData = snap.data();
        
        if (!currentData.currentAuction || currentData.currentAuction.status === 'pending') {
           throw new Error("L'asta è già conclusa ed in attesa di approvazione!");
        }

        if (!currentData.isTimerPaused && getNow() > currentData.currentAuction.serverExpirationThreshold) {
           throw new Error("L'asta è terminata.");
        }

        const currentHighBid = currentData.currentAuction.currentBid;
        const targetBid = isAbsolute ? parseInt(deltaOrAmount) : currentHighBid + deltaOrAmount;

        if (isNaN(targetBid) || targetBid <= currentHighBid) throw new Error(`L'offerta deve essere superiore a ${currentHighBid}`);
        
        const serverParticipant = currentData.participants.find(p => p.id === currentParticipant.id);
        const maxAllowed = getMaxBidAllowed(serverParticipant || currentParticipant);
        if (targetBid > maxAllowed) throw new Error(`Supera il tetto massimo (${maxAllowed} cr)`);

        const timerDuration = currentData.timerSeconds || 20;
        const localEndsAt = getNow() + (timerDuration * 1000);

        const newHistoryEntry = {
          bidderId: currentParticipant.id,
          bidderName: currentParticipant.teamName,
          amount: targetBid,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        const updatedAuction = {
          ...currentData.currentAuction,
          currentBid: targetBid,
          highBidderId: currentParticipant.id,
          highBidderName: currentParticipant.teamName,
          endsAt: localEndsAt, 
          pausedTimeLeft: timerDuration,
          serverExpirationThreshold: localEndsAt + 1500,
          bidHistory: [newHistoryEntry, ...(currentData.currentAuction.bidHistory || [])]
        };

        transaction.update(roomDocRef, {
          currentAuction: updatedAuction,
          isTimerPaused: false
        });
      });

      if (soundEnabled) playBidSound();
      setCustomBidAmount('');
    } catch (err) {
      showNotice(err.message);
    }
  };

  /* STREAMING_CHUNK:Admin Controls: Timer management & Room deletion... */
  const toggleTimerPause = async () => {
    if (!isAdmin) return;
    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(roomDocRef);
        if(!snap.exists()) return;
        const currentData = snap.data();
        if(!currentData.currentAuction || currentData.currentAuction.status === 'pending') return;

        const nextPaused = !currentData.isTimerPaused;
        let nextEndsAt = currentData.currentAuction.endsAt;
        let nextPausedTimeLeft = currentData.currentAuction.pausedTimeLeft;

        if (nextPaused) {
           nextPausedTimeLeft = Math.max(0, Math.ceil((currentData.currentAuction.endsAt - getNow()) / 1000));
        } else {
           nextEndsAt = getNow() + ((currentData.currentAuction.pausedTimeLeft || 20) * 1000);
           currentData.currentAuction.serverExpirationThreshold = nextEndsAt + 1500;
        }

        transaction.update(roomDocRef, {
          isTimerPaused: nextPaused,
          currentAuction: {
             ...currentData.currentAuction,
             endsAt: nextEndsAt,
             pausedTimeLeft: nextPausedTimeLeft
          }
        });
      });
    } catch(e) {}
  };

  const resetTimerSeconds = async (secs = 20) => {
    if (!isAdmin || !roomData.currentAuction || roomData.currentAuction.status === 'pending') return;
    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await setDoc(roomDocRef, { 
         currentAuction: {
           ...roomData.currentAuction,
           endsAt: getNow() + (secs * 1000),
           pausedTimeLeft: secs,
           serverExpirationThreshold: getNow() + (secs * 1000) + 1500 
         },
        isTimerPaused: false 
       }, { merge: true });
    } catch(e){}
  };

  const undoLastBid = async () => {
    if (!isAdmin || !roomData.currentAuction || roomData.currentAuction.status === 'pending' || !roomData.currentAuction.bidHistory?.length) return;
    const history = [...roomData.currentAuction.bidHistory];
    
    if (history.length <= 1) {
      showNotice("Impossibile annullare l'offerta di apertura! Puoi solo annullare l'asta corrente.");
      return;
    }
    history.shift(); 
    const prev = history[0];
    const timerDuration = roomData.timerSeconds || 20;

    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await setDoc(roomDocRef, {
        currentAuction: {
          ...roomData.currentAuction,
          currentBid: prev.amount,
          highBidderId: prev.bidderId,
          highBidderName: prev.bidderName,
          endsAt: getNow() + (timerDuration * 1000),
          pausedTimeLeft: timerDuration,
          serverExpirationThreshold: getNow() + (timerDuration * 1000) + 1500,
          bidHistory: history
        },
        isTimerPaused: false
      }, { merge: true });
      showNotice(`Ultimo rilancio annullato. Offerta ripristinata a ${prev.amount} cr.`);
    } catch(e){}
  };

  const forceCancelAuction = async () => {
    if (!isAdmin) return;
    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await setDoc(roomDocRef, { currentAuction: null, isTimerPaused: false }, { merge: true });
      showNotice("Asta annullata.");
    } catch(e){}
  };

  const setAuctionPhase = async (phaseId) => {
    if (!isAdmin) return;
    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await setDoc(roomDocRef, { phase: phaseId }, { merge: true });
      showNotice(`Fase d'asta cambiata in: ${PHASES.find(p => p.id === phaseId)?.name}`);
    } catch(e){}
  };

  const forcePassTurn = async () => {
    if (!isAdmin) return;
    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      const nextIdx = getNextCallerIndex(roomData.activeCallerIndex, roomData.participants, roomData);
      await setDoc(roomDocRef, { activeCallerIndex: nextIdx }, { merge: true });
      showNotice(`Turno passato manualmente.`);
    } catch(e){}
  };

  const toggleTurnDirection = async () => {
    if (!isAdmin) return;
    const nextDir = roomData.turnDirection === 'clockwise' ? 'counter-clockwise' : 'clockwise';
    try {
      const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
      await setDoc(roomDocRef, { turnDirection: nextDir }, { merge: true });
    } catch(e){}
  };

  const deleteRoom = async () => {
    if (!isAdmin) return;
    if (confirm("Sei sicuro di voler eliminare DEFINITIVAMENTE questa stanza e tutti i progressi?")) {
      try {
        const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
        await deleteDoc(roomDocRef);
        handleLeaveRoom();
      } catch (err) {
        showNotice("Errore durante l'eliminazione della stanza.");
      }
    }
  };

  const removeManager = async (managerId) => {
     if (!isAdmin) return;
     if (!confirm("Rimuovere questo manager? I suoi giocatori torneranno disponibili.")) return;
     
     try {
       const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
       await runTransaction(db, async (transaction) => {
         const snap = await transaction.get(roomDocRef);
         if(snap.exists()) {
           const currentData = snap.data();
           const currentParts = currentData.participants || [];
           const targetManager = currentParts.find(p => p.id === managerId);
           
           if (targetManager) {
               const managerPlayerIds = targetManager.roster.map(p => p.id);
               const newBoughtPlayers = (currentData.boughtPlayers || []).filter(pid => !managerPlayerIds.includes(pid));
               
               const updatedParts = currentParts.filter(p => p.id !== managerId);
               
               transaction.update(roomDocRef, { 
                   participants: updatedParts,
                   boughtPlayers: newBoughtPlayers 
               });
           }
         }
       });
       showNotice("Manager rimosso. I giocatori sono tornati sul mercato.");
     } catch(err) {}
  };

  /* STREAMING_CHUNK:Session Management & Notifications... */
  const handleLeaveRoom = () => {
    sessionStorage.removeItem('dunk_hasJoined');
    sessionStorage.removeItem('dunk_roomCode');
    sessionStorage.removeItem('dunk_isAdmin');
    setHasJoined(false);
  };

  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(prev => prev === msg ? null : prev);
    }, 4000);
  };

  /* STREAMING_CHUNK:Rendering Login Screen... */
  const currentParticipant = roomData.participants.find(p => p.id === user?.uid);
  const activeCaller = roomData.participants[roomData.activeCallerIndex] || roomData.participants[0];
  const isMyCallingTurn = currentParticipant && activeCaller && currentParticipant.id === activeCaller.id;
  const currentPhaseConfig = PHASES.find(p => p.id === roomData.phase) || PHASES[0];

  const availablePlayers = useMemo(() => {
    const boughtSet = new Set(roomData.boughtPlayers || []);
    return playersDB.filter(p => {
      if (boughtSet.has(p.id)) return false;
      if (!currentPhaseConfig.allowedRoles.includes(p.role)) return false;
      
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(query) || p.team.toLowerCase().includes(query) || p.role.toLowerCase().includes(query);
      }
      return true;
    });
  }, [playersDB, roomData.boughtPlayers, currentPhaseConfig, searchTerm]);

  // LOGIN SCREEN
  if (!hasJoined) {
    const isFromQRCode = window.location.search.includes('room=');
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        {/* Abstract subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative z-10 shadow-2xl">
          <div className="flex flex-col items-center justify-center space-y-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-8 h-8 text-zinc-950" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight text-white uppercase">Dunkest Auction</h1>
              <p className="text-xs text-amber-500 font-semibold tracking-widest uppercase mt-1">Live Fantasy Draft</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 ml-1">Codice Stanza</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="es. DUNKEST25"
                disabled={isFromQRCode}
                className={`w-full px-4 py-3.5 rounded-xl font-mono text-sm font-bold tracking-widest focus:outline-none transition-all ${
                   isFromQRCode 
                    ? 'bg-zinc-800/50 border border-transparent text-amber-500/50 cursor-not-allowed' 
                    : 'bg-zinc-950 border border-white/10 text-amber-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 ml-1">Tuo Nome</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="es. Gianluca"
                  className="w-full px-4 py-3.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 ml-1">Nome Squadra</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="es. Boston Clowns"
                  className="w-full px-4 py-3.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>
            
            {!isFromQRCode && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2 ml-1">Max Squadre (Solo Host)</label>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  className="w-full px-4 py-3.5 bg-zinc-950 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            )}

            <div className={`pt-4 grid gap-3 ${isFromQRCode ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <button
                onClick={() => handleJoinOrCreate(false)}
                className="w-full py-4 px-4 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-[0.98]"
              >
                <Users className="w-4 h-4" />
                <span>Entra (Manager)</span>
              </button>
              {!isFromQRCode && (
                <button
                  onClick={() => handleJoinOrCreate(true)}
                  className="w-full py-4 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition-all border border-white/5 active:scale-[0.98]"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Crea Host / Admin</span>
                </button>
              )}
            </div>
            
            {isPlayersLoading && (
                <div className="text-center text-xs text-amber-500 animate-pulse font-medium mt-4">
                    Caricamento database giocatori...
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* STREAMING_CHUNK:Rendering the main app workspace... */
  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-200 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-white/10 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <Flame className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-sm">{notification}</span>
        </div>
      )}

      {/* TOP DESKTOP HEADER & MOBILE TOP BAR */}
      <header className="h-16 md:h-20 shrink-0 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-zinc-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-3">
              <span className="font-black text-lg md:text-xl text-white tracking-tight hidden sm:block">DUNKEST AUCTION</span>
              <span className="font-black text-lg text-white tracking-tight sm:hidden">DUNKEST</span>
              <span className="bg-white/10 text-zinc-300 text-[10px] md:text-xs px-2 py-0.5 rounded font-mono font-medium border border-white/10">
                {roomData.code}
              </span>
              {isAdmin && (
                <span className="bg-red-500/10 text-red-400 text-[10px] md:text-xs px-2 py-0.5 rounded font-bold border border-red-500/20">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 flex items-center space-x-2 mt-0.5">
              <span className="truncate max-w-[120px] md:max-w-[200px] font-medium text-zinc-200">{currentParticipant?.teamName}</span>
              <span className="opacity-50">•</span>
              <span className="text-amber-500 font-semibold">{currentParticipant?.credits} cr</span>
            </div>
          </div>
        </div>

        {/* Desktop Tabs Navigation */}
        <div className="hidden md:flex items-center bg-zinc-950/50 p-1 rounded-xl border border-white/5 mx-4">
          <button onClick={() => setActiveTab('auction')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'auction' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Flame className="w-4 h-4" />
            <span>Asta Live</span>
          </button>
          <button onClick={() => setActiveTab('rosters')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'rosters' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <Users className="w-4 h-4" />
            <span>Rose ({roomData.participants.length}/{roomData.maxUsers})</span>
          </button>
          <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'stats' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <BarChart3 className="w-4 h-4" />
            <span>Statistiche</span>
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${activeTab === 'admin' ? 'bg-zinc-800 text-red-400 shadow-sm' : 'text-zinc-500 hover:text-red-400/70'}`}>
              <Settings className="w-4 h-4" />
              <span>Host Settings</span>
            </button>
          )}
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center space-x-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-xl hover:bg-white/5 text-zinc-400 transition" title={soundEnabled ? "Disattiva suoni" : "Attiva suoni"}>
            {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-500" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowQRModal(true)} className="hidden md:flex px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-zinc-300 items-center space-x-2 transition border border-white/5">
            <QrCode className="w-4 h-4 text-amber-500" />
            <span>Invita</span>
          </button>
          <button onClick={handleLeaveRoom} className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 transition flex items-center justify-center" title="Esci">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* PHASE & TURN BANNER (Always visible top bar) */}
      <div className="h-10 md:h-12 bg-zinc-900/30 border-b border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0 text-[11px] md:text-xs z-20">
        <div className="flex items-center space-x-3">
          <span className="text-zinc-500 font-semibold hidden sm:inline">FASE:</span>
          <span className="text-zinc-200 font-bold px-2 py-0.5 rounded bg-zinc-800 border border-white/5">
            {currentPhaseConfig.name}
          </span>
          <span className="text-zinc-600 hidden md:inline">|</span>
          <span className="text-zinc-500 hidden md:inline">GIRO: <span className="text-zinc-300">{roomData.turnDirection === 'clockwise' ? 'Orario ↻' : 'Antiorario ↺'}</span></span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-zinc-500 hidden sm:inline">CHIAMATA A:</span>
          <div className={`px-2 py-1 rounded-md font-bold flex items-center space-x-2 transition-colors ${
            isMyCallingTurn 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' 
              : 'bg-zinc-800 text-zinc-300 border border-white/5'
          }`}>
            <UserCheck className="w-3.5 h-3.5" />
            <span>{activeCaller?.teamName || 'In attesa'}</span>
            {isMyCallingTurn && <span className="text-[9px] uppercase font-black bg-emerald-500 text-zinc-950 px-1 rounded ml-1 hidden sm:inline">Tocca a te</span>}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA - True Full Screen & Scrollable columns */}
      <main className="flex-1 flex overflow-hidden relative pb-16 md:pb-0"> 
        <div className="h-full w-full mx-auto max-w-[1800px] p-4 md:p-6 flex flex-col md:flex-row gap-6">
          
          {/* LEFT/MAIN COLUMN (Auction) */}
          <div className={`flex-1 flex-col gap-6 md:overflow-y-auto custom-scrollbar md:pr-4 ${activeTab === 'auction' ? 'flex' : 'hidden md:flex'}`}>
            
            {/* AUCTION WIDGET */}
            {roomData.currentAuction ? (
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 md:p-8 shadow-xl relative overflow-hidden flex flex-col shrink-0">
                {/* Timer Bar Top */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-950">
                  <div 
                    className={`h-full transition-all duration-200 ease-linear ${
                      roomData.currentAuction.status === 'pending' ? 'bg-emerald-500' :
                      timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (timeLeft / (roomData.timerSeconds || 20)) * 100)}%` }}
                  />
                </div>

                <div className="flex flex-row justify-between items-start mb-6 md:mb-8">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider border ${
                        roomData.currentAuction.player.role === 'G' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        roomData.currentAuction.player.role === 'F' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {roomData.currentAuction.player.role === 'G' ? 'Guardia (G)' : 
                         roomData.currentAuction.player.role === 'F' ? 'Ala (F)' : 'Centro (C)'}
                      </span>
                      <span className="text-zinc-400 font-mono text-xs font-semibold px-2 py-0.5 bg-zinc-950 rounded border border-white/5">{roomData.currentAuction.player.team}</span>
                      <span className="text-amber-500 text-[10px] md:text-xs font-semibold ml-2">Quotazione: {roomData.currentAuction.player.basePrice} cr</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                      {roomData.currentAuction.player.name}
                    </h2>
                  </div>

                  {/* Timer Display */}
                  <div className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl border min-w-[80px] md:min-w-[100px] shrink-0 ml-4 ${
                    roomData.currentAuction.status === 'pending'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : roomData.isTimerPaused 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                      : timeLeft <= 5 
                      ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' 
                      : 'bg-zinc-950 border-white/10 text-white'
                  }`}>
                    <span className="font-mono text-3xl md:text-4xl font-black leading-none">{roomData.currentAuction.status === 'pending' ? '0' : timeLeft}</span>
                    <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest mt-1 opacity-70">
                      {roomData.currentAuction.status === 'pending' ? 'ATTESA' : roomData.isTimerPaused ? 'PAUSA' : 'SEC'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                   <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
                     <p className="text-[10px] md:text-xs uppercase text-zinc-500 font-semibold tracking-wider mb-1">Miglior Offerta</p>
                     <div className="flex items-baseline space-x-2">
                       <span className="text-4xl md:text-5xl font-black text-amber-500 tracking-tighter">
                         {roomData.currentAuction.currentBid}
                       </span>
                       <span className="text-sm font-medium text-zinc-400">cr</span>
                     </div>
                   </div>
                   <div className="bg-zinc-950 border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col justify-center">
                     <p className="text-[10px] md:text-xs uppercase text-zinc-500 font-semibold tracking-wider mb-1">In Vantaggio</p>
                     <p className="text-xl md:text-2xl font-bold text-white truncate">
                       {roomData.currentAuction.highBidderName}
                     </p>
                     {roomData.currentAuction.highBidderId === currentParticipant?.id && (
                       <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 w-max">
                         SEI TU IL LEADER
                       </span>
                     )}
                   </div>
                </div>

                {/* BIDDING CONTROLS OR ADMIN CONFIRMATION */}
                {roomData.currentAuction.status === 'pending' ? (
                   <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 md:p-6 text-center space-y-4">
                     <h3 className="text-xl font-black text-emerald-400">Asta Terminata!</h3>
                     {isAdmin ? (
                       <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
                         <button onClick={forceCancelAuction} className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition text-sm">Annulla Asta</button>
                         <button onClick={confirmAuctionAssignment} className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl font-black shadow-lg active:scale-95 transition text-sm">Conferma Assegnazione</button>
                       </div>
                     ) : (
                       <p className="text-emerald-400/70 font-semibold text-sm animate-pulse flex justify-center items-center gap-2">
                         <Clock className="w-4 h-4" /> In attesa di registrazione da parte dell'Host...
                       </p>
                     )}
                   </div>
                ) : (() => {
                  const hasSlot = hasSpecificSlotForPlayer(currentParticipant, roomData.currentAuction.player.role, roomData.phase);
                  const hasTeamSlot = hasTeamSlotForPlayer(currentParticipant, roomData.currentAuction.player.team);
                  const maxAllowed = currentParticipant ? getMaxBidAllowed(currentParticipant) : 0;

                  return (
                    // Sticky container for mobile to keep buttons always reachable
                    <div className="sticky bottom-16 md:relative md:bottom-auto bg-zinc-900 md:bg-transparent -mx-5 px-5 pb-5 md:mx-0 md:px-0 md:pb-0 z-30 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                      {!hasSlot ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400 text-sm">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span><strong>Spettatore:</strong> Hai completato gli slot per il ruolo {roomData.currentAuction.player.role} in questa fase.</span>
                        </div>
                      ) : !hasTeamSlot ? (
                         <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 text-red-400 text-sm">
                           <Ban className="w-5 h-5 flex-shrink-0 mt-0.5" />
                           <span><strong>Limite Franchigia:</strong> Hai già 2 giocatori per i <strong>{roomData.currentAuction.player.team}</strong>.</span>
                         </div>
                      ) : maxAllowed <= roomData.currentAuction.currentBid ? (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3 text-amber-500 text-sm">
                          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <span><strong>Crediti insufficienti:</strong> Offerta massima consentita {maxAllowed} cr.</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between items-end mb-1">
                             <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">Rilancio Rapido</span>
                             <span className="text-[11px] text-zinc-500">Max Bid: <strong className="text-amber-500">{maxAllowed} cr</strong></span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handlePlaceBid(1)} className="py-3.5 md:py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-sm shadow-md active:scale-95 transition">
                              +1 <span className="font-medium text-xs opacity-60 ml-1 block sm:inline">({roomData.currentAuction.currentBid + 1})</span>
                            </button>
                            <button onClick={() => handlePlaceBid(2)} className="py-3.5 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm border border-white/5 active:scale-95 transition">
                              +2 <span className="font-medium text-xs text-zinc-400 ml-1 block sm:inline">({roomData.currentAuction.currentBid + 2})</span>
                            </button>
                            <button onClick={() => handlePlaceBid(5)} className="py-3.5 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm border border-white/5 active:scale-95 transition">
                              +5 <span className="font-medium text-xs text-zinc-400 ml-1 block sm:inline">({roomData.currentAuction.currentBid + 5})</span>
                            </button>
                            <button onClick={() => handlePlaceBid(10)} className="py-3.5 md:py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm border border-white/5 active:scale-95 transition">
                              +10 <span className="font-medium text-xs text-zinc-400 ml-1 block sm:inline">({roomData.currentAuction.currentBid + 10})</span>
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={roomData.currentAuction.currentBid + 1}
                              max={maxAllowed}
                              value={customBidAmount}
                              onChange={(e) => setCustomBidAmount(e.target.value)}
                              placeholder="Offerta personalizzata..."
                              className="flex-1 px-4 py-3 bg-zinc-950 border border-white/10 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                            />
                            <button
                              onClick={() => {
                                if (customBidAmount) handlePlaceBid(parseInt(customBidAmount), true);
                              }}
                              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg active:scale-95 transition text-sm shrink-0"
                            >
                              Offri
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Admin Quick Actions in Auction */}
                      {isAdmin && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-2">
                          <button onClick={forceEndAuction} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" /><span>Chiudi Subito</span>
                          </button>
                          <button onClick={toggleTimerPause} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-white/5 flex items-center space-x-1">
                            {roomData.isTimerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                            <span>{roomData.isTimerPaused ? 'Riprendi' : 'Pausa'}</span>
                          </button>
                          <button onClick={() => resetTimerSeconds(20)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-white/5 flex items-center space-x-1">
                            <RotateCcw className="w-3.5 h-3.5" /><span>Reset 20s</span>
                          </button>
                          <button onClick={undoLastBid} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-500 text-xs font-bold rounded-lg border border-white/5">
                            Annulla Rilancio
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* NOMINATION BLOCK */
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 md:p-8 shadow-xl flex flex-col shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/5">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">Chiamata Giocatore</h2>
                    <p className="text-xs md:text-sm text-zinc-400 mt-1">
                      {isMyCallingTurn 
                        ? "È il tuo turno. Cerca un giocatore e apri l'asta." 
                        : `Turno di ${activeCaller?.teamName || 'un altro manager'}.`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 bg-zinc-950 p-1.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase ml-1">Filtro:</span>
                    <span className="text-xs bg-white text-zinc-950 px-2 py-0.5 rounded-md font-bold">
                      {currentPhaseConfig.allowedRoles.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="my-5">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cerca nome o squadra (es. Jokic, DEN)..."
                      className="w-full pl-12 pr-4 py-3.5 bg-zinc-950 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {availablePlayers.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-sm">
                      Nessun giocatore disponibile con questi filtri.
                    </div>
                  ) : (
                    availablePlayers.map((player) => {
                      const isSelected = selectedNominee?.id === player.id;
                      return (
                        <div
                          key={player.id}
                          onClick={() => setSelectedNominee(player)}
                          className={`p-3 md:p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                            isSelected 
                              ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm' 
                              : 'bg-zinc-950 border-white/5 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <span className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center border ${
                              player.role === 'G' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              player.role === 'F' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}>
                              {player.role}
                            </span>
                            <div>
                              <p className="font-bold text-sm text-white group-hover:text-amber-500 transition-colors">{player.name}</p>
                              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{player.team} • {player.tier}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right hidden sm:block">
                              <span className="text-[10px] text-zinc-500 block uppercase font-semibold tracking-wider">Base</span>
                              <span className="text-sm font-bold text-amber-500">{player.basePrice} cr</span>
                            </div>
                            <span className="text-sm font-bold text-amber-500 sm:hidden">{player.basePrice}</span>
                            
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-amber-500 border-amber-500 text-zinc-950' : 'border-zinc-700'
                            }`}>
                              {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Call to Action Sticky Area */}
                {selectedNominee && (
                  <div className="mt-5 pt-4 border-t border-white/5 bg-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="text-center md:text-left w-full md:w-auto">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Selezionato</span>
                      <h4 className="text-base font-bold text-white truncate max-w-[250px]">{selectedNominee.name}</h4>
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto">
                      <div className="flex items-center space-x-2 bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 h-[46px]">
                        <label className="text-[11px] text-zinc-400 font-bold uppercase">Base:</label>
                        <input
                          type="number"
                          min="1"
                          value={openingBid}
                          onChange={(e) => setOpeningBid(e.target.value)}
                          className="w-12 bg-transparent text-amber-500 font-black text-base text-center focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleStartNomination}
                        disabled={!isMyCallingTurn && !isAdmin}
                        className={`flex-1 md:flex-initial h-[46px] px-6 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
                          isMyCallingTurn || isAdmin
                            ? 'bg-white hover:bg-zinc-200 text-zinc-950 shadow-md active:scale-95' 
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Apri Asta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LOWER CONTENT: Event History Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0 mt-auto">
              
              {/* LIVE BID HISTORY */}
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm flex flex-col h-[280px]">
                <h3 className="font-bold text-sm text-zinc-200 flex items-center space-x-2 mb-4 shrink-0">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Cronologia Rilanci</span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {roomData.currentAuction?.bidHistory?.length > 0 ? (
                    roomData.currentAuction.bidHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl flex items-center justify-between text-xs transition-colors ${
                          idx === 0 
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' 
                            : 'bg-zinc-950 border border-white/5 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-[10px] opacity-60">{item.time}</span>
                          <span className={`font-semibold ${idx === 0 ? 'text-amber-500' : 'text-zinc-200'}`}>{item.bidderName}</span>
                          {idx === 0 && <span className="text-[9px] bg-amber-500 text-zinc-950 px-1.5 py-0.5 rounded font-black hidden sm:inline">LEADER</span>}
                        </div>
                        <span className="font-mono text-sm font-black">{item.amount} cr</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                      Nessun rilancio in corso...
                    </div>
                  )}
                </div>
              </div>

              {/* COMPLETED AUCTIONS HISTORY */}
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm flex flex-col h-[280px]">
                <h3 className="font-bold text-sm text-zinc-200 flex items-center space-x-2 mb-4 shrink-0">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>Ultime Assegnazioni</span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {roomData.completedAuctions?.length > 0 ? (
                    roomData.completedAuctions.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl flex items-center justify-between text-xs bg-zinc-950 border border-white/5 group">
                        <div className="flex items-start space-x-3">
                          <span className="font-mono text-[10px] text-zinc-500 mt-0.5">{item.time}</span>
                          <div>
                            <p className="text-zinc-200 font-bold group-hover:text-emerald-400 transition-colors">{item.playerName}</p>
                            <p className="text-[10px] text-zinc-500 font-medium">Assegnato a <span className="text-emerald-500 font-bold">{item.winnerName}</span></p>
                          </div>
                        </div>
                        <span className="font-mono text-sm font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">{item.price} cr</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                      Ancora nessuna assegnazione.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT SIDEBAR (Desktop) / ACTIVE CONTENT (Mobile via Tab routing) */}
          <div className={`w-full md:w-[350px] lg:w-[420px] flex-col gap-6 md:overflow-y-auto custom-scrollbar md:pr-2 shrink-0 ${
            activeTab === 'auction' ? 'hidden md:flex' : 
            activeTab === 'admin' ? 'hidden' : // Hide this sidebar in pure Admin view
            'flex flex-1 md:flex-initial'
          }`}>
            
            {/* Show specific mobile tabs content if not on auction */}
            {activeTab !== 'auction' && (
              <div className="md:hidden w-full flex-1">
                 {/* Mobile Specific Tab Routing Content inside sidebar wrapper area */}
                 {activeTab === 'rosters' && <MobileRostersView roomData={roomData} />}
                 {activeTab === 'stats' && <MobileStatsView roomData={roomData} />}
              </div>
            )}

            {/* SIDEBAR WIDGETS (Only shown naturally on desktop, or hidden when mobile tabs are active) */}
            <div className={`flex-col gap-6 ${activeTab === 'auction' ? 'flex' : 'hidden md:flex'}`}>
              
              {/* CURRENT USER SQUAD SUMMARY */}
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">La Tua Rosa</span>
                    <h3 className="font-bold text-base text-white truncate max-w-[150px]">{currentParticipant?.teamName}</h3>
                  </div>
                  <div className="text-right bg-zinc-950 border border-white/5 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Budget</span>
                    <span className="text-lg font-black text-emerald-500 leading-none">{currentParticipant?.credits || 0}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'G', label: 'Guardie', color: 'blue' },
                    { key: 'F', label: 'Ali', color: 'emerald' },
                    { key: 'C', label: 'Centri', color: 'purple' }
                  ].map(role => {
                    const players = currentParticipant?.roster.filter(p => p.role === role.key) || [];
                    const max = ROSTER_SLOT_SCHEMA[role.key].total;
                    const isFull = players.length >= max;

                    return (
                      <div key={role.key} className="bg-zinc-950 border border-white/5 p-3 rounded-xl">
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className={`font-bold text-${role.color}-400`}>{role.label}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isFull ? 'bg-zinc-800 text-zinc-300' : 'bg-white/5 text-zinc-400'}`}>
                            {players.length} / {max}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {players.map((p, i) => (
                            <div key={i} className="flex justify-between items-center text-xs group">
                              <span className="text-zinc-300 font-medium truncate max-w-[180px]">{p.name} <span className="text-[10px] text-zinc-600 ml-1">({p.team})</span></span>
                              <span className="text-amber-500 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">{p.acquiredPrice}</span>
                            </div>
                          ))}
                          {[...Array(Math.max(0, max - players.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="h-6 flex items-center border border-dashed border-white/5 rounded-md px-2 opacity-50">
                              <span className="text-[10px] text-zinc-600 font-medium">Slot vuoto</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-zinc-400 font-medium">
                  <span>Totale Roster</span>
                  <span className="font-bold text-white px-2 py-1 bg-zinc-800 rounded-md border border-white/5">{currentParticipant?.roster.length || 0} / {TOTAL_ROSTER_SIZE}</span>
                </div>
              </div>

              {/* PARTICIPANTS LIST */}
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-sm text-zinc-200 flex items-center space-x-2 mb-4">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span>Lega ({roomData.participants.length}/{roomData.maxUsers})</span>
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {roomData.participants.map((m, idx) => {
                    const isTurn = roomData.activeCallerIndex === idx;
                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isTurn 
                            ? 'bg-amber-500/10 border-amber-500/30' 
                            : 'bg-zinc-950 border-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${isTurn ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                            {idx + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-bold truncate max-w-[120px] lg:max-w-[150px] ${isTurn ? 'text-amber-500' : 'text-zinc-200'}`}>
                              {m.teamName}
                            </span>
                            <span className="text-[10px] text-zinc-500">{m.roster.length}/{TOTAL_ROSTER_SIZE} acq.</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">{m.credits} cr</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* ADMIN FULL WIDTH TAB CONTENT (Desktop & Mobile) */}
          {activeTab === 'admin' && isAdmin && (
            <div className="flex-1 overflow-y-auto custom-scrollbar md:pr-4">
              <AdminView 
                roomData={roomData} 
                db={db} 
                roomCode={roomCode} 
                PHASES={PHASES} 
                setAuctionPhase={setAuctionPhase}
                toggleTurnDirection={toggleTurnDirection}
                forcePassTurn={forcePassTurn}
                removeManager={removeManager}
                deleteRoom={deleteRoom}
              />
            </div>
          )}

          {/* DESKTOP FULL WIDTH ROSTER / STATS VIEWS (When actively clicked on Desktop) */}
          {activeTab === 'rosters' && <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar md:pr-4"><MobileRostersView roomData={roomData} isDesktop={true} /></div>}
          {activeTab === 'stats' && <div className="hidden md:block flex-1 overflow-y-auto custom-scrollbar md:pr-4"><MobileStatsView roomData={roomData} isDesktop={true} /></div>}

        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around z-40 px-2 pb-safe">
        {[
          { id: 'auction', icon: Flame, label: 'Asta' },
          { id: 'rosters', icon: Users, label: 'Rose' },
          { id: 'stats', icon: BarChart3, label: 'Stats' },
          ...(isAdmin ? [{ id: 'admin', icon: Settings, label: 'Host' }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === tab.id ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'fill-amber-500/20' : ''}`} />
            <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* MODALS */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-800 rounded-full p-1.5 transition">
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="font-black text-xl text-white mb-2">Invita Manager</h3>
            <p className="text-xs text-zinc-400 mb-6">
              I partecipanti possono scansionare o inserire il codice per collegarsi.
            </p>
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  window.location.origin + window.location.pathname + `?room=${roomData.code}`
                )}`}
                alt="QR Code Stanza"
                className="w-40 h-40"
              />
            </div>
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 mb-6">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Codice Stanza</span>
              <span className="font-mono text-2xl font-black text-white tracking-widest">{roomData.code}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomData.code);
                showNotice("Codice stanza copiato!");
                setShowQRModal(false);
              }}
              className="w-full py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl text-sm transition-all"
            >
              Copia Codice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   SUB-COMPONENTS FOR TAB VIEWS (Keeps App.jsx modular but single-file)
   ========================================================================= */

function MobileRostersView({ roomData, isDesktop = false }) {
  return (
    <div className={`space-y-6 ${!isDesktop ? 'pb-24' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Tutte le Rose</h2>
          <p className="text-xs text-zinc-400 mt-1">Panoramica roster e budget di tutta la lega.</p>
        </div>
        <button
          onClick={() => {
            const exportJson = JSON.stringify(roomData.participants, null, 2);
            navigator.clipboard.writeText(exportJson);
            // Quick native alert since we don't have access to showNotice here easily without prop drilling
            alert("Riepilogo Rose copiato negli appunti (JSON)!"); 
          }}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-white/5 flex items-center space-x-2 w-max"
        >
          <Download className="w-4 h-4 text-amber-500" />
          <span>Esporta JSON</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {roomData.participants.map((manager) => {
          const totalSpent = manager.roster.reduce((acc, p) => acc + (p.acquiredPrice || 0), 0);
          return (
            <div key={manager.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-start pb-4 border-b border-white/5 mb-4">
                <div>
                  <h3 className="font-black text-lg text-white">{manager.teamName}</h3>
                  <p className="text-[11px] text-zinc-400 font-medium">{manager.name}</p>
                </div>
                <div className="text-right bg-zinc-950 border border-white/5 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Budget</span>
                  <span className="text-lg font-black text-emerald-500 leading-none">{manager.credits}</span>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {manager.roster.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-xs italic bg-zinc-950 rounded-xl border border-dashed border-white/5">
                    Nessun acquisto
                  </div>
                ) : (
                  manager.roster.map((player, pIdx) => (
                    <div key={pIdx} className="bg-zinc-950 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-md font-black text-[10px] flex items-center justify-center border ${
                          player.role === 'G' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          player.role === 'F' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}>
                          {player.role}
                        </span>
                        <div className="flex flex-col">
                           <span className="font-bold text-zinc-200">{player.name}</span>
                           <span className="text-zinc-500 font-medium text-[10px]">{player.team}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">{player.acquiredPrice} cr</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-[11px] text-zinc-400 font-medium">
                <span>Spesa: <strong className="text-zinc-200">{totalSpent} cr</strong></span>
                <span>Slot: <strong className="text-white bg-zinc-800 px-1.5 py-0.5 rounded">{manager.roster.length} / 13</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileStatsView({ roomData, isDesktop = false }) {
  const allBought = roomData.participants.flatMap(p => p.roster);
  const guardsBought = allBought.filter(p => p.role === 'G');
  const forwardsBought = allBought.filter(p => p.role === 'F');
  const centersBought = allBought.filter(p => p.role === 'C');

  const avgG = guardsBought.length ? (guardsBought.reduce((a, b) => a + b.acquiredPrice, 0) / guardsBought.length).toFixed(1) : '0';
  const avgF = forwardsBought.length ? (forwardsBought.reduce((a, b) => a + b.acquiredPrice, 0) / forwardsBought.length).toFixed(1) : '0';
  const avgC = centersBought.length ? (centersBought.reduce((a, b) => a + b.acquiredPrice, 0) / centersBought.length).toFixed(1) : '0';

  const topPurchases = [...allBought].sort((a, b) => b.acquiredPrice - a.acquiredPrice).slice(0, 10);

  return (
    <div className={`space-y-6 ${!isDesktop ? 'pb-24' : ''}`}>
      <div>
        <h2 className="text-2xl font-black text-white">Analisi Asta</h2>
        <p className="text-xs text-zinc-400 mt-1">Dati aggregati su spesa e record in tempo reale.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mb-2">Media Guardie</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{avgG} <span className="text-sm text-zinc-500 font-medium">cr</span></span>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-950 px-2 py-1 rounded-md border border-white/5">{guardsBought.length} acq.</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-2">Media Ali</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{avgF} <span className="text-sm text-zinc-500 font-medium">cr</span></span>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-950 px-2 py-1 rounded-md border border-white/5">{forwardsBought.length} acq.</span>
          </div>
        </div>
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm col-span-2 md:col-span-1">
          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest block mb-2">Media Centri</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{avgC} <span className="text-sm text-zinc-500 font-medium">cr</span></span>
            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-950 px-2 py-1 rounded-md border border-white/5">{centersBought.length} acq.</span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 md:p-6 shadow-sm">
        <h3 className="font-bold text-sm text-white mb-5 flex items-center space-x-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Top 10 Acquisti Più Costosi</span>
        </h3>
        <div className="space-y-2">
          {topPurchases.length === 0 ? (
            <div className="text-center py-8 text-zinc-600 text-xs italic bg-zinc-950 rounded-xl border border-dashed border-white/5">
              Nessun acquisto
            </div>
          ) : (
            topPurchases.map((player, idx) => (
              <div key={idx} className="bg-zinc-950 p-3 md:p-4 rounded-xl border border-white/5 flex items-center justify-between group">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <span className="font-mono font-black text-zinc-600 w-4 md:w-6 text-right text-xs md:text-sm">{idx + 1}°</span>
                  <span className={`w-6 h-6 md:w-8 md:h-8 rounded-lg text-[10px] md:text-xs font-black flex items-center justify-center border shrink-0 ${
                    player.role === 'G' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    player.role === 'F' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {player.role}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-zinc-200">{player.name}</p>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{player.team}</p>
                  </div>
                </div>
                <span className="font-mono text-sm md:text-base font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg">{player.acquiredPrice} cr</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AdminView({ roomData, db, roomCode, PHASES, setAuctionPhase, toggleTurnDirection, forcePassTurn, removeManager, deleteRoom }) {
  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
        <div>
          <h2 className="text-2xl font-black text-red-500 flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6" />
            <span>Pannello Host</span>
          </h2>
          <p className="text-xs text-red-400/80 mt-1">Controllo totale su fasi, tempo, turni e crediti della stanza.</p>
        </div>
        <button
          onClick={deleteRoom}
          className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/30 flex items-center space-x-2 transition text-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>Elimina Stanza</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Phase Switcher */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Fase d'Asta</h3>
            <p className="text-[11px] text-zinc-400 mt-1">Il sistema blocca in automatico i ruoli non permessi.</p>
          </div>
          <div className="space-y-2">
            {PHASES.map((p) => {
              const isCurrent = roomData.phase === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setAuctionPhase(p.id)}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between text-xs font-bold transition-all ${
                    isCurrent 
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-sm ring-1 ring-amber-500/50' 
                      : 'bg-zinc-950 border-white/5 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span>{p.name}</span>
                  {isCurrent && <span className="bg-amber-500 text-zinc-950 px-2 py-0.5 rounded text-[9px] uppercase font-black">Attiva</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Turn & Rotation */}
        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
             <h3 className="font-bold text-white text-base">Gestione Rotazione</h3>
             <p className="text-[11px] text-zinc-400 mt-1">Controlla chi chiama il prossimo giocatore.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-white/5">
              <div>
                <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider mb-1">Senso Giro</span>
                <span className="text-sm font-bold text-white">
                  {roomData.turnDirection === 'clockwise' ? 'Orario (1 → 2 → 3)' : 'Antiorario (3 → 2 → 1)'}
                </span>
              </div>
              <button onClick={toggleTurnDirection} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-500 text-xs font-bold rounded-lg border border-white/5 transition">
                Inverti
              </button>
            </div>
            <button onClick={forcePassTurn} className="w-full py-4 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl border border-white/5 flex items-center justify-center space-x-2 transition">
              <FastForward className="w-4 h-4 text-amber-500" />
              <span>Forza Passaggio Turno</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Budget Editor */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-sm">
        <div className="mb-5">
           <h3 className="font-bold text-white text-base">Modifica Manuale Manager</h3>
           <p className="text-[11px] text-zinc-400 mt-1">Correggi crediti o espelli manager (i giocatori torneranno liberi).</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roomData.participants.map((m) => (
            <div key={m.id} className="p-4 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm">{m.teamName}</span>
                <span className="text-[10px] text-zinc-500 font-medium">{m.name}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                   <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Crediti</label>
                   <input
                     type="number"
                     value={m.credits}
                     onChange={async (e) => {
                       const val = parseInt(e.target.value) || 0;
                       try {
                         const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
                         await runTransaction(db, async (transaction) => {
                           const snap = await transaction.get(roomDocRef);
                           if(snap.exists()) {
                             const currentParts = snap.data().participants || [];
                             const pIdx = currentParts.findIndex(p => p.id === m.id);
                             if(pIdx > -1) {
                               currentParts[pIdx].credits = val;
                               transaction.update(roomDocRef, { participants: currentParts });
                             }
                           }
                         });
                       } catch(err) {}
                     }}
                     className="w-16 px-2 py-1.5 bg-zinc-900 border border-white/10 rounded-md text-amber-500 font-mono font-bold text-center focus:outline-none focus:border-amber-500 text-sm"
                   />
                </div>
                <button onClick={() => removeManager(m.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 transition mt-3" title="Espelli">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}