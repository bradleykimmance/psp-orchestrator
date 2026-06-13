import { DEFAULT_TEST_CARD, TEST_CARDS } from '../data/testCards.ts';
import { authorize, PaymentError } from '../lib/api.ts';
import {
  type CanonicalRequest,
  type CanonicalResponse,
  type Psp,
  PSP_LABELS,
  PSPS,
} from '../lib/canonical.ts';
import { PayloadViewer } from './PayloadViewer.tsx';
import { useState } from 'react';
import * as React from 'react';

const CURRENCIES = ['GBP', 'USD', 'EUR'] as const;
type Currency = (typeof CURRENCIES)[number];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$',
};

type CardBrand = 'amex' | 'mastercard' | 'unknown' | 'visa';

const cardBrand = (value: string): CardBrand => {
  const digits = value.replaceAll(/\D/gu, '');

  if (digits.startsWith('4')) {
    return 'visa';
  }

  if (/^(?:5[1-5]|2[2-7])/u.test(digits)) {
    return 'mastercard';
  }

  if (/^3[47]/u.test(digits)) {
    return 'amex';
  }

  return 'unknown';
};

const BRAND_LABELS: Record<Exclude<CardBrand, 'unknown'>, string> = {
  amex: 'Amex',
  mastercard: 'Mastercard',
  visa: 'Visa',
};

const toMinorUnits = (major: string): number =>
  Math.round(Number(major) * 100);

// Mask keystrokes into 'MM / YY'. A leading month pads to 0X so the slash advances.
const formatExpiry = (input: string): string => {
  const digits = input.replaceAll(/\D/gu, '').slice(0, 4);
  const normalised =
    digits.length === 1 && Number(digits) > 1 ? `0${digits}` : digits;
  if (normalised.length <= 2) {
    return normalised;
  }

  return `${normalised.slice(0, 2)} / ${normalised.slice(2)}`;
};

const toMMYY = (display: string): string =>
  display.replaceAll(/\D/gu, '').slice(0, 4);

type FormState = {
  // Major units as typed, e.g. '42.00'.
  amount: string;
  currency: Currency;
  cvc: string;
  // Display value, e.g. '12 / 27'.
  expiry: string;
  number: string;
  psp: Psp;
  reference: string;
};

const INITIAL: FormState = {
  amount: '42.00',
  currency: 'GBP',
  cvc: DEFAULT_TEST_CARD.cvc,
  expiry: formatExpiry(DEFAULT_TEST_CARD.expiry),
  number: DEFAULT_TEST_CARD.number,
  psp: 'stripe',
  reference: 'ORD-123',
};

type FieldProps = {
  readonly children: React.ReactNode;
  readonly htmlFor: string;
  readonly label: string;
};

const Field = ({ children, htmlFor, label }: FieldProps) => (
  <label
    className="block"
    htmlFor={htmlFor}
  >
    <span className="mb-1.5 block text-xs font-semibold tracking-wide text-warm-gray-600 uppercase dark:text-cream-200">
      {label}
    </span>
    {children}
  </label>
);

const SectionHeading = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => (
  <h2 className="border-b border-cream-200 pb-1.5 text-sm font-semibold tracking-wide text-warm-gray-700 uppercase dark:border-espresso-700 dark:text-cream-100">
    {children}
  </h2>
);

const toCanonical = (form: FormState): CanonicalRequest => ({
  amount: toMinorUnits(form.amount),
  card: {
    cvc: form.cvc,
    expiry: toMMYY(form.expiry),
    number: form.number.replaceAll(/\s/gu, ''),
  },
  currency: form.currency,
  psp: form.psp,
  reference: form.reference,
});

const INPUT_CLASS =
  'w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 dark:border-espresso-700 dark:bg-espresso-800';

export const PaymentForm = () => {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [result, setResult] = useState<CanonicalResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  const brand = cardBrand(form.number);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const applyTestCard = (number: string) => {
    const card = TEST_CARDS.find((candidate) => candidate.number === number);
    if (!card) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      cvc: card.cvc,
      expiry: formatExpiry(card.expiry),
      number: card.number,
    }));
  };

  const onSubmit = async (event: React.SubmitEvent) => {
    event.preventDefault();
    setPending(true);
    setErrorMessage(null);
    setResult(null);
    try {
      setResult(await authorize(toCanonical(form)));
    } catch (error) {
      setErrorMessage(
        error instanceof PaymentError ? error.message : 'Something went wrong.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <form
        className="space-y-5 rounded-xl bg-cream-100 p-6 dark:bg-espresso-900"
        onSubmit={onSubmit}
      >
        <Field
          htmlFor="psp"
          label="Provider"
        >
          <select
            className={INPUT_CLASS}
            id="psp"
            onChange={(event) => {
              update('psp', event.target.value as Psp);
            }}
            value={form.psp}
          >
            {PSPS.map((psp) => (
              <option
                key={psp}
                value={psp}
              >
                {PSP_LABELS[psp]}
              </option>
            ))}
          </select>
        </Field>

        <section className="space-y-4">
          <SectionHeading>Order details</SectionHeading>

          <Field
            htmlFor="amount"
            label="Amount"
          >
            <div className="flex items-stretch overflow-hidden rounded-lg border border-cream-200 bg-cream-50 focus-within:border-gold-400 dark:border-espresso-700 dark:bg-espresso-800">
              <select
                aria-label="Currency"
                className="border-r border-cream-200 bg-cream-100 px-3 font-semibold focus:outline-none dark:border-espresso-700 dark:bg-espresso-900"
                id="currency"
                onChange={(event) => {
                  update('currency', event.target.value as Currency);
                }}
                value={form.currency}
              >
                {CURRENCIES.map((currency) => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                ))}
              </select>
              <span className="flex items-center pl-3 text-warm-gray-500 dark:text-cream-200">
                {CURRENCY_SYMBOLS[form.currency]}
              </span>
              <input
                className="w-full bg-transparent px-2 py-2 tabular-nums focus:outline-none"
                id="amount"
                inputMode="decimal"
                onChange={(event) => {
                  update('amount', event.target.value);
                }}
                placeholder="0.00"
                value={form.amount}
              />
            </div>
          </Field>

          <Field
            htmlFor="reference"
            label="Reference"
          >
            <input
              className={INPUT_CLASS}
              id="reference"
              onChange={(event) => {
                update('reference', event.target.value);
              }}
              value={form.reference}
            />
          </Field>
        </section>

        <section className="space-y-4">
          <SectionHeading>Card details</SectionHeading>

          <Field
            htmlFor="number"
            label="Card number"
          >
            <div className="relative">
              <input
                autoComplete="cc-number"
                className={`${INPUT_CLASS} pr-24 font-mono`}
                id="number"
                inputMode="numeric"
                onChange={(event) => {
                  update('number', event.target.value);
                }}
                value={form.number}
              />
              {brand === 'unknown' ? null : (
                <span className="absolute inset-y-0 right-2.5 my-auto flex h-fit items-center rounded bg-cream-200/70 px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-warm-gray-600 uppercase dark:bg-espresso-700 dark:text-cream-200">
                  {BRAND_LABELS[brand]}
                </span>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field
              htmlFor="expiry"
              label="Expiry"
            >
              <input
                autoComplete="cc-exp"
                className={`${INPUT_CLASS} font-mono`}
                id="expiry"
                inputMode="numeric"
                maxLength={7}
                onChange={(event) => {
                  update('expiry', formatExpiry(event.target.value));
                }}
                placeholder="MM / YY"
                value={form.expiry}
              />
            </Field>
            <Field
              htmlFor="cvc"
              label="CVC"
            >
              <input
                autoComplete="cc-csc"
                className={`${INPUT_CLASS} font-mono`}
                id="cvc"
                inputMode="numeric"
                maxLength={4}
                onChange={(event) => {
                  update('cvc', event.target.value);
                }}
                placeholder="123"
                value={form.cvc}
              />
            </Field>
          </div>
        </section>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide text-warm-gray-600 uppercase dark:text-cream-200">
            Sandbox test cards
          </legend>
          <div className="flex flex-wrap gap-2">
            {TEST_CARDS.map((card) => (
              <button
                className="rounded-full border border-cream-200 px-3 py-1 text-xs hover:border-gold-400 dark:border-espresso-700"
                key={card.number}
                onClick={() => {
                  applyTestCard(card.number);
                }}
                type="button"
              >
                {card.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          className="w-full rounded-lg bg-gold-500 px-4 py-2.5 font-semibold text-espresso-950 transition hover:bg-gold-400 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? 'Authorising…' : 'Authorise (sandbox)'}
        </button>

        {errorMessage ? (
          <p
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
      </form>

      {result ? <PayloadViewer result={result} /> : null}
    </div>
  );
};
