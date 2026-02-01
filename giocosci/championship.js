// championship.js - Sistema Campionato del Mondo FIS 2026
'use strict';

const Championship = (function() {
  const STORAGE_KEY = 'ski_world_championship_2026';
  
  // Calendario ufficiale Campionato del Mondo 2026
  const WORLD_CUP_CALENDAR = [
    {
      id: 1,
      name: "Kitzbühel",
      location: "Austria 🇦🇹",
      track: "Streif",
      discipline: "discesa",
      difficulty: "hard",
      description: "La leggendaria Streif - la discesa più pericolosa del mondo",
      elevation: 1665,
      length: 3312,
      gates: 35,
      weather: "sunny",
      date: "2026-01-24"
    },
    {
      id: 2,
      name: "Cortina d'Ampezzo",
      location: "Italia 🇮🇹",
      track: "Olympia delle Tofane",
      discipline: "gigante",
      difficulty: "normal",
      description: "La Regina delle Dolomiti - pista olimpica storica",
      elevation: 2123,
      length: 2808,
      gates: 45,
      weather: "cloudy",
      date: "2026-01-31"
    },
    {
      id: 3,
      name: "Wengen",
      location: "Svizzera 🇨🇭",
      track: "Lauberhorn",
      discipline: "discesa",
      difficulty: "hard",
      description: "La discesa più lunga del circuito mondiale",
      elevation: 2315,
      length: 4480,
      gates: 38,
      weather: "snowing",
      date: "2026-02-07"
    },
    {
      id: 4,
      name: "Schladming",
      location: "Austria 🇦🇹",
      track: "Planai",
      discipline: "slalom",
      difficulty: "hard",
      description: "Lo slalom notturno più spettacolare",
      elevation: 1894,
      length: 890,
      gates: 65,
      weather: "night",
      date: "2026-02-14"
    },
    {
      id: 5,
      name: "Garmisch-Partenkirchen",
      location: "Germania 🇩🇪",
      track: "Kandahar",
      discipline: "gigante",
      difficulty: "hard",
      description: "La storica Kandahar - tradizione dal 1936",
      elevation: 2050,
      length: 3180,
      gates: 52,
      weather: "cloudy",
      date: "2026-02-21"
    },
    {
      id: 6,
      name: "Val d'Isère",
      location: "Francia 🇫🇷",
      track: "Face de Bellevarde",
      discipline: "discesa",
      difficulty: "hard",
      description: "La Face - una delle discese più tecniche",
      elevation: 3000,
      length: 3006,
      gates: 40,
      weather: "sunny",
      date: "2026-02-28"
    },
    {
      id: 7,
      name: "Kranjska Gora",
      location: "Slovenia 🇸🇮",
      track: "Podkoren",
      discipline: "slalom",
      difficulty: "normal",
      description: "Il Vitranc - slalom tecnico tra i boschi",
      elevation: 1215,
      length: 780,
      gates: 58,
      weather: "sunny",
      date: "2026-03-07"
    },
    {
      id: 8,
      name: "Åre",
      location: "Svezia 🇸🇪",
      track: "Olympia",
      discipline: "gigante",
      difficulty: "normal",
      description: "La pista olimpica scandinava",
      elevation: 1420,
      length: 2450,
      gates: 48,
      weather: "cloudy",
      date: "2026-03-14"
    },
    {
      id: 9,
      name: "Bansko",
      location: "Bulgaria 🇧🇬",
      track: "Tomba",
      discipline: "slalom",
      difficulty: "easy",
      description: "Omaggio ad Alberto Tomba",
      elevation: 2600,
      length: 850,
      gates: 55,
      weather: "sunny",
      date: "2026-03-21"
    },
    {
      id: 10,
      name: "Soldeu",
      location: "Andorra 🇦🇩",
      track: "Avet",
      discipline: "gigante",
      difficulty: "normal",
      description: "Finale di stagione sui Pirenei",
      elevation: 2560,
      length: 2680,
      gates: 50,
      weather: "sunny",
      date: "2026-03-28"
    }
  ];

  // Sistema punti FIS ufficiale (posizioni 1-30)
  const FIS_POINTS = [
    100, 80, 60, 50, 45, 40, 36, 32, 29, 26,
    24, 22, 20, 18, 16, 15, 14, 13, 12, 11,
    10, 9, 8, 7, 6, 5, 4, 3, 2, 1
  ];

  // Stato del campionato
  let championshipData = {
    playerName: '',
    currentRaceIndex: 0,
    raceResults: [], // [{raceId, position, time, points, date}]
    totalPoints: 0,
    generalStandings: [], // classifica generale
    slalomStandings: [],
    giganteStandings: [],
    discesaStandings: [],
    completedRaces: 0,
    isActive: false,
    startDate: null
  };

  // Carica dati dal localStorage
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        championshipData = JSON.parse(saved);
        return true;
      }
    } catch (err) {
      console.error('Errore caricamento campionato:', err);
    }
    return false;
  }

  // Salva dati
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(championshipData));
      return true;
    } catch (err) {
      console.error('Errore salvataggio campionato:', err);
      return false;
    }
  }

  // Inizia nuovo campionato
  function startChampionship(playerName) {
    championshipData = {
      playerName: playerName || 'Sciatore',
      currentRaceIndex: 0,
      raceResults: [],
      totalPoints: 0,
      generalStandings: generateAIStandings(),
      slalomStandings: [],
      giganteStandings: [],
      discesaStandings: [],
      completedRaces: 0,
      isActive: true,
      startDate: new Date().toISOString()
    };
    save();
    return championshipData;
  }

  // Genera classifica AI con avversari realistici
  function generateAIStandings() {
    const famousSkiers = [
      { name: "Erik Stromberg", country: "🇸🇪", specialty: "gigante", skill: 0.95 },
      { name: "Lars Bergmann", country: "🇳🇴", specialty: "discesa", skill: 0.94 },
      { name: "Franz Waldner", country: "🇦🇹", specialty: "slalom", skill: 0.93 },
      { name: "Jean-Luc Moreau", country: "🇫🇷", specialty: "gigante", skill: 0.92 },
      { name: "Kai Andersson", country: "🇸🇪", specialty: "slalom", skill: 0.91 },
      { name: "Stefan Schneider", country: "🇨🇭", specialty: "discesa", skill: 0.90 },
      { name: "Matteo Rossi", country: "🇮🇹", specialty: "slalom", skill: 0.89 },
      { name: "Hans Mueller", country: "🇩🇪", specialty: "gigante", skill: 0.88 },
      { name: "Pierre Dubois", country: "🇫🇷", specialty: "discesa", skill: 0.87 },
      { name: "Luca Fontana", country: "🇮🇹", specialty: "gigante", skill: 0.86 }
    ];

    return famousSkiers.map(skier => ({
      ...skier,
      points: 0,
      races: 0,
      wins: 0,
      podiums: 0
    }));
  }

  // Ottieni gara corrente
  function getCurrentRace() {
    if (championshipData.currentRaceIndex >= WORLD_CUP_CALENDAR.length) {
      return null; // Campionato completato
    }
    return WORLD_CUP_CALENDAR[championshipData.currentRaceIndex];
  }

  // Ottieni tutte le gare
  function getAllRaces() {
    return WORLD_CUP_CALENDAR;
  }

  // Ottieni gara per ID
  function getRaceById(id) {
    return WORLD_CUP_CALENDAR.find(r => r.id === id);
  }

  // Registra risultato gara
  function recordRaceResult(raceId, playerTime, playerPenalty = 0) {
    const race = getRaceById(raceId);
    if (!race) return null;

    const finalTime = playerTime + playerPenalty;
    
    // Simula tempi degli avversari AI
    const aiResults = simulateAIRace(race, finalTime);
    
    // Trova posizione del giocatore
    let position = 1;
    for (let aiResult of aiResults) {
      if (aiResult.time < finalTime) position++;
    }

    // Calcola punti
    const points = position <= 30 ? FIS_POINTS[position - 1] : 0;

    // Salva risultato
    const result = {
      raceId: race.id,
      raceName: race.name,
      discipline: race.discipline,
      position: position,
      time: finalTime,
      rawTime: playerTime,
      penalty: playerPenalty,
      points: points,
      date: new Date().toISOString(),
      aiResults: aiResults.slice(0, 10) // Top 10
    };

    championshipData.raceResults.push(result);
    championshipData.totalPoints += points;
    championshipData.completedRaces++;
    championshipData.currentRaceIndex++;

    // Aggiorna classifiche per specialità
    updateSpecialtyStandings(race.discipline, points);
    
    // Aggiorna classifica generale AI
    updateAIStandings(aiResults);

    save();
    return result;
  }

  // Simula gara degli avversari AI
  function simulateAIRace(race, playerTime) {
    const results = [];
    
    for (let skier of championshipData.generalStandings) {
      // Variazione basata su specialità
      let skillMultiplier = skier.skill;
      if (skier.specialty === race.discipline) {
        skillMultiplier += 0.03; // Bonus specialità
      }
      
      // Genera tempo con variazione casuale
      const baseTime = playerTime * (0.95 + Math.random() * 0.15);
      const skillAdjustment = baseTime * (1 - skillMultiplier * 0.05);
      const time = baseTime + skillAdjustment;
      
      results.push({
        name: skier.name,
        country: skier.country,
        time: time,
        formattedTime: formatTime(time)
      });
    }

    // Ordina per tempo
    results.sort((a, b) => a.time - b.time);
    
    // Assegna posizioni e punti
    results.forEach((result, idx) => {
      result.position = idx + 1;
      result.points = idx < 30 ? FIS_POINTS[idx] : 0;
    });

    return results;
  }

  // Aggiorna classifica generale AI
  function updateAIStandings(aiResults) {
    for (let result of aiResults) {
      const skier = championshipData.generalStandings.find(s => s.name === result.name);
      if (skier) {
        skier.points += result.points;
        skier.races++;
        if (result.position === 1) skier.wins++;
        if (result.position <= 3) skier.podiums++;
      }
    }
    
    // Riordina per punti
    championshipData.generalStandings.sort((a, b) => b.points - a.points);
  }

  // Aggiorna classifiche specialità
  function updateSpecialtyStandings(discipline, points) {
    let standings;
    if (discipline === 'slalom') standings = championshipData.slalomStandings;
    else if (discipline === 'gigante') standings = championshipData.giganteStandings;
    else if (discipline === 'discesa') standings = championshipData.discesaStandings;
    
    if (standings) {
      const existing = standings.find(s => s.name === championshipData.playerName);
      if (existing) {
        existing.points += points;
      } else {
        standings.push({
          name: championshipData.playerName,
          points: points
        });
      }
      standings.sort((a, b) => b.points - a.points);
    }
  }

  // Ottieni classifica generale con giocatore
  function getGeneralStandings() {
    const standings = [...championshipData.generalStandings];
    
    // Aggiungi giocatore
    standings.push({
      name: championshipData.playerName + ' ⭐',
      country: '🏁',
      points: championshipData.totalPoints,
      races: championshipData.completedRaces,
      wins: championshipData.raceResults.filter(r => r.position === 1).length,
      podiums: championshipData.raceResults.filter(r => r.position <= 3).length,
      isPlayer: true
    });

    standings.sort((a, b) => b.points - a.points);
    return standings;
  }

  // Ottieni statistiche giocatore
  function getPlayerStats() {
    const results = championshipData.raceResults;
    return {
      name: championshipData.playerName,
      totalPoints: championshipData.totalPoints,
      completedRaces: championshipData.completedRaces,
      remainingRaces: WORLD_CUP_CALENDAR.length - championshipData.completedRaces,
      wins: results.filter(r => r.position === 1).length,
      podiums: results.filter(r => r.position <= 3).length,
      topTen: results.filter(r => r.position <= 10).length,
      averagePosition: results.length > 0 ? 
        (results.reduce((sum, r) => sum + r.position, 0) / results.length).toFixed(1) : 0,
      bestResult: results.length > 0 ? Math.min(...results.map(r => r.position)) : '-',
      slalomPoints: championshipData.slalomStandings.find(s => s.name === championshipData.playerName)?.points || 0,
      gigantePoints: championshipData.giganteStandings.find(s => s.name === championshipData.playerName)?.points || 0,
      discesaPoints: championshipData.discesaStandings.find(s => s.name === championshipData.playerName)?.points || 0
    };
  }

  // Resetta campionato
  function resetChampionship() {
    championshipData = {
      playerName: '',
      currentRaceIndex: 0,
      raceResults: [],
      totalPoints: 0,
      generalStandings: [],
      slalomStandings: [],
      giganteStandings: [],
      discesaStandings: [],
      completedRaces: 0,
      isActive: false,
      startDate: null
    };
    save();
  }

  // Formatta tempo
  function formatTime(seconds) {
    if (typeof seconds !== 'number' || !isFinite(seconds)) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centis = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  }

  // Ottieni progresso campionato (%)
  function getProgress() {
    return Math.round((championshipData.completedRaces / WORLD_CUP_CALENDAR.length) * 100);
  }

  // Verifica se campionato è completato
  function isCompleted() {
    return championshipData.completedRaces >= WORLD_CUP_CALENDAR.length;
  }

  // Ottieni dati campionato
  function getChampionshipData() {
    return championshipData;
  }

  // Inizializza
  load();

  // Esponi API pubblica
  return {
    startChampionship,
    getCurrentRace,
    getAllRaces,
    getRaceById,
    recordRaceResult,
    getGeneralStandings,
    getPlayerStats,
    resetChampionship,
    getProgress,
    isCompleted,
    getChampionshipData,
    load,
    save,
    formatTime
  };
})();

// Esponi globalmente
window.Championship = Championship;
