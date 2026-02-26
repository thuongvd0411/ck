// === DOM Elements ===
const apiKeyModal = document.getElementById('api-key-modal');
const appContainer = document.getElementById('app-container');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const changeKeyBtn = document.getElementById('change-key-btn');
const autoRotateKeyBtn = document.getElementById('auto-rotate-key-btn');

const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Chatbox Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const loadHistoryBtn = document.getElementById('load-history-btn');

// Profile Elements
const profileRisk = document.querySelectorAll('input[name="profile-risk"]');
const profileTime = document.querySelectorAll('input[name="profile-time"]');
const profileStyle = document.querySelectorAll('input[name="profile-style"]');
const saveProfileBtn = document.getElementById('save-profile-btn');
const clearProfileBtn = document.getElementById('clear-profile-btn');

// State Management: Chat History Constants
const STRICT_SYSTEM_PROMPT = `Hãy đóng vai AI Trợ Lý Đầu Tư Cá Nhân chuyên phân tích chứng khoán Việt Nam. Bạn phân tích khách quan, không hô hào PR, tuyệt đối không dùng văn phong chung chung.

TUYỆT ĐỐI KHÔNG CHÀO HỎI, KHÔNG DẪN DẮT (ví dụ: "Chào bạn", "Tôi sẽ...", "Dưới đây là..."). HÃY ĐI THẲNG VÀO KẾT QUẢ THEO ĐÚNG ĐỊNH DẠNG.

ĐẶC BIỆT KHI NGƯỜI DÙNG YÊU CẦU PHÂN TÍCH VỀ 1 MÃ CỔ PHIẾU/TÀI SẢN BẤT KỲ, BẠN BẮT BUỘC PHẢI DÙNG FORMAT PHÂN TÍCH SWING 1-3 THÁNG NHƯ SAU:

--------------------------------------------------
**[TÊN MÃ CỔ PHIẾU]**
--------------------------------------------------

🔎 Thuộc nhóm:
- Ngành chính:
- Hưởng lợi từ câu chuyện nào:
- Có tính chu kỳ hay phòng thủ:

🎯 Đặc điểm cổ phiếu:
- Largecap / Midcap / Penny:
- Beta cao hay thấp:
- Thường chạy theo sóng gì:
- Mức độ biến động:

📊 Về kỹ thuật (đặc tính lịch sử):
- Có hay tạo nền tích lũy dài không:
- Thường breakout kiểu nào:
- Có hay bull trap không:
- Phù hợp đánh breakout hay đánh nền:

🧠 Đánh giá 1–3 tháng:
✔ Có thể chạy nếu:
- (Liệt kê điều kiện cụ thể)

❗ Rủi ro:
- (Liệt kê rủi ro thực tế, không chung chung)

📈 Phong cách phù hợp:
- Swing 1–3 tháng / Trading ngắn / Giữ trung hạn:
- Phù hợp người chịu rủi ro cao hay thấp:

⚖ Kết luận xác suất:
- Đánh giá tiềm năng 1–5:
- Giải thích logic vì sao chấm điểm đó:
--------------------------------------------------

KHI NGƯỜI DÙNG YÊU CẦU SO SÁNH 2 HAY NHIỀU MÃ CỔ PHIẾU BẤT KỲ, BẠN BẮT BUỘC TRẢ LỜI ĐÚNG THEO MẪU SAU (TRÌNH BÀY DƯỚI DẠNG BẢNG MARKDOWN DỄ NHÌN):

📊 So sánh nhanh

| Tiêu chí | [Mã 1] | [Mã 2] |
|---|---|---|
| Nhóm ngành | | |
| Độ rủi ro | | |
| Tính đầu cơ | | |
| Khả năng chạy sóng | | |
| Phù hợp ai | | |

🎯 Kết luận thẳng:
- Nếu muốn đánh nhanh – biên lớn ➔ [Mã]
- Nếu muốn cân bằng rủi ro ➔ [Mã]
- Nêu tuỳ chọn nhận định tuỳ thuộc vào câu hỏi.

Lưu ý: Nếu giá > 60.000 VND thì thông báo cảnh báo không phù hợp tiêu chí lọc giá.`;

let chatHistory = JSON.parse(localStorage.getItem('ai_stock_chat_history')) || [
    { role: "user", parts: [{ text: STRICT_SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Đã hiểu, tôi sẽ BẤT DI BẤT DỊCH tuân thủ chính xác format và KHÔNG CHÀO HỎI khi phân tích." }] }
];

// State Management: User Profile
let userProfile = JSON.parse(localStorage.getItem('ai_stock_user_profile')) || {
    risk: [],
    time: [],
    style: []
};

// Dashboard Elements
const refreshDashboardBtn = document.getElementById('refresh-dashboard-btn');
const dashboardResult = document.getElementById('dashboard-result');

// News Scanner Elements
const refreshNewsBtn = document.getElementById('refresh-news-btn');
const newsResult = document.getElementById('news-result');

// Sector Elements (Legacy, check to avoid null ref)
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
const _k = [
    "QUl6YVN5QVVubThsVV9ramF1eWpCb3R4bTBFcks3V3BGMW1GSXhB",
    "QUl6YVN5QkdKTlN3QmNJWExwc3dOOTVGS0R1eGR3d2xlUHl0cjlB",
    "QUl6YVN5QUs1LVZVblpORXQ1aUhHMGJYd1A4ZGd2aDRPczM2N2VN"
];
let currentKeyIndex = 0;
let userApiKey = localStorage.getItem('gemini_api_key') || '';

function getActiveKey() {
    return userApiKey || atob(_k[currentKeyIndex]);
}

function rotateKey() {
    if (!userApiKey) {
        currentKeyIndex = (currentKeyIndex + 1) % _k.length;
        console.log("Đổi sang API key dự phòng số " + (currentKeyIndex + 1));
        return true;
    }
    return false;
}

// === Initialize App ===
function init(forceModal = false) {
    if (forceModal) {
        apiKeyModal.classList.remove('hidden');
        appContainer.classList.add('hidden');
    } else {
        apiKeyModal.classList.add('hidden');
        appContainer.classList.remove('hidden');

        // Force rule enforcement: Always overwrite the first 2 system messages
        chatHistory[0] = { role: "user", parts: [{ text: STRICT_SYSTEM_PROMPT }] };
        chatHistory[1] = { role: "model", parts: [{ text: "Đã hiểu, tôi sẽ BẤT DI BẤT DỊCH tuân thủ chính xác format và KHÔNG CHÀO HỎI khi phân tích." }] };

        loadProfileToUI();
        loadDashboard(); // Load dashboard cache if available

        // Check if there is history (more than 2 default messages)
        if (chatHistory.length > 2) {
            loadHistoryBtn.classList.remove('hidden');
        } else {
            loadHistoryBtn.classList.add('hidden');
        }

        // Show greeting on every load
        initChatGreeting();
    }
}

function loadProfileToUI() {
    profileRisk.forEach(cb => cb.checked = (userProfile.risk && userProfile.risk.includes(cb.value)));
    profileTime.forEach(cb => cb.checked = (userProfile.time && userProfile.time.includes(cb.value)));
    profileStyle.forEach(cb => cb.checked = (userProfile.style && userProfile.style.includes(cb.value)));
}

function saveProfileFromUI() {
    userProfile = {
        risk: Array.from(profileRisk).filter(cb => cb.checked).map(cb => cb.value),
        time: Array.from(profileTime).filter(cb => cb.checked).map(cb => cb.value),
        style: Array.from(profileStyle).filter(cb => cb.checked).map(cb => cb.value)
    };
    localStorage.setItem('ai_stock_user_profile', JSON.stringify(userProfile));
    alert('Đã lưu hồ sơ đầu tư!');
}

function getProfileSummary() {
    let summary = "Hồ sơ Nhà Đầu Tư hiện tại:\n";
    summary += `- Mức rủi ro: ${userProfile.risk && userProfile.risk.length ? userProfile.risk.join(', ') : 'Chưa rõ'}\n`;
    summary += `- Thời gian ĐT: ${userProfile.time && userProfile.time.length ? userProfile.time.join(', ') : 'Chưa rõ'}\n`;
    summary += `- Phong cách: ${userProfile.style && userProfile.style.length ? userProfile.style.join(', ') : 'Chưa rõ'}\n`;
    return summary;
}

function restoreChatUI() {
    chatMessages.innerHTML = '';
    // Skip the first 2 static prompt messages
    for (let i = 2; i < chatHistory.length; i++) {
        const msg = chatHistory[i];
        if (msg.role === 'user') {
            appendChatMessage(msg.parts[0].text, 'user', true);
        } else {
            appendChatMessage(msg.parts[0].text, 'bot', true);
        }
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// === Event Listeners ===

// API Key Management
const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        init(); // Ignore modal, return to app
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
    init(true); // show modal again
});

if (autoRotateKeyBtn) {
    autoRotateKeyBtn.addEventListener('click', () => {
        // Xóa key cũ của user đi, ép hệ thống dùng key dự phòng và xoay vòng
        localStorage.removeItem('gemini_api_key');
        userApiKey = '';
        currentKeyIndex = (currentKeyIndex + 1) % _k.length;
        alert("Đã tự động chuyển đổi sang Key hệ thống dự phòng số " + (currentKeyIndex + 1));
        init(false);
    });
}

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

// Profile Management
saveProfileBtn.addEventListener('click', saveProfileFromUI);

clearProfileBtn.addEventListener('click', () => {
    if (confirm("Bạn có chắc muốn xóa toàn bộ hồ sơ nhà đầu tư?")) {
        userProfile = { risk: [], time: [], style: [] };
        localStorage.removeItem('ai_stock_user_profile');
        loadProfileToUI();
        alert('Đã xóa hồ sơ.');
    }
});

// Chat Management
clearChatBtn.addEventListener('click', () => {
    if (confirm("Bạn có chắc muốn xóa lịch sử trò chuyện?")) {
        chatHistory = [
            { role: "user", parts: [{ text: STRICT_SYSTEM_PROMPT }] },
            { role: "model", parts: [{ text: "Đã hiểu, tôi sẽ BẤT DI BẤT DỊCH tuân thủ chính xác format và KHÔNG CHÀO HỎI khi phân tích." }] }
        ];
        localStorage.removeItem('ai_stock_chat_history');
        loadHistoryBtn.classList.add('hidden');
        chatMessages.innerHTML = '';
        initChatGreeting();
    }
});

if (loadHistoryBtn) {
    loadHistoryBtn.addEventListener('click', () => {
        restoreChatUI();
        loadHistoryBtn.classList.add('hidden');
    });
}

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
if (suggestionBtns) {
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (sectorInput && analyzeSectorBtn) {
                sectorInput.value = btn.innerText;
                analyzeSectorBtn.click();
            }
        });
    });
}

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

if (analyzeSectorBtn) {
    analyzeSectorBtn.addEventListener('click', () => {
        const sector = sectorInput.value.trim();
        if (sector) {
            analyzeSector(sector);
        } else {
            alert('Vui lòng nhập tên ngành.');
        }
    });
}

if (sectorInput) {
    sectorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeSectorBtn.click();
    });
}

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

// Compare Elements
const compareStock1 = document.getElementById('compare-stock-1');
const compareStock2 = document.getElementById('compare-stock-2');
const compareStockBtn = document.getElementById('compare-stock-btn');
const compareResult = document.getElementById('compare-result');

compareStockBtn.addEventListener('click', () => {
    const s1 = compareStock1.value.trim().toUpperCase();
    const s2 = compareStock2.value.trim().toUpperCase();
    if (s1 && s2) {
        analyzeCompare(s1, s2);
    } else {
        alert('Vui lòng nhập đủ 2 mã cổ phiếu.');
    }
});

// Profile Management
async function callGeminiAPI(promptText, retryCount = 0) {
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
            const errorRaw = await response.text();
            let errorData = {};
            try { errorData = JSON.parse(errorRaw); } catch (e) { }

            // Check for quota (429) or Leaked API Key (400)
            if (response.status === 429 || errorRaw.includes("leaked") || response.status === 400) {
                if (retryCount < _k.length && rotateKey()) {
                    console.log("Hết quota hoặc key lỗi, thử lại với key mới...");
                    return await callGeminiAPI(promptText, retryCount + 1);
                } else {
                    const errorMsg = errorData.error?.message || errorRaw;
                    throw new Error(`API Error ${response.status}: ${errorMsg}. Đã thử hết các key dự phòng.`);
                }
            }
            throw new Error(errorData.error?.message || `Lỗi không xác định: ${response.status} - ${errorRaw}`);
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
async function initChatGreeting() {
    chatMessages.innerHTML = ''; // Clear board
    const loadingId = appendChatLoading();

    try {
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN');
        const currentHour = now.getHours();

        let sessionName = "buổi sáng";
        let sessionKey = "morning";
        if (currentHour >= 12 && currentHour < 14) {
            sessionName = "buổi trưa";
            sessionKey = "noon";
        }
        else if (currentHour >= 14 && currentHour < 18) {
            sessionName = "buổi chiều";
            sessionKey = "afternoon";
        }
        else if (currentHour >= 18) {
            sessionName = "buổi tối";
            sessionKey = "evening";
        }

        const cacheKey = `chat_greeting_${dateStr}_${sessionKey}`;
        const cachedGreeting = localStorage.getItem(cacheKey);

        if (cachedGreeting) {
            document.getElementById(loadingId)?.remove();
            appendChatMessage(cachedGreeting, 'bot');
            return;
        }

        const weatherRes = await fetch("https://api.open-meteo.com/v1/forecast?latitude=21.0116&longitude=105.8529&current_weather=true&hourly=temperature_2m,precipitation_probability&timezone=Asia%2FBangkok");
        const weatherData = await weatherRes.json();

        const temp = weatherData.current_weather.temperature;

        const hourIndex = now.getHours();

        let weatherStr = "";
        if (currentHour >= 18) {
            // Predict for next morning (approx +14 hours from 18h is 8h next morning)
            const targetMorningIndex = hourIndex + (24 - hourIndex) + 8; // 8 AM next day
            if (targetMorningIndex < weatherData.hourly.temperature_2m.length) {
                const nextMorningTemp = weatherData.hourly.temperature_2m[targetMorningIndex];
                const nextMorningRain = weatherData.hourly.precipitation_probability[targetMorningIndex];
                const willRainMorning = nextMorningRain > 30 ? `có khả năng mưa (${nextMorningRain}%)` : "trời sẽ khô ráo";
                weatherStr = `Dự báo sáng mai: Nhiệt độ khoảng ${Math.round(nextMorningTemp)}°C, ${willRainMorning}.`;
            } else {
                weatherStr = "Dự báo ngày mai: Chưa có dữ liệu thời tiết.";
            }
        } else {
            // Predict for next 4 hours
            const next4HoursTemps = weatherData.hourly.temperature_2m.slice(hourIndex, hourIndex + 4);
            const next4HoursRain = weatherData.hourly.precipitation_probability.slice(hourIndex, hourIndex + 4);
            const maxRainProb = Math.max(...next4HoursRain);
            const willRain = maxRainProb > 30 ? `Có khả năng mưa (${maxRainProb}%)` : "Trời khô ráo, không mưa";
            weatherStr = `Dự báo 4h tới: Nhiệt độ khoảng ${Math.round(next4HoursTemps.reduce((a, b) => a + b) / next4HoursTemps.length)}°C. ${willRain}.`;
        }

        const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' });

        const greetingPrompt = `Người dùng tên là Thưởng Vương Đức.
Tình huống: Người dùng vừa mở ứng dụng AI Chứng Khoán.
Thời gian hiện tại: ${sessionName}, ${timeStr}.
Nhiệt độ Hai Bà Trưng, Hà Nội hiện tại: ${temp}°C.
${weatherStr}

Hãy viết ĐÚNG 1 CÂU chào mừng tham khảo cấu trúc ví dụ dưới đây (chỉ thay đổi thời gian buổi nào, nhiệt độ, thời tiết cho đúng với hiện tại. KHÔNG ĐƯA THÔNG TIN GIỜ CHÍNH XÁC VÀO CÂU CHÀO. Viết tự nhiên, súc tích, KHÔNG THÊM BẤT KỲ câu hỏi nào ở cuối.):
Ví dụ: "Xin chào buổi trưa anh **Thưởng Vương Đức**, khu vực Hai Bà Trưng hiện có nhiệt độ 21 độ C, thời tiết khá dễ chịu. Dự kiến 4h tới trời khô ráo không mưa, nhiệt độ là 23 độ C. Chúc anh 1 ngày đầu tư thành công."`;

        const responseText = await callChatGeminiAPI([{ role: "user", parts: [{ text: greetingPrompt }] }]);

        document.getElementById(loadingId)?.remove();

        if (responseText) {
            localStorage.setItem(cacheKey, responseText);
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
    const text = "Xin chào **Thưởng Vương Đức**! Chúc bạn một ngày đầu tư thành công.";
    appendChatMessage(text, 'bot');
}

async function handleChatSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendChatMessage(text, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Intercept and add strict instruction if it looks like ticker or compare
    let processedText = text;
    if (text.length <= 5 || text.toLowerCase().includes("so sánh") || text.toLowerCase().includes("phân tích")) {
        processedText = `[REMINDER: USE STRICT FORMAT & NO GREETING]\n${text}`;
    }

    chatHistory.push({ role: "user", parts: [{ text: processedText }] });
    localStorage.setItem('ai_stock_chat_history', JSON.stringify(chatHistory));

    const loadingId = appendChatLoading();

    const responseText = await callChatGeminiAPI(chatHistory);

    document.getElementById(loadingId)?.remove();

    if (responseText) {
        // Detect auto-profile learning in response (Looking for ```json ... ```)
        let finalResponse = responseText;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);

        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsedProfile = JSON.parse(jsonMatch[1]);
                if (parsedProfile.risk) userProfile.risk = Array.isArray(parsedProfile.risk) ? parsedProfile.risk : [parsedProfile.risk];
                if (parsedProfile.time) userProfile.time = Array.isArray(parsedProfile.time) ? parsedProfile.time : [parsedProfile.time];
                if (parsedProfile.style) userProfile.style = Array.isArray(parsedProfile.style) ? parsedProfile.style : [parsedProfile.style];

                localStorage.setItem('ai_stock_user_profile', JSON.stringify(userProfile));
                loadProfileToUI();

                // Remove the json block from the visible response
                finalResponse = responseText.replace(/```json\n[\s\S]*?\n```/, '').trim();
            } catch (e) {
                console.error("Failed to parse auto-profile json update.", e);
            }
        }

        chatHistory.push({ role: "model", parts: [{ text: finalResponse }] });
        localStorage.setItem('ai_stock_chat_history', JSON.stringify(chatHistory));
        appendChatMessage(finalResponse, 'bot');
    } else {
        appendChatMessage("Xin lỗi, đã có lỗi xảy ra. Hãy kiểm tra kết nối và thử lại.", 'bot');
        chatHistory.pop(); // Revert user message from history on fail
        localStorage.setItem('ai_stock_chat_history', JSON.stringify(chatHistory));
    }
}

function appendChatMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    // Add avatar label
    const avatarLabel = document.createElement('div');
    avatarLabel.className = 'message-avatar';
    avatarLabel.innerText = sender === 'bot' ? '[AI_RSP] >' : '[USR_CMD] ~';
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
    avatarLabel.innerText = '[AI_RSP] >';
    msgDiv.appendChild(avatarLabel);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<span class="skeleton-text">Phân tích thông tin...</span>';
    msgDiv.appendChild(contentDiv);

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

async function callChatGeminiAPI(fullHistory, retryCount = 0) {
    const apiKey = getActiveKey();
    if (!apiKey) {
        alert("Thiếu API Key!");
        init();
        return null;
    }

    // --- Token Optimization Logic ---
    // Rule: Send System Prompt + Profile Summary + Last 5 messages only.
    let optimizedHistory = [];

    // Check if this is a standard chat history that requires profile injection
    const isStandardChat = fullHistory.length >= 2 &&
        fullHistory[0].parts && fullHistory[0].parts[0].text.includes("Hãy đóng vai AI Trợ Lý");

    if (isStandardChat) {
        // Always keep the original System prompts (first 2 messages)
        optimizedHistory.push(fullHistory[0]);
        optimizedHistory.push(fullHistory[1]);

        // Inject dynamic User Profile info as a hidden system instruction
        const profileSummaryMsg = {
            role: "user",
            parts: [{ text: `[SYSTEM INSTRUCTION: ${getProfileSummary()}\nHãy dựa vào hồ sơ này để cá nhân hóa phân tích. NẾU người dùng thay đổi hoặc cung cấp thêm góc nhìn (ví dụ: tôi đổi sang thích an toàn, tôi bắt đầu đầu tư lướt sóng...), HÃY xuất ra MỘT khối JSON ở CUỐI CÙNG tin nhắn với định dạng: \`\`\`json\n{ "risk": ["Thấp", "Trung bình", "Cao"], "time": ["Ngắn hạn", "Trung hạn", "Dài hạn"], "style": ["Tăng trưởng", "Phòng thủ", "Cổ tức", "Đầu cơ"] }\n\`\`\` (Chỉ đưa các lựa chọn phù hợp nhất vào mảng). NẾU KHÔNG CẬP NHẬT GÌ thì KHÔNG ghi JSON.]` }]
        };
        optimizedHistory.push(profileSummaryMsg);
        optimizedHistory.push({ role: "model", parts: [{ text: "Đã rõ." }] });

        // Grab up to the last 5 messages from the actual conversation history
        const recentMessagesCount = 5;
        const conversationPart = fullHistory.slice(2); // Skip the first 2 static sys prompts
        let recentMessages = conversationPart.slice(-recentMessagesCount);

        optimizedHistory = optimizedHistory.concat(recentMessages);
    } else {
        // Standalone prompts (like greeting) don't need profile injection and history slicing
        optimizedHistory = fullHistory;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: optimizedHistory,
                generationConfig: {
                    temperature: 0.1, // Ultra-low to force adherence
                }
            })
        });

        if (!response.ok) {
            const errorRaw = await response.text();
            let errorData = {};
            try { errorData = JSON.parse(errorRaw); } catch (e) { }

            if (response.status === 429 || errorRaw.includes("leaked") || response.status === 400) {
                if (retryCount < _k.length && rotateKey()) {
                    console.log("Hết quota hoặc key lỗi, thử lại chat với key mới...");
                    return await callChatGeminiAPI(fullHistory, retryCount + 1);
                } else {
                    const errorMsg = errorData.error?.message || errorRaw;
                    throw new Error(`API Error ${response.status}: ${errorMsg}`);
                }
            }
            throw new Error(errorData.error?.message || `Lỗi không xác định: ${response.status} - ${errorRaw}`);
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
        dashboardResult.innerHTML = '<p class="empty-state">Vui lòng nhấn nút "Phân tích" để AI tổng hợp thông tin vĩ mô hôm nay.</p>';
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
    const profileText = getProfileSummary();
    const prompt = `Bạn là một trader có kinh nghiệm đang đánh giá nhanh cổ phiếu cho chiến lược swing 1–3 tháng, tập trung vào tính chất vận động và xác suất. Áp dụng cho cả phân tích Vàng, Bạc, dầu khí hay bất kì mã nào của thế giới.

Người dùng đang cần phân tích mã cổ phiếu/tài sản: ${ticker}.
THÔNG TIN NHÀ ĐẦU TƯ:
${profileText}

==================================================
YÊU CẦU FORMAT BẮT BUỘC, BẤT DI BẤT DỊCH
==================================================

Khi người dùng nhập mã cổ phiếu, GPT phải trả lời đúng cấu trúc sau (trình bày bằng Markdown. BỎ QUA MỌI LỜI CHÀO HỎI ở đầu. KHÔNG TỰ BIÊN TẬP HAY ĐỔI TÊN MỤC. LƯU Ý KHI TRẢ LỜI CÁC GẠCH ĐẦU DÒNG, HÃY ĐIỀN TRỰC TIẾP GIÁ TRỊ VÀO, KHÔNG TRẢ LỜI KIỂU MÁY MÓC NHẮC LẠI CÂU HỎI. VÍ DỤ: '- Đầu tư công, BĐS KCN' thay vì '- Thường chạy theo sóng gì (đầu cơ, đầu tư công...): Đầu tư công, BĐS KCN'):

--------------------------------------------------
**[${ticker}]**
--------------------------------------------------

🔎 Thuộc nhóm:
- Ngành chính:
- Hưởng lợi từ câu chuyện nào:
- Có tính chu kỳ hay phòng thủ:

🎯 Đặc điểm cổ phiếu:
- Largecap / Midcap / Penny:
- Beta cao hay thấp:
- Thường chạy theo sóng gì:
- Mức độ biến động:

📊 Về kỹ thuật (đặc tính lịch sử):
- Có hay tạo nền tích lũy dài không:
- Thường breakout kiểu nào:
- Có hay bull trap không:
- Phù hợp đánh breakout hay đánh nền:

🧠 Đánh giá 1–3 tháng:
✔ Có thể chạy nếu:
- (Liệt kê điều kiện cụ thể)

❗ Rủi ro:
- (Liệt kê rủi ro thực tế, không chung chung)

📈 Phong cách phù hợp:
- Swing 1–3 tháng / Trading ngắn / Giữ trung hạn:
- Phù hợp người chịu rủi ro cao hay thấp:

⚖ Kết luận xác suất:
- Đánh giá tiềm năng 1–5:
- Giải thích logic vì sao chấm điểm đó:

--------------------------------------------------

==================================================
YÊU CẦU PHONG CÁCH
==================================================

- Phân tích thực tế, không PR.
- Không khuyến nghị mua/bán cụ thể.
- Không dùng văn phong chung chung kiểu "có tiềm năng tăng trưởng".
- Phải có lập luận rõ ràng.
- Nếu thiếu dữ liệu giá hiện tại thì không giả định bừa.
- Nếu giá > 60.000 VND thì cảnh báo không phù hợp tiêu chí lọc giá.`;

    const resultMarkdown = await callGeminiAPI(prompt);

    if (resultMarkdown) {
        stockResult.innerHTML = marked.parse(resultMarkdown);
        stockResult.classList.remove('hidden');
    }
}

async function analyzeCompare(ticker1, ticker2) {
    const profileText = getProfileSummary();
    const prompt = `Bạn là một trader có kinh nghiệm đang đánh giá nhanh các cổ phiếu cho chiến lược swing 1–3 tháng.
Người dùng đang yêu cầu SO SÁNH 2 cổ phiếu: ${ticker1} và ${ticker2}.

THÔNG TIN NHÀ ĐẦU TƯ:
${profileText}

==================================================
YÊU CẦU FORMAT BẮT BUỘC, BẤT DI BẤT DỊCH
==================================================

Khi người dùng yêu cầu so sánh mã cổ phiếu, GPT phải trả lời đúng cấu trúc sau (trình bày bằng Markdown. BỎ QUA MỌI LỜI CHÀO HỎI ở đầu. KHÔNG TỰ BIÊN TẬP HAY ĐỔI TÊN MỤC):

📊 So sánh nhanh

| Tiêu chí | ${ticker1} | ${ticker2} |
|---|---|---|
| Nhóm ngành | | |
| Độ rủi ro | | |
| Tính đầu cơ | | |
| Khả năng chạy sóng | | |
| Phù hợp ai | | |

🎯 Kết luận thẳng:
- Nếu muốn đánh nhanh – biên lớn ➔ [Mã cổ phiếu phù hợp]
- Nếu muốn cân bằng rủi ro ➔ [Mã cổ phiếu phù hợp]
- Nếu so với các mã cùng ngành khác ➔ [Tùy chọn nhận định thêm]`;

    const resultMarkdown = await callGeminiAPI(prompt);

    if (resultMarkdown) {
        compareResult.innerHTML = marked.parse(resultMarkdown);
        compareResult.classList.remove('hidden');
    }
}

// Start App
init();
