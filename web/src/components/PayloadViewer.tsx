import { useState } from 'react';
import { type CanonicalResponse, type CanonicalStatus } from 'shared/canonical';

const STATUS_STYLES: Record<CanonicalStatus, string> = {
  authorised: 'bg-green-500',
  error: 'bg-warm-gray-500',
  pending: 'bg-gold-400',
  refused: 'bg-red-500',
};

type Tab = 'canonical' | 'raw';

type TabButtonProps = {
  readonly active: boolean;
  readonly children: string;
  readonly onClick: () => void;
};

const TabButton = ({ active, children, onClick }: TabButtonProps) => (
  <button
    aria-selected={active}
    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-gold-500 text-espresso-950'
        : 'text-warm-gray-600 hover:bg-cream-100 dark:text-cream-200 dark:hover:bg-espresso-800'
    }`}
    onClick={onClick}
    role="tab"
    type="button"
  >
    {children}
  </button>
);

type PayloadViewerProps = {
  readonly result: CanonicalResponse;
};

// Toggle between the normalised canonical result and the raw PSP payload.
export const PayloadViewer = ({ result }: PayloadViewerProps) => {
  const [tab, setTab] = useState<Tab>('canonical');

  const canonicalView = {
    ...(result.pspReference ? { pspReference: result.pspReference } : {}),
    ...(result.errorCode ? { errorCode: result.errorCode } : {}),
    ...(result.errorMessage ? { errorMessage: result.errorMessage } : {}),
    ...(result.amount ? { amount: result.amount } : {}),
    ...(result.currency ? { currency: result.currency } : {}),
    status: result.status,
  };
  const shown = tab === 'canonical' ? canonicalView : result.rawResponse;

  return (
    <section className="mt-8 rounded-xl border border-cream-200 dark:border-espresso-700">
      <header className="flex items-center justify-between border-b border-cream-200 px-5 py-3 dark:border-espresso-700">
        <h2 className="text-sm font-semibold tracking-wide text-warm-gray-600 uppercase dark:text-cream-200">
          Result
        </h2>
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <span
            aria-hidden
            className={`size-2.5 rounded-full ${STATUS_STYLES[result.status]}`}
          />
          {result.status}
        </span>
      </header>

      <div
        aria-label="Response view"
        className="flex gap-1 px-5 pt-4"
        role="tablist"
      >
        <TabButton
          active={tab === 'canonical'}
          onClick={() => {
            setTab('canonical');
          }}
        >
          Canonical
        </TabButton>
        <TabButton
          active={tab === 'raw'}
          onClick={() => {
            setTab('raw');
          }}
        >
          Raw PSP
        </TabButton>
      </div>

      <pre className="m-5 mt-3 overflow-x-auto rounded-lg bg-espresso-950 p-4 text-sm text-cream-100">
        <code>{JSON.stringify(shown, null, 2)}</code>
      </pre>
    </section>
  );
};
