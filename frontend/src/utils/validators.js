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
    return value && value.length >= min ? '' : Minimum  characters required;
  },
  
  maxLength: (max) => (value) => {
    return value && value.length <= max ? '' : Maximum  characters allowed;
  }
};
