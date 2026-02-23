// === DOM Elements ===
const apiKeyModal = document.getElementById('api-key-modal');
const appContainer = document.getElementById('app-container');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const changeKeyBtn = document.getElementById('change-key-btn');

const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Chatbox Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');

let chatHistory = [
    {
        role: "user",
        parts: [{ text: "Hãy đóng vai Thư Kí Hoàn Vũ, một thư ký AI phân tích chứng khoán chuyên nghiệp tại Việt Nam. Tên người dùng là Thưởng Vương Đức. Khi được hỏi bạn là ai, hãy trả lời bạn là Thư Kí Hoàn Vũ. Trả lời các câu hỏi ngắn gọn, súc tích, logic và dễ hiểu." }],
    },
    {
        role: "model",
        parts: [{ text: "Đã hiểu." }]
    }
];

let hasInitializedGreeting = false;
// Dashboard Elements
const refreshDashboardBtn = document.getElementById('refresh-dashboard-btn');
const dashboardResult = document.getElementById('dashboard-result');

// News Scanner Elements
const refreshNewsBtn = document.getElementById('refresh-news-btn');
const newsResult = document.getElementById('news-result');

// Sector Elements
const sectorInput = document.getElementById('sector-input');
const analyzeSectorBtn = document.getElementById('analyze-sector-btn');
const suggestionBtns = document.querySelectorAll('.suggestion-btn:not(.stock-sector-btn)');
const sectorResult = document.getElementById('sector-result');

// Stock Elements
const stockInput = document.getElementById('stock-input');
const analyzeStockBtn = document.getElementById('analyze-stock-btn');
const stockResult = document.getElementById('stock-result');
const stockSectorBtns = document.querySelectorAll('.stock-sector-btn');
const stockTickerSuggestions = document.getElementById('stock-ticker-suggestions');


// === State Management ===
const DEFAULT_KEYS = [
    'AIzaSyBeKlie0I7-ad6mmMle9UeEJ8P1TKvZ0Ws',
    'AIzaSyC3KKbzOglKcZ6KEWyAS9pX-Ui8qIP5fNM',
    'AIzaSyDuKKeUUbDp5RnONmqHM-clJk3T5ABkjEM',
    'AIzaSyAfhOHq6x-PGzqU7VCgOlXR1tXAsFw8-Wc'
];
let currentKeyIndex = 0;
let userApiKey = localStorage.getItem('gemini_api_key') || '';

function getActiveKey() {
    return userApiKey || DEFAULT_KEYS[currentKeyIndex];
}

function rotateKey() {
    if (!userApiKey) {
        currentKeyIndex = (currentKeyIndex + 1) % DEFAULT_KEYS.length;
        console.log("Đổi sang API key dự phòng số " + (currentKeyIndex + 1));
        return true;
    }
    return false;
}

// === Initialize App ===
function init(forceStart = false) {
    if (!userApiKey && !forceStart) {
        apiKeyModal.classList.remove('hidden');
        appContainer.classList.add('hidden');
    } else {
        apiKeyModal.classList.add('hidden');
        appContainer.classList.remove('hidden');
        loadDashboard(); // Load dashboard cache if available

        if (!hasInitializedGreeting) {
            initChatGreeting();
            hasInitializedGreeting = true;
        }
    }
}

// === Event Listeners ===

// API Key Management
const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        init(true); // Ignore modal, use default keys
    });
}

saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        userApiKey = key;
        localStorage.setItem('gemini_api_key', key);
        init();
    } else {
        alert('Vui lòng nhập API Key hợp lệ.');
    }
});

changeKeyBtn.addEventListener('click', () => {
    apiKeyInput.value = userApiKey; // Pre-fill
    localStorage.removeItem('gemini_api_key');
    userApiKey = '';
    init(); // show modal again
});

// Navigation (Tabs)
navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        navBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));

        // Add active class to clicked
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

// Feature Triggers
refreshDashboardBtn.addEventListener('click', () => {
    generateDashboardReport(true); // Force refresh (Phân tích ngay lúc bấm)
});

refreshNewsBtn.addEventListener('click', () => {
    scanNews(true); // Always force refresh when button is clicked or check cache
});

// Chatbox
chatSendBtn.addEventListener('click', handleChatSend);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSend();
    }
});

chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Sector Suggestions
suggestionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sectorInput.value = btn.innerText;
        analyzeSectorBtn.click();
    });
});

// Nested Stock Suggestions
const stockMap = {
    'Ngân hàng': ['VCB', 'BID', 'CTG', 'TCB', 'MBB', 'VPB'],
    'Chứng khoán': ['SSI', 'VND', 'VCI', 'HCM', 'SHS', 'MBS'],
    'Bất động sản': ['VHM', 'NVL', 'DIG', 'DXG', 'KDH', 'NLG'],
    'Thép': ['HPG', 'HSG', 'NKG', 'TLH', 'SMC', 'POM'],
    'Bán lẻ': ['MWG', 'PNJ', 'FRT', 'DGW', 'PET', 'HAX'],
    'Dầu khí': ['GAS', 'PVD', 'PVS', 'BSR', 'PLX', 'OIL'],
    'Công nghệ': ['FPT', 'CMG', 'ELC', 'ITD', 'SAM', 'SGT'],
    'Đầu tư công': ['VCG', 'HHV', 'LCG', 'C4G', 'FCN', 'KSB']
};

stockSectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const sector = btn.innerText;
        const stocks = stockMap[sector];

        // Clear old suggestions
        const oldBtns = stockTickerSuggestions.querySelectorAll('button');
        oldBtns.forEach(b => b.remove());

        // Add new suggestions
        stocks.forEach(ticker => {
            const stockBtn = document.createElement('button');
            stockBtn.className = 'suggestion-btn glass-panel';
            stockBtn.innerText = ticker;
            stockBtn.addEventListener('click', () => {
                stockInput.value = ticker;
                analyzeStockBtn.click();
            });
            stockTickerSuggestions.appendChild(stockBtn);
        });

        stockTickerSuggestions.classList.remove('hidden');
    });
});

analyzeSectorBtn.addEventListener('click', () => {
    const sector = sectorInput.value.trim();
    if (sector) {
        analyzeSector(sector);
    } else {
        alert('Vui lòng nhập tên ngành.');
    }
});

sectorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeSectorBtn.click();
});

analyzeStockBtn.addEventListener('click', () => {
    const stock = stockInput.value.trim().toUpperCase();
    if (stock) {
        analyzeStock(stock);
    } else {
        alert('Vui lòng nhập mã cổ phiếu.');
    }
});

stockInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyzeStockBtn.click();
});


// === Core Gemini API Function ===
async function callGeminiAPI(promptText, isRetry = false) {
    const apiKey = getActiveKey();
    if (!apiKey) {
        alert("Thiếu API Key!");
        init();
        return null;
    }

    showLoading(true);

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }],
                generationConfig: {
                    temperature: 0.2, // Low temp for analytical consistency
                }
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                if (!isRetry && rotateKey()) {
                    console.log("Hết quota, thử lại với key mới...");
                    return await callGeminiAPI(promptText, true);
                } else {
                    throw new Error("Tất cả key dự phòng đều hết hạn mức hoặc lỗi truy cập.");
                }
            }
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Lỗi khi gọi Gemini API");
        }

        const data = await response.json();

        showLoading(false);
        // Extract markdown text from response
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        showLoading(false);
        console.error("API Error:", error);
        alert(`Lỗi: ${error.message}`);
        return null;
    }
}

// === Utility Functions ===
function showLoading(show, text = "AI đang phân tích dữ liệu...") {
    if (show) {
        loadingText.innerText = text;
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

function getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

async function fetchMarketSnapshot() {
    const today = new Date().toLocaleDateString('vi-VN');
    return `Hôm nay là ngày ${today}. Hãy sử dụng những kiến thức gần đây nhất của bạn về bối cảnh kinh tế toàn cầu để phân tích.`;
}

// === Feature Implementations ===
// === Chatbox Logic ===
async function initChatGreeting() {
    chatMessages.innerHTML = ''; // Clear board
    const loadingId = appendChatLoading();

    try {
        const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=21.0245&longitude=105.8412&current_weather=true&hourly=temperature_2m,precipitation_probability&timezone=Asia%2FBangkok");
        const weatherData = await weatherRes.json();

        const temp = weatherData.current_weather.temperature;

        const hourIndex = new Date().getHours();
        const next4HoursTemps = weatherData.hourly.temperature_2m.slice(hourIndex, hourIndex + 4);
        const next4HoursRain = weatherData.hourly.precipitation_probability.slice(hourIndex, hourIndex + 4);

        const maxRainProb = Math.max(...next4HoursRain);
        const willRain = maxRainProb > 30 ? `Có khả năng mưa (${maxRainProb}%)` : "Trời khô ráo, không mưa";

        const now = new Date();
        // Format time in GMT+7
        const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Bangkok' });

        const greetingPrompt = `Người dùng tên là Thưởng Vương Đức. 
Hiện tại là ${timeStr} ngày ${dateStr} (GMT+7).
Thời tiết ở Hà Nội hiện tại: ${temp}°C. ${willRain}.
Dự báo 4h tới: Nhiệt độ khoảng ${next4HoursTemps.join(', ')} °C.

Hãy viết MỘT câu chào mừng đóng vai Thư Kí Hoàn Vũ gửi cho người dùng. 
Bao gồm đủ các ý sau nhưng viết GỌN GÀNG, TỰ NHIÊN, hiện đại (Markdown formatting):
1. Chào Thưởng Vương Đức, báo giờ và ngày hiện tại (GMT+7).
2. Tóm tắt thời tiết Hà Nội hiện tại: nhiệt độ, có mưa không, gợi ý mặc gì (ví dụ: áo ấm, áo khoác mỏng, mang ô che mưa...).
3. Dự báo sơ bộ 4 tiếng tới.
4. Lời chúc 1 ngày đầu tư thành công / giao dịch hiệu quả.
5. Câu hỏi kết: Tôi có thể giúp gì cho bạn hôm nay?`;

        const responseText = await callChatGeminiAPI([{ role: "user", parts: [{ text: greetingPrompt }] }]);

        document.getElementById(loadingId)?.remove();

        if (responseText) {
            chatHistory.push({ role: "model", parts: [{ text: responseText }] });
            appendChatMessage(responseText, 'bot');
        } else {
            fallbackGreeting();
        }
    } catch (e) {
        console.error("Lỗi khởi tạo greeting:", e);
        document.getElementById(loadingId)?.remove();
        fallbackGreeting();
    }
}

function fallbackGreeting() {
    const text = "Xin chào **Thưởng Vương Đức**! Chúc bạn một ngày đầu tư thành công. Tôi có thể phân tích cổ phiếu hay vĩ mô gì cho bạn hôm nay?";
    chatHistory.push({ role: "model", parts: [{ text }] });
    appendChatMessage(text, 'bot');
}

async function handleChatSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendChatMessage(text, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    chatHistory.push({ role: "user", parts: [{ text }] });

    const loadingId = appendChatLoading();

    const responseText = await callChatGeminiAPI(chatHistory);

    document.getElementById(loadingId)?.remove();

    if (responseText) {
        chatHistory.push({ role: "model", parts: [{ text: responseText }] });
        appendChatMessage(responseText, 'bot');
    } else {
        appendChatMessage("Xin lỗi, đã có lỗi xảy ra. Hãy kiểm tra kết nối và thử lại.", 'bot');
        chatHistory.pop(); // Revert user message from history on fail
    }
}

function appendChatMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    // Add avatar label
    const avatarLabel = document.createElement('div');
    avatarLabel.className = 'message-avatar';
    avatarLabel.innerText = sender === 'bot' ? 'Thư Kí Hoàn Vũ' : 'Bạn';
    msgDiv.appendChild(avatarLabel);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content markdown-body';

    if (sender === 'bot') {
        contentDiv.innerHTML = marked.parse(text);
    } else {
        contentDiv.innerText = text; // Plain text cho tin nhắn của user
    }

    msgDiv.appendChild(contentDiv);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendChatLoading() {
    const id = 'loading-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = `message bot`;
    msgDiv.id = id;

    const avatarLabel = document.createElement('div');
    avatarLabel.className = 'message-avatar';
    avatarLabel.innerText = 'Thư Kí Hoàn Vũ';
    msgDiv.appendChild(avatarLabel);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<span class="skeleton-text">Phân tích thông tin...</span>';
    msgDiv.appendChild(contentDiv);

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

async function callChatGeminiAPI(history, isRetry = false) {
    const apiKey = getActiveKey();
    if (!apiKey) {
        alert("Thiếu API Key!");
        init();
        return null;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: history,
                generationConfig: {
                    temperature: 0.7,
                }
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                if (!isRetry && rotateKey()) {
                    console.log("Hết quota, thử lại chat với key mới...");
                    return await callChatGeminiAPI(history, true);
                }
            }
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Lỗi khi gọi Gemini API");
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
}

async function loadDashboard() {
    const today = getTodayString();
    const cacheKey = `macro_report_${today}`;
    const cachedReport = localStorage.getItem(cacheKey);

    if (cachedReport) {
        dashboardResult.innerHTML = marked.parse(cachedReport);
    } else {
        // Optional: Auto fetch on first load of the day, or wait for user click. 
        // We will wait for user click to save API calls, but the prompt asked: "Kiểm tra localStorage có macro_report_YYYY-MM-DD chưa. Nếu có → hiển thị. Nếu chưa → fetch 5–10 tin tức + snapshot thị trường rồi gửi Gemini."
        // We will auto generate if not cached.
        generateDashboardReport(false);
    }
}

async function generateDashboardReport(forceRefresh = false) {
    const today = getTodayString();
    const cacheKey = `macro_report_${today}`;

    if (!forceRefresh) {
        const cachedReport = localStorage.getItem(cacheKey);
        if (cachedReport) {
            dashboardResult.innerHTML = marked.parse(cachedReport);
            return;
        }
    }

    showLoading(true, "Đang phân tích vĩ mô...");

    const snapshot = await fetchMarketSnapshot();
    const prompt = `Bạn là giáo sư kinh tế chuyên phân tích chu kỳ thị trường Việt Nam.

Dựa trên dữ liệu sau:
${snapshot}

Hãy tạo báo cáo vĩ mô thị trường chứng khoán hôm nay gồm đúng 7 phần sau (viết bằng Markdown rõ ràng).
YÊU CẦU ĐẶC BIỆT VỀ ĐỊNH DẠNG:
- Với các phần 1, 2, 5, 6, 7: BẠN BẮT BUỘC PHẢI BAO QUANH CHÚNG BẰNG THẺ HTML <details> và <summary> ĐỂ CÓ THỂ ĐÓNG MỞ ĐƯỢC MỖI KHI CLICK. (Không sử dụng Markdown Header ## cho các mục này nữa, mà bỏ tiêu đề vào thẻ summary).
Ví dụ:
<details><summary>1. Tóm tắt bối cảnh</summary>
Nội dung phân tích...
</details>

- Với mục 3 và 4: Giữ nguyên tiêu đề Markdown thông thường (## 3. Nhóm ngành tích cực hoặc tương tự), hiển thị bung ra đàng hoàng. Bắt buộc: Hãy bao quanh tên các nhóm ngành tích cực nhất bằng thẻ HTML: <span class="highlight-sector">Tên Ngành</span> thay vì in đậm bình thường, ví dụ: <span class="highlight-sector">Ngân hàng</span>.

Nội dung 7 phần:
1. Tóm tắt bối cảnh
2. Rủi ro hệ thống (Đánh giá từ 1–5 điểm)
3. Nhóm ngành tích cực trong 1–3 tháng tới
4. Đề xuất 5 mã cổ phiếu đáng chú ý (điều kiện bắt buộc: giá thị trường hiện tại thường <= 60.000 VND)
5. Nhóm ngành cần thận trọng
6. Chiến lược gợi ý
7. Tự phản biện (Những giả định nào có thể sai trong nhận định này)

Viết chuyên sâu, logic, khách quan, không chung chung. Không khuyến nghị mua bán cụ thể. Đảm bảo mã HTML do bạn sinh ra phải chính xác thẻ <details> và rỗng.`;

    const resultMarkdown = await callGeminiAPI(prompt);

    if (resultMarkdown) {
        localStorage.setItem(cacheKey, resultMarkdown);
        dashboardResult.innerHTML = marked.parse(resultMarkdown);
    }
}

// === NEWS SCANNER ===
async function fetchRSS(url) {
    try {
        // Using allorigins as a simple CORS proxy to fetch XML, then we parse it.
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, "text/xml");

        const items = xmlDoc.querySelectorAll("item");
        let newsList = [];

        // Take top 5 from each feed
        for (let i = 0; i < Math.min(items.length, 5); i++) {
            const title = items[i].querySelector("title")?.textContent || "";
            const description = items[i].querySelector("description")?.textContent || "";
            const link = items[i].querySelector("link")?.textContent || "";

            // Strip HTML from description
            const cleanDesc = description.replace(/<[^>]*>?/gm, '').trim();

            newsList.push(`- Tiêu đề: ${title}\n  Tóm tắt: ${cleanDesc}\n  Link: ${link}`);
        }
        return newsList;
    } catch (e) {
        console.warn(`Lỗi khi fetch RSS từ ${url}:`, e);
        return [];
    }
}

async function scanNews(force = false) {
    const today = getTodayString();
    const cacheKey = `news_scan_${today}`;

    if (!force) {
        const cachedNews = localStorage.getItem(cacheKey);
        if (cachedNews) {
            newsResult.innerHTML = marked.parse(cachedNews);
            return;
        }
    }

    showLoading(true, "Đang quét tin RSS...");

    // Fetch RSS from basic financial sources (these are public standard feeds)
    const rssSources = [
        "https://vneconomy.vn/thi-truong.rss",
        "https://vietstock.vn/rss/chung-khoan.vi",
        "https://cafef.vn/thi-truong-chung-khoan.rss"
    ];

    let allNews = [];
    for (const source of rssSources) {
        const items = await fetchRSS(source);
        allNews = allNews.concat(items);
    }

    if (allNews.length === 0) {
        showLoading(false);
        newsResult.innerHTML = `<p class="empty-state">Không thể lấy được tin tức RSS. Vui lòng thử lại sau.</p>`;
        return;
    }

    const newsListString = allNews.slice(0, 15).join('\n\n'); // Limit to top 15

    const prompt = `Nâng cấp web app AI phân tích thị trường Việt Nam (chạy 100% frontend trên GitHub Pages) với tính năng rà soát tin tức kinh tế – chính trị quốc tế hàng ngày.

Bạn là chuyên gia phân tích vĩ mô toàn cầu.

Dưới đây là danh sách các tin tức hôm nay từ báo tài chính Việt Nam:

${newsListString}

Dựa vào danh sách trên, hãy xử lý theo đúng yêu cầu sau (viết bằng Markdown):

1. Xác định tin nào liên quan đến:
   - Kinh tế toàn cầu
   - Chính trị quốc tế
   - Lãi suất FED
   - Trung Quốc
   - Chiến tranh
   - Giá dầu
   - USD
   - Dòng vốn ngoại

2. Với MỖI TIN liên quan được lọc ra ở phần (1), hãy đánh giá mức độ ảnh hưởng đến thị trường chứng khoán Việt Nam theo các mức: Thấp, Trung bình, Cao.
Bắt buộc sử dụng format Blockquote của Markdown để gán id đặc biệt (KHÔNG VIẾT CHỮ THEO ĐỊNH DẠNG CODE HOẶC CURLY BRACKETS), ví dụ hãy gõ như sau ở đầu quote:
> TÍN HIỆU RỦI RO CAO: ...
> TÍN HIỆU RỦI RO TRUNG BÌNH: ...
> TÍN HIỆU RỦI RO THẤP: ...

3. Giải thích ngắn gọn vì sao bạn đánh giá mức ảnh hưởng đó cho mỗi tin. Đừng quên CUNG CẤP LINK gốc của bài viết đó ở phía dưới sự giải thích.

4. Phần Tổng Kết: Nếu có rủi ro hệ thống tiềm ẩn gộp lại từ các tin trên, hãy đưa ra một Cảnh báo riêng bằng cách in đậm và bôi đỏ.`;

    const resultMarkdown = await callGeminiAPI(prompt);

    if (resultMarkdown) {
        localStorage.setItem(cacheKey, resultMarkdown);
        renderNewsMarkdown(resultMarkdown);
    } else {
        showLoading(false);
    }
}

function renderNewsMarkdown(markdownStr) {
    const htmlStr = marked.parse(markdownStr);
    newsResult.innerHTML = htmlStr;

    // Apply risk classes dynamically based on text directly without weird markdown artifacts
    const blockquotes = newsResult.querySelectorAll('blockquote');
    blockquotes.forEach(bq => {
        if (bq.innerText.includes('TÍN HIỆU RỦI RO CAO') || bq.innerText.includes('RỦI RO CAO')) {
            bq.classList.add('risk-high');
        } else if (bq.innerText.includes('TÍN HIỆU RỦI RO TRUNG BÌNH') || bq.innerText.includes('RỦI RO TRUNG BÌNH')) {
            bq.classList.add('risk-medium');
        } else if (bq.innerText.includes('TÍN HIỆU RỦI RO THẤP') || bq.innerText.includes('RỦI RO THẤP')) {
            bq.classList.add('risk-low');
        }
    });
}


async function analyzeSector(sectorName) {
    const prompt = `Bạn là giáo sư kinh tế chuyên phân tích chu kỳ thị trường Việt Nam kết hợp phân tích ngành.

Hãy phân tích ngành "${sectorName}" trong khung thời gian 1–3 tháng tới theo cấu trúc sau (viết bằng Markdown):

1. Ngành "${sectorName}" đang ở pha nào của chu kỳ kinh tế/kinh doanh?
2. Động lực tăng trưởng ngắn hạn là gì?
3. Rủi ro chính của ngành trong thời gian tới?
4. Đề xuất 5 cổ phiếu tiêu biểu trong ngành (điều kiện bắt buộc: mức giá thị trường hiện tại thường <= 60.000 VND). Nêu ngắn gọn luận điểm cho từng mã.
5. Tự phản biện: Điều gì có thể khiến ngành này diễn biến tồi tệ hơn/hoặc tốt hơn nhận định trên?

Phân tích logic, không cảm tính.`;

    const resultMarkdown = await callGeminiAPI(prompt);

    if (resultMarkdown) {
        sectorResult.innerHTML = marked.parse(resultMarkdown);
        sectorResult.classList.remove('hidden');
    }
}

async function analyzeStock(ticker) {
    const prompt = `Bạn là giáo sư kinh tế chuyên phân tích chu kỳ thị trường Việt Nam kết hợp phân tích ngành và cổ phiếu.

Hãy thực hiện phân tích cổ phiếu mã "${ticker}" trong khung 1–3 tháng tới theo yêu cầu sau (viết bằng Markdown):

1. VỊ THẾ CỔ PHIẾU TRONG CHU KỲ VĨ MÔ
- Ngành của cổ phiếu đang hưởng lợi hay chịu áp lực?
- Mức độ nhạy cảm với thanh khoản thị trường?
- Có phù hợp môi trường tiền tệ hiện tại không?

2. ĐÁNH GIÁ CỔ PHIẾU
- Lợi thế cạnh tranh
- Yếu tố có thể kích hoạt sóng 1–3 tháng
- Cổ phiếu này phù hợp đầu tư trung hạn hay trading ngắn hạn?

3. ĐÁNH GIÁ XÁC SUẤT TÍCH CỰC (Điểm từ 1–5)
Hãy giải thích vì sao đưa ra điểm số này.

4. KỊCH BẢN DIỄN BIẾN
- Kịch bản tích cực
- Kịch bản trung tính
- Kịch bản tiêu cực

5. CHIẾN LƯỢC TIẾP CẬN VÀ RỦI RO
- Rủi ro lớn nhất là gì?
- Nên chờ tín hiệu gì để xác nhận xu hướng?

6. TỰ PHẢN BIỆN
- Giả định nào trong phân tích này có thể sai?
- Tín hiệu thị trường nào sẽ phủ định các nhận định trên?

YÊU CẦU ĐẶC BIỆT: 
- Nếu ${ticker} là một cổ phiếu lớn có thị giá phổ biến trên 60.000 VND (Ví dụ: VCB, FPT, MWG, SAB, VNM...), hãy BẮT BUỘC in đậm một dòng CẢNH BÁO ở ngay đầu bài phân tích: "> **CẢNH BÁO: Cổ phiếu này có thị giá > 60.000 VND, không phù hợp với tiêu chí lọc giá <= 60.000 VND của hệ thống.**" (Dùng blockquote của Markdown). Sau đó vẫn tiến hành phân tích bình thường.
- Phân tích logic, không cảm tính. Nhấn mạnh xác suất.`;

    const resultMarkdown = await callGeminiAPI(prompt);

    if (resultMarkdown) {
        stockResult.innerHTML = marked.parse(resultMarkdown);
        stockResult.classList.remove('hidden');
    }
}

// Start App
init();
