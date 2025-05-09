// متغيرات التطبيق
let stories = [];
const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let premiumAuthors = [];

// دالة لتحميل البيانات مع معالجة الأخطاء
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`فشل تحميل البيانات من ${url}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    // تطبيق الوضع المحفوظ
    applySavedTheme();
    
    // تهيئة زر تبديل الوضع
    setupThemeToggle();
    
    // إذا كانت الصفحة الرئيسية
    if (document.getElementById('stories-container')) {
        try {
            await loadStories();
            setupSearch();
        } catch (error) {
            showError('حدث خطأ في تحميل القصص. يرجى المحاولة لاحقاً');
            loadSampleData();
        }
    }
    
    // إذا كانت صفحة القصة
    if (document.getElementById('story-text')) {
        try {
            await loadStoryContent();
        } catch (error) {
            showError('حدث خطأ في تحميل القصة. يرجى المحاولة لاحقاً');
            loadSampleStory();
        }
    }
});

// بيانات تجريبية للطوارئ
function loadSampleData() {
    stories = [
        {
            id: 1,
            title: "قصة تجريبية",
            author: "مؤلف تجريبي",
            genre: "نوع تجريبي"
        }
    ];
    premiumAuthors = ["مؤلف تجريبي"];
    displayStories(stories);
}

function loadSampleStory() {
    document.getElementById('story-title').textContent = "قصة تجريبية";
    document.getElementById('story-text').innerHTML = "هذه قصة تجريبية لعرض المحتوى عند حدوث خطأ في التحميل.";
    document.getElementById('author-name').textContent = "مؤلف تجريبي";
    document.getElementById('story-genre').textContent = "نوع تجريبي";
}

// تطبيق الوضع المحفوظ
function applySavedTheme() {
    if (localStorage.getItem('theme') === 'night') {
        document.body.classList.add('night-mode');
        const icon = document.querySelector('.theme-btn i');
        if (icon) icon.classList.replace('fa-moon', 'fa-sun');
    }
}

// تهيئة زر تبديل الوضع
function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;
    
    themeBtn.addEventListener('click', function() {
        document.body.classList.toggle('night-mode');
        const icon = this.querySelector('i');
        
        if (document.body.classList.contains('night-mode')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'night');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'day');
        }
    });
}

// تحميل القصص من ملف JSON
async function loadStories() {
    try {
        [stories, premiumAuthors] = await Promise.all([
            fetchData('./stories/addresses.json'),
            fetchData('./Authors/authors_gold/authors.json')
        ]);
        
        displayStories(stories);
    } catch (error) {
        console.error('Error loading stories:', error);
        throw error;
    }
}

// عرض القصص في الصفحة الرئيسية
function displayStories(storiesToDisplay) {
    const container = document.getElementById('stories-container');
    if (!container) return;
    
    if (!storiesToDisplay || storiesToDisplay.length === 0) {
        container.innerHTML = '<p class="no-stories">لا توجد قصص متاحة حالياً</p>';
        return;
    }
    
    container.innerHTML = storiesToDisplay.map(story => {
        const isFavorite = favorites.includes(story.id);
        const isPremium = premiumAuthors.includes(story.author);
        
        return `
            <div class="story-item" tabindex="0" data-id="${story.id}">
                <div class="story-main-info">
                    <h2 class="story-title">${story.title}</h2>
                    <p class="story-author ${isPremium ? 'premium-author' : ''}">
                        ${story.author}
                        ${isPremium ? '<span class="premium-badge">★</span>' : ''}
                    </p>
                </div>
                <div class="story-meta">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                            data-id="${story.id}" aria-label="إضافة إلى المفضلة">
                        <i class="fas fa-heart"></i>
                    </button>
                    <span class="story-genre">${story.genre}</span>
                </div>
            </div>
        `;
    }).join('');
    
    setupStoryItems();
    setupFavoriteButtons();
}

// إعداد أحداث القصص
function setupStoryItems() {
    document.querySelectorAll('.story-item').forEach(item => {
        const btn = item.querySelector('.favorite-btn');
        
        item.addEventListener('click', (e) => {
            if (e.target !== btn && !btn.contains(e.target)) {
                const storyId = item.getAttribute('data-id');
                window.location.href = `story.html?id=${storyId}`;
            }
        });
    });
}

// إعداد أحداث المفضلة
function setupFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const storyId = this.getAttribute('data-id');
            toggleFavorite(storyId);
        });
    });
}

// تبديل المفضلة
function toggleFavorite(storyId) {
    try {
        storyId = parseInt(storyId);
        let currentFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        const index = currentFavorites.indexOf(storyId);
        if (index === -1) {
            currentFavorites.push(storyId);
        } else {
            currentFavorites.splice(index, 1);
        }
        
        localStorage.setItem('favorites', JSON.stringify(currentFavorites));
        
        // تحديث الواجهة
        const favBtn = document.querySelector(`.favorite-btn[data-id="${storyId}"]`);
        if (favBtn) {
            favBtn.classList.toggle('active');
        }
    } catch (error) {
        console.error('Error in toggleFavorite:', error);
    }
}

// البحث عن القصص
function setupSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (!searchBtn || !searchInput) return;
    
    const searchHandler = () => {
        const term = searchInput.value.trim().toLowerCase();
        if (!term) {
            displayStories(stories);
            return;
        }
        
        const results = stories.filter(story => 
            story.title.toLowerCase().includes(term) || 
            story.author.toLowerCase().includes(term) ||
            story.genre.toLowerCase().includes(term)
        );
        
        displayStories(results);
    };
    
    searchBtn.addEventListener('click', searchHandler);
    searchInput.addEventListener('keyup', (e) => e.key === 'Enter' && searchHandler());
}

// تحميل محتوى القصة
async function loadStoryContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');
    
    if (!storyId) return;
    
    try {
        const [story, authors] = await Promise.all([
            fetchData(`./stories/story/${storyId}.json`),
            fetchData('./Authors/authors_gold/authors.json')
        ]);
        
        premiumAuthors = authors;
        
        document.title = story.title;
        document.getElementById('story-title').textContent = story.title;
        
        // عرض محتوى القصة
        const storyText = document.getElementById('story-text');
        storyText.innerHTML = story.content.replace(/\n/g, '<br>');
        
        // عرض صورة القصة إذا وجدت
        if (story.storyImage) {
            const img = document.createElement('img');
            img.src = `./${story.storyImage}`;
            img.alt = 'صورة القصة';
            img.className = 'story-image';
            storyText.prepend(img);
        }
        
        // عرض معلومات المؤلف
        const authorNameElement = document.getElementById('author-name');
        authorNameElement.textContent = story.author;
        
        // تطبيق التنسيق المميز
        if (premiumAuthors.includes(story.author)) {
            authorNameElement.classList.add('premium-author');
            const authorImg = document.getElementById('author-img');
            if (authorImg) {
                authorImg.classList.add('author-image');
                if (story.authorImage) {
                    authorImg.src = `./${story.authorImage}`;
                }
            }
        }
        
    } catch (error) {
        console.error('Error loading story content:', error);
        throw error;
    }
}

// عرض رسالة خطأ
function showError(message) {
    const container = document.getElementById('stories-container') || document.querySelector('main');
    if (container) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        container.prepend(errorElement);
    }
}
