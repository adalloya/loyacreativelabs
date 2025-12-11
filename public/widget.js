
(function () {
    // Configuration
    // const CHAT_URL = "http://localhost:3000/consultant?embed=true"; // DEV
    const CHAT_URL = "https://loya-creative-lab.vercel.app/consultant?embed=true"; // PROD
    const PRIMARY_COLOR = "#9333ea"; // Purple-600

    // Create container
    const container = document.createElement('div');
    container.id = 'loya-ai-widget';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '999999';
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
    iframeContainer.style.overflow = 'hidden';
    iframeContainer.style.opacity = '0';
    iframeContainer.style.transform = 'translateY(20px) scale(0.95)';
    iframeContainer.style.transformOrigin = 'bottom right';
    iframeContainer.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    iframeContainer.style.pointerEvents = 'none'; // Click-through when hidden
    iframeContainer.style.background = '#000'; // Fallback

    // The Iframe
    const iframe = document.createElement('iframe');
    iframe.src = CHAT_URL;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = 'transparent';
    iframeContainer.appendChild(iframe);

    // Create Bubble Button
    const button = document.createElement('button');
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
    button.style.position = 'absolute';
    button.style.bottom = '0';
    button.style.right = '0';

    // Hover effect
    button.onmouseover = () => button.style.transform = 'scale(1.05)';
    button.onmouseout = () => button.style.transform = 'scale(1)';

    // Icon (Chat Bubble)
    const iconSVG = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33793 17.0174L2.5 21.5L7.22851 20.2293C8.68117 21.3656 10.2888 22 12 22Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    // Close Icon (X)
    const closeSVG = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    button.innerHTML = iconSVG;

    // State
    let isOpen = false;

    // Toggle Logic
    button.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            // OPEN
            iframeContainer.style.opacity = '1';
            iframeContainer.style.transform = 'translateY(0) scale(1)';
            iframeContainer.style.pointerEvents = 'all';
            button.innerHTML = closeSVG;
            button.style.background = '#000'; // Black when open
        } else {
            // CLOSE
            iframeContainer.style.opacity = '0';
            iframeContainer.style.transform = 'translateY(20px) scale(0.95)';
            iframeContainer.style.pointerEvents = 'none';
            button.innerHTML = iconSVG;
            button.style.background = PRIMARY_COLOR;
        }
    };

    // Assemble
    container.appendChild(iframeContainer);
    container.appendChild(button);
    document.body.appendChild(container);

})();
