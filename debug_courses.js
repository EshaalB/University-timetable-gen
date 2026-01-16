// Debug script to find AI lab entries in FSC file
import { readFileSync } from 'fs';
import * as XLSX from 'xlsx';

const filePath = './src/FSC TT Spring 2026 v1.1.xlsx';

const buffer = readFileSync(filePath);
const wb = XLSX.read(buffer, { type: 'buffer' });
const ws = wb.Sheets[wb.SheetNames[0]];
const rawMatrix = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log('Sheet names:', wb.SheetNames);
console.log('=== SEARCHING FOR AI LAB ===\n');

rawMatrix.forEach((row, rowIdx) => {
  if (!row) return;
  row.forEach((cell, colIdx) => {
    if (!cell) return;
    const cellStr = cell.toString().toLowerCase();
    if (cellStr.includes('ai') || cellStr.includes('artificial') || cellStr.includes('lab')) {
      console.log(`\n[Row ${rowIdx}, Col ${colIdx}]:`);
      console.log(`"${cell}"`);
      console.log('---');
    }
  });
});

console.log('\n=== DONE ===');
