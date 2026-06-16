const STORAGE_KEY = 'cookieConsent';

// 检查是否已同意（返回存储的对象或 null）
function getConsent() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

function setConsent(necessary, analytics, marketing) {
    const value = {
        necessary: true, // 始终开启
        analytics: !!analytics,
        marketing: !!marketing,
        timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return value;
}

export function initGDPR({
    banner,
    modalOverlay,
    modal,
    analyticsCheckbox,
    marketingCheckbox,
    settingsBtn
}) {
    const consent = getConsent();

    // 显示横幅（仅在从未选择时）
    if (!consent && banner) {
        banner.style.display = 'flex';
    }

    // 隐藏横幅
    function hideBanner() {
        if (banner) banner.style.display = 'none';
    }

    // 关闭模态
    function closeModal() {
        if (modalOverlay) modalOverlay.style.display = 'none';
        if (modal) modal.style.display = 'none';
    }

    // 打开模态
    function openModal() {
        if (modalOverlay) modalOverlay.style.display = 'block';
        if (modal) modal.style.display = 'block';
        // 根据当前同意状态设置复选框
        const current = getConsent();
        if (current) {
            if (analyticsCheckbox) analyticsCheckbox.checked = !!current.analytics;
            if (marketingCheckbox) marketingCheckbox.checked = !!current.marketing;
        } else {
            if (analyticsCheckbox) analyticsCheckbox.checked = false;
            if (marketingCheckbox) marketingCheckbox.checked = false;
        }
    }

    // 绑定横幅按钮
    if (banner) {
        banner.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (!action) return;
            switch (action) {
                case 'accept-all':
                    setConsent(true, true, true);
                    hideBanner();
                    break;
                case 'essential-only':
                    setConsent(true, false, false);
                    hideBanner();
                    break;
                case 'open-settings':
                    hideBanner();
                    openModal();
                    break;
            }
        });
    }

    // 绑定设置面板按钮
    if (modal) {
        modal.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'save-preferences') {
                const analytics = analyticsCheckbox ? analyticsCheckbox.checked : false;
                const marketing = marketingCheckbox ? marketingCheckbox.checked : false;
                setConsent(true, analytics, marketing);
                closeModal();
            } else if (action === 'close-modal') {
                closeModal();
            }
        });
    }

    // 点击遮罩关闭
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // 侧边栏设置按钮
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openModal);
    }

    return {
        getConsent,
        openSettings: openModal
    };
}