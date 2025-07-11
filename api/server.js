require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fetch = require("node-fetch");
const NodeCache = require("node-cache");

const app = express();
const cache = new NodeCache({ stdTTL: 1200 }); // Cache for 20 minutes

const BLYNK_SERVER = "blynk.cloud";
const BLYNK_AUTH_TOKEN = process.env.BLYNK_AUTH_TOKEN;
const PINS = ["V0", "V1", "V5", "V6", "V7"]; // Temperature, Humidity, Gas Raw, Gas Compensated, Air Quality

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
    // Check cache first
    const cachedData = cache.get("weatherData");
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await fetch("https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=32.73.14.1002"); //For location: Cikutra, Cibeunying Kidul, Bandung Indonesia
    if (!response.ok) throw new Error("Failed to fetch from BMKG API");
    
    const data = await response.json();
    const currentWeather = data.data[0].cuaca[0][0]; // Get current weather (first item)
    const forecast = data.data[0].cuaca[0].slice(0, 4); // Get next 4 forecast items

    // Format response
    const result = {
      current: {
        temperature: currentWeather.t,
        humidity: currentWeather.hu,
        condition: currentWeather.weather_desc,
        windSpeed: currentWeather.ws,
        lastUpdate: new Date().toLocaleString()
      },
      forecast: forecast.map(item => {
        const time = new Date(item.local_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let icon, iconColor;
        
        if (item.weather_desc.includes("Hujan")) {
          icon = "fas fa-cloud-rain";
          iconColor = "text-blue-400";
        } else if (item.weather_desc.includes("Cerah")) {
          icon = "fas fa-sun";
          iconColor = "text-yellow-400";
        } else if (item.weather_desc.includes("Berawan")) {
          icon = "fas fa-cloud";
          iconColor = "text-gray-400";
        } else {
          icon = "fas fa-cloud";
          iconColor = "text-gray-300";
        }

        return {
          time,
          temperature: item.t,
          condition: item.weather_desc,
          icon,
          iconColor
        };
      })
    };

    // Cache the data
    cache.set("weatherData", result);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));