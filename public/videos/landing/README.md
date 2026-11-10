# Da Nang Son Tra Peninsula Cinematic Video Background Asset Provenance

## Asset Metadata
- **Subject Location:** Son Tra Peninsula & Son Tra Lighthouse, Da Nang, Vietnam (Bán đảo Sơn Trà & Hải Đăng Sơn Trà, TP. Đà Nẵng)
- **Source Platform:** Pexels (Verified Free Stock Video)
- **Source Page:** https://www.pexels.com/video/scenic-aerial-view-of-coastal-lighthouse-clifftop-30084777/
- **Creator:** NGUYỄN THÀNH NHƠN
- **Creator Profile:** https://www.pexels.com/@nguy-n-thanh-nh-n-203569019/
- **License Type:** Pexels License
- **License Terms:** https://www.pexels.com/license/
  - Free to use for commercial and non-commercial purposes.
  - Attribution not legally required, but credited here for provenance integrity.
  - Modification allowed.

## Original Asset Characteristics
- **Resolution:** 1920×1080 (Full HD)
- **Frame Rate:** 29.97 FPS
- **Original Duration:** 30.00 seconds
- **Original File Size:** 38,439,216 bytes (38.4 MB)
- **Audio:** None / stripped

## Final Optimized Assets
Trimmed to the prime 10.0-second smooth forward coastal glide over Son Tra cliffs, preserving crystal-clear ocean tones and calming natural headlands for left-aligned typography readability.

1. **`hero-danang-sontra.mp4`**
   - **Codec:** H.264 (AVC baseline/high, `yuv420p`, `+faststart` moov header)
   - **Resolution:** 1920×1080 @ 29.97 FPS
   - **Duration:** 10.0 seconds
   - **File Size:** 4,389,029 bytes (~4.18 MB)
   - **Audio:** Stripped (`-an`)
   - **Command:**
     ```bash
     ffmpeg -y -ss 00:00:00 -i candidate_30084777.mp4 -t 10 -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart public/videos/landing/hero-danang-sontra.mp4
     ```

2. **`hero-danang-sontra.webm`**
   - **Codec:** VP9 (`yuv420p`)
   - **Resolution:** 1920×1080 @ 29.97 FPS
   - **Duration:** 10.0 seconds
   - **File Size:** 3,068,949 bytes (~2.92 MB)
   - **Audio:** Stripped (`-an`)
   - **Command:**
     ```bash
     ffmpeg -y -ss 00:00:00 -i candidate_30084777.mp4 -t 10 -an -c:v libvpx-vp9 -b:v 0 -crf 34 -pix_fmt yuv420p public/videos/landing/hero-danang-sontra.webm
     ```

## Fallback Poster
- **Asset:** `/images/landing/hero-danang-sontra.jpg` (Son Tra Peninsula and Da Nang Bay)
- **Status:** Unmodified and preserved as instant-loading LCP poster and non-JS / reduced-motion fallback.
