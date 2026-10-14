(function () {
    // PREVENT RECURSION
    if (window.self !== window.top || document.getElementById('imi-ai-widget') || window.location.href.includes('/imi')) return;

    // CONFIGURATION
    const currentScript = document.currentScript;
    const scriptUrl = currentScript && currentScript.src ? new URL(currentScript.src) : new URL(window.location.href);
    const BASE_URL = scriptUrl.origin;
    const CHAT_URL = `${BASE_URL}/imi?embed=true`;
    const PRIMARY_COLOR = "#0284c7"; // Cyan Industrial Blue

    // ICONS (Shield & Gauge Engineering icon)
    const iconSVG = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    // CONTAINER
    const container = document.createElement('div');
    container.id = 'imi-ai-widget';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';
    container.style.pointerEvents = 'none';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // IFRAME CONTAINER
    const iframeContainer = document.createElement('div');
    iframeContainer.style.width = '420px';
    iframeContainer.style.height = '640px';
    iframeContainer.style.maxWidth = 'calc(100vw - 32px)';
    iframeContainer.style.maxHeight = 'calc(100vh - 80px)';
    iframeContainer.style.marginBottom = '14px';
    iframeContainer.style.borderRadius = '18px';
    iframeContainer.style.boxShadow = '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,182,212,0.2)';
    iframeContainer.style.overflow = 'hidden';
    iframeContainer.style.pointerEvents = 'auto';
    iframeContainer.style.display = 'none';
    iframeContainer.style.opacity = '0';
    iframeContainer.style.transform = 'translateY(20px) scale(0.95)';
    iframeContainer.style.transformOrigin = 'bottom right';
    iframeContainer.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    const iframe = document.createElement('iframe');
    iframe.src = CHAT_URL;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = '#020617';
    iframe.allow = "microphone; camera; autoplay";

    iframeContainer.appendChild(iframe);

    // LAUNCH BUTTON
    const button = document.createElement('button');
    button.innerHTML = iconSVG;
    button.style.width = '62px';
    button.style.height = '62px';
    button.style.borderRadius = '50%';
    button.style.background = 'linear-gradient(135deg, #0284c7 0%, #1e40af 100%)';
    button.style.boxShadow = '0 6px 25px rgba(2, 132, 199, 0.45)';
    button.style.border = '1px solid rgba(255,255,255,0.2)';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.pointerEvents = 'auto';
    button.style.transition = 'transform 0.2s, box-shadow 0.2s';
    button.setAttribute('title', 'Consultoría Técnica IMI (Calibración & Válvulas)');

    button.onmouseover = () => {
        button.style.transform = 'scale(1.06)';
        button.style.boxShadow = '0 8px 30px rgba(2, 132, 199, 0.65)';
    };
    button.onmouseout = () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 6px 25px rgba(2, 132, 199, 0.45)';
    };

    // BADGE PULSE
    const badge = document.createElement('span');
    badge.style.position = 'absolute';
    badge.style.top = '2px';
    badge.style.right = '2px';
    badge.style.width = '14px';
    badge.style.height = '14px';
    badge.style.background = '#10b981';
    badge.style.borderRadius = '50%';
    badge.style.border = '2px solid #0f172a';
    button.style.position = 'relative';
    button.appendChild(badge);

    // STATE MANAGEMENT
    let isOpen = false;

    const toggleWidget = (open) => {
        isOpen = open;
        if (isOpen) {
            iframeContainer.style.display = 'block';
            iframeContainer.offsetHeight; // reflow

            iframeContainer.style.opacity = '1';
            iframeContainer.style.transform = 'translateY(0) scale(1)';

            button.style.opacity = '0';
            button.style.transform = 'scale(0)';
            button.style.pointerEvents = 'none';
        } else {
            iframeContainer.style.opacity = '0';
            iframeContainer.style.transform = 'translateY(20px) scale(0.95)';

            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
            button.style.pointerEvents = 'auto';

            setTimeout(() => {
                if (!isOpen) iframeContainer.style.display = 'none';
            }, 300);
        }
    };

    button.onclick = () => toggleWidget(true);

    // MESSAGE LISTENER
    window.addEventListener('message', (event) => {
        if (event.data === 'close-imi-widget' || event.data === 'close-widget') {
            toggleWidget(false);
        }
    });

    // AUTO OPEN
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('imi_chat_open') === 'true') {
        setTimeout(() => toggleWidget(true), 500);
    }

    // INJECT
    container.appendChild(iframeContainer);
    container.appendChild(button);
    document.body.appendChild(container);

})();
