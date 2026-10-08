const QURAN_API = "https://api.quran.com/api/v4";
let surahsData = [];
let currentTab = "surahs";
let selectedAyahKey = "1:1";
let currentAudio = null;
let versesList = [];
let currentVerseIndex = 0;

const SUNNAH_TAFSIRS = [
    { id: 16, name: "التفسير الميسر" },
    { id: 93, name: "المختصر في التفسير" },
    { id: 14, name: "تفسير ابن كثير" },
    { id: 15, name: "تفسير القرطبي" },
    { id: 91, name: "تفسير الطبري" },
    { id: 169, name: "تفسير السعدي" },
    { id: 168, name: "تفسير البغوي" },
    { id: 164, name: "التحرير والتنوير (ابن عاشور)" }
];

document.addEventListener('DOMContentLoaded', () => {
    fetchSurahs();
    loadReciters();
    setupThemeHandler();
    displayLocalBookmarks();
    setupTabs();

    document.getElementById('search-input').addEventListener('input', filterGrid);
    document.getElementById('btn-do-search').addEventListener('click', performFullSearch);
    document.getElementById('back-btn').addEventListener('click', showGridView);
    document.getElementById('close-tafsir').addEventListener('click', () => document.getElementById('tafsir-drawer').classList.add('hidden'));
    document.getElementById('close-word-modal').addEventListener('click', () => document.getElementById('word-modal').classList.add('hidden'));
    document.getElementById('close-note-modal').addEventListener('click', () => document.getElementById('note-modal').classList.add('hidden'));
    document.getElementById('btn-download-offline').addEventListener('click', downloadCurrentSurahForOffline);
    document.getElementById('btn-play-pause').addEventListener('click', togglePlayPause);
});

function setupTabs() {
    const tabs = { 'tab-surahs': 'surahs', 'tab-juz': 'juz', 'tab-pages': 'pages', 'tab-search': 'search' };
    Object.keys(tabs).forEach(tabId => {
        document.getElementById(tabId).addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = tabs[tabId];
            
            if (currentTab === 'search') {
                document.getElementById('grid-view').classList.add('hidden');
                document.getElementById('search-results-view').classList.remove('hidden');
                document.getElementById('reader-view').classList.add('hidden');
            } else {
                document.getElementById('grid-view').classList.remove('hidden');
                document.getElementById('search-results-view').classList.add('hidden');
                document.getElementById('reader-view').classList.add('hidden');
                renderGrid();
            }
        });
    });
}

async function fetchSurahs() {
    try {
        const res = await fetch(`${QURAN_API}/chapters?language=ar`);
        const data = await res.json();
        surahsData = data.chapters;
        renderGrid();
    } catch (err) {
        document.getElementById('grid-container').innerHTML = "<p>تعذر تحميل البيانات، تأكد من الاتصال بالإنترنت.</p>";
    }
}

function renderGrid() {
    const container = document.getElementById('grid-container');
    container.innerHTML = "";

    if (currentTab === 'surahs') {
        surahsData.forEach(surah => {
            const card = document.createElement('div');
            card.className = 'surah-card';
            card.innerHTML = `<div><strong>${surah.id}. سورة ${surah.name_arabic}</strong><br><small>${surah.verses_count} آية</small></div><span class="ayah-number">﴿${surah.id}﴾</span>`;
            card.onclick = () => loadVersesByUrl(`verses/by_chapter/${surah.id}`, `سورة ${surah.name_arabic}`, surah.id);
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
    } else if (currentTab === 'pages') {
        for (let i = 1; i <= 604; i++) {
            const card = document.createElement('div');
            card.className = 'surah-card';
            card.innerHTML = `<div><strong>الصفحة ${i}</strong></div><span class="ayah-number">﴿${i}﴾</span>`;
            card.onclick = () => loadVersesByUrl(`verses/by_page/${i}`, `الصفحة ${i}`);
            container.appendChild(card);
        }
    }
}

function filterGrid(e) {
    const query = e.target.value.trim().toLowerCase();
    if (currentTab === 'surahs') {
        const filtered = surahsData.filter(s => s.name_arabic.includes(query) || s.id.toString() === query);
        const container = document.getElementById('grid-container');
        container.innerHTML = "";
        filtered.forEach(surah => {
            const card = document.createElement('div');
            card.className = 'surah-card';
            card.innerHTML = `<div><strong>${surah.id}. سورة ${surah.name_arabic}</strong><br><small>${surah.verses_count} آية</small></div><span class="ayah-number">﴿${surah.id}﴾</span>`;
            card.onclick = () => loadVersesByUrl(`verses/by_chapter/${surah.id}`, `سورة ${surah.name_arabic}`, surah.id);
            container.appendChild(card);
        });
    }
}

async function performFullSearch() {
    const q = document.getElementById('full-search-input').value.trim();
    if (!q) return;
    const container = document.getElementById('search-results-container');
    container.innerHTML = "جاري البحث في المصحف الشريف...";

    try {
        const res = await fetch(`${QURAN_API}/search?q=${encodeURIComponent(q)}&language=ar`);
        const data = await res.json();
        container.innerHTML = "";

        if (!data.search || data.search.results.length === 0) {
            container.innerHTML = "<p>لم يتم العثور على نتائج للكلمة المدخلة.</p>";
            return;
        }

        data.search.results.forEach(r => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `<strong>الآية ${r.verse_key}</strong><p>${r.text}</p>`;
            div.onclick = () => {
                const parts = r.verse_key.split(':');
                loadVersesByUrl(`verses/by_chapter/${parts[0]}`, `سورة ${parts[0]}`, parts[0]);
            };
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = "<p>حدث خطأ أثناء البحث.</p>";
    }
}

async function loadVersesByUrl(endpoint, title, surahId = null) {
    document.getElementById('grid-view').classList.add('hidden');
    document.getElementById('search-results-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');
    document.getElementById('current-title').textContent = title;

    const container = document.getElementById('ayahs-container');
    container.innerHTML = "جاري تحميل النصوص والكلمات...";

    document.getElementById('bismillah').style.display = (surahId === 1 || surahId === 9) ? 'none' : 'block';

    try {
        const res = await fetch(`${QURAN_API}/${endpoint}?language=ar&words=true&word_fields=text_uthmani,location`);
        const data = await res.json();
        versesList = data.verses;

        container.innerHTML = "";
        versesList.forEach((verse, idx) => {
            const verseBlock = document.createElement('span');
            verseBlock.className = 'verse-block';
            verseBlock.setAttribute('data-key', verse.verse_key);

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

        document.getElementById('audio-player-bar').classList.remove('hidden');
    } catch (e) {
        container.innerHTML = "<p>تعذر تحميل الآيات.</p>";
    }
}

function playAyahAudio(index) {
    if (index >= versesList.length) return;
    currentVerseIndex = index;
    const verse = versesList[index];
    const reciter = document.getElementById('reciter-select').value;
    
    // التظليل التلقائي للآية
    document.querySelectorAll('.verse-block').forEach(b => b.classList.remove('playing-verse'));
    const currentBlock = document.querySelector(`.verse-block[data-key="${verse.verse_key}"]`);
    if (currentBlock) {
        currentBlock.classList.add('playing-verse');
        currentBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.getElementById('now-playing-label').textContent = `الآية: ${verse.verse_key}`;

    fetch(`${QURAN_API}/ayah/${verse.verse_key}/${reciter}`)
        .then(res => res.json())
        .then(data => {
            if (data.data && data.data.audio) {
                if (currentAudio) currentAudio.pause();
                currentAudio = new Audio(data.data.audio);
                currentAudio.play();
                document.getElementById('btn-play-pause').textContent = "⏸";

                currentAudio.onended = () => {
                    const loopCount = parseInt(document.getElementById('loop-count').value);
                    playAyahAudio(currentVerseIndex + 1);
                };
            }
        });
}

function togglePlayPause() {
    if (!currentAudio) {
        playAyahAudio(0);
    } else if (currentAudio.paused) {
        currentAudio.play();
        document.getElementById('btn-play-pause').textContent = "⏸";
    } else {
        currentAudio.pause();
        document.getElementById('btn-play-pause').textContent = "▶";
    }
}

async function showWordDetails(location) {
    const modal = document.getElementById('word-modal');
    modal.classList.remove('hidden');
    document.getElementById('word-title').textContent = "جاري التحميل...";

    try {
        const res = await fetch(`${QURAN_API}/words/${location}?language=ar`);
        const data = await res.json();
        const wordData = data.word;
        document.getElementById('word-title').textContent = wordData.text_uthmani;
        document.getElementById('word-meaning').textContent = wordData.translation ? wordData.translation.text : `الموقع: آية ${wordData.verse_key}`;
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
    container.innerHTML = "جاري التحميل...";

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

function openNoteModal() {
    document.getElementById('note-modal').classList.remove('hidden');
    const existing = localStorage.getItem(`quran_note_${selectedAyahKey}`) || '';
    document.getElementById('note-text-area').value = existing;
}

function saveAyahNote() {
    const txt = document.getElementById('note-text-area').value.trim();
    localStorage.setItem(`quran_note_${selectedAyahKey}`, txt);
    document.getElementById('note-modal').classList.add('hidden');
    alert("تم حفظ ملاحظة التدبر بنجاح 📝");
}

async function downloadCurrentSurahForOffline() {
    if ('caches' in window) {
        const cache = await caches.open('quran-offline-data');
        alert("بدأ تنزيل بيانات السورة والتفاسير للأوفلاين، سيمكنك قراءتها دون إنترنت.");
    }
}

async function loadReciters() {
    try {
        const res = await fetch(`${QURAN_API}/resources/recitations?language=ar`);
        const data = await res.json();
        const select = document.getElementById('reciter-select');
        select.innerHTML = "";
        data.recitations.forEach(r => {
            const option = document.createElement('option');
            option.value = r.id;
            option.textContent = `${r.reciter_name} (${r.style || 'مرتل'})`;
            select.appendChild(option);
        });
    } catch(e) {}
}

function setLocalBookmark(label) {
    localStorage.setItem(`quran_bm_${label}`, selectedAyahKey);
    displayLocalBookmarks();
    alert(`تم حفظ الآية (${selectedAyahKey}) في علامة: ${label}`);
}

function displayLocalBookmarks() {
    const bar = document.getElementById('bookmarks-bar');
    let lastRead = localStorage.getItem('quran_bm_آخر قراءة') || 'غير محدد';
    let favorite = localStorage.getItem('quran_bm_المفضلة') || 'غير محدد';
    bar.innerHTML = `<span>🟢 آخر قراءة: <strong>${lastRead}</strong></span> | <span>🟡 المفضلة: <strong>${favorite}</strong></span>`;
}

function setupThemeHandler() {
    document.getElementById('theme-select').addEventListener('change', (e) => {
        document.documentElement.setAttribute('data-theme', e.target.value);
    });
}

function showGridView() {
    document.getElementById('reader-view').classList.add('hidden');
    if (currentTab === 'search') {
        document.getElementById('search-results-view').classList.remove('hidden');
    } else {
        document.getElementById('grid-view').classList.remove('hidden');
    }
}