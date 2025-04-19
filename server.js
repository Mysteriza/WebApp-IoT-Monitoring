require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fetch = require("node-fetch");
const app = express();

const BLYNK_SERVER = "blynk.cloud";
const BLYNK_AUTH_TOKEN = process.env.BLYNK_AUTH_TOKEN;

// Serve static files dari folder public
app.use(express.static("public"));

// Endpoint untuk fetch data dari Blynk
app.get("/api/blynk", async (req, res) => {
  try {
    if (!BLYNK_AUTH_TOKEN) {
      throw new Error("BLYNK_AUTH_TOKEN is not defined in .env.local");
    }

    const pins = ["V0", "V1", "V5", "V6", "V7"]; // Temperature, Humidity, Gas Raw, Gas Compensated, Air Quality
    const responses = await Promise.all(
      pins.map((pin) =>
        fetch(
          `https://${BLYNK_SERVER}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${pin}`
        ).then((res) => {
          if (!res.ok)
            throw new Error(`Failed to fetch pin ${pin}: ${res.statusText}`);
          return res.text();
        })
      )
    );

    // Log data mentah untuk debugging
    console.log("Raw Blynk responses:", responses);

    // Parse data
    const [temperature, humidity, rawGas, compensatedGas, airQualityStatus] =
      responses;
    const data = {
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      rawGas: parseFloat(rawGas),
      compensatedGas: parseFloat(compensatedGas),
      airQualityStatus,
    };

    // Log data setelah parsing
    console.log("Parsed data:", data);

    // Validasi data dengan penanganan lebih spesifik
    if (isNaN(data.temperature)) {
      throw new Error("Invalid temperature data from V0");
    }
    if (isNaN(data.humidity)) {
      throw new Error("Invalid humidity data from V1");
    }
    if (isNaN(data.rawGas)) {
      throw new Error("Invalid raw gas data from V5");
    }
    if (isNaN(data.compensatedGas)) {
      throw new Error("Invalid compensated gas data from V6");
    }
    if (!data.airQualityStatus || typeof data.airQualityStatus !== "string") {
      throw new Error("Invalid air quality status from V7");
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching Blynk data:", error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
