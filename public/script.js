const elements = {
  temperature: document.getElementById("temperature"),
  humidity: document.getElementById("humidity"),
  pressure: document.getElementById("pressure"),
  altitude: document.getElementById("altitude"),
  gasRaw: document.getElementById("gas-raw"),
  gasCompensated: document.getElementById("gas-compensated"),
  airQualityStatus: document.getElementById("air-quality-status"),
  lastUpdated: document.getElementById("last-updated"),
  refreshButton: document.getElementById("refresh-button"),
  time: document.getElementById("time"),
  date: document.getElementById("date"),
  toast: document.getElementById("message-toast"),
  toastText: document.getElementById("message-text"),
  bars: {
    temp: document.getElementById("temp-bar"),
    humidity: document.getElementById("humidity-bar"),
    pressure: document.getElementById("pressure-bar"),
    altitude: document.getElementById("altitude-bar"),
    gasRaw: document.getElementById("gas-raw-bar"),
    gasCompensated: document.getElementById("gas-compensated-bar")
  },
  statusIndicators: document.querySelectorAll(".status-indicator")
};

// Utility functions
function formatNumber(value, decimals = 2) {
  return value === null || isNaN(value) ? '--' : value.toFixed(decimals);
}

function showToast(message, isError = false) {
  elements.toastText.textContent = message;
  elements.toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 max-w-xs text-center transition-all duration-300 ${
    isError ? "bg-red-900 text-white border border-red-400" 
            : "bg-gray-900 text-white border border-cyan-400"
  }`;
  elements.toast.classList.remove("hidden");
  setTimeout(() => elements.toast.classList.add("hidden"), 3000);
}

function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function updateClock() {
  const now = new Date();
  elements.time.textContent = formatTime(now);
  elements.date.textContent = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function updateStyles(data) {
  // Temperature
  const tempPercent = Math.min(Math.max((data.temperature / 40) * 100, 0), 100);
  elements.bars.temp.style.width = `${tempPercent}%`;
  elements.temperature.className = "data-value text-4xl font-bold " + (
    data.temperature < 20 ? "temp-cold" :
    data.temperature < 27 ? "temp-cool" :
    data.temperature < 30 ? "temp-warm" : "temp-hot"
  );

  // Humidity
  const humidityPercent = Math.min(Math.max(data.humidity, 0), 100);
  elements.bars.humidity.style.width = `${humidityPercent}%`;
  elements.humidity.className = "data-value text-4xl font-bold " + (
    data.humidity < 30 ? "humidity-low" :
    data.humidity < 40 ? "humidity-moderate" :
    data.humidity < 60 ? "humidity-optimal" :
    data.humidity < 70 ? "humidity-high" : "humidity-very-high"
  );

  // Pressure
  const pressurePercent = Math.min(Math.max((data.pressure - 950) / 100 * 100, 0), 100);
  elements.bars.pressure.style.width = `${pressurePercent}%`;
  elements.pressure.className = "data-value text-4xl font-bold " + (
    data.pressure < 980 ? "pressure-low" :
    data.pressure > 1020 ? "pressure-high" : "pressure-normal"
  );

  // Altitude
  const altitudePercent = Math.min(Math.max(data.altitude / 2000 * 100, 0), 100);
  elements.bars.altitude.style.width = `${altitudePercent}%`;
  elements.altitude.className = "data-value text-4xl font-bold " + (
    data.altitude < 100 ? "altitude-low" :
    data.altitude > 500 ? "altitude-high" : "altitude-medium"
  );

  // Gas Raw
  const rawPercent = Math.min(Math.max((data.rawGas / 1023) * 100, 0), 100);
  elements.bars.gasRaw.style.width = `${rawPercent}%`;

  // Gas Compensated
  const compPercent = Math.min(Math.max((data.compensatedGas / 1000) * 100, 0), 100);
  elements.bars.gasCompensated.style.width = `${compPercent}%`;

  // Air Quality
  const statusClasses = {
    "Very Good": ["status-excellent", "text-green-400"],
    Good: ["status-good", "text-cyan-300"],
    Fair: ["status-fair", "text-yellow-400"],
    Poor: ["status-poor", "text-orange-400"],
    "Very Poor": ["status-critical", "text-red-400"]
  };
  
  elements.statusIndicators.forEach(indicator => {
    indicator.className = "status-indicator " + 
      (statusClasses[data.airQualityStatus]?.[0] || "status-good");
  });
  
  elements.airQualityStatus.className = "text-2xl font-bold " + 
    (statusClasses[data.airQualityStatus]?.[1] || "text-cyan-300");
}

async function fetchData() {
  try {
    const startTime = performance.now();
    const response = await fetch("/api/blynk");
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update UI with formatted values
    elements.temperature.textContent = `${formatNumber(data.temperature, 1)} °C`;
    elements.humidity.textContent = `${formatNumber(data.humidity, 1)} %`;
    elements.pressure.textContent = `${formatNumber(data.pressure)} hPa`;
    elements.altitude.textContent = `${formatNumber(data.altitude)} m`;
    elements.gasRaw.textContent = formatNumber(data.rawGas, 0);
    elements.gasCompensated.textContent = `${formatNumber(data.compensatedGas, 1)} ppm`;
    elements.airQualityStatus.textContent = data.airQualityStatus || "--";

    updateStyles(data);
    elements.lastUpdated.textContent = `Last Updated: ${formatTime(new Date())}`;
    
    const loadTime = (performance.now() - startTime).toFixed(1);
    showToast(`Data loaded in ${loadTime}ms`);
    
  } catch (error) {
    console.error("Fetch error:", error);
    showToast("Failed to update data. Retrying...", true);
    resetUI();
  }
}

function resetUI() {
  elements.temperature.textContent = "-- °C";
  elements.humidity.textContent = "-- %";
  elements.pressure.textContent = "-- hPa";
  elements.altitude.textContent = "-- m";
  elements.gasRaw.textContent = "--";
  elements.gasCompensated.textContent = "-- ppm";
  elements.airQualityStatus.textContent = "--";
  
  Object.values(elements.bars).forEach(bar => {
    bar.style.width = "50%";
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // First load
  fetchData();
  
  // Update clock every second
  setInterval(updateClock, 1000);
  updateClock();
  
  // Refresh data every 30 seconds
  setInterval(fetchData, 30000);
  
  // Manual refresh button
  elements.refreshButton.addEventListener("click", () => {
    elements.refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-2"></i> Refreshing...';
    fetchData().finally(() => {
      setTimeout(() => {
        elements.refreshButton.innerHTML = '<i class="fas fa-sync mr-2"></i> Refresh Data';
      }, 1000);
    });
  });
});