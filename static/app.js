// Global variables
let currentTicker = '';
let currentPeriod = '1mo';
let chartInstance = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadIndices();
    loadTrendingStocks();
    loadGainersLosers();
    
    // Refresh data every 60 seconds
    setInterval(() => {
        loadIndices();
        loadTrendingStocks();
        loadGainersLosers();
    }, 60000);
});

// Load market indices
async function loadIndices() {
    try {
        const response = await fetch('/api/indices');
        const data = await response.json();
        
        const container = document.getElementById('indicesContainer');
        container.innerHTML = '';
        
        data.forEach(index => {
            const card = createIndexCard(index);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading indices:', error);
        document.getElementById('indicesContainer').innerHTML = 
            '<div class="loading">Error loading indices</div>';
    }
}

// Create index card
function createIndexCard(index) {
    const card = document.createElement('div');
    card.className = 'index-card';
    
    const isPositive = index.change >= 0;
    const arrow = isPositive ? '▲' : '▼';
    
    card.innerHTML = `
        <h3>${index.name}</h3>
        <div class="price">$${index.price.toLocaleString()}</div>
        <div class="change ${isPositive ? 'positive' : 'negative'}">
            ${arrow} ${index.change.toFixed(2)} (${index.changePercent.toFixed(2)}%)
        </div>
    `;
    
    return card;
}

// Load trending stocks
async function loadTrendingStocks() {
    try {
        const response = await fetch('/api/trending');
        const data = await response.json();
        
        const container = document.getElementById('trendingContainer');
        container.innerHTML = '';
        
        data.forEach(stock => {
            const card = createStockCard(stock);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading trending stocks:', error);
        document.getElementById('trendingContainer').innerHTML = 
            '<div class="loading">Error loading stocks</div>';
    }
}

// Create stock card
function createStockCard(stock) {
    const card = document.createElement('div');
    card.className = 'stock-card';
    card.onclick = () => showStockDetails(stock.ticker);
    
    const isPositive = stock.change >= 0;
    const arrow = isPositive ? '▲' : '▼';
    
    const marketCap = stock.marketCap 
        ? (stock.marketCap / 1e9).toFixed(2) + 'B' 
        : 'N/A';
    const volume = stock.volume 
        ? (stock.volume / 1e6).toFixed(2) + 'M' 
        : 'N/A';
    
    card.innerHTML = `
        <div class="ticker">${stock.ticker}</div>
        <div class="name">${stock.name}</div>
        <div class="price">$${stock.price.toFixed(2)}</div>
        <div class="change ${isPositive ? 'positive' : 'negative'}">
            ${arrow} ${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
        </div>
        <div class="details">
            <div>
                <strong>Volume:</strong> ${volume}
            </div>
            <div>
                <strong>Market Cap:</strong> $${marketCap}
            </div>
        </div>
    `;
    
    return card;
}

// Load gainers and losers
async function loadGainersLosers() {
    try {
        const response = await fetch('/api/gainers-losers');
        const data = await response.json();
        
        // Display gainers
        const gainersContainer = document.getElementById('gainersContainer');
        gainersContainer.innerHTML = '';
        data.gainers.forEach(stock => {
            gainersContainer.appendChild(createStockListItem(stock, true));
        });
        
        // Display losers
        const losersContainer = document.getElementById('losersContainer');
        losersContainer.innerHTML = '';
        data.losers.forEach(stock => {
            losersContainer.appendChild(createStockListItem(stock, false));
        });
    } catch (error) {
        console.error('Error loading gainers/losers:', error);
    }
}

// Create stock list item
function createStockListItem(stock, isGainer) {
    const item = document.createElement('div');
    item.className = 'stock-item';
    item.onclick = () => showStockDetails(stock.ticker);
    item.style.cursor = 'pointer';
    
    item.innerHTML = `
        <div>
            <div class="ticker">${stock.ticker}</div>
            <div class="name">${stock.name}</div>
        </div>
        <div class="change ${isGainer ? 'positive' : 'negative'}">
            ${isGainer ? '▲' : '▼'} ${stock.changePercent.toFixed(2)}%
        </div>
    `;
    
    return item;
}

// Search for stock
async function searchStock() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    try {
        const response = await fetch(`/api/search/${query}`);
        const data = await response.json();
        
        if (data.found) {
            showStockDetails(query.toUpperCase());
        } else {
            alert(`Stock ticker "${query}" not found. Please try again.`);
        }
    } catch (error) {
        console.error('Error searching stock:', error);
        alert('Error searching for stock. Please try again.');
    }
}

// Show stock details in modal
async function showStockDetails(ticker) {
    currentTicker = ticker;
    const modal = document.getElementById('stockModal');
    const detailsContainer = document.getElementById('stockDetails');
    
    modal.style.display = 'block';
    detailsContainer.innerHTML = '<div class="loading">Loading stock details...</div>';
    
    try {
        const response = await fetch(`/api/stock/${ticker}`);
        const stock = await response.json();
        
        if (stock.error) {
            detailsContainer.innerHTML = `<div class="loading">Error: ${stock.error}</div>`;
            return;
        }
        
        const change = stock.currentPrice - stock.previousClose;
        const changePercent = (change / stock.previousClose) * 100;
        const isPositive = change >= 0;
        
        detailsContainer.innerHTML = `
            <h2>${stock.name} (${stock.ticker})</h2>
            <div class="price" style="font-size: 2.5em; margin: 20px 0;">
                $${stock.currentPrice.toFixed(2)}
                <span style="font-size: 0.6em; color: ${isPositive ? '#10b981' : '#ef4444'};">
                    ${isPositive ? '▲' : '▼'} ${change.toFixed(2)} (${changePercent.toFixed(2)}%)
                </span>
            </div>
            
            <div class="stock-detail-grid">
                <div class="detail-item">
                    <label>Open</label>
                    <div class="value">$${stock.open.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <label>Previous Close</label>
                    <div class="value">$${stock.previousClose.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <label>Day High</label>
                    <div class="value">$${stock.dayHigh.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <label>Day Low</label>
                    <div class="value">$${stock.dayLow.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <label>52 Week High</label>
                    <div class="value">$${stock.fiftyTwoWeekHigh.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <label>52 Week Low</label>
                    <div class="value">$${stock.fiftyTwoWeekLow.toFixed(2)}</div>
                </div>
                <div class="detail-item">
                    <label>Market Cap</label>
                    <div class="value">$${(stock.marketCap / 1e9).toFixed(2)}B</div>
                </div>
                <div class="detail-item">
                    <label>Volume</label>
                    <div class="value">${(stock.volume / 1e6).toFixed(2)}M</div>
                </div>
                <div class="detail-item">
                    <label>P/E Ratio</label>
                    <div class="value">${stock.peRatio ? stock.peRatio.toFixed(2) : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Dividend Yield</label>
                    <div class="value">${stock.dividendYield ? (stock.dividendYield * 100).toFixed(2) + '%' : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Beta</label>
                    <div class="value">${stock.beta ? stock.beta.toFixed(2) : 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <label>Sector</label>
                    <div class="value">${stock.sector}</div>
                </div>
            </div>
            
            <div class="description">
                <h3>About</h3>
                <p>${stock.description}</p>
            </div>
            
            <div class="action-buttons">
                <button onclick="showChart('${ticker}')">📊 View Chart</button>
                <button onclick="exportData('csv')">📥 Export CSV</button>
                <button onclick="exportData('json')">📥 Export JSON</button>
            </div>
        `;
    } catch (error) {
        console.error('Error loading stock details:', error);
        detailsContainer.innerHTML = '<div class="loading">Error loading stock details</div>';
    }
}

// Close modal
function closeModal() {
    document.getElementById('stockModal').style.display = 'none';
}

// Show chart modal
function showChart(ticker) {
    currentTicker = ticker;
    currentPeriod = '1mo';
    
    document.getElementById('chartModal').style.display = 'block';
    document.getElementById('chartTitle').textContent = `${ticker} Stock Chart`;
    
    // Reset active button
    document.querySelectorAll('.period-selector button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.period-selector button')[2].classList.add('active');
    
    updateChart('1mo');
}

// Update chart with new period
async function updateChart(period) {
    currentPeriod = period;
    
    // Update active button
    document.querySelectorAll('.period-selector button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    try {
        const response = await fetch(`/api/stock/${currentTicker}/history?period=${period}`);
        const data = await response.json();
        
        if (data.error) {
            alert(`Error: ${data.error}`);
            return;
        }
        
        // Prepare chart data
        const labels = data.map(item => {
            const date = new Date(item.date);
            if (period === '1d') {
                return date.toLocaleTimeString();
            } else {
                return date.toLocaleDateString();
            }
        });
        
        const prices = data.map(item => item.close);
        
        // Destroy existing chart
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        // Create new chart
        const ctx = document.getElementById('stockChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${currentTicker} Price`,
                    data: prices,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Price: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading chart data:', error);
        alert('Error loading chart data');
    }
}

// Close chart modal
function closeChartModal() {
    document.getElementById('chartModal').style.display = 'none';
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}

// Export data
function exportData(format) {
    if (!currentTicker) {
        alert('Please select a stock first');
        return;
    }
    
    const url = `/api/stock/${currentTicker}/export/${format}?period=${currentPeriod}`;
    window.open(url, '_blank');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const stockModal = document.getElementById('stockModal');
    const chartModal = document.getElementById('chartModal');
    
    if (event.target === stockModal) {
        closeModal();
    }
    if (event.target === chartModal) {
        closeChartModal();
    }
}

// Allow Enter key for search
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchInput').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            searchStock();
        }
    });
});
