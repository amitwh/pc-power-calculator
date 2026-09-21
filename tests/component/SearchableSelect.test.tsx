import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const options = [
  { value: 'cpu-intel-i9-14900k', label: 'Intel Core i9-14900K (125 W)', meta: { brand: 'Intel', year: 2023 } },
  { value: 'cpu-amd-ryzen9-7950x', label: 'AMD Ryzen 9 7950X (170 W)', meta: { brand: 'AMD', year: 2022 } },
  { value: 'cpu-apple-m4', label: 'Apple M4 (22 W)', meta: { brand: 'Apple', year: 2024 } },
  { value: 'gpu-nvidia-rtx4090', label: 'NVIDIA GeForce RTX 4090 (450 W)', meta: { brand: 'NVIDIA', year: 2022 } },
];

describe('SearchableSelect', () => {
  test('renders trigger button with placeholder when nothing selected', () => {
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={() => {}}
        placeholder="Choose CPU…"
        ariaLabel="CPU picker"
      />,
    );
    expect(screen.getByRole('button', { name: /CPU picker/i })).toBeInTheDocument();
    expect(screen.getByText('Choose CPU…')).toBeInTheDocument();
  });

  test('renders trigger with selected option label', () => {
    render(
      <SearchableSelect
        options={options}
        value="cpu-intel-i9-14900k"
        onChange={() => {}}
        placeholder="Choose…"
      />,
    );
    expect(screen.getByText(/Intel Core i9-14900K/i)).toBeInTheDocument();
  });

  test('opens listbox on click and shows all options', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={() => {}} ariaLabel="CPU" />);
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText(/Intel Core i9-14900K/i)).toBeInTheDocument();
    expect(screen.getByText(/AMD Ryzen 9 7950X/i)).toBeInTheDocument();
    expect(screen.getByText(/Apple M4/i)).toBeInTheDocument();
  });

  test('search input filters options by free-text query', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={() => {}} ariaLabel="CPU" />);
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    const input = screen.getByRole('searchbox');
    await user.type(input, 'ryzen');
    expect(screen.queryByText(/Intel Core i9-14900K/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Apple M4/i)).not.toBeInTheDocument();
    expect(screen.getByText(/AMD Ryzen 9 7950X/i)).toBeInTheDocument();
  });

  test('brand chip filters by brand', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={() => {}} ariaLabel="Hardware" />);
    await user.click(screen.getByRole('button', { name: /Hardware/i }));
    // Click Intel brand chip
    const intelChip = screen.getByRole('button', { name: /^Intel \(\d+\)$/ });
    await user.click(intelChip);
    expect(screen.getByText(/Intel Core i9-14900K/i)).toBeInTheDocument();
    expect(screen.queryByText(/AMD Ryzen 9 7950X/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Apple M4/i)).not.toBeInTheDocument();
  });

  test('brand chip is a toggle — clicking again clears filter', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={() => {}} ariaLabel="Hardware" />);
    await user.click(screen.getByRole('button', { name: /Hardware/i }));
    const intelChip = screen.getByRole('button', { name: /^Intel \(\d+\)$/ });
    await user.click(intelChip);
    expect(screen.queryByText(/AMD Ryzen 9 7950X/i)).not.toBeInTheDocument();
    await user.click(intelChip);
    expect(screen.getByText(/AMD Ryzen 9 7950X/i)).toBeInTheDocument();
  });

  test('clicking an option calls onChange with its value and closes the listbox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchableSelect options={options} value="" onChange={onChange} ariaLabel="CPU" />);
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    await user.click(screen.getByRole('option', { name: /Intel Core i9-14900K/ }));
    expect(onChange).toHaveBeenCalledWith('cpu-intel-i9-14900k');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('Escape closes the listbox without selecting', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchableSelect options={options} value="" onChange={onChange} ariaLabel="CPU" />);
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('outside click closes the listbox', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SearchableSelect options={options} value="" onChange={() => {}} ariaLabel="CPU" />
        <button type="button">elsewhere</button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /elsewhere/i }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('shows empty message when no options match', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="" onChange={() => {}} ariaLabel="CPU" />);
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    await user.type(screen.getByRole('searchbox'), 'zzzzzz');
    expect(screen.getByText(/No matches/i)).toBeInTheDocument();
  });

  test('selects existing value is marked with aria-selected', async () => {
    const user = userEvent.setup();
    render(<SearchableSelect options={options} value="cpu-apple-m4" onChange={() => {}} ariaLabel="CPU" />);
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    const selectedOption = screen.getByRole('option', { name: /Apple M4/ });
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  });

  test('keyboard Enter on option selects it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchableSelect options={options} value="" onChange={onChange} ariaLabel="CPU" />);
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    const option = screen.getByRole('option', { name: /AMD Ryzen 9 7950X/ });
    option.focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('cpu-amd-ryzen9-7950x');
  });

  test('brandFilter=false hides brand chips', async () => {
    const user = userEvent.setup();
    render(
      <SearchableSelect
        options={options}
        value=""
        onChange={() => {}}
        ariaLabel="CPU"
        brandFilter={false}
      />,
    );
    await user.click(screen.getByRole('button', { name: /CPU/i }));
    expect(screen.queryByRole('button', { name: /^Intel/i })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });
});