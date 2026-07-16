/*
 * Простейший CSV-парсер: только для нашего backend-контракта.
 * Поддержка кавычек (RFC 4180 lite): "field with, comma" и "quoted \"quotes\"".
 * НЕ поддерживает многострочные quoted значения (backend их не отдаёт).
 */

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === ',') {
        out.push(cur);
        cur = '';
      } else if (c === '"' && cur === '') {
        inQuotes = true;
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out;
}

/**
 * Парсит CSV с header-строкой. Возвращает массив объектов, где ключи —
 * названия колонок из первой строки.
 */
export function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 1) return [];
  const headers = splitCsvLine(lines[0] ?? '');
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
}
