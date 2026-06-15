---
name: Monolith Noir
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#ffffff'
  on-tertiary: '#263143'
  tertiary-container: '#d8e3fb'
  on-tertiary-container: '#5a6579'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: '0'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 24px
  section-gap: 128px
---

## Brand & Style
The design system is rooted in a philosophy of "Extreme Reduction." It targets high-end professional tools and creative platforms where focus is the primary currency. By stripping away non-essential decorations—shadows, gradients, and textures—we elevate the content to a singular status.

The aesthetic is **Flat Minimalism**. It leverages the tension between deep charcoal voids and razor-sharp white accents to create a high-contrast environment that feels both sophisticated and authoritative. The emotional response is one of calm, focused precision, evoking a sense of premium quality through restraint and generous white space.

## Colors
This design system operates on a strictly disciplined palette. The foundation is a deep, immersive charcoal background that serves as a canvas for high-impact interactions.

- **Primary (#FFFFFF):** Reserved for core brand elements, primary actions, and critical typography. Its brilliance against the dark background ensures immediate visual hierarchy.
- **Secondary (#64748B):** A muted slate blue used for secondary information, icons, and non-critical UI elements. It provides enough contrast for legibility while remaining visually quiet.
- **Background (#0A0A0A):** A near-black charcoal that provides depth without the harshness of pure black.
- **Surface (#1A1A1A):** Used for cards and containers to create subtle tonal separation without relying on shadows.

## Typography
The typography in this design system uses **Inter** for its systematic clarity and modern geometric construction. The hierarchy is characterized by significant scale shifts between headlines and body text to create a bold, editorial feel.

Headlines should be set with tight tracking (letter-spacing) to emphasize the "blocky" and structural nature of the font. Body text requires generous line height to ensure maximum readability against the high-contrast dark background. Use the uppercase label-md style for navigation and small headers to add a rhythmic cadence to the interface.

## Layout & Spacing
The layout follows a **fluid-to-fixed grid** model. On large screens, content is centered within a 1280px container, while tablet and mobile views utilize fluid widths with substantial side margins to maintain a premium, airy feel.

Spacing is governed by an 8px baseline grid. To achieve the "Minimalist" look, the design system mandates a "doubling" rule for section gaps—where standard designs might use 64px, this system utilizes 128px. This abundance of negative space prevents the high-contrast white elements from feeling overwhelming and allows the eye to rest.

## Elevation & Depth
Depth is created exclusively through **Tonal Layering**. Shadows are strictly forbidden. 

The background is the lowest level (`#0A0A0A`). Secondary "elevated" surfaces, such as cards or sidebars, use a slightly lighter slate-tinted charcoal (`#1A1A1A`). For interactive elements that need to pop, use a third tier (`#262626`). This creates a stacked, physical effect like sheets of dark obsidian. Borders should be used sparingly and only in low-contrast values (e.g., 1px solid `#2D2D2D`) to define boundaries without adding visual noise.

## Shapes
The shape language is defined by **hyper-roundedness**. This provides a vital counter-balance to the stark color palette and sharp typography. By using pill-shaped corners (24px to 48px radius), we introduce a sense of approachability and modern fluidity.

Every interactive element—from small buttons to large modal containers—must adhere to these generous curves. This consistency transforms the UI from a series of boxes into a collection of organic, pebble-like objects that feel tactile and satisfying to interact with.

## Components

### Buttons
- **Primary:** Solid White background with Deep Charcoal text. Use heavy padding (16px top/bottom, 32px left/right) and pill-shaped corners.
- **Secondary:** Transparent background with a 2px White border. Text is White.
- **Ghost:** No background or border. Text is Muted Slate Blue, turning White on hover.

### Input Fields
- Background should be Surface color (`#1A1A1A`).
- No border by default; 2px White border on focus.
- Labels are strictly `label-md` (uppercase) positioned above the field.

### Cards
- Flat, Surface color (`#1A1A1A`) background.
- Corner radius is `rounded-3xl` (32px).
- Internal padding should be at least 40px to maintain the whitespace philosophy.

### Chips & Tags
- Small, pill-shaped elements using the Muted Slate Blue at 20% opacity with solid Slate Blue text.
- No borders.

### Lists & Navigation
- List items are separated by generous vertical padding (24px+).
- Active states are indicated by a solid White vertical pill (4px wide) to the left of the item or a subtle tonal shift to the background.