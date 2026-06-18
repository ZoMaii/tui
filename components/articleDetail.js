import { escapeHtml, estimateReadingTime, getRelatedArticles, getLatestArticleId } from '../application/utils/helpers.js';
import { navigateToArticle, closeArticleRoute } from '../application/utils/router.js';

export function initArticleDetail({
    articles,
    overlay,
    panel,
    progressBar,
    panelBody,
    panelHeaderTitle,
    panelCloseBtn,
    panelCopyLinkBtn,
    panelShareBtn,
    onClose,
    onTagNav,
    getArticleByIdFn,
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
        // ---------- 时效链优化提示 ----------
        let outdatedHtml = '';
        if (article.new && typeof article.new === 'number') {
            const directNew = getArticleByIdFn(article.new);
            const latestId = getLatestArticleId(articles, article.id);
            const latestNew = getArticleByIdFn(latestId);

            if (directNew && directNew.id !== article.id) {
                outdatedHtml = `
                    <div class="outdated-notice">
                        <i class="fa fa-exclamation-triangle"></i>
                        <div class="outdated-text">
                            <strong>此内容可能过时</strong>
                            <p class="outdated-links">
                                <span>新版本：<a class="new-article-link" href="#" data-new-id="${directNew.id}">${escapeHtml(directNew.title)}</a></span>
                                ${(latestNew && latestNew.id !== directNew.id) ? 
                                    `<span>最新：<a class="new-article-link" href="#" data-new-id="${latestNew.id}">${escapeHtml(latestNew.title)}</a></span>` 
                                    : ''}
                            </p>
                        </div>
                    </div>`;
            } else {
                if (latestNew && latestNew.id !== article.id) {
                    outdatedHtml = `
                        <div class="outdated-notice">
                            <i class="fa fa-exclamation-triangle"></i>
                            <div class="outdated-text">
                                <strong>此内容可能过时</strong>
                                <p>最新版本：<a class="new-article-link" href="#" data-new-id="${latestNew.id}">${escapeHtml(latestNew.title)}</a></p>
                            </div>
                        </div>`;
                }
            }
        }

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

        let html = outdatedHtml;
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

        // 绑定时效链链接
        panelBody.querySelectorAll('.new-article-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const newId = parseInt(link.dataset.newId, 10);
                if (newId) navigateToArticle(newId);
            });
        });

        // 目录链接
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
                if (targetId) navigateToArticle(targetId);
            });
        });
    };

    const openPanel = (id) => {
        if (isAnimating) return;
        const article = getArticleByIdFn(id);
        if (!article) return;

        currentArticleId = id;
        isAnimating = true;

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
        setTimeout(() => {
            if (window.highlightCodeInElement) window.highlightCodeInElement(panelBody);
        }, 200);
    };

    const closePanel = () => {
        if (isAnimating) return;
        isAnimating = true;

        // 同步路由器状态
        closeArticleRoute();

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

    // 关闭按钮和遮罩
    panelCloseBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);
    panelBody.addEventListener('scroll', updateProgressBar, { passive: true });

    // ========== 通用复制函数（带移动端回退） ==========
    function copyToClipboard(text) {
        // 优先使用现代 API
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).then(() => true);
        }
        // 回退方案：创建临时 textarea
        return new Promise((resolve, reject) => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (successful) resolve(true);
                else reject(new Error('execCommand failed'));
            } catch (err) {
                document.body.removeChild(textarea);
                reject(err);
            }
        });
    }

    // 复制链接按钮事件
    panelCopyLinkBtn.addEventListener('click', () => {
        copyToClipboard(window.location.href)
            .then(() => window.showToast?.('🔗 文章链接已复制'))
            .catch(() => window.showToast?.('⚠️ 复制失败，请手动长按链接'));
    });

    // 分享按钮事件
    panelShareBtn.addEventListener('click', () => {
        const article = currentArticleId ? getArticleByIdFn(currentArticleId) : null;
        const title = article ? article.title : 'CodeBlog 文章';
        const url = window.location.href;

        if (navigator.share) {
            navigator.share({ title, url })
                .catch(() => {
                    // 分享失败时回退为复制链接
                    copyToClipboard(url)
                        .then(() => window.showToast?.('🔗 链接已复制，可粘贴分享'))
                        .catch(() => window.showToast?.('⚠️ 分享失败'));
                });
        } else {
            // 不支持分享 API，直接复制
            copyToClipboard(url)
                .then(() => window.showToast?.('🔗 链接已复制，可粘贴分享'))
                .catch(() => window.showToast?.('⚠️ 复制失败'));
        }
    });

    // 键盘 ESC 关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentArticleId !== null) {
            e.preventDefault();
            closePanel();
        }
    });

    return { open: openPanel, close: closePanel, getCurrentId: () => currentArticleId };
}