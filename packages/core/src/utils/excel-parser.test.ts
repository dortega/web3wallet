import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseTransferExcel, parseTransferExcelFromBuffer } from './excel-parser.js';
import ExcelJS from 'exceljs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const VALID_ADDRESS_1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const VALID_ADDRESS_2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

let tempDir: string;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'excel-test-'));
});

afterAll(async () => {
  await rm(tempDir, { recursive: true });
});

async function createExcel(
  headers: string[],
  rows: (string | number)[][],
  fileName = 'test.xlsx',
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(row);
  }
  const path = join(tempDir, fileName);
  await workbook.xlsx.writeFile(path);
  return path;
}

describe('parseTransferExcel', () => {
  it('parses valid excel with address/amount headers', async () => {
    const path = await createExcel(
      ['address', 'amount'],
      [
        [VALID_ADDRESS_1, '0.5'],
        [VALID_ADDRESS_2, '1.0'],
      ],
    );

    const transfers = await parseTransferExcel(path);
    expect(transfers).toEqual([
      { to: VALID_ADDRESS_1, amount: '0.5' },
      { to: VALID_ADDRESS_2, amount: '1.0' },
    ]);
  });

  it('detects alternative headers (wallet/value)', async () => {
    const path = await createExcel(
      ['wallet', 'value'],
      [[VALID_ADDRESS_1, '2.5']],
      'alt-headers.xlsx',
    );

    const transfers = await parseTransferExcel(path);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]!.amount).toBe('2.5');
  });

  it('throws on missing address column', async () => {
    const path = await createExcel(
      ['name', 'amount'],
      [['Alice', '1.0']],
      'no-addr.xlsx',
    );

    await expect(parseTransferExcel(path)).rejects.toThrow('Address column not found');
  });

  it('throws on missing amount column', async () => {
    const path = await createExcel(
      ['address', 'note'],
      [[VALID_ADDRESS_1, 'payment']],
      'no-amount.xlsx',
    );

    await expect(parseTransferExcel(path)).rejects.toThrow('Amount column not found');
  });

  it('throws on invalid addresses', async () => {
    const path = await createExcel(
      ['address', 'amount'],
      [['not-an-address', '1.0']],
      'bad-addr.xlsx',
    );

    await expect(parseTransferExcel(path)).rejects.toThrow('invalid address');
  });

  it('throws on invalid amounts', async () => {
    const path = await createExcel(
      ['address', 'amount'],
      [[VALID_ADDRESS_1, '-1.0']],
      'bad-amount.xlsx',
    );

    await expect(parseTransferExcel(path)).rejects.toThrow('invalid amount');
  });

  it('skips empty rows', async () => {
    const path = await createExcel(
      ['address', 'amount'],
      [
        [VALID_ADDRESS_1, '0.5'],
        ['', ''],
        [VALID_ADDRESS_2, '1.0'],
      ],
      'empty-rows.xlsx',
    );

    const transfers = await parseTransferExcel(path);
    expect(transfers).toHaveLength(2);
  });
});

async function createExcelBuffer(
  headers: string[],
  rows: (string | number)[][],
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(row);
  }
  const nodeBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength,
  ) as ArrayBuffer;
}

describe('parseTransferExcelFromBuffer', () => {
  it('parses valid buffer with address/amount headers', async () => {
    const buffer = await createExcelBuffer(
      ['address', 'amount'],
      [
        [VALID_ADDRESS_1, '0.5'],
        [VALID_ADDRESS_2, '1.0'],
      ],
    );

    const transfers = await parseTransferExcelFromBuffer(buffer);
    expect(transfers).toEqual([
      { to: VALID_ADDRESS_1, amount: '0.5' },
      { to: VALID_ADDRESS_2, amount: '1.0' },
    ]);
  });

  it('throws on invalid data in buffer', async () => {
    const buffer = await createExcelBuffer(
      ['address', 'amount'],
      [['not-an-address', '1.0']],
    );

    await expect(parseTransferExcelFromBuffer(buffer)).rejects.toThrow(
      'invalid address',
    );
  });
});
