// DOM Elements
const temperatureElement = document.getElementById("temperature");
const humidityElement = document.getElementById("humidity");
const gasRawElement = document.getElementById("gas-raw");
const gasCompensatedElement = document.getElementById("gas-compensated");
const airQualityStatusElement = document.getElementById("air-quality-status");
const lastUpdatedElement = document.getElementById("last-updated");
const refreshButton = document.getElementById("refresh-button");
const timeElement = document.getElementById("time");
const dateElement = document.getElementById("date");

// Modal Elements
const infoButton = document.getElementById("info-button");
const infoModal = document.getElementById("info-modal");
const closeModal = document.querySelector(".close");

// Progress bars
const tempBar = document.getElementById("temp-bar");
const humidityBar = document.getElementById("humidity-bar");
const gasRawBar = document.getElementById("gas-raw-bar");
const gasCompensatedBar = document.getElementById("gas-compensated-bar");

// Status indicators
const statusIndicators = document.querySelectorAll(".status-indicator");

// Message toast
const messageToast = document.getElementById("message-toast");
const messageText = document.getElementById("message-text");

let previousTemperature = null;
let previousHumidity = null;
let previousRawGas = null;
let previousCompensatedGas = null;
let previousAirQualityStatus = null;

// Show a temporary message
function showMessage(message, isError = false) {
  messageText.textContent = message;
  messageToast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 max-w-xs text-center transition-all duration-300 flex items-center ${
    isError
      ? "bg-red-900 text-white border border-red-400"
      : "bg-gray-900 text-white border border-cyan-400"
  }`;
  messageToast.classList.remove("hidden");
  setTimeout(() => messageToast.classList.add("hidden"), 3000);
}

// Update last updated time
function updateLastUpdated() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  lastUpdatedElement.textContent = `Last Updated: ${hours}:${minutes}:${seconds}`;
}

// Update temperature color and progress bar
function updateTemperatureColor(temperature) {
  temperatureElement.classList.remove(
    "temp-cold",
    "temp-cool",
    "temp-warm",
    "temp-hot"
  );
  const tempPercentage = Math.min(Math.max((temperature / 40) * 100, 0), 100);
  tempBar.style.width = `${tempPercentage}%`;
  if (temperature < 20) temperatureElement.classList.add("temp-cold");
  else if (temperature < 27) temperatureElement.classList.add("temp-cool");
  else if (temperature < 30) temperatureElement.classList.add("temp-warm");
  else temperatureElement.classList.add("temp-hot");
}

// Update humidity color and progress bar
function updateHumidityColor(humidity) {
  humidityElement.classList.remove(
    "humidity-low",
    "humidity-moderate",
    "humidity-optimal",
    "humidity-high",
    "humidity-very-high"
  );
  humidityBar.style.width = `${humidity}%`;
  if (humidity < 30) humidityElement.classList.add("humidity-low");
  else if (humidity < 40) humidityElement.classList.add("humidity-moderate");
  else if (humidity < 60) humidityElement.classList.add("humidity-optimal");
  else if (humidity < 70) humidityElement.classList.add("humidity-high");
  else humidityElement.classList.add("humidity-very-high");
}

// Update Gas (RAW) progress bar
function updateGasRawColor(rawValue) {
  const rawPercentage = Math.min(Math.max((rawValue / 1023) * 100, 0), 100);
  gasRawBar.style.width = `${rawPercentage}%`;
}

// Update Gas (Compensated) progress bar
function updateGasCompensatedColor(compensatedValue) {
  const compensatedPercentage = Math.min(
    Math.max((compensatedValue / 1000) * 100, 0),
    100
  );
  gasCompensatedBar.style.width = `${compensatedPercentage}%`;
}

// Update Air Quality color and status indicator
function updateAirQualityColor(status) {
  statusIndicators.forEach((indicator) => {
    indicator.classList.remove(
      "status-excellent",
      "status-good",
      "status-fair",
      "status-poor",
      "status-critical"
    );
    airQualityStatusElement.classList.remove(
      "text-cyan-300",
      "text-green-400",
      "text-yellow-400",
      "text-orange-400",
      "text-red-400"
    );
    switch (status) {
      case "Very Good":
        indicator.classList.add("status-excellent");
        airQualityStatusElement.classList.add("text-green-400");
        break;
      case "Good":
        indicator.classList.add("status-good");
        airQualityStatusElement.classList.add("text-cyan-300");
        break;
      case "Fair":
        indicator.classList.add("status-fair");
        airQualityStatusElement.classList.add("text-yellow-400");
        break;
      case "Poor":
        indicator.classList.add("status-poor");
        airQualityStatusElement.classList.add("text-orange-400");
        break;
      case "Very Poor":
        indicator.classList.add("status-critical");
        airQualityStatusElement.classList.add("text-red-400");
        break;
    }
  });
}

// Fetch data from backend
async function fetchData() {
  try {
    const response = await fetch("/api/blynk");
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch data from backend");
    }
    const { temperature, humidity, rawGas, compensatedGas, airQualityStatus } =
      await response.json();

    if (
      temperature === previousTemperature &&
      humidity === previousHumidity &&
      rawGas === previousRawGas &&
      compensatedGas === previousCompensatedGas &&
      airQualityStatus === previousAirQualityStatus
    ) {
      showMessage("No new data available");
      return;
    }

    temperatureElement.textContent = `${temperature.toFixed(1)} °C`;
    humidityElement.textContent = `${humidity.toFixed(1)} %`;
    gasRawElement.textContent = rawGas.toFixed(0);
    gasCompensatedElement.textContent = `${compensatedGas.toFixed(1)} ppm`;
    airQualityStatusElement.textContent = airQualityStatus;

    updateLastUpdated();
    updateTemperatureColor(temperature);
    updateHumidityColor(humidity);
    updateGasRawColor(rawGas);
    updateGasCompensatedColor(compensatedGas);
    updateAirQualityColor(airQualityStatus);

    previousTemperature = temperature;
    previousHumidity = humidity;
    previousRawGas = rawGas;
    previousCompensatedGas = compensatedGas;
    previousAirQualityStatus = airQualityStatus;

    showMessage("Data Updated Successfully!");
  } catch (error) {
    console.error("Error fetching data:", error.message);
    temperatureElement.textContent = "-- °C";
    humidityElement.textContent = "-- %";
    gasRawElement.textContent = "--";
    gasCompensatedElement.textContent = "-- ppm";
    airQualityStatusElement.textContent = "--";
    showMessage(
      error.message || "Connection to server failed. Trying again...",
      true
    );
  }
}

// Initial fetch
fetchData();

// Auto-refresh every 30 seconds
setInterval(fetchData, 30000);

// Event Listener for Refresh Button
refreshButton.addEventListener("click", fetchData);

// Update real-time clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const time = `${hours}:${minutes}:${seconds}`;
  const day = now.getDate();
  const month = now.toLocaleString("default", { month: "short" });
  const year = now.getFullYear();
  const date = `${day} ${month} ${year}`;

  timeElement.textContent = time;
  dateElement.textContent = date;
}

// Update clock every second
setInterval(updateClock, 1000);
updateClock();

// Modal Logic
infoButton.addEventListener("click", () =>
  infoModal.classList.remove("hidden")
);
closeModal.addEventListener("click", () => infoModal.classList.add("hidden"));
window.addEventListener("click", (event) => {
  if (event.target === infoModal) infoModal.classList.add("hidden");
});
