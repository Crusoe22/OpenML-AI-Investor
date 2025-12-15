document.addEventListener("DOMContentLoaded", () => {

  let projectionChart = null;
  let tickers = [];

  // Load ticker symbols from JSON once
  fetch("tickers.json")
    .then(res => res.json())
    .then(data => tickers = data)
    .catch(err => console.error("Error loading tickers:", err));

  const tickerInput = document.getElementById("ticker");
  const tickerList = document.getElementById("ticker-list");

  // Attach autocomplete listener
  tickerInput.addEventListener("input", function() {
    const val = this.value.toUpperCase();
    tickerList.innerHTML = "";

    if (!val) return;

    const matches = tickers.filter(t => t.startsWith(val)).slice(0, 10);

    matches.forEach(match => {
      const div = document.createElement("div");
      div.innerText = match;
      div.addEventListener("click", function() {
        tickerInput.value = this.innerText;
        tickerList.innerHTML = "";
      });
      tickerList.appendChild(div);
    });
  });

  // Close dropdown if clicked outside
  document.addEventListener("click", function(e) {
    if (e.target !== tickerInput) tickerList.innerHTML = "";
  });

  // --- Price Projection Function ---
  window.runProjection = async function() {
    const ticker = tickerInput.value.trim();
    const horizon = parseInt(document.getElementById("horizon").value);
    const model = document.getElementById("model").value;

    if (!ticker) {
      alert("Please enter a ticker symbol.");
      return;
    }

    document.getElementById("loading").style.display = "block";
    document.getElementById("results").style.display = "none";
    document.getElementById("projectionChart").style.display = "none";

    try {
      const response = await fetch("http://localhost:8000/api/price-projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, horizon, model })
      });

      const data = await response.json();

      document.getElementById("currentPrice").innerText = data.current_price;
      document.getElementById("projectedPrice").innerText = data.projected_price;
      document.getElementById("lowPrice").innerText = data.low_price;
      document.getElementById("highPrice").innerText = data.high_price;

      document.getElementById("loading").style.display = "none";
      document.getElementById("results").style.display = "block";
      document.getElementById("projectionChart").style.display = "block";

      const ctx = document.getElementById("projectionChart").getContext("2d");
      if (projectionChart) projectionChart.destroy();

      projectionChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: ["Today", `+${horizon} Days`],
          datasets: [
            {
              label: "Price Projection",
              data: [data.current_price, data.projected_price],
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56, 189, 248, 0.2)",
              fill: true,
              tension: 0.3,
              pointRadius: 5,
              pointBackgroundColor: "#38bdf8",
            },
            {
              label: "Low/High Range",
              data: [data.low_price, data.high_price],
              borderColor: "#f87171",
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: "#e5e7eb" } } },
          scales: {
            x: { ticks: { color: "#e5e7eb" } },
            y: { ticks: { color: "#e5e7eb" } },
          },
        },
      });

    } catch (err) {
      console.error(err);
      alert("Error running projection. Check backend.");
      document.getElementById("loading").style.display = "none";
    }
  };

});
