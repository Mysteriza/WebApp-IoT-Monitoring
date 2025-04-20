# IoT Monitoring - Temperature, Humidity & Gas (MQ-135 Sensor)

![GitHub last commit](https://img.shields.io/github/last-commit/Mysteriza/WebApp-IoT-Monitoring)

A simple real-time web-based monitoring system for temperature, humidity, and gas levels, collected from an ESP8266 with a DHT22 and MQ-135 sensor, integrated with Blynk. This dashboard provides a futuristic UI with a glass effect for monitoring room conditions.

## [Arduino Code | ESP8266 + DHT22 + Blynk](https://github.com/Mysteriza/DHT22-Blynk-Monitoring)

---

## Features
- **Real-Time Monitoring 📡**: Displays temperature, humidity, raw gas, compensated gas, and air quality status in real-time.
- **Dynamic Colors 🎨**: Colors change based on temperature, humidity, and air quality levels for easy interpretation.
- **Responsive Design 📱**: Works seamlessly on desktop, tablet, and mobile devices.
- **Last Updated Timestamp ⏱**: Shows the exact last refresh time (including seconds).
- **Manual Refresh Button 🔄**: Instantly fetch new data with a single click.
- **Smooth UI Animations ✨**: Uses CSS transitions for a better user experience.
- **Glass Effect UI 🪞**: Futuristic glass cards with blur effects for a modern look.

---

## Screenshots
<img src="https://github.com/user-attachments/assets/55aff42b-0946-42b4-a7d8-eb14e87b2a76" />

---

## Installation

Follow these steps to set up the IoT Monitoring dashboard on your local machine or deploy it to Vercel.

### Prerequisites
- **Node.js** (v20.x recommended): [Download Node.js](https://nodejs.org/)
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Vercel Account** (for deployment): [Sign up for Vercel](https://vercel.com/signup)
- **Blynk Account**: Set up your Blynk project and get the `BLYNK_AUTH_TOKEN`.

### Steps
1. **Clone the Repository**  
   Clone this repository to your local machine:
   ```bash
   git clone https://github.com/Mysteriza/WebApp-IoT-Monitoring.git && cd WebApp-IoT-Monitoring
   ```
2. **Install Dependencies**
   ```
   npm install
   ```
3. **Set Up Environment Variables**
   Create a .env.local file in the root directory and add your Blynk auth token:
   ```
   BLYNK_AUTH_TOKEN=your_blynk_auth_token
   ```
4. **Run Locally**
   Start the development server:
   ```
   npm run dev
   ```
   Open http://localhost:3000 in your browser to see the dashboard.
