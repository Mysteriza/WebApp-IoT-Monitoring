# IoT Monitoring - Indoor & Outdoor Weather Dashboard

![GitHub last commit](https://img.shields.io/github/last-commit/Mysteriza/WebApp-IoT-Monitoring)

A real-time, web-based monitoring system featuring a dual-tab interface for **Indoor** and **Outdoor** conditions. The indoor dashboard displays temperature, humidity, and gas levels from an ESP8266 (with BME280 & MQ-135 sensors) integrated with Blynk. The outdoor dashboard fetches and displays live weather data from the **BMKG (Indonesian Agency for Meteorology, Climatology, and Geophysics)**.

This dashboard provides a futuristic UI with a glass effect for a comprehensive monitoring experience.

## [Arduino Code | ESP8266 + BME280 + MQ-135 + Blynk](https://github.com/Mysteriza/BME280-MQ135-Blynk-Monitoring)

---

## Features
- **Dual Monitoring Tabs 📑**: Seamlessly switch between **Indoor** sensor readings and **Outdoor** weather data.
- **Indoor Real-Time Data 📡**: Displays temperature, humidity, pressure, altitude, raw gas, compensated gas (ppm), and air quality status.
- **Live Outdoor Weather 🌦️**: Fetches and displays current weather conditions, temperature, humidity, cloud coverage, wind speed & direction, and visibility from the official BMKG API.
- **Hourly Weather Forecast 🕒**: Provides an hourly weather forecast for the upcoming hours, including temperature and weather conditions.
- **Dynamic Colors 🎨**: Colors change based on sensor values for quick and easy interpretation.
- **Responsive Design 📱**: Works perfectly on desktop, tablet, and mobile devices.
- **Last Updated Timestamp ⏱️**: Shows the exact last refresh time for the active tab.
- **Manual Refresh Button 🔄**: Instantly fetch new data with a single click.
- **Glass Effect UI 🪞**: Futuristic glass cards with blur effects for a modern and clean look.

---

## Screenshots
<img width="1899" height="804" alt="image" src="https://github.com/user-attachments/assets/8232d483-b694-429e-9a8f-f9f12bb3a1d8" />
<img width="1920" height="1227" alt="image" src="https://github.com/user-attachments/assets/b8da6503-3b6c-4a52-911e-6387ab6b2bee" />

---

## Installation

Follow these steps to set up the IoT Monitoring dashboard on your local machine or deploy it to Vercel.

### Prerequisites
- **Node.js** (v20.x recommended): [Download Node.js](https://nodejs.org/)
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Vercel Account** (for deployment): [Sign up for Vercel](https://vercel.com/signup)
- **Blynk Account**: Set up your Blynk project and get the `BLYNK_AUTH_TOKEN`.

### Steps
1. Clone this repository to your local machine:
   ```
   git clone https://github.com/Mysteriza/WebApp-IoT-Monitoring.git && cd WebApp-IoT-Monitoring
   ```

2. Install Dependencies
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your Blynk auth token:
   ```
   BLYNK_AUTH_TOKEN=your_blynk_auth_token
   ```

4. **Run Locally**
   Start the development server:
   ```
   npm run dev
   ```
   Open http://localhost:3000 in your browser to see the dashboard.
