# Favicon Setup Instructions

## Browser Tab Icon (Favicon)

To display your logo in the browser tab, you have two options:

### Option 1: Replace app/favicon.ico (Recommended for best compatibility)

1. **Convert your logo to ICO format:**
   - Use an online tool like [favicon.io](https://favicon.io/) or [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Upload your `sera_pro_logo_hd.png`
   - Generate favicon.ico file (should include 16x16, 32x32, and optionally 48x48 sizes)

2. **Replace the existing favicon:**
   - Location: `app/favicon.ico`
   - Simply replace the existing file with your new favicon.ico
   - Next.js App Router automatically detects and uses this file

3. **Advantages:**
   - Works across all browsers automatically
   - No additional configuration needed
   - Next.js handles it automatically

### Option 2: Use PNG directly (Current Setup)

The metadata is already configured to use your logo PNG file directly. This works, but ICO format is more widely supported for favicons.

**Current setup uses:** `/assets/images/sera_pro_logo_hd.png`

## File Locations Summary

1. **Logo (Header/Footer):** `public/assets/images/sera_pro_logo_hd.png`
2. **Favicon (Browser Tab):** `app/favicon.ico` (replace existing file)

## Recommended Favicon Sizes

For best results, create favicon.ico with:
- 16x16 pixels (standard favicon)
- 32x32 pixels (high-DPI displays)
- 48x48 pixels (optional, for some contexts)

## After Setup

1. Upload/replace the files
2. Restart dev server (if running)
3. Clear browser cache (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
4. Check browser tab - logo should appear

## Tools

- [favicon.io](https://favicon.io/) - Generate favicon from PNG
- [RealFaviconGenerator](https://realfavicongenerator.net/) - Comprehensive favicon generator with all sizes
- [Favicon Generator](https://www.favicon-generator.org/) - Simple online generator

