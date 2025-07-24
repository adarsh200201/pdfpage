# PWA Icons Generation Guide

## Required Icon Sizes

Create the following icon files in this directory (`public/icons/`):

### Standard Icons

- `favicon.ico` (16x16, 32x32, 48x48 - multi-size ICO file)
- `icon-16x16.png`
- `icon-32x32.png`
- `icon-48x48.png`
- `icon-70x70.png` (Microsoft tile)
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-150x150.png` (Microsoft tile)
- `icon-152x152.png`
- `icon-167x167.png` (iPad Pro)
- `icon-180x180.png` (iPhone)
- `icon-192x192.png` (Android)
- `icon-310x150.png` (Microsoft wide tile)
- `icon-310x310.png` (Microsoft large tile)
- `icon-384x384.png`
- `icon-512x512.png` (Android, PWA)

### Screenshots for PWA Manifest

- `screenshot-desktop.png` (1280x720)
- `screenshot-mobile.png` (540x720)

## Design Guidelines

### Colors

- Primary: `#e5322d` (PdfPage brand red)
- Secondary: `#ffc233` (PdfPage brand yellow)
- Background: `#ffffff` (white)

### Icon Design

- Use the PDF page icon (📄) or custom PDF logo
- Ensure good contrast on both light and dark backgrounds
- Make it recognizable at small sizes (16x16)
- Follow platform guidelines:
  - **iOS**: Rounded corners will be applied automatically
  - **Android**: Use adaptive icons with safe zone
  - **Windows**: Square design with brand colors

### Maskable Icons

- Include 10% safe zone around edges
- Important content should be in the center 80%
- Test with circular, rounded, and square masks

## Quick Generation Tools

### Online Tools

1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
2. **RealFaviconGenerator**: https://realfavicongenerator.net/
3. **App Icon Generator**: https://appicon.co/

### Command Line Tools

```bash
# Using ImageMagick (if you have a source SVG/PNG)
convert source-icon.png -resize 16x16 icon-16x16.png
convert source-icon.png -resize 32x32 icon-32x32.png
convert source-icon.png -resize 48x48 icon-48x48.png
convert source-icon.png -resize 72x72 icon-72x72.png
convert source-icon.png -resize 96x96 icon-96x96.png
convert source-icon.png -resize 128x128 icon-128x128.png
convert source-icon.png -resize 144x144 icon-144x144.png
convert source-icon.png -resize 152x152 icon-152x152.png
convert source-icon.png -resize 167x167 icon-167x167.png
convert source-icon.png -resize 180x180 icon-180x180.png
convert source-icon.png -resize 192x192 icon-192x192.png
convert source-icon.png -resize 384x384 icon-384x384.png
convert source-icon.png -resize 512x512 icon-512x512.png

# For Microsoft tiles
convert source-icon.png -resize 70x70 icon-70x70.png
convert source-icon.png -resize 150x150 icon-150x150.png
convert source-icon.png -resize 310x310 icon-310x310.png
convert source-icon.png -resize 310x150 icon-310x150.png
```

### Using Node.js (pwa-asset-generator)

```bash
npm install -g pwa-asset-generator
pwa-asset-generator source-icon.svg public/icons --manifest public/manifest.json
```

## Testing Icons

### Tools

1. **PWA Builder**: https://www.pwabuilder.com/
2. **Lighthouse**: Built into Chrome DevTools
3. **Web App Manifest Validator**: https://manifest-validator.appspot.com/

### Manual Testing

1. Check all icon sizes display correctly
2. Test on different devices and browsers
3. Verify install prompts show correct icons
4. Test in standalone mode

## Current Status

❌ **Need to generate actual icon files**
✅ **Manifest configured**
✅ **HTML meta tags added**
✅ **Browserconfig.xml created**

## Next Steps

1. Create or source a high-quality base icon (1024x1024 SVG or PNG)
2. Generate all required sizes using tools above
3. Test PWA installation on multiple devices
4. Optimize icons for each platform's guidelines
