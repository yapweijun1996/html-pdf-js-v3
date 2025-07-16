// html-to-pdf.js

window.waitForImagesLoaded = function(element) {
    const imgs = Array.from(element.querySelectorAll('img'));
    return Promise.all(
        imgs.map(img => {
            if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = img.onerror = resolve;
            });
        })
    );
}

// Converts all <canvas> in a parent element to <img> (in the clone)
function convertCanvasToImage(clone) {
    const canvases = clone.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        try {
            // Create equivalent image
            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            // Copy relevant attributes (optional)
            img.style.cssText = canvas.style.cssText;
            img.width = canvas.width;
            img.height = canvas.height;
            // Insert img, remove canvas
            canvas.parentNode.replaceChild(img, canvas);
        } catch (err) {
            // ignore if canvas is tainted
            console.warn('Canvas to image conversion failed:', err);
        }
    });
}

window.htmlToPdf = async function(selectorOrNode, filename = 'document.pdf') {
    let src = typeof selectorOrNode === 'string'
        ? document.querySelector(selectorOrNode)
        : selectorOrNode;
    if (!src) throw new Error('Target element not found');
    const clone = src.cloneNode(true);

    // Prepare clone for off-screen rendering
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-1';
    clone.style.width = src.offsetWidth + 'px';
    clone.style.background = '#fff';
    clone.style.minHeight = "1124px";
    document.body.appendChild(clone);

    // === NEW: Auto convert all canvas to img ===
    convertCanvasToImage(clone);

    // Wait for all images in clone to load
    await window.waitForImagesLoaded(clone);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [210, 297.1]
    });
    await pdf.html(clone, {
        autoPaging: 'text',
        width: 190,
        windowWidth: 794,
        x: 0,
        y: 0,
    });
    pdf.save(filename);
    document.body.removeChild(clone);
}
