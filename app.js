const API_BASE = "https://" + "api.alquran.cloud/v1";

let surahsData = [];
let deferredPrompt = null;

// تسجيل الـ Service Worker لتفعيل الـ PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker Registered Successfully!'))
        .catch((err) => console.error('Service Worker Registration Failed:', err));
}

// زر تثبيت التطبيق
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.hidden = false;
        installBtn.addEventListener('click', () => {
            installBtn.hidden = true;
            deferredPrompt.prompt();
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchSurahs();
    document.getElementById('search-input').addEventListener('input', filterSurahs);
    document.getElementById('back-btn').addEventListener('click', showSurahList);
});

async function fetchSurahs() {
    try {
        const response = await fetch(`${API_BASE}/surah`);
        const data = await response.json();
        surahsData = data.data;
        renderSurahs(surahsData);
    } catch (error) {
        document.getElementById('surah-container').innerHTML = 
            "<p style='text-align:center; grid-column:1/-1;'>حدث خطأ أثناء تحميل السور. يرجى التأكد من الاتصال بالإنترنت.</p>";
    }
}

function renderSurahs(surahs) {
    const container = document.getElementById('surah-container');
    container.innerHTML = "";
    surahs.forEach(surah => {
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.innerHTML = `
            <div class="surah-num">${surah.number}</div>
            <div class="surah-info">
                <h3>سورة ${surah.name}</h3>
                <span>عدد الآيات: ${surah.numberOfAyahs} - ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
            </div>
        `;
        card.addEventListener('click', () => loadSurah(surah.number, surah.name));
        container.appendChild(card);
    });
}

function filterSurahs(e) {
    const query = e.target.value.trim().toLowerCase();
    const filtered = surahsData.filter(s => s.name.includes(query) || s.number.toString() === query);
    renderSurahs(filtered);
}

async function loadSurah(surahNumber, surahName) {
    document.getElementById('surah-list-view').classList.add('hidden');
    document.getElementById('reader-view').classList.remove('hidden');
    document.getElementById('current-surah-title').textContent = `سورة ${surahName}`;
    
    const bismillahEl = document.getElementById('bismillah');
    bismillahEl.style.display = (surahNumber === 1 || surahNumber === 9) ? 'none' : 'block';

    const container = document.getElementById('ayahs-container');
    container.innerHTML = "جاري التحميل...";

    try {
        const response = await fetch(`${API_BASE}/surah/${surahNumber}`);
        const data = await response.json();
        
        container.innerHTML = "";
        data.data.ayahs.forEach(ayah => {
            let text = ayah.text;
            if (surahNumber !== 1 && surahNumber !== 9 && ayah.numberInSurah === 1) {
                text = text.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "").trim();
            }

            const ayahSpan = document.createElement('span');
            ayahSpan.className = 'ayah-span';
            ayahSpan.innerHTML = `${text} <span class="ayah-badge">﴿${ayah.numberInSurah}﴾</span> `;
            
            // عند الضغط على الآية تُمكّنك من الاستماع
            ayahSpan.addEventListener('click', () => playAudio(surahNumber, ayah.numberInSurah));
            container.appendChild(ayahSpan);
        });
    } catch (err) {
        container.innerHTML = "عفواً، تعذر تحميل الآيات. جرب مرة أخرى.";
    }
}

function showSurahList() {
    document.getElementById('reader-view').classList.add('hidden');
    document.getElementById('surah-list-view').classList.remove('hidden');
}

let currentAudio = null;
function playAudio(surah, ayah) {
    if (currentAudio) {
        currentAudio.pause();
    }
    const reciter = document.getElementById('reciter-select').value;
    fetch(`${API_BASE}/ayah/${surah}:${ayah}/${reciter}`)
        .then(res => res.json())
        .then(data => {
            if (data.data && data.data.audio) {
                currentAudio = new Audio(data.data.audio);
                currentAudio.play();
            }
        });
}