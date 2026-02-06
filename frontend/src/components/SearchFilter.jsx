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
