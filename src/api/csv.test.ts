import { describe, expect, it } from 'vitest';
import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('парсит простой CSV с заголовками', () => {
    const csv = 'a,b,c\n1,2,3\n4,5,6';
    expect(parseCsv(csv)).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ]);
  });

  it('обрабатывает пустые строки в конце и CRLF', () => {
    const csv = 'x\n7\r\n\r\n';
    expect(parseCsv(csv)).toEqual([{ x: '7' }]);
  });

  it('поддерживает quoted-значения с запятой и escape-кавычками', () => {
    const csv = 'name,note\n"Doe, John","she said ""hi"""';
    expect(parseCsv(csv)).toEqual([
      { name: 'Doe, John', note: 'she said "hi"' },
    ]);
  });

  it('пустой ввод → []', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('\n\n')).toEqual([]);
  });

  it('строка с меньшим числом столбцов — недостающие пустые', () => {
    const csv = 'a,b,c\n1,2';
    expect(parseCsv(csv)).toEqual([{ a: '1', b: '2', c: '' }]);
  });
});
