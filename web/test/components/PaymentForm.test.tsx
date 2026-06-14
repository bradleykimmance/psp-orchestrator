import { PaymentForm } from '../../src/components/PaymentForm.tsx';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockFetch = (body: unknown, ok = true): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(
      async () => ({ json: async () => body, ok }) as Response,
    ),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PaymentForm', () => {
  it('prefills a documented test card so no real PAN is needed', () => {
    render(<PaymentForm />);
    expect(screen.getByLabelText(/card number/iu)).toHaveValue(
      '4242424242424242',
    );
    expect(screen.getByLabelText(/expiry/iu)).toHaveValue('12 / 27');
  });

  it('sends the canonical request and renders both canonical and raw views', async () => {
    mockFetch({
      pspReference: 'pi_123',
      rawResponse: {
        id: 'pi_123',
        object: 'payment_intent',
        status: 'requires_capture',
      },
      status: 'authorised',
    });

    render(<PaymentForm />);
    fireEvent.click(screen.getByRole('button', { name: /authorise/iu }));

    await waitFor(() => {
      expect(screen.getByText(/"status": "authorised"/u)).toBeInTheDocument();
    });

    const init = vi.mocked(fetch).mock.calls[0][1];
    const sent = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(sent).toMatchObject({
      amount: 4_200,
      currency: 'GBP',
      psp: 'stripe',
    });
    expect(sent.card).toMatchObject({
      expiry: '1227',
      number: '4242424242424242',
    });

    fireEvent.click(screen.getByRole('tab', { name: /raw psp/iu }));
    expect(screen.getByText(/"object": "payment_intent"/u)).toBeInTheDocument();
  });

  it('surfaces a transport error to the user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => {
        throw new Error('offline');
      }),
    );
    render(<PaymentForm />);
    fireEvent.click(screen.getByRole('button', { name: /authorise/iu }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not reach/iu);
    });
  });
});
