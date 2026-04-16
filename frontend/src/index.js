import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Catch uncaught errors that cause blank screen
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    root.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif;">' +
      '<h2 style="color:#ef4444;">Something went wrong</h2>' +
      '<p style="color:#6b7280;">' + (event.error?.message || 'Unknown error') + '</p>' +
      '<button onclick="localStorage.clear();window.location.href=\'/login\';" ' +
      'style="margin-top:16px;padding:10px 24px;background:#003366;color:#fff;border:none;border-radius:8px;cursor:pointer;">' +
      'Go to Login</button></div>';
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
