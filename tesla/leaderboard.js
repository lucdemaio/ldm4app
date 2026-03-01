// ==================== UNIVERSAL LEADERBOARD SYSTEM ====================
// Include this script in all arcade games for consistent leaderboard functionality

class ArcadeLeaderboard {
    constructor(gameName) {
        this.gameName = gameName;
        this.playerName = localStorage.getItem(`${gameName}_lastPlayer`) || '';
    }

    // Save player name for next session
    setPlayerName(name) {
        this.playerName = name;
        localStorage.setItem(`${this.gameName}_lastPlayer`, name);
    }

    // Get current player name
    getPlayerName() {
        return this.playerName;
    }

    // Save score to leaderboard
    saveScore(name, score, metadata = {}) {
        const key = `${this.gameName}_leaderboard`;
        let scores = JSON.parse(localStorage.getItem(key) || '[]');
        
        scores.push({
            name: name || 'Anonimo',
            score: score,
            metadata: metadata,
            date: new Date().toLocaleDateString('it-IT'),
            timestamp: Date.now()
        });
        
        // Sort by score (descending) and keep top 50
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem(key, JSON.stringify(scores.slice(0, 50)));
        
        return scores[0]; // Return top score
    }

    // Get leaderboard
    getLeaderboard(limit = 20) {
        const key = `${this.gameName}_leaderboard`;
        const scores = JSON.parse(localStorage.getItem(key) || '[]');
        return scores.slice(0, limit);
    }

    // Get player's best score
    getPlayerBestScore() {
        const leaderboard = this.getLeaderboard(50);
        return leaderboard.find(entry => entry.name === this.playerName) || null;
    }

    // Generate HTML leaderboard
    generateLeaderboardHTML(limit = 20) {
        const scores = this.getLeaderboard(limit);
        
        if (scores.length === 0) {
            return '<p class="text-gray-400 text-center py-8">Ancora nessun punteggio. Sii il primo!</p>';
        }

        let html = '<div class="space-y-2">';
        scores.forEach((entry, index) => {
            const isCurrentPlayer = entry.name === this.playerName ? 'ring-2 ring-yellow-400' : '';
            html += `
                <div class="leaderboard-item ${isCurrentPlayer}">
                    <span class="leaderboard-rank">#${index + 1}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-score">${entry.score} pts - ${entry.date}</span>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    // Clear all scores for this game
    clearScores() {
        if (confirm('Sei sicuro di voler cancellare tutti i punteggi?')) {
            localStorage.removeItem(`${this.gameName}_leaderboard`);
        }
    }

    // Export scores as JSON
    exportScores() {
        const leaderboard = this.getLeaderboard(50);
        return JSON.stringify(leaderboard, null, 2);
    }

    // Get stats
    getStats() {
        const leaderboard = this.getLeaderboard(50);
        const scores = leaderboard.map(e => e.score);
        
        return {
            totalPlayers: new Set(leaderboard.map(e => e.name)).size,
            totalGames: leaderboard.length,
            highestScore: Math.max(...scores),
            averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
            lowestScore: Math.min(...scores)
        };
    }
}

// Helper function to create leaderboard input modal
function createPlayerNameModal(gameName, onConfirm) {
    return `
        <div id="playerNameModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="glass-card p-8 max-w-md w-full mx-4 text-center">
                <h2 class="text-2xl font-bold mb-6">🎮 Benvenuto!</h2>
                <p class="text-gray-300 mb-6">Inserisci il tuo nome per iniziare:</p>
                <input type="text" id="playerNameInput" placeholder="Il tuo nome..." 
                    class="w-full px-4 py-3 rounded-lg bg-blue-500/20 border border-cyan-500/50 text-black mb-6" 
                    maxlength="20">
                <button class="btn-primary text-white px-8 py-3 rounded-full w-full" 
                    onclick="${onConfirm}">
                    Inizia a Giocare
                </button>
            </div>
        </div>
    `;
}

// CSS for leaderboard styling (add to your stylesheet)
const leaderboardCSS = `
    .leaderboard-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 16px;
        background: rgba(0,102,255,0.1);
        border-radius: 8px;
        margin: 8px 0;
        border-left: 4px solid #0066ff;
        transition: all 0.3s;
    }
    
    .leaderboard-item:hover {
        background: rgba(0,102,255,0.2);
        transform: translateX(4px);
    }
    
    .leaderboard-rank {
        font-weight: bold;
        color: #00d4ff;
        min-width: 40px;
    }
    
    .leaderboard-name {
        flex: 1;
        margin-left: 16px;
    }
    
    .leaderboard-score {
        font-weight: bold;
        color: #10b981;
        text-align: right;
    }
`;
