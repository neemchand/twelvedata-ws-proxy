const WebSocket = require('ws');

// Example client that connects to the proxy server
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('Connected to Twelve Data WebSocket Proxy');
    
    // Subscribe to some popular stocks
    const subscribeMessage = {
        action: 'subscribe',
        params: {
            symbols: 'AAPL,GOOGL,MSFT,TSLA'
        }
    };
    
    ws.send(JSON.stringify(subscribeMessage));
    console.log('Subscribed to: AAPL, GOOGL, MSFT, TSLA');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        if (message.event === 'price') {
            console.log(`${message.symbol}: $${message.price} (${new Date(message.timestamp * 1000).toLocaleTimeString()})`);
        } else {
            console.log('Other message:', message);
        }
    } catch (error) {
        console.error('Error parsing message:', error);
    }
});

ws.on('close', () => {
    console.log('Disconnected from proxy server');
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nClosing connection...');
    ws.close();
    process.exit(0);
});
