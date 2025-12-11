
(function () {
    // PREVENT RECURSION: Don't run inside an iframe, if already loaded, OR if we are on the consultant page itself
    if (window.self !== window.top || document.getElementById('loya-ai-widget') || window.location.href.includes('/consultant')) return;

    // Configuration
    const currentScript = document.currentScript;
    const scriptUrl = new URL(currentScript.src);
    const BASE_URL = scriptUrl.origin;
    const CHAT_URL = `${BASE_URL}/consultant?embed=true`;

    const PRIMARY_COLOR = "#9333ea"; // Purple-600

    // Icon (Chat Bubble)
    const iconSVG = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33793 17.0174L2.5 21.5L7.22851 20.2293C8.68117 21.3656 10.2888 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    // Create container
    // STRATEGY: Zero-size container fixed at bottom-right.
    // Use flexbox to align children (button and chat) to bottom-right.
    // Overflow visible allows children to be seen.
    // Pointer-events none on container allows clicks to pass through to page.
    const container = document.createElement('div');
    container.id = 'loya-ai-widget';
    container.style.position = 'fixed';
    container.style.bottom = 'calc(20px + env(safe-area-inset-bottom))'; // iOS Safe Area
    container.style.right = '20px';
    container.style.width = '0';
    container.style.height = '0';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end'; // Align children to right
    container.style.justifyContent = 'flex-end'; // Align children to bottom
    container.style.overflow = 'visible';
    container.style.zIndex = '2147483647'; // Max Z-Index
    container.style.pointerEvents = 'none'; // CLICK-THROUGH
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Create Iframe Container (Hidden by default)
    const iframeContainer = document.createElement('div');
    iframeContainer.style.width = '380px';
    iframeContainer.style.height = '600px';
    iframeContainer.style.maxWidth = 'calc(100vw - 40px)';
    iframeContainer.style.maxHeight = 'calc(100vh - 100px)';
    iframeContainer.style.marginBottom = '16px';
    iframeContainer.style.borderRadius = '20px';
    iframeContainer.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)';
    iframeContainer.style.background = 'transparent';
    iframeContainer.style.transformOrigin = 'bottom right'; // Animate from button
    iframeContainer.style.pointerEvents = 'auto'; // Re-enable clicks
    iframeContainer.style.overflow = 'hidden'; // Rounded corners for iframe

    // Iframe
    const iframe = document.createElement('iframe');
    iframe.src = CHAT_URL;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = '#000'; // Fallback
    iframe.allow = "microphone; camera; autoplay";

    // Create Bubble Button
    const button = document.createElement('button');
    button.innerHTML = iconSVG;
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.borderRadius = '50%';
    button.style.background = PRIMARY_COLOR;
    button.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.4)';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.transition = 'transform 0.2s ease';
    button.style.pointerEvents = 'auto'; // Re-enable clicks

    // Hover effect
    button.onmouseover = () => button.style.transform = 'scale(1.05)';
    button.onmouseout = () => button.style.transform = 'scale(1)';

    // State
    let isOpen = false;

    // Toggle Function
    const toggleWidget = (open) => {
        isOpen = open;
        if (isOpen) {
            // OPEN
            iframeContainer.style.display = 'block';

            requestAnimationFrame(() => {
                iframeContainer.style.opacity = '1';
                iframeContainer.style.transform = 'translateY(0) scale(1)';

                button.style.opacity = '0';
                button.style.transform = 'scale(0)';
                button.style.pointerEvents = 'none';
            });
        } else {
            // CLOSE
            iframeContainer.style.opacity = '0';
            iframeContainer.style.transform = 'translateY(20px) scale(0.95)';

            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
            button.style.pointerEvents = 'auto'; // Clickable again

            // Wait for transition to finish before hiding display
            setTimeout(() => {
                if (!isOpen) iframeContainer.style.display = 'none';
            }, 300);
        }
    };

    // Initialize as hidden
    iframeContainer.style.display = 'none';
    iframeContainer.style.opacity = '0';
    iframeContainer.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';

    // Auto-Open if requested via URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('chat_open') === 'true') {
        setTimeout(() => toggleWidget(true), 500);
    }

    button.onclick = () => toggleWidget(true);

    // Listen for Close Message from Iframe
    window.addEventListener('message', (event) => {
        if (event.data === 'close-widget') {
            toggleWidget(false);
        }
    });

    // Assemble
    iframeContainer.appendChild(iframe);
    container.appendChild(iframeContainer);
    container.appendChild(button);
    document.body.appendChild(container);

})();
