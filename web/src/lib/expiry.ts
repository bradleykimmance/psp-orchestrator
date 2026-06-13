// Mask keystrokes into 'MM / YY'. A leading month pads to 0X so the slash advances.
export const formatExpiry = (input: string): string => {
  const digits = input.replaceAll(/\D/gu, '').slice(0, 4);
  const normalised =
    digits.length === 1 && Number(digits) > 1 ? `0${digits}` : digits;
  if (normalised.length <= 2) {
    return normalised;
  }

  return `${normalised.slice(0, 2)} / ${normalised.slice(2)}`;
};

// 'MM / YY' -> '1227'.
export const toMMYY = (display: string): string =>
  display.replaceAll(/\D/gu, '').slice(0, 4);
