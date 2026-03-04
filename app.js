// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
    },
    themeVariables: {
        primaryColor: '#6366f1',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#4f46e5',
        lineColor: '#64748b',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#e2e8f0'
    }
});

// DOM Elements
const codeEditor = document.getElementById('codeEditor');
const mermaidOutput = document.getElementById('mermaidOutput');
const renderBtn = document.getElementById('renderBtn');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const saveSvgBtn = document.getElementById('saveSvgBtn');
const formatBtn = document.getElementById('formatBtn');
const clearBtn = document.getElementById('clearBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomLevel = document.getElementById('zoomLevel');
const toast = document.getElementById('toast');
const installBtn = document.getElementById('installBtn');

// State
let currentZoom = 2;
let deferredPrompt = null;
let diagramId = 0;

// Example diagrams
const examples = {
    flowchart: `flowchart TD
    A[Bắt đầu] --> B{Điều kiện?}
    B -->|Có| C[Thực hiện A]
    B -->|Không| D[Thực hiện B]
    C --> E[Kết thúc]
    D --> E`,

    sequence: `sequenceDiagram
    participant U as 👤 User
    participant S as 🖥️ Server
    participant D as 💾 Database
    
    U->>S: Request data
    S->>D: Query
    D-->>S: Results
    S-->>U: Response`,

    class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,

    gantt: `gantt
    title Dự án phát triển
    dateFormat YYYY-MM-DD
    section Giai đoạn 1
    Phân tích yêu cầu :a1, 2024-01-01, 7d
    Thiết kế :a2, after a1, 10d
    section Giai đoạn 2
    Lập trình :a3, after a2, 15d
    Testing :a4, after a3, 7d
    section Giai đoạn 3
    Deploy :a5, after a4, 3d`,

    pie: `pie showData
    title Phân bổ ngân sách Marketing
    "Google Ads" : 35
    "Facebook" : 25
    "Email" : 20
    "SEO" : 15
    "Khác" : 5`,

    utm: `graph TD
    A[Campaign Start] --> B{UTM Source?}
    B -->|Facebook| C[utm_source=facebook]
    B -->|Google| D[utm_source=google]
    B -->|Email| E[utm_source=email]
    
    C --> F{UTM Medium?}
    D --> F
    E --> F
    
    F -->|CPC| G[utm_medium=cpc]
    F -->|Social| H[utm_medium=social]
    F -->|Newsletter| I[utm_medium=newsletter]
    
    G --> J[Analytics]
    H --> J
    I --> J
    
    J --> K[Campaign Name]
    K --> L[utm_campaign=summer_sale_2024]
    
    L --> M{Success?}
    M -->|Yes| N[Convert]
    M -->|No| O[Retarget]`
};

// Show toast notification
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.remove('hidden', 'error');
    if (isError) {
        toast.classList.add('error');
    }
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Render Mermaid diagram
async function renderDiagram() {
    const code = codeEditor.value.trim();
    if (!code) {
        mermaidOutput.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem;">Nhập mã Mermaid để xem kết quả</p>';
        return;
    }

    try {
        // Clear previous diagram
        mermaidOutput.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        
        // Generate unique ID for each render
        diagramId++;
        const id = `mermaid-diagram-${diagramId}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, code);
        mermaidOutput.innerHTML = svg;
        
        // Set zoom to default 200%
        currentZoom = 2;
        updateZoom();
        
        // Save to localStorage
        localStorage.setItem('mermaid-code', code);
        
        showToast('✅ Render thành công!');
    } catch (error) {
        console.error('Mermaid error:', error);
        mermaidOutput.innerHTML = `<div class="error-message">❌ Lỗi cú pháp:\n${error.message || 'Không thể render diagram'}</div>`;
        showToast('❌ Lỗi cú pháp!', true);
    }
}

// Get SVG element
function getSvgElement() {
    return mermaidOutput.querySelector('svg');
}

// Convert SVG to PNG Canvas
async function svgToCanvas(svg) {
    return new Promise((resolve, reject) => {
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            // Create canvas with 2x resolution for better quality
            const scale = 2;
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            
            URL.revokeObjectURL(url);
            resolve(canvas);
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        img.src = url;
    });
}

// Copy image to clipboard
async function copyImageToClipboard() {
    const svg = getSvgElement();
    if (!svg) {
        showToast('❌ Không có diagram để copy!', true);
        return;
    }

    try {
        const canvas = await svgToCanvas(svg);
        
        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]);
                showToast('📋 Đã copy ảnh vào clipboard!');
            } catch (err) {
                // Fallback: copy as data URL
                const dataUrl = canvas.toDataURL('image/png');
                await navigator.clipboard.writeText(dataUrl);
                showToast('📋 Đã copy data URL vào clipboard!');
            }
        }, 'image/png');
    } catch (error) {
        console.error('Copy error:', error);
        showToast('❌ Không thể copy ảnh!', true);
    }
}

// Save as PNG
async function saveAsPng() {
    const svg = getSvgElement();
    if (!svg) {
        showToast('❌ Không có diagram để lưu!', true);
        return;
    }

    try {
        const canvas = await svgToCanvas(svg);
        const dataUrl = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = `mermaid-diagram-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        
        showToast('💾 Đã lưu file PNG!');
    } catch (error) {
        console.error('Save PNG error:', error);
        showToast('❌ Không thể lưu ảnh!', true);
    }
}

// Save as SVG
function saveAsSvg() {
    const svg = getSvgElement();
    if (!svg) {
        showToast('❌ Không có diagram để lưu!', true);
        return;
    }

    try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `mermaid-diagram-${Date.now()}.svg`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        showToast('💾 Đã lưu file SVG!');
    } catch (error) {
        console.error('Save SVG error:', error);
        showToast('❌ Không thể lưu SVG!', true);
    }
}

// Zoom functions
function updateZoom() {
    mermaidOutput.style.transform = `scale(${currentZoom})`;
    zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
}

function zoomIn() {
    currentZoom = Math.min(currentZoom + 0.1, 3);
    updateZoom();
}

function zoomOut() {
    currentZoom = Math.max(currentZoom - 0.1, 0.3);
    updateZoom();
}

function zoomReset() {
    currentZoom = 2;
    updateZoom();
}

// Format code (basic formatting)
function formatCode() {
    let code = codeEditor.value;
    // Add some basic formatting
    code = code.replace(/\s+/g, ' ');
    code = code.replace(/-->/g, ' --> ');
    code = code.replace(/---/g, ' --- ');
    code = code.replace(/==>/g, ' ==> ');
    code = code.replace(/\|>/g, ' |> ');
    codeEditor.value = code;
    showToast('🔧 Đã format code!');
}

// Clear editor
function clearEditor() {
    codeEditor.value = '';
    mermaidOutput.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem;">Nhập mã Mermaid để xem kết quả</p>';
    localStorage.removeItem('mermaid-code');
    showToast('🗑️ Đã xóa!');
}

// Load example
function loadExample(name) {
    if (examples[name]) {
        codeEditor.value = examples[name];
        renderDiagram();
    }
}

// Auto-render with debounce
let renderTimeout;
function autoRender() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderDiagram, 1000);
}

// PWA Install
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        showToast('🎉 Đã cài đặt app!');
    }
    deferredPrompt = null;
    installBtn.classList.add('hidden');
});

// Event Listeners
renderBtn.addEventListener('click', renderDiagram);
copyBtn.addEventListener('click', copyImageToClipboard);
saveBtn.addEventListener('click', saveAsPng);
saveSvgBtn.addEventListener('click', saveAsSvg);
formatBtn.addEventListener('click', formatCode);
clearBtn.addEventListener('click', clearEditor);
zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);
zoomResetBtn.addEventListener('click', zoomReset);

// Example buttons
document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        loadExample(btn.dataset.example);
    });
});

// Auto-render on input
codeEditor.addEventListener('input', autoRender);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to render
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        renderDiagram();
    }
    // Ctrl/Cmd + S to save PNG
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAsPng();
    }
    // Ctrl/Cmd + Shift + C to copy image
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        copyImageToClipboard();
    }
});

// Load saved code from localStorage
window.addEventListener('load', () => {
    const savedCode = localStorage.getItem('mermaid-code');
    if (savedCode) {
        codeEditor.value = savedCode;
    }
    // Initial render
    renderDiagram();
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('SW registered:', registration);
            })
            .catch((error) => {
                console.log('SW registration failed:', error);
            });
    });
}

// Modal Elements
const promptBtn = document.getElementById('promptBtn');
const promptModal = document.getElementById('promptModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalOverlay = promptModal.querySelector('.modal-overlay');
const copyPromptBtn = document.getElementById('copyPromptBtn');
const promptTemplate = document.getElementById('promptTemplate');
const langSelect = document.getElementById('langSelect');
const chartSelect = document.getElementById('chartSelect');

// Prompt Templates
const promptTemplates = {
    vi: {
        flowchart: `Tôi dùng MermaidJS (https://mermaid.js.org) để vẽ diagram. Tạo flowchart cho UTM tracking.

Chỉ trả code MermaidJS, không markdown block.

Ví dụ:
graph TD
    A[Campaign Start] --> B{Source?}
    B -->|Facebook| C[utm_source=facebook]
    B -->|Google| D[utm_source=google]
    C --> E[Analytics]
    D --> E

Yêu cầu: [MÔ TẢ Ở ĐÂY]`,

        sequence: `Tôi dùng MermaidJS (https://mermaid.js.org) để vẽ diagram. Tạo sequence diagram cho UTM flow.

Chỉ trả code MermaidJS, không markdown block.

Ví dụ:
sequenceDiagram
    participant U as User
    participant W as Website
    participant G as GA4
    U->>W: Click ad with UTM
    W->>G: Send tracking
    G-->>W: Session ID

Yêu cầu: [MÔ TẢ Ở ĐÂY]`,

        pie: `Tôi dùng MermaidJS (https://mermaid.js.org) để vẽ diagram. Tạo pie chart cho phân bổ UTM.

Chỉ trả code MermaidJS, không markdown block.

Ví dụ:
pie showData
    title Traffic by Source
    "Facebook" : 35
    "Google" : 40
    "Email" : 15
    "Direct" : 10

Yêu cầu: [MÔ TẢ Ở ĐÂY]`,

        gantt: `Tôi dùng MermaidJS (https://mermaid.js.org) để vẽ diagram. Tạo gantt chart cho campaign timeline.

Chỉ trả code MermaidJS, không markdown block.

Ví dụ:
gantt
    title Campaign Timeline
    dateFormat YYYY-MM-DD
    section Facebook
    Awareness :a1, 2024-01-01, 14d
    Conversion :a2, after a1, 7d
    section Google
    Search Ads :b1, 2024-01-08, 21d

Yêu cầu: [MÔ TẢ Ở ĐÂY]`,

        mindmap: `Tôi dùng MermaidJS (https://mermaid.js.org) để vẽ diagram. Tạo mindmap cho UTM strategy.

Chỉ trả code MermaidJS, không markdown block.

Ví dụ:
mindmap
    root((UTM Strategy))
        Source
            Facebook
            Google
        Medium
            CPC
            Social
        Campaign
            Summer Sale

Yêu cầu: [MÔ TẢ Ở ĐÂY]`
    },
    en: {
        flowchart: `I use MermaidJS (https://mermaid.js.org) for diagrams. Create a flowchart for UTM tracking.

Return MermaidJS code only, no markdown block.

Example:
graph TD
    A[Campaign Start] --> B{Source?}
    B -->|Facebook| C[utm_source=facebook]
    B -->|Google| D[utm_source=google]
    C --> E[Analytics]
    D --> E

Request: [DESCRIBE HERE]`,

        sequence: `I use MermaidJS (https://mermaid.js.org) for diagrams. Create a sequence diagram for UTM flow.

Return MermaidJS code only, no markdown block.

Example:
sequenceDiagram
    participant U as User
    participant W as Website
    participant G as GA4
    U->>W: Click ad with UTM
    W->>G: Send tracking
    G-->>W: Session ID

Request: [DESCRIBE HERE]`,

        pie: `I use MermaidJS (https://mermaid.js.org) for diagrams. Create a pie chart for UTM distribution.

Return MermaidJS code only, no markdown block.

Example:
pie showData
    title Traffic by Source
    "Facebook" : 35
    "Google" : 40
    "Email" : 15
    "Direct" : 10

Request: [DESCRIBE HERE]`,

        gantt: `I use MermaidJS (https://mermaid.js.org) for diagrams. Create a gantt chart for campaign timeline.

Return MermaidJS code only, no markdown block.

Example:
gantt
    title Campaign Timeline
    dateFormat YYYY-MM-DD
    section Facebook
    Awareness :a1, 2024-01-01, 14d
    Conversion :a2, after a1, 7d
    section Google
    Search Ads :b1, 2024-01-08, 21d

Request: [DESCRIBE HERE]`,

        mindmap: `I use MermaidJS (https://mermaid.js.org) for diagrams. Create a mindmap for UTM strategy.

Return MermaidJS code only, no markdown block.

Example:
mindmap
    root((UTM Strategy))
        Source
            Facebook
            Google
        Medium
            CPC
            Social
        Campaign
            Summer Sale

Request: [DESCRIBE HERE]`
    },
    ja: {
        flowchart: `MermaidJS (https://mermaid.js.org) でダイアグラムを作成します。UTMトラッキング用のフローチャートを作成してください。

MermaidJSコードのみ返してください。マークダウンブロックは不要です。

例:
graph TD
    A[キャンペーン開始] --> B{ソース?}
    B -->|Facebook| C[utm_source=facebook]
    B -->|Google| D[utm_source=google]
    C --> E[アナリティクス]
    D --> E

リクエスト: [ここに説明]`,

        sequence: `MermaidJS (https://mermaid.js.org) でダイアグラムを作成します。UTMフロー用のシーケンス図を作成してください。

MermaidJSコードのみ返してください。マークダウンブロックは不要です。

例:
sequenceDiagram
    participant U as ユーザー
    participant W as ウェブサイト
    participant G as GA4
    U->>W: UTM付き広告クリック
    W->>G: トラッキング送信
    G-->>W: セッションID

リクエスト: [ここに説明]`,

        pie: `MermaidJS (https://mermaid.js.org) でダイアグラムを作成します。UTM分布用の円グラフを作成してください。

MermaidJSコードのみ返してください。マークダウンブロックは不要です。

例:
pie showData
    title ソース別トラフィック
    "Facebook" : 35
    "Google" : 40
    "Email" : 15
    "Direct" : 10

リクエスト: [ここに説明]`,

        gantt: `MermaidJS (https://mermaid.js.org) でダイアグラムを作成します。キャンペーンタイムライン用のガントチャートを作成してください。

MermaidJSコードのみ返してください。マークダウンブロックは不要です。

例:
gantt
    title キャンペーンタイムライン
    dateFormat YYYY-MM-DD
    section Facebook
    認知 :a1, 2024-01-01, 14d
    コンバージョン :a2, after a1, 7d
    section Google
    検索広告 :b1, 2024-01-08, 21d

リクエスト: [ここに説明]`,

        mindmap: `MermaidJS (https://mermaid.js.org) でダイアグラムを作成します。UTM戦略用のマインドマップを作成してください。

MermaidJSコードのみ返してください。マークダウンブロックは不要です。

例:
mindmap
    root((UTM戦略))
        ソース
            Facebook
            Google
        メディア
            CPC
            Social
        キャンペーン
            サマーセール

リクエスト: [ここに説明]`
    }
};

// Update prompt based on selections
function updatePrompt() {
    const lang = langSelect.value;
    const chart = chartSelect.value;
    promptTemplate.value = promptTemplates[lang][chart];
}

// Modal Functions
function openModal() {
    updatePrompt();
    promptModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    promptModal.classList.add('hidden');
    document.body.style.overflow = '';
}

async function copyPrompt() {
    try {
        await navigator.clipboard.writeText(promptTemplate.value);
        const msg = langSelect.value === 'vi' 
            ? '📋 Đã copy prompt!' 
            : '📋 Prompt copied!';
        showToast(msg);
    } catch (error) {
        promptTemplate.select();
        document.execCommand('copy');
        showToast('📋 Copied!');
    }
}

// Modal Event Listeners
promptBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
copyPromptBtn.addEventListener('click', copyPrompt);
langSelect.addEventListener('change', updatePrompt);
chartSelect.addEventListener('change', updatePrompt);

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !promptModal.classList.contains('hidden')) {
        closeModal();
    }
});

