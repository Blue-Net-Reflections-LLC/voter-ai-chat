import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { CountyMultiSelect } from '../components/CountyMultiSelect';

// Mock the useLookupData hook
vi.mock('../hooks/useLookupData', () => ({
  useLookupData: () => ({
    counties: [
      { value: 'FULTON', label: 'Fulton' },
      { value: 'DEKALB', label: 'DeKalb' },
      { value: 'COBB', label: 'Cobb' }
    ],
    isLoading: false,
    error: null
  })
}));

describe('CountyMultiSelect', () => {
  it('renders with county options', () => {
    const mockSetValue = vi.fn();
    render(<CountyMultiSelect value={[]} setValue={mockSetValue} />);
    
    // Verify component renders with expected elements
    expect(screen.getByText('County')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search counties...')).toBeInTheDocument();
    expect(screen.getByText('Fulton')).toBeInTheDocument();
    expect(screen.getByText('DeKalb')).toBeInTheDocument();
    expect(screen.getByText('Cobb')).toBeInTheDocument();
  });

  it('allows selecting a county', () => {
    const mockSetValue = vi.fn();
    render(<CountyMultiSelect value={[]} setValue={mockSetValue} />);
    
    // Find and click the Fulton checkbox
    const fultonCheckbox = screen.getByLabelText('Fulton');
    fireEvent.click(fultonCheckbox);
    
    // Verify setValue was called with the correct value
    expect(mockSetValue).toHaveBeenCalledWith(['FULTON']);
  });

  it('displays the clear button when counties are selected', () => {
    const mockSetValue = vi.fn();
    render(<CountyMultiSelect value={['FULTON']} setValue={mockSetValue} />);
    
    // Verify the clear button is displayed
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    expect(clearButton).toBeInTheDocument();
    
    // Click the clear button
    fireEvent.click(clearButton);
    
    // Verify setValue was called with an empty array
    expect(mockSetValue).toHaveBeenCalledWith([]);
  });
}); 