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
  
  // Outdoor elements
  locationName: document.getElementById("location-name"),
  locationDetails: document.getElementById("location-details"),
  weatherIcon: document.getElementById("weather-icon"),
  weatherDescription: document.getElementById("weather-description"),
  outdoorTemperature: document.getElementById("outdoor-temperature"),
  outdoorHumidity: document.getElementById("outdoor-humidity"),
  cloudCoverage: document.getElementById("cloud-coverage"),
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

// --- UTILITY FUNCTIONS ---
function formatNumber(value, decimals = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? '--' : num.toFixed(decimals);
}

function showToast(message, isError = false) {
  elements.toastText.textContent = message;
  const toastClass = isError 
    ? "bg-red-900 text-white border border-red-400" 
    : "bg-gray-900 text-white border border-cyan-400";
  elements.toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 max-w-xs text-center transition-all duration-300 ${toastClass}`;
  elements.toast.classList.remove("hidden");
  setTimeout(() => elements.toast.classList.add("hidden"), 3000);
}

function updateClock() {
  const now = new Date();
  elements.time.textContent = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  elements.date.textContent = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function getWindDirectionFullName(abbr) {
    const directions = {
        'N': 'North', 'NNE': 'North-Northeast', 'NE': 'Northeast', 'ENE': 'East-Northeast',
        'E': 'East', 'ESE': 'East-Southeast', 'SE': 'Southeast', 'SSE': 'South-Southeast',
        'S': 'South', 'SSW': 'South-Southwest', 'SW': 'Southwest', 'WSW': 'West-Southwest',
        'W': 'West', 'WNW': 'West-Northwest', 'NW': 'Northwest', 'NNW': 'North-Northwest'
    };
    return directions[abbr] || abbr;
}


// --- INDOOR UI & DATA ---
function updateIndoorStyles(data) {
    const getStyleClass = (value, thresholds, classes) => {
        for (let i = 0; i < thresholds.length; i++) {
            if (value < thresholds[i]) return classes[i];
        }
        return classes[classes.length - 1];
    };

    elements.bars.temp.style.width = `${Math.min(Math.max((data.temperature / 40) * 100, 0), 100)}%`;
    elements.temperature.className = `data-value text-4xl font-bold ${getStyleClass(data.temperature, [20, 27, 30], ['temp-cold', 'temp-cool', 'temp-warm', 'temp-hot'])}`;

    elements.bars.humidity.style.width = `${Math.min(Math.max(data.humidity, 0), 100)}%`;
    elements.humidity.className = `data-value text-4xl font-bold ${getStyleClass(data.humidity, [30, 40, 60, 70], ['humidity-low', 'humidity-moderate', 'humidity-optimal', 'humidity-high', 'humidity-very-high'])}`;

    const pressureRange = 1100 - 500;
    elements.bars.pressure.style.width = `${Math.min(Math.max(((data.pressure - 500) / pressureRange) * 100, 0), 100)}%`;
    elements.pressure.className = `data-value text-4xl font-bold ${getStyleClass(data.pressure, [980, 1020], ['pressure-low', 'pressure-normal', 'pressure-high'])}`;

    elements.bars.altitude.style.width = `${Math.min(Math.max(data.altitude / 2000 * 100, 0), 100)}%`;
    elements.altitude.className = `data-value text-4xl font-bold ${getStyleClass(data.altitude, [100, 500], ['altitude-low', 'altitude-medium', 'altitude-high'])}`;

    elements.bars.gasRaw.style.width = `${Math.min(Math.max((data.rawGas / 1023) * 100, 0), 100)}%`;
    elements.bars.gasCompensated.style.width = `${Math.min(Math.max((data.compensatedGas / 500) * 100, 0), 100)}%`;

    const statusClasses = { "Very Good": "status-excellent", Good: "status-good", Fair: "status-fair", Poor: "status-poor", "Very Poor": "status-critical" };
    const textClasses = { "Very Good": "text-green-400", Good: "text-cyan-300", Fair: "text-yellow-400", Poor: "text-orange-400", "Very Poor": "text-red-400" };
    
    const statusClass = statusClasses[data.airQualityStatus] || "status-good";
    const statusIndicator = document.querySelector("#indoor-content .status-indicator");
    if (statusIndicator) statusIndicator.className = `status-indicator ml-3 ${statusClass}`;
    
    if (elements.airQualityStatus) elements.airQualityStatus.className = `text-2xl font-bold mt-2 ${textClasses[data.airQualityStatus] || "text-cyan-300"}`;
}

async function fetchIndoorData() {
    try {
        const startTime = performance.now();
        const response = await fetch("/api/blynk");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        elements.temperature.textContent = `${formatNumber(data.temperature, 1)} °C`;
        elements.humidity.textContent = `${formatNumber(data.humidity, 1)} %`;
        elements.pressure.textContent = `${formatNumber(data.pressure, 1)} hPa`;
        elements.altitude.textContent = `${formatNumber(data.altitude)} m`;
        elements.gasRaw.textContent = formatNumber(data.rawGas);
        elements.gasCompensated.textContent = formatNumber(data.compensatedGas);
        elements.airQualityStatus.textContent = data.airQualityStatus || "--";

        updateIndoorStyles(data);
        elements.lastUpdated.textContent = `Last Data Sync: ${new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
        showToast(`Indoor data loaded in ${Math.round(performance.now() - startTime)}ms`);
    } catch (error) {
        console.error("Fetch indoor error:", error);
        showToast("Failed to update indoor data", true);
    }
}

// --- OUTDOOR UI & DATA ---
async function fetchOutdoorData(forceRefresh = false) {
    if (isOutdoorDataLoaded && !forceRefresh) {
        showToast("Outdoor data already loaded.");
        return;
    }
    try {
        const startTime = performance.now();
        const response = await fetch('/api/bmkg');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const bmkgData = await response.json();
        
        updateOutdoorUI(bmkgData);

        elements.lastUpdated.textContent = `Last Data Sync: ${new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
        isOutdoorDataLoaded = true;
        showToast(`Outdoor data loaded in ${Math.round(performance.now() - startTime)}ms`);
    } catch (error) {
        console.error("Fetch outdoor error:", error);
        showToast("Failed to update outdoor data", true);
        resetOutdoorUI();
    }
}

function updateOutdoorUI(bmkgData) {
    const { lokasi, data } = bmkgData;
    const weatherNow = data[0].cuaca[0][0];

    elements.locationName.textContent = `${lokasi.kotkab}, ${lokasi.provinsi}`;
    elements.locationDetails.textContent = `${lokasi.kecamatan}, ${lokasi.desa}`;
    elements.weatherDescription.textContent = weatherNow.weather_desc;
    elements.weatherIcon.src = weatherNow.image;
    elements.weatherIcon.style.display = 'block';
    elements.outdoorTemperature.textContent = `${formatNumber(weatherNow.t)}°`;
    elements.outdoorHumidity.textContent = `${formatNumber(weatherNow.hu)}%`;
    elements.cloudCoverage.textContent = `${formatNumber(weatherNow.tcc)}%`;
    elements.windSpeed.textContent = formatNumber(weatherNow.ws * 3.6, 1);
    elements.windDirection.textContent = `From ${getWindDirectionFullName(weatherNow.wd)} to ${getWindDirectionFullName(weatherNow.wd_to)}`;
    elements.visibility.textContent = weatherNow.vs_text.replace(/[<>]/g, '').trim();

    updateForecastUI(data[0].cuaca);
}

function updateForecastUI(forecastData) {
    elements.forecastContainer.innerHTML = '';
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');

    const futureForecasts = forecastData.flat()
        .filter(item => new Date(item.local_datetime) > now)
        .slice(0, 6);

    if (futureForecasts.length === 0) {
        elements.forecastContainer.innerHTML = `<p class="text-gray-400">No future forecast data available.</p>`;
        return;
    }
    
    futureForecasts.forEach(item => {
        const forecastDate = new Date(item.local_datetime);
        const timeString = forecastDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateString = forecastDate.toLocaleDateString('en-CA') === todayStr 
            ? "Today" 
            : forecastDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        const forecastCard = `
            <div class="forecast-card flex-shrink-0">
                <p class="font-bold text-base">${timeString}</p>
                <p class="text-xs text-gray-400 mb-2">${dateString}</p>
                <img src="${item.image}" alt="${item.weather_desc}" class="w-12 h-12 mx-auto">
                <p class="text-sm text-gray-200 mt-2">${item.weather_desc}</p>
                <p class="font-bold text-lg mt-1">${item.t}°C</p>
            </div>
        `;
        elements.forecastContainer.innerHTML += forecastCard;
    });
}

function resetOutdoorUI() {
    elements.locationName.textContent = "Loading Location...";
    elements.locationDetails.textContent = "Could not fetch data";
    elements.weatherDescription.textContent = "--";
    elements.weatherIcon.style.display = 'none';
    elements.outdoorTemperature.textContent = "--°";
    elements.outdoorHumidity.textContent = "--%";
    elements.cloudCoverage.textContent = "--%";
    elements.windSpeed.textContent = "--";
    elements.windDirection.textContent = "From -- to --";
    elements.visibility.textContent = "--";
    elements.forecastContainer.innerHTML = `<p class="text-gray-400 text-center w-full">Failed to load forecast.</p>`;
}

// --- MAIN LOGIC & INITIALIZATION ---
function switchTab(tab) {
    activeTab = tab;
    clearInterval(indoorDataInterval);

    const isIndoor = tab === 'indoor';
    elements.indoorTabButton.classList.toggle('active', isIndoor);
    elements.outdoorTabButton.classList.toggle('active', !isIndoor);
    elements.indoorContent.classList.toggle('hidden', !isIndoor);
    elements.outdoorContent.classList.toggle('hidden', isIndoor);

    if (isIndoor) {
        fetchIndoorData();
        indoorDataInterval = setInterval(fetchIndoorData, 30000);
    } else {
        fetchOutdoorData();
    }
}

document.addEventListener("DOMContentLoaded", () => {
  switchTab('indoor'); 
  
  setInterval(updateClock, 1000);
  updateClock();
  
  elements.indoorTabButton.addEventListener('click', () => switchTab('indoor'));
  elements.outdoorTabButton.addEventListener('click', () => switchTab('outdoor'));
  
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