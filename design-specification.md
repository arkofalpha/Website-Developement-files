# Dashboard & Report Design Specification

## Design System

### Color Palette

```css
/* Primary Colors */
--primary-dark: #1A365D;  /* Dark blue for headers */
--primary-main: #2B6CB0; /* Main blue for buttons/actions */
--primary-light: #4299E1; /* Light blue for highlights */

/* Performance Band Colors */
--performance-red: #E53E3E;    /* Needs improvement (≤2.0) */
--performance-orange: #ED8936; /* Below average (2.01-3.0) */
--performance-yellow: #ECC94B; /* Moderate (3.01-4.0) */
--performance-green: #48BB78;  /* Strong (4.01-5.0) */

/* Neutral Colors */
--neutral-900: #1A202C; /* Text */
--neutral-700: #4A5568; /* Secondary text */
--neutral-500: #718096; /* Disabled text */
--neutral-300: #E2E8F0; /* Borders */
--neutral-100: #F7FAFC; /* Background */
```

### Typography

```css
/* Font Families */
--font-heading: 'Inter', sans-serif;
--font-body: 'Source Sans Pro', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
--text-3xl: 1.875rem; /* 30px */
```

## Dashboard Wireframes

### Main Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│ [Logo]         Business Self-Assessment Dashboard         │
├──────────────────────────────────────────────────────────┤
│ Business Name: {name}                                    │
│ Last Assessment: {date}     Overall Score: {score}/5     │
├─────────────┬────────────────────────────────────────────┤
│             │                                            │
│  Navigation │     [Quick Actions]                        │
│  - Overview │     ┌──────┐ ┌──────┐ ┌──────┐           │
│  - History  │     │Start │ │View  │ │Export│           │
│  - Reports  │     │New   │ │Last  │ │PDF   │           │
│  - Settings │     └──────┘ └──────┘ └──────┘           │
│             │                                            │
│             │     Performance Overview                   │
│             │     ┌────────────────────────────┐        │
│             │     │         Radar Chart         │        │
│             │     │    (Theme Performance)      │        │
│             │     │                            │        │
│             │     └────────────────────────────┘        │
│             │                                            │
│             │     Theme Scores                          │
│             │     ┌────────────────────────────┐        │
│             │     │ Problem Identification  4.2 │        │
│             │     │ Business Positioning   3.8 │        │
│             │     │ Product Development   3.5 │        │
│             │     │ [More themes...]          │        │
│             │     └────────────────────────────┘        │
│             │                                            │
└─────────────┴────────────────────────────────────────────┘
```

### Assessment Results View

```
┌──────────────────────────────────────────────────────────┐
│ Assessment Results - {date}                              │
├──────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐│
│ │   Composite    │ │    Strongest   │ │    Weakest     ││
│ │    Score      │ │     Theme      │ │     Theme      ││
│ │     4.2/5     │ │  Marketing     │ │   Finance      ││
│ └────────────────┘ └────────────────┘ └────────────────┘│
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Performance by Theme                                     │
│ ┌────────────────────────────────────────────┐          │
│ │              Bar Chart                      │          │
│ │     (Themes sorted by performance)         │          │
│ └────────────────────────────────────────────┘          │
│                                                          │
│ Key Recommendations                                      │
│ ┌────────────────────────────────────────────┐          │
│ │ 1. Improve financial record keeping         │          │
│ │ 2. Implement marketing strategy             │          │
│ │ 3. Enhance product development process      │          │
│ └────────────────────────────────────────────┘          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## PDF Report Template

### Cover Page
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Logo]                                                  │
│                                                          │
│         Business Performance Assessment Report           │
│                                                          │
│  Business Name: {name}                                   │
│  Assessment Date: {date}                                 │
│  Report Generated: {date}                                │
│                                                          │
│  Overall Performance Score: {score}/5                    │
│  Performance Band: {band}                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Executive Summary
```
┌──────────────────────────────────────────────────────────┐
│ Executive Summary                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Overall Performance                                      │
│ Your business scored {score}/5, indicating {band}        │
│ performance across all assessed areas.                   │
│                                                          │
│ Key Strengths                                           │
│ • {Theme 1}: {score}/5 - {brief explanation}            │
│ • {Theme 2}: {score}/5 - {brief explanation}            │
│                                                          │
│ Priority Areas for Improvement                          │
│ • {Theme 1}: {score}/5 - {recommendation}               │
│ • {Theme 2}: {score}/5 - {recommendation}               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Detailed Theme Analysis (repeated for each theme)
```
┌──────────────────────────────────────────────────────────┐
│ Theme: {theme_name}                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Score: {score}/5                                        │
│ Performance Band: {band}                                │
│                                                          │
│ Strengths                                               │
│ • {specific strength point}                             │
│ • {specific strength point}                             │
│                                                          │
│ Areas for Improvement                                   │
│ • {specific improvement point}                          │
│ • {specific improvement point}                          │
│                                                          │
│ Recommendations                                         │
│ 1. {detailed recommendation}                            │
│ 2. {detailed recommendation}                            │
│ 3. {detailed recommendation}                            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```


## Required Assets

### Fonts
1. Inter (Primary headings)
   - Weights: 600 (semibold), 700 (bold)
   - Source: Google Fonts

2. Source Sans Pro (Body text)
   - Weights: 400 (regular), 600 (semibold)
   - Source: Google Fonts

### Icons
- Dashboard navigation icons
- Performance indicator icons
- Action buttons icons
- Export/download icons
- Chart legend icons

### Charts
1. Radar Chart (Theme Overview)
   - Library: Chart.js or ApexCharts
   - Custom color scheme for performance bands
   - Interactive tooltips

2. Bar Charts (Theme Comparisons)
   - Library: Chart.js
   - Horizontal layout
   - Performance band colors
   - Sorting capability

3. Line Charts (Progress Over Time)
   - Library: Chart.js
   - Multiple theme tracking
   - Date range selector

### Logo Requirements
- Vector format (SVG preferred)
- Minimum size: 200x60px
- Color and monochrome versions
- Favicon version (32x32px)

## Responsive Breakpoints

```css
/* Breakpoints */
--screen-sm: 640px;  /* Mobile landscape */
--screen-md: 768px;  /* Tablets */
--screen-lg: 1024px; /* Small laptops */
--screen-xl: 1280px; /* Desktops */
```

## Accessibility Considerations

1. Color Contrast
- All text meets WCAG 2.1 AA standards
- Alternative color schemes for color blindness

2. Navigation
- Keyboard navigation support
- Skip links for screen readers
- ARIA labels for interactive elements

3. Charts
- Alternative text descriptions
- Data table alternatives
- Keyboard-accessible tooltips

## Print Optimizations

1. PDF Generation
- High-resolution charts (minimum 300dpi)
- Embedded fonts
- Print-optimized colors
- Page breaks between sections

2. Paper Sizes
- A4 (210 × 297mm) - Primary
- Letter (8.5 × 11in) - Alternative
- Margins: 20mm all sides

## Implementation Notes

1. Dashboard
- Use CSS Grid for main layout
- Lazy load charts for performance
- Implement theme switching
- Cache chart data locally

2. Reports
- Server-side PDF generation
- Batch report generation queue
- Watermarking support
- Digital signature space