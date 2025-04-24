// Utility for age range SQL logic

export const AGE_RANGES = [
  { label: '18-23', getSql: (currentYear: number) => `(birth_year <= ${currentYear - 18} AND birth_year >= ${currentYear - 23})` },
  { label: '25-44', getSql: (currentYear: number) => `(birth_year <= ${currentYear - 25} AND birth_year >= ${currentYear - 44})` },
  { label: '45-64', getSql: (currentYear: number) => `(birth_year <= ${currentYear - 45} AND birth_year >= ${currentYear - 64})` },
  { label: '65-74', getSql: (currentYear: number) => `(birth_year <= ${currentYear - 65} AND birth_year >= ${currentYear - 74})` },
  { label: '75+',   getSql: (currentYear: number) => `(birth_year <= ${currentYear - 75})` },
];

export function getAgeRangeSql(label: string, currentYear: number): string | undefined {
  const range = AGE_RANGES.find(r => r.label === label);
  return range ? range.getSql(currentYear) : undefined;
} 