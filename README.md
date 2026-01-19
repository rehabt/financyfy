# Financyfied Dashboard - yfinance Web App

A comprehensive web application for tracking market data, trending stocks, and financial insights using the yfinance library.

## Features

- 📈 **Real-time Market Data**: View live stock prices and market indices
- 🔥 **Trending Stocks**: Track the most active and trending stocks
- 📊 **Interactive Charts**: Visualize stock performance with interactive charts
- 💾 **Data Export**: Export market data to CSV and JSON formats
- 🔍 **Stock Search**: Search and analyze any stock ticker
- 📉 **Historical Data**: View historical price data and trends
- 🌐 **Market Indices**: Track major market indices (S&P 500, NASDAQ, DOW)
- 📰 **Company Info**: View detailed company information and fundamentals

## Installation

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and navigate to:
```
http://localhost:5000
```

## API Endpoints

- `GET /api/trending` - Get trending stocks
- `GET /api/indices` - Get major market indices
- `GET /api/stock/<ticker>` - Get stock information
- `GET /api/stock/<ticker>/history` - Get historical data
- `GET /api/stock/<ticker>/export/<format>` - Export data (csv/json)
- `GET /api/search/<query>` - Search for stocks

## Technologies Used

- **Backend**: Python, Flask
- **Data Source**: yfinance
- **Frontend**: HTML5, CSS3, JavaScript
- **Charts**: Chart.js
- **Data Processing**: Pandas, NumPy

## License

MIT License
