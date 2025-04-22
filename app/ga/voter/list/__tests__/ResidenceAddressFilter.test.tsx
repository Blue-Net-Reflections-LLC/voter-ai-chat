import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResidenceAddressFilter } from '../ResidenceAddressFilter';

// Mock the dependent components
vi.mock('../ReactSelectAutocomplete', () => ({
  ReactSelectAutocomplete: ({ label, fieldKey }: any) => (
    <div data-testid={`select-${fieldKey}`}>
      <label htmlFor={fieldKey}>{label}</label>
      <select id={fieldKey}></select>
    </div>
  )
}));

vi.mock('../CitySelect', () => ({
  CitySelect: ({ label }: any) => (
    <div data-testid="select-city">
      <label htmlFor="residence_city">{label}</label>
      <select id="residence_city"></select>
    </div>
  )
}));

vi.mock('../AddressDataProvider', () => ({
  AddressDataProvider: ({ children }: any) => <div>{children}</div>,
  useAddressData: () => ({
    filter: { id: 'test-id' },
    setField: vi.fn(),
    resetFilter: vi.fn(),
    confirmFilter: vi.fn()
  })
}));

describe('ResidenceAddressFilter', () => {
  it('renders the add filter button', () => {
    const mockProps = {
      addressFilters: [],
      addAddressFilter: vi.fn(),
      updateAddressFilter: vi.fn(),
      removeAddressFilter: vi.fn(),
      clearAllAddressFilters: vi.fn()
    };
    
    render(<ResidenceAddressFilter {...mockProps} />);
    
    // Check if the "Add Address Filter" button is rendered
    const addButton = screen.getByRole('button', { name: /add address filter/i });
    expect(addButton).toBeInTheDocument();
  });

  it('opens a dialog when the add button is clicked', () => {
    const mockProps = {
      addressFilters: [],
      addAddressFilter: vi.fn(),
      updateAddressFilter: vi.fn(),
      removeAddressFilter: vi.fn(),
      clearAllAddressFilters: vi.fn()
    };
    
    render(<ResidenceAddressFilter {...mockProps} />);
    
    // Click the "Add Address Filter" button
    const addButton = screen.getByRole('button', { name: /add address filter/i });
    fireEvent.click(addButton);
    
    // Check if the dialog is opened with a title - use a more specific selector
    const dialogTitle = screen.getByRole('heading', { name: /add address filter/i });
    expect(dialogTitle).toBeInTheDocument();
  });

  it('displays existing address filters', () => {
    const mockProps = {
      addressFilters: [
        {
          id: 'test-filter-1',
          residence_street_number: '123',
          residence_street_name: 'Main',
          residence_street_type: 'St',
          residence_city: 'Atlanta'
        }
      ],
      addAddressFilter: vi.fn(),
      updateAddressFilter: vi.fn(),
      removeAddressFilter: vi.fn(),
      clearAllAddressFilters: vi.fn()
    };
    
    render(<ResidenceAddressFilter {...mockProps} />);
    
    // Check if the existing filter is displayed
    expect(screen.getByText('Address Filter #1')).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    expect(screen.getByText(/Atlanta, GA/)).toBeInTheDocument();
    
    // Check if remove button exists
    const removeButton = screen.getByRole('button', { name: /remove address filter 1/i });
    expect(removeButton).toBeInTheDocument();
  });
}); 