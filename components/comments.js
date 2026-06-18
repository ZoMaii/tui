import { escapeHtml } from '../application/utils/helpers.js';

/**
 * 渲染留言列表，超出 visibleCount 时启用轮播
 * @param {HTMLElement} container  留言容器
 * @param {Array}       comments   留言数据
 * @param {object}      options    { visibleCount: 3, speed: 3000 }
 */
export function renderComments(container, comments, options = {}) {
    if (!container) return;

    const { visibleCount = 3, speed = 3000 } = options;
    const USE_CAROUSEL = comments.length > visibleCount;

    if (comments.length === 0) {
        container.innerHTML = '<p class="empty-hint">暂无留言，快来发表第一条吧！</p>';
        return;
    }

    // 生成全部原始卡片 HTML
    const cardsHtml = comments.map(c => createCommentHTML(c)).join('');

    if (!USE_CAROUSEL) {
        container.innerHTML = cardsHtml;
        return;
    }

    // 轮播模式：克隆前 visibleCount 条追加到末尾，保证循环
    const cloneCount = Math.min(visibleCount, comments.length);
    const clonedHtml = comments.slice(0, cloneCount).map(c => createCommentHTML(c)).join('');
    container.innerHTML = `
        <div class="carousel-viewport" role="region" aria-live="polite" aria-label="留言轮播">
            <div class="carousel-track">${cardsHtml}${clonedHtml}</div>
        </div>`;

    // 启动轮播
    initCarousel(container, comments.length, visibleCount, speed);
}

function createCommentHTML(c) {
    return `
        <div class="comment-item">
            <div class="comment-header">
                <img class="comment-avatar" src="${escapeHtml(c.avatar)}" alt="${escapeHtml(c.author)}" onerror="this.style.display='none'">
                <div class="comment-meta">
                    <span class="comment-author">${escapeHtml(c.author)}</span>
                    <span class="comment-date">${escapeHtml(c.date)}</span>
                </div>
                <span class="comment-likes"><i class="fa fa-heart"></i> ${c.likes}</span>
            </div>
            <p class="comment-body">${escapeHtml(c.content)}</p>
        </div>`;
}

function initCarousel(container, totalReal, visibleCount, speed) {
    const viewport = container.querySelector('.carousel-viewport');
    const track = viewport.querySelector('.carousel-track');
    const items = track.querySelectorAll('.comment-item');
    if (items.length === 0) return;

    let currentIndex = 0;
    let itemHeight = 0;
    let timerId = null;
    let isPaused = false;

    // 获取动态高度（取第一个可见卡片的高度，并加上可能的 margin）
    function updateItemHeight() {
        const firstItem = items[0];
        itemHeight = firstItem.getBoundingClientRect().height + 
                     parseFloat(getComputedStyle(firstItem).marginBottom || 0);
        viewport.style.height = `${visibleCount * itemHeight}px`;
    }
    updateItemHeight();
    // 窗口大小变化时重新计算
    window.addEventListener('resize', updateItemHeight);

    // 移动动画
    function moveTo(index, animate = true) {
        track.style.transition = animate ? 'transform 0.5s ease' : 'none';
        track.style.transform = `translateY(-${index * itemHeight}px)`;
        currentIndex = index;
    }

    // 下一张
    function next() {
        if (isPaused) return;
        currentIndex++;
        moveTo(currentIndex, true);

        // 到达克隆区域末尾时，等待过渡结束后无缝重置
        if (currentIndex >= totalReal) {
            const onTransitionEnd = () => {
                track.removeEventListener('transitionend', onTransitionEnd);
                currentIndex = 0;
                moveTo(currentIndex, false);
                scheduleNext();
            };
            track.addEventListener('transitionend', onTransitionEnd);
        } else {
            scheduleNext();
        }
    }

    // 安排下一次切换
    function scheduleNext() {
        clearTimeout(timerId);
        timerId = setTimeout(next, speed);
    }

    // 暂停/恢复
    function pause() {
        isPaused = true;
        clearTimeout(timerId);
    }
    function resume() {
        isPaused = false;
        scheduleNext();
    }

    // 鼠标悬停控制
    viewport.addEventListener('mouseenter', pause);
    viewport.addEventListener('mouseleave', resume);

    // 触摸长按暂停（可选）
    viewport.addEventListener('touchstart', pause, { passive: true });
    viewport.addEventListener('touchend', resume);

    // 开始
    moveTo(0, false);
    scheduleNext();

    // 返回清理函数（供外部销毁）
    return () => {
        clearTimeout(timerId);
        window.removeEventListener('resize', updateItemHeight);
    };
}