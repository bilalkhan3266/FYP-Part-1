# Modern Component - Design System Reference

## 🎨 Complete Design System

### Color Palette

#### Primary Colors
```
Blue (Main Accent)
  Light:    #3b82f6  (blue-500)
  Dark:     #1e40af  (blue-800)
  Base:     #1e3a8a  (blue-900)
  
Cyan (Secondary Accent)
  Light:    #06b6d4  (cyan-500)
  Dark:     #0e7490  (cyan-800)
  
Slate (Background)
  Light:    #f1f5f9  (slate-100)
  Medium:   #64748b  (slate-500)
  Dark:     #334155  (slate-700)
  Darker:   #1e293b  (slate-800)
  Darkest:  #0f172a  (slate-900)
```

#### Semantic Colors
```
Success:    #10b981 (emerald-500)
Warning:    #f59e0b (amber-500)
Error:      #ef4444 (red-500)
Info:       #3b82f6 (blue-500)
```

#### Gradient Combinations
```
Button Primary        from-blue-500 to-cyan-500
Header Background     from-blue-50/10 to-cyan-50/10
Sidebar Background    from-slate-800 to-slate-900
Icon Background       from-blue-400 to-blue-600
Alert Success         from-green-500 to-emerald-500
Alert Error           from-red-500 to-rose-500
```

---

### Typography

#### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

#### Font Sizes & Usage
```
Heading 1 (Page Title)
  - Size: 1.875rem (30px)
  - Weight: bold (700)
  - Color: white
  - Example: "Submit Clearance Request"

Heading 2 (Section Title)
  - Size: 1.25rem (20px)
  - Weight: bold (700)
  - Color: white
  - Example: "Personal Information"

Heading 3 (Subsection)
  - Size: 1rem (16px)
  - Weight: semibold (600)
  - Color: white
  - Example: "Login"

Body Text (Primary)
  - Size: 1rem (16px)
  - Weight: normal (400)
  - Color: white
  - Example: Form labels

Body Text (Secondary)
  - Size: 0.875rem (14px)
  - Weight: normal (400)
  - Color: gray-300
  - Example: Help text, descriptions

Small Text
  - Size: 0.75rem (12px)
  - Weight: normal (400)
  - Color: gray-400
  - Example: Footer, captions
```

---

### Spacing System

#### Padding (px)
```
2px    - xs (1 unit)
4px    - sm (2 units)
6px    - md (3 units)
8px    - lg (4 units)
12px   - xl (6 units)
16px   - 2xl (8 units)
24px   - 3xl (12 units)
32px   - 4xl (16 units)
```

#### Usage
```
Sidebar:      p-6 (24px)
Main Content: p-6 lg:p-8 (24px → 32px)
Form Section: p-8 (32px)
Button:       px-6 py-3 (horizontal 24px, vertical 12px)
Input:        px-4 py-3 (horizontal 16px, vertical 12px)
Card:         gap-3 (12px between items)
```

---

### Border Radius

```
Small Rounded:   rounded-lg    (0.5rem / 8px)
Medium Rounded:  rounded-xl    (0.75rem / 12px)
Large Rounded:   rounded-2xl   (1rem / 16px)
Circle:          rounded-full  (9999px)

Usage:
Buttons:    rounded-lg
Inputs:     rounded-lg
Cards:      rounded-2xl
Icons:      rounded-2xl
Sidebar:    rounded-xl (for profile card)
```

---

### Shadow System

```
No Shadow:      shadow-none
Small Shadow:   shadow-sm (offset 1px, blur 2px)
Medium Shadow:  shadow-md (offset 4px, blur 6px)
Large Shadow:   shadow-lg (offset 10px, blur 15px)
XL Shadow:      shadow-xl (offset 20px, blur 25px)
2XL Shadow:     shadow-2xl (offset 25px, blur 50px)

Usage:
Sidebar:        shadow-2xl (large prominence)
Buttons Hover:  shadow-lg (interaction feedback)
Cards:          shadow-lg (subtle depth)
```

---

### Border Styles

#### Border Width
```
Thin:          border (1px)
Medium:        border-2 (2px)
Thick:         border-4 (4px)

Usage:
Normal inputs:    border-2 border-slate-700
Focused inputs:   border-2 border-blue-500
Cards:            border border-slate-700
Active nav:       border-l-4 (left accent)
```

#### Border Colors
```
Default:       border-slate-700
Focus:         border-blue-500
Alert:         border-red-500/30 or border-green-500/30
Subtle:        border-slate-600
Emphasis:      border-blue-500/20 (semi-transparent)
```

---

## 🎯 Component Styles Reference

### Sidebar Component
```css
Width:           280px (fixed)
Background:      gradient-to-b from-slate-800 to-slate-900
Text Color:      white
Border:          right, 1px, slate-700
Padding:         24px
Shadow:          shadow-2xl
Scrollbar:       Custom blue gradient

Profile Card Inside:
  Background:    gradient-to-br from-slate-700 to-slate-800
  Border:        1px solid slate-600
  Text Align:    center
  Avatar:        gradient-to-br from-blue-400 to-cyan-600
  Avatar Size:   56px (14 units)
  
Navigation Items:
  Default:       text-gray-300, hover:bg-slate-700
  Active:        gradient-to-r from-blue-500 to-cyan-500
  Icon Size:     18px
  Padding:       px-4 py-3
```

### Header Section
```css
Background:      gradient-to-r from-blue-50/10 to-cyan-50/10
Border:          1px solid border-blue-500/20
Border Radius:   rounded-2xl
Padding:         p-8
Display:         flex, items-center, gap-4

Icon Container:
  Background:    gradient-to-br from-blue-400 to-cyan-600
  Padding:       p-4
  Border Radius: rounded-2xl
  
Title:
  Size:          3xl
  Weight:        bold
  Color:         white
```

### Form Container
```css
Background:      bg-slate-800
Border:          1px solid slate-700
Border Radius:   rounded-2xl
Padding:         p-8
Max Width:       max-w-4xl

Grid Layout:
  Columns:       1 (mobile), 2 (tablet+)
  Gap:           gap-6 (24px)

Section Title:
  Size:          1.25rem
  Weight:        bold
  Color:         white
  Icon Size:     24px
  Margin Bottom: mb-6
```

### Input Fields
```css
Width:           w-full
Padding:         px-4 py-3
Border:          border-2 border-slate-700
Background:      bg-slate-900
Color:           text-white
Placeholder:     text-gray-500
Border Radius:   rounded-lg

Focus State:
  Border:        border-blue-500
  Ring:          ring-2 ring-blue-500/20
  Outline:       outline-none (removes default)
  
Disabled State:
  Opacity:       opacity-50
  Cursor:        not-allowed
  
Label Above:
  Font Size:     text-sm
  Weight:        font-semibold
  Color:         text-white
  Margin Bottom: mb-2
  Required:      span with text-red-400, content: "*"
```

### Buttons

#### Submit Button (Primary)
```css
Background:      gradient-to-r from-blue-500 to-cyan-500
Text Color:      text-white
Padding:         px-6 py-3
Border Radius:   rounded-lg
Font Weight:     font-semibold
Display:         flex, items-center, justify-center, gap-2
Height:          auto (min-h-12 recommended)

Hover:
  Box Shadow:    shadow-lg
  Transition:    transition-all

Active/Pressed:
  Opacity:       reduced
  
Loading:
  Disabled:      true
  Opacity:       opacity-50
  Cursor:        not-allowed
```

#### Cancel Button (Secondary)
```css
Border:          border border-slate-600
Text Color:      text-gray-300
Background:      transparent
Padding:         px-6 py-3
Border Radius:   rounded-lg
Font Weight:     font-semibold

Hover:
  Background:    hover:bg-slate-700
  Text Color:    hover:text-white
  Transition:    transition-colors
```

### Alert Messages

#### Success Alert
```css
Background:      bg-green-500/10
Border:          border border-green-500/30
Border Radius:   rounded-xl
Padding:         p-4
Display:         flex, items-center, gap-3

Icon:
  Color:         text-green-400
  Size:          20px

Text:
  Color:         text-green-300
  Size:          base
```

#### Error Alert
```css
Background:      bg-red-500/10
Border:          border border-red-500/30
Border Radius:   rounded-xl
Padding:         p-4
Display:         flex, items-center, gap-3

Icon:
  Color:         text-red-400
  Size:          20px

Text:
  Color:         text-red-300
  Size:          base
```

### Info Box
```css
Background:      bg-blue-500/10
Border:          border border-blue-500/20
Border Radius:   rounded-lg
Padding:         p-6
Margin:          my-8

Heading:
  Font Size:     text-sm
  Weight:        font-semibold
  Color:         text-blue-300
  Margin Bottom: mb-2

List:
  Text Color:    text-blue-200
  Font Size:     text-sm
  Line Height:   space-y-1
  
List Items:
  Content:       "✓ " + text
  Display:       block
```

---

## 🎬 Animations & Transitions

### Loading Spinner
```css
Animation:       animate-spin
Duration:        1s
Direction:       infinite linear
Icon:            Loader (lucide-react)
Size:            20px
Color:           white
Placement:       Before submit button text
```

### Hover Effects
```css
Buttons:
  Transition:    transition-all
  Duration:      200ms (implicit)
  Effect:        shadow-lg (light shadow on hover)
  
Navigation Items:
  Transition:    transition-all
  Duration:      implicit
  Effect:        bg-slate-700 + text-white
  
Input Focus:
  Transition:    implicit (smooth)
  Effect:        border-blue-500 + ring-2
```

### Navigation Active State
```css
Background:      gradient-to-r from-blue-500 to-cyan-500
Text Color:      text-white
Box Shadow:      shadow-lg
Indicator:       ChevronRight icon on right
```

---

## 📐 Responsive Breakpoints

### Tailwind Default Breakpoints
```
Mobile:    < 640px   (sm)
Tablet:    640-768px (sm)
Tablet+:   768px+    (md)
Desktop:   1024px+   (lg)
Wide:      1280px+   (xl)
Ultra:     1536px+   (2xl)
```

### Component Behavior by Breakpoint
```
Mobile (<768px):
  - Grid: 1 column
  - Sidebar: Might be hidden (requires media query)
  - Padding: p-6 (24px)
  - Font: Normal sizes

Tablet (768px+):
  - Grid: 2 columns (active)
  - Sidebar: Visible
  - Padding: p-6 to p-8
  - Font: Scaled up heading

Desktop (1024px+):
  - Full layout
  - Padding: p-8 (32px)
  - Form max-width: 4xl (56rem)
  - Optimal spacing
```

---

## 🧩 Icon System

### Lucide React Icons Used
```
Nav/Menu:
  LayoutDashboard   - Dashboard
  ClipboardList     - Submit Request
  ShieldCheck       - Auto Clearance
  CheckCircle2      - Clearance Status
  MessageSquare     - Messages
  UserPen           - Edit Profile
  LogOut            - Logout
  ChevronRight      - Active indicator

Form/Status:
  GraduationCap     - Brand/header
  BookOpen          - Section headers
  AlertCircle       - Error alerts
  CheckCircle       - Success alerts
  Loader            - Loading spinner
  Send              - Submit action

Size Recommendations:
  Navigation:       18px
  Headers:          24-32px
  Buttons:          20px
  Alerts:           20px
  Large Headers:    32px
```

---

## 🔤 Text Styling Examples

### Labels (Form)
```jsx
<label className="
  block                    // Display: block
  text-sm                  // Font size: 14px
  font-semibold            // Weight: 600
  text-white               // Color: white
  mb-2                     // Margin: 8px
">
  Field Name <span className="text-red-400">*</span>
</label>
```

### Button Label
```jsx
<button className="
  ...button-styles
  flex                     // Display: flex
  items-center             // Align items: center
  justify-center           // Justify: center
  gap-2                    // Gap: 8px (between icon & text)
">
  <Icon size={20} />
  <span>Button Text</span>
</button>
```

### Paragraph Text
```jsx
<p className="
  text-gray-400            // Color: gray
  mt-1                     // Margin top: 4px
">
  Subtitle or helper text
</p>
```

---

## 🎯 Z-Index Hierarchy

```
Sidebar:          10 (fixed left)
Navigation:       auto
Main Content:     auto
Buttons:          auto
Dialogs/Modals:   40 (if added)
Tooltips:         50 (if added)
```

---

## 📏 Size Specifications

### Fixed Sizing
```
Sidebar Width:        280px
Form Max Width:       56rem (4xl)
Avatar Size:          56px
Icon Sizes:           18-32px
Input Height:         Auto (px-4 py-3)
Button Height:        Auto (px-6 py-3)
Navigation Gap:       12px (gap-3)
Form Gap:             24px (gap-6)
Sidebar Padding:      24px (p-6)
Form Padding:         32px (p-8)
```

---

## 🔄 State Indicators

### Visual States

#### Normal State
```
Border:         slate-700
Background:     slate-900
Text:           white
Cursor:         pointer
```

#### Hover State (Interactive)
```
Background:     lighten or add shadow
Text:           white
Cursor:         pointer
Shadow:         shadow-lg
```

#### Focused State
```
Border:         blue-500
Ring:           2px blue-500/20
Outline:        none
```

#### Disabled State
```
Opacity:        50%
Cursor:         not-allowed
Pointer Events: none (in CSS)
```

#### Loading State
```
Disabled:       true
Icon:           Spinner animation
Text:           "Submitting..."
```

---

## 📱 Mobile Adjustments

For mobile-optimized component, consider:

```css
/* Mobile overrides */
@media (max-width: 768px) {
  /* Sidebar: hide or collapse */
  aside {
    display: none; /* or use drawer/hamburger */
  }
  
  /* Full width form */
  button {
    width: 100%;
  }
  
  /* Larger touch targets */
  input, button {
    min-height: 44px; /* iOS recommendation */
  }
  
  /* Remove fixed widths */
  .form-container {
    max-width: 100%;
  }
  
  /* Stack buttons vertically */
  .button-group {
    flex-direction: column;
  }
}
```

---

## ✅ Design Consistency Checklist

- [x] All colors follow palette
- [x] All spacing uses defined units
- [x] All borders use defined radius
- [x] All text uses defined sizes
- [x] Icons are consistent size
- [x] Shadows are from shadow system
- [x] Transitions are smooth (200-300ms)
- [x] All inputs have focus states
- [x] All buttons have hover states
- [x] Responsive design tested
- [x] Dark mode colors consistent
- [x] Alerts use semantic colors
- [x] Gradients match brand
- [x] Typography hierarchy clear

---

**Design System Version**: 1.0  
**Last Updated**: 2025  
**Component**: ClearanceRequest_MODERN  
**Status**: ✅ Complete
