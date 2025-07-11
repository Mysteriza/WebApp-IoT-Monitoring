require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fetch = require("node-fetch");
const NodeCache = require("node-cache");

const app = express();
const cache = new NodeCache({ stdTTL: 1200 });

const BLYNK_SERVER = "blynk.cloud";
const BLYNK_AUTH_TOKEN = process.env.BLYNK_AUTH_TOKEN;
const PINS = ["V0", "V1", "V5", "V6", "V7"];

app.use(express.static("public"));

app.get("/api/blynk", async (req, res) => {
  try {
    if (!BLYNK_AUTH_TOKEN) throw new Error("BLYNK_AUTH_TOKEN is not defined");

    const responses = await Promise.all(
      PINS.map((pin) =>
        fetch(
          `https://${BLYNK_SERVER}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${pin}`
        ).then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch pin ${pin}`);
          return res.text();
        })
      )
    );

    const data = {
      temperature: parseFloat(responses[0]),
      humidity: parseFloat(responses[1]),
      rawGas: parseFloat(responses[2]),
      compensatedGas: parseFloat(responses[3]),
      airQualityStatus: responses[4],
    };

    if (
      Object.values(data)
        .slice(0, 4)
        .some((val) => isNaN(val)) ||
      !data.airQualityStatus
    ) {
      throw new Error("Invalid data from Blynk");
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/weather", async (req, res) => {
  try {
    const cachedData = cache.get("weatherData");
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await fetch("https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=32.73.14.1002");
    if (!response.ok) throw new Error("Failed to fetch from BMKG API");

    const data = await response.json();
    const currentWeather = data.data[0].cuaca[0][0];

    const result = {
      current: {
        temperature: currentWeather.t,
        humidity: currentWeather.hu,
        condition: currentWeather.weather_desc,
        windSpeed: currentWeather.ws,
        windDirection: currentWeather.wd,
        windDirectionDeg: currentWeather.wd_deg,
        visibility: currentWeather.vs,
        cloudCover: currentWeather.tcc,
        precipitation: currentWeather.tp,
        lastUpdate: new Date(currentWeather.local_datetime).toLocaleString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }),
        icon: currentWeather.image
      }
    };

    cache.set("weatherData", result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));