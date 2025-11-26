document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const showId = urlParams.get('id');

    if (!showId) {
        document.body.innerHTML = '<h1>Error: No show ID provided.</h1>';
        return;
    }

    // Run fetches in parallel
    Promise.all([
        loadShowDetails(showId),
        loadEpisodes(showId)
    ]).then(([showData, episodeData]) => {
        setupTabs(); // If you kept the v2.0 tabs, otherwise this function won't exist/run
        checkContinueWatching(episodeData.episodes);
    }).catch(err => {
        console.error("Failed to load page:", err);
    });
});

// (If you are using v1.0 UI, you might not have setupTabs. That is fine.)
function setupTabs() {
    const tabNavItems = document.querySelectorAll('.tab-nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    if(!tabNavItems.length) return;

    tabNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            const targetPane = document.getElementById(targetId);
            tabNavItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            tabPanes.forEach(pane => pane.classList.remove('active'));
            targetPane.classList.add('active');
        });
    });
}

async function loadShowDetails(showId) {
    try {
        const res = await fetch(`/api/shows/${showId}`);
        if (!res.ok) throw new Error('Show not found');
        
        const show = await res.json();
        document.title = `${show.title} - StreamHub`;

        // Populate elements
        const banner = document.querySelector('.show-banner');
        if(banner) banner.style.backgroundImage = `url(${show.banner || '/assets/images/placeholder-banner.jpg'})`;
        
        const poster = document.getElementById('show-poster-img');
        if(poster) poster.src = show.poster || '/assets/images/placeholder-poster.jpg';
        
        const title = document.getElementById('show-title');
        if(title) title.textContent = show.title;
        
        const desc = document.getElementById('show-description');
        if(desc) desc.textContent = show.description;

        const genresContainer = document.getElementById('show-genres');
        if(genresContainer) {
            genresContainer.innerHTML = '';
            if (show.genres) {
                show.genres.split(',').forEach(genre => {
                    genresContainer.innerHTML += `<span class="genre-tag">${genre.trim()}</span>`;
                });
            }
        }
        
        return { show };

    } catch (err) {
        console.error('Failed to load show details:', err);
        const content = document.querySelector('.show-banner-content');
        if(content) content.innerHTML = `<h1>${err.message}</h1>`;
        throw err;
    }
}

async function loadEpisodes(showId) {
    try {
        const res = await fetch(`/api/shows/${showId}/episodes`);
        const episodes = await res.json();

        const listContainer = document.getElementById('episode-list');
        listContainer.innerHTML = ''; 

        if (episodes.length === 0) {
            listContainer.innerHTML = '<p>No episodes available for this show yet.</p>';
            const btn = document.getElementById('play-first-ep-btn');
            if(btn) btn.style.display = 'none';
            return { episodes: [] };
        }

        const btn = document.getElementById('play-first-ep-btn');
        if(btn) btn.href = `/watch.html?id=${episodes[0].id}`;

        episodes.forEach(ep => {
            listContainer.innerHTML += `
                <div class="episode-card" data-episode-id="${ep.id}">
                    <div class="episode-thumbnail">
                        <img src="${ep.thumbnail || '/assets/images/placeholder-thumb.jpg'}" alt="${ep.title}">
                    </div>
                    <div class="episode-details">
                        <h3>Ep ${ep.ep_number}: ${ep.title}</h3>
                        <p>${ep.description || 'No description available.'}</p>
                    </div>
                    <div class="episode-play-btn">
                        <a href="/watch.html?id=${ep.id}" title="Play Episode">▶</a>
                    </div>
                </div>
            `;
        });
        
        return { episodes };

    } catch (err) {
        console.error('Failed to load episodes:', err);
        const listContainer = document.getElementById('episode-list');
        if(listContainer) listContainer.innerHTML = '<p class="error-message">Could not load episodes.</p>';
        throw err;
    }
}

async function checkContinueWatching(episodes) {
    const token = localStorage.getItem('user_token');
    if (!token || !episodes.length) return; 

    try {
        const res = await fetch('/api/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await res.json();
        if (history.length === 0) return;

        // Map history for lookup (using String IDs now)
        const historyMap = new Map();
        history.forEach(item => {
            // Ensure we use the string ID
            historyMap.set(item.episode.id || item.episode, item); 
        });

        // Loop through cards
        document.querySelectorAll('.episode-card').forEach(card => {
            // --- FIX: REMOVED parseInt() ---
            const epId = card.getAttribute('data-episode-id'); 
            const epHistory = historyMap.get(epId);

            if (epHistory) {
                // Highlight or show progress bar
                // (This is simple logic to show the bar if you have the v2.0 styles)
                const details = card.querySelector('.episode-details');
                // Simple indicator for v1.0 styles
                if(details && !details.querySelector('.watched-indicator')) {
                    details.innerHTML += `<small style="color:var(--primary-color)">Watched</small>`;
                }
            }
        });
        
    } catch (err) {
        console.error('Could not fetch watch history:', err);
    }
}