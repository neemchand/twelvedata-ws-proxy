const { validateConfig } = require('./src/config');
const TwelveDataConnection = require('./src/TwelveDataConnection');
const ProxyServer = require('./src/ProxyServer');

validateConfig();

const twelveDataConnection = new TwelveDataConnection();
const proxyServer = new ProxyServer(twelveDataConnection);

twelveDataConnection.connect();

process.on('SIGINT', () => {
    console.log('\n[Proxy] Shutting down gracefully...');
    twelveDataConnection.close();
    proxyServer.close();
    process.exit(0);
});