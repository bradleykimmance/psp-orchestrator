export const PSPS = ['stripe', 'adyen'] as const;

export type Psp = (typeof PSPS)[number];
