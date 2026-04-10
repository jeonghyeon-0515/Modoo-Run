export const PROFILE_DISTANCE_OPTIONS = ['5km', '10km', '하프', '풀'] as const;

export function normalizeMultiSelectValues(values: Iterable<FormDataEntryValue | string>) {
  return [...new Set([...values].map((value) => String(value).trim()).filter(Boolean))];
}
