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
  getFirestore, doc, setDoc, getDoc, onSnapshot
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
  },
  {
    "First Name": "Victor",
    "Last Name": "Wembanyama",
    "Position": "Center",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "28,0",
    "Cr": ""
  },
  {
    "First Name": "Luka",
    "Last Name": "Doncic",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "27,0",
    "Cr": ""
  },
  {
    "First Name": "Giannis",
    "Last Name": "Antetokounmpo",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "25,0",
    "Cr": ""
  },
  {
    "First Name": "Shai",
    "Last Name": "Gilgeous-Alexander",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "22,0",
    "Cr": ""
  },
  {
    "First Name": "Cade",
    "Last Name": "Cunningham",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "21,0",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Johnson",
    "Position": "Forward",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "19,0",
    "Cr": ""
  },
  {
    "First Name": "Jayson",
    "Last Name": "Tatum",
    "Position": "Forward",
    "Team": "Boston Celtics",
    "Cr 26/27": "18,0",
    "Cr": ""
  },
  {
    "First Name": "Joel",
    "Last Name": "Embiid",
    "Position": "Center",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "18,0",
    "Cr": ""
  },
  {
    "First Name": "Domantas",
    "Last Name": "Sabonis",
    "Position": "Center",
    "Team": "Sacramento Kings",
    "Cr 26/27": "18,0",
    "Cr": ""
  },
  {
    "First Name": "Alperen",
    "Last Name": "Sengun",
    "Position": "Center",
    "Team": "Houston Rockets",
    "Cr 26/27": "17,5",
    "Cr": ""
  },
  {
    "First Name": "Scottie",
    "Last Name": "Barnes",
    "Position": "Forward",
    "Team": "Toronto Raptors",
    "Cr 26/27": "17,0",
    "Cr": ""
  },
  {
    "First Name": "Tyrese",
    "Last Name": "Maxey",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "17,0",
    "Cr": ""
  },
  {
    "First Name": "Karl-anthony",
    "Last Name": "Towns",
    "Position": "Center",
    "Team": "New York Knicks",
    "Cr 26/27": "16,5",
    "Cr": ""
  },
  {
    "First Name": "Anthony",
    "Last Name": "Edwards",
    "Position": "Guard",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "16,5",
    "Cr": ""
  },
  {
    "First Name": "Cooper",
    "Last Name": "Flagg",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "16,5",
    "Cr": ""
  },
  {
    "First Name": "Anthony",
    "Last Name": "Davis",
    "Position": "Forward",
    "Team": "Washington Wizards",
    "Cr 26/27": "16,0",
    "Cr": ""
  },
  {
    "First Name": "Kevin",
    "Last Name": "Durant",
    "Position": "Forward",
    "Team": "Houston Rockets",
    "Cr 26/27": "16,0",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Brunson",
    "Position": "Guard",
    "Team": "New York Knicks",
    "Cr 26/27": "16,0",
    "Cr": ""
  },
  {
    "First Name": "LeBron",
    "Last Name": "James",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "16,0",
    "Cr": ""
  },
  {
    "First Name": "Josh",
    "Last Name": "Giddey",
    "Position": "Guard",
    "Team": "Chicago Bulls",
    "Cr 26/27": "15,5",
    "Cr": ""
  },
  {
    "First Name": "Trae",
    "Last Name": "Young",
    "Position": "Guard",
    "Team": "Washington Wizards",
    "Cr 26/27": "15,5",
    "Cr": ""
  },
  {
    "First Name": "Kawhi",
    "Last Name": "Leonard",
    "Position": "Forward",
    "Team": "Toronto Raptors",
    "Cr 26/27": "15,0",
    "Cr": ""
  },
  {
    "First Name": "Amen",
    "Last Name": "Thompson",
    "Position": "Guard",
    "Team": "Houston Rockets",
    "Cr 26/27": "15,0",
    "Cr": ""
  },
  {
    "First Name": "Stephen",
    "Last Name": "Curry",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "15,0",
    "Cr": ""
  },
  {
    "First Name": "Bam",
    "Last Name": "Adebayo",
    "Position": "Center",
    "Team": "Miami Heat",
    "Cr 26/27": "15,0",
    "Cr": ""
  },
  {
    "First Name": "Jamal",
    "Last Name": "Murray",
    "Position": "Guard",
    "Team": "Denver Nuggets",
    "Cr 26/27": "14,5",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Duren",
    "Position": "Center",
    "Team": "Detroit Pistons",
    "Cr 26/27": "14,5",
    "Cr": ""
  },
  {
    "First Name": "Tyrese",
    "Last Name": "Haliburton",
    "Position": "Guard",
    "Team": "Indiana Pacers",
    "Cr 26/27": "14,5",
    "Cr": ""
  },
  {
    "First Name": "Lamelo",
    "Last Name": "Ball",
    "Position": "Guard",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "14,5",
    "Cr": ""
  },
  {
    "First Name": "Deni",
    "Last Name": "Avdija",
    "Position": "Forward",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "14,5",
    "Cr": ""
  },
  {
    "First Name": "Austin",
    "Last Name": "Reaves",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "14,5",
    "Cr": ""
  },
  {
    "First Name": "Julius",
    "Last Name": "Randle",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "14,5",
    "Cr": ""
  },
  {
    "First Name": "Evan",
    "Last Name": "Mobley",
    "Position": "Forward",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "14,0",
    "Cr": ""
  },
  {
    "First Name": "Paolo",
    "Last Name": "Banchero",
    "Position": "Forward",
    "Team": "Orlando Magic",
    "Cr 26/27": "14,0",
    "Cr": ""
  },
  {
    "First Name": "Jaylen",
    "Last Name": "Brown",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "14,0",
    "Cr": ""
  },
  {
    "First Name": "AJ",
    "Last Name": "Dybantsa",
    "Position": "Forward",
    "Team": "Washington Wizards",
    "Cr 26/27": "14,0",
    "Cr": ""
  },
  {
    "First Name": "James",
    "Last Name": "Harden",
    "Position": "Guard",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "14,0",
    "Cr": ""
  },
  {
    "First Name": "Donovan",
    "Last Name": "Mitchell",
    "Position": "Guard",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "14,0",
    "Cr": ""
  },
  {
    "First Name": "Devin",
    "Last Name": "Booker",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "14,0",
    "Cr": ""
  },
  {
    "First Name": "Caleb",
    "Last Name": "Wilson",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "13,5",
    "Cr": ""
  },
  {
    "First Name": "Chet",
    "Last Name": "Holmgren",
    "Position": "Forward",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "13,5",
    "Cr": ""
  },
  {
    "First Name": "Michael",
    "Last Name": "Porter Jr",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "13,0",
    "Cr": ""
  },
  {
    "First Name": "Darius",
    "Last Name": "Garland",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "13,0",
    "Cr": ""
  },
  {
    "First Name": "Donovan",
    "Last Name": "Clingan",
    "Position": "Center",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "13,0",
    "Cr": ""
  },
  {
    "First Name": "Damian",
    "Last Name": "Lillard",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "13,0",
    "Cr": ""
  },
  {
    "First Name": "Stephon",
    "Last Name": "Castle",
    "Position": "Guard",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "13,0",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Williams",
    "Position": "Forward",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "13,0",
    "Cr": ""
  },
  {
    "First Name": "Ja",
    "Last Name": "Morant",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "13,0",
    "Cr": ""
  },
  {
    "First Name": "Darryn",
    "Last Name": "Peterson",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "12,5",
    "Cr": ""
  },
  {
    "First Name": "Lauri",
    "Last Name": "Markkanen",
    "Position": "Forward",
    "Team": "Utah Jazz",
    "Cr 26/27": "12,5",
    "Cr": ""
  },
  {
    "First Name": "Jarrett",
    "Last Name": "Allen",
    "Position": "Center",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "12,5",
    "Cr": ""
  },
  {
    "First Name": "Cameron",
    "Last Name": "Boozer",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "12,5",
    "Cr": ""
  },
  {
    "First Name": "Og",
    "Last Name": "Anunoby",
    "Position": "Forward",
    "Team": "New York Knicks",
    "Cr 26/27": "12,5",
    "Cr": ""
  },
  {
    "First Name": "Pascal",
    "Last Name": "Siakam",
    "Position": "Forward",
    "Team": "Indiana Pacers",
    "Cr 26/27": "12,5",
    "Cr": ""
  },
  {
    "First Name": "Ivica",
    "Last Name": "Zubac",
    "Position": "Center",
    "Team": "Indiana Pacers",
    "Cr 26/27": "12,5",
    "Cr": ""
  },
  {
    "First Name": "Zion",
    "Last Name": "Williamson",
    "Position": "Forward",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "12,5",
    "Cr": ""
  },
  {
    "First Name": "Kyrie",
    "Last Name": "Irving",
    "Position": "Guard",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Dyson",
    "Last Name": "Daniels",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Onyeka",
    "Last Name": "Okongwu",
    "Position": "Center",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Tyler",
    "Last Name": "Herro",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Dejounte",
    "Last Name": "Murray",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Josh",
    "Last Name": "Hart",
    "Position": "Forward",
    "Team": "New York Knicks",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Franz",
    "Last Name": "Wagner",
    "Position": "Forward",
    "Team": "Orlando Magic",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Vj",
    "Last Name": "Edgecombe",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Jaren",
    "Last Name": "Jackson Jr",
    "Position": "Forward",
    "Team": "Utah Jazz",
    "Cr 26/27": "12,0",
    "Cr": ""
  },
  {
    "First Name": "Payton",
    "Last Name": "Pritchard",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "11,5",
    "Cr": ""
  },
  {
    "First Name": "Paul",
    "Last Name": "George",
    "Position": "Forward",
    "Team": "Boston Celtics",
    "Cr 26/27": "11,5",
    "Cr": ""
  },
  {
    "First Name": "Trey",
    "Last Name": "Murphy III",
    "Position": "Forward",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "11,5",
    "Cr": ""
  },
  {
    "First Name": "Ryan",
    "Last Name": "Rollins",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "11,5",
    "Cr": ""
  },
  {
    "First Name": "Rudy",
    "Last Name": "Gobert",
    "Position": "Center",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "11,5",
    "Cr": ""
  },
  {
    "First Name": "Desmond",
    "Last Name": "Bane",
    "Position": "Guard",
    "Team": "Orlando Magic",
    "Cr 26/27": "11,5",
    "Cr": ""
  },
  {
    "First Name": "Keyonte",
    "Last Name": "George",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "11,5",
    "Cr": ""
  },
  {
    "First Name": "Nickeil",
    "Last Name": "Alexander-Walker",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Mike",
    "Last Name": "Brown",
    "Position": "Head Coach",
    "Team": "New York Knicks",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Mark",
    "Last Name": "Daigneault",
    "Position": "Head Coach",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Mitch",
    "Last Name": "Johnson",
    "Position": "Head Coach",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Neemias",
    "Last Name": "Queta",
    "Position": "Center",
    "Team": "Boston Celtics",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Brandon",
    "Last Name": "Miller",
    "Position": "Forward",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Kon",
    "Last Name": "Knueppel",
    "Position": "Guard",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Matas",
    "Last Name": "Buzelis",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "De'Aaron",
    "Last Name": "Fox",
    "Position": "Guard",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Miles",
    "Last Name": "Bridges",
    "Position": "Forward",
    "Team": "Phoenix Suns",
    "Cr 26/27": "11,0",
    "Cr": ""
  },
  {
    "First Name": "Derrick",
    "Last Name": "White",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "10,5",
    "Cr": ""
  },
  {
    "First Name": "Brandin",
    "Last Name": "Podziemski",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "10,5",
    "Cr": ""
  },
  {
    "First Name": "Jabari",
    "Last Name": "Smith Jr",
    "Position": "Forward",
    "Team": "Houston Rockets",
    "Cr 26/27": "10,5",
    "Cr": ""
  },
  {
    "First Name": "Andrew",
    "Last Name": "Wiggins",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "10,5",
    "Cr": ""
  },
  {
    "First Name": "Isaiah",
    "Last Name": "Hartenstein",
    "Position": "Center",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "10,5",
    "Cr": ""
  },
  {
    "First Name": "Tobias",
    "Last Name": "Harris",
    "Position": "Forward",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "10,5",
    "Cr": ""
  },
  {
    "First Name": "Nick",
    "Last Name": "Nurse",
    "Position": "Head Coach",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "10,5",
    "Cr": ""
  },
  {
    "First Name": "Walker",
    "Last Name": "Kessler",
    "Position": "Center",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "10,5",
    "Cr": ""
  },
  {
    "First Name": "Nikola",
    "Last Name": "Vucevic",
    "Position": "Center",
    "Team": "Orlando Magic",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Kel'el",
    "Last Name": "Ware",
    "Position": "Center",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "CJ",
    "Last Name": "Mccollum",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Moussa",
    "Last Name": "Diabate",
    "Position": "Center",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Ausar",
    "Last Name": "Thompson",
    "Position": "Forward",
    "Team": "Detroit Pistons",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Andrew",
    "Last Name": "Nembhard",
    "Position": "Guard",
    "Team": "Indiana Pacers",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Brandon",
    "Last Name": "Ingram",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Kevin",
    "Last Name": "Porter Jr",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Ayo",
    "Last Name": "Dosunmu",
    "Position": "Guard",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Wendell",
    "Last Name": "Carter Jr",
    "Position": "Center",
    "Team": "Orlando Magic",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Maxime",
    "Last Name": "Raynaud",
    "Position": "Center",
    "Team": "Sacramento Kings",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Devin",
    "Last Name": "Vassell",
    "Position": "Guard",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Dylan",
    "Last Name": "Harper",
    "Position": "Guard",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "RJ",
    "Last Name": "Barrett",
    "Position": "Forward",
    "Team": "Toronto Raptors",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Immanuel",
    "Last Name": "Quickley",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Jusuf",
    "Last Name": "Nurkic",
    "Position": "Center",
    "Team": "Utah Jazz",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Fred",
    "Last Name": "Vanvleet",
    "Position": "Guard",
    "Team": "Houston Rockets",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "David",
    "Last Name": "Adelman",
    "Position": "Head Coach",
    "Team": "Denver Nuggets",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Chris",
    "Last Name": "Finch",
    "Position": "Head Coach",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Naz",
    "Last Name": "Reid",
    "Position": "Forward",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "10,0",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Green",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Mark",
    "Last Name": "Williams",
    "Position": "Center",
    "Team": "Phoenix Suns",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Nicolas",
    "Last Name": "Claxton",
    "Position": "Center",
    "Team": "Chicago Bulls",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "John",
    "Last Name": "Collins",
    "Position": "Forward",
    "Team": "Detroit Pistons",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Jimmy",
    "Last Name": "Butler",
    "Position": "Forward",
    "Team": "Golden State Warriors",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Cam",
    "Last Name": "Spencer",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Jaden",
    "Last Name": "Mcdaniels",
    "Position": "Forward",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Saddiq",
    "Last Name": "Bey",
    "Position": "Forward",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Mikal",
    "Last Name": "Bridges",
    "Position": "Forward",
    "Team": "New York Knicks",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Toumani",
    "Last Name": "Camara",
    "Position": "Forward",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Julian",
    "Last Name": "Champagnie",
    "Position": "Forward",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Jakob",
    "Last Name": "Poeltl",
    "Position": "Center",
    "Team": "Toronto Raptors",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Deandre",
    "Last Name": "Ayton",
    "Position": "Center",
    "Team": "Washington Wizards",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Kenny",
    "Last Name": "Atkinson",
    "Position": "Head Coach",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "J.B.",
    "Last Name": "Bickerstaff",
    "Position": "Head Coach",
    "Team": "Detroit Pistons",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Kyle",
    "Last Name": "Filipowski",
    "Position": "Center",
    "Team": "Utah Jazz",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Kristaps",
    "Last Name": "Porzingis",
    "Position": "Center",
    "Team": "Golden State Warriors",
    "Cr 26/27": "9,5",
    "Cr": ""
  },
  {
    "First Name": "Coby",
    "Last Name": "White",
    "Position": "Guard",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Davion",
    "Last Name": "Mitchell",
    "Position": "Guard",
    "Team": "Miami Heat",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Jaime",
    "Last Name": "Jaquez Jr",
    "Position": "Forward",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Suggs",
    "Position": "Guard",
    "Team": "Orlando Magic",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Tre",
    "Last Name": "Jones",
    "Position": "Guard",
    "Team": "Chicago Bulls",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Daniel",
    "Last Name": "Gafford",
    "Position": "Center",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "P.J.",
    "Last Name": "Washington",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Demar",
    "Last Name": "Derozan",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Cameron",
    "Last Name": "Johnson",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Gui",
    "Last Name": "Santos",
    "Position": "Forward",
    "Team": "Golden State Warriors",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Yaxel",
    "Last Name": "Lendeborg",
    "Position": "Forward",
    "Team": "Golden State Warriors",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Myles",
    "Last Name": "Turner",
    "Position": "Center",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Derik",
    "Last Name": "Queen",
    "Position": "Center",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Collin",
    "Last Name": "Gillespie",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Dillon",
    "Last Name": "Brooks",
    "Position": "Forward",
    "Team": "Phoenix Suns",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Jrue",
    "Last Name": "Holiday",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Precious",
    "Last Name": "Achiuwa",
    "Position": "Forward",
    "Team": "Sacramento Kings",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Darius",
    "Last Name": "Acuff Jr",
    "Position": "Guard",
    "Team": "Sacramento Kings",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Zach",
    "Last Name": "Edey",
    "Position": "Center",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Ime",
    "Last Name": "Udoka",
    "Position": "Head Coach",
    "Team": "Houston Rockets",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Erik",
    "Last Name": "Spoelstra",
    "Position": "Head Coach",
    "Team": "Miami Heat",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Norman",
    "Last Name": "Powell",
    "Position": "Guard",
    "Team": "Chicago Bulls",
    "Cr 26/27": "9,0",
    "Cr": ""
  },
  {
    "First Name": "Jordan",
    "Last Name": "Poole",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Jeremiah",
    "Last Name": "Fears",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Collin",
    "Last Name": "Murray-boyles",
    "Position": "Forward",
    "Team": "Toronto Raptors",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Mikel",
    "Last Name": "Brown Jr.",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Peyton",
    "Last Name": "Watson",
    "Position": "Guard",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Aaron",
    "Last Name": "Gordon",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Christian",
    "Last Name": "Braun",
    "Position": "Guard",
    "Team": "Denver Nuggets",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Tari",
    "Last Name": "Eason",
    "Position": "Forward",
    "Team": "Houston Rockets",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Jerami",
    "Last Name": "Grant",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Cason",
    "Last Name": "Wallace",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Ace",
    "Last Name": "Bailey",
    "Position": "Forward",
    "Team": "Utah Jazz",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Isaiah",
    "Last Name": "Collier",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Dereck",
    "Last Name": "Lively II",
    "Position": "Center",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Quin",
    "Last Name": "Snyder",
    "Position": "Head Coach",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Rick",
    "Last Name": "Carlisle",
    "Position": "Head Coach",
    "Team": "Indiana Pacers",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Rui",
    "Last Name": "Hachimura",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Alex",
    "Last Name": "Sarr",
    "Position": "Center",
    "Team": "Washington Wizards",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Day'ron",
    "Last Name": "Sharpe",
    "Position": "Center",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Bradley",
    "Last Name": "Beal",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "8,5",
    "Cr": ""
  },
  {
    "First Name": "Dennis",
    "Last Name": "Schroder",
    "Position": "Guard",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "8,2",
    "Cr": ""
  },
  {
    "First Name": "Shaedon",
    "Last Name": "Sharpe",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Kelly",
    "Last Name": "Oubre Jr",
    "Position": "Forward",
    "Team": "Indiana Pacers",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Keaton",
    "Last Name": "Wagler",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Santi",
    "Last Name": "Aldama",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Royce",
    "Last Name": "O'Neale",
    "Position": "Forward",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Ajay",
    "Last Name": "Mitchell",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Brice",
    "Last Name": "Sensabaugh",
    "Position": "Forward",
    "Team": "Utah Jazz",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Carlton",
    "Last Name": "Carrington",
    "Position": "Guard",
    "Team": "Washington Wizards",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Cedric",
    "Last Name": "Coward",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Donte",
    "Last Name": "DiVincenzo",
    "Position": "Guard",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Naji",
    "Last Name": "Marshall",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Draymond",
    "Last Name": "Green",
    "Position": "Forward",
    "Team": "Golden State Warriors",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Brook",
    "Last Name": "Lopez",
    "Position": "Center",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Bobby",
    "Last Name": "Portis",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Bennedict",
    "Last Name": "Mathurin",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Robert",
    "Last Name": "Williams III",
    "Position": "Center",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Bilal",
    "Last Name": "Coulibaly",
    "Position": "Guard",
    "Team": "Washington Wizards",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Kyshawn",
    "Last Name": "George",
    "Position": "Forward",
    "Team": "Washington Wizards",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Scotty",
    "Last Name": "Pippen Jr",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "JJ",
    "Last Name": "Redick",
    "Position": "Head Coach",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Joe",
    "Last Name": "Mazzulla",
    "Position": "Head Coach",
    "Team": "Boston Celtics",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Darko",
    "Last Name": "Rajakovic",
    "Position": "Head Coach",
    "Team": "Toronto Raptors",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Keegan",
    "Last Name": "Murray",
    "Position": "Forward",
    "Team": "Sacramento Kings",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Anfernee",
    "Last Name": "Simons",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "8,0",
    "Cr": ""
  },
  {
    "First Name": "Oso",
    "Last Name": "Ighodaro",
    "Position": "Center",
    "Team": "Phoenix Suns",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Ryan",
    "Last Name": "Kalkbrenner",
    "Position": "Center",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Leonard",
    "Last Name": "Miller",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Jarace",
    "Last Name": "Walker",
    "Position": "Forward",
    "Team": "Indiana Pacers",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Olivier",
    "Last Name": "Maxence-Prosper",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Cody",
    "Last Name": "Williams",
    "Position": "Forward",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Max",
    "Last Name": "Christie",
    "Position": "Guard",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Kingston",
    "Last Name": "Flemings",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Aaron",
    "Last Name": "Nesmith",
    "Position": "Forward",
    "Team": "Indiana Pacers",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Morez",
    "Last Name": "Johnson",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Duncan",
    "Last Name": "Robinson",
    "Position": "Forward",
    "Team": "Detroit Pistons",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Moses",
    "Last Name": "Moody",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Reed",
    "Last Name": "Sheppard",
    "Position": "Guard",
    "Team": "Houston Rockets",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Kris",
    "Last Name": "Dunn",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Collin",
    "Last Name": "Sexton",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Sandro",
    "Last Name": "Mamukelashvili",
    "Position": "Forward",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Pelle",
    "Last Name": "Larsson",
    "Position": "Guard",
    "Team": "Miami Heat",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "A.J.",
    "Last Name": "Green",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Luke",
    "Last Name": "Kennard",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Zach",
    "Last Name": "Lavine",
    "Position": "Guard",
    "Team": "Sacramento Kings",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Justin",
    "Last Name": "Champagnie",
    "Position": "Guard",
    "Team": "Washington Wizards",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Ty",
    "Last Name": "Jerome",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Jason",
    "Last Name": "Kidd",
    "Position": "Head Coach",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Jamahl",
    "Last Name": "Mosley",
    "Position": "Head Coach",
    "Team": "Orlando Magic",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Tiago",
    "Last Name": "Splitter",
    "Position": "Head Coach",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Brian",
    "Last Name": "Keefe",
    "Position": "Head Coach",
    "Team": "Washington Wizards",
    "Cr 26/27": "7,5",
    "Cr": ""
  },
  {
    "First Name": "Quentin",
    "Last Name": "Grimes",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jay",
    "Last Name": "Huff",
    "Position": "Center",
    "Team": "Indiana Pacers",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Sam",
    "Last Name": "Hauser",
    "Position": "Forward",
    "Team": "Boston Celtics",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Brandon",
    "Last Name": "Williams",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Oscar",
    "Last Name": "Tshiebwe",
    "Position": "Center",
    "Team": "Houston Rockets",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "T.J.",
    "Last Name": "Mcconnell",
    "Position": "Guard",
    "Team": "Indiana Pacers",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jericho",
    "Last Name": "Sims",
    "Position": "Center",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Will",
    "Last Name": "Riley",
    "Position": "Forward",
    "Team": "Washington Wizards",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Marvin",
    "Last Name": "Bagley III",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Grayson",
    "Last Name": "Allen",
    "Position": "Guard",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Hannes",
    "Last Name": "Steinbach",
    "Position": "Center",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Smith",
    "Position": "Center",
    "Team": "Chicago Bulls",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Gary",
    "Last Name": "Payton II",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "De'Anthony",
    "Last Name": "Melton",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Marcus",
    "Last Name": "Smart",
    "Position": "Guard",
    "Team": "Houston Rockets",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jordan",
    "Last Name": "Miller",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Gregory",
    "Last Name": "Jackson",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jaylen",
    "Last Name": "Wells",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Kyle",
    "Last Name": "Kuzma",
    "Position": "Forward",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Brayden",
    "Last Name": "Burries",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Nate",
    "Last Name": "Ament",
    "Position": "Forward",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jonathan",
    "Last Name": "Kuminga",
    "Position": "Forward",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Anthony",
    "Last Name": "Black",
    "Position": "Guard",
    "Team": "Orlando Magic",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jordan",
    "Last Name": "Goodwin",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Nique",
    "Last Name": "Clifford",
    "Position": "Guard",
    "Team": "Sacramento Kings",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Ja'kobe",
    "Last Name": "Walter",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jake",
    "Last Name": "Laravia",
    "Position": "Forward",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Doc",
    "Last Name": "Rivers",
    "Position": "Head Coach",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Charles",
    "Last Name": "Lee",
    "Position": "Head Coach",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Steve",
    "Last Name": "Kerr",
    "Position": "Head Coach",
    "Team": "Golden State Warriors",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Jordan",
    "Last Name": "Ott",
    "Position": "Head Coach",
    "Team": "Phoenix Suns",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Ousmane",
    "Last Name": "Dieng",
    "Position": "Forward",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Yves",
    "Last Name": "Missi",
    "Position": "Center",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Aday",
    "Last Name": "Mara",
    "Position": "Center",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Keldon",
    "Last Name": "Johnson",
    "Position": "Forward",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Julian",
    "Last Name": "Reese",
    "Position": "Forward",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Keon",
    "Last Name": "Ellis",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "7,0",
    "Cr": ""
  },
  {
    "First Name": "Micah",
    "Last Name": "Potter",
    "Position": "Center",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Noah",
    "Last Name": "Clowney",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Al",
    "Last Name": "Horford",
    "Position": "Center",
    "Team": "Golden State Warriors",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Slawson",
    "Position": "Forward",
    "Team": "Indiana Pacers",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Derrick",
    "Last Name": "Jones Jr",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Javon",
    "Last Name": "Small",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Tim",
    "Last Name": "Hardaway Jr",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Alex",
    "Last Name": "Caruso",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Scoot",
    "Last Name": "Henderson",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Malik",
    "Last Name": "Monk",
    "Position": "Guard",
    "Team": "Sacramento Kings",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Dylan",
    "Last Name": "Cardwell",
    "Position": "Center",
    "Team": "Sacramento Kings",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Malachi",
    "Last Name": "Smith",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Jamal",
    "Last Name": "Shead",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Isaiah",
    "Last Name": "Stewart",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "De'Andre",
    "Last Name": "Hunter",
    "Position": "Forward",
    "Team": "Sacramento Kings",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Herbert",
    "Last Name": "Jones",
    "Position": "Forward",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Billy",
    "Last Name": "Donovan",
    "Position": "Head Coach",
    "Team": "Chicago Bulls",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Tyronn",
    "Last Name": "Lue",
    "Position": "Head Coach",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Will",
    "Last Name": "Hardy",
    "Position": "Head Coach",
    "Team": "Utah Jazz",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "James",
    "Last Name": "Borrego",
    "Position": "Head Coach",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Mitchell",
    "Last Name": "Robinson",
    "Position": "Center",
    "Team": "Boston Celtics",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Aaron",
    "Last Name": "Wiggins",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Jordan",
    "Last Name": "Walsh",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Nikola",
    "Last Name": "Jovic",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Jose",
    "Last Name": "Alvarado",
    "Position": "Guard",
    "Team": "New York Knicks",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Miles",
    "Last Name": "McBride",
    "Position": "Guard",
    "Team": "New York Knicks",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Adem",
    "Last Name": "Bona",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Jeremy",
    "Last Name": "Sochan",
    "Position": "Forward",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Kevin",
    "Last Name": "Huerter",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "6,5",
    "Cr": ""
  },
  {
    "First Name": "Jared",
    "Last Name": "Mccain",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "6,2",
    "Cr": ""
  },
  {
    "First Name": "Devin",
    "Last Name": "Carter",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Daniss",
    "Last Name": "Jenkins",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Paul",
    "Last Name": "Reed",
    "Position": "Forward",
    "Team": "Detroit Pistons",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Taurean",
    "Last Name": "Prince",
    "Position": "Forward",
    "Team": "Detroit Pistons",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Sharife",
    "Last Name": "Cooper",
    "Position": "Guard",
    "Team": "Washington Wizards",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Baylor",
    "Last Name": "Scheierman",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Jock",
    "Last Name": "Landale",
    "Position": "Center",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Egor",
    "Last Name": "Demin",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Danny",
    "Last Name": "Wolf",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Bruce",
    "Last Name": "Brown",
    "Position": "Guard",
    "Team": "Denver Nuggets",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Obi",
    "Last Name": "Toppin",
    "Position": "Forward",
    "Team": "Indiana Pacers",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Kobe",
    "Last Name": "Brown",
    "Position": "Forward",
    "Team": "Indiana Pacers",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Max",
    "Last Name": "Strus",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Klay",
    "Last Name": "Thompson",
    "Position": "Guard",
    "Team": "Miami Heat",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Kasparas",
    "Last Name": "Jakucionis",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Ben",
    "Last Name": "Simmons",
    "Position": "Guard",
    "Team": "Sacramento Kings",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Andre",
    "Last Name": "Drummond",
    "Position": "Center",
    "Team": "New York Knicks",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Jaylin",
    "Last Name": "Williams",
    "Position": "Forward",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Goga",
    "Last Name": "Bitadze",
    "Position": "Center",
    "Team": "Orlando Magic",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Tristan",
    "Last Name": "Da Silva",
    "Position": "Forward",
    "Team": "Orlando Magic",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Bez",
    "Last Name": "Mbeng",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Jaxson",
    "Last Name": "Hayes",
    "Position": "Center",
    "Team": "Utah Jazz",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Anthony",
    "Last Name": "Gill",
    "Position": "Forward",
    "Team": "Washington Wizards",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Khris",
    "Last Name": "Middleton",
    "Position": "Forward",
    "Team": "Washington Wizards",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Taylor",
    "Last Name": "Hendricks",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Isaiah",
    "Last Name": "Joe",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Carter",
    "Last Name": "Bryant",
    "Position": "Forward",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Jordi",
    "Last Name": "Fernandez",
    "Position": "Head Coach",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Tuomas",
    "Last Name": "Iisalo",
    "Position": "Head Coach",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Doug",
    "Last Name": "Christie",
    "Position": "Head Coach",
    "Team": "Sacramento Kings",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Luguentz",
    "Last Name": "Dort",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Hugo",
    "Last Name": "Gonzalez",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Michael",
    "Last Name": "Ajayi",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Steven",
    "Last Name": "Adams",
    "Position": "Center",
    "Team": "Houston Rockets",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Bogdan",
    "Last Name": "Bogdanovic",
    "Position": "Guard",
    "Team": "Houston Rockets",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Jordan",
    "Last Name": "Clarkson",
    "Position": "Guard",
    "Team": "New York Knicks",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Ebuka",
    "Last Name": "Okorie",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Mike",
    "Last Name": "Conley",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Simone",
    "Last Name": "Fontecchio",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Meleek",
    "Last Name": "Thomas",
    "Position": "Guard",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Svi",
    "Last Name": "Mykhailiuk",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "6,0",
    "Cr": ""
  },
  {
    "First Name": "Sergio",
    "Last Name": "De Larrea",
    "Position": "Guard",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Ryan",
    "Last Name": "Nembhard",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Nolan",
    "Last Name": "Traore",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Chaney",
    "Last Name": "Johnson",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "E.J.",
    "Last Name": "Liddell",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Ben",
    "Last Name": "Saraf",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Isaac",
    "Last Name": "Okoro",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Dailyn",
    "Last Name": "Swain",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Sam",
    "Last Name": "Merrill",
    "Position": "Guard",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Quenton",
    "Last Name": "Jackson",
    "Position": "Guard",
    "Team": "Indiana Pacers",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Ziaire",
    "Last Name": "Williams",
    "Position": "Forward",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Karim",
    "Last Name": "Lopez",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Karlo",
    "Last Name": "Matkovic",
    "Position": "Forward",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Bennett",
    "Last Name": "Stirtz",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Jayden",
    "Last Name": "Quaintance",
    "Position": "Forward",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Tre",
    "Last Name": "Johnson",
    "Position": "Guard",
    "Team": "Washington Wizards",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Jamir",
    "Last Name": "Watkins",
    "Position": "Forward",
    "Team": "Washington Wizards",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Cameron",
    "Last Name": "Carr",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Patrick",
    "Last Name": "Williams",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Zaccharie",
    "Last Name": "Risacher",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Clint",
    "Last Name": "Capela",
    "Position": "Center",
    "Team": "Houston Rockets",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Caleb",
    "Last Name": "Love",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "5,5",
    "Cr": ""
  },
  {
    "First Name": "Gabe",
    "Last Name": "Vincent",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "5,2",
    "Cr": ""
  },
  {
    "First Name": "Gradey",
    "Last Name": "Dick",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Mario",
    "Last Name": "Hezonja",
    "Position": "Forward",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Chris",
    "Last Name": "Cenac Jr.",
    "Position": "Forward",
    "Team": "Boston Celtics",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Josh",
    "Last Name": "Minott",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Terance",
    "Last Name": "Mann",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Christian",
    "Last Name": "Anderson",
    "Position": "Guard",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Spencer",
    "Last Name": "Jones",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Elijah",
    "Last Name": "Harkless",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Charles",
    "Last Name": "Bassey",
    "Position": "Center",
    "Team": "Golden State Warriors",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Ben",
    "Last Name": "Sheppard",
    "Position": "Guard",
    "Team": "Indiana Pacers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Kobe",
    "Last Name": "Sanders",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Isaiah",
    "Last Name": "Jackson",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Jaden",
    "Last Name": "Hardy",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Walter",
    "Last Name": "Clayton Jr.",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Jahmai",
    "Last Name": "Mashack",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Nick",
    "Last Name": "Richards",
    "Position": "Center",
    "Team": "Miami Heat",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Caris",
    "Last Name": "Levert",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Pete",
    "Last Name": "Nance",
    "Position": "Forward",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Jordan",
    "Last Name": "Hawkins",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Landry",
    "Last Name": "Shamet",
    "Position": "Guard",
    "Team": "New York Knicks",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Dominick",
    "Last Name": "Barlow",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Dean",
    "Last Name": "Wade",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Labaron",
    "Last Name": "Philon",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Pat",
    "Last Name": "Spencer",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Luke",
    "Last Name": "Kornet",
    "Position": "Center",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Blake",
    "Last Name": "Hinson",
    "Position": "Forward",
    "Team": "Utah Jazz",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Tristan",
    "Last Name": "Vukcevic",
    "Position": "Forward",
    "Team": "Washington Wizards",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Bronny",
    "Last Name": "James",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "D'angelo",
    "Last Name": "Russell",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Johni",
    "Last Name": "Broome",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Josh",
    "Last Name": "Green",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "5,0",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Wilson",
    "Position": "Forward",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Zuby",
    "Last Name": "Ejiofor",
    "Position": "Forward",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Luka",
    "Last Name": "Garza",
    "Position": "Center",
    "Team": "Boston Celtics",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Joshua",
    "Last Name": "Jefferson",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Grant",
    "Last Name": "Williams",
    "Position": "Forward",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Sion",
    "Last Name": "James",
    "Position": "Guard",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Rob",
    "Last Name": "Dillingham",
    "Position": "Guard",
    "Team": "Chicago Bulls",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Jaylon",
    "Last Name": "Tyson",
    "Position": "Guard",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Dwight",
    "Last Name": "Powell",
    "Position": "Center",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Moussa",
    "Last Name": "Cisse",
    "Position": "Center",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Georges",
    "Last Name": "Niang",
    "Position": "Forward",
    "Team": "Golden State Warriors",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Kevon",
    "Last Name": "Looney",
    "Position": "Center",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Quinten",
    "Last Name": "Post",
    "Position": "Center",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Dru",
    "Last Name": "Smith",
    "Position": "Guard",
    "Team": "Miami Heat",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Kam",
    "Last Name": "Jones",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Gary",
    "Last Name": "Trent Jr",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Terrence",
    "Last Name": "Shannon",
    "Position": "Guard",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Micah",
    "Last Name": "Peavy",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Jamal",
    "Last Name": "Cain",
    "Position": "Forward",
    "Team": "Orlando Magic",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Rayan",
    "Last Name": "Rupert",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Koa",
    "Last Name": "Peat",
    "Position": "Forward",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Sidy",
    "Last Name": "Cissoko",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Alex",
    "Last Name": "Karaban",
    "Position": "Forward",
    "Team": "Sacramento Kings",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Tarris",
    "Last Name": "Reed Jr",
    "Position": "Center",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Allen",
    "Last Name": "Graves",
    "Position": "Forward",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Alijah",
    "Last Name": "Martin",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Nate",
    "Last Name": "Bittle",
    "Position": "Center",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Jaden",
    "Last Name": "Bradley",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Kevin",
    "Last Name": "Love",
    "Position": "Forward",
    "Team": "Utah Jazz",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Tamar",
    "Last Name": "Bates",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Felix",
    "Last Name": "Okpara",
    "Position": "Center",
    "Team": "Washington Wizards",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Tre",
    "Last Name": "Mann",
    "Position": "Guard",
    "Team": "Washington Wizards",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Trey",
    "Last Name": "Alexander",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "4,5",
    "Cr": ""
  },
  {
    "First Name": "Tony",
    "Last Name": "Bradley",
    "Position": "Center",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Keaton",
    "Last Name": "Wallace",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Buddy",
    "Last Name": "Hield",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Asa",
    "Last Name": "Newell",
    "Position": "Forward",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Mouhamed",
    "Last Name": "Gueye",
    "Position": "Forward",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Corey",
    "Last Name": "Kispert",
    "Position": "Forward",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Rayj",
    "Last Name": "Dennis",
    "Position": "Guard",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Henri",
    "Last Name": "Veesaar",
    "Position": "Center",
    "Team": "Atlanta Hawks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Max",
    "Last Name": "Shulga",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Amari",
    "Last Name": "Williams",
    "Position": "Forward",
    "Team": "Boston Celtics",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Ron",
    "Last Name": "Harper Jr.",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Dillon",
    "Last Name": "Mitchell",
    "Position": "Forward",
    "Team": "Boston Celtics",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Milos",
    "Last Name": "Uzan",
    "Position": "Guard",
    "Team": "Boston Celtics",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Drake",
    "Last Name": "Powell",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Moritz",
    "Last Name": "Wagner",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tyler",
    "Last Name": "Bilodeau",
    "Position": "Forward",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kylan",
    "Last Name": "Boswell",
    "Position": "Guard",
    "Team": "Brooklyn Nets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Dorian",
    "Last Name": "Finney-Smith",
    "Position": "Forward",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Antonio",
    "Last Name": "Reeves",
    "Position": "Guard",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Pj",
    "Last Name": "Hall",
    "Position": "Center",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Pat",
    "Last Name": "Connaughton",
    "Position": "Guard",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Xavier",
    "Last Name": "Tillman",
    "Position": "Forward",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tidjane",
    "Last Name": "Salaun",
    "Position": "Forward",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Liam",
    "Last Name": "Mcneeley",
    "Position": "Forward",
    "Team": "Charlotte Hornets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Zach",
    "Last Name": "Collins",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Noa",
    "Last Name": "Essengue",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tobe",
    "Last Name": "Awaka",
    "Position": "Forward",
    "Team": "Chicago Bulls",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Thomas",
    "Last Name": "Bryant",
    "Position": "Center",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Craig",
    "Last Name": "Porter",
    "Position": "Guard",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tyrese",
    "Last Name": "Proctor",
    "Position": "Guard",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Nae'qwan",
    "Last Name": "Tomlin",
    "Position": "Forward",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Riley",
    "Last Name": "Minix",
    "Position": "Forward",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tristan",
    "Last Name": "Enaruna",
    "Position": "Forward",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Ernest",
    "Last Name": "Udeh Jr.",
    "Position": "Center",
    "Team": "Cleveland Cavaliers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Marcus",
    "Last Name": "Sasser",
    "Position": "Guard",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jett",
    "Last Name": "Howard",
    "Position": "Guard",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Caleb",
    "Last Name": "Martin",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "John",
    "Last Name": "Poulakidas",
    "Position": "Guard",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tobias",
    "Last Name": "Lawal",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tarik",
    "Last Name": "Biberovic",
    "Position": "Forward",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Vsevolod",
    "Last Name": "Ishchenko",
    "Position": "Guard",
    "Team": "Dallas Mavericks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Julian",
    "Last Name": "Strawther",
    "Position": "Guard",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tyus",
    "Last Name": "Jones",
    "Position": "Guard",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Daron",
    "Last Name": "Holmes II",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Zeke",
    "Last Name": "Nnaji",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kj",
    "Last Name": "Simpson",
    "Position": "Guard",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "David",
    "Last Name": "Roddy",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Curtis",
    "Last Name": "Jones",
    "Position": "Guard",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Trevon",
    "Last Name": "Brazile",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Alpha",
    "Last Name": "Diallo",
    "Position": "Forward",
    "Team": "Denver Nuggets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Isaac",
    "Last Name": "Jones",
    "Position": "Forward",
    "Team": "Detroit Pistons",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Ron",
    "Last Name": "Holland II",
    "Position": "Forward",
    "Team": "Detroit Pistons",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Gary",
    "Last Name": "Harris",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Wendell",
    "Last Name": "Moore",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Chaz",
    "Last Name": "Lanier",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Javonte",
    "Last Name": "Green",
    "Position": "Guard",
    "Team": "Detroit Pistons",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tolu",
    "Last Name": "Smith",
    "Position": "Forward",
    "Team": "Detroit Pistons",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Ugonna",
    "Last Name": "Onyenso",
    "Position": "Center",
    "Team": "Detroit Pistons",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Will",
    "Last Name": "Richard",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Nate",
    "Last Name": "Williams",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Alex",
    "Last Name": "Toohey",
    "Position": "Forward",
    "Team": "Golden State Warriors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Seth",
    "Last Name": "Curry",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "LJ",
    "Last Name": "Cryer",
    "Position": "Guard",
    "Team": "Golden State Warriors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Lajae",
    "Last Name": "Jones",
    "Position": "Forward",
    "Team": "Golden State Warriors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Malevy",
    "Last Name": "Leons",
    "Position": "Forward",
    "Team": "Golden State Warriors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Julian",
    "Last Name": "Phillips",
    "Position": "Forward",
    "Team": "Houston Rockets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jae'Sean",
    "Last Name": "Tate",
    "Position": "Forward",
    "Team": "Houston Rockets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jeff",
    "Last Name": "Green",
    "Position": "Forward",
    "Team": "Houston Rockets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Isaiah",
    "Last Name": "Crawford",
    "Position": "Forward",
    "Team": "Houston Rockets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Sean",
    "Last Name": "Pedulla",
    "Position": "Guard",
    "Team": "Houston Rockets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Bruce",
    "Last Name": "Thornton",
    "Position": "Guard",
    "Team": "Houston Rockets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Quadir",
    "Last Name": "Copeland",
    "Position": "Guard",
    "Team": "Houston Rockets",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Johnny",
    "Last Name": "Furphy",
    "Position": "Guard",
    "Team": "Indiana Pacers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Larry",
    "Last Name": "Nance Jr",
    "Position": "Forward",
    "Team": "Indiana Pacers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Braden",
    "Last Name": "Smith",
    "Position": "Guard",
    "Team": "Indiana Pacers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Yuki",
    "Last Name": "Kawamura",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "TyTy",
    "Last Name": "Washington",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Yanic Konan",
    "Last Name": "Niederhauser",
    "Position": "Center",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Cam",
    "Last Name": "Christie",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jalen",
    "Last Name": "Pickett",
    "Position": "Guard",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Nicolas",
    "Last Name": "Batum",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jamarion",
    "Last Name": "Sharp",
    "Position": "Center",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Norchad",
    "Last Name": "Omier",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Baba",
    "Last Name": "Miller",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Nick",
    "Last Name": "Martinelli",
    "Position": "Forward",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Narcisse",
    "Last Name": "Ngoy",
    "Position": "Center",
    "Team": "Los Angeles Clippers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Matisse",
    "Last Name": "Thybulle",
    "Position": "Forward",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Adou",
    "Last Name": "Thiero",
    "Position": "Forward",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jarred",
    "Last Name": "Vanderbilt",
    "Position": "Forward",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Dalton",
    "Last Name": "Knecht",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Chris",
    "Last Name": "Manon",
    "Position": "Guard",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "AK",
    "Last Name": "Okereke",
    "Position": "Forward",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Arthur",
    "Last Name": "Kaluma",
    "Position": "Forward",
    "Team": "Los Angeles Lakers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Aj",
    "Last Name": "Johnson",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kris",
    "Last Name": "Murray",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Taj",
    "Last Name": "Gibson",
    "Position": "Forward",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Richie",
    "Last Name": "Saunders",
    "Position": "Guard",
    "Team": "Memphis Grizzlies",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Keshad",
    "Last Name": "Johnson",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jahmir",
    "Last Name": "Young",
    "Position": "Guard",
    "Team": "Miami Heat",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Myron",
    "Last Name": "Gardner",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Trevor",
    "Last Name": "Keels",
    "Position": "Guard",
    "Team": "Miami Heat",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Ryan",
    "Last Name": "Conwell",
    "Position": "Guard",
    "Team": "Miami Heat",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tre",
    "Last Name": "Donaldson",
    "Position": "Forward",
    "Team": "Miami Heat",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Vladislav",
    "Last Name": "Goldin",
    "Position": "Center",
    "Team": "Miami Heat",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Thanasis",
    "Last Name": "Antetokounmpo",
    "Position": "Forward",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Bogoljub",
    "Last Name": "Markovic",
    "Position": "Forward",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Cormac",
    "Last Name": "Ryan",
    "Position": "Guard",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Malique",
    "Last Name": "Lewis",
    "Position": "Forward",
    "Team": "Milwaukee Bucks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Nah'shon",
    "Last Name": "Hyland",
    "Position": "Guard",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jaylen",
    "Last Name": "Clark",
    "Position": "Guard",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Joan",
    "Last Name": "Beringer",
    "Position": "Forward",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Enrique",
    "Last Name": "Freeman",
    "Position": "Forward",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Trey",
    "Last Name": "Kaufman-Renn",
    "Position": "Forward",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Zyon",
    "Last Name": "Pullin",
    "Position": "Guard",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Isaiah",
    "Last Name": "Evans",
    "Position": "Forward",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Trey",
    "Last Name": "Lyles",
    "Position": "Forward",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Rocco",
    "Last Name": "Zikarsky",
    "Position": "Center",
    "Team": "Minnesota Timberwolves",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Caleb",
    "Last Name": "Houstan",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Deandre",
    "Last Name": "Jordan",
    "Position": "Center",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Christian",
    "Last Name": "Koloko",
    "Position": "Center",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Bryce",
    "Last Name": "McGowens",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Trendon",
    "Last Name": "Watford",
    "Position": "Forward",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kobe",
    "Last Name": "Bufkin",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jaron",
    "Last Name": "Pierre Jr",
    "Position": "Guard",
    "Team": "New Orleans Pelicans",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Pacome",
    "Last Name": "Dadiet",
    "Position": "Forward",
    "Team": "New York Knicks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kevin",
    "Last Name": "Mccullar Jr",
    "Position": "Guard",
    "Team": "New York Knicks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tyler",
    "Last Name": "Kolek",
    "Position": "Guard",
    "Team": "New York Knicks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Mohamed",
    "Last Name": "Diawara",
    "Position": "Forward",
    "Team": "New York Knicks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Dillon",
    "Last Name": "Jones",
    "Position": "Forward",
    "Team": "New York Knicks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jack",
    "Last Name": "Kayil",
    "Position": "Guard",
    "Team": "New York Knicks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tyler",
    "Last Name": "Nickel",
    "Position": "Forward",
    "Team": "New York Knicks",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kenrich",
    "Last Name": "Williams",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Brooks",
    "Last Name": "Barnhizer",
    "Position": "Forward",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Nikola",
    "Last Name": "Topic",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Thomas",
    "Last Name": "Sorber",
    "Position": "Center",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Otega",
    "Last Name": "Oweh",
    "Position": "Guard",
    "Team": "Oklahoma City Thunder",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jonathan",
    "Last Name": "Isaac",
    "Position": "Forward",
    "Team": "Orlando Magic",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jevon",
    "Last Name": "Carter",
    "Position": "Guard",
    "Team": "Orlando Magic",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jase",
    "Last Name": "Richardson",
    "Position": "Guard",
    "Team": "Orlando Magic",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Colin",
    "Last Name": "Castleton",
    "Position": "Center",
    "Team": "Orlando Magic",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Noah",
    "Last Name": "Penda",
    "Position": "Guard",
    "Team": "Orlando Magic",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Izaiyah",
    "Last Name": "Nelson",
    "Position": "Forward",
    "Team": "Orlando Magic",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Alex",
    "Last Name": "Morales",
    "Position": "Guard",
    "Team": "Orlando Magic",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kentavious",
    "Last Name": "Caldwell-Pope",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kyle",
    "Last Name": "Lowry",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Justin",
    "Last Name": "Edwards",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Marjon",
    "Last Name": "Beauchamp",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Tyrese",
    "Last Name": "Martin",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jabari",
    "Last Name": "Walker",
    "Position": "Forward",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Ariel",
    "Last Name": "Hukporti",
    "Position": "Center",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Duke",
    "Last Name": "Miles",
    "Position": "Guard",
    "Team": "Philadelphia 76ers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Ryan",
    "Last Name": "Dunn",
    "Position": "Forward",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Amir",
    "Last Name": "Coffey",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Haywood",
    "Last Name": "Highsmith",
    "Position": "Forward",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Khaman",
    "Last Name": "Maluach",
    "Position": "Center",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jamaree",
    "Last Name": "Bouyea",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Isaiah",
    "Last Name": "Livers",
    "Position": "Forward",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Rasheer",
    "Last Name": "Fleming",
    "Position": "Forward",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Koby",
    "Last Name": "Brea",
    "Position": "Guard",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "CJ",
    "Last Name": "Huntley",
    "Position": "Forward",
    "Team": "Phoenix Suns",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Blake",
    "Last Name": "Wesley",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Chris",
    "Last Name": "Youngblood",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Branden",
    "Last Name": "Carlson",
    "Position": "Center",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Yang",
    "Last Name": "Hansen",
    "Position": "Center",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Vit",
    "Last Name": "Krejci",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "John",
    "Last Name": "Tonje",
    "Position": "Guard",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jayson",
    "Last Name": "Kent",
    "Position": "Forward",
    "Team": "Portland Trail Blazers",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jonathan",
    "Last Name": "Mogbo",
    "Position": "Forward",
    "Team": "Sacramento Kings",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Adam",
    "Last Name": "Flagler",
    "Position": "Guard",
    "Team": "Sacramento Kings",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Daeqwon",
    "Last Name": "Plowden",
    "Position": "Guard",
    "Team": "Sacramento Kings",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Emanuel",
    "Last Name": "Sharp",
    "Position": "Guard",
    "Team": "Sacramento Kings",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Taelon",
    "Last Name": "Peter",
    "Position": "Guard",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jordan",
    "Last Name": "McLaughlin",
    "Position": "Guard",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "David Jones",
    "Last Name": "Garcia",
    "Position": "Guard",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Harrison",
    "Last Name": "Barnes",
    "Position": "Forward",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Ja'Kobi",
    "Last Name": "Gillespie",
    "Position": "Guard",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Maliq",
    "Last Name": "Brown",
    "Position": "Forward",
    "Team": "San Antonio Spurs",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "A.j.",
    "Last Name": "Lawson",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Kyle",
    "Last Name": "Anderson",
    "Position": "Forward",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Trayce",
    "Last Name": "Jackson-Davis",
    "Position": "Forward",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Andre",
    "Last Name": "Jackson Jr",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Jamison",
    "Last Name": "Battle",
    "Position": "Forward",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Chucky",
    "Last Name": "Hepburn",
    "Position": "Guard",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Trey",
    "Last Name": "Jemison III",
    "Position": "Center",
    "Team": "Toronto Raptors",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Mo",
    "Last Name": "Bamba",
    "Position": "Center",
    "Team": "Utah Jazz",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Josh",
    "Last Name": "Okogie",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Harrison",
    "Last Name": "Ingram",
    "Position": "Forward",
    "Team": "Utah Jazz",
    "Cr 26/27": "4,0",
    "Cr": ""
  },
  {
    "First Name": "Hayden",
    "Last Name": "Gray",
    "Position": "Guard",
    "Team": "Utah Jazz",
    "Cr 26/27": "4,0",
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

  const handleJoinOrCreate = async (asAdmin = false) => {
    const cleanRoom = roomCode.trim().toUpperCase();
    if (!cleanRoom) {
      showNotice("Inserisci un codice stanza!");
      return;
    }
    if (!teamName.trim() || !managerName.trim()) {
      showNotice("Inserisci sia il tuo nome che il nome della tua franchigia Dunkest!");
      return;
    }

    // Assicuriamoci di avere un ID utente univoco e stabile per questo dispositivo/browser
    let currentUserId = user?.uid;
    if (!currentUserId) {
      currentUserId = localStorage.getItem('dunkest_user_id');
      if (!currentUserId) {
        currentUserId = 'usr_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        localStorage.setItem('dunkest_user_id', currentUserId);
      }
      setUser({ uid: currentUserId, isAnonymous: true });
    }

    const newParticipant = {
      id: currentUserId,
      name: managerName.trim(),
      teamName: teamName.trim(),
      credits: roomData.initialBudget || 200,
      roster: [],
      isAdmin: asAdmin
    };

    // Se Firebase è attivo, leggiamo i dati reali dal database per NON sovrascrivere gli altri
    if (db) {
      try {
        const roomDocRef = doc(db, 'rooms', cleanRoom);
        const snap = await getDoc(roomDocRef);

        let currentRoomData = { ...roomData };
        if (snap.exists()) {
          currentRoomData = snap.data();
        }

        const existingParticipants = currentRoomData.participants || [];
        const existingIndex = existingParticipants.findIndex(p => p.id === currentUserId);
        let updatedList = [...existingParticipants];

        if (existingIndex >= 0) {
          // Se lo stesso utente rientra o cambia nome
          updatedList[existingIndex] = { ...updatedList[existingIndex], ...newParticipant };
        } else {
          // Nuovo utente: lo aggiungiamo in coda alla lista SENZA cancellare gli altri
          updatedList.push(newParticipant);
        }

        const updatedState = {
          ...currentRoomData,
          code: cleanRoom,
          participants: updatedList
        };

        await setDoc(roomDocRef, updatedState, { merge: true });
        setRoomData(updatedState);
        setIsAdmin(asAdmin);
        setHasJoined(true);
        showNotice(`Benvenuto all'asta Dunkest, ${newParticipant.teamName}!`);
        return;
      } catch (err) {
        console.error("Errore salvataggio ingresso stanza su Firebase:", err);
      }
    }

    // Fallback locale in caso di assenza temporanea di rete
    const existingIndex = roomData.participants.findIndex(p => p.id === currentUserId);
    let updatedParticipants = [...roomData.participants];
    if (existingIndex >= 0) {
      updatedParticipants[existingIndex] = { ...updatedParticipants[existingIndex], ...newParticipant };
    } else {
      updatedParticipants.push(newParticipant);
    }

    const updatedState = {
      ...roomData,
      code: cleanRoom,
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