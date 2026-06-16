export function initTheme({ themeToggle, themeIcon, themeLabel, hljsLight, hljsDark }) {
    const updateUI = (theme) => {
        if (theme === 'dark') {
            themeIcon.className = 'fa fa-sun-o';
            themeLabel.textContent = '亮色模式';
            if (hljsLight) hljsLight.disabled = true;
            if (hljsDark) hljsDark.disabled = false;
        } else {
            themeIcon.className = 'fa fa-moon-o';
            themeLabel.textContent = '暗色模式';
            if (hljsLight) hljsLight.disabled = false;
            if (hljsDark) hljsDark.disabled = true;
        }
    };

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('codeblog-theme', theme);
        updateUI(theme);
        // 重新高亮
        setTimeout(() => {
            if (window.highlightAllCode) window.highlightAllCode();
        }, 100);
    };

    const toggleTheme = () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        window.showToast?.(newTheme === 'dark' ? '🌙 已切换暗色模式' : '☀️ 已切换亮色模式');
    };

    themeToggle.addEventListener('click', toggleTheme);

    // 初始化 UI 状态（不修改主题属性，只同步图标、文字和代码高亮样式）
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateUI(currentTheme);
}