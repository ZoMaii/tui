/**
 * 通用工具函数
 */

// HTML 转义
export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 估算阅读时间（中文 ~400字/分钟）
export function estimateReadingTime(article) {
    const text = (article.desc || '') + (article.contentHtml || '').replace(/<[^>]*>/g, '');
    return Math.max(1, Math.ceil(text.length / 400));
}

// 获取相关文章（基于标签交集排序）
export function getRelatedArticles(articles, currentId, count = 3) {
    const current = articles.find(a => a.id === currentId);
    if (!current) return [];
    const scored = articles
        .filter(a => a.id !== currentId)
        .map(a => {
            const overlap = a.tags.filter(t => current.tags.includes(t)).length;
            return { article: a, score: overlap };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || new Date(b.article.date) - new Date(a.article.date));
    return scored.slice(0, count).map(item => item.article);
}