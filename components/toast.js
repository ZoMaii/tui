let toastTimer = null;

export function initToast(toastElement) {
    window.showToast = (msg) => {
        if (!toastElement) return;
        if (toastTimer) clearTimeout(toastTimer);
        toastElement.textContent = msg;
        toastElement.classList.add('show');
        toastTimer = setTimeout(() => toastElement.classList.remove('show'), 2000);
    };
}