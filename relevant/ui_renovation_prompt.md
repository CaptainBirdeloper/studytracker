# UI/UX RENOVATION PROMPT: STUDY.LOG IN MATERIAL 3 EXPRESSIVE STYLE

Modify the HTML files (`index.html`, `stats.html`, `practice.html`, `settings.html`) and associated stylesheet overrides to fully renovate the UI/UX of the Study.Log PWA. The redesign must follow the **Material 3 Expressive** style (high-contrast bento-grid, ultra-rounded corners, and dynamic neon color blocking) as shown in the reference image, while preserving 100% of the current PWA features and JavaScript hook bindings.

---

## DESIGN SYSTEM GUIDELINES

### 1. Palette & Colors
- **Page Background**: OLED Black (`#000000`) for high-performance contrast.
- **Bento Card Variants** (Apply selectively to create a dynamic dashboard):
  - **Neon Lime Green** (`#C4FA29` or `#CCFF00`): Used for high-impact metric highlights (e.g., active progress, high stats). Text on this background must be solid black (`#000000`).
  - **Bright Orange** (`#FF6E31`): Used for secondary callouts or data-rich grids (e.g., subject distribution cards). Text on this background must be solid black (`#000000`).
  - **Soft Sky Blue / Periwinkle** (`#89B4FA` or `#A4C3FF`): Used for performance intervals or horizontal progress tracks.
  - **Cream/Yellow** (`#FFF59D` or `#FFF9C4`): Used for balance, averages, or duration highlights. Text on this background must be solid black (`#000000`).
  - **Charcoal/Dark Gray** (`#121212` or `#161616`): Default container/card color. Text on this background must be clean white (`#FFFFFF`) or gray (`#A0A0A0`).
  - **Outlines/Borders**: Borderless layout preferred, or a very thin matching border (`rgba(255,255,255,0.05)` or dark gray `#262626`).

### 2. Typography
- **Primary Font**: A geometric, clean sans-serif like `Outfit`, `Plus Jakarta Sans`, or `Inter` (import from Google Fonts).
- **Metric Headings**: Large numbers should be massive, bold, and expressive (e.g., `font-weight: 800`, `letter-spacing: -0.04em`, sizes up to `text-6xl` or `text-7xl`).
- **Section Labels**: Upper-case, widely tracked, and small (e.g., `letter-spacing: 0.15em`, `text-xs`, `font-weight: 700`, colored in muted gray or low-opacity white/black depending on card background).

### 3. Shapes & Sizing
- **Cards**: All dashboard container boxes must be styled as Bento Cards with extremely rounded corners (`border-radius: 28px` or `border-radius: 32px` / `rounded-[28px]` or `rounded-[32px]`).
- **Buttons / Pills**: Use fully rounded pill-shapes (`rounded-full`) for sliders, selectors, tags, and small utility buttons.
- **Margins & Padding**: Use spacious padding within cards (`p-6` to `p-8`) to maintain breathing room and let the color blocks stand out.

---

## INTERFACE SPECIFICS (PAGE-BY-PAGE MAKEVER)

### 1. `index.html` (Main Logging Screen)
- **Input Fields**:
  - Replace standard inputs with modern, massive bento card selectors.
  - Make the "Quantity" and "Duration" input areas feel premium. Let the numbers (`0`) be massive (like the `78%` in the screenshot) in active font styling, wrapped in individual rounded bento blocks.
- **Focus Area & Source Material**:
  - Styled as clean, borderless charcoal boxes with large rounded corners.
  - Maintain the autocomplete dropdown (`#chapter-suggestions`) but style it with a dark theme, matching rounded corners, and custom scrollbar to match the premium feel.
- **Save Progress Button**:
  - Transform into a bold, black-on-white (or black-on-lime) solid rounded-full pill button that scales down slightly on click (`active:scale-95 transition-all`).

### 2. `stats.html` (Performance Dashboard)
Re-arrange the layout of this page into a cohesive, beautiful **Bento Grid** that echoes the dashboard in the screenshot:
- **Total Questions Card**:
  - Style this using the **Neon Lime Green** card theme (`bg-[#C4FA29] text-black`). Display the number (`#reps-val`) in massive bold text with an arrow symbol (`↑` or `→`) and a pill badge for the suffix/label.
- **Weekly Progress & Time Spent Graphs**:
  - Use the **Bright Orange** or **Charcoal Gray** backgrounds.
  - The weekly bar graphs (`#reps-graph` and `#time-graph`) should be styled with thick, rounded bars (`rounded-full` or `rounded-t-full`) representing segments, matching the rounded columns on the orange card in the screenshot.
  - Active bars can be periwinkle or lime, while background bars remain dark charcoal/gray.
- **Question Density Cards** (Physics, Chemistry, Maths):
  - Each subject card must be a gorgeous Bento-style rectangle (`rounded-[24px]`).
  - Use subtle gradient backgrounds or a clean charcoal/pastel color theme matching each subject.
  - Dynamic status badges ("Speedy", "On Track", "Slow") should render as rounded pills with high contrast.
- **History & Distribution**:
  - Convert into sleek lists inside charcoal bento containers. Ensure lazy loading expansion indicators and dynamic sorting filters are clean, using inline pill-style dropdowns.

### 3. `practice.html` (Practice Generator)
- **Settings Inputs**:
  - Style the range/inputs inside compact rounded cards.
- **Practice Mode Selector**:
  - Style the "Weighted" and "Random" tabs as a segmented pill switch (`rounded-full`) with smooth background sliding animations.
- **Dice Roll Button**:
  - Turn the `#roll-btn` into a highly tactile, floating expressive button. It should spin or scale up on hover/active states using CSS keyframe animations.
- **Generated Set Results**:
  - Render generated question lists as clean pill-tags or rounded cards rather than plain text.

### 4. `settings.html` (Settings Configuration)
- **Action Buttons** (Export, Import, Clear):
  - Styled as clean bento-inspired rows with rounded corners, modern icons, and subtle micro-shadows.
- **Sliders & Dropdowns**:
  - Custom-styled range input (slider thumb as a thick solid pill, track as a wide smooth gray line).
  - Dropdowns styled as flat pill-selectors.

---

## FUNCTIONALITY PRESERVATION RULES (CRITICAL)

To prevent breaking the application's underlying code, the renovated HTML and styles **must not alter or remove** any of the following JavaScript identifiers, classes, or patterns:

1. **Input Fields & Form IDs**:
   - `questions-input` (Quantity input - must keep type and value).
   - `time-input` (Duration input).
   - `chapter-input` (Focus area input with autocomplete bindings).
   - `chapter-suggestions` (Autocomplete suggestion list target).
   - `source-input` (Source select dropdown).
   - `submit-btn` (Submit button).
2. **Stats Metrics & Chart Targets**:
   - `reps-val` and `reps-suffix` (Stats page grand totals).
   - `week-prev`, `week-label`, `week-next` (Weekly paging controls).
   - `weekly-reps-text` (Reps header display).
   - `reps-graph` and `time-graph` (Targets for graph rendering in `graphs.js`).
   - `chapters-list` and `history-expansion` (History log targets).
   - `subject-distribution` (Distribution section container).
   - Subject-specific density targets:
     - Physics: `density-val-physics`, `target-val-physics`, `status-val-physics`, `density-chapter-physics`, `density-source-physics`, and click listener triggers (`StatsController.showDensityTrend('Physics')`).
     - Mathematics & Chemistry: Same suffix mappings (`-maths`, `-chemistry`).
3. **Practice Generators**:
   - `min-q`, `max-q`, `set-count` (Set generation configs).
   - `practice-mode` radio group (Weighted/Random).
   - `roll-btn` (Practice generator trigger).
   - `results-container` (Generated questions target).
4. **Settings Page Hooks**:
   - `export-btn`, `import-input`, `import-btn`, `clear-btn`.
   - `font-size-slider`, `font-size-val`.
   - `font-family-select`, `custom-font-container`, `custom-font-input`.
5. **State & Loader Scripts**:
   - Do **NOT** remove or rename any script tags: `storage.js`, `jee_data.js`, `chapter_validator.js`, `analytics.js`, `graphs.js`, `history.js`, `distribution.js`, `advice.js`, `stats.js`, `practice.js`, `app.js`.
   - Maintain the automatic focus clearing logic (automatic removal of zero inputs on focus/restoring on blur).
   - Keep PWA integration components (`manifest.json` metadata link and service worker `sw.js` registration script).

---

## EXECUTION STEPS FOR CODER
1. **Analyze Existing HTML files** to find target elements matching the functional IDs listed above.
2. **Re-style elements in-place** using Tailwind CSS utility classes and clean custom CSS in `css/` files to inject the expressive fonts (`Outfit`), high rounded corners (`rounded-[28px]`), color block classes (`bg-[#C4FA29]`, `bg-[#FF6E31]`, etc.), and custom responsive bento grid structure.
3. **Ensure full responsiveness** so the bento grid scales perfectly on mobile viewports and desktop views alike.
4. **Add high-quality animations** using Tailwind classes (`transition-all`, `duration-300`, `ease-out`) and minimal custom keyframe definitions for interactive micro-actions.
5. **Validate build and PWA functionality** to confirm that logging, graphing, advice swipe triggers, fuzzy auto-suggestions, data export, and random generators work seamlessly without console warnings.
