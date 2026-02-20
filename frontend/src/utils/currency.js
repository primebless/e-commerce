const numberFormatter = new Intl.NumberFormat('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatKES = (value) => `Ksh ${numberFormatter.format(Number(value || 0))}`;
