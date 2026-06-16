import { initTheme } from '../components/theme.js';
import { initSidebar } from '../components/sidebar.js';
import { initSearch } from '../components/search.js';
import { initNavigation } from '../components/navigation.js';
import { initArticleDetail } from '../components/articleDetail.js';
import { initToast } from '../components/toast.js';
import { createArticleCard } from '../components/articleCard.js';
import { loadArticles } from './loader.js';

// ---------- 全局状态 ----------
let articles = [];
let isDataLoaded = false;
let currentPage = 'home';
let activeTag = null;
let articlesYearFilter = null;
let currentArticleId = null;    // 由 detail 组件内部维护，这里仅作引用

// ---------- DOM 元素集合 ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 侧边栏
const sidebar = $('#sidebar');
const sidebarOverlay = $('#sidebarOverlay');
const hamburgerBtn = $('#hamburgerBtn');
const sidebarCloseBtn = $('#sidebarCloseBtn');

// 主题
const themeToggle = $('#themeToggle');
const themeIcon = $('#themeIcon');
const themeLabel = $('#themeLabel');
const hljsLight = $('#hljs-light');
const hljsDark = $('#hljs-dark');

// 搜索
const searchInput = $('#searchInput');
const searchClear = $('#searchClear');

// 页面容器
const pageTitle = $('#pageTitle');
const logoHome = $('#logoHome');
const navLinks = $$('.nav-link[data-page]');
const pageContents = $$('.page-content');
const articleCountBadge = $('#articleCountBadge');
const homeArticleList = $('#homeArticleList');
const allArticleList = $('#allArticleList');
const tagFilteredList = $('#tagFilteredList');
const tagsCloud = $('#tagsCloud');
const timelineFilter = $('#timelineFilter');
const loadingState = $('#loadingState');
const errorState = $('#errorState');
const retryLoadBtn = $('#retryLoadBtn');

// 文章详情面板
const articleDetailOverlay = $('#articleDetailOverlay');
const articleDetailPanel = $('#articleDetailPanel');
const articleProgressBar = $('#articleProgressBar');
const panelBody = $('#panelBody');
const panelHeaderTitle = $('#panelHeaderTitle');
const panelCloseBtn = $('#panelCloseBtn');
const panelCopyLinkBtn = $('#panelCopyLinkBtn');
const panelShareBtn = $('#panelShareBtn');

// 返回顶部
const backToTop = $('#backToTop');

// Toast
const toast = $('#toast');

// ---------- 代码高亮工具（挂载到 window 以便组件调用） ----------
window.highlightAllCode = () => {
    document.querySelectorAll('pre code').forEach(block => {
        if (block.classList.contains('hljs')) {
            block.classList.remove('hljs');
            block.removeAttribute('data-highlighted');
        }
    });
    if (typeof hljs !== 'undefined') hljs.highlightAll();
    addCopyButtons();
};

window.highlightCodeInElement = (el) => {
    el.querySelectorAll('pre code').forEach(block => {
        if (block.classList.contains('hljs')) {
            block.classList.remove('hljs');
            block.removeAttribute('data-highlighted');
        }
    });
    if (typeof hljs !== 'undefined') hljs.highlightAll();
    addCopyButtons();
};

function addCopyButtons() {
    document.querySelectorAll('.code-block').forEach(block => {
        if (block.querySelector('.code-copy-btn')) return;
        const btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.innerHTML = '<i class="fa fa-clipboard"></i>';
        btn.title = '复制代码';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const codeEl = block.querySelector('code');
            const codeText = codeEl ? codeEl.textContent || codeEl.innerText || '' : '';
            navigator.clipboard.writeText(codeText).then(() => {
                btn.classList.add('copied');
                btn.innerHTML = '<i class="fa fa-check"></i>';
                window.showToast?.('✅ 代码已复制');
                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = '<i class="fa fa-clipboard"></i>';
                }, 1800);
            }).catch(() => window.showToast?.('⚠️ 复制失败，请手动选择'));
        });
        block.appendChild(btn);
    });
}

// ---------- 渲染逻辑（与之前一致，但使用 articles 数组） ----------
function getArticleById(id) {
    return articles.find(a => a.id === id);
}

function renderHomeArticles() {
    if (!isDataLoaded || !homeArticleList) return;
    homeArticleList.innerHTML = '';
    const featured = articles.filter(a => a.featured);
    const others = articles.filter(a => !a.featured);
    [...featured, ...others].slice(0, 4).forEach(a => {
        const card = createArticleCard(a, {
            onTagClick: (tag) => {
                navigateTo('tags');
                filterByTag(tag);
            },
            onCardClick: (id) => detailComponent.open(id)
        });
        homeArticleList.appendChild(card);
    });
    window.highlightAllCode();
}

function getFilteredForAllPage() {
    let filtered = [...articles];
    if (articlesYearFilter !== null) {
        filtered = filtered.filter(a => new Date(a.date).getFullYear() === articlesYearFilter);
    }
    const query = searchInput?.value.trim().toLowerCase() || '';
    if (query) {
        filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(query) ||
            a.desc.toLowerCase().includes(query) ||
            a.tags.some(t => t.toLowerCase().includes(query)) ||
            a.category.toLowerCase().includes(query)
        );
    }
    return filtered;
}

function renderAllArticles() {
    if (!isDataLoaded || !allArticleList) return;
    const list = getFilteredForAllPage();
    allArticleList.innerHTML = '';
    if (list.length === 0) {
        allArticleList.innerHTML = `<div class="no-results"><i class="fa fa-search"></i><p>没有找到匹配的文章</p></div>`;
        return;
    }
    list.forEach(a => {
        allArticleList.appendChild(createArticleCard(a, {
            onTagClick: (tag) => { navigateTo('tags'); filterByTag(tag); },
            onCardClick: (id) => detailComponent.open(id)
        }));
    });
    window.highlightAllCode();
}

function renderTimelineFilter() {
    if (!isDataLoaded || !timelineFilter) return;
    const years = [...new Set(articles.map(a => new Date(a.date).getFullYear()))].sort((a, b) => b - a);
    let html = `<span class="timeline-filter-label"><i class="fa fa-clock-o"></i> 时间轴</span>`;
    html += `<button class="timeline-btn ${articlesYearFilter === null ? 'active' : ''}" data-year="all">全部 (${articles.length})</button>`;
    years.forEach(year => {
        const count = articles.filter(a => new Date(a.date).getFullYear() === year).length;
        html += `<button class="timeline-btn ${articlesYearFilter === year ? 'active' : ''}" data-year="${year}">${year} (${count})</button>`;
    });
    timelineFilter.innerHTML = html;
    timelineFilter.querySelectorAll('.timeline-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-year');
            articlesYearFilter = val === 'all' ? null : parseInt(val, 10);
            renderTimelineFilter();
            renderAllArticles();
        });
    });
}

function renderTagsCloud() {
    if (!isDataLoaded || !tagsCloud) return;
    const tagCounts = {};
    articles.forEach(a => a.tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    tagsCloud.innerHTML = `<span class="tag-cloud-item ${activeTag === null ? 'active-tag' : ''}" data-tag="all">全部 (${articles.length})</span>`;
    sorted.forEach(([tag, count]) => {
        const isActive = activeTag && activeTag.toLowerCase() === tag.toLowerCase();
        tagsCloud.innerHTML += `<span class="tag-cloud-item ${isActive ? 'active-tag' : ''}" data-tag="${tag.toLowerCase()}">${tag} (${count})</span>`;
    });
    tagsCloud.querySelectorAll('.tag-cloud-item').forEach(el => {
        el.addEventListener('click', () => {
            const tag = el.getAttribute('data-tag');
            activeTag = tag === 'all' ? null : tag;
            renderTagsCloud();
            filterByTag(activeTag);
        });
    });
    filterByTag(activeTag);
}

function filterByTag(tag) {
    if (!isDataLoaded || !tagFilteredList) return;
    let filtered = !tag ? [...articles] : articles.filter(a => a.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    const query = searchInput?.value.trim().toLowerCase() || '';
    if (query) {
        filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(query) ||
            a.desc.toLowerCase().includes(query) ||
            a.tags.some(t => t.toLowerCase().includes(query)) ||
            a.category.toLowerCase().includes(query)
        );
    }
    tagFilteredList.innerHTML = '';
    if (filtered.length === 0) {
        tagFilteredList.innerHTML = '<div class="no-results"><i class="fa fa-tag"></i><p>该标签下暂无文章</p></div>';
    } else {
        filtered.forEach(a => {
            tagFilteredList.appendChild(createArticleCard(a, {
                onTagClick: (t) => { activeTag = t; renderTagsCloud(); filterByTag(t); },
                onCardClick: (id) => detailComponent.open(id)
            }));
        });
    }
    window.highlightAllCode();
}

// ---------- 页面导航实现 ----------
function onPageChange(page) {
    currentPage = page;
    activeTag = null;
    articlesYearFilter = null;
    searchInput.value = '';
    searchClear.classList.remove('visible');

    if (page === 'home') renderHomeArticles();
    else if (page === 'articles') { renderTimelineFilter(); renderAllArticles(); }
    else if (page === 'tags') renderTagsCloud();
    // about 页无需渲染
}

// ---------- 搜索回调 ----------
function onSearch(query) {
    if (!isDataLoaded) return;
    if (currentPage === 'home') {
        // 首页卡片隐藏/显示
        if (!homeArticleList) return;
        const cards = homeArticleList.querySelectorAll('.article-card');
        let visible = 0;
        cards.forEach(card => {
            const title = card.getAttribute('data-title') || '';
            const desc = card.getAttribute('data-desc') || '';
            const tags = card.getAttribute('data-tags') || '';
            const category = card.getAttribute('data-category') || '';
            const match = !query || title.includes(query) || desc.includes(query) || tags.includes(query) || category.includes(query);
            card.style.display = match ? '' : 'none';
            if (match) visible++;
        });
        let noEl = homeArticleList.querySelector('.no-results');
        if (visible === 0 && query) {
            if (!noEl) {
                noEl = document.createElement('div');
                noEl.className = 'no-results';
                noEl.innerHTML = '<i class="fa fa-search"></i><p>没有找到匹配的文章</p>';
                homeArticleList.appendChild(noEl);
            }
        } else if (noEl) noEl.remove();
    } else if (currentPage === 'articles') {
        renderAllArticles();
    } else if (currentPage === 'tags') {
        filterByTag(activeTag);
    }
}

// 导航组件实例
let navigation;
let detailComponent;

// ---------- 初始化 ----------
async function initApp() {
    // 1. Toast（尽早可用）
    initToast(toast);

    // 2. 主题
    initTheme({ themeToggle, themeIcon, themeLabel, hljsLight, hljsDark });

    // 3. 侧边栏
    const { open: openSidebar, close: closeSidebar } = initSidebar({ sidebar, sidebarOverlay, hamburgerBtn, sidebarCloseBtn });

    // 4. 导航
    navigation = initNavigation({
        pageTitle,
        logoHome,
        navLinks,
        pageContents,
        onPageChange
    });

    // 5. 搜索
    initSearch({ searchInput, searchClear, onSearch });

    // 6. 返回顶部
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    // 7. 加载文章数据
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    try {
        articles = await loadArticles();
        isDataLoaded = true;
        loadingState.style.display = 'none';
        articleCountBadge.textContent = articles.length;
    } catch (err) {
        console.error(err);
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        retryLoadBtn.addEventListener('click', initApp);
        return;
    }

    // 8. 初始化详情面板（依赖 articles）
    detailComponent = initArticleDetail({
        articles,
        overlay: articleDetailOverlay,
        panel: articleDetailPanel,
        progressBar: articleProgressBar,
        panelBody,
        panelHeaderTitle,
        panelCloseBtn,
        panelCopyLinkBtn,
        panelShareBtn,
        onClose: () => { currentArticleId = null; },
        onTagNav: (tag) => {
            navigation.navigateTo('tags');
            activeTag = tag;
            renderTagsCloud();
        },
        getArticleByIdFn: getArticleById,
    });

    // 9. 键盘快捷键 (Ctrl+K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            if (!detailComponent.getCurrentId()) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        }
        // ESC 已由 detail 组件处理
    });

    // 10. 初始渲染
    renderHomeArticles();
    window.highlightAllCode();

    console.log('%c🚀 CodeBlog 已就绪 %c| 按 Ctrl+K 快速搜索 %c| 点击卡片打开文章',
        'font-weight:bold;color:#0066cc;', 'color:#6a737d;', 'color:#28a745;');

    // 11. 检查初始 hash
    const hash = window.location.hash;
    const match = hash.match(/^#article-(\d+)$/);
    if (match) {
        const id = parseInt(match[1], 10);
        if (getArticleById(id)) setTimeout(() => detailComponent.open(id), 400);
    }
}

// 启动应用
initApp();

// 暴露调试接口
window.CodeBlog = {
    get articles() { return articles; },
    navigateTo: (page) => navigation?.navigateTo(page),
};