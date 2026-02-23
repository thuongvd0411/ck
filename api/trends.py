from flask import Flask, request, jsonify
from flask_cors import CORS
from pytrends.request import TrendReq
import time

app = Flask(__name__)
CORS(app)

# Cache dictionary to avoid rate limits
CACHE = {}
CACHE_TTL = 3 * 3600  # 3 hours in seconds

def get_pytrends_data(kw_list, timeframe):
    """Lấy dữ liệu từ Google Trends, có retry để giảm thiểu lỗi Rate Limit (429)"""
    # Sử dụng User-Agent phổ biến để tránh bị Google chặn ngay lập tức trên Vercel
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    
    pytrends = TrendReq(hl='vi-VN', tz=-420, requests_args={'headers': headers}) # Múi giờ VN
    
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
                    # Chờ lâu hơn một chút (3s -> 6s)
                    time.sleep((attempt + 1) * 3) 
                else:
                    raise Exception("Google Trends đang chặn kết nối (Rate Limit). Vui lòng thử lại sau vài giờ.")
            else:
                raise e
    
    return None, None

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET'])
def get_trends(path):
    symbol = request.args.get('symbol', '').strip().upper()
    months = request.args.get('months', '4')
    
    if not symbol:
        return jsonify({"error": "Thiếu mã cổ phiếu (symbol)"}), 400
        
    try:
        months_int = int(months)
    except ValueError:
        months_int = 4

    kw = f"Cổ phiếu {symbol}"
    if symbol in ["VNINDEX", "VN-INDEX"]:
        kw = "VNINDEX"
        
    cache_key = f"{symbol}_{months_int}"
    now = time.time()
    
    # Check cache (Note: in Vercel Serverless, memory cache only persists per-instance and may clear often, but it helps during traffic spikes)
    if cache_key in CACHE:
        cached_item = CACHE[cache_key]
        if now - cached_item['timestamp'] < CACHE_TTL:
            return jsonify(cached_item['data'])
            
    try:
        timeframe = f"today {months_int}-m"
        interest_df, related_queries = get_pytrends_data([kw], timeframe)
        
        interest_data = []
        trend_direction = "sideways"
        
        if interest_df is not None and not interest_df.empty and kw in interest_df.columns:
            if 'isPartial' in interest_df.columns:
                interest_df = interest_df.drop(columns=['isPartial'])
                
            for idx, row in interest_df.iterrows():
                interest_data.append({
                    "date": idx.strftime('%Y-%m-%d'),
                    "value": int(row[kw])
                })
                
            vals = [item["value"] for item in interest_data]
            if len(vals) > 10:
                mid = len(vals) // 2
                first_half_avg = sum(vals[:mid]) / mid
                second_half_avg = sum(vals[mid:]) / (len(vals) - mid)
                
                if second_half_avg > first_half_avg * 1.15:
                    trend_direction = "up"
                elif second_half_avg < first_half_avg * 0.85:
                    trend_direction = "down"

        rising_keywords = []
        if related_queries and kw in related_queries:
            rising_df = related_queries.get(kw, {}).get('rising', None)
            if rising_df is not None and not rising_df.empty:
                top_5 = rising_df.head(5)
                for _, row in top_5.iterrows():
                    rising_keywords.append({
                        "query": row['query'],
                        "value": int(row['value'])
                    })

        response_data = {
            "symbol": symbol,
            "keyword": kw,
            "interest_data": interest_data,
            "rising_keywords": rising_keywords,
            "trend_direction": trend_direction
        }
        
        CACHE[cache_key] = {
            "data": response_data,
            "timestamp": now
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error processing trends: {e}")
        return jsonify({"error": str(e)}), 500

# Entry point for Vercel
# Vercel's @vercel/python uses the `app` variable from the specified file.
