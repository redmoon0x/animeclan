// API endpoints
const API = {
    trending: '/api/trending',
    search: '/api/search',
    new: '/api/new',
    episodes: '/api/episodes',
    anime: (title) => `/api/anime/${encodeURIComponent(title)}`
};

// State
let currentPage = 1;
let currentAnime = null;
let currentTrendingPage = 1;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const resultsGrid = document.getElementById('resultsGrid');
const trendingGrid = document.getElementById('trendingGrid');
const newReleasesGrid = document.getElementById('newReleasesGrid');
const searchResults = document.getElementById('searchResults');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const prevPageTrending = document.getElementById('prevPageTrending');
const nextPageTrending = document.getElementById('nextPageTrending');
const currentPageTrending = document.getElementById('currentPageTrending');

// Modal Elements
const animeModal = document.getElementById('animeModal');
const closeModal = document.querySelector('.close-modal');
const watchNowBtn = document.getElementById('watchNowBtn');
const animeBanner = document.getElementById('animeBanner');
const modalAnimeTitle = document.getElementById('animeTitle');
const animeDescription = document.getElementById('animeDescription');
const animeRating = document.getElementById('animeRating');
const episodeCount = document.getElementById('episodeCount');
const animeStatus = document.getElementById('animeStatus');
const animeGenres = document.getElementById('animeGenres');

// Utility functions
const debounce = (func, delay = 300) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const createAnimeCard = (anime, isSearch = false) => {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.innerHTML = `
        <div class="card-image">
            <img src="${anime.thumbnail_url || anime.banner_url}" alt="${anime.title}">
            <div class="card-overlay">
                <button class="info-btn"><i class="fas fa-info-circle"></i></button>
                <button class="play-btn"><i class="fas fa-play"></i> Watch</button>
            </div>
        </div>
        <div class="anime-card-content">
            <div class="anime-title">${anime.title.split(',')[0]}</div>
            ${anime.episode ? `<div class="anime-episode">Episode ${anime.episode}</div>` : ''}
        </div>
    `;

    // Event listeners for buttons
    const infoBtn = card.querySelector('.info-btn');
    const playBtn = card.querySelector('.play-btn');
    const cardImage = card.querySelector('.card-image');

    infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAnimeDetails(anime);
    });

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const episode = anime.episode || 1;
        window.location.href = `watch.html?anime=${encodeURIComponent(anime.title)}&episode=${episode}`;
    });

    cardImage.addEventListener('mouseenter', () => {
        card.querySelector('.card-overlay').style.opacity = '1';
    });

    cardImage.addEventListener('mouseleave', () => {
        card.querySelector('.card-overlay').style.opacity = '0';
    });

    return card;
};

// Load trending anime
const loadTrendingAnime = async () => {
    try {
        const response = await fetch(`${API.trending}?page=${currentTrendingPage}`);
        const data = await response.json();
        
        trendingGrid.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            trendingGrid.innerHTML = '<p>No trending anime available.</p>';
            return;
        }

        data.forEach(anime => {
            const card = createAnimeCard(anime);
            trendingGrid.appendChild(card);
        });

        // Update trending pagination
        currentPageTrending.textContent = `Page ${currentTrendingPage}`;
        prevPageTrending.disabled = currentTrendingPage === 1;
    } catch (error) {
        console.error('Error loading trending anime:', error);
        trendingGrid.innerHTML = '<p>Error loading trending anime. Please try again later.</p>';
    }
};

// Load new releases
const loadNewReleases = async (page = 1) => {
    try {
        const response = await fetch(`${API.new}?page=${page}`);
        const data = await response.json();
        
        newReleasesGrid.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            newReleasesGrid.innerHTML = '<p>No new releases available.</p>';
            return;
        }

        data.forEach(anime => {
            const card = createAnimeCard(anime);
            newReleasesGrid.appendChild(card);
        });

        currentPage = page;
        currentPageSpan.textContent = `Page ${page}`;
        prevPageBtn.disabled = page === 1;
    } catch (error) {
        console.error('Error loading new releases:', error);
        newReleasesGrid.innerHTML = '<p>Error loading new releases. Please try again later.</p>';
    }
};

// Show anime details in modal
const showAnimeDetails = async (anime) => {
    try {
        const response = await fetch(API.anime(anime.title));
        const data = await response.json();
        
        currentAnime = data;
        
        // Update modal content
        animeBanner.src = data.banner_url || data.thumbnail_url;
        modalAnimeTitle.textContent = data.title.split(',')[0];
        animeDescription.textContent = data.description || 'No description available.';
        animeRating.textContent = data.rating || 'N/A';
        episodeCount.textContent = data.episodes ? data.episodes.length : 'N/A';
        animeStatus.textContent = data.status || 'N/A';
        animeGenres.textContent = (data.genres || []).join(', ') || 'N/A';
        
        // Show modal
        animeModal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading anime details:', error);
        alert('Error loading anime details. Please try again later.');
    }
};

// Search functionality
const handleSearch = debounce(async (query) => {
    if (!query) {
        searchSuggestions.style.display = 'none';
        searchResults.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API.search}?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        // Always show search results section when searching
        searchResults.style.display = 'block';
        
        // Update search suggestions and results
        searchSuggestions.innerHTML = '';
        resultsGrid.innerHTML = '';

        if (Array.isArray(data) && data.length > 0) {
            // Update search suggestions
            data.slice(0, 5).forEach(anime => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `
                    <img src="${anime.thumbnail_url}" alt="${anime.title}">
                    <div class="suggestion-info">
                        <div class="suggestion-title">${anime.title.split(',')[0]}</div>
                        <div class="suggestion-episodes">${anime.episodes_count || 'N/A'} Episodes</div>
                    </div>
                `;
                div.addEventListener('click', () => {
                    showAnimeDetails(anime);
                    searchSuggestions.style.display = 'none';
                });
                searchSuggestions.appendChild(div);
            });
            
            // Update search results grid
            data.forEach(anime => {
                const card = createAnimeCard(anime, true);
                resultsGrid.appendChild(card);
            });
            
            searchSuggestions.style.display = 'block';
        } else {
            // Show "no results" message
            resultsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%; padding: 2rem;">No results found</p>';
            searchSuggestions.style.display = 'none';
        }
    } catch (error) {
        console.error('Error searching:', error);
        resultsGrid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; width: 100%; padding: 2rem;">Error searching. Please try again.</p>';
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

closeModal.addEventListener('click', () => {
    animeModal.style.display = 'none';
});

watchNowBtn.addEventListener('click', () => {
    if (currentAnime) {
        const episode = currentAnime.latest_episode || 1;
        window.location.href = `watch.html?anime=${encodeURIComponent(currentAnime.title)}&episode=${episode}`;
    }
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        loadNewReleases(currentPage - 1);
    }
});

nextPageBtn.addEventListener('click', () => {
    loadNewReleases(currentPage + 1);
});

prevPageTrending.addEventListener('click', () => {
    if (currentTrendingPage > 1) {
        currentTrendingPage--;
        loadTrendingAnime();
    }
});

nextPageTrending.addEventListener('click', () => {
    currentTrendingPage++;
    loadTrendingAnime();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTrendingAnime(1);
    loadNewReleases(1);
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === animeModal) {
        animeModal.style.display = 'none';
    }
});
