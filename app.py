from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import io
import json
import os

app = Flask(__name__, static_folder='dist/yfinance-angular/browser', static_url_path='')
CORS(app)

# List of popular tickers for trending stocks
TRENDING_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'NFLX', 'DIS']
MARKET_INDICES = {
    '^GSPC': 'S&P 500',
    '^DJI': 'Dow Jones',
    '^IXIC': 'NASDAQ',
    '^RUT': 'Russell 2000'
}

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    """Serve Angular app for all routes"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/trending', methods=['GET'])
def get_trending():
    """Get trending stocks with current price and change"""
    try:
        trending_data = []
        
        for ticker in TRENDING_TICKERS:
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                hist = stock.history(period='2d')
                
                if len(hist) >= 2:
                    current_price = hist['Close'].iloc[-1]
                    previous_close = hist['Close'].iloc[-2]
                    change = current_price - previous_close
                    change_percent = (change / previous_close) * 100
                else:
                    current_price = info.get('currentPrice', 0)
                    previous_close = info.get('previousClose', current_price)
                    change = current_price - previous_close
                    change_percent = (change / previous_close) * 100 if previous_close else 0
                
                trending_data.append({
                    'ticker': ticker,
                    'name': info.get('longName', ticker),
                    'price': round(current_price, 2),
                    'change': round(change, 2),
                    'changePercent': round(change_percent, 2),
                    'volume': info.get('volume', 0),
                    'marketCap': info.get('marketCap', 0)
                })
            except Exception as e:
                print(f"Error fetching {ticker}: {str(e)}")
                continue
        
        return jsonify(trending_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/indices', methods=['GET'])
def get_indices():
    """Get major market indices"""
    try:
        indices_data = []
        
        for symbol, name in MARKET_INDICES.items():
            try:
                index = yf.Ticker(symbol)
                hist = index.history(period='2d')
                
                if len(hist) >= 2:
                    current_price = hist['Close'].iloc[-1]
                    previous_close = hist['Close'].iloc[-2]
                    change = current_price - previous_close
                    change_percent = (change / previous_close) * 100
                    
                    indices_data.append({
                        'symbol': symbol,
                        'name': name,
                        'price': round(current_price, 2),
                        'change': round(change, 2),
                        'changePercent': round(change_percent, 2)
                    })
            except Exception as e:
                print(f"Error fetching {symbol}: {str(e)}")
                continue
        
        return jsonify(indices_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_info(ticker):
    """Get detailed stock information"""
    try:
        stock = yf.Ticker(ticker.upper())
        info = stock.info
        
        # Get current price from history if not available in info
        hist = stock.history(period='1d')
        current_price = hist['Close'].iloc[-1] if len(hist) > 0 else info.get('currentPrice', 0)
        
        stock_data = {
            'ticker': ticker.upper(),
            'name': info.get('longName', ticker),
            'sector': info.get('sector', 'N/A'),
            'industry': info.get('industry', 'N/A'),
            'currentPrice': round(current_price, 2),
            'previousClose': info.get('previousClose', 0),
            'open': info.get('open', 0),
            'dayHigh': info.get('dayHigh', 0),
            'dayLow': info.get('dayLow', 0),
            'volume': info.get('volume', 0),
            'marketCap': info.get('marketCap', 0),
            'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', 0),
            'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', 0),
            'dividendYield': info.get('dividendYield', 0),
            'peRatio': info.get('trailingPE', 0),
            'beta': info.get('beta', 0),
            'description': info.get('longBusinessSummary', 'No description available')
        }
        
        return jsonify(stock_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/stock/<ticker>/history', methods=['GET'])
def get_stock_history(ticker):
    """Get historical stock data"""
    try:
        period = request.args.get('period', '1mo')  # 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max
        interval = request.args.get('interval', '1d')  # 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
        
        stock = yf.Ticker(ticker.upper())
        hist = stock.history(period=period, interval=interval)
        
        dates = []
        prices = []
        ohlc = []
        
        for index, row in hist.iterrows():
            dates.append(index.strftime('%Y-%m-%d'))
            prices.append(round(row['Close'], 2))
            ohlc.append({
                'x': index.strftime('%Y-%m-%d'),
                'o': round(row['Open'], 2),
                'h': round(row['High'], 2),
                'l': round(row['Low'], 2),
                'c': round(row['Close'], 2)
            })
        
        return jsonify({
            'dates': dates,
            'prices': prices,
            'ohlc': ohlc
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock/<ticker>/export/<format>', methods=['GET'])
def export_stock_data(ticker, format):
    """Export stock data in CSV or JSON format"""
    try:
        period = request.args.get('period', '1y')
        stock = yf.Ticker(ticker.upper())
        hist = stock.history(period=period)
        
        if format.lower() == 'csv':
            # Create CSV in memory
            output = io.StringIO()
            hist.to_csv(output)
            output.seek(0)
            
            return send_file(
                io.BytesIO(output.getvalue().encode()),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'{ticker.upper()}_data.csv'
            )
        
        elif format.lower() == 'json':
            # Convert to JSON
            data = hist.reset_index().to_dict(orient='records')
            for item in data:
                if 'Date' in item:
                    item['Date'] = item['Date'].strftime('%Y-%m-%d %H:%M:%S')
            
            return send_file(
                io.BytesIO(json.dumps(data, indent=2).encode()),
                mimetype='application/json',
                as_attachment=True,
                download_name=f'{ticker.upper()}_data.json'
            )
        
        else:
            return jsonify({'error': 'Invalid format. Use csv or json'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search/<query>', methods=['GET'])
def search_stock(query):
    """Search for stock ticker"""
    try:
        # Try to get stock info for the query
        stock = yf.Ticker(query.upper())
        info = stock.info
        
        if 'symbol' in info or 'longName' in info:
            return jsonify({
                'found': True,
                'ticker': query.upper(),
                'name': info.get('longName', query.upper()),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A')
            })
        else:
            return jsonify({'found': False})
    
    except Exception as e:
        return jsonify({'found': False, 'error': str(e)})

@app.route('/api/gainers-losers', methods=['GET'])
def get_gainers_losers():
    """Get top gainers and losers from trending stocks"""
    try:
        stocks_data = []
        
        for ticker in TRENDING_TICKERS:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period='2d')
                info = stock.info
                
                if len(hist) >= 2:
                    current_price = hist['Close'].iloc[-1]
                    previous_close = hist['Close'].iloc[-2]
                    change_percent = ((current_price - previous_close) / previous_close) * 100
                    
                    stocks_data.append({
                        'ticker': ticker,
                        'name': info.get('longName', ticker),
                        'price': round(current_price, 2),
                        'changePercent': round(change_percent, 2)
                    })
            except Exception as e:
                continue
        
        # Sort by change percent
        stocks_data.sort(key=lambda x: x['changePercent'], reverse=True)
        
        gainers = stocks_data[:5]
        losers = sorted(stocks_data, key=lambda x: x['changePercent'])[:5]
        
        return jsonify({
            'gainers': gainers,
            'losers': losers
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
