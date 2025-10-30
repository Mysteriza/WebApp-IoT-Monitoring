require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fetch = require("node-fetch");
const https = require("https");

const app = express();
const BLYNK_SERVER = "blynk.cloud";
const TOKEN = process.env.BLYNK_AUTH_TOKEN;

const agent = new https.Agent({ keepAlive: true });

app.use(express.static("public"));
app.use(express.json());

app.get("/api/blynk", async (_req, res) => {
  try {
    if (!TOKEN) throw new Error("BLYNK_AUTH_TOKEN is not defined");
    
    const url = `https://${BLYNK_SERVER}/external/api/get?token=${TOKEN}&V0&V1&V5&V8`;

    const r = await fetch(url, { agent });
    if (!r.ok) throw new Error(`Blynk get failed: ${r.status}`);
    const j = await r.json();

    const parse = (x, f = 0) =>
      x === null ||
      x === undefined ||
      x === "null" ||
      x === "undefined" ||
      Number.isNaN(parseFloat(x))
        ? f
        : parseFloat(x);

    const data = {
      temperature: parse(j.V0),
      humidity: parse(j.V1),
      rawGas: parse(j.V5),
      pressure: parse(j.V8, 1013.25),
    };

    if (data.pressure < 800 || data.pressure > 1200) data.pressure = 1013.25;

    res.json(data);
  } catch (e) {
    res
      .status(500)
      .json({ error: e.message, details: "Failed to fetch sensor data" });
  }
});

app.get("/api/openmeteo", async (req, res) => {
  const lat = req.query.lat || -6.898;
  const lon = req.query.lon || 107.6349;
  
  const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,pressure_msl,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`;
  const airQualityURL = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi`;
  const elevationURL = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;

  try {
    const [weatherResponse, airQualityResponse, elevationResponse] = await Promise.all([
      fetch(weatherURL, { agent }),
      fetch(airQualityURL, { agent }),
      fetch(elevationURL, { agent }),
    ]);

    if (!weatherResponse.ok) throw new Error(`Open-Meteo weather error: ${weatherResponse.status}`);
    if (!airQualityResponse.ok) throw new Error(`Open-Meteo air quality error: ${airQualityResponse.status}`);
    if (!elevationResponse.ok) throw new Error(`Open-Meteo elevation error: ${elevationResponse.status}`);

    const weatherData = await weatherResponse.json();
    const airQualityData = await airQualityResponse.json();
    const elevationData = await elevationResponse.json();

    const combinedData = {
      location: {
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        timezone: weatherData.timezone,
        elevation: elevationData.elevation[0]
      },
      current: { ...weatherData.current, ...airQualityData.current },
      hourly: { ...weatherData.hourly },
      daily: weatherData.daily
    };

    res.json(combinedData);
  } catch (e) {
    res.status(500).json({ error: e.message, details: "Failed to fetch weather data from Open-Meteo" });
  }
});

app.get("/api/geocode", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and Longitude are required" });
    }
    const geocodeURL = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    try {
        const response = await fetch(geocodeURL); 
        if (!response.ok) throw new Error(`Geocoding error: ${response.status}`);
        const data = await response.json();
        
        const locality = data.locality || "Unknown Location";
        const city = data.city || data.principalSubdivision || "";
        
        const fullName = city && city !== locality ? `${locality}, ${city}` : locality;

        res.json({ name: fullName });

    } catch (e) {
        res.status(500).json({ error: e.message, details: "Failed to fetch location name" });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));