require('dotenv').config();

const CONFIG = {
    API_KEY: process.env.TWELVEDATA_API_KEY,
    WS_PORT: process.env.WS_PORT || 8080,
    WS_URL: `wss://ws.twelvedata.com/v1/quotes/price?apikey=${process.env.TWELVEDATA_API_KEY}`,
    MAX_RECONNECT_ATTEMPTS: 10,
    RECONNECT_INTERVAL_MS: 5000,
    HEARTBEAT_INTERVAL_MS: 10000
};

function validateConfig() {
    if (!CONFIG.API_KEY) {
        console.error("Error: TWELVEDATA_API_KEY is not set in .env file.");
        process.exit(1);
    }
}

module.exports = { CONFIG, validateConfig };
