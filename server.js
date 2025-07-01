const { validateConfig } = require('./src/config');
const TwelveDataConnection = require('./src/TwelveDataConnection');
const ProxyServer = require('./src/ProxyServer');
const HealthCheck = require('./src/HealthCheck');

validateConfig();

const twelveDataConnection = new TwelveDataConnection();
const proxyServer = new ProxyServer(twelveDataConnection);
const healthCheck = new HealthCheck(twelveDataConnection, proxyServer);

twelveDataConnection.connect();

process.on('SIGINT', () => {
    console.log('\n[Proxy] Shutting down gracefully...');
    healthCheck.close();
    twelveDataConnection.close();
    proxyServer.close();
    process.exit(0);
});