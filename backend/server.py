from flask import Flask, request, jsonify
from flask_cors import CORS
from pytrends.request import TrendReq
import time
import datetime

app = Flask(__name__)
CORS(app)

# Cache dictionary to avoid rate limits
# Format: { "symbol_months": { "data": dict, "timestamp": float } }
CACHE = {}
CACHE_TTL = 3 * 3600  # 3 hours in seconds

def get_pytrends_data(kw_list, timeframe):
    """Lấy dữ liệu từ Google Trends, có retry để giảm thiểu lỗi Rate Limit (429)"""
    pytrends = TrendReq(hl='vi-VN', tz=-420) # Múi giờ VN
    
    # Retry mechanism
    max_retries = 3
    for attempt in range(max_retries):
        try:
            pytrends.build_payload(kw_list, cat=0, timeframe=timeframe, geo='VN', gprop='')
            interest_df = pytrends.interest_over_time()
            related_queries = pytrends.related_queries()
            return interest_df, related_queries
        except Exception as e:
            msg = str(e)
            print(f"Lỗi Pytrends (Lần {attempt+1}/{max_retries}): {msg}")
            
            if "429" in msg or "Rate Limit" in msg:
                if attempt < max_retries - 1:
                    time.sleep((attempt + 1) * 2) # Backoff
                else:
                    raise Exception("Google Trends đang chặn kết nối (Rate Limit). Vui lòng thử lại sau vài giờ.")
            else:
                raise e
    
    return None, None

@app.route('/api/trends', methods=['GET'])
def get_trends():
    symbol = request.args.get('symbol', '').strip().upper()
    months = request.args.get('months', '4')
    
    if not symbol:
        return jsonify({"error": "Thiếu mã cổ phiếu (symbol)"}), 400
        
    try:
        months_int = int(months)
    except ValueError:
        months_int = 4

    # Keyword to search
    kw = f"Cổ phiếu {symbol}"
    if symbol in ["VNINDEX", "VN-INDEX"]:
        kw = "VNINDEX"
        
    cache_key = f"{symbol}_{months_int}"
    now = time.time()
    
    # Check cache
    if cache_key in CACHE:
        cached_item = CACHE[cache_key]
        if now - cached_item['timestamp'] < CACHE_TTL:
            print(f"Returning cached data for {cache_key}")
            return jsonify(cached_item['data'])
            
    try:
        # Calculate timeframe e.g. "today 4-m"
        timeframe = f"today {months_int}-m"
        
        interest_df, related_queries = get_pytrends_data([kw], timeframe)
        
        # 1. Process Interest Over Time
        interest_data = []
        trend_direction = "sideways"
        
        if interest_df is not None and not interest_df.empty and kw in interest_df.columns:
            # Drop isPartial column if exists
            if 'isPartial' in interest_df.columns:
                interest_df = interest_df.drop(columns=['isPartial'])
                
            # Convert index to string dates and values to list
            for idx, row in interest_df.iterrows():
                interest_data.append({
                    "date": idx.strftime('%Y-%m-%d'),
                    "value": int(row[kw])
                })
                
            # Basic trend calculation: Compare first half average to second half average
            vals = [item["value"] for item in interest_data]
            if len(vals) > 10:
                mid = len(vals) // 2
                first_half_avg = sum(vals[:mid]) / mid
                second_half_avg = sum(vals[mid:]) / (len(vals) - mid)
                
                # If there's a > 15% difference
                if second_half_avg > first_half_avg * 1.15:
                    trend_direction = "up"
                elif second_half_avg < first_half_avg * 0.85:
                    trend_direction = "down"

        # 2. Process Related Queries (Rising)
        rising_keywords = []
        if related_queries and kw in related_queries:
            rising_df = related_queries.get(kw, {}).get('rising', None)
            if rising_df is not None and not rising_df.empty:
                # Get top 5
                top_5 = rising_df.head(5)
                for _, row in top_5.iterrows():
                    rising_keywords.append({
                        "query": row['query'],
                        "value": int(row['value'])
                    })

        # Final Response Data
        response_data = {
            "symbol": symbol,
            "keyword": kw,
            "interest_data": interest_data,
            "rising_keywords": rising_keywords,
            "trend_direction": trend_direction
        }
        
        # Save to cache
        CACHE[cache_key] = response_data
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error processing trends: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Chạy ở port 5000 cục bộ
    print("Starting Trends API Server on http://127.0.0.1:5000")
    app.run(host='127.0.0.1', port=5000, debug=True)
