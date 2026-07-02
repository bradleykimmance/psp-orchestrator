import {
  CURRENCIES,
  type Currency,
  CURRENCY_SYMBOLS,
} from '../data/currencies.ts';
import { PSP_LABELS } from '../data/psps.ts';
import { DEFAULT_TEST_CARD, TEST_CARDS } from '../data/testCards.ts';
import { authorize, PaymentError } from '../lib/api.ts';
import { BRAND_LABELS, cardBrand } from '../lib/cardBrand.ts';
import { formatExpiry, toMMYY } from '../lib/expiry.ts';
import { toMinorUnits } from '../lib/money.ts';
import { PayloadViewer } from './PayloadViewer.tsx';
import { useState } from 'react';
import * as React from 'react';
import {
  type CanonicalRequest,
  type CanonicalResponse,
} from 'shared/canonical';
import { type Psp, PSPS } from 'shared/psps';

type FormState = {
  // Major units as typed, e.g. '42.00'.
  amount: string;
  currency: Currency;
  cvc: string;
  // Display value, e.g. '12 / 27'.
  expiry: string;
  name: string;
  number: string;
  psp: Psp;
  reference: string;
};

const INITIAL: FormState = {
  amount: '42.00',
  currency: 'GBP',
  cvc: DEFAULT_TEST_CARD.cvc,
  expiry: formatExpiry(DEFAULT_TEST_CARD.expiry),
  name: 'Brad Test',
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

const toCanonical = (
  form: FormState,
  idempotencyKey: string,
): CanonicalRequest => ({
  amount: toMinorUnits(form.amount),
  card: {
    cvc: form.cvc,
    expiry: toMMYY(form.expiry),
    name: form.name.trim(),
    number: form.number.replaceAll(/\s/gu, ''),
  },
  currency: form.currency,
  idempotencyKey,
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
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID(),
  );

  const rotateIdempotencyKey = () => {
    setIdempotencyKey(crypto.randomUUID());
  };

  const brand = cardBrand(form.number);

  const selectedTestCard = TEST_CARDS.find(
    (card) =>
      card.number === form.number.replaceAll(/\s/gu, '') &&
      card.cvc === form.cvc &&
      card.expiry === toMMYY(form.expiry),
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    rotateIdempotencyKey();
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const applyTestCard = (number: string) => {
    const card = TEST_CARDS.find((candidate) => candidate.number === number);
    if (!card) {
      return;
    }

    rotateIdempotencyKey();
    setForm((previous) => ({
      ...previous,
      cvc: card.cvc,
      expiry: formatExpiry(card.expiry),
      number: card.number,
    }));
  };

  const changePsp = (psp: Psp) => {
    rotateIdempotencyKey();
    setForm((previous) => {
      const current = TEST_CARDS.find(
        (card) => card.number === previous.number.replaceAll(/\s/gu, ''),
      );
      if (
        !current ||
        current.worksWith === 'both' ||
        current.worksWith === psp
      ) {
        return { ...previous, psp };
      }

      const replacement = TEST_CARDS.find(
        (card) =>
          card.worksWith === psp &&
          card.expect === current.expect &&
          cardBrand(card.number) === cardBrand(current.number),
      );
      if (!replacement) {
        return { ...previous, psp };
      }

      return {
        ...previous,
        cvc: replacement.cvc,
        expiry: formatExpiry(replacement.expiry),
        number: replacement.number,
        psp,
      };
    });
  };

  const onSubmit = async (event: React.SubmitEvent) => {
    event.preventDefault();
    setPending(true);
    setErrorMessage(null);
    setResult(null);
    try {
      const response = await authorize(toCanonical(form, idempotencyKey));
      setResult(response);

      if (response.status !== 'error') {
        rotateIdempotencyKey();
      }
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
              changePsp(event.target.value as Psp);
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
            htmlFor="name"
            label="Name on card"
          >
            <input
              autoComplete="cc-name"
              className={INPUT_CLASS}
              id="name"
              onChange={(event) => {
                update('name', event.target.value);
              }}
              value={form.name}
            />
          </Field>

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
            {TEST_CARDS.filter(
              (card) =>
                card.worksWith === 'both' || card.worksWith === form.psp,
            ).map((card) => (
              <button
                aria-pressed={card === selectedTestCard}
                className={
                  card === selectedTestCard
                    ? 'cursor-pointer rounded-full border border-gold-400 bg-gold-500/10 px-3 py-1 text-xs font-semibold'
                    : 'cursor-pointer rounded-full border border-cream-200 px-3 py-1 text-xs hover:border-gold-400 dark:border-espresso-700'
                }
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
          className="w-full cursor-pointer rounded-lg bg-gold-500 px-4 py-2.5 font-semibold text-espresso-950 transition hover:bg-gold-400 disabled:cursor-default disabled:opacity-60"
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
