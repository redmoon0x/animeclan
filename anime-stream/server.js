const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Proxy endpoints
const API_BASE = 'https://animeapi.skin';

// Common headers for API requests
const apiHeaders = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0'
};

// Trending anime endpoint
app.get('/api/trending', async (req, res) => {
    try {
        console.log('Fetching trending anime...');
        const response = await axios.get(`${API_BASE}/trending`, { headers: apiHeaders });
        console.log('Trending response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching trending:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to fetch trending anime', details: error.message });
    }
});

// New releases by page endpoint
app.get('/api/new', async (req, res) => {
    try {
        const page = req.query.page || 1;
        console.log(`Fetching new releases page ${page}...`);
        const response = await axios.get(`${API_BASE}/new`, {
            params: { page },
            headers: apiHeaders
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching new releases:', error.message);
        res.status(500).json({ error: 'Failed to fetch new releases', details: error.message });
    }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
    try {
        console.log('Searching anime:', req.query.q);
        const response = await axios.get(`${API_BASE}/search`, {
            params: { q: req.query.q },
            headers: apiHeaders
        });
        console.log('Search response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error searching:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to search anime', details: error.message });
    }
});

// Episodes endpoint
app.get('/api/episodes', async (req, res) => {
    try {
        console.log('Fetching episodes for:', req.query.title);
        const response = await axios.get(`${API_BASE}/episodes`, {
            params: { title: req.query.title },
            headers: apiHeaders
        });
        console.log('Episodes response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching episodes:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to fetch episodes', details: error.message });
    }
});

// Anime details endpoint
app.get('/api/anime/:title', async (req, res) => {
    try {
        console.log('Fetching anime details for:', req.params.title);
        const [episodesResponse, searchResponse] = await Promise.all([
            axios.get(`${API_BASE}/episodes`, {
                params: { title: req.params.title },
                headers: apiHeaders
            }),
            axios.get(`${API_BASE}/search`, {
                params: { q: req.params.title },
                headers: apiHeaders
            })
        ]);

        // Find the exact anime from search results
        const animeDetails = searchResponse.data.find(anime => 
            anime.title.toLowerCase() === req.params.title.toLowerCase()
        );

        if (!animeDetails) {
            throw new Error('Anime not found');
        }

        // Process episodes data
        const episodes = episodesResponse.data.map(ep => ({
            number: ep.episode_number,
            title: ep.title || `Episode ${ep.episode_number}`,
            embed_url: `https://2anime.xyz/embed/${req.params.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-episode-${ep.episode_number}`
        }));

        // Sort episodes by number
        episodes.sort((a, b) => a.number - b.number);

        res.json({
            ...animeDetails,
            episodes: episodes
        });
    } catch (error) {
        console.error('Error fetching anime details:', error.message);
        res.status(500).json({ error: 'Failed to fetch anime details', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
