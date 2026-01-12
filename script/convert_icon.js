const { nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

try {
    const iconPath = path.join(__dirname, '../build/icon.png');
    console.log('Reading icon from:', iconPath);

    const img = nativeImage.createFromPath(iconPath);

    if (img.isEmpty()) {
        console.error('Failed to load image. It might be invalid.');
        process.exit(1);
    }

    const pngBuffer = img.toPNG();
    const outPath = path.join(__dirname, '../build/icon_fixed.png');
    fs.writeFileSync(outPath, pngBuffer);
    console.log('Wrote fixed PNG to:', outPath);
    process.exit(0);
} catch (error) {
    console.error(error);
    process.exit(1);
}
