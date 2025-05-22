export const ensureStringArray = (value: string | boolean | string[] | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') return [value];
  return []; // Should not happen with proper FilterState types, but good for safety
};

export const formatDateLabel = (dateString: string): string => {
  try {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return dateString; // Fallback to original string on error
  }
}; 