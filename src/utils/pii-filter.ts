const PII_FIELD_NAMES = new Set([
  'email', 'phone', 'mobile', 'password', 'passwd', 'secret', 'token',
  'ssn', 'credit_card', 'card_number', 'cvv', 'dob', 'date_of_birth',
  'address', 'first_name', 'last_name', 'full_name', 'national_id',
  'passport', 'ip_address', 'latitude', 'longitude', 'tfa_secret', 'db_connection'
]);

const PII_REGEXES = [
  /[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}/,               // email
  /\+?\d[\d\s\-(). ]{7,}\d/,                         // phone
  /\b\d{3}-\d{2}-\d{4}\b/,                           // US SSN
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,    // credit card
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,         // IPv4
];

function isPiiFieldName(key: string): boolean {
  return PII_FIELD_NAMES.has(key.toLowerCase());
}

function matchesPiiRegex(value: string): boolean {
  return PII_REGEXES.some(re => re.test(value));
}

function isMetabaseQueryResult(obj: Record<string, unknown>): boolean {
  const data = obj.data as Record<string, unknown> | undefined;
  return (
    data !== null &&
    typeof data === 'object' &&
    Array.isArray(data.cols) &&
    Array.isArray(data.rows)
  );
}

function filterMetabaseQueryResult(obj: Record<string, unknown>): Record<string, unknown> {
  const data = obj.data as Record<string, unknown>;
  const cols = data.cols as Array<Record<string, unknown>>;
  const rows = data.rows as unknown[][];

  const colNames = cols.map(c => String(c.name ?? ''));

  const filteredRows = rows.map(row =>
    row.map((cell, i) => {
      const colName = colNames[i] ?? '';
      if (isPiiFieldName(colName)) return '[REDACTED]';
      if (typeof cell === 'string' && matchesPiiRegex(cell)) return '[REDACTED]';
      return cell;
    })
  );

  return {
    ...obj,
    data: { ...data, rows: filteredRows },
  };
}

export function filterPii(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => filterPii(item));
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;

    // Special handling for Metabase query results: rows are positional arrays,
    // so we match values to column names from cols[] instead of object keys.
    if (isMetabaseQueryResult(obj)) {
      return filterMetabaseQueryResult(obj);
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (isPiiFieldName(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = filterPii(val);
      }
    }
    return result;
  }

  if (typeof value === 'string' && matchesPiiRegex(value)) {
    return '[REDACTED]';
  }

  return value;
}

export function filterPiiFromToolResult(result: string): string {
  try {
    const parsed = JSON.parse(result);
    const filtered = filterPii(parsed);
    return JSON.stringify(filtered, null, 2);
  } catch {
    // Not valid JSON — apply regex on the raw string directly
    if (typeof result === 'string' && matchesPiiRegex(result)) {
      return '[REDACTED]';
    }
    return result;
  }
}
