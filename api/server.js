require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fetch = require("node-fetch");
const { sql } = require("@vercel/postgres");

const app = express();
const BLYNK_SERVER = "blynk.cloud";
const BLYNK_AUTH_TOKEN = process.env.BLYNK_AUTH_TOKEN;
const PINS = ["V0", "V1", "V5", "V6", "V7", "V8", "V9"];
const BMKG_API_URL = "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=32.73.14.1002";

app.use(express.static("public"));
app.use(express.json());

const parseSafeFloat = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
};

// Endpoint for fetching indoor sensor data from Blynk
app.get("/api/blynk", async (req, res) => {
  try {
    if (!BLYNK_AUTH_TOKEN) {
      throw new Error("BLYNK_AUTH_TOKEN is not defined");
    }

    const pinRequests = PINS.map(async (pin) => {
      try {
        const response = await fetch(
          `https://${BLYNK_SERVER}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${pin}`
        );
        if (!response.ok) {
          console.error(`Failed to fetch pin ${pin}: ${response.status}`);
          return null;
        }
        const text = await response.text();
        return text === "null" || text === "undefined" ? null : text;
      } catch (error) {
        console.error(`Error fetching pin ${pin}:`, error);
        return null;
      }
    });

    const responses = await Promise.all(pinRequests);

    const data = {
      temperature: parseSafeFloat(responses[0]),
      humidity: parseSafeFloat(responses[1]),
      rawGas: parseSafeFloat(responses[2]),
      compensatedGas: parseSafeFloat(responses[3]),
      airQualityStatus: responses[4] || "--",
      pressure: parseSafeFloat(responses[5], 1013.25),
      altitude: parseSafeFloat(responses[6], 0)
    };

    if (data.pressure < 800 || data.pressure > 1200) {
      console.warn(`Invalid pressure value: ${data.pressure}`);
      data.pressure = 1013.25;
    }
    if (data.altitude < -100 || data.altitude > 9000) {
      console.warn(`Invalid altitude value: ${data.altitude}`);
      data.altitude = 0;
    }
    res.json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message, details: "Failed to fetch sensor data" });
  }
});

// Endpoint for fetching outdoor weather data from BMKG
app.get("/api/bmkg", async (req, res) => {
  try {
    const response = await fetch(BMKG_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("BMKG API Error:", error);
    res.status(500).json({ error: error.message, details: "Failed to fetch weather data from BMKG" });
  }
});


// --- NEW ENDPOINTS FOR CHARTING ---

// 1. Endpoint to log data (called by Cron Job)
app.get("/api/log-data", async (req, res) => {
  if (!BLYNK_AUTH_TOKEN) return res.status(500).send("Blynk Auth Token not configured");

  try {
    const pinRequests = PINS.map(pin => fetch(`https://${BLYNK_SERVER}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${pin}`).then(r => r.text()));
    const responses = await Promise.all(pinRequests);
    const data = {
      temperature: parseSafeFloat(responses[0]),
      humidity: parseSafeFloat(responses[1]),
      raw_gas: parseSafeFloat(responses[2]),
      compensated_gas: parseSafeFloat(responses[3]),
      pressure: parseSafeFloat(responses[5]),
      altitude: parseSafeFloat(responses[6])
    };

    await sql`
      INSERT INTO sensor_data (temperature, humidity, raw_gas, compensated_gas, pressure, altitude)
      VALUES (${data.temperature}, ${data.humidity}, ${data.raw_gas}, ${data.compensated_gas}, ${data.pressure}, ${data.altitude});
    `;
    res.status(200).send("Data logged successfully.");
  } catch (error) {
    console.error("Error logging data:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Endpoint to get historical data
app.get("/api/history", async (req, res) => {
  const { range } = req.query; // e.g., '1d', '7d', '1m'
  let interval;

  switch (range) {
    case '1d': interval = '1 day'; break;
    case '3d': interval = '3 days'; break;
    case '1w': interval = '1 week'; break;
    case '1m': interval = '1 month'; break;
    case '3m': interval = '3 months'; break;
    case '6m': interval = '6 months'; break;
    case '12m': interval = '12 months'; break;
    default: interval = '3 days';
  }

  try {
    const { rows } = await sql`
      SELECT * FROM sensor_data
      WHERE timestamp >= NOW() - INTERVAL '1 year'
        AND timestamp >= NOW() - CAST(${interval} AS INTERVAL)
      ORDER BY timestamp ASC;
    `;
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Endpoint to clean up old data (called by Cron Job)
app.get("/api/cleanup-data", async (req, res) => {
  try {
    await sql`
      DELETE FROM sensor_data
      WHERE timestamp < NOW() - INTERVAL '12 months';
    `;
    res.status(200).send("Cleanup successful.");
  } catch (error) {
    console.error("Error cleaning up data:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});