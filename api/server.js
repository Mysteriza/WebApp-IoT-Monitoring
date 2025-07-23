require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fetch = require("node-fetch");

const app = express();
const BLYNK_SERVER = "blynk.cloud";
const BLYNK_AUTH_TOKEN = process.env.BLYNK_AUTH_TOKEN;
const PINS = ["V0", "V1", "V5", "V6", "V7", "V8", "V9"];

app.use(express.static("public"));
app.use(express.json());

app.get("/api/blynk", async (req, res) => {
  try {
    if (!BLYNK_AUTH_TOKEN) {
      throw new Error("BLYNK_AUTH_TOKEN is not defined");
    }

    // Fetch all pin values with error handling for each pin
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

    // Parse and validate all values
    const data = {
      temperature: parseSafeFloat(responses[0]),
      humidity: parseSafeFloat(responses[1]),
      rawGas: parseSafeFloat(responses[2]),
      compensatedGas: parseSafeFloat(responses[3]),
      airQualityStatus: responses[4] || "--",
      pressure: parseSafeFloat(responses[5], 1013.25), // Default sea level pressure
      altitude: parseSafeFloat(responses[6], 0)
    };

    // Additional validation for BME280 data
    if (data.pressure < 800 || data.pressure > 1200) {
      console.warn(`Invalid pressure value: ${data.pressure}`);
      data.pressure = 1013.25;
    }

    if (data.altitude < -100 || data.altitude > 9000) {
      console.warn(`Invalid altitude value: ${data.altitude}`);
      data.altitude = 0;
    }

    console.log("Sending sensor data:", JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: error.message,
      details: "Failed to fetch sensor data",
      timestamp: new Date().toISOString()
    });
  }
});

function parseSafeFloat(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Blynk pins being monitored: ${PINS.join(", ")}`);
});