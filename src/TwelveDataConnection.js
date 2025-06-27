const WebSocket = require('ws');
const { CONFIG } = require('./config');

class TwelveDataConnection {
    constructor() {
        this.ws = null;
        this.heartbeatInterval = null;
        this.reconnectTimeout = null;
        this.reconnectAttempts = 0;
        this.subscribedSymbols = new Set();
        this.symbolClientMap = new Map();
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            console.log('[TD-WS] Already connected or connecting.');
            return;
        }

        console.log(`[TD-WS] Attempting to connect to Twelve Data: ${CONFIG.WS_URL}`);
        this.ws = new WebSocket(CONFIG.WS_URL);

        this.ws.onopen = () => {
            console.log('[TD-WS] Connection opened.');
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.resubscribeToSymbols();
        };

        this.ws.onmessage = (message) => this.handleMessage(message);
        this.ws.onerror = (error) => console.error('[TD-WS] Error:', error.message);
        this.ws.onclose = (event) => this.handleClose(event);
    }

    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.heartbeatInterval = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ action: 'heartbeat' }));
            }
        }, CONFIG.HEARTBEAT_INTERVAL_MS);
    }

    resubscribeToSymbols() {
        if (this.subscribedSymbols.size > 0) {
            const symbolsToResubscribe = Array.from(this.subscribedSymbols).join(',');
            const subscribeMessage = {
                action: 'subscribe',
                params: { symbols: symbolsToResubscribe }
            };
            this.ws.send(JSON.stringify(subscribeMessage));
            console.log(`[TD-WS] Re-subscribed to: ${symbolsToResubscribe}`);
        }
    }

    handleMessage(message) {
        try {
            const data = JSON.parse(message.data);
            if (data.event === 'price') {
                this.forwardPriceUpdate(data);
            } else if (data.event === 'subscribe-status') {
                console.log('[TD-WS] Subscribe Status:', data);
            } else {
                console.log('[TD-WS] Other message:', data);
            }
        } catch (e) {
            console.error('[TD-WS] Error parsing message:', e, message.data);
        }
    }

    forwardPriceUpdate(data) {
        const symbol = data.symbol;
        if (this.symbolClientMap.has(symbol)) {
            this.symbolClientMap.get(symbol).forEach(clientWs => {
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify(data));
                }
            });
        }
    }

    handleClose(event) {
        console.log(`[TD-WS] Connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (!event.wasClean && this.reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
            this.reconnectAttempts++;
            console.log(`[TD-WS] Attempting reconnect ${this.reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS} in ${CONFIG.RECONNECT_INTERVAL_MS / 1000}s...`);
            this.reconnectTimeout = setTimeout(() => this.connect(), CONFIG.RECONNECT_INTERVAL_MS);
        } else if (this.reconnectAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
            console.error('[TD-WS] Max reconnection attempts reached. Giving up.');
        } else {
            console.log('[TD-WS] Connection closed cleanly. Not reconnecting.');
        }
    }

    subscribe(symbol) {
        if (!this.subscribedSymbols.has(symbol)) {
            this.subscribedSymbols.add(symbol);
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ action: 'subscribe', params: { symbols: symbol } }));
                console.log(`[Proxy] Sent SUBSCRIBE to Twelve Data for: ${symbol}`);
            }
        }
    }

    unsubscribe(symbol) {
        if (this.subscribedSymbols.has(symbol)) {
            this.subscribedSymbols.delete(symbol);
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ action: 'unsubscribe', params: { symbols: symbol } }));
                console.log(`[Proxy] Sent UNSUBSCRIBE to Twelve Data for: ${symbol}`);
            }
        }
    }

    addClientSubscription(symbol, clientWs) {
        if (!this.symbolClientMap.has(symbol)) {
            this.symbolClientMap.set(symbol, new Set());
        }
        this.symbolClientMap.get(symbol).add(clientWs);
    }

    removeClientSubscription(symbol, clientWs) {
        if (this.symbolClientMap.has(symbol)) {
            this.symbolClientMap.get(symbol).delete(clientWs);
            if (this.symbolClientMap.get(symbol).size === 0) {
                this.symbolClientMap.delete(symbol);
                return true;
            }
        }
        return false;
    }

    close() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        }
    }
}

module.exports = TwelveDataConnection;
