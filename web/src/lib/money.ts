// '42.00' -> 4200 minor units. Non-numeric input yields NaN, which the Worker rejects.
export const toMinorUnits = (major: string): number =>
  Math.round(Number(major) * 100);
