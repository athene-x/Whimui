export type ImportColumns<TColumn extends string> = Partial<Record<TColumn, number>>;

export const IMPORT_FILE_ACCEPT = '.csv,.xlsx';

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^﻿/, '');

  for (let index = 0; index < source.length; index++) {
    const char = source[index];

    if (quoted) {
      if (char !== '"') cell += char;
      else if (source[index + 1] === '"') {
        cell += '"';
        index++;
      } else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export async function readImportFile(file: File): Promise<unknown[][]> {
  if (file.name.toLowerCase().endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    return readSheet(file);
  }

  return parseCsv(await file.text());
}

export function toTextTable(table: readonly unknown[][]): string[][] {
  return table.map((row) => row.map(toText));
}

export function findImportColumns<TColumn extends string>(
  header: readonly string[],
  aliases: Record<TColumn, readonly string[]>,
): ImportColumns<TColumn> {
  const columns: ImportColumns<TColumn> = {};

  header.forEach((title, position) => {
    const normalized = title.trim().toLowerCase();
    for (const [column, names] of Object.entries(aliases) as [TColumn, readonly string[]][]) {
      if (names.includes(normalized)) columns[column] ??= position;
    }
  });

  return columns;
}

export function readImportCell<TColumn extends string>(
  cells: readonly string[],
  columns: ImportColumns<TColumn>,
  column: TColumn,
): string {
  const position = columns[column];
  return position === undefined ? '' : (cells[position] ?? '');
}

export function isBlankImportRow(cells: readonly string[]): boolean {
  return cells.every((cell) => cell === '');
}

function toText(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim();
}
