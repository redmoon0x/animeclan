// API endpoints
const API = {
    episodes: (title) => `http://localhost:3000/api/episodes?title=${encodeURIComponent(title)}`,
    search: (query) => `http://localhost:3000/api/search?q=${encodeURIComponent(query)}`,
    anime: (title) => `http://localhost:3000/api/anime/${encodeURIComponent(title)}`
};

// DOM Elements
const videoFrame = document.getElementById('videoFrame');
const episodesList = document.getElementById('episodesList');
const animeTitle = document.getElementById('animeTitle');
const episodeTitle = document.getElementById('episodeTitle');
const episodeProgress = document.getElementById('episodeProgress');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const episodeSearch = document.getElementById('episodeSearch');
const prevEpisodeBtn = document.getElementById('prevEpisode');
const nextEpisodeBtn = document.getElementById('nextEpisode');
const toggleEpisodesBtn = document.getElementById('toggleEpisodes');
const mobileEpisodesToggle = document.getElementById('mobileEpisodesToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');
const episodesSidebar = document.getElementById('episodesSidebar');
const animeRating = document.getElementById('animeRating');
const totalEpisodes = document.getElementById('totalEpisodes');
const animeDescription = document.getElementById('animeDescription');

// State
let currentEpisode = 1;
let totalEpisodesCount = 0;
let episodes = [];
let currentAnimeData = null;

// Utility functions
const debounce = (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

// Create episode card
const createEpisodeCard = (episode, currentEpisode) => {
    const card = document.createElement('div');
    card.className = `episode-card ${episode.number === currentEpisode ? 'current-episode' : ''}`;
    card.innerHTML = `
        <div class="episode-number">Episode ${episode.number}</div>
        <div class="episode-title">${episode.title || `Episode ${episode.number}`}</div>
    `;
    card.addEventListener('click', () => {
        updatePlayer(episode);
        if (window.innerWidth <= 1024) {
            toggleSidebar(false);
        }
    });
    return card;
};

// Update video player
const updatePlayer = (episode) => {
    // Update video
    videoFrame.src = episode.embed_url;
    
    // Update episode title and progress
    episodeTitle.textContent = `Episode ${episode.number}${episode.title ? ` - ${episode.title}` : ''}`;
    episodeProgress.textContent = `${episode.number} / ${totalEpisodesCount}`;
    
    // Update URL without refreshing
    const params = new URLSearchParams(window.location.search);
    params.set('episode', episode.number);
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
    
    // Update navigation buttons
    prevEpisodeBtn.disabled = episode.number <= 1;
    nextEpisodeBtn.disabled = episode.number >= totalEpisodesCount;
    
    // Update episode selection
    currentEpisode = episode.number;
    updateEpisodesList(episodes);
};

// Update episodes list with filter
const updateEpisodesList = (episodes, filter = '') => {
    episodesList.innerHTML = '';
    const filteredEpisodes = episodes.filter(ep => 
        ep.title?.toLowerCase().includes(filter.toLowerCase()) ||
        `Episode ${ep.number}`.toLowerCase().includes(filter.toLowerCase())
    );
    
    filteredEpisodes.forEach(episode => {
        const card = createEpisodeCard(episode, currentEpisode);
        episodesList.appendChild(card);
        
        if (episode.number === currentEpisode) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
};

// Toggle sidebar
const toggleSidebar = (show = null) => {
    if (show === null) {
        episodesSidebar.classList.toggle('show');
    } else {
        episodesSidebar.classList[show ? 'add' : 'remove']('show');
    }
};

// Load anime data
const loadAnimeData = async () => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get('anime');
    currentEpisode = parseInt(params.get('episode')) || 1;
    
    if (!title) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // First get the episodes list
        const episodesResponse = await fetch(API.episodes(title));
        const episodesData = await episodesResponse.json();
        
        // Then get anime details
        const animeResponse = await fetch(API.anime(title));
        const animeData = await animeResponse.json();
        currentAnimeData = animeData;
        
        // Set anime details
        animeTitle.textContent = animeData.title;
        animeDescription.textContent = animeData.description || 'No description available.';
        animeRating.textContent = animeData.rating || 'N/A';
        
        // Process episodes from episodesData
        episodes = episodesData.map((ep, index) => ({
            number: ep.episode_number || index + 1,
            title: ep.title || `Episode ${ep.episode_number || index + 1}`,
            embed_url: `https://2anime.xyz/embed/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-episode-${ep.episode_number || index + 1}`,
            is_latest: ep.episode_number === episodesData[episodesData.length - 1].episode_number
        })).sort((a, b) => a.number - b.number);
        
        totalEpisodesCount = episodes.length;
        totalEpisodes.textContent = `${totalEpisodesCount} Episodes`;
        
        // If no specific episode is provided in URL, use latest episode
        if (!currentEpisode && animeData.latest_episode) {
            currentEpisode = animeData.latest_episode;
        }
        
        // Get current episode data
        const currentEpisodeData = episodes.find(ep => ep.number === currentEpisode) || episodes[episodes.length - 1];
        if (currentEpisodeData) {
            currentEpisode = currentEpisodeData.number;
        }
        
        // Update episodes list and play current episode
        updateEpisodesList(episodes);
        if (currentEpisodeData) {
            updatePlayer(currentEpisodeData);
        }
    } catch (error) {
        console.error('Error loading anime:', error);
        animeTitle.textContent = 'Error loading anime';
        episodesList.innerHTML = '<p>Error loading episodes. Please try again later.</p>';
    }
};

// Search functionality
const handleSearch = debounce(async (query) => {
    if (!query) {
        searchSuggestions.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(API.search(query));
        const data = await response.json();
        
        searchSuggestions.innerHTML = '';
        if (Array.isArray(data)) {
            data.slice(0, 5).forEach(anime => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `
                    <img src="${anime.thumbnail_url}" alt="${anime.title}">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${anime.title}</div>
                        <div class="suggestion-episodes">${anime.episodes_count || 'N/A'} Episodes</div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    window.location.href = `watch.html?anime=${encodeURIComponent(anime.title)}&episode=1`;
                });
                searchSuggestions.appendChild(div);
            });
        }
        
        searchSuggestions.style.display = data.length ? 'block' : 'none';
    } catch (error) {
        console.error('Error searching:', error);
    }
});

// Event listeners
searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
searchInput.addEventListener('focus', () => {
    if (searchInput.value) {
        searchSuggestions.style.display = 'block';
    }
});

document.addEventListener('click', (e) => {
    if (!searchSuggestions.contains(e.target) && e.target !== searchInput) {
        searchSuggestions.style.display = 'none';
    }
});

episodeSearch.addEventListener('input', (e) => {
    updateEpisodesList(episodes, e.target.value);
});

prevEpisodeBtn.addEventListener('click', () => {
    if (currentEpisode > 1) {
        const prevEpisode = episodes.find(ep => ep.number === currentEpisode - 1);
        if (prevEpisode) updatePlayer(prevEpisode);
    }
});

nextEpisodeBtn.addEventListener('click', () => {
    if (currentEpisode < totalEpisodesCount) {
        const nextEpisode = episodes.find(ep => ep.number === currentEpisode + 1);
        if (nextEpisode) updatePlayer(nextEpisode);
    }
});

toggleEpisodesBtn.addEventListener('click', () => toggleSidebar());
mobileEpisodesToggle.addEventListener('click', () => toggleSidebar(true));
closeSidebarBtn.addEventListener('click', () => toggleSidebar(false));

// Handle browser back/forward
window.addEventListener('popstate', loadAnimeData);

// Initialize
document.addEventListener('DOMContentLoaded', loadAnimeData);
