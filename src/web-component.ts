// CSV Parser utility
interface CSVData {
  headers: string[];
  rows: string[][];
}

function parseCSV(csvText: string): CSVData {
  const lines = csvText.trim().split('\n');
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));

  return { headers, rows };
}

// Web Component Class
class ArrangementOversikt extends HTMLElement {
  private csvData: CSVData | null = null;
  private loading = true;
  private error: string | null = null;
  private selectedLeague = 'alle';
  private availableLeagues: string[] = [];
  private showOnlyCupChallenge = false;
  private shadow: ShadowRoot;

  private readonly CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTe5d_kLm4r1dgbaXg6zKNmEhF-IBxjOqbny2gqiR2QdK5Y6P2BJ6FFJBDzesHr0xh1HQtzD0ik841/pub?output=csv';

  private readonly leagueColors = [
    { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', shadow: 'rgba(102, 126, 234, 0.3)' },
    { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', shadow: 'rgba(245, 87, 108, 0.3)' },
    { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', shadow: 'rgba(79, 172, 254, 0.3)' },
    { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', shadow: 'rgba(67, 233, 123, 0.3)' },
    { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', shadow: 'rgba(250, 112, 154, 0.3)' },
    { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', shadow: 'rgba(168, 237, 234, 0.3)' },
    { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', shadow: 'rgba(255, 154, 158, 0.3)' },
    { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', shadow: 'rgba(252, 182, 159, 0.3)' },
    { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', shadow: 'rgba(161, 140, 209, 0.3)' },
    { bg: 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)', shadow: 'rgba(250, 208, 196, 0.3)' },
  ];

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
    this.fetchCSVData();
  }

  private getLeagueColor(league: string): { bg: string; shadow: string } {
    if (!league) return this.leagueColors[0];
    
    let hash = 0;
    for (let i = 0; i < league.length; i++) {
      const char = league.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const colorIndex = Math.abs(hash) % this.leagueColors.length;
    return this.leagueColors[colorIndex];
  }

  private async fetchCSVData() {
    try {
      this.loading = true;
      this.error = null;
      
      const response = await fetch(this.CSV_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      this.csvData = parseCSV(csvText);
      
      if (this.csvData) {
        const leagues = new Set<string>();
        this.csvData.rows.forEach(row => {
          if (row[5] && row[5].trim()) {
            leagues.add(row[5].trim());
          }
        });
        this.availableLeagues = Array.from(leagues).sort();
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Kunne ikke hente arrangementsdata';
      console.error('Feil ved henting av CSV:', err);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private formatDate(dateStr: string): string {
    try {
      // Parse DD.MM.YY or DD.MM.YYYY format
      const parts = dateStr.trim().split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        let year = parseInt(parts[2], 10);
        
        // Handle 2-digit years (e.g., 25 -> 2025)
        if (year < 100) {
          year += 2000;
        }
        
        const date = new Date(year, month, day);
        
        return date.toLocaleDateString('nb-NO', { 
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
      
      // Fallback to original parsing
      const date = new Date(dateStr);
      return date.toLocaleDateString('nb-NO', { 
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  private formatTime(timeStr: string): string {
    if (!timeStr || timeStr.trim() === '') return '';
    return timeStr.trim();
  }

  private getFilteredRows() {
    if (!this.csvData) return [];
    return this.csvData.rows.filter(row => {
      // First filter out past events
      if (row[0]) {
        try {
          // Parse DD.MM.YY or DD.MM.YYYY format
          const parts = row[0].trim().split('.');
          let eventDate;
          
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
            let year = parseInt(parts[2], 10);
            
            // Handle 2-digit years (e.g., 25 -> 2025)
            if (year < 100) {
              year += 2000;
            }
            
            eventDate = new Date(year, month, day);
          } else {
            eventDate = new Date(row[0]);
          }
          
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
      if (this.selectedLeague === 'alle') return true;
      return row[5] && row[5].trim() === this.selectedLeague;
    }).filter(row => {
      // Filter by Cup/Challenge if enabled
      if (!this.showOnlyCupChallenge) return true;
      
      // Check if format field (index 9) contains "cup" or "challenge" (case insensitive)
      const format = row[9] && row[9].trim().toLowerCase();
      return format && (format.includes('cup') || format.includes('challenge'));
    });
  }

  private getStyles() {
    return `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.5;
          font-weight: 400;
          color: #213547;
          background-color: #f7fafc;
        }

        * {
          box-sizing: border-box;
        }

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

        .cup-challenge-btn {
          background: #38a169;
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

        .cup-challenge-btn:hover {
          background: #2f855a;
          transform: translateY(-1px);
        }

        .cup-challenge-btn.active {
          background: #2d3748;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .cup-challenge-btn.active:hover {
          background: #1a202c;
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
          padding-bottom: 1rem;
          border-bottom: 2px solid #f7fafc;
        }

        .date {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.25rem;
        }

        .time {
          font-size: 0.9rem;
          color: #4299e1;
          font-weight: 500;
        }

        .event-content {
          margin-bottom: 1.5rem;
        }

        .headline {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 0.75rem 0;
          line-height: 1.3;
        }

        .description {
          color: #4a5568;
          line-height: 1.6;
          margin: 0;
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
        }

        .league-tag {
          display: inline-block;
          color: white;
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 0.5rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

        .empty {
          color: #718096;
          font-size: 1.1rem;
        }

        @media (max-width: 640px) {
          .events-container {
            padding: 0.75rem;
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
            text-align: center;
            gap: 1rem;
          }

          h1 {
            font-size: 1.5rem;
          }

          .event-card {
            padding: 1.25rem;
          }

          .headline {
            font-size: 1.1rem;
          }

          .date {
            font-size: 1rem;
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
    `;
  }

  private render() {
    const filteredRows = this.getFilteredRows();
    
    this.shadow.innerHTML = `
      ${this.getStyles()}
      <div class="events-container">
        <div class="header">
          <h1>📅 Kommende Arrangementer</h1>
          <button class="refresh-btn" ${this.loading ? 'disabled' : ''}>
            ${this.loading ? 'Laster...' : 'Oppdater'}
          </button>
        </div>

        ${!this.loading && !this.error && this.availableLeagues.length > 0 ? `
          <div class="filter-section">
            <div class="filter-group">
              <label for="league-filter" class="filter-label">
                🏆 Filtrer etter Liga:
              </label>
              <select id="league-filter" class="league-select">
                <option value="alle">Alle Ligaer (${this.csvData?.rows.length || 0} arrangementer)</option>
                ${this.availableLeagues.map(league => `
                  <option value="${league}" ${this.selectedLeague === league ? 'selected' : ''}>
                    ${league} (${this.csvData?.rows.filter(row => row[5] && row[5].trim() === league).length || 0} arrangementer)
                  </option>
                `).join('')}
              </select>
            </div>
            
            ${this.selectedLeague !== 'alle' ? `
              <button class="clear-filter-btn">
                Fjern Filter
              </button>
            ` : ''}
            
            <button class="cup-challenge-btn ${this.showOnlyCupChallenge ? 'active' : ''}">
              Vis bare cup og challenge
            </button>
          </div>
        ` : ''}

        ${this.loading ? `
          <div class="loading">
            <div class="spinner"></div>
            <p>Laster arrangementer...</p>
          </div>
        ` : this.error ? `
          <div class="error">
            <h3>❌ Feil ved lasting av arrangementer</h3>
            <p>${this.error}</p>
            <button class="retry-btn">Prøv Igjen</button>
          </div>
        ` : this.csvData && filteredRows.length > 0 ? `
          <div class="events-list">
            ${filteredRows.map(row => {
              if (row.length < 3) return '';
              const leagueColor = row[5] ? this.getLeagueColor(row[5].trim()) : this.leagueColors[0];
              return `
                <div class="event-card">
                  <div class="event-date-time">
                    <div class="date">
                      ${this.formatDate(row[0])}
                    </div>
                    ${row[1] && row[1].trim() ? `
                      <div class="time">
                        🕐 ${this.formatTime(row[1])}
                      </div>
                    ` : ''}
                  </div>
                  
                  <div class="event-content">
                    <h3 class="headline">${row[2] || 'Arrangement'}</h3>
                    ${row[3] && row[3].trim() ? `
                      <p class="description">
                        ${row[9] && row[9].trim() ? `<strong>${row[9].trim()}:</strong> ` : ''}${row[3]}
                      </p>
                    ` : ''}
                    ${row[5] && row[5].trim() ? `
                      <div class="league-tag" style="background: ${leagueColor.bg}; box-shadow: 0 2px 4px ${leagueColor.shadow};">
                        🏆 ${row[5].trim()}
                      </div>
                    ` : ''}
                  </div>
                  
                  ${row[4] && row[4].trim() ? `
                    <div class="event-actions">
                      <a href="${row[4]}" target="_blank" rel="noopener noreferrer" class="register-btn">
                        Meld Deg På →
                      </a>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : this.csvData && this.csvData.rows.length > 0 && filteredRows.length === 0 ? `
          <div class="empty">
            <p>🔍 Ingen arrangementer funnet for "${this.selectedLeague}"</p>
            <button class="clear-filter-btn">
              Vis Alle Arrangementer
            </button>
          </div>
        ` : `
          <div class="empty">
            <p>📭 Ingen arrangementer tilgjengelig</p>
          </div>
        `}
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const refreshBtn = this.shadow.querySelector('.refresh-btn');
    const retryBtn = this.shadow.querySelector('.retry-btn');
    const leagueSelect = this.shadow.querySelector('#league-filter') as HTMLSelectElement;
    const clearFilterBtns = this.shadow.querySelectorAll('.clear-filter-btn');
    const cupChallengeBtn = this.shadow.querySelector('.cup-challenge-btn');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.fetchCSVData());
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.fetchCSVData());
    }

    if (leagueSelect) {
      leagueSelect.addEventListener('change', (e) => {
        this.selectedLeague = (e.target as HTMLSelectElement).value;
        this.render();
      });
    }

    clearFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedLeague = 'alle';
        this.render();
      });
    });

    if (cupChallengeBtn) {
      cupChallengeBtn.addEventListener('click', () => {
        this.showOnlyCupChallenge = !this.showOnlyCupChallenge;
        this.render();
      });
    }
  }
}

// Register the custom element
customElements.define('arrangement-oversikt', ArrangementOversikt);