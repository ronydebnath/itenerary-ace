import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewServicePricePage from './page';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { generateGUID } from '@/lib/utils';
import { ServicePriceItem } from '@/types/itinerary';

// Mocking Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mocking the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mocking the generateGUID utility
jest.mock('@/lib/utils', () => ({
  generateGUID: jest.fn(),
}));

// Mocking localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockPush = jest.fn();
const mockToast = jest.fn();

describe('NewServicePricePage', () => {
  beforeEach(() => {
    localStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useToast as jest.Mock).mockReturnValue({
      toast: mockToast,
    });
    (generateGUID as jest.Mock).mockReturnValue('mock-guid-123');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  // 1. Rendering the component.
  test('renders the page title and form', async () => {
    render(<NewServicePricePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Add New Service Price')).toBeInTheDocument();
    });
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to Pricing List/i })).toHaveAttribute('href', '/admin/pricing');
  });

  // 6. Rendering the loading state.
  test('renders loading state initially', () => {
    render(<NewServicePricePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });


  // 2. Loading initial data from localStorage.
  test('loads initial data from localStorage if available', async () => {
    const initialData = { name: 'Prefilled Item', price: 100, type: 'Activity' };
    localStorage.setItem('tempServicePricePrefillData', JSON.stringify(initialData));

    render(<NewServicePricePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Service Name/i)).toHaveValue('Prefilled Item');
      expect(screen.getByLabelText(/Price/i)).toHaveValue(100);
    });
    expect(localStorage.getItem('tempServicePricePrefillData')).toBeNull();
  });

  test('handles error when loading initial data from localStorage', async () => {
    jest.spyOn(localStorage, 'getItem').mockImplementationOnce(() => {
      throw new Error('localStorage read error');
    });

    render(<NewServicePricePage />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Could not load prefill data.',
          variant: 'destructive',
        })
      );
    });
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument(); // Ensure loading is finished despite error
  });


  // 3. Submitting the form and saving data to localStorage.
  test('submits the form and saves new service price to localStorage', async () => {
    render(<NewServicePricePage />);

    await waitFor(() => {
      expect(screen.getByText('Add New Service Price')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Service Name/i);
    const priceInput = screen.getByLabelText(/Price/i);
    const typeSelect = screen.getByLabelText(/Service Type/i);
    const notesInput = screen.getByLabelText(/Notes/i);

    fireEvent.change(nameInput, { target: { value: 'New Tour' } });
    fireEvent.change(priceInput, { target: { value: '50' } });
    fireEvent.change(typeSelect, { target: { value: 'Activity' } }); // Assuming Activity is an option
    fireEvent.change(notesInput, { target: { value: 'Some notes' } });

    const submitButton = screen.getByRole('button', { name: /Add Service Price/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const storedPrices = localStorage.getItem('itineraryAceServicePrices');
      expect(storedPrices).not.toBeNull();
      const parsedPrices: ServicePriceItem[] = JSON.parse(storedPrices!);
      expect(parsedPrices).toHaveLength(1);
      expect(parsedPrices[0]).toEqual({
        id: 'mock-guid-123',
        name: 'New Tour',
        price: 50,
        type: 'Activity',
        notes: 'Some notes',
        province: undefined, // Assuming these are not filled in the basic form
        category: undefined,
        hotel_type: undefined,
        room_type: undefined,
        duration_hours: undefined,
        distance_km: undefined,
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
          description: 'Service price "New Tour" added.',
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/pricing');
    });
  });

  test('appends new service price to existing data in localStorage', async () => {
    const existingPrice = { id: 'existing-guid', name: 'Old Tour', price: 20, type: 'Transfer' };
    localStorage.setItem('itineraryAceServicePrices', JSON.stringify([existingPrice]));

    render(<NewServicePricePage />);

    await waitFor(() => {
      expect(screen.getByText('Add New Service Price')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Service Name/i);
    const priceInput = screen.getByLabelText(/Price/i);
    const typeSelect = screen.getByLabelText(/Service Type/i);

    fireEvent.change(nameInput, { target: { value: 'Another Tour' } });
    fireEvent.change(priceInput, { target: { value: '75' } });
    fireEvent.change(typeSelect, { target: { value: 'Activity' } });

    const submitButton = screen.getByRole('button', { name: /Add Service Price/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const storedPrices = localStorage.getItem('itineraryAceServicePrices');
      expect(storedPrices).not.toBeNull();
      const parsedPrices: ServicePriceItem[] = JSON.parse(storedPrices!);
      expect(parsedPrices).toHaveLength(2);
      expect(parsedPrices[0]).toEqual(existingPrice);
      expect(parsedPrices[1]).toEqual(expect.objectContaining({
        id: 'mock-guid-123',
        name: 'Another Tour',
        price: 75,
        type: 'Activity',
      }));
      expect(mockPush).toHaveBeenCalledWith('/admin/pricing');
    });
  });


  // 4. Handling errors during localStorage operations.
  test('handles error when saving data to localStorage', async () => {
    render(<NewServicePricePage />);

    await waitFor(() => {
      expect(screen.getByText('Add New Service Price')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Service Name/i);
    const priceInput = screen.getByLabelText(/Price/i);
    const typeSelect = screen.getByLabelText(/Service Type/i);

    fireEvent.change(nameInput, { target: { value: 'Error Item' } });
    fireEvent.change(priceInput, { target: { value: '99' } });
    fireEvent.change(typeSelect, { target: { value: 'Hotel' } });

    jest.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
      throw new Error('localStorage write error');
    });

    const submitButton = screen.getByRole('button', { name: /Add Service Price/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Could not save new service price.',
          variant: 'destructive',
        })
      );
    });
    expect(mockPush).not.toHaveBeenCalled(); // Should not navigate on error
  });

  test('handles error when reading existing data from localStorage', async () => {
    jest.spyOn(localStorage, 'getItem').mockImplementationOnce((key) => {
        if (key === 'itineraryAceServicePrices') {
            throw new Error('localStorage read error on existing data');
        }
        return null; // For prefill data
    });

    render(<NewServicePricePage />);

    await waitFor(() => {
      expect(screen.getByText('Add New Service Price')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Service Name/i);
    const priceInput = screen.getByLabelText(/Price/i);
    const typeSelect = screen.getByLabelText(/Service Type/i);

    fireEvent.change(nameInput, { target: { value: 'New Item' } });
    fireEvent.change(priceInput, { target: { value: '50' } });
    fireEvent.change(typeSelect, { target: { value: 'Activity' } });

    const submitButton = screen.getByRole('button', { name: /Add Service Price/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Could not save new service price.', // The save error toast is shown as read error happens during saving process
          variant: 'destructive',
        })
      );
    });
    expect(mockPush).not.toHaveBeenCalled(); // Should not navigate on error
  });


  // 5. Navigation after successful submission and on cancel.
  test('navigates to pricing list on successful submission', async () => {
    render(<NewServicePricePage />);

    await waitFor(() => {
      expect(screen.getByText('Add New Service Price')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Service Name/i);
    const priceInput = screen.getByLabelText(/Price/i);
    const typeSelect = screen.getByLabelText(/Service Type/i);

    fireEvent.change(nameInput, { target: { value: 'Submit Test' } });
    fireEvent.change(priceInput, { target: { value: '123' } });
    fireEvent.change(typeSelect, { target: { value: 'Meal' } });

    const submitButton = screen.getByRole('button', { name: /Add Service Price/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success',
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/admin/pricing');
    });
  });

  test('navigates to pricing list on cancel', async () => {
    render(<NewServicePricePage />);

    await waitFor(() => {
      expect(screen.getByText('Add New Service Price')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith('/admin/pricing');
  });
});