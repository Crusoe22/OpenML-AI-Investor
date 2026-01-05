let chart = null;

async function calculateGrowth() {
  try {
    const payload = {
      years: Number(document.getElementById("years").value),
      rate: Number(document.getElementById("rate").value),
      principal: Number(document.getElementById("principal").value),
      contribution: Number(document.getElementById("contribution").value),
      frequency: document.getElementById("frequency").value
    };

    const response = await fetch("http://localhost:8000/api/compound-growth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    console.log("Compound Growth API:", data);

    document.getElementById("finalValue").innerText =
      `$${data.final_value.toLocaleString()}`;

    document.getElementById("totalInvested").innerText =
      `$${data.total_invested.toLocaleString()}`;

    document.getElementById("totalGain").innerText =
      `$${data.total_gain.toLocaleString()}`;

    drawChart(data.growth_data);
  } catch (err) {
    console.error("Calculation error:", err);
  }
}

function drawChart(growthData) {
  const canvas = document.getElementById("growthChart");

  if (!canvas) {
    console.error("Canvas element not found");
    return;
  }

  const ctx = canvas.getContext("2d");

  const points = growthData.map(d => ({
    x: Number(d.year),   // ensure numeric
    y: d.value
  }));

//  const labels = growthData.map(d => d.year);
//  const values = growthData.map(d => d.value);

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: "Portfolio Value ($)",
        data: points,
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // MUST be false
      scales: {
        x: { type: "linear", title: { display: true, text: "Years" }, ticks: { stepSize: 1, precision: 0 } },
        y: { title: { display: true, text: "Portfolio Value ($)" }, ticks: { callback: v => `$${v.toLocaleString()}` } }
      }
    }
  });

}
