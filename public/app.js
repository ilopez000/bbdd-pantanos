let mainChart = null;
const statsGrid = document.getElementById('stats-summary');
const selector = document.getElementById('embalse-selector');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentReservoirId = null;
let currentLimit = 30;

// Initialize
async function init() {
    await loadReservoirs();
    setupEventListeners();
    
    // Load first reservoir by default
    if (selector.options.length > 1) {
        selector.selectedIndex = 1;
        updateDashboard(selector.value);
    }
}

async function loadReservoirs() {
    try {
        const res = await fetch('/api/embalses');
        const reservoirs = await res.json();
        
        selector.innerHTML = '<option value="">Selecciona un embassament</option>';
        statsGrid.innerHTML = '';

        reservoirs.forEach(r => {
            // Populate selector
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = r.nombre;
            selector.appendChild(opt);

            // Create placeholder cards
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.id = `card-${r.id}`;
            card.innerHTML = `
                <h3>${r.nombre}</h3>
                <div class="stat-value">--%</div>
                <div class="stat-meta">Carregant...</div>
            `;
            statsGrid.appendChild(card);
            
            // Load latest data for each card
            loadLatestData(r.id, r.nombre);
        });
    } catch (err) {
        console.error('Error loading reservoirs:', err);
    }
}

async function loadLatestData(id, name) {
    try {
        const res = await fetch(`/api/datos?id=${id}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
            const latest = data[0];
            const card = document.getElementById(`card-${id}`);
            card.innerHTML = `
                <h3>${name}</h3>
                <div class="stat-value">${latest.pct_volumen}%</div>
                <div class="stat-meta">${latest.volumen_hm3} hm³ | ${latest.fecha}</div>
            `;
            
            // Color coding
            const valueEl = card.querySelector('.stat-value');
            if (latest.pct_volumen < 20) valueEl.style.color = '#ff4d4d';
            else if (latest.pct_volumen < 50) valueEl.style.color = '#ffaa00';
            else valueEl.style.color = '#00d4ff';
        }
    } catch (err) {
        console.error(`Error loading data for ${id}:`, err);
    }
}

async function updateDashboard(id) {
    if (!id) return;
    currentReservoirId = id;
    
    try {
        const res = await fetch(`/api/datos?id=${id}&limit=${currentLimit}`);
        const data = await res.json();
        renderChart(data);
    } catch (err) {
        console.error('Error updating chart:', err);
    }
}

function renderChart(data) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    const labels = data.map(d => d.fecha);
    const pctData = data.map(d => d.pct_volumen);
    const volData = data.map(d => d.volumen_hm3);

    if (mainChart) {
        mainChart.destroy();
    }

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '% Volumen',
                    data: pctData,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Volumen (hm³)',
                    data: volData,
                    borderColor: '#718096',
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#a0aec0', font: { family: 'Inter' } }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#718096', maxRotation: 0 },
                    grid: { display: false }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Percentatge (%)', color: '#a0aec0' },
                    ticks: { color: '#718096' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    min: 0,
                    max: 100
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Volum (hm³)', color: '#a0aec0' },
                    ticks: { color: '#718096' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function setupEventListeners() {
    selector.addEventListener('change', (e) => {
        updateDashboard(e.target.value);
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLimit = btn.dataset.limit;
            updateDashboard(currentReservoirId);
        });
    });
}

init();
