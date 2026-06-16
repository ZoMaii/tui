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

/**
 * 沿文章时效链找到最终版本 ID
 * @param {Array} articles - 全部文章数据
 * @param {number} startId   - 起始文章 ID
 * @returns {number} 链末端文章 ID，若无法找到或出现环则返回 startId 本身
 */
export function getLatestArticleId(articles, startId) {
    const visited = new Set();
    let currentId = startId;
    while (currentId) {
        if (visited.has(currentId)) break; // 检测到环，停止
        visited.add(currentId);
        const article = articles.find(a => a.id === currentId);
        if (!article || !article.new) break;
        // 跳过无效指向
        const nextId = article.new;
        if (typeof nextId !== 'number' || nextId === currentId) break;
        currentId = nextId;
    }
    return currentId;
}