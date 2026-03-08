const App = {
    games: [],
    filteredGames: [],
    currentView: 'tile',
    currentPage: 1,
    gamesPerPage: 24,
    sortBy: 'newest',
    FALLBACK_IMAGE: 'images/pnpfinder-fallback.svg',
    filters: {
        players: '',
        playtime: '',
        age: '',
        complexity: '',
        crafting: '',
        theme: '',
        mechanism: '',
        year: '',
        price: '',
        curated: ''
    },

    async init() {
        this.initTheme();
        await this.loadGames();
        this.bindEvents();
        this.populateFilters();
        this.applyFiltersAndSort();
        this.setupURLHandling();
    },

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            });
        }
    },

    async loadGames() {
        try {
            const response = await fetch('data/games.csv');
            const csvText = await response.text();
            this.games = this.parseCSV(csvText);
            this.filteredGames = [...this.games];
            this.updateResultsCount();
        } catch (error) {
            console.error('Error loading games:', error);
            document.getElementById('games-grid').innerHTML = `
                <div class="no-results">
                    <h3>Error loading games</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    },

    parseCSV(csvText) {
        const rows = [];
        let row = [];
        let cell = '';
        let inQuotes = false;
        
        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(cell);
                cell = '';
            } else if ((char === '\n' || char === '\r') && !inQuotes) {
                if (cell || row.length > 0) {
                    row.push(cell);
                    if (row.some(c => c && c.trim())) rows.push(row);
                }
                row = [];
                cell = '';
                if (char === '\r' && nextChar === '\n') i++;
            } else {
                cell += char;
            }
        }
        if (cell || row.length > 0) {
            row.push(cell);
            if (row.some(c => c && c.trim())) rows.push(row);
        }
        
        if (rows.length < 2) return [];
        
        const headers = rows[0].map(h => h ? h.trim() : '');
        
        return rows.slice(1).map(rowValues => {
            const game = {};
            headers.forEach((header, index) => {
                game[header] = rowValues[index] ? rowValues[index].trim() : '';
            });
            game.id = this.slugify(game['GAME TITLE']);
            return game;
        });
    },

    slugify(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    },

    bindEvents() {
        const searchInput = document.getElementById('search-input');
        const autocompleteResults = document.getElementById('autocomplete-results');
        
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Add Enter key listener for search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                this.filters.search = query.toLowerCase();
                this.applyFiltersAndSort();
            }
        });
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length > 0) {
                this.handleSearch(searchInput.value);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                autocompleteResults.classList.remove('active');
            }
        });

        document.getElementById('tile-view-btn').addEventListener('click', () => this.setView('tile'));
        document.getElementById('list-view-btn').addEventListener('click', () => this.setView('list'));
        
        document.getElementById('toggle-filters').addEventListener('click', () => {
            document.getElementById('filters-panel').classList.toggle('open');
            document.getElementById('toggle-filters').classList.toggle('open');
        });

        const filterIds = ['filter-players', 'filter-playtime', 'filter-age', 'filter-complexity', 'filter-crafting', 'filter-theme', 'filter-mechanism', 'filter-year', 'filter-price', 'filter-curated'];
        filterIds.forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                const filterKey = id.replace('filter-', '');
                this.filters[filterKey] = e.target.value;
                this.applyFiltersAndSort();
            });
        });

        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.applyFiltersAndSort();
        });

        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());
    },

    handleSearch(query) {
        const autocompleteResults = document.getElementById('autocomplete-results');
        
        // Always filter on any search input (even single chars)
        this.filters.search = query.toLowerCase();
        
        // Apply filters and sort
        this.applyFiltersAndSort();
        
        // Show autocomplete results for longer queries
        if (query.length < 2) {
            autocompleteResults.classList.remove('active');
            return;
        }

        const matches = this.filteredGames.slice(0, 8);
        
        if (matches.length > 0) {
            autocompleteResults.innerHTML = matches.map(game => `
                <a href="detail.html?id=${game.id}" class="autocomplete-item">
                    <img src="${game.IMAGE || this.FALLBACK_IMAGE}" alt="${game['GAME TITLE']}" onerror="this.src='${this.FALLBACK_IMAGE}'">
                    <div class="autocomplete-item-info">
                        <div class="autocomplete-item-title">${game['GAME TITLE']}</div>
                        <div class="autocomplete-item-meta">${game.DESIGNER || 'Unknown'} • ${game['FREE OR PAID'] || 'N/A'}</div>
                    </div>
                </a>
            `).join('');
            autocompleteResults.classList.add('active');
        } else {
            autocompleteResults.innerHTML = '<div class="autocomplete-item"><div class="autocomplete-item-info">No games found</div></div>';
            autocompleteResults.classList.add('active');
        }
    },

    populateFilters() {
        const themes = [...new Set(this.games.map(g => g.THEME).filter(Boolean))].sort();
        const mechanisms = [...new Set(this.games.map(g => g['MAIN MECHANISM']).filter(Boolean))].sort();
        const years = [...new Set(this.games.map(g => g['RELEASE YEAR']).filter(Boolean))].sort((a, b) => b - a);
        
        // Extract unique player count values from actual data and add "Players" suffix
        const playerCounts = [...new Set(this.games.map(g => g['NUMBER OF PLAYERS']).filter(Boolean).sort())];
        
        // Extract unique playtime values
        const playtimes = [...new Set(this.games.map(g => g.PLAYTIME).filter(Boolean).sort())];
        
        // Extract unique age range values
        const ages = [...new Set(this.games.map(g => g['AGE RANGE']).filter(Boolean).sort())];
        
        // Extract unique crafting challenge values
        const craftingLevels = [...new Set(this.games.map(g => g['PNP CRAFTING CHALLENGE LEVEL']).filter(Boolean).sort())];
        
        // Extract unique curated list tags
        const curatedTags = new Set();
        this.games.forEach(g => {
            if (g['CURATED LISTS']) {
                // Split by comma for multiple tags and normalize
                g['CURATED LISTS'].split(',').forEach(tag => {
                    const normalized = tag.trim().toUpperCase();
                    if (normalized) curatedTags.add(normalized);
                });
            }
        });
        
        this.populateSelect('filter-theme', themes);
        this.populateSelect('filter-mechanism', mechanisms);
        this.populateSelect('filter-year', years);
        
        // Add "Players" suffix to player count options (except empty one)
        if (playerCounts.length > 0) {
            const select = document.getElementById('filter-players');
            select.innerHTML = '<option value="">All</option>';
            playerCounts.forEach(count => {
                const opt = document.createElement('option');
                opt.value = count;
                opt.textContent = `${count} Players`;
                select.appendChild(opt);
            });
        }
        
        // Populate playtime filter dynamically
        if (playtimes.length > 0) {
            const select = document.getElementById('filter-playtime');
            select.innerHTML = '<option value="">All</option>';
            playtimes.forEach(time => {
                const opt = document.createElement('option');
                opt.value = time;
                opt.textContent = time;
                select.appendChild(opt);
            });
        }
        
        // Populate age range filter dynamically
        if (ages.length > 0) {
            const select = document.getElementById('filter-age');
            select.innerHTML = '<option value="">All</option>';
            ages.forEach(age => {
                const opt = document.createElement('option');
                opt.value = age;
                opt.textContent = age;
                select.appendChild(opt);
            });
        }
        
        // Populate crafting challenge filter with reordering and descriptions
if (craftingLevels.length > 0) {
            const select = document.getElementById('filter-crafting');
            select.innerHTML = '<option value="">All</option>';
            
            // Map level keys to their full description with parenthetical explanation
            const craftingLevelMap = {
                'quick print': '(no crafting required)',
                'simple cuts': '(a few cards or tiles)', 
                'moderate assembly': '(cards, some cutting required)',
                'advanced crafting': '(many cards, folding boards, tiles, circle tokens)',
                'expert crafting': "(100's of cards, extensive assembly)"
            };
            
            // Order for display
            const levelOrder = [
                'quick print',
                'simple cuts',
                'moderate assembly',
                'advanced crafting',
                'expert crafting'
            ];
            
            // Add levels in defined order
            levelOrder.forEach(orderKey => {
                const matchingLevel = craftingLevels.find(level => 
                    level.toLowerCase().includes(orderKey)
                );
                
                if (matchingLevel) {
                    const opt = document.createElement('option');
                    opt.value = matchingLevel;
                    const displayText = `${orderKey.charAt(0).toUpperCase() + orderKey.slice(1)} ${
                        craftingLevelMap[orderKey]
                    }`;
                    opt.textContent = displayText;
                    select.appendChild(opt);
                }
            });
        }
        
        this.populateSelect('filter-curated', Array.from(curatedTags).sort());
    },

    populateSelect(id, options) {
        const select = document.getElementById(id);
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });
    },

    applyFiltersAndSort() {
        this.filteredGames = this.games.filter(game => {
            if (this.filters.search) {
                const searchFields = [
                    game['GAME TITLE'],
                    game.DESIGNER,
                    game.THEME,
                    game['MAIN MECHANISM'],
                    game['ONE-SENTENCE SHORT DESCRIPTION']
                ].filter(Boolean).join(' ').toLowerCase();
                
                if (!searchFields.includes(this.filters.search)) {
                    return false;
                }
            }

            if (this.filters.players) {
                const players = game['NUMBER OF PLAYERS'] || '';
                
                // Exact match for player count - filter value must be in the players field
                if (!players.includes(this.filters.players)) return false;
            }

            if (this.filters.playtime) {
                const playtime = game.PLAYTIME || '';
                if (playtime.toLowerCase() !== this.filters.playtime.toLowerCase()) return false;
            }

            if (this.filters.age) {
                const age = game['AGE RANGE'] || '';
                if (age.toLowerCase() !== this.filters.age.toLowerCase()) return false;
            }

            if (this.filters.complexity && game['GAMEPLAY COMPLEXITY'] !== this.filters.complexity) {
                return false;
            }

            if (this.filters.crafting && !game['PNP CRAFTING CHALLENGE LEVEL']?.includes(this.filters.crafting)) {
                return false;
            }

            if (this.filters.theme && game.THEME !== this.filters.theme) {
                return false;
            }

            if (this.filters.mechanism && game['MAIN MECHANISM'] !== this.filters.mechanism) {
                return false;
            }

            if (this.filters.year && game['RELEASE YEAR'] !== this.filters.year) {
                return false;
            }

            if (this.filters.price) {
                const priceType = game['FREE OR PAID'] || '';
                if (this.filters.price === 'Free' && priceType !== 'Free') return false;
                if (this.filters.price === 'Paid' && priceType !== 'Paid') return false;
                if (this.filters.price === 'Name your price' && priceType !== 'Name your price') return false;
            }

            if (this.filters.curated && !game['CURATED LISTS']?.includes(this.filters.curated)) {
                return false;
            }

            return true;
        });

        this.sortGames();
        
        this.currentPage = 1;
        this.renderGames();
        this.renderPagination();
        this.updateResultsCount();
    },

    sortGames() {
        const sortOrder = this.sortBy;
        
        this.filteredGames.sort((a, b) => {
            switch(sortOrder) {
                case 'alpha-asc':
                    return (a['GAME TITLE'] || '').localeCompare(b['GAME TITLE'] || '');
                case 'alpha-desc':
                    return (b['GAME TITLE'] || '').localeCompare(a['GAME TITLE'] || '');
                case 'year-desc':
                    return (b['RELEASE YEAR'] || 0) - (a['RELEASE YEAR'] || 0);
                case 'year-asc':
                    return (a['RELEASE YEAR'] || 0) - (b['RELEASE YEAR'] || 0);
                case 'newest':
                    // Sort by reverse index - games loaded in order, newest added first
                    const newIndex = this.games.indexOf(b);
                    const oldIndex = this.games.indexOf(a);
                    return newIndex - oldIndex;
                case 'original':
                default:
                    return (a['DATE ADDED'] || '').localeCompare(b['DATE ADDED'] || '');
            }
        });
    },

    clearFilters() {
        this.filters = {
            players: '',
            complexity: '',
            crafting: '',
            theme: '',
            mechanism: '',
            playtime: '',
            age: '',
            curated: '',
            price: '',
            search: ''
        };

        document.getElementById('search-input').value = '';
        ['filter-players', 'filter-playtime', 'filter-age', 'filter-complexity', 'filter-crafting', 'filter-theme', 'filter-mechanism', 'filter-year', 'filter-price', 'filter-curated'].forEach(id => {
            document.getElementById(id).value = '';
        });

        document.getElementById('sort-by').value = 'newest';
        this.sortBy = 'newest';

        this.currentPage = 1;
        this.applyFiltersAndSort();
    },

    setView(view) {
        this.currentView = view;
        const grid = document.getElementById('games-grid');
        grid.className = `games-grid ${view}-view`;
        
        document.getElementById('tile-view-btn').classList.toggle('active', view === 'tile');
        document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
    },

    getPaginatedGames() {
        const start = (this.currentPage - 1) * this.gamesPerPage;
        const end = start + this.gamesPerPage;
        return this.filteredGames.slice(start, end);
    },

    getTotalPages() {
        return Math.ceil(this.filteredGames.length / this.gamesPerPage);
    },

    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderGames();
        this.renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    renderPagination() {
        const totalPages = this.getTotalPages();
        const currentPage = this.currentPage;
        
        const renderPageNumbers = () => {
            let html = '';
            const maxVisible = 5;
            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let end = Math.min(totalPages, start + maxVisible - 1);
            
            if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
            }

            if (start > 1) {
                html += `<button class="page-btn" data-page="1">1</button>`;
                if (start > 2) html += `<span class="page-ellipsis">...</span>`;
            }

            for (let i = start; i <= end; i++) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }

            if (end < totalPages) {
                if (end < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
                html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
            }

            return html;
        };

        const paginationHTML = `
            <div class="pagination">
                <button class="page-btn nav-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                    &larr; Prev
                </button>
                <div class="page-numbers">
                    ${renderPageNumbers()}
                </div>
                <button class="page-btn nav-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                    Next &rarr;
                </button>
            </div>
        `;

        document.getElementById('pagination-top').innerHTML = paginationHTML;
        document.getElementById('pagination-bottom').innerHTML = paginationHTML;

        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (page) this.goToPage(page);
            });
        });
    },

    renderGames() {
        const grid = document.getElementById('games-grid');
        
        if (this.filteredGames.length === 0) {
            grid.innerHTML = `
                <div class="no-results">
                    <h3>No games found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        const paginatedGames = this.getPaginatedGames();
        grid.innerHTML = paginatedGames.map(game => this.renderGameCard(game)).join('');
    },

    renderGameCard(game) {
        const priceClass = game['FREE OR PAID'] === 'Free' ? 'free' : game['FREE OR PAID'] === 'Paid' ? 'paid' : '';
        const priceText = game['FREE OR PAID'] || 'N/A';
        
        const description = game['ONE-SENTENCE SHORT DESCRIPTION'] || '';
        const imageSrc = game.IMAGE || this.FALLBACK_IMAGE;

        return `
            <a href="detail.html?id=${game.id}" class="game-card ${this.currentView === 'list' ? 'list-item' : ''}">
                <div class="game-card-image-wrapper">
                    <div class="game-card-image-bg" style="background-image: url('${imageSrc}')"></div>
                    <img class="game-card-image" src="${imageSrc}" alt="${game['GAME TITLE']}" onerror="this.src='${this.FALLBACK_IMAGE}'">
                </div>
                <div class="game-card-content">
                    <h3 class="game-card-title">${game['GAME TITLE']}</h3>
                    <p class="game-card-meta">${game.DESIGNER || 'Unknown'} • ${game['NUMBER OF PLAYERS'] || 'N/A'} players • ${game.PLAYTIME || 'N/A'}</p>
                    ${description ? `<p class="game-card-description">${description}</p>` : ''}
                    <div class="game-card-tags">
                        <span class="game-tag ${priceClass}">${priceText}</span>
                        ${game.THEME ? `<span class="game-tag">${game.THEME}</span>` : ''}
                        ${game['MAIN MECHANISM'] ? `<span class="game-tag">${game['MAIN MECHANISM']}</span>` : ''}
                    </div>
                </div>
            </a>
        `;
    },

    updateResultsCount() {
        const count = this.filteredGames.length;
        document.getElementById('results-count').textContent = 
            `${count} game${count !== 1 ? 's' : ''} found`;
    },

    setupURLHandling() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        
        if (searchQuery) {
            document.getElementById('search-input').value = searchQuery;
            this.handleSearch(searchQuery);
        }
    }
};

function loadGameDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    
    if (!gameId) {
        document.getElementById('game-detail').innerHTML = `
            <div class="no-results">
                <h3>Game not found</h3>
                <p>No game ID provided.</p>
            </div>
        `;
        return;
    }

    fetch('data/games.csv')
        .then(response => response.text())
        .then(csvText => {
            const games = parseCSV(csvText);
            const game = games.find(g => g.id === gameId);
            
            if (!game) {
                document.getElementById('game-detail').innerHTML = `
                    <div class="no-results">
                        <h3>Game not found</h3>
                        <p>The requested game could not be found.</p>
                    </div>
                `;
                return;
            }

            renderGameDetail(game);
        })
        .catch(error => {
            console.error('Error loading game:', error);
            document.getElementById('game-detail').innerHTML = `
                <div class="no-results">
                    <h3>Error loading game</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        });
}

function parseCSV(csvText) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                cell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(cell);
            cell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (cell || row.length > 0) {
                row.push(cell);
                if (row.some(c => c && c.trim())) rows.push(row);
            }
            row = [];
            cell = '';
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            cell += char;
        }
    }
    if (cell || row.length > 0) {
        row.push(cell);
        if (row.some(c => c && c.trim())) rows.push(row);
    }
    
    if (rows.length < 2) return [];
    
    const headers = rows[0].map(h => h ? h.trim() : '');
    
    return rows.slice(1).map(rowValues => {
        const game = {};
        headers.forEach((header, index) => {
            game[header] = rowValues[index] ? rowValues[index].trim() : '';
        });
        game.id = slugify(game['GAME TITLE']);
        return game;
    });
}

function slugify(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

const FALLBACK_IMAGE = 'images/pnpfinder-fallback.svg';

function renderGameDetail(game) {
    const priceClass = game['FREE OR PAID'] === 'Free' ? 'free' : game['FREE OR PAID'] === 'Paid' ? 'paid' : '';
    const priceText = game['FREE OR PAID'] === 'Name your price' ? 'Name Your Price' : game['FREE OR PAID'] || 'N/A';
    const imageSrc = game.IMAGE || FALLBACK_IMAGE;
    
    document.title = `${game['GAME TITLE']} - PnP Finder`;
    
    document.getElementById('game-detail').innerHTML = `
        <div class="detail-header">
            <div class="detail-image-wrapper">
                <div class="detail-image-bg" style="background-image: url('${imageSrc}')"></div>
                <img class="detail-image" src="${imageSrc}" alt="${game['GAME TITLE']}" onerror="this.src='${FALLBACK_IMAGE}'">
            </div>
            <div class="detail-info">
                <h1 class="detail-title">${game['GAME TITLE']}</h1>
                <p class="detail-designer">by ${game.DESIGNER || 'Unknown'}${game.PUBLISHER ? ` (${game.PUBLISHER})` : ''}</p>
                <span class="detail-price ${priceClass}">${priceText}${game.PRICE ? ` - ${game.PRICE}` : ''}</span>
                <p class="detail-description">${(game['GAME DESCRIPTION'] || game['ONE-SENTENCE SHORT DESCRIPTION'] || '').replace(/\n/g, '<br>')}</p>
                <div class="detail-actions">
                    ${game['DOWNLOAD LINK'] ? `<a href="${game['DOWNLOAD LINK']}" target="_blank" rel="noopener" class="detail-btn primary">Get Game</a>` : ''}
                    ${game['SECONDARY DOWNLOAD LINK'] ? `<a href="${game['SECONDARY DOWNLOAD LINK']}" target="_blank" rel="noopener" class="detail-btn secondary">Alt Download</a>` : ''}
                    <a href="mailto:help@pnpfinder.com?subject=${encodeURIComponent('Dead Link Report: ' + (game['GAME TITLE'] || 'Unknown Game'))}&body=${encodeURIComponent('Game Title: ' + (game['GAME TITLE'] || 'Unknown') + '\nDesigner: ' + (game.DESIGNER || 'Unknown') + '\nPublisher: ' + (game.PUBLISHER || 'Unknown') + '\n\nDead Link: ' + (game['DOWNLOAD LINK'] || 'Unknown') + '\n\nPlease investigate this link.')}" class="detail-btn secondary">Report Dead Link</a>
                </div>
            </div>
        </div>

        <section class="detail-section">
            <h2 class="detail-section-title">Game Info</h2>
            <div class="detail-stats">
                <div class="detail-stat">
                    <div class="detail-stat-label">Players</div>
                    <div class="detail-stat-value">${game['NUMBER OF PLAYERS'] || 'N/A'}</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-label">Playtime</div>
                    <div class="detail-stat-value">${game.PLAYTIME || 'N/A'}</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-label">Age</div>
                    <div class="detail-stat-value">${game['AGE RANGE'] || 'N/A'}</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-label">Complexity</div>
                    <div class="detail-stat-value">${game['GAMEPLAY COMPLEXITY'] || 'N/A'}</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-label">Crafting Level</div>
                    <div class="detail-stat-value">${game['PNP CRAFTING CHALLENGE LEVEL'] || 'N/A'}</div>
                </div>
                <div class="detail-stat">
                    <div class="detail-stat-label">Release Year</div>
                    <div class="detail-stat-value">${game['RELEASE YEAR'] || 'N/A'}</div>
                </div>
            </div>
        </section>

        <section class="detail-section">
            <h2 class="detail-section-title">Tags</h2>
            <div class="detail-tags">
                ${game.THEME ? `<span class="detail-tag">${game.THEME}</span>` : ''}
                ${game['MAIN MECHANISM'] ? `<span class="detail-tag">${game['MAIN MECHANISM']}</span>` : ''}
                ${game['SECONDARY MECHANISM'] ? `<span class="detail-tag">${game['SECONDARY MECHANISM']}</span>` : ''}
                ${game['GAME CATEGORY'] ? `<span class="detail-tag">${game['GAME CATEGORY']}</span>` : ''}
                ${game['GAMEPLAY MODE'] ? `<span class="detail-tag">${game['GAMEPLAY MODE']}</span>` : ''}
                ${game.LANGUAGES ? `<span class="detail-tag">${game.LANGUAGES}</span>` : ''}
            </div>
        </section>

        ${game['PRINT COMPONENTS'] || game['OTHER COMPONENTS'] ? `
        <section class="detail-section">
            <h2 class="detail-section-title">Components</h2>
            <div class="detail-components">
                <div class="detail-component">
                    <h4>Print Components</h4>
                    <p>${game['PRINT COMPONENTS'] || 'Not specified'}</p>
                </div>
                <div class="detail-component">
                    <h4>Other Components Needed</h4>
                    <p>${game['OTHER COMPONENTS'] || 'None'}</p>
                </div>
            </div>
        </section>
        ` : ''}
    `;
}

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const navList = document.getElementById('main-nav')?.querySelector('.nav-list');

if (mobileMenuToggle && navList) {
    mobileMenuToggle.addEventListener('click', () => {
        navList.classList.toggle('show');
        const isOpen = navList.classList.contains('show');
        mobileMenuToggle.setAttribute('aria-expanded', isOpen);
    });
}

// Close menu when clicking a link
document.querySelectorAll('#main-nav .nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navList?.classList.remove('show');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.main-nav') && !e.target.closest('.mobile-menu-toggle')) {
        navList?.classList.remove('show');
    }
});

// Nav button click handlers
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPage = btn.dataset.page;
        
        // Update active state
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Navigate to page (except if already on current page)
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (targetPage !== currentPage) {
            window.location.href = targetPage;
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('games-grid')) {
        App.init();
    } else {
        App.initTheme();
    }
    
    // Set active nav button based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.page === currentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
});
