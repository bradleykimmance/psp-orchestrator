// The orchestrator is a sandbox. It only ever accepts the published, public
// Stripe test PANs below — these are *not* real cardholder data, so no live
// card can enter the system and the worker stays out of PCI scope. Each test
// PAN maps to a canonical "instrument": a PSP-agnostic id naming the scenario
// it exercises. Adapters translate that canonical id into their own PSP token
// (e.g. Stripe's `pm_card_*`), which is what keeps real card numbers from ever
// reaching a downstream PSP. A card outside this list is rejected at the edge.

const TEST_CARDS = [
  {
    instrument: 'visa-approved',
    pan: '4242424242424242',
    scenario: 'Approved',
  },
  {
    instrument: 'visa-declined',
    pan: '4000000000000002',
    scenario: 'Generic decline',
  },
  {
    instrument: 'visa-insufficient-funds',
    pan: '4000000000009995',
    scenario: 'Insufficient funds',
  },
  {
    instrument: 'mastercard-approved',
    pan: '5555555555554444',
    scenario: 'Approved (Mastercard)',
  },
  {
    instrument: 'amex-approved',
    pan: '378282246310005',
    scenario: 'Approved (AMEX)'
  }
] as const;

export type TestInstrument = (typeof TEST_CARDS)[number]['instrument'];

const PAN_TO_INSTRUMENT = new Map<string, TestInstrument>(
  TEST_CARDS.map((card) => [card.pan, card.instrument]),
);

// Resolve a card number to its canonical instrument, or `undefined` if the PAN
// is not one of the sandbox test cards.
export const instrumentForPan = (pan: string): TestInstrument | undefined =>
  PAN_TO_INSTRUMENT.get(pan);
