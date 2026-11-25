/**
 * Builds the "col = $n" fragments for a partial UPDATE.
 * `columns` maps patch keys to column names; use "col::type" to add a cast (e.g. "working_days::jsonb").
 * Placeholders start at $startAt.
 */
export function buildSet(patch: Record<string, unknown>, columns: Record<string, string>, startAt = 1) {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, spec] of Object.entries(columns)) {
    const value = patch[key];
    if (value === undefined) continue;
    const [column, cast] = spec.split("::");
    values.push(value);
    sets.push(`${column} = $${startAt + values.length - 1}${cast ? `::${cast}` : ""}`);
  }
  return { sets, values };
}
