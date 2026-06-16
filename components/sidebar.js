export function initSidebar({ sidebar, sidebarOverlay, hamburgerBtn, sidebarCloseBtn }) {
    const open = () => {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    hamburgerBtn.addEventListener('click', open);
    sidebarCloseBtn.addEventListener('click', close);
    sidebarOverlay.addEventListener('click', close);

    // 响应式关闭
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900 && sidebar.classList.contains('open')) {
            close();
        }
    });

    return { open, close };
}