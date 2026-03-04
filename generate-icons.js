const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#8b5cf6');
    
    // Rounded rectangle
    const radius = size * 0.1875;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Letter M
                                                                   rial`;
    ctx.textAlign = 'cent    ctx.textAlign = 'cent    ctx.textAlignctx.fillText('M', size * 0.5, size * 0.55);
    
    // Gr    // Gr    // Gr    const     // Gr    // Gr    // Gr    const     //si    // Gr    // Gr    // Gr    const  0.12;
                           x.                           x.                           x.     le                           x.          ct                           x.     t = `bold ${                           ctx.fillText('U', circleX, circleY + size * 0.01);
                        }

//////////////////////////////////able
try {
    sizes.forEach(size => {
        const canvas = createIcon(size);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`icons/icon-${size}.png`, buffer);
        console.log(`Generated icon-${size}.png`);
    });
    console.log('All icons generated!');
} catch (e) {
    console.log('Canvas module not available, icons need to be generated manually');
    console.log('Open generate-icons.html in a browser to generate icons');
}
