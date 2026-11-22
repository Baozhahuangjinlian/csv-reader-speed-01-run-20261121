// solve.js — a fast reader for broken CSV text, matching csv-reader 1.0.0.
// Written from scratch from the competition's written spec: one
// left-to-right pass over commas and double quotes.
//
// The reading, in brief: a U+FEFF at the very start is dropped; a record
// ends at LF or CRLF, and a line left with no characters is no record;
// outside quotes a CR not followed by LF is dropped (stray_cr); a field
// opening with a quote runs to the next undoubled quote, "" inside is one
// quote, CRLF or a lone CR inside reads as LF, and what follows the
// closing quote up to the next comma or line break is appended as it
// stands (quote_junk); a quote that never closes is a literal character
// and the text after it is read again as unquoted (unterminated_quote);
// a quote inside an unquoted field is literal; fields stay strings.
// columns is the first record when header is true, else null; rows are
// the records after it, each padded (short_row) or cut (long_row) to the
// first record's width. Errors are {code, line, row} in the order met.

const COMMA = 44; // ,
const QUOTE = 34; // "
const LF = 10;    // \n
const CR = 13;    // \r

export function run(input) {
  const text = input.text;
  const header = input.header === true;
  const n = text.length;
  let i = 0;
  if (n > 0 && text.charCodeAt(0) === 0xfeff) i = 1;

  let line = 1;
  const rows = [];
  const errors = [];
  let columns = null;
  let width = -1;
  let first = true;

  // Store one finished record: the first sets the width (and becomes
  // columns when there is a header); the rest are padded or cut to it.
  function store(fields, recLine, recRow) {
    if (first) {
      width = fields.length;
      first = false;
      if (header) { columns = fields; return; }
      rows.push(fields);
      return;
    }
    const len = fields.length;
    if (len < width) {
      errors.push({ code: 'short_row', line: recLine, row: recRow, fields: len });
      for (let k = len; k < width; k++) fields.push('');
    } else if (len > width) {
      errors.push({ code: 'long_row', line: recLine, row: recRow, extra: fields.slice(width) });
      fields.length = width;
    }
    rows.push(fields);
  }

  // Parse one unquoted field starting at i. Leaves i at the next comma,
  // line break, or end of input, and returns the value with any stray CR
  // dropped (each one an error).
  function parseUnquoted(recLine, recRow) {
    let end = n;
    const c = text.indexOf(',', i);
    if (c !== -1) end = c;
    const l = text.indexOf('\n', i);
    if (l !== -1 && l < end) end = l;
    const r = text.indexOf('\r', i);
    if (r === -1 || r >= end) {
      const v = text.slice(i, end);
      i = end;
      return v;
    }
    if (text.charCodeAt(r + 1) === LF) {
      // The CR is the CR of a CRLF: the field ends here.
      const v = text.slice(i, r);
      i = r;
      return v;
    }
    // Stray CRs inside the field: drop each, keep the rest.
    let v = text.slice(i, r);
    let p = r;
    for (;;) {
      errors.push({ code: 'stray_cr', line: recLine, row: recRow });
      p++;
      let e2 = n;
      const c2 = text.indexOf(',', p);
      if (c2 !== -1) e2 = c2;
      const l2 = text.indexOf('\n', p);
      if (l2 !== -1 && l2 < e2) e2 = l2;
      const r2 = text.indexOf('\r', p);
      if (r2 !== -1 && r2 < e2) {
        if (text.charCodeAt(r2 + 1) === LF) {
          v += text.slice(p, r2);
          i = r2;
          return v;
        }
        v += text.slice(p, r2);
        p = r2;
        continue;
      }
      v += text.slice(p, e2);
      i = e2;
      return v;
    }
  }

  // Parse one quoted field starting at i (text[i] === '"'). Returns the
  // value and leaves i at the next comma, line break, or end of input.
  function parseQuoted(recLine, recRow) {
    const start = i + 1;
    let q = start;
    let closed = -1;
    let escaped = false;
    for (;;) {
      const nq = text.indexOf('"', q);
      if (nq === -1) break;
      if (text.charCodeAt(nq + 1) === QUOTE) { escaped = true; q = nq + 2; continue; }
      closed = nq;
      break;
    }
    if (closed === -1) {
      // The quote never closes: it is a literal character and the text
      // after it is read again as unquoted.
      errors.push({ code: 'unterminated_quote', line: recLine, row: recRow });
      i = start;
      return '"' + parseUnquoted(recLine, recRow);
    }
    // Count the line breaks inside the quotes: each LF, and each lone CR.
    const crPos = text.indexOf('\r', start);
    const segHasCR = crPos !== -1 && crPos < closed;
    const lfPos = text.indexOf('\n', start);
    if (lfPos !== -1 && lfPos < closed) {
      let p = lfPos;
      let count = 0;
      while (p !== -1 && p < closed) { count++; p = text.indexOf('\n', p + 1); }
      line += count;
    }
    if (segHasCR) {
      let p = crPos;
      let count = 0;
      while (p !== -1 && p < closed) {
        if (text.charCodeAt(p + 1) !== LF) count++;
        p = text.indexOf('\r', p + 1);
      }
      line += count;
    }
    // Build the value: "" reads as one quote, CRLF and lone CR as LF.
    let value;
    if (!escaped && !segHasCR) {
      value = text.slice(start, closed);
    } else {
      value = text.slice(start, closed);
      if (escaped) value = value.replaceAll('""', '"');
      if (segHasCR) value = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
    }
    i = closed + 1;
    // What follows the closing quote, up to the next comma or line break,
    // is appended as it stands. Most of the time the next character is a
    // delimiter already, so there is no junk and nothing to scan for.
    const after = i < n ? text.charCodeAt(i) : -1;
    if (after !== COMMA && after !== LF && after !== CR && after !== -1) {
      let end = n;
      const c = text.indexOf(',', i);
      if (c !== -1) end = c;
      const l = text.indexOf('\n', i);
      if (l !== -1 && l < end) end = l;
      const r = text.indexOf('\r', i);
      if (r !== -1 && r < end) end = r;
      value += text.slice(i, end);
      errors.push({ code: 'quote_junk', line: recLine, row: recRow });
      i = end;
    }
    return value;
  }

  // Parse one record starting at i, field by field. Leaves i at the next
  // record's start (or the end of input) and stores the record, unless
  // the line held no characters at all, which is no record.
  function slowRecord(recLine, recRow) {
    const fields = [];
    for (;;) {
      let value;
      if (i >= n) {
        if (fields.length === 0) return; // nothing left: no record
        fields.push('');
        store(fields, recLine, recRow);
        return;
      }
      const ch = text.charCodeAt(i);
      if (ch === QUOTE) {
        value = parseQuoted(recLine, recRow);
      } else if (ch === COMMA) {
        value = '';
      } else if (ch === LF) {
        // A line break where a field would start.
        line++;
        i++;
        if (fields.length === 0) return; // empty line: no record
        fields.push('');
        store(fields, recLine, recRow);
        return;
      } else if (ch === CR) {
        if (text.charCodeAt(i + 1) === LF) {
          line++;
          i += 2;
          if (fields.length === 0) return; // empty line: no record
          fields.push('');
          store(fields, recLine, recRow);
          return;
        }
        // A stray CR before a field starts: drop it and look again.
        errors.push({ code: 'stray_cr', line: recLine, row: recRow });
        i++;
        continue;
      } else {
        value = parseUnquoted(recLine, recRow);
      }
      fields.push(value);
      // The delimiter after the field.
      for (;;) {
        if (i >= n) { store(fields, recLine, recRow); return; }
        const d = text.charCodeAt(i);
        if (d === COMMA) { i++; break; }
        if (d === LF) { line++; i++; store(fields, recLine, recRow); return; }
        if (d === CR) {
          if (text.charCodeAt(i + 1) === LF) { line++; i += 2; store(fields, recLine, recRow); return; }
          errors.push({ code: 'stray_cr', line: recLine, row: recRow });
          i++;
          continue;
        }
        break; // unreachable: the field parsers stop at a delimiter or EOF
      }
    }
  }

  while (i < n) {
    const recLine = line;
    const recRow = first && header ? null : rows.length;
    // Fast path: one plain line with no quotes and no stray CR. The
    // record is the line's text split on commas.
    const lf = text.indexOf('\n', i);
    const end = lf === -1 ? n : lf;
    let contentEnd = end;
    // A CR just before the LF is the CR of a CRLF, not a stray one.
    if (lf !== -1 && contentEnd > i && text.charCodeAt(contentEnd - 1) === CR) contentEnd--;
    if (contentEnd === i) {
      // A line left with no characters is no record.
      line++;
      i = lf === -1 ? n : lf + 1;
      continue;
    }
    const q = text.indexOf('"', i);
    if (q === -1 || q >= contentEnd) {
      const r = text.indexOf('\r', i);
      if (r === -1 || r >= contentEnd) {
        store(text.slice(i, contentEnd).split(','), recLine, recRow);
        line++;
        i = lf === -1 ? n : lf + 1;
        continue;
      }
    }
    slowRecord(recLine, recRow);
  }

  return { columns, rows, errors };
}
