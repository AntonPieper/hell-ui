---
version: alpha
name: hell
description: Compact Angular component system for dense business applications.
colors:
  primary: '#313A46'
  primary-hover: '#262D37'
  primary-active: '#1C222A'
  primary-foreground: '#FFFFFF'
  primary-soft: '#EEF0F3'
  primary-soft-foreground: '#313A46'
  surface: '#FFFFFF'
  surface-subtle: '#F7F8FA'
  surface-muted: '#EEF0F3'
  surface-elevated: '#FFFFFF'
  border: '#E3E6EC'
  border-strong: '#C8CDD6'
  foreground: '#1C222A'
  foreground-muted: '#5B6370'
  foreground-subtle: '#8B94A3'
  foreground-inverse: '#FFFFFF'
  success: '#64B22C'
  success-soft: '#EEF8E3'
  success-strong: '#43761C'
  info: '#0DCAF0'
  info-soft: '#E0F6FA'
  info-strong: '#073145'
  warning: '#E5A000'
  warning-soft: '#FFF3D9'
  warning-strong: '#6F4A00'
  danger: '#DA564D'
  danger-soft: '#FBE8E6'
  danger-strong: '#A8352D'
  focus-ring: '#313A46'
typography:
  display:
    fontFamily: 'Inter, Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0em
  headline:
    fontFamily: 'Inter, Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0em
  body:
    fontFamily: 'Inter, Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  body-sm:
    fontFamily: 'Inter, Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0em
  label:
    fontFamily: 'Inter, Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0em
  label-caps:
    fontFamily: 'Inter, Inter Variable, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif'
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.06em
  code:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Cascadia Mono, Liberation Mono, monospace'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
rounded:
  xs: 2px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 999px
spacing:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  '2xl': 20px
  '3xl': 24px
  '4xl': 32px
  control-sm: 28px
  control-md: 34px
  control-lg: 40px
components:
  button-default:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    height: '{spacing.control-md}'
    padding: 16px
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
    height: '{spacing.control-md}'
    padding: 16px
  button-soft:
    backgroundColor: '{colors.primary-soft}'
    textColor: '{colors.primary-soft-foreground}'
    rounded: '{rounded.md}'
    height: '{spacing.control-md}'
    padding: 16px
  input:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.md}'
    height: '{spacing.control-md}'
    padding: 12px
  card:
    backgroundColor: '{colors.surface-elevated}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.lg}'
    padding: 16px
  tag-info:
    backgroundColor: '{colors.info-soft}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.full}'
    padding: 8px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
  button-primary-active:
    backgroundColor: '{colors.primary-active}'
    textColor: '{colors.primary-foreground}'
    rounded: '{rounded.md}'
  page-surface:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.foreground}'
  subtle-surface:
    backgroundColor: '{colors.surface-subtle}'
    textColor: '{colors.foreground-muted}'
  muted-surface:
    backgroundColor: '{colors.surface-muted}'
    textColor: '{colors.foreground}'
  divider:
    backgroundColor: '{colors.border}'
    height: 1px
  divider-strong:
    backgroundColor: '{colors.border-strong}'
    height: 1px
  caption:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.foreground-muted}'
    typography: '{typography.label-caps}'
  subtle-rule:
    backgroundColor: '{colors.foreground-subtle}'
    height: 1px
  inverse-swatch:
    backgroundColor: '{colors.foreground}'
    textColor: '{colors.foreground-inverse}'
  status-success:
    backgroundColor: '{colors.success-soft}'
    textColor: '{colors.success-strong}'
    rounded: '{rounded.full}'
  status-info:
    backgroundColor: '{colors.info-soft}'
    textColor: '{colors.info-strong}'
    rounded: '{rounded.full}'
  status-warning:
    backgroundColor: '{colors.warning-soft}'
    textColor: '{colors.warning-strong}'
    rounded: '{rounded.full}'
  status-danger:
    backgroundColor: '{colors.danger-soft}'
    textColor: '{colors.danger-strong}'
    rounded: '{rounded.full}'
  success-dot:
    backgroundColor: '{colors.success}'
    width: 8px
    height: 8px
  info-dot:
    backgroundColor: '{colors.info}'
    width: 8px
    height: 8px
  warning-dot:
    backgroundColor: '{colors.warning}'
    width: 8px
    height: 8px
  danger-dot:
    backgroundColor: '{colors.danger}'
    width: 8px
    height: 8px
  focus-outline:
    backgroundColor: '{colors.focus-ring}'
    height: 2px
---

# hell Design System

## Overview

hell is a restrained, work-focused design system for Angular line-of-business interfaces. It should feel precise, quiet, and reliable: compact controls, neutral surfaces, crisp borders, and clear focus feedback over decorative flourish.

The visual language is designed for repeated daily use in ICT, admin, operations, and internal tools. Screens should optimize scanning, comparison, and action rather than marketing-style storytelling.

## Colors

The palette is neutral-first with one deep slate primary and small semantic accents.

- **Primary (#313A46):** main action color, active navigation, strong focus affordances.
- **Surface (#FFFFFF / #F7F8FA / #EEF0F3):** layered backgrounds for app chrome, cards, code blocks, and controls.
- **Foreground (#1C222A):** primary text. Muted and subtle foreground tokens handle descriptions, metadata, and section labels.
- **Border (#E3E6EC):** default component separation. Strong border is reserved for selected, divided, or emphasized regions.
- **Semantic accents:** success green, info cyan, warning amber, and danger red. Use soft variants for backgrounds and strong/base variants for icons, text, and actions.

Dark theme keeps the same roles but moves surfaces to deep slate, foreground to pale gray, and borders to blue-gray. Toggle theme at the root with `data-hell-theme="light"` or `data-hell-theme="dark"`.

## Typography

Use the existing sans stack for UI text and JetBrains Mono for code and technical values. Type should remain compact: base body text is 14px, control labels are 13px, and section labels are 11px uppercase only when they act as navigation or metadata.

Headings inside docs can be larger, but product UIs should avoid oversized hero type. Use weight and spacing for hierarchy before increasing size.

## Layout

Use dense but breathable spacing. The core scale is 4, 6, 8, 12, 16, 20, 24, and 32px. Controls align around 28, 34, and 40px heights.

App screens should use persistent structure: top bar, side navigation, optional secondary panel, and a content region. Cards are for repeated items, demos, modals, and framed tools; page sections should remain unframed full-width content.

## Elevation & Depth

Depth is subtle. Prefer tonal layers and 1px borders. Shadows exist for overlays, popovers, menus, dialogs, and floating surfaces, but ordinary panels should avoid heavy elevation.

Focus rings are visible and practical: 2px outlines using `--color-hell-focus-ring`, offset by 1px.

## Shapes

The shape language is compact and slightly sharp. Default interactive radius is 6px, cards are 8px, small affordances are 2-4px, and pill shapes are reserved for tags, badges, avatar stacks, and compact metadata.

Do not mix large soft rounded cards with sharp controls in the same surface. Keep cards at 8px radius or less unless the component is explicitly pill-shaped.

## Components

Buttons use clear emphasis levels: primary for the main action, default for ordinary actions, soft for secondary emphasis, ghost for toolbars, link for inline navigation, danger for destructive actions, and success for affirmative completion.

Inputs, selects, textareas, date inputs, and time inputs share border, radius, height, focus, disabled, and invalid semantics. Field labels and descriptions should live with the input, not as detached prose.

Navigation is compact and icon-assisted. Side nav groups can collapse. Top-bar actions should prefer icon buttons with accessible labels.

Examples and documentation demos live in separate `.example.ts` files and are imported both as Angular components and raw source text.

## Do's and Don'ts

- Do compose from standalone components and directive arrays exported by `hell`.
- Do use semantic CSS tokens for overrides.
- Do keep primary actions scarce: one main action per region.
- Do provide accessible labels for icon-only controls.
- Don't style components by hard-coded palette weights when a semantic token exists.
- Don't use decorative gradients, oversized cards, or marketing hero layouts in app surfaces.
- Don't bundle feature dependencies unless the route or component actually uses them.
- Don't hide important state only in color; pair color with text, icon, or structure.
