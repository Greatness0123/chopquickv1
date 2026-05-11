---
name: ChopQuick Design System
colors:
  surface: '#141218'
  surface-dim: '#141218'
  surface-bright: '#3b383e'
  surface-container-lowest: '#0f0d13'
  surface-container-low: '#1d1b20'
  surface-container: '#211f24'
  surface-container-high: '#2b292f'
  surface-container-highest: '#36343a'
  on-surface: '#e6e0e9'
  on-surface-variant: '#cbc4d2'
  inverse-surface: '#e6e0e9'
  inverse-on-surface: '#322f35'
  outline: '#948e9c'
  outline-variant: '#494551'
  surface-tint: '#cfbcff'
  primary: '#cfbcff'
  on-primary: '#381e72'
  primary-container: '#6750a4'
  on-primary-container: '#e0d2ff'
  inverse-primary: '#6750a4'
  secondary: '#cdc0e9'
  on-secondary: '#342b4b'
  secondary-container: '#4d4465'
  on-secondary-container: '#bfb2da'
  tertiary: '#e7c365'
  on-tertiary: '#3e2e00'
  tertiary-container: '#c9a74d'
  on-tertiary-container: '#503d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#cfbcff'
  on-primary-fixed: '#22005d'
  on-primary-fixed-variant: '#4f378a'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#cdc0e9'
  on-secondary-fixed: '#1f1635'
  on-secondary-fixed-variant: '#4b4263'
  tertiary-fixed: '#ffdf93'
  tertiary-fixed-dim: '#e7c365'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#141218'
  on-background: '#e6e0e9'
  surface-variant: '#36343a'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  xxl: 3rem
  gutter: 1rem
  margin_mobile: 1rem
  margin_desktop: 2.5rem
---

## Brand & Style

This design system is engineered for the fast-paced, vibrant ecosystem of Lagos. It balances the urgency of food waste reduction with a premium, high-contrast aesthetic that feels both reliable and cutting-edge. 

The visual direction utilizes deep blacks and rich charcoal surfaces to make the signature "ChopQuick Orange" vibrate with energy. This isn't just about utility; it’s about creating a "hot-and-ready" psychological trigger. The style combines minimalist structural integrity with aggressive, glowing accents to signify importance and immediate action.

## Colors

The palette is strictly dark-mode to ensure maximum contrast for the primary accent color. 

- **ChopQuick Orange:** Used exclusively for primary actions, critical statuses, and brand highlights.
- **Surface Strategy:** We use a three-tier depth system. `#0A0A0A` for the canvas, `#141414` for standard card containers, and `#1E1E1E` for interactive elements or modals.
- **Functional Colors:** Success, Warning, and Error colors follow industry standards but are calibrated for high legibility against near-black backgrounds.
- **Typography Tinting:** White is reserved for headers; secondary and muted greys provide a clear hierarchy for metadata and captions.

## Typography

This design system relies on **Inter** for its neutral, systematic clarity. 

The typographic hierarchy is designed to guide the eye quickly through listings and countdowns. **Display** styles are tight and impactful, used for hero marketing and major value propositions. **Labels** are strictly uppercase with slight letter-spacing to distinguish metadata from body copy. On mobile devices, the Display size scales down to 40px to maintain readability without excessive horizontal scrolling.

## Layout & Spacing

This design system utilizes a **8px spacing scale** to maintain vertical rhythm. 

- **Mobile:** A 4-column fluid grid with 16px (1rem) margins and gutters.
- **Desktop:** A 12-column fluid grid with 24px-40px margins depending on the container's maximum width (capped at 1280px).
- **Rhythm:** Elements within a card use `sm` or `md` spacing, while sections on the page are separated by `xl` or `xxl` spacing to ensure a clean, breathable interface despite the high-contrast color scheme.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and the signature **Orange Glow**.

1.  **Level 0 (Base):** `#0A0A0A` - The foundation.
2.  **Level 1 (Cards):** `#141414` - For primary content modules.
3.  **Level 2 (Active/Elevated):** `#1E1E1E` - For dropdowns, modals, and elements being hovered.
4.  **Special Accent:** The 'Orange Glow' (`0 0 20px rgba(232,72,15,0.35)`) is applied only to primary call-to-action buttons and high-priority "Flash Sale" cards to simulate a physical neon radiance.

Avoid generic drop shadows; depth should feel structural and emitted rather than cast by a light source.

## Shapes

The shape language is a blend of "Organic-Pill" and "Modern-Geometric."

- **Cards:** Use a 12px radius (`rounded-lg`) to feel approachable yet structured.
- **Buttons & Tags:** Use the maximum radius (999px) for a "pill" look, which distinguishes interactive triggers from layout containers.
- **Inputs:** A slightly tighter 10px radius ensures they feel distinct from cards but share the same family of softness.

## Components

### Buttons
- **Primary:** Pill-shaped, background `Primary accent`, text `Primary white`. On hover, transition to `Primary hover` with the `Orange glow`.
- **Secondary:** Pill-shaped, border `Border`, background `transparent`.
- **Ghost:** Pill-shaped, no border, text `Secondary grey`.

### Cards
- **Standard:** Background `Card surface`, border `Border`, 12px radius.
- **Urgent (Flash Deal):** Same as standard but with a 1px `Primary accent` border and the `Orange glow` effect.

### Form Inputs
- **Text Fields:** 10px radius, background `Elevated surface`, border `Border`. Focus state: Border becomes `Primary accent`.
- **Selection (Radio/Checkbox):** Always use `Primary accent` for the active state to ensure visibility against the dark background.

### Chips & Tags
- **Status Tags:** Pill-shaped (999px), small text `Label-caps`, background using 10% opacity of the status color (e.g., 10% Success Green) with solid text.

### Icons
- Use **Lucide** outlined style. Stroke weight should be 2px for standard UI and 1.5px for smaller metadata icons.

### Navigation
- Bottom navigation for mobile should use a background of `Elevated surface` with a subtle top border of `Border` color. Active items use `Primary accent`.