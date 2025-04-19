import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { CountyMultiSelect } from '../page'; // Assuming the file path is correct

describe('CountyMultiSelect', () => {
  // Helper function to render with state management
  const RenderWrapper = ({ initialValue = [] }: { initialValue?: string[] }) => {
    const [value, setValue] = React.useState<string[]>(initialValue);
    return <CountyMultiSelect value={value} setValue={setValue} />;
  };

  it('renders and filters counties', () => {
    render(<RenderWrapper />);

    // Check if initial counties are present (use some known options)
    expect(screen.getByText('Fulton')).toBeInTheDocument();
    expect(screen.getByText('DeKalb')).toBeInTheDocument();

    // Get the search input
    const searchInput = screen.getByPlaceholderText(/search counties/i);
    expect(searchInput).toBeInTheDocument();

    // Filter by typing
    fireEvent.change(searchInput, { target: { value: 'Dek' } });

    // Check filtered results
    expect(screen.getByText('DeKalb')).toBeInTheDocument();
    expect(screen.queryByText('Fulton')).not.toBeInTheDocument();
  });

  it('selects and deselects a county', () => {
    render(<RenderWrapper />);

    const fultonCheckbox = screen.getByLabelText('Fulton');
    expect(fultonCheckbox).not.toBeChecked();

    // Select Fulton
    fireEvent.click(fultonCheckbox);
    expect(fultonCheckbox).toBeChecked();

    // Check if "Selected" label appears
    expect(screen.getByText('Selected')).toBeInTheDocument();

    // Deselect Fulton
    fireEvent.click(fultonCheckbox);
    expect(fultonCheckbox).not.toBeChecked();
  });

  it('clears all selected counties', () => {
    render(<RenderWrapper initialValue={['Fulton', 'Cobb']} />);

    // Check initial selections - expect TWO checkboxes for each selected county
    const fultonCheckboxes = screen.getAllByLabelText('Fulton');
    expect(fultonCheckboxes).toHaveLength(2);
    fultonCheckboxes.forEach(checkbox => expect(checkbox).toBeChecked());

    const cobbCheckboxes = screen.getAllByLabelText('Cobb');
    expect(cobbCheckboxes).toHaveLength(2);
    cobbCheckboxes.forEach(checkbox => expect(checkbox).toBeChecked());

    // Find and click the "Clear All" button
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearButton);

    // Check if selections are cleared - expect ONE UNCHECKED checkbox for each
    expect(screen.getByLabelText('Fulton')).not.toBeChecked(); // Only one instance remains
    expect(screen.getByLabelText('Cobb')).not.toBeChecked();   // Only one instance remains
    expect(screen.queryByText('Selected')).not.toBeInTheDocument(); // Selected section disappears
  });
}); 