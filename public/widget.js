
(function () {
    // PREVENT RECURSION: Don't run inside an iframe, if already loaded, OR if we are on the consultant page itself
    if (window.self !== window.top || document.getElementById('loya-ai-widget') || window.location.href.includes('/consultant')) return;

    // Configuration
    const currentScript = document.currentScript;
    const isLocal = currentScript && (currentScript.src.includes('localhost') || currentScript.src.includes('127.0.0.1'));

    const CHAT_URL = isLocal
        ? "http://localhost:3000/consultant?embed=true"
        : "https://loya-creative-lab.vercel.app/consultant?embed=true";
    const PRIMARY_COLOR = "#9333ea"; // Purple-600

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
    // Style tweaks for Iframe Container (Allow overflow for close button)
    iframeContainer.style.overflow = 'visible'; // Was hidden, changed to visible
    iframeContainer.style.background = 'transparent'; // Remove black bg from container

    // The Iframe (Restored)
    const iframe = document.createElement('iframe');
    iframe.src = CHAT_URL;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = 'transparent';
    iframe.allow = "microphone; camera; autoplay";

    // Apply rounded corners to Iframe directly
    iframe.style.borderRadius = '20px';
    iframe.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)';
    iframe.style.background = '#000';

    // Create Close Button (Left Side Outside)
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = closeSVG;
    closeBtn.style.position = 'absolute';
    closeBtn.style.bottom = '0'; // Align bottom with chat
    closeBtn.style.left = '-60px'; // Move 60px to the left
    closeBtn.style.width = '48px';
    closeBtn.style.height = '48px';
    closeBtn.style.background = 'rgba(0,0,0,0.6)';
    closeBtn.style.borderRadius = '50%';
    closeBtn.style.border = '1px solid rgba(255,255,255,0.2)';
    closeBtn.style.color = 'white';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.display = 'flex';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.zIndex = '1000000';
    closeBtn.style.backdropFilter = 'blur(4px)';

    // Add hover effect
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 50, 50, 0.8)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(0,0,0,0.6)';

    // Create Bubble Button
    const button = document.createElement('button');
    button.innerHTML = iconSVG; // Ensure iconSVG is used here
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

    // State
    let isOpen = false;

    // Toggle Function
    const toggleWidget = (open) => {
        isOpen = open;
        if (isOpen) {
            // OPEN
            iframeContainer.style.display = 'block'; // Ensure it's in layout
            // RequestAnimationFrame to allow transition to play after display change
            requestAnimationFrame(() => {
                iframeContainer.style.opacity = '1';
                iframeContainer.style.transform = 'translateY(0) scale(1)';
                iframeContainer.style.pointerEvents = 'all';

                button.style.opacity = '0';
                button.style.transform = 'scale(0)';
                button.style.pointerEvents = 'none';
            });
        } else {
            // CLOSE
            iframeContainer.style.opacity = '0';
            iframeContainer.style.transform = 'translateY(20px) scale(0.95)';
            iframeContainer.style.pointerEvents = 'none';

            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
            button.style.pointerEvents = 'all';

            // Wait for transition to finish before hiding display
            setTimeout(() => {
                if (!isOpen) iframeContainer.style.display = 'none';
            }, 300);
        }
    };

    // Initialize as hidden
    iframeContainer.style.display = 'none';

    button.onclick = () => toggleWidget(true);
    closeBtn.onclick = () => toggleWidget(false);

    // Assemble
    // Append closeBtn to iframeContainer so it moves with it
    iframeContainer.appendChild(closeBtn);
    iframeContainer.appendChild(iframe);

    container.appendChild(iframeContainer);
    container.appendChild(button);
    document.body.appendChild(container);

})();
