const elements = {
  // Tabs
  indoorTabButton: document.getElementById("indoor-tab-button"),
  outdoorTabButton: document.getElementById("outdoor-tab-button"),
  indoorContent: document.getElementById("indoor-content"),
  outdoorContent: document.getElementById("outdoor-content"),

  // Indoor elements
  temperature: document.getElementById("temperature"),
  humidity: document.getElementById("humidity"),
  pressure: document.getElementById("pressure"),
  altitude: document.getElementById("altitude"),
  gasRaw: document.getElementById("gas-raw"),
  gasCompensated: document.getElementById("gas-compensated"),
  airQualityStatus: document.getElementById("air-quality-status"),
  bars: {
    temp: document.getElementById("temp-bar"),
    humidity: document.getElementById("humidity-bar"),
    pressure: document.getElementById("pressure-bar"),
    altitude: document.getElementById("altitude-bar"),
    gasRaw: document.getElementById("gas-raw-bar"),
    gasCompensated: document.getElementById("gas-compensated-bar")
  },
  statusIndicators: document.querySelectorAll(".status-indicator"),
  
  // Outdoor elements
  locationName: document.getElementById("location-name"),
  locationDetails: document.getElementById("location-details"),
  weatherIcon: document.getElementById("weather-icon"),
  weatherDescription: document.getElementById("weather-description"),
  outdoorTemperature: document.getElementById("outdoor-temperature"),
  outdoorHumidity: document.getElementById("outdoor-humidity"),
  windSpeed: document.getElementById("wind-speed"),
  windDirection: document.getElementById("wind-direction"),
  visibility: document.getElementById("visibility"),
  forecastContainer: document.getElementById("forecast-container"),
  
  // Common elements
  lastUpdated: document.getElementById("last-updated"),
  refreshButton: document.getElementById("refresh-button"),
  time: document.getElementById("time"),
  date: document.getElementById("date"),
  toast: document.getElementById("message-toast"),
  toastText: document.getElementById("message-text"),
};

let activeTab = 'indoor';
let indoorDataInterval;
let isOutdoorDataLoaded = false;

// Utility functions
function formatNumber(value, decimals = 2) {
  return value === null || isNaN(value) ? '--' : parseFloat(value).toFixed(decimals);
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

function updateIndoorStyles(data) {
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

  // Pressure (Fixed calculation with new range)
  const pressureRange = 1100 - 500;
  const pressurePercent = Math.min(Math.max(((data.pressure - 500) / pressureRange) * 100, 0), 100);
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
  
  const allStatusIndicators = document.querySelectorAll("#indoor-content .status-indicator");
  allStatusIndicators.forEach(indicator => {
    indicator.className = "status-indicator ml-3 " + (statusClasses[data.airQualityStatus]?.[0] || "status-good");
  });
  
  elements.airQualityStatus.className = "text-2xl font-bold mt-2 " + (statusClasses[data.airQualityStatus]?.[1] || "text-cyan-300");
}

async function fetchIndoorData() {
  try {
    const startTime = performance.now();
    const response = await fetch("/api/blynk");
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    elements.temperature.textContent = `${formatNumber(data.temperature, 1)} °C`;
    elements.humidity.textContent = `${formatNumber(data.humidity, 1)} %`;
    elements.pressure.textContent = `${formatNumber(data.pressure, 1)} hPa`;
    elements.altitude.textContent = `${formatNumber(data.altitude)} m`;
    elements.gasRaw.textContent = formatNumber(data.rawGas, 0);
    elements.gasCompensated.textContent = `${formatNumber(data.compensatedGas, 1)} ppm`;
    elements.airQualityStatus.textContent = data.airQualityStatus || "--";

    updateIndoorStyles(data);
    elements.lastUpdated.textContent = `Last Updated: ${formatTime(new Date())}`;
    
    const loadTime = (performance.now() - startTime).toFixed(1);
    showToast(`Indoor data loaded in ${loadTime}ms`);
    
  } catch (error) {
    console.error("Fetch indoor error:", error);
    showToast("Failed to update indoor data. Retrying...", true);
    resetIndoorUI();
  }
}

async function fetchOutdoorData(forceRefresh = false) {
    if (isOutdoorDataLoaded && !forceRefresh) {
        showToast("Outdoor data already loaded.");
        return;
    }

    try {
        const startTime = performance.now();
        const response = await fetch('/api/bmkg');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const bmkgData = await response.json();

        // Update current weather
        const location = bmkgData.lokasi;
        const weatherNow = bmkgData.data[0].cuaca[0][0];

        elements.locationName.textContent = `${location.kotkab}, ${location.provinsi}`;
        elements.locationDetails.textContent = `${location.kecamatan}, ${location.desa}`;

        elements.weatherDescription.textContent = weatherNow.weather_desc;
        elements.weatherIcon.src = weatherNow.image;
        elements.weatherIcon.style.display = 'block';

        elements.outdoorTemperature.textContent = `${formatNumber(weatherNow.t, 1)} °C`;
        elements.outdoorHumidity.textContent = `${formatNumber(weatherNow.hu, 1)} %`;
        
        const windSpeedKmh = formatNumber(weatherNow.ws * 3.6, 1); // Convert m/s to km/h
        elements.windSpeed.textContent = windSpeedKmh;
        elements.windDirection.textContent = `From ${weatherNow.wd}`;
        
        elements.visibility.textContent = formatNumber(weatherNow.vs / 1000, 1);

        // Update forecast
        updateForecastUI(bmkgData.data[0].cuaca);

        elements.lastUpdated.textContent = `Last Updated: ${formatTime(new Date())}`;
        isOutdoorDataLoaded = true;
        const loadTime = (performance.now() - startTime).toFixed(1);
        showToast(`Outdoor data loaded in ${loadTime}ms`);

    } catch (error) {
        console.error("Fetch outdoor error:", error);
        showToast("Failed to update outdoor data. Retrying...", true);
        resetOutdoorUI();
    }
}

function updateForecastUI(forecastData) {
    elements.forecastContainer.innerHTML = ''; // Clear previous forecast
    const now = new Date();

    const allForecasts = forecastData.flat();
    const futureForecasts = allForecasts.filter(item => new Date(item.local_datetime) > now);
    const displayForecasts = futureForecasts.slice(0, 5);

    if (displayForecasts.length === 0) {
        elements.forecastContainer.innerHTML = `<p class="text-gray-400">No future forecast data available.</p>`;
        return;
    }
    
    displayForecasts.forEach(item => {
        const forecastDate = new Date(item.local_datetime);
        const timeString = forecastDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        const forecastCard = `
            <div class="forecast-card flex flex-col items-center">
                <p class="font-bold text-base mb-1">${timeString}</p>
                <img src="${item.image}" alt="${item.weather_desc}" class="w-12 h-12">
                <p class="text-sm text-gray-300 mt-1">${item.weather_desc}</p>
                <p class="font-bold text-lg mt-1">${item.t}°C</p>
            </div>
        `;
        elements.forecastContainer.innerHTML += forecastCard;
    });
}


function resetIndoorUI() {
  elements.temperature.textContent = "-- °C";
  elements.humidity.textContent = "-- %";
  elements.pressure.textContent = "-- hPa";
  elements.altitude.textContent = "-- m";
  elements.gasRaw.textContent = "--";
  elements.gasCompensated.textContent = "-- ppm";
  elements.airQualityStatus.textContent = "--";
  
  Object.values(elements.bars).forEach(bar => {
    bar.style.width = "0%";
  });
}

function resetOutdoorUI() {
    elements.locationName.textContent = "Loading Location...";
    elements.locationDetails.textContent = "Could not fetch data";
    elements.weatherDescription.textContent = "--";
    elements.weatherIcon.style.display = 'none';
    elements.outdoorTemperature.textContent = "-- °C";
    elements.outdoorHumidity.textContent = "-- %";
    elements.windSpeed.textContent = "--";
    elements.windDirection.textContent = "km/h";
    elements.visibility.textContent = "--";
    elements.forecastContainer.innerHTML = `<p class="text-gray-400 text-center w-full">Failed to load forecast.</p>`;
}

function switchTab(tab) {
    activeTab = tab;
    clearInterval(indoorDataInterval);

    if (tab === 'indoor') {
        elements.indoorTabButton.classList.add('active');
        elements.outdoorTabButton.classList.remove('active');
        elements.indoorContent.classList.remove('hidden');
        elements.outdoorContent.classList.add('hidden');
        fetchIndoorData();
        indoorDataInterval = setInterval(fetchIndoorData, 30000);
    } else {
        elements.outdoorTabButton.classList.add('active');
        elements.indoorTabButton.classList.remove('active');
        elements.outdoorContent.classList.remove('hidden');
        elements.indoorContent.classList.add('hidden');
        fetchOutdoorData(); // Will use cached data if available
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  elements.indoorTabButton.addEventListener('click', () => switchTab('indoor'));
  elements.outdoorTabButton.addEventListener('click', () => switchTab('outdoor'));

  switchTab('indoor'); 
  
  setInterval(updateClock, 1000);
  updateClock();
  
  elements.refreshButton.addEventListener("click", () => {
    elements.refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-2"></i> Refreshing...';
    
    const fetchPromise = activeTab === 'indoor' ? fetchIndoorData() : fetchOutdoorData(true);

    fetchPromise.finally(() => {
      setTimeout(() => {
        elements.refreshButton.innerHTML = '<i class="fas fa-sync mr-2"></i> Refresh Data';
      }, 1000);
    });
  });
});