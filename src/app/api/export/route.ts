import { connection } from "next/server";
import * as queries from "@/lib/supabase/queries";
import { getUserId } from "@/lib/auth";
import { transactionsToCsv } from "@/lib/csv";
import { todayLocalDateString } from "@/lib/dates";

/**
 * GET /api/export — downloads every stored transaction as a CSV file with the
 * columns Date, Type, Category, Amount, Description.
 *
 * `connection()` defers this handler to request time (with Cache Components
 * enabled a GET route would otherwise be a candidate for prerendering, and a
 * better-sqlite3 read during the build would freeze a snapshot of the data).
 * The response is marked `no-store` so a browser or proxy can never hand back
 * an outdated export.
 *
 * The session is verified here as well as in `src/proxy.ts`: the CSV holds
 * every transaction, so this handler must fail closed on its own.
 */
export async function GET() {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await queries.listTransactions(userId);
  const csv = transactionsToCsv(transactions);
  const filename = `spendly-transactions-${todayLocalDateString()}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
