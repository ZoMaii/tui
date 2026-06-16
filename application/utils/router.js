/**
 * 简易 SPA 路由器，支持 hash 和 history 两种模式
 */
const MODE = 'hash'; // 可改为 'history' 启用路径模式

const listeners = [];

function getCurrentPath() {
    if (MODE === 'history') {
        return window.location.pathname + window.location.search;
    }
    return window.location.hash.slice(1) || '/';
}

function notifyListeners(path) {
    listeners.forEach(fn => fn(path));
}

function handlePopState() {
    notifyListeners(getCurrentPath());
}

// 初始化监听
if (MODE === 'history') {
    window.addEventListener('popstate', handlePopState);
} else {
    window.addEventListener('hashchange', handlePopState);
}

export function onRouteChange(fn) {
    listeners.push(fn);
    // 立即触发一次初始路由
    fn(getCurrentPath());
}

export function navigateToArticle(id) {
    const path = `/article/${id}`;
    if (MODE === 'history') {
        window.history.pushState({}, '', path);
        notifyListeners(path);
    } else {
        window.location.hash = `article-${id}`;
        // hashchange 会自动触发
    }
}

export function closeArticleRoute() {
    if (MODE === 'history') {
        window.history.pushState({}, '', '/');
        notifyListeners('/');
    } else {
        // 移除 hash 中的文章 ID
        if (window.location.hash.startsWith('#article-')) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        notifyListeners(getCurrentPath());
    }
}

// 从路径中提取文章 ID，失败返回 null
export function parseArticleId(path) {
    if (MODE === 'history') {
        const match = path.match(/^\/article\/(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
    } else {
        const match = path.match(/^article-(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
    }
}