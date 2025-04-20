require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fetch = require("node-fetch");

const app = express();
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
