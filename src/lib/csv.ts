import { formatMinorForInput } from "@/lib/money";

/**
 * CSV serialization for the transaction export (Phase 5).
 *
 * Follows RFC 4180: CRLF line endings, fields containing a comma, quote, or
 * line break are wrapped in double quotes, and embedded quotes are doubled.
 * Amounts are written straight from the integer minor units at their stored
 * 3-decimal precision — never converted, rounded, or re-formatted through a
 * floating point path, so what lands in the file is exactly what is in the
 * database.
 */

export type CsvTransaction = {
  transaction_date: string;
  type: "income" | "expense";
  category_name: string;
  amount_minor: number;
  description: string;
};

export const CSV_HEADERS = [
  "Date",
  "Type",
  "Category",
  "Amount",
  "Description",
] as const;

/** Quotes a single CSV field when it contains separators or line breaks. */
export function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(cells: string[]): string {
  return cells.map(csvEscape).join(",");
}

export function transactionsToCsv(rows: readonly CsvTransaction[]): string {
  const lines: string[] = [row([...CSV_HEADERS])];

  for (const transaction of rows) {
    lines.push(
      row([
        transaction.transaction_date,
        transaction.type === "income" ? "Income" : "Expense",
        transaction.category_name,
        // Integer minor units → exact decimal string (12.500), no float math.
        formatMinorForInput(transaction.amount_minor),
        transaction.description,
      ]),
    );
  }

  // Trailing CRLF: tolerated everywhere and expected by several parsers.
  return `${lines.join("\r\n")}\r\n`;
}
