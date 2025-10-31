const elements = {
  indoorTabButton: document.getElementById("indoor-tab-button"),
  outdoorTabButton: document.getElementById("outdoor-tab-button"),
  indoorContent: document.getElementById("indoor-content"),
  outdoorContent: document.getElementById("outdoor-content"),
  temperature: document.getElementById("temperature"),
  temperatureWrapper: document.getElementById("temperature-wrapper"),
  humidity: document.getElementById("humidity"),
  humidityWrapper: document.getElementById("humidity-wrapper"),
  indoorPressure: document.querySelector("#indoor-content #pressure"),
  pressureWrapper: document.getElementById("pressure-wrapper"),
  gasRaw: document.getElementById("gas-raw"),
  gasRawStatus: document.getElementById("gas-raw-status"),
  bars: {
    temp: document.getElementById("temp-bar"),
    humidity: document.getElementById("humidity-bar"),
    pressure: document.querySelector("#indoor-content #pressure-bar"),
    gasRaw: document.getElementById("gas-raw-bar"),
  },
  locationName: document.getElementById("location-name"),
  locationDetails: document.getElementById("location-details"),
  weatherIconContainer: document.getElementById("weather-icon-container"),
  weatherDescription: document.getElementById("weather-description"),
  outdoorTemperature: document.getElementById("outdoor-temperature"),
  apparentTemperature: document.getElementById("apparent-temperature"),
  outdoorHumidity: document.getElementById("outdoor-humidity"),
  surfacePressure: document.getElementById("surface-pressure"),
  seaLevelPressure: document.getElementById("sea-level-pressure"),
  outdoorAltitude: document.querySelector("#outdoor-content #altitude"),
  precipitation: document.getElementById("precipitation"),
  uvIndex: document.getElementById("uv-index"),
  uvIndexDesc: document.getElementById("uv-index-desc"),
  airQuality: document.getElementById("air-quality"),
  airQualityDesc: document.getElementById("air-quality-desc"),
  windSpeed: document.getElementById("wind-speed"),
  windDirection: document.getElementById("wind-direction"),
  forecastContainer: document.getElementById("forecast-container"),
  dailyForecastContainer: document.getElementById("daily-forecast-container"),
  lastUpdated: document.getElementById("last-updated"),
  refreshButton: document.getElementById("refresh-button"),
  time: document.getElementById("time"),
  date: document.getElementById("date"),
  toast: document.getElementById("message-toast"),
  toastText: document.getElementById("message-text"),
};

let activeTab = "indoor";
let indoorDataInterval;
const defaultCoords = { lat: -6.898, lon: 107.6349, name: "Cikutra, Bandung" };
let toastTimeout;

function formatNumber(value, decimals = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? "--" : num.toFixed(decimals);
}

function showToast(message, isError = false, duration = 3000) {
  clearTimeout(toastTimeout);
  elements.toastText.textContent = message;
  const toastClass = isError
    ? "bg-red-900 text-white border border-red-400"
    : "bg-gray-900 text-white border border-cyan-400";
  elements.toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 max-w-xs text-center transition-all duration-300 ${toastClass}`;
  elements.toast.classList.remove("hidden");
  toastTimeout = setTimeout(() => elements.toast.classList.add("hidden"), duration);
}

function updateClock() {
  const now = new Date();
  elements.time.textContent = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  elements.date.textContent = now.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function getWeatherInfo(code, dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const hour = date.getHours();
  const isDay = hour >= 6 && hour < 18;
  const descriptions = {
    0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime Fog", 51: "Light Drizzle", 53: "Drizzle",
    55: "Dense Drizzle", 56: "Freezing Drizzle", 57: "Dense F. Drizzle",
    61: "Slight Rain", 63: "Rain", 65: "Heavy Rain", 66: "Freezing Rain",
    67: "Heavy F. Rain", 71: "Slight Snow", 73: "Snow", 75: "Heavy Snow",
    77: "Snow Grains", 80: "Rain Showers", 81: "Rain Showers",
    82: "Violent Showers", 85: "Snow Showers", 86: "Heavy Snow Showers",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
  };
  const icons = {
    0: "fa-sun", 1: "fa-cloud-sun", 2: "fa-cloud", 3: "fa-cloud",
    45: "fa-smog", 48: "fa-smog", 51: "fa-cloud-rain", 53: "fa-cloud-rain",
    55: "fa-cloud-showers-heavy", 56: "fa-cloud-rain", 57: "fa-cloud-showers-heavy",
    61: "fa-cloud-rain", 63: "fa-cloud-showers-heavy", 65: "fa-cloud-showers-heavy",
    66: "fa-snowflake", 67: "fa-snowflake", 71: "fa-snowflake", 73: "fa-snowflake",
    75: "fa-snowflake", 77: "fa-snowflake", 80: "fa-cloud-sun-rain",
    81: "fa-cloud-sun-rain", 82: "fa-poo-storm", 85: "fa-snowflake", 86: "fa-snowflake",
    95: "fa-bolt", 96: "fa-bolt", 99: "fa-bolt",
  };
  const nightIcons = { 0: "fa-moon", 1: "fa-cloud-moon", 80: "fa-cloud-moon-rain", 81: "fa-cloud-moon-rain" };
  return { description: descriptions[code] || "Unknown", icon: isDay ? icons[code] : (nightIcons[code] || icons[code]) };
}

function getWindDirection(degrees) {
  if (degrees === null || typeof degrees === "undefined" || isNaN(degrees)) {
    return "--";
  }
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(degrees / 22.5) % 16];
}

function getUVIndexInfo(uv) {
  const value = Math.round(uv);
  if (value <= 2) return { text: "Low", className: "text-green-400" };
  if (value <= 5) return { text: "Moderate", className: "text-yellow-400" };
  if (value <= 7) return { text: "High", className: "text-orange-400" };
  if (value <= 10) return { text: "Very High", className: "text-red-500" };
  return { text: "Extreme", className: "text-purple-400" };
}

function getAQIInfo(aqi) {
  const value = Math.round(aqi);
  if (value <= 20) return { text: "Good", className: "text-green-400" };
  if (value <= 40) return { text: "Fair", className: "text-cyan-300" };
  if (value <= 60) return { text: "Moderate", className: "text-yellow-400" };
  if (value <= 80) return { text: "Poor", className: "text-orange-400" };
  if (value <= 100) return { text: "Very Poor", className: "text-red-500" };
  return { text: "Extremely Poor", className: "text-purple-400" };
}

async function fetchIndoorData() {
    try {
        const startTime = performance.now();
        const response = await fetch("/api/blynk");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        elements.temperature.textContent = formatNumber(data.temperature, 2);
        elements.humidity.textContent = formatNumber(data.humidity, 2);
        elements.indoorPressure.textContent = formatNumber(data.pressure, 2);
        elements.gasRaw.textContent = formatNumber(data.rawGas, 0);
        updateIndoorStyles(data);
        elements.lastUpdated.textContent = `Last Data Sync: ${new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
        showToast(`Indoor data loaded in ${Math.round(performance.now() - startTime)}ms`);
    } catch (error) {
        console.error("Fetch indoor error:", error);
        showToast("Failed to update indoor data", true, 5000);
    }
}

function getGasStatus(value) {
    if (value < 300) return { text: "Fresh Air", className: "text-green-400" };
    if (value <= 550) return { text: "Good", className: "text-cyan-300" };
    if (value <= 700) return { text: "Moderate", className: "text-yellow-400" };
    return { text: "Poor", className: "text-red-400" };
}

function updateIndoorStyles(data) {
    const getStyleClass = (value, thresholds, classes) => {
        for (let i = 0; i < thresholds.length; i++) {
            if (value < thresholds[i]) return classes[i];
        }
        return classes[classes.length - 1];
    };
    elements.bars.temp.style.width = `${Math.min(Math.max((data.temperature / 40) * 100, 0), 100)}%`;
    elements.temperatureWrapper.className = `flex items-baseline ${getStyleClass(data.temperature, [20, 27, 30], ['temp-cold', 'temp-cool', 'temp-warm', 'temp-hot'])}`;
    
    elements.bars.humidity.style.width = `${Math.min(Math.max(data.humidity, 0), 100)}%`;
    elements.humidityWrapper.className = `flex items-baseline ${getStyleClass(data.humidity, [30, 40, 60, 70], ['humidity-low', 'humidity-moderate', 'humidity-optimal', 'humidity-high', 'humidity-very-high'])}`;
    
    const pressureRange = 1100 - 500;
    elements.bars.pressure.style.width = `${Math.min(Math.max(((data.pressure - 500) / pressureRange) * 100, 0), 100)}%`;
    elements.pressureWrapper.className = `flex items-baseline ${getStyleClass(data.pressure, [980, 1020], ['pressure-low', 'pressure-normal', 'pressure-high'])}`;
    
    elements.bars.gasRaw.style.width = `${Math.min(Math.max((data.rawGas / 1023) * 100, 0), 100)}%`;
    const gasStatus = getGasStatus(data.rawGas);
    elements.gasRawStatus.textContent = gasStatus.text;
    elements.gasRawStatus.className = `text-lg font-bold -mt-1 ${gasStatus.className}`;
}

function getCachedLocation() {
    const cached = sessionStorage.getItem('userLocation');
    if (cached) {
        return JSON.parse(cached);
    }
    return null;
}

function cacheLocation(coords, name) {
    const locationData = { ...coords, name };
    sessionStorage.setItem('userLocation', JSON.stringify(locationData));
}

function getUserLocation() {
    return new Promise((resolve) => {
        if (!("geolocation" in navigator)) {
            resolve({ error: "Geolocation not supported." });
            return;
        }
        const handleSuccess = (position) => {
            resolve({ coords: { lat: position.coords.latitude, lon: position.coords.longitude } });
        };
        const handleError = (error) => {
            console.error("Geolocation Error:", error.code, error.message);
            resolve({ error });
        };
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            timeout: 15000,
            enableHighAccuracy: true,
        });
    });
}


async function fetchAndDisplayWeatherData(coords, locationName, isFallback = false) {
    try {
        const startTime = performance.now();
        const weatherUrl = `/api/openmeteo?lat=${coords.lat}&lon=${coords.lon}`;
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) throw new Error(`Weather API error! status: ${weatherResponse.status}`);
        const data = await weatherResponse.json();

        if (!locationName && coords) {
            const geocodeUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=en`;
            try {
                const geocodeResponse = await fetch(geocodeUrl);
                if (geocodeResponse.ok) {
                    const geocode = await geocodeResponse.json();
                    const locality = geocode.locality || "Unknown Location";
                    const city = geocode.city || geocode.principalSubdivision || "";
                    locationName = city && city !== locality ? `${locality}, ${city}` : locality;
                    cacheLocation(coords, locationName);
                }
            } catch (geocodeError) {
                console.error("Geocode fetch error:", geocodeError);
            }
        }

        updateOutdoorUI(data, locationName || defaultCoords.name);
        elements.lastUpdated.textContent = `Last Data Sync: ${new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
        
        if (!isFallback) {
            showToast(`Outdoor data loaded in ${Math.round(performance.now() - startTime)}ms`);
        }
    } catch (error) {
        console.error("Fetch outdoor error:", error);
        showToast("Failed to update outdoor data", true, 5000);
        resetOutdoorUI();
    }
}

async function fetchOutdoorData(forceRefresh = false) {
    if (forceRefresh) {
        sessionStorage.removeItem('userLocation');
    }
    let cachedLocation = getCachedLocation();
    if (cachedLocation) {
        fetchAndDisplayWeatherData(cachedLocation, cachedLocation.name);
        return;
    }

    showToast("Getting your location...", false, 15000);
    const locationResult = await getUserLocation();

    if (locationResult.coords) {
        showToast("Location found!", false);
        fetchAndDisplayWeatherData(locationResult.coords);
    } else {
        let errorMessage = "Could not get location. Using default.";
        if (locationResult.error?.code === 1) {
            errorMessage = "Location permission denied. Using default.";
        } else if (locationResult.error?.code === 2) {
            errorMessage = "Location unavailable. Check GPS/network.";
        } else if (locationResult.error?.code === 3) {
            errorMessage = "Location request timed out. Using default.";
        }
        showToast(errorMessage, true, 5000);
        
        setTimeout(() => {
            cacheLocation(defaultCoords, defaultCoords.name);
            fetchAndDisplayWeatherData(defaultCoords, defaultCoords.name, true);
        }, 3000);
    }
}

function updateOutdoorUI(data, locationName) {
    const { location, current, hourly, daily } = data;
    elements.locationName.textContent = locationName;
    elements.locationDetails.textContent = `Timezone: ${location.timezone}`;
    
    const weatherInfo = getWeatherInfo(current.weather_code, current.time);
    elements.weatherDescription.textContent = weatherInfo.description;
    elements.weatherIconContainer.innerHTML = `<i class="fas ${weatherInfo.icon} text-6xl md:text-7xl text-cyan-300"></i>`;
    
    elements.outdoorTemperature.textContent = `${formatNumber(current.temperature_2m, 2)}°`;
    elements.apparentTemperature.textContent = `${formatNumber(current.apparent_temperature, 2)}°`;
    elements.outdoorHumidity.textContent = `${formatNumber(current.relative_humidity_2m, 2)}%`;
    elements.surfacePressure.innerHTML = `${formatNumber(current.surface_pressure, 2)}<span class="text-lg">hPa</span>`;
    elements.seaLevelPressure.innerHTML = `${formatNumber(current.pressure_msl, 2)}<span class="text-lg">hPa</span>`;
    elements.outdoorAltitude.innerHTML = `${formatNumber(location.elevation, 2)}<span class="text-lg">m</span>`;
    elements.windSpeed.textContent = formatNumber(current.wind_speed_10m, 2);
    elements.windDirection.textContent = getWindDirection(current.wind_direction_10m);
    elements.precipitation.textContent = formatNumber(current.precipitation, 2);

    const uvInfo = getUVIndexInfo(current.uv_index);
    elements.uvIndex.textContent = formatNumber(current.uv_index, 2);
    elements.uvIndexDesc.textContent = uvInfo.text;
    elements.uvIndexDesc.className = `text-lg font-bold ${uvInfo.className}`;
    elements.uvIndex.className = `data-value text-4xl font-bold ${uvInfo.className}`;

    const aqiInfo = getAQIInfo(current.european_aqi);
    elements.airQuality.textContent = formatNumber(current.european_aqi, 0);
    elements.airQualityDesc.textContent = aqiInfo.text;
    elements.airQualityDesc.className = `text-lg font-bold ${aqiInfo.className}`;
    elements.airQuality.className = `data-value text-4xl font-bold ${aqiInfo.className}`;

    updateHourlyForecastUI(hourly);
    updateDailyForecastUI(daily);
}

function updateHourlyForecastUI(hourly) {
    elements.forecastContainer.innerHTML = '';
    const now = new Date();
    const currentTimeIndex = hourly.time.findIndex(time => new Date(time) >= now);
    if (currentTimeIndex === -1) {
        elements.forecastContainer.innerHTML = `<p class="text-gray-400 w-full text-center">No future forecast data.</p>`;
        return;
    }
    const next24Hours = hourly.time.slice(currentTimeIndex, currentTimeIndex + 24);
    next24Hours.forEach((time, index) => {
        const i = currentTimeIndex + index;
        const weatherInfo = getWeatherInfo(hourly.weather_code[i], time);
        const forecastCard = `
            <div class="flex-shrink-0 text-center p-3 rounded-lg bg-white/5 w-28">
                <p class="font-bold text-base">${new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false })}:00</p>
                <i class="fas ${weatherInfo.icon} text-3xl text-cyan-300 my-2"></i>
                <p class="font-bold text-lg">${formatNumber(hourly.temperature_2m[i], 2)}°C</p>
                <p class="text-xs text-gray-300 -mt-1 mb-1">${weatherInfo.description}</p>
                <div class="flex items-center justify-center text-cyan-300">
                  <i class="fas fa-umbrella text-xs mr-1"></i>
                  <span class="text-xs font-medium">${formatNumber(hourly.precipitation_probability[i], 0)}%</span>
                </div>
            </div>
        `;
        elements.forecastContainer.innerHTML += forecastCard;
    });
}

function updateDailyForecastUI(daily) {
    elements.dailyForecastContainer.innerHTML = `
      <div class="hidden md:grid grid-cols-5 items-center text-gray-400 text-sm font-bold border-b border-white/10 pb-2 mb-2">
          <span class="col-span-2">DAY</span>
          <span class="text-center">FORECAST</span>
          <span class="text-center">RAIN</span>
          <span class="text-right">TEMP</span>
      </div>`;
    daily.time.forEach((dateStr, i) => {
        const date = new Date(dateStr);
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        const dayName = i === 0 ? "Today" : date.toLocaleDateString('en-US', { weekday: 'short' });
        const weatherInfo = getWeatherInfo(daily.weather_code[i], dateStr);
        const dailyItem = `
            <div class="grid grid-cols-5 items-center py-2 border-b border-white/5 last:border-none text-sm md:text-base">
                <div class="col-span-2 flex flex-col">
                  <span class="font-bold">${dayName}</span>
                  <span class="text-xs text-gray-400 md:hidden">${weatherInfo.description}</span>
                </div>
                <div class="hidden md:flex items-center justify-center col-span-1">
                    <i class="fas ${weatherInfo.icon} text-xl text-cyan-300 w-8 text-center"></i>
                    <span class="ml-2 text-gray-300">${weatherInfo.description}</span>
                </div>
                <div class="flex items-center justify-center text-sm col-span-1">
                     <i class="fas fa-umbrella text-cyan-300 text-xs mr-1"></i>
                     <span>${formatNumber(daily.precipitation_probability_max[i], 0)}%</span>
                </div>
                <p class="col-span-2 md:col-span-1 text-right font-medium">
                    <span class="font-bold">${formatNumber(daily.temperature_2m_max[i], 2)}°</span>
                    <span class="text-gray-400">/${formatNumber(daily.temperature_2m_min[i], 2)}°</span>
                </p>
            </div>
        `;
        elements.dailyForecastContainer.innerHTML += dailyItem;
    });
}

function resetOutdoorUI() {
    elements.locationName.textContent = "Getting Location...";
    elements.locationDetails.textContent = "";
    elements.weatherDescription.textContent = "--";
    elements.weatherIconContainer.innerHTML = `<i class="fas fa-spinner fa-spin text-6xl text-cyan-300"></i>`;
    elements.outdoorTemperature.textContent = "--°";
    elements.apparentTemperature.textContent = "--°";
    elements.outdoorHumidity.textContent = "--%";
    elements.surfacePressure.innerHTML = "--<span class='text-lg'>hPa</span>";
    elements.seaLevelPressure.innerHTML = "--<span class='text-lg'>hPa</span>";
    elements.outdoorAltitude.innerHTML = "--<span class='text-lg'>m</span>";
    elements.precipitation.textContent = "--";
    elements.windSpeed.textContent = "--";
    elements.windDirection.textContent = "--";
    elements.uvIndex.textContent = "--";
    elements.uvIndexDesc.textContent = "--";
    elements.airQuality.textContent = "--";
    elements.airQualityDesc.textContent = "--";
    elements.forecastContainer.innerHTML = `<p class="text-gray-400 text-center w-full">Loading forecast...</p>`;
    elements.dailyForecastContainer.innerHTML = `<p class="text-gray-400 text-center w-full">Loading forecast...</p>`;
}

function switchTab(tab) {
    activeTab = tab;
    clearInterval(indoorDataInterval);
    const isIndoor = tab === "indoor";
    elements.indoorTabButton.classList.toggle("active", isIndoor);
    elements.outdoorTabButton.classList.toggle("active", !isIndoor);
    elements.indoorContent.classList.toggle("hidden", !isIndoor);
    elements.outdoorContent.classList.toggle("hidden", isIndoor);
    if (isIndoor) {
        fetchIndoorData();
        indoorDataInterval = setInterval(fetchIndoorData, 30000);
    } else {
        resetOutdoorUI();
        fetchOutdoorData(false);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    sessionStorage.removeItem('userLocation');
    switchTab("indoor");
    setInterval(updateClock, 1000);
    updateClock();
    elements.indoorTabButton.addEventListener("click", () => switchTab("indoor"));
    elements.outdoorTabButton.addEventListener("click", () => switchTab("outdoor"));
    elements.refreshButton.addEventListener("click", () => {
        elements.refreshButton.innerHTML = '<i class="fas fa-sync-alt fa-spin mr-2"></i> Refreshing...';
        const fetchPromise = activeTab === "indoor" ? fetchIndoorData() : fetchOutdoorData(true);
        fetchPromise.finally(() => {
            setTimeout(() => {
                elements.refreshButton.innerHTML = '<i class="fas fa-sync mr-2"></i> Refresh Data';
            }, 1000);
        });
    });
});