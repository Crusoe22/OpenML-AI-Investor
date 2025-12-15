let historicalChart = null;
let tickers = [];

// Load ticker symbols for autocomplete
fetch("Calculators/tickers.json")
  .then(res => res.json())
  .then(data => tickers = data)
  .catch(err => console.error("Error loading tickers:", err));

const tickerInput = document.getElementById("hist-ticker");
const tickerList = document.getElementById("hist-ticker-list");
const dateRangeSelect = document.getElementById("date-range");
const updateButton = document.getElementById("update-chart-btn");

// --- Autocomplete ---
tickerInput.addEventListener("input", function() {
  const val = this.value.toUpperCase();
  tickerList.innerHTML = "";
  if (!val) return;

  const matches = tickers.filter(t => t.startsWith(val)).slice(0, 10);
  matches.forEach(match => {
    const div = document.createElement("div");
    div.innerText = match;
    div.addEventListener("click", () => {
      tickerInput.value = match;
      tickerList.innerHTML = "";
    });
    tickerList.appendChild(div);
  });
});

document.addEventListener("click", function(e) {
  if (e.target !== tickerInput) tickerList.innerHTML = "";
});

// --- Function to fetch historical stock data ---
async function fetchHistoricalData(ticker, period) {
  // Using Yahoo Finance API via your backend or directly via JS fetch
  // Here, assume your backend endpoint: /api/historical?ticker=AAPL&range=1y
  try {
    const response = await fetch(`http://localhost:8000/api/historical?ticker=${ticker}&period=${period}`);
    const data = await response.json();
    return data; // { dates: [], prices: [] }
  } catch (err) {
    console.error(err);
    alert("Error fetching historical data.");
    return { dates: [], prices: [] };
  }
}

// --- Function to draw chart ---
async function drawHistoricalChart() {
  const ticker = tickerInput.value.trim() || "AAPL";
  const period = dateRangeSelect.value;

  const data = await fetchHistoricalData(ticker, period);

  const ctx = document.getElementById("historicalChart").getContext("2d");

  if (historicalChart) historicalChart.destroy();

  historicalChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.dates,
      datasets: [{
        label: `${ticker} Price`,
        data: data.prices,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#e5e7eb" } }
      },
      scales: {
        x: { ticks: { color: "#e5e7eb" } },
        y: { ticks: { color: "#e5e7eb" } },
      },
    }
  });
}

// --- Update button ---
updateButton.addEventListener("click", drawHistoricalChart);

// --- Initial chart on page load ---
window.addEventListener("load", drawHistoricalChart);
