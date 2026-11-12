# SPEC — Pal-Pal Epic Word-by-Word Lyric Video (9:16)

## GOAL
Deliver a 9:16 vertical (`1080×1920`, `30 fps`, `20.0s`) kinetic typography lyric video for the chorus of *Pal Pal* (`16.0s–36.0s` of the uploaded song). Every sung word appears one at a time in the exact centre of the frame in lowercase **Poppins ExtraBold** (`800`) with tight letter spacing (`-0.055em`), using `mix-blend-mode: difference` (`color: #ffffff`) over a high-contrast animated duotone background (Deep Blue in the first half, Wine Red in the second half) with film grain, white flash frames on strong beats, and pixel-mosaic dissolves between lyric lines.

## OUTPUT
- **Resolution:** `1080×1920` (9:16 vertical portrait)
- **Frame Rate:** `30 fps`
- **Duration:** `20.0s` (`600` frames; extracted from `16.0s–36.0s` of the source track where the 7 chorus lines are sung)
- **Audio:** `assets/song.mp3` (`20.0s`, stereo 44.1 kHz, `0.35s` fade-in, `0.60s` fade-out)

## TIME
- **Tempo & Grid:** `~105.5 BPM` (`0.568s` per beat, `2.275s` per 4/4 bar).
- **Act I — Deep Blue Duotone (`0.00s – 10.80s`):**
  - `0.00s – 1.70s`: Instrumental intro pulse & duotone shutter sweep; beat flash at `1.68s` heralds the vocal entry.
  - `1.70s – 6.24s`: **Line 1** — `pal` (`1.70s`), `pal-pal` (`2.04s`), `jeena` (`2.64s`), `muhaal` (`3.44s`), `mera` (`4.64s`), `tere` (`5.20s`), `bina` (`5.68s–6.24s`).
  - `6.16s – 6.42s`: **Pixel-Mosaic Dissolve #1** (Line 1 → Line 2).
  - `6.38s – 8.56s`: **Line 2** — `yeh` (`6.38s`), `saaray` (`6.88s`), `nashay` (`7.22s`), `bekaar` (`7.74s–8.56s`).
  - `8.48s – 8.70s`: **Pixel-Mosaic Dissolve #2** (Line 2 → Line 3).
  - `8.62s – 10.78s`: **Line 3** — `teri` (`8.62s`), `aankhon` (`9.20s`), `ke` (`9.74s`), `siwa` (`10.04s–10.78s`).
- **Midpoint Duotone Flip & Pixel-Mosaic Dissolve #3 (`10.70s – 10.94s`):**
  - Full-frame pixel-mosaic dissolve combined with a strong white beat flash at `10.84s` flips the palette from **Deep Blue Duotone** to **Wine Red Duotone**.
- **Act II — Wine Red Duotone (`10.80s – 20.00s`):**
  - `10.84s – 13.08s`: **Line 4** — `ghar` (`10.84s`), `nahi` (`11.18s`), `jaata` (`11.60s`), `mein` (`12.12s`), `bahar` (`12.60s–13.08s`).
  - `13.00s – 13.20s`: **Pixel-Mosaic Dissolve #4** (Line 4 → Line 5).
  - `13.12s – 15.26s`: **Line 5** — `rehta` (`13.12s`), `tera` (`13.78s`), `intezaar` (`14.44s–15.26s`).
  - `15.18s – 15.40s`: **Pixel-Mosaic Dissolve #5** (Line 5 → Line 6).
  - `15.32s – 17.56s`: **Line 6** — `mere` (`15.32s`), `khuwabon` (`15.70s`), `main` (`16.24s`), `aa` (`16.60s`), `naa` (`16.92s–17.56s`).
  - `17.48s – 17.70s`: **Pixel-Mosaic Dissolve #6** (Line 6 → Line 7).
  - `17.62s – 19.60s`: **Line 7** — `kar` (`17.62s`), `ke` (`17.84s`), `solah` (`18.18s`), `singhaar` (`18.62s–19.60s`).
  - `19.50s – 20.00s`: **Outro Pixel-Mosaic Dissolve #7** & duotone fade out.

## LOOK
- **First Half Palette (Deep Blue Duotone, `0.00s – 10.80s`):**
  - Dark tone: Deep Abyssal Navy `#04091A` and Midnight Indigo `#0A1938`.
  - Light tone (high-luminance duotone highlight slabs for difference inversion): Ice Cyan `#DCEEFF` and Electric Sky `#82C4FF`.
  - When white `#FFFFFF` difference-blended text crosses `#04091A`, it renders crisp ice-white `#FBf6E5`; when it crosses `#DCEEFF`, it inverts to deep royal navy `#231100` / `#0A1938` via a duotone color-map overlay or high-contrast luminance slabs.
  - *Crucial Duotone + Difference Architecture:* To ensure the entire frame — including the inverted text — stays strictly within the Deep Blue or Wine Red duotone palette while still inverting starkly between light and dark areas:
    1. Bottom layer (`#luma-canvas`): High-contrast grayscale/tinted geometric slabs, diagonal shutters, and expanding circles (`#070B14` dark regions vs `#F0F6FF` bright regions) moving across the centre behind the text.
    2. Middle layer (`#lyric-stage`): White (`#FFFFFF`) lowercase Poppins ExtraBold text with `mix-blend-mode: difference`. Over dark background regions (`#070B14`), the text becomes bright (`#F8F4EB`). Over bright background regions (`#F0F6FF`), the text inverts to near-black (`#0F0900`).
    3. Duotone Color-Grading Layer (`#duotone-grade`): Uses `mix-blend-mode: screen` (for deep shadow tint `#061338` → `#24040E`) and `mix-blend-mode: multiply` (for highlight tint `#7CC4FF` → `#FF8DA8`) OR direct duotone-coloured light/dark background regions so that both background and difference-inverted text read unmistakably as Deep Blue in Act I and Wine Red in Act II!
- **Second Half Palette (Wine Red Duotone, `10.80s – 20.00s`):**
  - Dark tone: Deep Oxblood / Wine `#180309` and Mulberry `#2E0714`.
  - Light tone: Warm Champagne Rose `#FFDCE5` and Crimson Blush `#FF7597`.
- **Film Grain:**
  - Deterministic SVG `feTurbulence` noise overlay (`opacity: 0.14`, `mix-blend-mode: overlay`) stepped across 8 seeded positions via GSAP `steps(1)` on the master timeline so scrubbing is 100% deterministic.

## OBJECTS
1. **`#duotone-bg` (Background Split-Field & Geometric Slabs):**
   - Full `1080×1920` stage with a moving high-luminance architectural slab (`#light-slab-primary`, `1400×680px` rotated `-14deg`) and a secondary counter-moving pillar (`#light-slab-secondary`, `540×2200px`) plus a central beat-reactive ring (`#light-ring`, `640×640px`).
   - These light shapes continuously bisect the centre word (`x: 540, y: 960`) so that **every single word** sits partially over dark duotone and partially over light duotone, making the `mix-blend-mode: difference` colour inversion immediately visible inside the letters of every word!
2. **`#mosaic-grid` (Pixel-Mosaic Dissolve Layer):**
   - A `12 × 20` grid (`240` cells, each `90×96px`) covering the `1080×1920` viewport, plus a dense `18 × 8` central lyric-band mosaic (`60×60px` cells) across the centre (`y: 720..1200`).
   - At each of the 6 line boundaries (plus intro/outro), the mosaic cells snap on and off in a deterministic seeded checkerboard/wave order (`steps(4)` opacity + scale), pixelating the outgoing word and dissolving into the incoming line's first word.
3. **`#lyric-stage` (Difference-Blended Word Layer):**
   - `mix-blend-mode: difference`, `position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 20`.
   - Contains 33 `.clip.word-clip` elements (`id="word-0"` through `id="word-32"`), each centered at `(540, 960)` within the `9:16` safe zone (`x: 90..990`).
   - Typography: `font-family: 'Poppins', sans-serif; font-weight: 800; text-transform: lowercase; letter-spacing: -0.055em; line-height: 1; color: #ffffff; white-space: nowrap;`.
   - Font size dynamically scaled by word length (`188px` for 2–4 letter words like `pal`, `yeh`, `ke`, `aa`, `naa`, `kar`; `158px` for 5–6 letter words like `jeena`, `muhaal`, `mera`, `tere`, `bina`, `saaray`, `nashay`, `bekaar`, `teri`, `siwa`, `ghar`, `nahi`, `jaata`, `mein`, `bahar`, `rehta`, `solah`; `132px` for 7–8 letter words like `pal-pal`, `aankhon`, `intezaar`, `khuwabon`, `singhaar`) so every word fills the horizontal hero zone (`650px–900px` wide) without ever overflowing the `1080px` width.
4. **`#flash-overlay` (Strong Beat White Flash Frames):**
   - Full-frame `#ffffff` overlay (`z-index: 35`, `pointer-events: none`, `opacity: 0`) that fires crisp 2–3 frame (`0.08s–0.11s`) flashes on strong musical beats (`t = 1.70s, 2.04s, 3.44s, 5.68s, 6.38s, 7.74s, 8.62s, 10.04s, 10.84s, 11.60s, 12.60s, 14.44s, 15.70s, 16.92s, 18.18s, 18.62s`).
5. **`#grain-overlay` (Film Grain):**
   - High-frequency SVG noise texture (`z-index: 40`) shifted deterministically on the timeline.

## MOTION
- **Word Entrance (Punch-in):** `0.08s` (`expo.out`) scale from `1.24 → 1.00`, vertical micro-snap `y: 18 → 0`, opacity `0 → 1` on `.word-inner`.
- **Word Hold:** Held rock-steady at the centre while the background light slab sweeps across the glyph stems, causing the live difference-blend boundary to travel across the letters.
- **Word Exit:** `0.05s` (`power2.in`) scale `1.00 → 0.92`, opacity `1 → 0` right at the end of the word's `data-duration`.
- **Line-Transition Pixel-Mosaic Dissolve:** `0.24s` total (`0.12s` build in `steps(3)` to peak mosaic density, `0.12s` dissolve out in `steps(3)`), synchronized with the gap/handoff between lines 1→2, 2→3, 3→4 (also triggers the Blue→Wine Red duotone shift), 4→5, 5→6, 6→7, and outro.

## SHOTS
| Shot / Line | Time (`s`) | Palette | Words Timed (`start` – `end`) | Transition Out |
| :--- | :--- | :--- | :--- | :--- |
| **Intro** | `0.00 – 1.70` | Deep Blue Duotone | Instrumental pulse + beat flash at `1.68s` | Hard cut into `pal` |
| **Line 1** | `1.70 – 6.24` | Deep Blue Duotone | `pal` (`1.70–2.04`), `pal-pal` (`2.04–2.64`), `jeena` (`2.64–3.44`), `muhaal` (`3.44–4.64`), `mera` (`4.64–5.20`), `tere` (`5.20–5.68`), `bina` (`5.68–6.24`) | Pixel-Mosaic Dissolve #1 (`6.14–6.40s`) |
| **Line 2** | `6.38 – 8.56` | Deep Blue Duotone | `yeh` (`6.38–6.88`), `saaray` (`6.88–7.22`), `nashay` (`7.22–7.74`), `bekaar` (`7.74–8.56`) | Pixel-Mosaic Dissolve #2 (`8.46–8.70s`) |
| **Line 3** | `8.62 – 10.78` | Deep Blue Duotone | `teri` (`8.62–9.20`), `aankhon` (`9.20–9.74`), `ke` (`9.74–10.04`), `siwa` (`10.04–10.78`) | Pixel-Mosaic Dissolve #3 + Wine Red Flip (`10.68–10.94s`) |
| **Line 4** | `10.84 – 13.08` | Wine Red Duotone | `ghar` (`10.84–11.18`), `nahi` (`11.18–11.60`), `jaata` (`11.60–12.12`), `mein` (`12.12–12.60`), `bahar` (`12.60–13.08`) | Pixel-Mosaic Dissolve #4 (`12.98–13.22s`) |
| **Line 5** | `13.12 – 15.26` | Wine Red Duotone | `rehta` (`13.12–13.78`), `tera` (`13.78–14.44`), `intezaar` (`14.44–15.26`) | Pixel-Mosaic Dissolve #5 (`15.16–15.40s`) |
| **Line 6** | `15.32 – 17.56` | Wine Red Duotone | `mere` (`15.32–15.70`), `khuwabon` (`15.70–16.24`), `main` (`16.24–16.60`), `aa` (`16.60–16.92`), `naa` (`16.92–17.56`) | Pixel-Mosaic Dissolve #6 (`17.46–17.70s`) |
| **Line 7** | `17.62 – 19.60` | Wine Red Duotone | `kar` (`17.62–17.84`), `ke` (`17.84–18.18`), `solah` (`18.18–18.62`), `singhaar` (`18.62–19.60`) | Pixel-Mosaic Dissolve #7 (`19.48–19.90s`) |

## BANNED
- No multiple words visible simultaneously (strictly one word at a time in the centre).
- No uppercase letters on the lyric words (`text-transform: lowercase` enforced).
- No CSS `@keyframes` or `Math.random()` at render time (all motion and grain/mosaic steps bound to `window.__timelines["main"]` with a seeded PRNG).
- No GSAP tweens of `display`, `visibility`, or `autoAlpha` on `.clip` elements.

## QA
- `npx hyperframes lint` and `npx hyperframes check --json` pass with 0 errors.
- Timing verification script confirms all 32 sung word segments match the vocal onset table with zero overlaps.
- Contact sheet inspection (`npx hyperframes snapshot --review`) confirms:
  1. Single lowercase centered word in Poppins ExtraBold with tight tracking.
  2. Deep blue duotone in first half (`0.0s–10.8s`), wine red duotone in second half (`10.8s–20.0s`), with visible film grain.
  3. Clear difference-blend colour inversion across light and dark background areas inside the letters.
  4. Crisp white flash frames on strong beats and pixel-mosaic dissolves between lines.
