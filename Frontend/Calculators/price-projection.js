async function runProjection() {
  const ticker = document.getElementById("ticker").value.trim();
  const horizon = document.getElementById("horizon").value;
  const model = document.getElementById("model").value;

  if (!ticker) {
    alert("Please enter a ticker symbol.");
    return;
  }

  document.getElementById("loading").style.display = "block";
  document.getElementById("results").style.display = "none";

  try {
    const response = await fetch("http://localhost:8000/api/price-projection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ticker,
        horizon,
        model
      })
    });

    const data = await response.json();

    document.getElementById("currentPrice").innerText = data.current_price;
    document.getElementById("projectedPrice").innerText = data.projected_price;
    document.getElementById("lowPrice").innerText = data.low_price;
    document.getElementById("highPrice").innerText = data.high_price;

    document.getElementById("loading").style.display = "none";
    document.getElementById("results").style.display = "block";

  } catch (err) {
    console.error(err);
    alert("Error running projection. Check backend.");
    document.getElementById("loading").style.display = "none";
  }
}
