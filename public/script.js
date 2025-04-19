const elements = {
  temperature: document.getElementById("temperature"),
  humidity: document.getElementById("humidity"),
  gasRaw: document.getElementById("gas-raw"),
  gasCompensated: document.getElementById("gas-compensated"),
  airQualityStatus: document.getElementById("air-quality-status"),
  lastUpdated: document.getElementById("last-updated"),
  refreshButton: document.getElementById("refresh-button"),
  time: document.getElementById("time"),
  date: document.getElementById("date"),
  infoButton: document.getElementById("info-button"),
  infoModal: document.getElementById("info-modal"),
  closeModal: document.getElementById("close-modal"),
  toast: document.getElementById("message-toast"),
  toastText: document.getElementById("message-text"),
  bars: {
    temp: document.getElementById("temp-bar"),
    humidity: document.getElementById("humidity-bar"),
    gasRaw: document.getElementById("gas-raw-bar"),
    gasCompensated: document.getElementById("gas-compensated-bar"),
  },
  statusIndicators: document.querySelectorAll(".status-indicator"),
};

function showToast(message, isError = false) {
  elements.toastText.textContent = message;
  elements.toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 max-w-xs text-center transition-all duration-300 ${
    isError
      ? "bg-red-900 text-white border border-red-400"
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
    second: "2-digit",
  });
}

function updateClock() {
  const now = new Date();
  elements.time.textContent = formatTime(now);
  elements.date.textContent = now.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  elements.lastUpdated.textContent = `Last Updated: ${formatTime(now)}`;
}

function updateStyles({
  temperature,
  humidity,
  rawGas,
  compensatedGas,
  airQualityStatus,
}) {
  // Temperature
  elements.temperature.classList.remove(
    "temp-cold",
    "temp-cool",
    "temp-warm",
    "temp-hot"
  );
  const tempPercent = Math.min(Math.max((temperature / 40) * 100, 0), 100);
  elements.bars.temp.style.width = `${tempPercent}%`;
  elements.temperature.classList.add(
    temperature < 20
      ? "temp-cold"
      : temperature < 27
      ? "temp-cool"
      : temperature < 30
      ? "temp-warm"
      : "temp-hot"
  );

  // Humidity
  elements.humidity.classList.remove(
    "humidity-low",
    "humidity-moderate",
    "humidity-optimal",
    "humidity-high",
    "humidity-very-high"
  );
  elements.bars.humidity.style.width = `${humidity}%`;
  elements.humidity.classList.add(
    humidity < 30
      ? "humidity-low"
      : humidity < 40
      ? "humidity-moderate"
      : humidity < 60
      ? "humidity-optimal"
      : humidity < 70
      ? "humidity-high"
      : "humidity-very-high"
  );

  // Gas Raw
  const rawPercent = Math.min(Math.max((rawGas / 1023) * 100, 0), 100);
  elements.bars.gasRaw.style.width = `${rawPercent}%`;

  // Gas Compensated
  const compPercent = Math.min(Math.max((compensatedGas / 1000) * 100, 0), 100);
  elements.bars.gasCompensated.style.width = `${compPercent}%`;

  // Air Quality
  const statusClasses = {
    "Very Good": ["status-excellent", "text-green-400"],
    Good: ["status-good", "text-cyan-300"],
    Fair: ["status-fair", "text-yellow-400"],
    Poor: ["status-poor", "text-orange-400"],
    "Very Poor": ["status-critical", "text-red-400"],
  };
  elements.statusIndicators.forEach((indicator) => {
    indicator.classList.remove(
      "status-excellent",
      "status-good",
      "status-fair",
      "status-poor",
      "status-critical"
    );
    indicator.classList.add(
      statusClasses[airQualityStatus]?.[0] || "status-good"
    );
  });
  elements.airQualityStatus.classList.remove(
    "text-cyan-300",
    "text-green-400",
    "text-yellow-400",
    "text-orange-400",
    "text-red-400"
  );
  elements.airQualityStatus.classList.add(
    statusClasses[airQualityStatus]?.[1] || "text-cyan-300"
  );
}

async function fetchData() {
  try {
    const response = await fetch("/api/blynk");
    if (!response.ok)
      throw new Error((await response.json()).error || "Failed to fetch data");
    const data = await response.json();

    elements.temperature.textContent = `${data.temperature.toFixed(1)} °C`;
    elements.humidity.textContent = `${data.humidity.toFixed(1)} %`;
    elements.gasRaw.textContent = data.rawGas.toFixed(0);
    elements.gasCompensated.textContent = `${data.compensatedGas.toFixed(
      1
    )} ppm`;
    elements.airQualityStatus.textContent = data.airQualityStatus;

    updateStyles(data);
    updateClock();
    showToast("Data Updated Successfully!");
  } catch (error) {
    elements.temperature.textContent = "-- °C";
    elements.humidity.textContent = "-- %";
    elements.gasRaw.textContent = "--";
    elements.gasCompensated.textContent = "-- ppm";
    elements.airQualityStatus.textContent = "--";
    showToast(error.message || "Failed to fetch data. Retrying...", true);
  }
}

// Initial fetch and setup
fetchData();
setInterval(fetchData, 30000);
setInterval(updateClock, 1000);
updateClock();

// Event Listeners
elements.refreshButton.addEventListener("click", fetchData);
elements.infoButton.addEventListener("click", () =>
  elements.infoModal.classList.remove("hidden")
);
elements.closeModal.addEventListener("click", () =>
  elements.infoModal.classList.add("hidden")
);
elements.infoModal.addEventListener("click", (e) => {
  if (e.target === elements.infoModal)
    elements.infoModal.classList.add("hidden");
});
