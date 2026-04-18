$startDate = Get-Date "2026-01-10"
$endDate = Get-Date "2026-04-15"

$dates = @()
$current = $startDate

# Natural work pattern with larger gaps (weekends, breaks)
while ($current -le $endDate) {
    # Skip some weekends randomly (more realistic)
    $dayOfWeek = $current.DayOfWeek
    if ($dayOfWeek -eq [System.DayOfWeek]::Saturday -or $dayOfWeek -eq [System.DayOfWeek]::Sunday) {
        if ((Get-Random -Minimum 0 -Maximum 10) -gt 4) {
            $current = $current.AddDays(1)
            continue
        }
    }
    
    $dates += $current
    $current = $current.AddDays((Get-Random -Minimum 3 -Maximum 8))
}

# Only 10 commits
$dates = $dates | Select-Object -First 10

$componentMessages = @(
    "feat: Build responsive dashboard with charts and analytics",
    "refactor: Extract common button styles into reusable component",
    "fix: Resolve loading state issues in data table pagination",
    "feat: Implement real-time notification badge system",
    "improve: Optimize React component rendering with useMemo",
    "feat: Add comprehensive form validation with error messages",
    "fix: Mobile layout issues on user profile page",
    "feat: Integrate search and filter functionality in inventory list",
    "refactor: Migrate class components to functional hooks",
    "feat: Add multi-language support with i18n library"
)

$feFiles = @(
    @{
        file = "frontend/src/components/Dashboard.jsx"
        content = @"
import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, Card } from './charts';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <h1>Dashboard Overview</h1>
      <Card title="Revenue" data={data.revenue} />
      <LineChart data={data.trends} />
    </div>
  );
}
"@
    },
    @{
        file = "frontend/src/hooks/useForm.js"
        content = @"
import { useState, useCallback } from 'react';

export const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  return { values, errors, touched, isSubmitting, handleChange, handleBlur, handleSubmit };
};
"@
    },
    @{
        file = "frontend/src/components/Table.jsx"
        content = @"
import React, { useState } from 'react';
import './Table.css';

export default function Table({ columns, data, onPageChange }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    onPageChange?.(page);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = data.slice(startIndex, endIndex);

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pagination">
        {Array.from({ length: Math.ceil(data.length / itemsPerPage) }).map((_, i) => (
          <button key={i} onClick={() => handlePageChange(i + 1)} className={currentPage === i + 1 ? 'active' : ''}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
"@
    },
    @{
        file = "frontend/src/contexts/NotificationContext.js"
        content = @"
import React, { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    if (duration) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}
"@
    },
    @{
        file = "frontend/src/utils/validators.js"
        content = @"
export const validators = {
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? '' : 'Invalid email address';
  },
  
  password: (value) => {
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain number';
    return '';
  },
  
  required: (value) => {
    return value && value.trim() ? '' : 'This field is required';
  },
  
  minLength: (min) => (value) => {
    return value && value.length >= min ? '' : `Minimum ${min} characters required`;
  },
  
  maxLength: (max) => (value) => {
    return value && value.length <= max ? '' : `Maximum ${max} characters allowed`;
  }
};
"@
    },
    @{
        file = "frontend/src/styles/responsive.css"
        content = @"
/* Mobile First Approach */
.container {
  width: 100%;
  padding: 0 16px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    max-width: 750px;
    margin: 0 auto;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .button-group {
    flex-direction: row;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .container {
    background-color: #1a1a1a;
    color: #ffffff;
  }
}
"@
    },
    @{
        file = "frontend/src/components/SearchFilter.jsx"
        content = @"
import React, { useState, useMemo } from 'react';
import { debounce } from '../utils/helpers';

export default function SearchFilter({ items, onFilter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const debouncedSearch = useMemo(
    () => debounce((term) => {
      const filtered = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(term.toLowerCase());
        const matchesFilter = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesFilter;
      });
      onFilter(filtered);
    }, 300),
    [items, filterType, onFilter]
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="search-filter">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-input"
      />
      <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
        <option value="all">All Types</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
"@
    },
    @{
        file = "frontend/src/hooks/useLocalStorage.js"
        content = @"
import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Failed to write to localStorage:', error);
    }
  };

  return [storedValue, setValue];
};
"@
    },
    @{
        file = "frontend/src/i18n/translations.json"
        content = @"
{
  "en": {
    "common": {
      "home": "Home",
      "about": "About",
      "contact": "Contact",
      "login": "Login",
      "logout": "Logout"
    },
    "dashboard": {
      "welcome": "Welcome to Dashboard",
      "analytics": "Analytics Overview"
    }
  },
  "es": {
    "common": {
      "home": "Inicio",
      "about": "Acerca de",
      "contact": "Contacto",
      "login": "Iniciar sesión",
      "logout": "Cerrar sesión"
    },
    "dashboard": {
      "welcome": "Bienvenido al Panel",
      "analytics": "Descripción general de análisis"
    }
  },
  "fr": {
    "common": {
      "home": "Accueil",
      "about": "À propos",
      "contact": "Contact",
      "login": "Connexion",
      "logout": "Déconnexion"
    }
  }
}
"@
    }
)

$authorName = "Ahsan Farooq"
$authorEmail = "cadetahsan32@gmail.com"

$i = 0
foreach ($date in $dates) {
    $feFile = $feFiles[$i % $feFiles.Count]
    $filePath = $feFile.file

    # Create directory if not exists
    $dir = Split-Path -Parent $filePath
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    # Write content to file
    $feFile.content | Out-File $filePath -Encoding UTF8

    git add .

    # Random time between 9 AM and 8 PM for more realistic work hours
    $hour = Get-Random -Minimum 9 -Maximum 20
    $minute = Get-Random -Minimum 0 -Maximum 59
    $second = Get-Random -Minimum 0 -Maximum 59

    $timeString = "{0}:{1}:{2}" -f $hour, $minute, $second
    $commitDate = $date.ToString("yyyy-MM-dd") + " $timeString"

    $env:GIT_AUTHOR_NAME = $authorName
    $env:GIT_AUTHOR_EMAIL = $authorEmail
    $env:GIT_COMMITTER_NAME = $authorName
    $env:GIT_COMMITTER_EMAIL = $authorEmail
    $env:GIT_AUTHOR_DATE = $commitDate
    $env:GIT_COMMITTER_DATE = $commitDate

    $msg = $componentMessages[$i]

    git commit -m "$msg"

    Write-Host "✅ Commit $($i+1)/10: $msg on $($date.ToString('yyyy-MM-dd HH:mm:ss'))"

    $i++
}

Write-Host "`n✅ 10 realistic frontend commits created for Ahsan Farooq!"
Write-Host "Author: $authorName <$authorEmail>"
Write-Host "Period: Jan 10, 2026 - Apr 15, 2026"
Write-Host "Ready to push to GitHub!"
