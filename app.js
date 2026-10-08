const QURAN_API = "https://api.quran.com/api/v4";
let currentMadaniPage = 1;
let surahsData = [];
let currentTab = "madani";

document.addEventListener('DOMContentLoaded', () => {
    fetchSurahs();
    setupTabs();
    setupSettings();

    document.getElementById('btn-prev-page').onclick = () => changeMadaniPage(-1);
    document.getElementById('btn-next-page').onclick = () => changeMadaniPage(1);
    document.getElementById('btn-open-settings').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('close-settings-modal').onclick = () => document.getElementById('settings-modal').classList.add('hidden');
});

function setupTabs() {
    const tabs = { 'tab-madani': 'madani', 'tab-surahs': 'surahs', 'tab-juz': 'juz' };
    Object.keys(tabs).forEach(tabId => {
        const btn = document.getElementById(tabId);
        if(!btn) return;
        btn.onclick = (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = tabs[tabId];
            document.getElementById('madani-page-view').classList.add('hidden');
            document.getElementById('grid-view').classList.add('hidden');
            if (currentTab === 'madani') {
                document.getElementById('madani-page-view').classList.remove('hidden');
            } else {
                document.getElementById('grid-view').classList.remove('hidden');
                renderGrid(surahsData);
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
        renderGrid(surahsData);
    } catch (e) {}
}

function renderGrid(dataList) {
    const container = document.getElementById('grid-container');
    if(!container) return;
    container.innerHTML = "";
    dataList.forEach(surah => {
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.innerHTML = `<div><strong>${surah.id}. سورة ${surah.name_arabic}</strong></div><span>صفحة ${surah.pages[0]}</span>`;
        card.onclick = () => {
            currentMadaniPage = surah.pages[0];
            document.getElementById('tab-madani').click();
            changeMadaniPage(0);
        };
        container.appendChild(card);
    });
}

function filterSurahs(query) {
    const filtered = surahsData.filter(s => s.name_arabic.includes(query) || s.id.toString() === query);
    renderGrid(filtered);
}

function setupSettings() {
    document.getElementById('theme-select').onchange = (e) => document.documentElement.setAttribute('data-theme', e.target.value);
}