# PnP Finder

**Print and Play Finder** - A web application for discovering print-and-play (PNP) board games.

## Overview

PnP Finder is a static single-page web application that serves as a searchable catalog of print-and-play board games. Users can browse, search, and filter through a curated collection of free and paid PNP games with detailed information about each title.

### Key Features

- **Search & Autocomplete**: Real-time game search with autocomplete suggestions
- **View Modes**: Toggle between tile (grid) and list views
- **Advanced Filtering**: Filter by players, playtime, age range, complexity, crafting level, theme, mechanism, year, price, and curated lists
- **Sorting**: Sort by newest, alphabetically, release year, or order added
- **Dark Mode**: Toggle between light and dark themes with localStorage persistence
- **Responsive Design**: Mobile-friendly layout with CSS custom properties
- **Pagination**: 24 games per page with navigate through results
- **Detail Pages**: Dedicated pages for each game with comprehensive information

## Project Structure

```
pnpfinder/
├── index.html          # Main game listing page
├── detail.html         # Individual game detail page
├── css/
│   └── styles.css      # Complete styling with dark mode support
├── js/
│   └── app.js          # Application logic and UI rendering
├── data/
│   ├── games.csv       # Game catalog (678 entries as of 2026-03-06)
│   └── games.json      # [Planned] JSON version for native parsing
├── images/
│   └── pnpfinder-fallback.svg  # Fallback image for broken game covers
├── .gitignore          # Git ignore rules (.aider* files)
└── README.md           # This file
```

## Data Structure

### CSV Fields (games.csv)

| Field | Description |
|-------|-------------|
| `GAME TITLE` | Game name |
| `DESIGNER` | Game designer name |
| `PUBLISHER` | Publisher or web publisher |
| `FREE OR PAID` | Free, Paid, or Name your price |
| `PRICE` | Price if applicable |
| `NUMBER OF PLAYERS` | Player count |
| `PLAYTIME` | Estimated play duration |
| `AGE RANGE` | Recommended age |
| `THEME` | Game theme (Fantasy, Sci-Fi, etc.) |
| `MAIN MECHANISM` | Primary game mechanic |
| `SECONDARY MECHANISM` | Secondary mechanic |
| `GAMEPLAY COMPLEXITY` | Light, Light-Medium, Medium, Heavy |
| `GAMEPLAY MODE` | Solo, Competitive, Cooperative |
| `GAME CATEGORY` | Game category/type |
| `PNP CRAFTING CHALLENGE LEVEL` | Complexity of assembly (e.g., "Simple Cuts", "Moderate Assembly") |
| `ONE-SENTENCE SHORT DESCRIPTION` | Brief game description |
| `GAME DESCRIPTION` | Full game description |
| `DOWNLOAD LINK` | Primary download URL |
| `SECONDARY DOWNLOAD LINK` | Alternative download URL |
| `PRINT COMPONENTS` | What needs to be printed |
| `OTHER COMPONENTS` | Additional components needed (dice, cards, etc.) |
| `LANGUAGES` | Supported languages |
| `RELEASE YEAR` | Year released |
| `IMAGE` | URL to game cover image |
| `CURATED LISTS` | Curation tags (e.g., "STAFF PICKS", "2024 PNP HIDEAWAY TOP 10") |
| `REPORT DEAD LINK` | Email for reporting broken links |
| `DATE ADDED` | Date added to catalog |

**Note**: The CSV contains **678 games** (header row excluded). Some rows contain quoted fields with embedded commas, which makes raw line counting inaccurate. The parser correctly handles these quoted fields.

## Technical Details

### Architecture

- **Vanilla JavaScript**: No frameworks or build tools required
- **Static Site**: Runs entirely client-side with no backend needed
- **CSV Data Store**: Game data stored in a single CSV file (no database)
- **CSS Custom Properties**: Theme variables for easy theming

### Key JavaScript Functions

**App Object (index.html)**:
- `init()` - Initialize application on page load
- `loadGames()` - Fetch and parse games.csv
- `parseCSV(csvText)` - Custom CSV parser handling quoted fields
- `applyFiltersAndSort()` - Filter and sort game list
- `renderGames()` - Render game cards to grid
- `handleSearch(query)` - Autocomplete search functionality
- `setupURLHandling()` - URL parameter handling for sharing

**Detail Page Functions (detail.html)**:
- `loadGameDetail()` - Load game data based on URL parameter
- `parseCSV(csvText)` - Parse games data for lookup
- `renderGameDetail(game)` - Render detailed game view

### CSS Features

- **CSS Variables**: Theme colors, spacing, shadows, border radius
- **Dark Mode**: `[data-theme="dark"]` selector overrides light theme variables
- **Responsive Layout**: Flexbox and percentage-based widths
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
- **Transitions**: Smooth animations for hover states and theme switching

### URL Parameters

- `index.html?q=searchterm` - Pre-populate search with query
- `detail.html?id=game-slug` - Load specific game detail (e.g., `agent-decker`)

## Data Sync Workflow (Production)

```
User Submission → Form → Google Sheet 
                          ↓
            GitHub Action: Pull from Sheets → Write games.csv
                          ↓
                    Commit to GitHub Pages
```

**JSON Conversion Pipeline** (Planned):
1. Current sync writes `games.csv`
2. New step converts CSV → JSON during deploy
3. Browser fetches native JSON instead of parsing CSV text

## Usage

### Running Locally

1. Clone or download the repository
2. Open `index.html` in a web browser
   ```bash
   open /Users/gonz/Desktop/qwen\ projects/pnpfinder/index.html
   ```

### Adding New Games

To add a new game to the catalog:

1. Edit `data/games.csv` or submit via site form (production)
2. Add a new row following the existing format
3. Include all relevant fields (use empty strings for optional fields)
4. Save and refresh the browser page

Example entry:
```csv
My New Game,Designer Name,Web Published,Paid,$9.99,2-4,60 minutes,12+,Fantasy,Card Drafting,,MEDIUM,Solo,Drafting,Simple Cuts (a few cards or tiles),A great new game.,Full description here.,https://example.com/download,,"Cards, tokens",,English,2025,https://example.com/image.png,,help@pnpfinder.com,
```

### Updating Images

- Add image URL to the `IMAGE` column in games.csv (or games.json)
- Ensure images are hosted (GitHub, cloud storage, etc.)
- Fallback SVG will display if image fails to load

## File Locations for Quick Reference

- **Main app logic**: `js/app.js` (~26KB)
- **Styles**: `css/styles.css` (~17KB)  
- **Game database**: `data/games.csv` (656KB, 678 games - proper CSV parsing required due to quoted fields with embedded commas)
- **Homepage**: `index.html`
- **Detail page**: `detail.html`

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- LocalStorage for theme preference persistence

## Planned Enhancements & Quality of Life Improvements

### Performance & Data (Priority)

1. **JSON Export** - Convert CSV to native JSON format during build/deploy
   - Benefits: 2-3x faster page load, no custom parsing needed, type safety
   - Implementation: Add `csv-to-json.js` converter to GitHub Actions workflow

2. **Image Lazy Loading** - Defer loading off-screen images until scrolled into view
   - Benefits: Faster initial load, reduced bandwidth for large catalogs

3. **Service Worker/Caching** - Cache games data and static assets offline
   - Benefits: Works without internet, faster repeat visits, better PWA experience

### User Experience

4. **Bookmarks/Favorites System** - Allow users to save games via localStorage
   - Features: Star button on game cards, "My Favorites" filter/view
   - Benefits: Users can track games they want to print later

5. **Keyboard Navigation & Shortcuts** - Full keyboard accessibility
   - Features: Arrow keys for filters, Enter to select search results, ESC to close modals
   - Benefits: Better accessibility, faster power-user navigation

6. **Share Links with Pre-filled Filters** - Generate URLs that preserve filter state
   - Example: `index.html?players=2&theme=Fantasy&sort=newest`
   - Benefits: Easy sharing of curated game lists with others

7. **Loading States & Skeleton Screens** - Show loading indicators while data fetches
   - Benefits: Perceived performance, better UX during slow connections

### Data Quality & Maintenance

8. **Dead Link Auto-Check** - Periodic script to verify all download links are valid
   - Features: GitHub Action that runs weekly, reports 404s via email/slack
   - Benefits: Keep catalog trustworthy without manual verification

9. **Duplicate Detection** - Script to identify games with same title/designer
   - Features: Report potential duplicates when new entries added
   - Benefits: Maintain clean catalog data

10. **Enhanced Search** - Fuzzy matching, substring search, and tag search
    - Features: Search by mechanism ("deck building"), partial name matches ("Galdor's Gri")
    - Benefits: More forgiving search experience for users

### Accessibility Improvements

11. **ARIA Labels & Screen Reader Support** - Full WCAG 2.1 compliance
    - Features: Descriptive labels for all interactive elements, skip-to-main-content link
    - Benefits: Accessible to visually impaired users

12. **Focus Indicators** - Visible focus rings for keyboard navigation
    - Benefits: Better accessibility and usability

### Analytics & Insights (Optional)

13. **Most Popular Games Tracking** - Client-side tracking of frequently viewed games
    - Features: Local analytics or Google Analytics integration
    - Benefits: Understand user preferences, showcase trending games

14. **Export Filtered Results** - Allow users to download their filtered list as CSV/JSON
    - Benefits: Users can export their curated collection for personal use

## Credits

PnP Finder is a standalone project created in 2026. The application design draws inspiration from modern board game discovery platforms.

---

**License**: This project is provided as-is for personal and educational use. Game content and download links are property of their respective creators/publishers.

**Support**: Report broken links or issues to: `help@pnpfinder.com`
