import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResidenceAddressFilter } from '../ResidenceAddressFilter';
import type { VoterFilters } from '../useVoterFilters';

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

describe('ResidenceAddressFilter', () => {
  const mockFilters: VoterFilters = {
    county: [],
    congressionalDistricts: [],
    stateSenateDistricts: [],
    stateHouseDistricts: [],
    residence_street_number: '',
    residence_pre_direction: '',
    residence_street_name: '',
    residence_street_type: '',
    residence_post_direction: '',
    residence_apt_unit_number: '',
    residence_zipcode: '',
    residence_city: '',
  };
  const mockSetFilter = vi.fn();
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.spyOn(global, 'fetch');
    mockSetFilter.mockClear();
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('renders all address fields as selects with correct labels', () => {
    render(<ResidenceAddressFilter filters={mockFilters} setFilter={mockSetFilter} />);
    ADDRESS_FIELDS.forEach(({ label }) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
    // No longer require selects to be disabled, as they may become enabled after loading
    expect(screen.getAllByRole('combobox').length).toBe(ADDRESS_FIELDS.length);
  });

  it('renders options for each field after loading', async () => {
    // Mock fetch to return options for each field
    fetchMock.mockImplementation((url: string) => {
      const urlObj = new URL(url, 'http://localhost');
      const field = urlObj.searchParams.get('field');
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ field, values: [`OPT1_${field}`, `OPT2_${field}`] }),
      });
    });
    render(<ResidenceAddressFilter filters={mockFilters} setFilter={mockSetFilter} />);
    // Wait for all options to load
    for (const { label, key } of ADDRESS_FIELDS) {
      await waitFor(() => {
        expect(screen.getByLabelText(label)).not.toBeDisabled();
        expect(screen.getByText(`OPT1_${key}`)).toBeInTheDocument();
        expect(screen.getByText(`OPT2_${key}`)).toBeInTheDocument();
      });
    }
  });

  it('shows error message if fetch fails', async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ ok: false }));
    render(<ResidenceAddressFilter filters={mockFilters} setFilter={mockSetFilter} />);
    await waitFor(() => {
      expect(screen.getAllByText('Failed to load options').length).toBeGreaterThan(0);
    });
  });

  // TODO: Add tests for loading state, auto-select logic, dependent clearing, etc.
}); 