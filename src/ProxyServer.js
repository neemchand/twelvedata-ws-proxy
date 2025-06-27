const WebSocket = require('ws');
const { CONFIG } = require('./config');

class ProxyServer {
    constructor(twelveDataConnection) {
        this.twelveDataConnection = twelveDataConnection;
        this.connectedClients = new Set();
        this.wss = new WebSocket.Server({ port: CONFIG.WS_PORT }, () => {
            console.log(`[Proxy] Client WebSocket Server listening on ws://localhost:${CONFIG.WS_PORT}`);
        });
        this.setupConnectionHandler();
    }

    setupConnectionHandler() {
        this.wss.on('connection', (clientWs) => {
            console.log('[Proxy] Client connected.');
            this.connectedClients.add(clientWs);

            const clientSpecificSymbols = new Set();

            clientWs.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    if (data.action === 'subscribe' && data.params && data.params.symbols) {
                        this.handleSubscribe(data.params.symbols, clientWs, clientSpecificSymbols);
                    } else if (data.action === 'unsubscribe' && data.params && data.params.symbols) {
                        this.handleUnsubscribe(data.params.symbols, clientWs, clientSpecificSymbols);
                    } else {
                        console.warn('[Proxy] Unknown message from client:', data);
                    }
                } catch (e) {
                    console.error('[Proxy] Error parsing client message:', e, message.toString());
                }
            });

            clientWs.on('close', () => this.handleClientDisconnect(clientWs, clientSpecificSymbols));
            clientWs.onerror = (error) => console.error('[Proxy] Client error:', error.message);
        });
    }

    handleSubscribe(symbolsString, clientWs, clientSpecificSymbols) {
        const symbolsToSubscribe = symbolsString.split(',').map(s => s.trim()).filter(Boolean);

        symbolsToSubscribe.forEach(symbol => {
            clientSpecificSymbols.add(symbol);
            this.twelveDataConnection.addClientSubscription(symbol, clientWs);

            if (!this.twelveDataConnection.subscribedSymbols.has(symbol)) {
                this.twelveDataConnection.subscribe(symbol);
            }
        });
    }

    handleUnsubscribe(symbolsString, clientWs, clientSpecificSymbols) {
        const symbolsToUnsubscribe = symbolsString.split(',').map(s => s.trim()).filter(Boolean);

        symbolsToUnsubscribe.forEach(symbol => {
            clientSpecificSymbols.delete(symbol);
            const shouldUnsubscribe = this.twelveDataConnection.removeClientSubscription(symbol, clientWs);
            if (shouldUnsubscribe) {
                this.twelveDataConnection.unsubscribe(symbol);
            }
        });
    }

    handleClientDisconnect(clientWs, clientSpecificSymbols) {
        console.log('[Proxy] Client disconnected.');
        this.connectedClients.delete(clientWs);

        clientSpecificSymbols.forEach(symbol => {
            const shouldUnsubscribe = this.twelveDataConnection.removeClientSubscription(symbol, clientWs);
            if (shouldUnsubscribe) {
                this.twelveDataConnection.unsubscribe(symbol);
            }
        });
        clientSpecificSymbols.clear();
    }

    close() {
        this.wss.close(() => {
            console.log('[Proxy] Client WebSocket Server closed.');
        });
    }
}

module.exports = ProxyServer;
