import ExcelJS from 'exceljs';
import { isAddress } from 'ethers';
import type { TransferRequest } from '../types/wallet.types.js';

const ADDRESS_HEADERS = ['wallet', 'address', 'to', 'destination', 'recipient'];
const AMOUNT_HEADERS = ['amount', 'value', 'quantity', 'qty'];

export interface ParseOptions {
  sheet?: number | string;
}

function parseWorksheet(worksheet: ExcelJS.Worksheet): TransferRequest[] {
  const headerRow = worksheet.getRow(1);
  let addressCol = -1;
  let amountCol = -1;

  headerRow.eachCell((cell, colNumber) => {
    const value = String(cell.value ?? '').toLowerCase().trim();
    if (addressCol === -1 && ADDRESS_HEADERS.includes(value)) {
      addressCol = colNumber;
    }
    if (amountCol === -1 && AMOUNT_HEADERS.includes(value)) {
      amountCol = colNumber;
    }
  });

  if (addressCol === -1) {
    throw new Error(
      `Address column not found. Use one of: ${ADDRESS_HEADERS.join(', ')}`,
    );
  }
  if (amountCol === -1) {
    throw new Error(
      `Amount column not found. Use one of: ${AMOUNT_HEADERS.join(', ')}`,
    );
  }

  const transfers: TransferRequest[] = [];
  const errors: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const address = String(row.getCell(addressCol).value ?? '').trim();
    const amountRaw = row.getCell(amountCol).value;
    const amount = String(amountRaw ?? '').trim();

    if (!address && !amount) return;

    if (!isAddress(address)) {
      errors.push(`Row ${rowNumber}: invalid address "${address}"`);
      return;
    }

    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      errors.push(`Row ${rowNumber}: invalid amount "${amount}"`);
      return;
    }

    transfers.push({ to: address, amount });
  });

  if (errors.length > 0) {
    throw new Error(`Validation errors:\n${errors.join('\n')}`);
  }

  return transfers;
}

function getWorksheet(
  workbook: ExcelJS.Workbook,
  options?: ParseOptions,
): ExcelJS.Worksheet {
  const worksheet =
    typeof options?.sheet === 'string'
      ? workbook.getWorksheet(options.sheet)
      : workbook.getWorksheet(options?.sheet ?? 1);

  if (!worksheet) {
    throw new Error('Worksheet not found');
  }

  return worksheet;
}

export async function parseTransferExcel(
  filePath: string,
  options?: ParseOptions,
): Promise<TransferRequest[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return parseWorksheet(getWorksheet(workbook, options));
}

export async function parseTransferExcelFromBuffer(
  buffer: ArrayBuffer,
  options?: ParseOptions,
): Promise<TransferRequest[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return parseWorksheet(getWorksheet(workbook, options));
}
