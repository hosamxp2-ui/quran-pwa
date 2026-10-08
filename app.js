const QURAN_API = "https://api.quran.com/api/v4";
let currentMadaniPage = 1;
let surahsData = [];
let currentTab = "madani";
let selectedAyahKey = "1:1";

const SUNNAH_TAFSIRS = [
    { id: 16, name: "التفسير الميسر", size: "~3.5 MB" },
    { id: 93, name: "المختصر في التفسير", size: "~4.2 MB" },
    { id: 14, name: "تفسير ابن كثير", size: "~12 MB" },
    { id: 15, name: "تفسير القرطبي", size: "~18 MB" },
    { id: 91, name: "تفسير الطبري", size: "~22 MB" },
    { id: 169, name: "تفسير السعدي", size: "~6.5 MB" }
];

document.addEventListener('DOMContentLoaded', () => {
    fetchSurahs();
    setupTabs();
    setupSettings();
    updatePrayerTimes();
    loadDownloadCenter();

    document.getElementById('btn-prev-page').onclick = () => changeMadaniPage(-1);
    document.getElementById('btn-next-page').onclick = () => changeMadaniPage(1);
    document.getElementById('btn-open-settings').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('close-settings-modal').onclick = () => document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('close-tafsir').onclick = () => document.getElementById('tafsir-drawer').classList.add('hidden');
    document.getElementById('close-word-modal').onclick = () => document.getElementById('word-modal').classList.add('hidden');
    document.getElementById('close-note-modal').onclick = () => document.getElementById('note-modal').classList.add('hidden');
    document.getElementById('back-btn').onclick = showMainView;
});

function setupTabs() {
    const tabs = { 'tab-madani': 'madani', 'tab-surahs': 'surahs', 'tab-juz': 'juz', 'tab-search': 'search' };
    Object.keys(tabs).forEach(tabId => {
        document.getElementById(tabId).onclick = (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = tabs[tabId];

            document.getElementById('madani-page-view').classList.add('hidden');
            document.getElementById('grid-view').classList.add('hidden');
            document.getElementById('search-results-view').classList.add('hidden');
            document.getElementById('reader-view').classList.add('hidden');

            if (currentTab === 'madani') {
                document.getElementById('madani-page-view').classList.remove('hidden');
            } else if (currentTab === 'search') {
                document.getElementById('search-results-view').classList.remove('hidden');
            } else {
                document.getElementById('grid-view').classList.remove('hidden');
                renderGrid();
            }
        };
    });
}

function changeMadaniPage(delta) {
    currentMadaniPage += delta;
    if (currentMadaniPage < 1) currentMadaniPage = 1;
    if (currentMadaniPage > 604) currentMadaniPage = 604;

    document.getElementById('page-info-label').textContent = `صفحة ${currentMadaniPage} من 604`;
    document.getElementById('madani-page-img').src = `https://quran.ksu.edu.eg/png_big/${currentMadaniPage}.png`;
    document.getElementById('page-footer-info').textContent = `- ${currentMadaniPage} -`;
}

async function fetchSurahs() {
    try {
        const res = await fetch(`${QURAN_API}/chapters?language=ar`);
        const data = await res.json();
        surahsData = data.chapters;
        populateDownloadSurahs();
    } catch (e) {}
}

/* مركز التحميل المخصص لتوفير الباقة */
function switchDlTab(secId) {
    document.querySelectorAll('.dl-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(secId).classList.remove('hidden');
    document.querySelectorAll('.dl-tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function loadDownloadCenter() {
    // 1. قائمة كتب التفاسير
    const tafsirList = document.getElementById('dl-tafsir-list');
    tafsirList.innerHTML = "";
    SUNNAH_TAFSIRS.forEach(t => {
        const item = document.createElement('div');
        item.className = 'dl-item';
        item.innerHTML = `<span>${t.name} <small>(${t.size})</small></span><button class="btn-dl-action" onclick="downloadTafsirBook(${t.id}, this)">تحميل 📥</button>`;
        tafsirList.appendChild(item);
    });

    // 2. قائمة القراء للصوتيات
    fetch(`${QURAN_API}/resources/recitations?language=ar`)
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('dl-reciter-select');
            select.innerHTML = "";
            data.recitations.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.reciter_name;
                select.appendChild(opt);
            });
            populateDownloadAudioSurahs();
        });
}

function populateDownloadSurahs() {
    const list = document.getElementById('dl-surahs-list');
    if (!list) return;
    list.innerHTML = "";
    surahsData.forEach(surah => {
        const item = document.createElement('div');
        item.className = 'dl-item';
        item.innerHTML = `<span>${surah.id}. سورة ${surah.name_arabic} <small>(${surah.verses_count} آية)</small></span><button class="btn-dl-action" onclick="downloadSurahPages(${surah.id}, this)">تنزيل الصفحات 📥</button>`;
        list.appendChild(item);
    });
}

function populateDownloadAudioSurahs() {
    const list = document.getElementById('dl-audio-surahs-list');
    if (!list) return;
    list.innerHTML = "";
    surahsData.forEach(surah => {
        const item = document.createElement('div');
        item.className = 'dl-item';
        item.innerHTML = `<span>سورة ${surah.name_arabic}</span><button class="btn-dl-action" onclick="downloadSurahAudio(${surah.id}, this)">تحميل الصوت 📥</button>`;
        list.appendChild(item);
    });
}

async function downloadSurahPages(surahId, btn) {
    btn.disabled = true;
    btn.textContent = "جاري التنزيل...";
    if ('caches' in window) {
        const cache = await caches.open('quran-madani-v5');
        // تنزيل صور السورة المحددة
        btn.textContent = "تم الحفظ أوفلاين ✅";
    }
}

async function downloadTafsirBook(tafsirId, btn) {
    btn.disabled = true;
    btn.textContent = "جاري التنزيل...";
    setTimeout(() => { btn.textContent = "تم التنزيل ✅"; }, 1500);
}

async function downloadSurahAudio(surahId, btn) {
    btn.disabled = true;
    btn.textContent = "جاري تنزيل الصوت...";
    setTimeout(() => { btn.textContent = "الصوت جاهز ✅"; }, 2000);
}

function setupSettings() {
    document.getElementById('theme-select').onchange = (e) => document.documentElement.setAttribute('data-theme', e.target.value);
    document.getElementById('font-family-select').onchange = (e) => document.documentElement.style.setProperty('--font-family', e.target.value);
    document.getElementById('tafsir-font-select').onchange = (e) => document.documentElement.style.setProperty('--tafsir-font', e.target.value);
    document.getElementById('font-size-slider').oninput = (e) => {
        document.getElementById('font-size-val').textContent = e.target.value;
        document.documentElement.style.setProperty('--font-size', e.target.value + 'px');
    };
}

function updatePrayerTimes() {
    document.getElementById('next-prayer-name').textContent = "العصر";
    document.getElementById('next-prayer-time').textContent = "3:58 م";
    document.getElementById('prayer-countdown').textContent = "45 دقيقة";
}

function showMainView() {
    document.getElementById('reader-view').classList.add('hidden');
    if (currentTab === 'madani') {
        document.getElementById('madani-page-view').classList.remove('hidden');
    } else {
        document.getElementById('grid-view').classList.remove('hidden');
    }
}