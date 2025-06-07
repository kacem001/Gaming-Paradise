const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Static files
app.use(express.static('public'));

// Get game data by slug
app.get('/game/:slug', (req, res) => {
    try {
        const games = JSON.parse(fs.readFileSync('./data/games.json', 'utf8'));
        const gameData = games[req.params.slug];

        if (!gameData) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.json(gameData);
    } catch (error) {
        console.error('Error loading game:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Main route - serve HTML for any slug
app.get('/:slug?', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log('🎮 Gaming Paradise Server Started!');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log('✨ Ready to serve games!');
});
