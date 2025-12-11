(function () {
    // PREVENT RECURSION
    if (window.self !== window.top || document.getElementById('loya-ai-widget') || window.location.href.includes('/consultant')) return;

    // CONFIGURATION
    const currentScript = document.currentScript;
    const scriptUrl = new URL(currentScript.src);
    const BASE_URL = scriptUrl.origin;
    const CHAT_URL = `${BASE_URL}/consultant?embed=true`;
    const PRIMARY_COLOR = "#9333ea";

    // ICONS
    const iconSVG = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33793 17.0174L2.5 21.5L7.22851 20.2293C8.68117 21.3656 10.2888 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    // CONTAINER (Pass-through clicks)
    const container = document.createElement('div');
    container.id = 'loya-ai-widget';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';
    container.style.pointerEvents = 'none'; // CRITICAL: Allows clicking content behind
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // IFRAME CONTAINER
    const iframeContainer = document.createElement('div');
    iframeContainer.style.width = '380px';
    iframeContainer.style.height = '600px';
    iframeContainer.style.maxWidth = 'calc(100vw - 40px)';
    iframeContainer.style.maxHeight = 'calc(100vh - 100px)';
    iframeContainer.style.marginBottom = '16px';
    iframeContainer.style.borderRadius = '20px';
    iframeContainer.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
    iframeContainer.style.overflow = 'hidden';
    iframeContainer.style.pointerEvents = 'auto'; // Re-enable clicks
    iframeContainer.style.display = 'none'; // Start hidden
    iframeContainer.style.opacity = '0';
    iframeContainer.style.transform = 'translateY(20px) scale(0.95)';
    iframeContainer.style.transformOrigin = 'bottom right';
    iframeContainer.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

    const iframe = document.createElement('iframe');
    iframe.src = CHAT_URL;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = '#000';
    iframe.allow = "microphone; camera; autoplay";

    iframeContainer.appendChild(iframe);

    // LAUNCH BUTTON
    const button = document.createElement('button');
    button.innerHTML = iconSVG;
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '50%';
    button.style.background = PRIMARY_COLOR;
    button.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.5)';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.pointerEvents = 'auto'; // Re-enable clicks
    button.style.transition = 'transform 0.2s';

    button.onmouseover = () => button.style.transform = 'scale(1.05)';
    button.onmouseout = () => button.style.transform = 'scale(1)';

    // STATE MANAGEMENT
    let isOpen = false;

    const toggleWidget = (open) => {
        isOpen = open;
        if (isOpen) {
            iframeContainer.style.display = 'block';
            // Force reflow
            iframeContainer.offsetHeight;

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

    // MESSAGE LISTENER (From Internal Close Button)
    window.addEventListener('message', (event) => {
        if (event.data === 'close-widget') {
            toggleWidget(false);
        }
    });

    // AUTO OPEN
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('chat_open') === 'true') {
        setTimeout(() => toggleWidget(true), 500);
    }

    // INJECT
    container.appendChild(iframeContainer);
    container.appendChild(button);
    document.body.appendChild(container);

})();
