// Wait for the DOM to be fully loaded before executing the script
document.addEventListener("DOMContentLoaded", () => {

  let projectionChart = null; // Holds the Chart.js instance to allow destruction on updates
  let tickers = []; // Will store the list of ticker symbols loaded from JSON

  // Load ticker symbols from a local JSON file (e.g., ["AAPL", "GOOGL", ...])
  fetch("tickers.json")
    .then(res => res.json())
    .then(data => tickers = data) // Assign loaded array to the global tickers variable
    .catch(err => console.error("Error loading tickers:", err)); // Log any fetch errors


  // DOM element references
  const tickerInput = document.getElementById("ticker"); // Input field for ticker symbol
  const tickerList = document.getElementById("ticker-list"); // Container for autocomplete suggestions

  // Attach autocomplete listener
  tickerInput.addEventListener("input", function() {
    const val = this.value.toUpperCase(); // Get and normalize input
    tickerList.innerHTML = "";  // Clear previous suggestions

    if (!val) return; // If input is empty, do nothing
    
    // Find tickers that start with the typed value, limit to 10 results
    const matches = tickers.filter(t => t.startsWith(val)).slice(0, 10);

    // Create a clickable suggestion for each match
    matches.forEach(match => {
      const div = document.createElement("div");
      div.innerText = match;

      // When clicked, fill the input with the selected ticker and close dropdown
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
    
    // Basic validation
    if (!ticker) {
      alert("Please enter a ticker symbol.");
      return;
    }
    
    // Show loading indicator and hide results/chart
    document.getElementById("loading").style.display = "block";
    document.getElementById("results").style.display = "none";
    document.getElementById("projectionChart").style.display = "none";

    try {
      // Send request to backend API
      const response = await fetch("http://localhost:8000/api/price-projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, horizon, model })
      });

      // Parse JSON response from server
      const data = await response.json();

      // Update result fields in the UI
      document.getElementById("currentPrice").innerText = data.current_price;
      document.getElementById("projectedPrice").innerText = data.projected_price;
      document.getElementById("lowPrice").innerText = data.low_price;
      document.getElementById("highPrice").innerText = data.high_price;
      document.getElementById("r2Score").innerText = data.r2_score !== null ? data.r2_score : "N/A";
      document.getElementById("mae").innerText = data.mean_absolute_error !== null ? data.mean_absolute_error : "N/A";
      document.getElementById("mse").innerText = data.mean_squared_error !== null ? data.mean_squared_error : "N/A";
      
      // Hide loading, show results and chart
      document.getElementById("loading").style.display = "none";
      document.getElementById("results").style.display = "block";
      document.getElementById("projectionChart").style.display = "block";

      // Get canvas context for Chart.js
      const ctx = document.getElementById("projectionChart").getContext("2d");

      // Destroy previous chart instance to prevent memory leaks/overlapping
      if (projectionChart) projectionChart.destroy();

      // Create new line chart showing current price → projected price with confidence range
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
              data: [data.low_price, data.high_price], // Shows confidence bounds at endpoints
              borderColor: "#f87171",
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true, // Chart resizes with container
          plugins: { legend: { labels: { color: "#e5e7eb" } } }, // Light text for dark theme compatibility
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
