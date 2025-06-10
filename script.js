const form = document.getElementById('presentation-form');
const exportBtn = document.getElementById('export-btn');
const themeSelector = document.getElementById('theme');
const slides = Array.from(form.querySelectorAll('.slide-editor'));
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
let currentSlideIndex = 0;

const STORAGE_KEY = 'minimalist-presentation-data';
const CURRENT_SLIDE_KEY = 'minimalist-presentation-current-slide';

// IDs of fields that sync to others
const syncSources = {
    s1_topic: ['s6_qna_topic'],
    s2_point1_short: ['s3_title', 's6_summary1'],
    s2_point2_short: ['s4_title', 's6_summary2'],
    s2_point3_short: ['s5_title', 's6_summary3'],
};

// --- Data Persistence ---

function saveData() {
    const data = {};
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        data[input.id] = input.value;
    });
    
    data.theme = themeSelector.value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(CURRENT_SLIDE_KEY, currentSlideIndex);
}

function loadData() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    
    // Load form data
    if (data) {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (data[input.id] !== undefined) {
                input.value = data[input.id];
            }
        });

        if (data.theme) {
            themeSelector.value = data.theme;
            applyTheme(data.theme);
        }
    }
    
    // Trigger initial sync for loaded data
    Object.keys(syncSources).forEach(sourceId => {
        const sourceElement = document.getElementById(sourceId);
        if (sourceElement) updateSyncedFields(sourceElement);
    });

    // Load last viewed slide
    const savedSlideIndex = parseInt(localStorage.getItem(CURRENT_SLIDE_KEY), 10);
    const slideToShow = (!isNaN(savedSlideIndex) && savedSlideIndex >= 0 && savedSlideIndex < slides.length)
        ? savedSlideIndex
        : 0;
    
    showSlide(slideToShow);
}

// --- UI Logic ---

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    
    currentSlideIndex = index;

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;

    const progressPercentage = ((index + 1) / slides.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;

    // Update legend for active slide to show progress
    slides.forEach((slide, i) => {
        const legend = slide.querySelector('legend');
        if (legend) {
            // Reset legend text if it was modified
            if (legend.dataset.originalText) {
                legend.textContent = legend.dataset.originalText;
            } else {
                legend.dataset.originalText = legend.textContent;
            }

            if (i === index) {
                legend.textContent = `${legend.dataset.originalText} (Step ${index + 1} of ${slides.length})`;
            }
        }
    });
}

function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
        showSlide(currentSlideIndex + 1);
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        showSlide(currentSlideIndex - 1);
    }
}

function applyTheme(themeName) {
    document.documentElement.className = `theme-${themeName}`;
}

function updateSyncedFields(sourceElement) {
    const targetIds = syncSources[sourceElement.id];
    if (!targetIds) return;
    
    targetIds.forEach(targetId => {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.value = sourceElement.value;
        }
    });
}

function handleFormInput(e) {
    if (e.target.matches('input, textarea')) {
        if (Object.keys(syncSources).includes(e.target.id)) {
            updateSyncedFields(e.target);
        }
        saveData();
    }
}

// --- Export Logic ---

function getSlideshowData() {
    const data = {};
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        // Basic sanitization and convert newlines
        const sanitizedValue = input.value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        data[input.id] = sanitizedValue.replace(/\n/g, '<br>');
    });
    data.theme = themeSelector.value;
    return data;
}

function generateSlideshowHTML(data) {
    const themeStyles = {
        light: `--bg: #f8f9fa; --text: #212529; --primary: #007bff; --h-text: #212529; --bullet-color: #007bff;`,
        dark: `--bg: #212529; --text: #f8f9fa; --primary: #4dabf7; --h-text: #f8f9fa; --bullet-color: #4dabf7;`,
        sepia: `--bg: #fbf0d9; --text: #5b4636; --primary: #d55f3e; --h-text: #5b4636; --bullet-color: #d55f3e;`,
        blueprint: `--bg: #002b5b; --text: #ffffff; --primary: #ffd700; --h-text: #ffffff; --bullet-color: #ffd700;`
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.s1_topic || 'My Presentation'}</title>
    <style>
        :root { ${themeStyles[data.theme] || themeStyles['light']} }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: var(--bg); color: var(--text); overflow: hidden; }
        .slideshow-container { position: relative; width: 100vw; height: 100vh; }
        .slide { display: none; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 5vw; box-sizing: border-box; width: 100%; height: 100%; font-size: 2.5vmin; line-height: 1.6; }
        .slide.active { display: flex; animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .slide h1 { font-size: 6vmin; color: var(--primary); margin-bottom: 1em; }
        .slide h2 { font-size: 4.5vmin; color: var(--h-text); margin: 0.5em 0; }
        .slide p { margin: 0.5em 0; max-width: 80ch; }
        .slide strong { color: var(--primary); }
        .slide ul { list-style: none; padding: 0; text-align: left; max-width: 70ch; }
        .slide ul li { margin-bottom: 0.8em; padding-left: 1.5em; position: relative; }
        .slide ul li::before { content: '•'; color: var(--bullet-color); font-weight: bold; display: inline-block; position: absolute; left: 0; }
        .navigation { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; }
        .nav-btn { background: rgba(0,0,0,0.3); color: white; border: none; font-size: 30px; padding: 10px 20px; cursor: pointer; border-radius: 5px; margin: 0 5px; user-select: none; }
        .nav-btn:hover { background: rgba(0,0,0,0.5); }
        .slide-counter { position: fixed; bottom: 20px; right: 20px; font-size: 20px; background: rgba(0,0,0,0.3); color: white; padding: 5px 10px; border-radius: 5px; }
        .exported-footer { position: fixed; bottom: 20px; left: 20px; font-size: 12px; z-index: 1000; opacity: 0.6; transition: opacity .2s ease-in-out; }
        .exported-footer:hover { opacity: 1; }
        .exported-footer p { margin: 0; color: var(--text); }
        .exported-footer a { color: var(--primary); text-decoration: none; }
        .exported-footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="slideshow-container">
        <section class="slide active">
            <h1>${data.s1_topic || 'Presentation Topic'}</h1>
            <p>Hello, my name is <strong>${data.s1_name || 'Presenter'}</strong>, and I'm a <strong>${data.s1_role || '...'}</strong>.</p>
            <p>${data.s1_importance || 'This topic is very important.'}</p>
        </section>
        <section class="slide">
            <h1>Outline</h1>
            <ul>
                <li>${data.s2_point1_short || 'Point 1'}</li>
                <li>${data.s2_point2_short || 'Point 2'}</li>
                <li>${data.s2_point3_short || 'Point 3'}</li>
            </ul>
            <p>${data.s2_outcome ? `By the end, you will ${data.s2_outcome}.` : ''}</p>
        </section>
        <section class="slide">
            <h1>${data.s3_title || 'Main Point 1'}</h1>
            <p>${data.s3_elaboration || 'Elaboration on the first point.'}</p>
            <p>${data.s3_example ? `<strong>For example:</strong> ${data.s3_example}` : ''}</p>
            <p>${data.s3_takeaway ? `<strong>Key Takeaway:</strong> ${data.s3_takeaway}`: ''}</p>
        </section>
        <section class="slide">
            <h1>${data.s4_title || 'Main Point 2'}</h1>
            <p>${data.s4_significance || 'Significance of the second point.'}</p>
            <p>${data.s4_example ? `<strong>Consider this:</strong> ${data.s4_example}` : ''}</p>
            <p>${data.s4_lesson ? `<strong>What we can learn:</strong> ${data.s4_lesson}` : ''}</p>
        </section>
        <section class="slide">
            <h1>${data.s5_title || 'Main Point 3'}</h1>
            <p>${data.s5_perspective || 'Perspective on the third point.'}</p>
            <p>${data.s5_illustration ? `<strong>Illustration:</strong> ${data.s5_illustration}`: ''}</p>
            <p>${data.s5_importance ? `<strong>Importance:</strong> ${data.s5_importance}` : ''}</p>
        </section>
        <section class="slide">
            <h1>Conclusion</h1>
            <h2>Summary</h2>
            <ul>
                <li>${data.s6_summary1 || 'Point 1'}</li>
                <li>${data.s6_summary2 || 'Point 2'}</li>
                <li>${data.s6_summary3 || 'Point 3'}</li>
            </ul>
            <p>${data.s6_message ? `<strong>Main message:</strong> ${data.s6_message}` : ''}</p>
        </section>
        <section class="slide">
            <h1>Thank You</h1>
            <h2>Questions?</h2>
            <p>${data.s6_qna_topic ? `I'm happy to answer any questions about ${data.s6_qna_topic}.` : ''}</p>
        </section>
    </div>
    <div class="navigation">
        <button id="prev-btn" class="nav-btn" title="Previous (Left Arrow)">&#10094;</button>
        <button id="next-btn" class="nav-btn" title="Next (Right Arrow)">&#10095;</button>
    </div>
    <div id="slide-counter" class="slide-counter"></div>
    <footer class="exported-footer">
        <p>Created with <a href="https://app.aaronshi.cc/presentation-maker/" target="_blank" rel="noopener noreferrer">Presentation Maker</a> | <a href="https://app.aaronshi.cc" target="_blank" rel="noopener noreferrer">Visit AaronShi.cc App</a></p>
    </footer>
    <script>
        const slides = document.querySelectorAll('.slide');
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const slideCounter = document.getElementById('slide-counter');
        let currentSlide = 0;
        function showSlide(index) {
            slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
            updateCounter();
        }
        function updateCounter() {
            slideCounter.textContent = \`\${currentSlide + 1} / \${slides.length}\`;
        }
        function nextSlide() { currentSlide = (currentSlide + 1) % slides.length; showSlide(currentSlide); }
        function prevSlide() { currentSlide = (currentSlide - 1 + slides.length) % slides.length; showSlide(currentSlide); }
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); nextSlide(); } 
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevSlide(); }
        });
        showSlide(currentSlide);
    </script>
</body>
</html>`;
}

function exportSlideshow() {
    const data = getSlideshowData();
    const htmlContent = generateSlideshowHTML(data);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Initialization ---

function init() {
    loadData();

    form.addEventListener('input', handleFormInput);
    themeSelector.addEventListener('change', (e) => {
        applyTheme(e.target.value);
        saveData();
    });
    exportBtn.addEventListener('click', exportSlideshow);

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    document.addEventListener('keydown', (e) => {
        // Don't interfere with typing in form fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
        }
    });
}

init();