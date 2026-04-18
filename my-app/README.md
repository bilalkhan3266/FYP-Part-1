# Professional Component Library

A modern, professional React component library built with React Icons. Features beautiful, reusable components with smooth animations and responsive design.

## 🚀 Features

- **Professional Components** - Button, Card, Alert, Badge, Navbar
- **React Icons Integration** - 7,000+ beautiful icons
- **Responsive Design** - Mobile-first approach
- **Modern Styling** - Gradient backgrounds and smooth animations
- **Accessibility** - Built with accessibility in mind
- **Easy to Use** - Simple, intuitive API

## 📦 Components

### Button
Multiple variants (primary, secondary, success, danger, outline) with icon support and different sizes.

```jsx
<Button variant="primary" icon={FiHome}>
  Click Me
</Button>
```

### Card
Versatile card component for displaying content with icons and descriptions.

```jsx
<Card
  title="User Profile"
  icon={FiUser}
  description="Manage your personal information"
/>
```

### Alert
Interactive alerts with different types (success, info, warning, error) and close functionality.

```jsx
<Alert
  type="success"
  message="Changes saved successfully!"
/>
```

### Badge
Colorful badges for status indicators and labels.

```jsx
<Badge variant="success" label="Active" />
```

### Navbar
Responsive navigation bar with mobile menu support.

```jsx
<Navbar />
```

## 🛠️ Installation

```bash
cd my-app
npm install
```

## 🎯 Getting Started

```bash
npm start
```

Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
my-app/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Alert/
│   │   ├── Badge/
│   │   └── Navbar/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── public/
│   └── index.html
└── package.json
```

## 🎨 Design System

- **Primary Gradient**: #667eea → #764ba2
- **Secondary Gradient**: #f093fb → #f5576c
- **Success Gradient**: #4facfe → #00f2fe
- **Danger Gradient**: #fa709a → #fee140

## 🔧 Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (⚠️ cannot be undone)

## 🎭 Icons from React Icons

This project uses React Icons library featuring:
- Feather Icons (FiXxx)
- Font Awesome
- Bootstrap Icons
- And many more...

[Browse all available icons](https://react-icons.github.io/react-icons/)

## 📱 Responsive Design

All components are fully responsive and optimized for:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 🖥️ Desktop (1024px+)

## ✨ Component Features

### Animations
- Smooth hover effects
- Fade-in animations on load
- Slide transitions for alerts
- Scale effects on badges

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color-blind friendly color schemes

## 🤝 Contributing

Feel free to add more components or improve existing ones!

## 📄 License

MIT License - feel free to use in your projects

---

**Made with ❤️ using React & React Icons**
