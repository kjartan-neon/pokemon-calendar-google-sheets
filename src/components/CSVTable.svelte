<script lang="ts">
  import { onMount } from 'svelte';
  import { parseCSV, type CSVData } from '../utils/csvParser';

  let csvData: CSVData | null = null;
  let loading = true;
  let error: string | null = null;
  let selectedLeague: string = 'alle';
  let availableLeagues: string[] = [];

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTe5d_kLm4r1dgbaXg6zKNmEhF-IBxjOqbny2gqiR2QdK5Y6P2BJ6FFJBDzesHr0xh1HQtzD0ik841/pub?output=csv';

  // Color palette for leagues
  const leagueColors = [
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', shadow: 'rgba(102, 126, 234, 0.3)' }, // Purple-Blue
    { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', shadow: 'rgba(245, 87, 108, 0.3)' }, // Pink-Red
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', shadow: 'rgba(79, 172, 254, 0.3)' }, // Blue-Cyan
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', shadow: 'rgba(67, 233, 123, 0.3)' }, // Green-Teal
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', shadow: 'rgba(250, 112, 154, 0.3)' }, // Pink-Yellow
    { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', shadow: 'rgba(168, 237, 234, 0.3)' }, // Mint-Pink
    { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', shadow: 'rgba(252, 182, 159, 0.3)' }, // Peach-Orange
    { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', shadow: 'rgba(161, 140, 209, 0.3)' }, // Purple-Pink
    { bg: 'linear-gradient(135deg, #fad0c4 0%, #a8edea 100%)', shadow: 'rgba(250, 208, 196, 0.3)' }, // Peach-Mint
    { bg: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)', shadow: 'rgba(250, 208, 196, 0.3)' }, // Peach-Lavender
    { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', shadow: 'rgba(255, 154, 158, 0.3)' }, // Coral-Pink
  ];

  function getLeagueColor(league: string): { bg: string; shadow: string } {
    if (!league) return leagueColors[0];
    
    // Create a simple hash from the league name to ensure consistent colors
    let hash = 0;
    for (let i = 0; i < league.length; i++) {
      const char = league.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const colorIndex = Math.abs(hash) % leagueColors.length;
    return leagueColors[colorIndex];
  }
 
  async function fetchCSVData() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch(CSV_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      csvData = parseCSV(csvText);
      
      // Extract unique leagues for filter
      if (csvData) {
        const leagues = new Set<string>();
        csvData.rows.forEach(row => {
          if (row[5] && row[5].trim()) {
            leagues.add(row[5].trim());
          }
        });
        availableLeagues = Array.from(leagues).sort();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Kunne ikke hente arrangementsdata';
      console.error('Feil ved henting av CSV:', err);
    } finally {
      loading = false;
    }
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('nb-NO', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  function formatTime(timeStr: string): string {
    if (!timeStr || timeStr.trim() === '') return '';
    return timeStr.trim();
  }

  // Filtrer arrangementer basert på valgt liga
  $: filteredRows = csvData ? csvData.rows.filter(row => {
    // First filter out past events
    if (row[0]) {
      try {
        const eventDate = new Date(row[0]);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of today
        
        if (eventDate < today) {
          return false; // Skip past events
        }
      } catch {
        // If date parsing fails, include the event
      }
    }
    
    // Then filter by league
    if (selectedLeague === 'alle') return true;
    return row[5] && row[5].trim() === selectedLeague;
  }) : [];

  onMount(() => {
    fetchCSVData();
  });
</script>

<div class="events-container">
  <div class="header">
    <h1>📅 Kommende Arrangementer</h1>
    <button on:click={fetchCSVData} disabled={loading} class="refresh-btn">
      {loading ? 'Laster...' : 'Oppdater'}
    </button>
  </div>

  {#if !loading && !error && availableLeagues.length > 0}
    <div class="filter-section">
      <div class="filter-group">
        <label for="league-filter" class="filter-label">
          🏆 Filtrer på liga:
        </label>
        <select id="league-filter" bind:value={selectedLeague} class="league-select">
          <option value="alle">Alle Ligaer ({csvData?.rows.length || 0} arrangementer)</option>
          {#each availableLeagues as league}
            <option value={league}>
              {league} ({csvData?.rows.filter(row => row[5] && row[5].trim() === league).length || 0})
            </option>
          {/each}
        </select>
      </div>
      
      {#if selectedLeague !== 'alle'}
        <button on:click={() => selectedLeague = 'alle'} class="clear-filter-btn">
          Fjern Filter
        </button>
      {/if}
    </div>
  {/if}
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Laster arrangementer...</p>
    </div>
  {:else if error}
    <div class="error">
      <h3>❌ Feil ved lasting av arrangementer</h3>
      <p>{error}</p>
      <button on:click={fetchCSVData} class="retry-btn">Prøv Igjen</button>
    </div>
  {:else if csvData && filteredRows.length > 0}
    <div class="events-list">
      {#each filteredRows as row, index}
        {#if row.length >= 3}
          <div class="event-card">
            <h3 class="headline">{row[2] || 'Arrangement'}
                {#if row[8] && row[8].trim()}
                <span class="type-tag" style="background: {getLeagueColor(row[8].trim()).bg}; box-shadow: 0 2px 4px {getLeagueColor(row[8].trim()).shadow};">
                  {row[8].trim()}
                </span>
              {/if}
            </h3>
            <div class="event-date-time">
              <div class="date">
                {formatDate(row[0])}
                {#if row[1] && row[1].trim()}
                  <span class="time">
                    🕐 {formatTime(row[1])}
                  </span>
                {/if}
                </div>
              {#if row[6] && row[6].trim()}
                <div class="location">
                  📍 {row[6].trim()}
                </div>
              {/if}
            </div>
            
            <div class="event-content">
              
              
              {#if row[7] && row[7].trim().toLowerCase() === 'ja'}
                <div class="full-indicator">
                  ⚠️ Arrangementet er fullt
                </div>
              {/if}
              {#if row[3] && row[3].trim()}
                <p class="description">{row[3]}</p>
              {/if}
              {#if row[5] && row[5].trim()}
                <div class="league-tag" style="background: {getLeagueColor(row[5].trim()).bg}; box-shadow: 0 2px 4px {getLeagueColor(row[5].trim()).shadow};">
                  🏆 {row[5].trim()}
                </div>
              {/if}

            </div>
            
            {#if row[4] && row[4].trim()}
              <div class="event-actions">
                <a href={row[7] && row[7].trim().toLowerCase() === 'ja' ? 'https://oslopokemon.com/turneringer.html' : row[4]} target="_blank" rel="noopener noreferrer" class="register-btn" class:full={row[7] && row[7].trim().toLowerCase() === 'ja'}>
                  {row[7] && row[7].trim().toLowerCase() === 'ja' ? 'Informasjon til spillere →' : 'Meld Deg På →'}
                </a>
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {:else if csvData && csvData.rows.length > 0 && filteredRows.length === 0}
    <div class="empty">
      <p>🔍 Ingen arrangementer funnet for "{selectedLeague}"</p>
      <button on:click={() => selectedLeague = 'alle'} class="clear-filter-btn">
        Vis Alle Arrangementer
      </button>
    </div>
  {:else}
    <div class="empty">
      <p>📭 Ingen arrangementer tilgjengelig</p>
    </div>
  {/if}
</div>

<style>
  .events-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  h1 {
    color: #1a202c;
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .filter-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .filter-label {
    font-weight: 600;
    color: #2d3748;
    font-size: 0.95rem;
    white-space: nowrap;
  }

  .league-select {
    background: #f7fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    color: #2d3748;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 200px;
    flex: 1;
    max-width: 300px;
  }

  .league-select:hover {
    border-color: #cbd5e0;
  }

  .league-select:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  .clear-filter-btn {
    background: #e53e3e;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .clear-filter-btn:hover {
    background: #c53030;
    transform: translateY(-1px);
  }

  .refresh-btn, .retry-btn {
    background: #4299e1;
    color: white;
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(66, 153, 225, 0.2);
  }

  .refresh-btn:hover:not(:disabled), .retry-btn:hover {
    background: #3182ce;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(66, 153, 225, 0.3);
  }

  .refresh-btn:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .loading, .error, .empty {
    text-align: center;
    padding: 3rem 2rem;
    background: #f7fafc;
    border-radius: 12px;
    margin: 2rem 0;
  }

  .loading {
    color: #4a5568;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #4299e1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error {
    background: #fed7d7;
    border: 1px solid #fc8181;
    color: #c53030;
  }

  .error h3 {
    margin: 0 0 1rem 0;
    color: #c53030;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .event-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
  }

  .event-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
  }

  .event-date-time {
    margin-bottom: 1rem;

  }

  .date {
    text-transform: capitalize;
    font-size: 0.9rem; 
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 0.25rem;
  }

  .time {
    color: #4299e1;
    font-weight: 500;
    padding-left: 1rem;
  }

  .event-content {
    margin-bottom: 1.5rem;
  }

  .headline {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1a202c;
    margin: 0 0 0.75rem 0;
    line-height: 1.3;
  }

  .location {
    color: #4a5568;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .full-indicator {
    background: #fed7d7;
    color: #c53030;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    border: 1px solid #fc8181;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .description {
    color: #4a5568;
    line-height: 1.6;
    margin: 0;
    font-size: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .league-tag {
    display: inline-block;
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 0.5rem;
    text-shadow: 0 0px 3px rgba(0, 0, 0, 0.75);
  }

  .type-tag{
    display: inline-block;
    color: black;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    float: right;
  }

  .event-actions {
    display: flex;
    justify-content: flex-end;
  }

  .register-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .register-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    text-decoration: none;
  }

  .register-btn:active {
    transform: translateY(0);
  }

  .register-btn.full {
    background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
    box-shadow: 0 2px 4px rgba(160, 174, 192, 0.3);
  }

  .register-btn.full:hover {
    background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
    box-shadow: 0 4px 12px rgba(160, 174, 192, 0.4);
  }

  .empty {
    color: #718096;
    font-size: 1.1rem;
  }

  @media (max-width: 640px) {
    .events-container {
      padding: 0.1rem;
    }

    .filter-section {
      flex-direction: column;
      align-items: stretch;
      padding: 1.25rem;
    }

    .filter-group {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .league-select {
      min-width: auto;
      max-width: none;
    }

    .header {
      flex-direction: column;
      text-align: left;
      gap: 1rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .event-card {
      padding: 1.25rem;
    }

    .headline {
      font-size: 1.5rem;
    }

    .date {
      
    }

    .register-btn {
      width: 100%;
      justify-content: center;
      padding: 1rem;
    }

    .event-actions {
      justify-content: stretch;
    }
  }
</style>