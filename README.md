# 📈 Twelve Data WebSocket Proxy

A high-performance Node.js WebSocket proxy server that connects to Twelve Data's real-time stock price API and provides a clean, scalable interface for multiple clients to subscribe to live financial market data.

## ⚠️ Important Disclaimer

**This is an independent, open-source project and is NOT affiliated with, endorsed by, or officially connected to Twelve Data in any way.**

- 🔑 **API Key Required**: You must obtain your own [Twelve Data API key](https://twelvedata.com/pricing)
- 📋 **Terms Compliance**: You must comply with [Twelve Data's Terms of Service](https://twelvedata.com/terms)
- 🚦 **Rate Limits**: Respect API rate limits and usage policies
- 💼 **Commercial Use**: Commercial usage subject to Twelve Data's licensing terms

## 🙏 Credits to Twelve Data

This project is built using the excellent APIs and documentation provided by:

- **[Twelve Data](https://twelvedata.com)** - Premium financial market data provider
- **[API Documentation](https://twelvedata.com/docs)** - Comprehensive API reference
- **[WebSocket API Guide](https://twelvedata.com/docs#websocket)** - Real-time data streaming documentation

*We extend our gratitude to Twelve Data for providing accessible financial market data APIs that make projects like this possible.*

## Features

- **Real-time Stock Data**: Connects to Twelve Data's WebSocket API for live stock prices
- **Multi-client Support**: Multiple clients can connect and subscribe to different symbols
- **Smart Subscription Management**: Automatically manages subscriptions to avoid duplicate requests
- **Auto-reconnection**: Robust connection handling with automatic reconnection on failures
- **Heartbeat Monitoring**: Keeps connections alive with periodic heartbeat messages
- **Graceful Shutdown**: Properly closes connections and cleans up resources

## Architecture

The project is structured into modular components:

- **`server.js`**: Main entry point and application orchestration
- **`src/config.js`**: Configuration management and validation
- **`src/TwelveDataConnection.js`**: Handles connection to Twelve Data WebSocket API
- **`src/ProxyServer.js`**: Manages client connections and message routing

## 📋 Prerequisites

### Required
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **Twelve Data API Key** - [Get your free key](https://twelvedata.com/pricing)

### Getting Your Twelve Data API Key
1. Visit [Twelve Data](https://twelvedata.com)
2. Sign up for a free account
3. Choose your plan (free tier available)
4. Copy your API key from the dashboard
5. Review the [API documentation](https://twelvedata.com/docs) for usage guidelines

> 💡 **Tip**: Start with the free tier to test the proxy, then upgrade based on your needs.

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/twelvedata-ws-proxy.git
cd twelvedata-ws-proxy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env  # or use your preferred editor
```

### 4. Add Your Twelve Data API Key
Edit the `.env` file:
```env
# Your Twelve Data API key (required)
TWELVEDATA_API_KEY=your_actual_api_key_here

# WebSocket server port (optional, defaults to 8080)
WS_PORT=8080
```

> ⚠️ **Security Note**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

## Usage

### Starting the Server

```bash
npm start
```

The server will start and listen for WebSocket connections on the configured port (default: 8080).

### Connecting Clients

Connect to the WebSocket server using any WebSocket client:

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('Connected to proxy server');
    
    // Subscribe to stock symbols
    ws.send(JSON.stringify({
        action: 'subscribe',
        params: { symbols: 'AAPL,GOOGL,MSFT' }
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received price update:', data);
};
```

### API Messages

#### Subscribe to Symbols
```json
{
    "action": "subscribe",
    "params": {
        "symbols": "AAPL,GOOGL,MSFT"
    }
}
```

#### Unsubscribe from Symbols
```json
{
    "action": "unsubscribe",
    "params": {
        "symbols": "AAPL,GOOGL"
    }
}
```

#### Price Update Response
```json
{
    "event": "price",
    "symbol": "AAPL",
    "currency_base": "USD",
    "currency_quote": "USD",
    "exchange": "NASDAQ",
    "type": "Common Stock",
    "timestamp": 1640995200,
    "price": 182.01,
    "bid": 181.99,
    "ask": 182.03,
    "day_volume": 59773884
}
```

## Configuration

Environment variables can be set in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `TWELVEDATA_API_KEY` | Your Twelve Data API key | Required |
| `WS_PORT` | Port for the WebSocket server | 8080 |

## Development

### Project Structure
```
├── server.js              # Main application entry point
├── src/
│   ├── config.js          # Configuration and validation
│   ├── TwelveDataConnection.js  # Twelve Data WebSocket client
│   └── ProxyServer.js     # Client connection manager
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Running in Development Mode

```bash
npm run dev
```

This will start the server with automatic restart on file changes (requires nodemon).

## Error Handling

The proxy handles various error scenarios:

- **Connection failures**: Automatic reconnection with exponential backoff
- **Invalid messages**: Graceful error logging without crashing
- **Client disconnections**: Automatic cleanup of subscriptions
- **API rate limits**: Proper error reporting and connection management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits and Acknowledgments

### 📊 Data Provider - Twelve Data
We are grateful to **[Twelve Data](https://twelvedata.com)** for providing:
- 🔥 **High-quality financial market data APIs**
- 📚 **Comprehensive documentation** at [twelvedata.com/docs](https://twelvedata.com/docs)
- 🔌 **WebSocket API** for real-time data streaming
- 🆓 **Free tier access** for developers and small projects
- 💼 **Professional-grade** financial data infrastructure

*This project would not be possible without Twelve Data's excellent API services and documentation.*

### 🛠️ Open Source Libraries
- **[ws](https://github.com/websockets/ws)** - Lightning-fast WebSocket implementation for Node.js
- **[dotenv](https://github.com/motdotla/dotenv)** - Zero-dependency environment variable loader

## ⚖️ Legal and Compliance

### License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

### Disclaimer and Terms
- 🚫 **Not affiliated**: This is an independent project, NOT affiliated with Twelve Data
- 🔑 **API Key Required**: You must obtain your own Twelve Data API key
- 📋 **Compliance**: Users must follow [Twelve Data's Terms of Service](https://twelvedata.com/terms)
- 🚦 **Rate Limits**: Respect API usage limits and policies
- 💼 **Commercial Use**: Subject to Twelve Data's licensing terms
- ⚠️ **No Warranty**: Software provided "as is" without warranty

### Intellectual Property
- **Twelve Data** name, logo, and API are property of Twelve Data
- This project provides a proxy interface to their publicly available services
- All financial data is sourced from and owned by Twelve Data

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines
- Ensure compliance with Twelve Data's terms
- Add tests for new features
- Update documentation as needed
- Follow existing code style

---

**Made with ❤️ for the developer community | Powered by [Twelve Data](https://twelvedata.com) APIs**
