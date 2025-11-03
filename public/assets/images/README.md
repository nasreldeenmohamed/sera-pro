# Logo Assets Directory

## Logo File Location

Place your high-resolution Sera Pro logo here:

**Required file:**
- `sera_pro_logo_hd.png` - High-resolution logo image

## File Requirements

- **Format:** PNG (with transparency support recommended)
- **Resolution:** High-resolution (at least 48x48px for favicon, 512x512px or higher for social sharing)
- **Optimization:** Compress the image for web while maintaining quality
- **Transparency:** PNG with alpha channel recommended for best appearance on all backgrounds

## Usage Locations

The logo is automatically used in:
1. **Header** - Top navigation bar (48x48px display)
2. **Footer** - Footer brand section (48x48px display)
3. **Favicon** - Browser tab icon
4. **Social Sharing** - Open Graph and Twitter Card images
5. **Apple Touch Icon** - iOS home screen icon

## File Path

Once uploaded, the logo will be accessible at:
```
/assets/images/sera_pro_logo_hd.png
```

## Favicon Setup (Browser Tab Icon)

**Important:** To show the logo in the browser tab, you need to create a favicon.ico file:

1. **Convert your logo to ICO format:**
   - Visit [favicon.io](https://favicon.io/) or [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Upload your `sera_pro_logo_hd.png`
   - Generate and download `favicon.ico`

2. **Replace the existing favicon:**
   - Location: `app/favicon.ico`
   - Replace the existing file with your new `favicon.ico`
   - Next.js automatically detects and uses this file

**Recommended sizes:** 16x16, 32x32, and 48x48 pixels included in the ICO file

See `FAVICON_SETUP.md` in this directory for detailed instructions.

## After Upload

1. Upload `sera_pro_logo_hd.png` to this directory
2. Create and replace `app/favicon.ico` (see Favicon Setup above)
3. Restart your development server if running
4. Clear browser cache to see the new logo (hard refresh: Cmd+Shift+R / Ctrl+Shift+R)
5. Test across all pages (home, dashboard, create-cv, etc.)
6. Verify logo appears in:
   - Header (all pages)
   - Footer (all pages)
   - Browser tab (favicon) ✅
   - Social media preview (when sharing links)

## Notes

- The logo uses Next.js Image component for automatic optimization
- Responsive sizing: 32px (mobile) to 40px (desktop) in header/footer
- Maintains aspect ratio automatically
- Optimized for both light and dark themes

