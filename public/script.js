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
  toast: document.getElementById("message-toast"),
  toastText: document.getElementById("message-text"),
  bars: {
    temp: document.getElementById("temp-bar"),
    humidity: document.getElementById("humidity-bar"),
    gasRaw: document.getElementById("gas-raw-bar"),
    gasCompensated: document.getElementById("gas-compensated-bar"),
    outdoorTemp: document.getElementById("outdoor-temp-bar"),
    outdoorHumidity: document.getElementById("outdoor-humidity-bar")
  },
  statusIndicators: document.querySelectorAll(".status-indicator"),
  indoorTab: document.getElementById("indoor-tab"),
  outdoorTab: document.getElementById("outdoor-tab"),
  indoorContent: document.getElementById("indoor-content"),
  outdoorContent: document.getElementById("outdoor-content"),
  outdoorTemp: document.getElementById("outdoor-temp"),
  outdoorHumidity: document.getElementById("outdoor-humidity"),
  weatherIcon: document.getElementById("weather-icon"),
  weatherCondition: document.getElementById("weather-condition"),
  windSpeed: document.getElementById("wind-speed"),
  cloudCover: document.getElementById("cloud-cover"),
  precipitation: document.getElementById("precipitation"),
  weatherUpdated: document.getElementById("weather-updated"),
  weatherForecast: document.getElementById("weather-forecast")
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
}

function updateStyles({
  temperature,
  humidity,
  rawGas,
  compensatedGas,
  airQualityStatus,
}) {
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

  const rawPercent = Math.min(Math.max((rawGas / 1023) * 100, 0), 100);
  elements.bars.gasRaw.style.width = `${rawPercent}%`;

  const compPercent = Math.min(Math.max((compensatedGas / 1000) * 100, 0), 100);
  elements.bars.gasCompensated.style.width = `${compPercent}%`;

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

function updateOutdoorStyles({ temperature, humidity }) {
  const outdoorTempPercent = Math.min(Math.max(((temperature - 10) / 30) * 100, 0), 100);
  elements.bars.outdoorTemp.style.width = `${outdoorTempPercent}%`;
  elements.outdoorTemp.classList.remove(
    "temp-cold",
    "temp-cool",
    "temp-warm",
    "temp-hot"
  );
  elements.outdoorTemp.classList.add(
    temperature < 20
      ? "temp-cold"
      : temperature < 27
      ? "temp-cool"
      : temperature < 30
      ? "temp-warm"
      : "temp-hot"
  );

  elements.bars.outdoorHumidity.style.width = `${humidity}%`;
  elements.outdoorHumidity.classList.remove(
    "humidity-low",
    "humidity-moderate",
    "humidity-optimal",
    "humidity-high",
    "humidity-very-high"
  );
  elements.outdoorHumidity.classList.add(
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
}

function switchTab(tab) {
  if (tab === 'indoor') {
    elements.indoorTab.classList.add("active", "text-cyan-300", "border-cyan-400");
    elements.indoorTab.classList.remove("text-gray-400");
    elements.outdoorTab.classList.remove("active", "text-cyan-300", "border-cyan-400");
    elements.outdoorTab.classList.add("text-gray-400");
    elements.indoorContent.classList.remove("hidden");
    elements.outdoorContent.classList.add("hidden");
  } else {
    elements.outdoorTab.classList.add("active", "text-cyan-300", "border-cyan-400");
    elements.outdoorTab.classList.remove("text-gray-400");
    elements.indoorTab.classList.remove("active", "text-cyan-300", "border-cyan-400");
    elements.indoorTab.classList.add("text-gray-400");
    elements.outdoorContent.classList.remove("hidden");
    elements.indoorContent.classList.add("hidden");
    fetchWeatherData();
  }
}

async function fetchWeatherData() {
  try {
    const response = await fetch("/api/weather");
    if (!response.ok) throw new Error("Failed to fetch weather data");
    const data = await response.json();

    elements.outdoorTemp.textContent = `${data.current.temperature} °C`;
    elements.outdoorHumidity.textContent = `${data.current.humidity} %`;
    elements.weatherCondition.textContent = data.current.condition;
    elements.windSpeed.textContent = `${data.current.windSpeed} km/h`;
    elements.cloudCover.textContent = `${data.current.cloudCover} %`;
    elements.precipitation.textContent = `${data.current.precipitation} mm`;
    elements.weatherUpdated.textContent = data.current.lastUpdate;
    elements.weatherIcon.src = data.current.icon;

    elements.weatherForecast.innerHTML = data.forecast.map(item => `
      <div class="glass-card rounded-lg p-3 text-center">
        <div class="text-sm font-medium mb-1">${item.date || item.time}</div>
        <img src="${item.icon}" alt="Forecast Icon" class="h-6 w-6 mx-auto mb-1" />
        <div class="text-base font-bold">${item.temperature}°C</div>
        <div class="text-xs">${item.condition}</div>
      </div>
    `).join("");

    updateOutdoorStyles({
      temperature: data.current.temperature,
      humidity: data.current.humidity
    });

    showToast("Weather data updated");
  } catch (error) {
    showToast("Failed to fetch weather data", true);
    console.error(error);
  }
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
    elements.gasCompensated.textContent = `${data.compensatedGas.toFixed(1)} ppm`;
    elements.airQualityStatus.textContent = data.airQualityStatus;

    updateStyles(data);
    const now = new Date();
    elements.lastUpdated.textContent = `Last Updated: ${formatTime(now)}`;
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

document.addEventListener("DOMContentLoaded", () => {
  fetchData();
  setInterval(fetchData, 30000);
  setInterval(updateClock, 1000);
  updateClock();

  elements.indoorTab.addEventListener("click", () => switchTab('indoor'));
  elements.outdoorTab.addEventListener("click", () => switchTab('outdoor'));

  elements.refreshButton.addEventListener("click", () => {
    const activeTab = elements.indoorContent.classList.contains("hidden") ? 'outdoor' : 'indoor';
    if (activeTab === 'indoor') {
      fetchData();
    } else {
      fetchWeatherData();
    }
  });
});