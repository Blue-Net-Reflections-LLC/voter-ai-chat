import React, { useEffect, useState } from 'react';
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
export const ResidenceAddressFilter: React.FC<ResidenceAddressFilterProps> = ({ filters, setFilter }) => {
  // State for options, loading, and error for each field
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  // Fetch options for all fields when filters change
  useEffect(() => {
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
    // TODO: Add debouncing to avoid excessive API calls
    // TODO: Add auto-select logic if only one option is available
    // TODO: Add dependent field clearing/reset logic
    // eslint-disable-next-line
  }, [filters]);

  return (
    <div className="space-y-2">
      {ADDRESS_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <label className="text-sm font-medium" htmlFor={key}>{label}</label>
          <select
            id={key}
            value={filters[key] || ''}
            onChange={e => setFilter(key as keyof VoterFilters, e.target.value)}
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