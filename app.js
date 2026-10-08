const QURAN_API = "https://api.quran.com/api/v4";
let surahsData = [];
let selectedAyahKey = "1:1";

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

    document.getElementById('search-input').addEventListener('input', filterSurahs);
    document.getElementById('back-btn').addEventListener('click', showSurahList);
    document.getElementById('close-tafsir').addEventListener('click', () => {
        document.getElementById('tafsir-drawer').classList.add('hidden');
    });
    document.getElementById('close-word-modal').addEventListener('click', () => {
        document.getElementById('word-modal').classList.add('hidden');
    });
});

async function fetchSurahs() {
    try {
        const res = await fetch(`${QURAN_API}/chapters?language=ar`);
        const data = await res.json();
        surahsData = data.chapters;
        renderSurahs(surahsData);
    } catch (err) {
        document.getElementById('surah-container').innerHTML = "<p>تعذر تحميل السور، يرجى التأكد من الاتصال بالإنترنت.</p>";
    }
}

function renderSurahs(surahs) {
    const container = document.getElementById('surah-container');
    container.innerHTML = "";
    surahs.forEach(surah => {
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.innerHTML = `
            <div>
                <strong>${surah.id}. سورة ${surah.name_arabic}</strong>
                <br><small>${surah.verses_count} آية - ${surah.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}</small>
            </div>
            <span class="ayah-number">﴿${surah.id}﴾</span>
        `;
        card.addEventListener('click', () => loadSurahContent(surah.id, surah.name_arabic));
        container.appendChild(card);
    });
}

function filterSurahs(e) {
    const query = e.target.value.trim().toLowerCase();
    const filtered = surahsData.filter(s => s.name_arabic.includes(query) || s.id.toString() === query);
    renderSurahs(filtered);
}

async function loadSurahContent(surahId, surahName) {
    document.getElementById('surah-list-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');
    document.getElementById('current-surah-title').textContent = `سورة ${surahName}`;

    const container = document.getElementById('ayahs-container');
    container.innerHTML = "جاري تحميل الآيات والكلمات...";

    const bismillah = document.getElementById('bismillah');
    bismillah.style.display = (surahId === 1 || surahId === 9) ? 'none' : 'block';

    try {
        const res = await fetch(`${QURAN_API}/verses/by_chapter/${surahId}?language=ar&words=true&word_fields=text_uthmani,location`);
        const data = await res.json();

        container.innerHTML = "";
        data.verses.forEach(verse => {
            const verseSpan = document.createElement('span');

            verse.words.forEach(word => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'quran-word';
                wordSpan.textContent = word.text_uthmani;
                wordSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showWordDetails(word.location);
                });
                verseSpan.appendChild(wordSpan);
            });

            const numSpan = document.createElement('span');
            numSpan.className = 'ayah-number';
            numSpan.innerHTML = ` ﴿${verse.verse_number}﴾ `;
            numSpan.title = "اضغط لعرض التفاسير السنية";
            numSpan.addEventListener('click', () => openTafsirDrawer(verse.verse_key));

            verseSpan.appendChild(numSpan);
            container.appendChild(verseSpan);
        });

        document.getElementById('audio-player-bar').classList.remove('hidden');
    } catch (err) {
        container.innerHTML = "<p>خطأ في تحميل بيانات السورة.</p>";
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
        document.getElementById('word-meaning').textContent = wordData.translation ? wordData.translation.text : `الموقع في المصحف: آية ${wordData.verse_key}`;
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
        html += `
            <details class="accordion-item">
                <summary>${t.name}</summary>
                <div class="accordion-content" id="tafsir-box-${t.id}">جاري تحميل التفسير...</div>
            </details>
        `;
    });
    container.innerHTML = html;

    SUNNAH_TAFSIRS.forEach(t => {
        fetch(`${QURAN_API}/tafsirs/${t.id}/by_ayah/${verseKey}`)
            .then(res => res.json())
            .then(data => {
                const box = document.getElementById(`tafsir-box-${t.id}`);
                if (box && data.tafsir) {
                    box.innerHTML = data.tafsir.text;
                }
            }).catch(() => {});
    });
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

function showSurahList() {
    document.getElementById('reader-view').classList.add('hidden');
    document.getElementById('surah-list-view').classList.remove('hidden');
}