# Component Library Quick Reference Guide

## 🎯 Quick Start

### 1. Install Dependencies
```bash
cd my-app
npm install
```

### 2. Start Development Server
```bash
npm start
```

### 3. View Components
Open [http://localhost:3000](http://localhost:3000) in your browser

---

## 📚 Component API Reference

### Button Component

**Props:**
- `variant` - 'primary' | 'secondary' | 'success' | 'danger' | 'outline' (default: 'primary')
- `size` - 'small' | 'medium' | 'large' (default: 'medium')
- `icon` - React Icon component (optional)
- `disabled` - boolean (default: false)
- `onClick` - function

**Examples:**
```jsx
import Button from './components/Button/Button';
import { FiHome, FiSettings } from 'react-icons/fi';

// Primary button with icon
<Button variant="primary" icon={FiHome}>
  Home
</Button>

// Disabled button
<Button disabled>Disabled</Button>

// Small outline button
<Button size="small" variant="outline" icon={FiSettings}>
  Settings
</Button>
```

---

### Card Component

**Props:**
- `title` - string (required)
- `icon` - React Icon component (optional)
- `description` - string (optional)
- `children` - React elements (optional)

**Examples:**
```jsx
import Card from './components/Card/Card';
import { FiUser } from 'react-icons/fi';

<Card
  title="Profile"
  icon={FiUser}
  description="Manage your account"
>
  <p>Additional content here</p>
</Card>
```

---

### Alert Component

**Props:**
- `type` - 'success' | 'info' | 'warning' | 'error' (default: 'info')
- `message` - string (required)
- `title` - string (optional)
- `closeable` - boolean (default: true)

**Examples:**
```jsx
import Alert from './components/Alert/Alert';

// Simple alert
<Alert type="success" message="Operation completed!" />

// With title
<Alert
  type="warning"
  title="Warning"
  message="Please review before proceeding"
/>

// Non-closeable alert
<Alert
  type="error"
  message="Critical error occurred"
  closeable={false}
/>
```

---

### Badge Component

**Props:**
- `variant` - 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' (default: 'primary')
- `size` - 'small' | 'medium' | 'large' (default: 'medium')
- `label` - string (required)

**Examples:**
```jsx
import Badge from './components/Badge/Badge';

<Badge variant="success" label="Active" />
<Badge variant="warning" size="large" label="Pending" />
<Badge variant="danger" size="small" label="Error" />
```

---

### Navbar Component

**Props:**
None required - it's a standalone component

**Examples:**
```jsx
import Navbar from './components/Navbar/Navbar';

<Navbar />
```

---

## 🎨 Styling & Customization

### Global Colors
```css
/* Primary Purple */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Pink Red */
background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

/* Cyan Blue */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

/* Orange Yellow */
background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
```

### Customization
- Edit component `.css` files in `src/components/`
- Modify gradients in `App.css` and `index.css`
- Update component props in `App.js`

---

## 🔍 React Icons Library

### Popular Icon Sets
- **Feather Icons** (FiXxx) - Minimal, clean icons
- **Font Awesome** (FaXxx) - Comprehensive icon set
- **Bootstrap Icons** (BsXxx) - Bootstrap's icon library
- **Heroicons** (HiXxx) - Tailwind's icons

### Import Examples
```jsx
// Feather Icons
import { FiHome, FiSettings, FiUser, FiMail, FiBell, FiLogOut } from 'react-icons/fi';

// Font Awesome
import { FaReact, FaNode } from 'react-icons/fa';

// Bootstrap Icons
import { BsGithub, BsGoogle } from 'react-icons/bs';
```

### Browse All Icons
Visit: [https://react-icons.github.io/react-icons/](https://react-icons.github.io/react-icons/)

---

## 📁 File Structure

```
my-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.js
│   │   │   └── Button.css
│   │   ├── Card/
│   │   │   ├── Card.js
│   │   │   └── Card.css
│   │   ├── Alert/
│   │   │   ├── Alert.js
│   │   │   └── Alert.css
│   │   ├── Badge/
│   │   │   ├── Badge.js
│   │   │   └── Badge.css
│   │   └── Navbar/
│   │       ├── Navbar.js
│   │       └── Navbar.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── .gitignore
├── package.json
├── README.md
└── QUICK_REFERENCE.md
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify, Vercel, or GitHub Pages
```bash
# Build completed files are in 'build/' directory
# Upload to your hosting platform
```

---

## 🆘 Troubleshooting

**Issue:** Components not displaying correctly
- **Solution:** Clear cache with `npm cache clean --force` and reinstall

**Issue:** Icons not showing
- **Solution:** Ensure react-icons is installed: `npm install react-icons`

**Issue:** Styles not applying
- **Solution:** Check CSS file imports and file paths in component files

---

## 💡 Tips & Tricks

1. **Icon Sizing**: Change icon size by styling `font-size` on components
2. **Colors**: Modify CSS files to change component colors
3. **Animations**: Adjust transition timing in CSS files
4. **Responsive**: All components use CSS media queries for responsive design

---

## 📝 Notes

- All components are functional components with hooks
- Built with CSS modules for component styling
- Fully responsive design (Mobile-first)
- No external UI frameworks used (pure React + CSS)
- React Icons included for 7000+ icons

---

**Created with ❤️ | Last Updated: 2026**
