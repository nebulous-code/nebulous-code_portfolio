# nebulouscode — icon packet

Generated from current Tweaks settings:
- bracketStyle: curly
- letterCase:   lower
- bracketColor: #2c5475
- letterColor:  #a8542e


## Files

- `logo.svg` — master vector, transparent background, 512×512 viewBox
- `logo-on-dark.svg` — same logo on Prussian blue (#0f1c2a) field
- `favicon.svg` — small-size favicon SVG (64×64 viewBox)
- `favicon.ico` — multi-resolution legacy favicon (16/32/48)
- `apple-touch-icon.png` — 180×180 on dark field, for iOS home screen
- `android-chrome-192.png`, `android-chrome-512.png` — PWA icons
- `png/logo-{16..512}.png` — raster sizes for any other use
- `site.webmanifest` — PWA manifest
- `head-snippet.html` — paste-ready <head> tags

## Install

1. Drop everything except this README and `head-snippet.html` into your site root.
2. Paste the contents of `head-snippet.html` into your <head>.

## Notes

PNG rasterization uses canvas + Departure Mono. If you need pixel-perfect
hinting at 16px / 32px, hand-tune those PNGs separately — the SVG and ICO
will still render correctly.
