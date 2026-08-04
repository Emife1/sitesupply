---
version: alpha
name: SiteSupply
description: Industrial precision meets digital trust — a construction supply marketplace for North America.
colors:
  primary: "#0F1D3D"
  secondary: "#F45B1A"
  tertiary: "#0D8C5E"
  neutral: "#F8F9FB"
  background: "#FFFFFF"
  surface: "#FFFFFF"
  text: "#1A1E23"
  muted: "#6B7480"
typography:
  h1:
    fontFamily: Inter
    fontSize: clamp(2rem,5vw,3.5rem)
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  h2:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: 700
    letterSpacing: "-0.03em"
  body:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: 10px
  md: 14px
  lg: 20px
  pill: 9999px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
  button-cta:
    backgroundColor: "{colors.secondary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"