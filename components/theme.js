export function initTheme({ themeToggle, themeIcon, themeLabel, hljsLight, hljsDark }) {
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fa fa-sun-o';
            themeLabel.textContent = '亮色模式';
            if (hljsLight) hljsLight.disabled = true;
            if (hljsDark) hljsDark.disabled = false;
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.className = 'fa fa-moon-o';
            themeLabel.textContent = '暗色模式';
            if (hljsLight) hljsLight.disabled = false;
            if (hljsDark) hljsDark.disabled = true;
        }
        localStorage.setItem('codeblog-theme', theme);
        // 重新高亮所有代码
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

    // 初始化主题
    const saved = localStorage.getItem('codeblog-theme') || 'light';
    applyTheme(saved);
}