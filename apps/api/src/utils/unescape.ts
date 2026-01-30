/**
 * Unescapes special characters in strings
 * Converts literal \n, \t, etc. to actual newlines, tabs, etc.
 */
export function unescapeString(str: string | undefined | null): string {
  if (!str) return '';

  return str
    .replace(/\\n/g, '\n')   // Convert \n to actual newline
    .replace(/\\t/g, '\t')   // Convert \t to actual tab
    .replace(/\\r/g, '\r')   // Convert \r to carriage return
    .replace(/\\\\/g, '\\'); // Convert \\ to single backslash
}

/**
 * Recursively unescape strings in an object
 */
export function unescapeObject(obj: any): any {
  if (!obj) return obj;

  if (typeof obj === 'string') {
    return unescapeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => unescapeObject(item));
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = unescapeObject(obj[key]);
    }
    return result;
  }

  return obj;
}
