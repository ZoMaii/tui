import { escapeHtml, estimateReadingTime } from '../application/utils/helpers.js';

/**
 * 创建文章卡片 DOM 元素
 * @param {object} article - 文章数据
 * @param {function} onTagClick - 点击标签时的回调(tag)
 * @param {function} onCardClick - 点击卡片主体时的回调(articleId)
 */
export function createArticleCard(article, { onTagClick, onCardClick }) {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.setAttribute('data-id', article.id);
    card.setAttribute('data-tags', article.tags.join(',').toLowerCase());
    card.setAttribute('data-title', article.title.toLowerCase());
    card.setAttribute('data-desc', article.desc.toLowerCase());
    card.setAttribute('data-category', article.category.toLowerCase());
    card.setAttribute('data-year', new Date(article.date).getFullYear());

    let html = `
        <div class="card-body">
            <h3 class="card-title">${escapeHtml(article.title)}</h3>
            <div class="card-meta">
                <span><i class="fa fa-calendar-o"></i> ${escapeHtml(article.date)}</span>
                <span><i class="fa fa-folder-o"></i> ${escapeHtml(article.category)}</span>
                <span style="font-size:11px;opacity:0.7;">📖 ${estimateReadingTime(article)} 分钟</span>
            </div>
            <p class="card-desc">${escapeHtml(article.desc)}</p>`;

    if (article.codeSnippet) {
        html += `<div class="code-block"><pre><code class="language-${article.codeLang || 'json'}">${escapeHtml(article.codeSnippet.trim())}</code></pre></div>`;
    }

    html += `<div class="card-tags">
        ${article.tags.map(tag => `<span class="card-tag" data-tag="${escapeHtml(tag.toLowerCase())}">${escapeHtml(tag)}</span>`).join('')}
    </div></div>`;

    card.innerHTML = html;

    // 事件委托
    card.addEventListener('click', (e) => {
        if (e.target.classList.contains('card-tag')) {
            e.stopPropagation();
            const tag = e.target.getAttribute('data-tag');
            if (onTagClick) onTagClick(tag);
            return;
        }
        if (onCardClick) onCardClick(article.id);
    });

    return card;
}