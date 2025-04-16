import React, { useEffect, useState, useRef } from 'react';
import type { VoterFilters } from './useVoterFilters';

// Address fields to scaffold
const ADDRESS_FIELDS = [
  { key: 'residence_street_number', label: 'Street Number' },
  { key: 'residence_pre_direction', label: 'Pre Direction' },
  { key: 'residence_street_name', label: 'Street Name' },
  { key: 'residence_street_type', label: 'Street Type' },
  { key: 'residence_post_direction', label: 'Post Direction' },
  { key: 'residence_apt_unit_number', label: 'Apt/Unit Number' },
  { key: 'residence_zipcode', label: 'Zipcode' },
  { key: 'residence_city', label: 'City' },
];

// Props for the ResidenceAddressFilter
interface ResidenceAddressFilterProps {
  filters: VoterFilters;
  setFilter: (key: keyof VoterFilters, value: any) => void;
  disableAutoSelect?: boolean;
}

// Debounce hook
function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  useEffect(() => {
    const handler = setTimeout(effect, delay);
    return () => clearTimeout(handler);
    // eslint-disable-next-line
  }, [...deps, delay]);
}

// Helper to build query params for API
function buildQueryParams(filters: VoterFilters, excludeKey?: string) {
  const params = new URLSearchParams();
  ADDRESS_FIELDS.forEach(({ key }) => {
    if (key !== excludeKey && filters[key]) {
      params.set(key, filters[key]);
    }
  });
  return params;
}

/**
 * ResidenceAddressFilter
 * Scaffold for the Georgia residence address filter UI.
 * Renders one field for each address part, using current filter state.
 * TODO: Integrate with API for dynamic options and implement autocomplete/select logic.
 */
export const ResidenceAddressFilter: React.FC<ResidenceAddressFilterProps> = ({ filters, setFilter, disableAutoSelect = false }) => {
  // State for options, loading, and error for each field
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});
  // Track which field should be auto-focused
  const selectRefs = useRef<Record<string, HTMLSelectElement | null>>({});
  // Track last changed field for dependent clearing
  const lastChangedField = useRef<string | null>(null);

  // Debounced fetch for all fields
  useDebouncedEffect(() => {
    ADDRESS_FIELDS.forEach(async ({ key }) => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      setError((prev) => ({ ...prev, [key]: null }));
      try {
        const params = buildQueryParams(filters, key);
        params.set('field', key);
        const res = await fetch(`/ga/api/voter-address/fields?${params.toString()}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        setOptions((prev) => ({ ...prev, [key]: data.values || [] }));
      } catch (e) {
        setError((prev) => ({ ...prev, [key]: 'Failed to load options' }));
        setOptions((prev) => ({ ...prev, [key]: [] }));
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    });
    // eslint-disable-next-line
  }, [filters], 300);

  // Auto-select logic and focus management
  useEffect(() => {
    if (disableAutoSelect) return;
    ADDRESS_FIELDS.forEach(({ key }, idx) => {
      const opts = options[key] || [];
      if (opts.length === 1 && filters[key] !== opts[0]) {
        setFilter(key as keyof VoterFilters, opts[0]);
        // Focus next field if exists
        const next = ADDRESS_FIELDS[idx + 1];
        if (next && selectRefs.current[next.key]) {
          setTimeout(() => selectRefs.current[next.key]?.focus(), 0);
        }
      }
    });
    // eslint-disable-next-line
  }, [options]);

  // Dependent clearing: when a field changes, clear all fields after it
  function handleSelectChange(key: string, value: string) {
    console.log(`[Component] handleSelectChange called for key: ${key}. Received value:`, value);
    const idx = ADDRESS_FIELDS.findIndex(f => f.key === key);
    // Only clear fields after the changed field
    ADDRESS_FIELDS.slice(idx + 1).forEach(({ key: depKey }) => setFilter(depKey as keyof VoterFilters, ''));
    setFilter(key as keyof VoterFilters, value);
    lastChangedField.current = key;
  }

  return (
    <div className="space-y-2">
      {ADDRESS_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="text-sm font-medium" htmlFor={key}>{label}</label>
          <select
            id={key}
            ref={el => { selectRefs.current[key] = el; }}
            value={filters[key] || ''}
            onChange={e => handleSelectChange(key, e.target.value)}
            disabled={loading[key]}
            className="w-full bg-muted"
            aria-label={label}
          >
            <option value="">Select {label}</option>
            {options[key]?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {loading[key] && <div className="text-xs text-muted-foreground">Loading...</div>}
          {error[key] && <div className="text-xs text-red-500">{error[key]}</div>}
        </div>
      ))}
    </div>
  );
}; 