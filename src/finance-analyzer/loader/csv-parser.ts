/**
 * AMEX CSV Parser
 * Handles multi-line values in Extended Details field using a state machine approach
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { IRawAMEXTransaction } from '../types/index.js';

export interface IParseResult {
  transactions: IRawAMEXTransaction[];
  warnings: string[];
  sourceFile: string;
}

const AMEX_HEADERS = [
  'Date',
  'Description',
  'Amount',
  'Extended Details',
  'Appears On Your Statement As',
  'Address',
  'City/State',
  'Zip Code',
  'Country',
  'Reference',
  'Category'
] as const;

/**
 * Parse an AMEX CSV file with proper handling of quoted multi-line fields
 */
export async function parseAMEXCSV(filePath: string): Promise<IParseResult> {
  const content = await fs.readFile(filePath, 'utf-8');
  const sourceFile = path.basename(filePath);
  const warnings: string[] = [];
  const transactions: IRawAMEXTransaction[] = [];

  // State machine for CSV parsing with quoted fields
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let rowIndex = 0;
  let isHeader = true;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        // Any character inside quotes (including newlines)
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        if (char === '\r') i++; // Skip \n in \r\n

        // End of row
        currentRow.push(currentField.trim());
        currentField = '';

        if (isHeader) {
          // Validate header row
          const headerValid = AMEX_HEADERS.every(
            (h, idx) => currentRow[idx]?.trim() === h
          );
          if (!headerValid && currentRow.length >= AMEX_HEADERS.length) {
            warnings.push(`Header validation warning: expected AMEX format`);
          }
          isHeader = false;
        } else if (currentRow.length === AMEX_HEADERS.length && currentRow[0]) {
          // Valid transaction row
          const raw: IRawAMEXTransaction = {
            Date: currentRow[0],
            Description: currentRow[1],
            Amount: currentRow[2],
            'Extended Details': currentRow[3],
            'Appears On Your Statement As': currentRow[4],
            Address: currentRow[5],
            'City/State': currentRow[6],
            'Zip Code': currentRow[7],
            Country: currentRow[8],
            Reference: currentRow[9],
            Category: currentRow[10] || ''
          };
          transactions.push(raw);
        } else if (currentRow.some((f) => f) && currentRow.length > 1) {
          warnings.push(
            `Row ${rowIndex}: Unexpected column count (${currentRow.length} vs expected ${AMEX_HEADERS.length})`
          );
        }

        currentRow = [];
        rowIndex++;
      } else if (char !== '\r') {
        // Regular character (skip standalone \r)
        currentField += char;
      }
    }
  }

  // Handle last row if file doesn't end with newline
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length === AMEX_HEADERS.length && currentRow[0]) {
      const raw: IRawAMEXTransaction = {
        Date: currentRow[0],
        Description: currentRow[1],
        Amount: currentRow[2],
        'Extended Details': currentRow[3],
        'Appears On Your Statement As': currentRow[4],
        Address: currentRow[5],
        'City/State': currentRow[6],
        'Zip Code': currentRow[7],
        Country: currentRow[8],
        Reference: currentRow[9],
        Category: currentRow[10] || ''
      };
      transactions.push(raw);
    }
  }

  return { transactions, warnings, sourceFile };
}

/**
 * Parse multiple AMEX CSV files from a directory
 */
export async function parseAMEXDirectory(
  dirPath: string
): Promise<IParseResult[]> {
  const files = await fs.readdir(dirPath);
  const csvFiles = files.filter(
    (f) => f.endsWith('.csv') && f.startsWith('AMEX')
  );

  const results: IParseResult[] = [];
  for (const file of csvFiles) {
    const result = await parseAMEXCSV(path.join(dirPath, file));
    results.push(result);
  }

  return results;
}
