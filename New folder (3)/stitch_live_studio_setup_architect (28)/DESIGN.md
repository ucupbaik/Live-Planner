---
name: Prism Control
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#2fd9f4'
  on-tertiary: '#00363e'
  tertiary-container: '#009fb4'
  on-tertiary-container: '#002f36'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#a2eeff'
  tertiary-fixed-dim: '#2fd9f4'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e5a'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style

The design system is centered on the concept of a "Creative Command Center." It bridges the gap between high-utility productivity tools and expressive creative environments. The target audience includes digital creators, studio managers, and multi-disciplinary artists who require rigorous organization without the sterile feel of traditional enterprise software.

The visual style is **Corporate Modern with a Creative Edge**. It utilizes a structured, high-density layout to manage complex data (inventories, timelines, project tracks) but infuses life through vibrant, spectrum-based gradients and glass-like finishes. The emotional goal is to make the user feel hyper-organized, empowered, and inspired.

## Colors

This design system utilizes a **Deep Dark Mode** foundation to ensure that hardware inventory images and "Rainbow" accents pop with maximum luminosity.

- **Primary & Secondary:** A range of blues starting from a deep Slate-Navy (`#0F172A`) for backgrounds, scaling up to a "Command Blue" (`#007AFF`) for core actions.
- **The Spectrum Accent:** Unlike static colors, the "Rainbow" is treated as a functional status indicator and a "creative spark" element. It is applied to primary call-to-actions, active state underlines, and high-priority project markers.
- **Functional Gradients:** Use deep navy-to-black gradients for page backgrounds to provide a sense of infinite space, common in professional creative suites.

## Typography

The typography system prioritizes legibility in data-dense environments. 

- **Inter** is the primary driver for the UI, used for its excellent x-height and neutrality, which allows the creative content and gradients to remain the focus.
- **JetBrains Mono** is introduced for technical labels, serial numbers, and inventory counts to reinforce the "Command Center" aesthetic and provide clear character differentiation for hardware specs.
- Use tight letter-spacing for large displays to create a "locked-in" editorial look.

## Layout & Spacing

This design system follows a **12-column fluid grid** with a fixed maximum width for the dashboard to prevent line lengths from becoming unreadable on ultra-wide monitors.

- **Density:** The design favors a "High-Density" approach. Gutters are kept at a generous 24px to allow the complex inventory cards to breathe, while internal component padding follows a strict 4px/8px/16px rhythm.
- **Breakpoints:** 
  - Mobile (<768px): Single column, margins reduced to 16px.
  - Tablet (768px - 1024px): 2-column card layouts, 24px margins.
  - Desktop (>1024px): Full 12-column dashboard layout with a persistent left-hand "Command Rail" (min-width 72px) or full sidebar (240px).

## Elevation & Depth

To maintain a modern "Command Center" feel, depth is achieved through **Tonal Layering and Glassmorphism** rather than traditional heavy shadows.

- **Surface Levels:** 
  - Level 0 (Base): Deep Slate (#0F172A).
  - Level 1 (Cards/Lists): Navy Blue (#1E293B) with a subtle 1px border (#334155).
  - Level 2 (Popovers/Modals): Semi-transparent Navy with a 20px background blur (Glassmorphism).
- **Outlines:** Instead of shadows, use "Inner Glows" (subtle 1px primary-colored strokes) for active or focused states to mimic the appearance of illuminated hardware interfaces.

## Shapes

The shape language is **Soft yet Precise**. 

- Standard components (Buttons, Input Fields) use a **0.25rem (4px)** radius to maintain a professional, high-tech feel. 
- Project cards and inventory containers use a **0.5rem (8px)** radius to distinguish them as larger organizational units.
- Avoid pill-shapes for buttons to maintain the "Command Center" seriousness, except for specific "status badges" or "tags" where a rounded-full pill provides a clear visual distinction from interactive buttons.

## Components

### Buttons
- **Primary:** Features the "Rainbow Gradient" background with white text. On hover, apply a slight brightness increase and an outer glow matching the cyan mid-tone.
- **Secondary:** Solid Navy background with a 1px Cyan border.
- **Tertiary/Ghost:** Transparent background with Cyan text for low-priority actions.

### Cards (Project & Inventory)
- **Inventory Cards:** Must feature a dedicated "Status Slot" in the top right, using the monospaced label font. Content should be divided into a "Spec Grid" (e.g., CPU, RAM, Model No.) for quick scanning.
- **Project Cards:** Feature a top-border accent of the rainbow gradient if the project is "Active" or "Live."

### Input Fields
- Dark backgrounds (#020617) with subtle 1px borders. The focus state should trigger a transition from a grey border to a bright Cyan border with a 0 0 8px Cyan outer glow.

### Navigation Bar
- A top-anchored, semi-transparent (Glassmorphism) bar. 
- The **User Account Profile** should be housed in a circular frame with a rainbow-colored "ring" that glows when the user is "On Air" or "Live."

### Specialized Lists
- **Part Lists:** Use alternating row stripes (Zebra striping) in very subtle Navy tones. Each row should include a hover state that slightly lifts the row using a scale(1.01) transform to indicate interactivity.