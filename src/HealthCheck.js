/**
 * Health Check HTTP Server
 * Provides a simple HTTP endpoint to monitor server status
 */

const http = require('http');
const { CONFIG } = require('./config');

class HealthCheck {
    constructor(twelveDataConnection, proxyServer) {
        this.twelveDataConnection = twelveDataConnection;
        this.proxyServer = proxyServer;
        this.startTime = Date.now();
        this.server = null;
        this.port = CONFIG.HEALTH_CHECK_PORT;
        
        this.createServer();
    }

    createServer() {
        this.server = http.createServer((req, res) => {
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Content-Type', 'application/json');

            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // Only allow GET requests
            if (req.method !== 'GET') {
                res.writeHead(405, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Method not allowed' }));
                return;
            }

            // Route handling
            const url = req.url;
            
            if (url === '/health' || url === '/') {
                this.handleHealthCheck(res);
            } else if (url === '/status') {
                this.handleDetailedStatus(res);
            } else if (url === '/metrics') {
                this.handleMetrics(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });

        this.server.listen(this.port, () => {
            console.log(`[Health] Health check server listening on http://localhost:${this.port}`);
            console.log(`[Health] Available endpoints:`);
            console.log(`[Health]   GET http://localhost:${this.port}/health - Basic health check`);
            console.log(`[Health]   GET http://localhost:${this.port}/status - Detailed status`);
            console.log(`[Health]   GET http://localhost:${this.port}/metrics - System metrics`);
        });

        this.server.on('error', (error) => {
            console.error(`[Health] Server error:`, error.message);
        });
    }

    handleHealthCheck(res) {
        const isHealthy = this.isSystemHealthy();
        const statusCode = isHealthy ? 200 : 503;
        
        const response = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: this.getUptime(),
            version: '1.0.0'
        };

        res.writeHead(statusCode);
        res.end(JSON.stringify(response, null, 2));
    }

    handleDetailedStatus(res) {
        const twelveDataStatus = this.getTwelveDataStatus();
        const proxyStatus = this.getProxyStatus();
        const isHealthy = this.isSystemHealthy();
        
        const response = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: this.getUptime(),
            services: {
                twelveData: twelveDataStatus,
                proxy: proxyStatus
            },
            system: {
                memory: this.getMemoryUsage(),
                nodeVersion: process.version,
                platform: process.platform
            }
        };

        const statusCode = isHealthy ? 200 : 503;
        res.writeHead(statusCode);
        res.end(JSON.stringify(response, null, 2));
    }

    handleMetrics(res) {
        const metrics = {
            timestamp: new Date().toISOString(),
            uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
            connected_clients: this.proxyServer.connectedClients.size,
            subscribed_symbols: this.twelveDataConnection.subscribedSymbols.size,
            twelve_data_connected: this.twelveDataConnection.isConnected(),
            memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
            heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        };

        res.writeHead(200);
        res.end(JSON.stringify(metrics, null, 2));
    }

    isSystemHealthy() {
        // System is healthy if:
        // 1. Twelve Data connection is established OR we're in the process of connecting
        // 2. Proxy server is running (WebSocket server is listening)
        // 3. No critical errors

        const twelveDataOk = this.twelveDataConnection.isConnected() ||
                           this.twelveDataConnection.isConnecting();
        const wss = this.proxyServer.wss;
        const proxyOk = wss && wss._server && wss._server.listening;

        return twelveDataOk && proxyOk;
    }

    getTwelveDataStatus() {
        const connection = this.twelveDataConnection;
        
        return {
            connected: connection.isConnected(),
            connecting: connection.isConnecting(),
            subscribedSymbols: Array.from(connection.subscribedSymbols),
            symbolCount: connection.subscribedSymbols.size,
            lastHeartbeat: connection.lastHeartbeat ? new Date(connection.lastHeartbeat).toISOString() : null
        };
    }

    getProxyStatus() {
        const wss = this.proxyServer.wss;
        const isListening = wss && wss._server && wss._server.listening;

        return {
            listening: isListening,
            port: CONFIG.WS_PORT,
            connectedClients: this.proxyServer.connectedClients.size,
            clientList: Array.from(this.proxyServer.connectedClients).map((ws, index) => ({
                id: index + 1,
                readyState: ws.readyState,
                readyStateText: this.getWebSocketStateText(ws.readyState)
            }))
        };
    }

    getWebSocketStateText(readyState) {
        const states = {
            0: 'CONNECTING',
            1: 'OPEN',
            2: 'CLOSING',
            3: 'CLOSED'
        };
        return states[readyState] || 'UNKNOWN';
    }

    getUptime() {
        const uptimeMs = Date.now() - this.startTime;
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss_mb: Math.round(usage.rss / 1024 / 1024),
            heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
            heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
            external_mb: Math.round(usage.external / 1024 / 1024)
        };
    }

    close() {
        if (this.server) {
            this.server.close(() => {
                console.log('[Health] Health check server closed.');
            });
        }
    }
}

module.exports = HealthCheck;
