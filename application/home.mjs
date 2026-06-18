import { initTheme } from '../components/theme.js';
import { initSidebar } from '../components/sidebar.js';
import { initSearch } from '../components/search.js';
import { initNavigation } from '../components/navigation.js';
import { initArticleDetail } from '../components/articleDetail.js';
import { initToast } from '../components/toast.js';
import { createArticleCard } from '../components/articleCard.js';
import { loadManifest, loadAllSummaries, loadArticleDetail } from './loader.js';
import { onRouteChange, navigateToArticle, closeArticleRoute, parseArticleId } from './utils/router.js';
import { initGDPR } from '../components/gdpr.js';
import { renderComments } from '../components/comments.js';
import { renderEvents } from '../components/booking.js'


// ---------- 全局状态 ----------
let articles = [];            // 摘要数组（全量）
let manifest = null;
let detailCache = {};         // { [id]: contentHtml }
let isDataLoaded = false;     // 摘要是否加载完成
let currentPage = 'home';
let activeTag = null;
let articlesYearFilter = null;
let detailComponent = null;

// ---------- DOM 元素 ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const sidebar = $('#sidebar');
const sidebarOverlay = $('#sidebarOverlay');
const hamburgerBtn = $('#hamburgerBtn');
const sidebarCloseBtn = $('#sidebarCloseBtn');

const themeToggle = $('#themeToggle');
const themeIcon = $('#themeIcon');
const themeLabel = $('#themeLabel');
const hljsLight = $('#hljs-light');
const hljsDark = $('#hljs-dark');

const searchInput = $('#searchInput');
const searchClear = $('#searchClear');

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

const articleDetailOverlay = $('#articleDetailOverlay');
const articleDetailPanel = $('#articleDetailPanel');
const articleProgressBar = $('#articleProgressBar');
const panelBody = $('#panelBody');
const panelHeaderTitle = $('#panelHeaderTitle');
const panelCloseBtn = $('#panelCloseBtn');
const panelCopyLinkBtn = $('#panelCopyLinkBtn');
const panelShareBtn = $('#panelShareBtn');

const backToTop = $('#backToTop');
const toast = $('#toast');
const cookieBanner = $('#cookieBanner');
const cookieModalOverlay = $('#cookieModalOverlay');
const cookieModal = $('#cookieModal');
const cookieAnalytics = $('#cookieAnalytics');
const cookieMarketing = $('#cookieMarketing');
const cookieSettingsBtn = $('#cookieSettingsBtn');

// ---------- 代码高亮 ----------
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

// ---------- 文章数据访问 ----------
function getArticleById(id) {
    return articles.find(a => a.id === id);
}

// 获取文章详情内容（带内存缓存）
async function getArticleContent(articleId) {
    if (detailCache[articleId]) return detailCache[articleId];
    const data = await loadArticleDetail(articleId, manifest.detailFilePattern);
    detailCache[articleId] = data.contentHtml;
    return data.contentHtml;
}

// 异步打开文章（加载 contentHtml 后打开面板）
async function openArticleAsync(id) {
    if (!detailComponent) return;
    const article = getArticleById(id);
    if (!article) return;

    if (!article.contentHtml) {
        try {
            window.showToast?.('加载文章内容...');
            article.contentHtml = await getArticleContent(id);
        } catch (e) {
            window.showToast?.('文章加载失败');
            console.error(e);
            return;
        }
    }
    detailComponent.open(id);
}

// ---------- 渲染函数 ----------
function renderHomeArticles() {
    if (!isDataLoaded || !homeArticleList) return;
    homeArticleList.innerHTML = '';
    const featured = articles.filter(a => a.featured);
    const others = articles.filter(a => !a.featured);
    [...featured, ...others].slice(0, 4).forEach(a => {
        const card = createArticleCard(a, {
            onTagClick: (tag) => {
                navigation.navigateTo('tags');
                filterByTag(tag);
            },
            onCardClick: (id) => navigateToArticle(id)
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
            onTagClick: (tag) => {
                navigation.navigateTo('tags');
                filterByTag(tag);
            },
            onCardClick: (id) => navigateToArticle(id)
        }));
    });
    window.highlightAllCode();
}

function renderTimelineFilter() {
    if (!timelineFilter || !manifest) return;
    const years = Object.entries(manifest.years).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    let html = `<span class="timeline-filter-label"><i class="fa fa-clock-o"></i> 时间轴</span>`;
    html += `<button class="timeline-btn ${articlesYearFilter === null ? 'active' : ''}" data-year="all">全部 (${manifest.total})</button>`;
    years.forEach(([year, count]) => {
        html += `<button class="timeline-btn ${articlesYearFilter === parseInt(year) ? 'active' : ''}" data-year="${year}">${year} (${count})</button>`;
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
    if (!tagsCloud || !manifest) return;
    const tagCounts = manifest.tags;
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    tagsCloud.innerHTML = `<span class="tag-cloud-item ${activeTag === null ? 'active-tag' : ''}" data-tag="all">全部 (${manifest.total})</span>`;
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

async function loadAboutPageData() {
    try {
        const [comments, events] = await Promise.all([
            fetch('../data/notes/comments.json').then(r => r.json()),
            fetch('../data/notes/events.json').then(r => r.json())
        ]);
        renderComments($('#commentsList'), comments);
        renderEvents($('#eventsList'), events);
    } catch (err) {
        console.error('加载 about 数据失败:', err);
        window.showToast?.('加载留言/活动失败');
    }
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
                onTagClick: (t) => {
                    activeTag = t;
                    renderTagsCloud();
                    filterByTag(t);
                },
                onCardClick: (id) => navigateToArticle(id)
            }));
        });
    }
    window.highlightAllCode();
}

// ---------- 搜索回调 ----------
function onSearch(query) {
    if (!isDataLoaded) return;
    if (currentPage === 'home') {
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

// ---------- 页面导航 ----------
let navigation;
function onPageChange(page) {
    currentPage = page;
    activeTag = null;
    articlesYearFilter = null;
    searchInput.value = '';
    searchClear.classList.remove('visible');

    if (page === 'home') renderHomeArticles();
    else if (page === 'articles') { renderTimelineFilter(); renderAllArticles(); }
    else if (page === 'tags') renderTagsCloud();
    else if (page === 'about') loadAboutPageData();

    if (detailComponent && detailComponent.getCurrentId() !== null) {
        closeArticleRoute();
    }
}

// ---------- 路由监听 ----------
function setupRouter() {
    onRouteChange(async (path) => {
        const articleId = parseArticleId(path);
        if (articleId !== null) {
            await openArticleAsync(articleId);
        } else {
            if (detailComponent && detailComponent.getCurrentId() !== null) {
                detailComponent.close();
            }
        }
    });
}

// ---------- 应用初始化 ----------
async function initApp() {
    // 基础组件初始化
    initToast(toast);
    initTheme({ themeToggle, themeIcon, themeLabel, hljsLight, hljsDark });
    const { open: openSidebar, close: closeSidebar } = initSidebar({ sidebar, sidebarOverlay, hamburgerBtn, sidebarCloseBtn });
    initGDPR({
        banner: cookieBanner,
        modalOverlay: cookieModalOverlay,
        modal: cookieModal,
        analyticsCheckbox: cookieAnalytics,
        marketingCheckbox: cookieMarketing,
        settingsBtn: cookieSettingsBtn
    });
    navigation = initNavigation({ pageTitle, logoHome, navLinks, pageContents, onPageChange });
    initSearch({ searchInput, searchClear, onSearch });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => backToTop.classList.toggle('visible', window.scrollY > 400), { passive: true });

    // 加载 manifest
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    try {
        manifest = await loadManifest();
        articleCountBadge.textContent = manifest.total;
    } catch (err) {
        console.error(err);
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        retryLoadBtn.addEventListener('click', initApp);
        return;
    }

    // 加载所有摘要（使用并发控制 6）
    try {
        articles = await loadAllSummaries(manifest, 6);
        isDataLoaded = true;
        loadingState.style.display = 'none';
    } catch (err) {
        console.error(err);
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        retryLoadBtn.addEventListener('click', initApp);
        return;
    }

    // 初始化文章详情面板（需要传入异步打开方法供组件内部使用）
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
        onClose: () => closeArticleRoute(),
        onTagNav: (tag) => {
            navigation.navigateTo('tags');
            activeTag = tag;
            renderTagsCloud();
        },
        getArticleByIdFn: getArticleById,
        openArticleAsync, // 传入异步加载入口
    });

    setupRouter();

    // 初始渲染首页
    renderHomeArticles();
    window.highlightAllCode();

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            if (!detailComponent.getCurrentId()) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        }
    });

    console.log('%c🚀 CodeBlog 已就绪（摘要/详情分离）', 'font-weight:bold;color:#0066cc;');
}


// debugger
initApp();