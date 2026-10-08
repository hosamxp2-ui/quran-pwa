const QURAN_API = "https://api.quran.com/api/v4";
let currentMadaniPage = 1;
let surahsData = [];
let currentTab = "madani";
let selectedAyahKey = "1:1";
let isHifzMode = false;

const SUNNAH_TAFSIRS = [
    { id: 16, name: "التفسير الميسر (مجمع الملك فهد)" },
    { id: 93, name: "المختصر في التفسير (مركز تفسير)" },
    { id: 14, name: "تفسير ابن كثير" },
    { id: 15, name: "تفسير القرطبي" },
    { id: 91, name: "تفسير الطبري" },
    { id: 169, name: "تفسير السعدي" }
];

document.addEventListener('DOMContentLoaded', () => {
    fetchSurahs();
    setupTabs();
    setupSettings();
    updatePrayerTimes();

    document.getElementById('btn-prev-page').onclick = () => changeMadaniPage(-1);
    document.getElementById('btn-next-page').onclick = () => changeMadaniPage(1);
    document.getElementById('btn-open-settings').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('close-settings-modal').onclick = () => document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('close-tafsir').onclick = () => document.getElementById('tafsir-drawer').classList.add('hidden');
    document.getElementById('close-word-modal').onclick = () => document.getElementById('word-modal').classList.add('hidden');
    document.getElementById('close-note-modal').onclick = () => document.getElementById('note-modal').classList.add('hidden');
    document.getElementById('btn-toggle-hifz').onclick = toggleHifzMode;
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
    } catch (e) {}
}

function renderGrid() {
    const container = document.getElementById('grid-container');
    container.innerHTML = "";

    if (currentTab === 'surahs') {
        surahsData.forEach(surah => {
            const card = document.createElement('div');
            card.className = 'surah-card';
            card.innerHTML = `<div><strong>${surah.id}. سورة ${surah.name_arabic}</strong></div><span class="ayah-number">﴿${surah.id}﴾</span>`;
            card.onclick = () => loadVersesByUrl(`verses/by_chapter/${surah.id}`, `سورة ${surah.name_arabic}`);
            container.appendChild(card);
        });
    } else if (currentTab === 'juz') {
        for (let i = 1; i <= 30; i++) {
            const card = document.createElement('div');
            card.className = 'surah-card';
            card.innerHTML = `<div><strong>الجزء ${i}</strong></div><span class="ayah-number">﴿${i}﴾</span>`;
            card.onclick = () => loadVersesByUrl(`verses/by_juz/${i}`, `الجزء ${i}`);
            container.appendChild(card);
        }
    }
}

async function loadVersesByUrl(endpoint, title) {
    document.getElementById('grid-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');
    document.getElementById('current-title').textContent = title;

    const container = document.getElementById('ayahs-container');
    container.innerHTML = "جاري التحميل...";

    try {
        const res = await fetch(`${QURAN_API}/${endpoint}?language=ar&words=true&word_fields=text_uthmani,location`);
        const data = await res.json();

        container.innerHTML = "";
        data.verses.forEach(verse => {
            const verseBlock = document.createElement('span');

            verse.words.forEach(word => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'quran-word';
                wordSpan.textContent = word.text_uthmani;
                wordSpan.onclick = (e) => { e.stopPropagation(); showWordDetails(word.location); };
                verseBlock.appendChild(wordSpan);
            });

            const numSpan = document.createElement('span');
            numSpan.className = 'ayah-number';
            numSpan.innerHTML = ` ﴿${verse.verse_number}﴾ `;
            numSpan.onclick = () => openTafsirDrawer(verse.verse_key);

            verseBlock.appendChild(numSpan);
            container.appendChild(verseBlock);
        });
    } catch (e) {
        container.innerHTML = "<p>خطأ في تحميل الآيات.</p>";
    }
}

function toggleHifzMode() {
    isHifzMode = !isHifzMode;
    const container = document.getElementById('ayahs-container');
    if (isHifzMode) {
        container.classList.add('hifz-mode');
        document.getElementById('btn-toggle-hifz').textContent = "إلغاء وضع التسميع 👁️";
    } else {
        container.classList.remove('hifz-mode');
        document.getElementById('btn-toggle-hifz').textContent = "وضع التسميع 👁️";
    }
}

function setupSettings() {
    document.getElementById('theme-select').onchange = (e) => {
        document.documentElement.setAttribute('data-theme', e.target.value);
    };

    document.getElementById('font-family-select').onchange = (e) => {
        document.documentElement.style.setProperty('--font-family', e.target.value);
    };

    document.getElementById('tafsir-font-select').onchange = (e) => {
        document.documentElement.style.setProperty('--tafsir-font', e.target.value);
    };

    document.getElementById('font-size-slider').oninput = (e) => {
        const val = e.target.value;
        document.getElementById('font-size-val').textContent = val;
        document.documentElement.style.setProperty('--font-size', val + 'px');
    };
}

function updatePrayerTimes() {
    document.getElementById('next-prayer-name').textContent = "العصر";
    document.getElementById('next-prayer-time').textContent = "3:58 م";
    document.getElementById('prayer-countdown').textContent = "45 دقيقة";
}

async function showWordDetails(location) {
    const modal = document.getElementById('word-modal');
    modal.classList.remove('hidden');
    document.getElementById('word-title').textContent = "جاري التحميل...";

    try {
        const res = await fetch(`${QURAN_API}/words/${location}?language=ar`);
        const data = await res.json();
        document.getElementById('word-title').textContent = data.word.text_uthmani;
        document.getElementById('word-meaning').textContent = data.word.translation ? data.word.translation.text : `الموقع: آية ${data.word.verse_key}`;
    } catch(err) {
        document.getElementById('word-meaning').textContent = "تعذر جلب التفاصيل.";
    }
}

async function openTafsirDrawer(verseKey) {
    selectedAyahKey = verseKey;
    const drawer = document.getElementById('tafsir-drawer');
    const container = document.getElementById('tafsir-accordion-container');
    drawer.classList.remove('hidden');
    document.getElementById('tafsir-title').textContent = `تفاسير الآية (${verseKey})`;

    let html = "";
    SUNNAH_TAFSIRS.forEach(t => {
        html += `<details class="accordion-item"><summary>${t.name}</summary><div class="accordion-content" id="tafsir-box-${t.id}">جاري تحميل التفسير...</div></details>`;
    });
    container.innerHTML = html;

    SUNNAH_TAFSIRS.forEach(t => {
        fetch(`${QURAN_API}/tafsirs/${t.id}/by_ayah/${verseKey}`)
            .then(res => res.json())
            .then(data => {
                const box = document.getElementById(`tafsir-box-${t.id}`);
                if (box && data.tafsir) box.innerHTML = data.tafsir.text;
            }).catch(() => {});
    });
}

function showMainView() {
    document.getElementById('reader-view').classList.add('hidden');
    if (currentTab === 'madani') {
        document.getElementById('madani-page-view').classList.remove('hidden');
    } else {
        document.getElementById('grid-view').classList.remove('hidden');
    }
}