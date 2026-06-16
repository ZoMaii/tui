import { escapeHtml, estimateReadingTime, getRelatedArticles } from '../application/utils/helpers.js';

export function initArticleDetail({
    articles,                // 当前文章数据（响应式引用，可能后续更新）
    overlay,
    panel,
    progressBar,
    panelBody,
    panelHeaderTitle,
    panelCloseBtn,
    panelCopyLinkBtn,
    panelShareBtn,
    onClose,                 // 关闭后回调
    onTagNav,                // 标签点击导航(tag)
    getArticleByIdFn,        // 获取文章的函数 (id) => article
}) {
    let currentArticleId = null;
    let isAnimating = false;

    const updateProgressBar = () => {
        if (!panelBody || !progressBar) return;
        const scrollTop = panelBody.scrollTop;
        const scrollHeight = panelBody.scrollHeight - panelBody.clientHeight;
        if (scrollHeight <= 0) {
            progressBar.style.width = '0%';
            return;
        }
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        progressBar.style.width = progress + '%';
    };

    const renderContent = (article) => {
        const readingTime = estimateReadingTime(article);
        const index = articles.findIndex(a => a.id === article.id);
        const prevArticle = index > 0 ? articles[index - 1] : null;
        const nextArticle = index < articles.length - 1 ? articles[index + 1] : null;
        const related = getRelatedArticles(articles, article.id, 3);

        // 生成目录
        const tocItems = [];
        const contentHtml = article.contentHtml || '';
        const headingRegex = /<h2\s+id="([^"]*)"[^>]*>(.*?)<\/h2>/gi;
        let match;
        while ((match = headingRegex.exec(contentHtml)) !== null) {
            tocItems.push({ id: match[1], title: match[2].replace(/<[^>]*>/g, '') });
        }

        let html = '';
        html += `<h1 class="article-detail-title">${escapeHtml(article.title)}</h1>`;
        html += `<div class="article-detail-meta">
            <span><i class="fa fa-calendar-o"></i> ${escapeHtml(article.date)}</span>
            <span><i class="fa fa-folder-o"></i> ${escapeHtml(article.category)}</span>
            <span class="reading-time"><i class="fa fa-clock-o"></i> ${readingTime} 分钟阅读</span>
        </div>`;
        html += `<div class="article-detail-tags">
            ${article.tags.map(tag => `<span class="card-tag" data-tag="${escapeHtml(tag.toLowerCase())}" style="cursor:pointer;">${escapeHtml(tag)}</span>`).join('')}
        </div>`;

        if (tocItems.length > 0) {
            html += `<div class="article-toc">
                <div class="article-toc-title"><i class="fa fa-list"></i> 目录</div>
                <ul class="article-toc-list">
                    ${tocItems.map(item => `<li><a href="#${item.id}" class="toc-link">${escapeHtml(item.title)}</a></li>`).join('')}
                </ul>
            </div>`;
        }

        html += '<hr class="article-divider">';
        html += `<div class="article-body-content">${article.contentHtml || '<p>' + escapeHtml(article.desc) + '</p>'}</div>`;
        html += '<hr class="article-divider">';

        html += `<div class="article-nav-row">`;
        if (prevArticle) {
            html += `<button class="article-nav-btn prev" data-article-id="${prevArticle.id}">
                <i class="fa fa-arrow-left"></i><div><div class="article-nav-label">上一篇</div><div class="article-nav-title">${escapeHtml(prevArticle.title)}</div></div></button>`;
        } else html += `<div></div>`;
        if (nextArticle) {
            html += `<button class="article-nav-btn next" data-article-id="${nextArticle.id}">
                <div><div class="article-nav-label">下一篇</div><div class="article-nav-title">${escapeHtml(nextArticle.title)}</div></div><i class="fa fa-arrow-right"></i></button>`;
        } else html += `<div></div>`;
        html += `</div>`;

        if (related.length > 0) {
            html += `<div class="related-articles">
                <div class="related-articles-title"><i class="fa fa-thumbs-up"></i> 相关推荐</div>
                <div class="related-articles-grid">
                    ${related.map(ra => `
                        <div class="related-card" data-article-id="${ra.id}">
                            <div class="related-card-title">${escapeHtml(ra.title)}</div>
                            <div class="related-card-date">${escapeHtml(ra.date)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        panelBody.innerHTML = html;

        // 目录链接点击
        panelBody.querySelectorAll('.toc-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetEl = panelBody.querySelector('#' + targetId);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // 标签点击 -> 导航到标签页
        panelBody.querySelectorAll('.article-detail-tags .card-tag').forEach(el => {
            el.addEventListener('click', () => {
                const tag = el.getAttribute('data-tag');
                closePanel();
                if (onTagNav) setTimeout(() => onTagNav(tag), 320);
            });
        });

        // 上下篇 / 相关文章点击
        panelBody.querySelectorAll('.article-nav-btn, .related-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = parseInt(btn.getAttribute('data-article-id'), 10);
                if (targetId) openPanel(targetId);
            });
        });
    };

    const openPanel = (id) => {
        if (isAnimating) return;
        const article = getArticleByIdFn(id);
        if (!article) return;

        currentArticleId = id;
        isAnimating = true;

        window.location.hash = `article-${id}`;
        panelHeaderTitle.textContent = article.title;
        renderContent(article);

        overlay.classList.remove('closing');
        panel.classList.remove('closing');
        overlay.classList.add('active');
        panel.classList.add('open');

        progressBar.style.width = '0%';
        panelBody.scrollTop = 0;
        document.body.classList.add('body-no-scroll');

        setTimeout(() => { isAnimating = false; }, 350);
        // 代码高亮由外部统一调用，这里延迟触发
        setTimeout(() => {
            if (window.highlightCodeInElement) window.highlightCodeInElement(panelBody);
        }, 200);
    };

    const closePanel = () => {
        if (isAnimating) return;
        isAnimating = true;

        if (window.location.hash.startsWith('#article-')) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        overlay.classList.add('closing');
        panel.classList.add('closing');
        overlay.classList.remove('active');
        panel.classList.remove('open');
        document.body.classList.remove('body-no-scroll');

        setTimeout(() => {
            overlay.classList.remove('closing');
            panel.classList.remove('closing');
            panelBody.innerHTML = '';
            currentArticleId = null;
            isAnimating = false;
            if (onClose) onClose();
        }, 300);
    };

    // 绑定事件
    panelCloseBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);
    panelBody.addEventListener('scroll', updateProgressBar, { passive: true });

    panelCopyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => window.showToast?.('🔗 文章链接已复制'))
            .catch(() => window.showToast?.('⚠️ 复制失败'));
    });

    panelShareBtn.addEventListener('click', () => {
        const article = currentArticleId ? getArticleByIdFn(currentArticleId) : null;
        const title = article ? article.title : 'CodeBlog 文章';
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title, url }).catch(() => {});
        } else {
            navigator.clipboard.writeText(url)
                .then(() => window.showToast?.('🔗 链接已复制，可粘贴分享'))
                .catch(() => window.showToast?.('⚠️ 分享失败'));
        }
    });

    // 监听 hash 变化
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        const match = hash.match(/^#article-(\d+)$/);
        if (match) {
            const id = parseInt(match[1], 10);
            if (getArticleByIdFn(id) && currentArticleId !== id) {
                openPanel(id);
            }
        } else if (currentArticleId !== null && !hash.startsWith('#article-')) {
            closePanel();
        }
    });

    // ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentArticleId !== null) {
            e.preventDefault();
            closePanel();
        }
    });

    return { open: openPanel, close: closePanel, getCurrentId: () => currentArticleId };
}