require("dotenv").config({ path: ".env.local" });
const express = require("express");
const fetch = require("node-fetch");
const https = require("https");

const app = express();
const BLYNK_SERVER = "blynk.cloud";
const TOKEN = process.env.BLYNK_AUTH_TOKEN;

// Keep-alive agent to reuse TLS connection
const agent = new https.Agent({ keepAlive: true });

app.use(express.static("public"));
app.use(express.json());

// Single call for all pins (V0,V1,V5,V6,V7,V8,V9)
app.get("/api/blynk", async (_req, res) => {
  try {
    if (!TOKEN) throw new Error("BLYNK_AUTH_TOKEN is not defined");

    // OPTION A: getAll (simple)
    // const url = `https://${BLYNK_SERVER}/external/api/getAll?token=${TOKEN}`;

    // OPTION B: get multiple (explicit pins)
    const url = `https://${BLYNK_SERVER}/external/api/get?token=${TOKEN}&V0&V1&V5&V6&V7&V8&V9`;

    const r = await fetch(url, { agent });
    if (!r.ok) throw new Error(`Blynk get failed: ${r.status}`);
    const j = await r.json(); // e.g. { "V0": 27.3, "V1": 60.1, ... }

    const parse = (x, f=0)=> (x===null||x===undefined||x==="null"||x==="undefined"||Number.isNaN(parseFloat(x))) ? f : parseFloat(x);

    const data = {
      temperature:      parse(j.V0),
      humidity:         parse(j.V1),
      rawGas:           parse(j.V5),
      compensatedGas:   parse(j.V6),         // IAQ index (bukan ppm)
      airQualityStatus: j.V7 || "--",
      pressure:         parse(j.V8, 1013.25),
      altitude:         parse(j.V9, 0)
    };

    if (data.pressure < 800 || data.pressure > 1200) data.pressure = 1013.25;
    if (data.altitude < -100 || data.altitude > 9000) data.altitude = 0;

    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message, details: "Failed to fetch sensor data" });
  }
});

const BMKG_API_URL = "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=32.73.14.1002";
app.get("/api/bmkg", async (_req, res) => {
  try {
    const r = await fetch(BMKG_API_URL, { agent });
    if (!r.ok) throw new Error(`BMKG error: ${r.status}`);
    res.json(await r.json());
  } catch (e) {
    res.status(500).json({ error: e.message, details: "Failed to fetch weather data from BMKG" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
