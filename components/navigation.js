export function initNavigation({
    pageTitle,
    logoHome,
    navLinks,
    pageContents,
    onPageChange
}) {
    const titles = { home: '最近发布', articles: '所有文章', tags: '分类标签', about: '关于我' };

    const navigateTo = (page) => {
        // 更新导航激活状态
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-page') === page);
        });
        // 切换页面内容
        pageContents.forEach(el => el.classList.remove('active'));
        const target = document.querySelector(`#page-${page}`);
        if (target) target.classList.add('active');
        // 更新标题
        if (pageTitle) pageTitle.textContent = titles[page] || page;
        // 回调通知外部
        if (onPageChange) onPageChange(page);
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Logo 点击
    logoHome.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('home');
    });

    // 导航链接点击
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navigateTo(link.getAttribute('data-page'));
        });
    });

    return { navigateTo };
}