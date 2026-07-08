import Link from "next/link";
import { updateQuoteStatus } from "@/server/actions";
import { QuoteStatusBadge, EmptyShopNotice } from "@/components/status";
import { categoryLabel } from "@/lib/categories";
import { getCurrentShop, getQuotes } from "@/lib/data";
import { formatDateTime, formatMoney } from "@/lib/format";
import { productAvailabilityLabel } from "@/lib/product-availability";
import { productConditionLabel } from "@/lib/product-conditions";

const QUOTE_STATUSES = ["new", "reviewing", "quoted", "closed"];

export default async function QuotesPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const { shop } = await getCurrentShop();
  if (!shop) return <EmptyShopNotice />;

  const query = searchParams ? await searchParams : {};
  const activeStatus = QUOTE_STATUSES.includes(query.status || "") ? query.status || "" : "";
  const quotes = await getQuotes(shop.id);
  const visibleQuotes = activeStatus ? quotes.filter((quote) => quote.status === activeStatus) : quotes;
  const statusCounts = new Map<string, number>();
  quotes.forEach((quote) => statusCounts.set(quote.status, (statusCounts.get(quote.status) || 0) + 1));

  return (
    <>
      <header className="pageHead">
        <div>
          <h1>Quote inbox</h1>
          <p>Customer quote requests from public listings appear here for seller follow-up.</p>
        </div>
      </header>
      <nav className="statusFilters" aria-label="Quote status filters">
        <Link className={!activeStatus ? "isActive" : ""} href="/app/quotes">
          All <span>{quotes.length}</span>
        </Link>
        {QUOTE_STATUSES.map((status) => (
          <Link className={activeStatus === status ? "isActive" : ""} href={`/app/quotes?status=${status}`} key={status}>
            {status} <span>{statusCounts.get(status) || 0}</span>
          </Link>
        ))}
      </nav>
      <div className="quotePicker">
        {visibleQuotes.map((quote) => (
          <article className="panel" key={quote.id}>
            <div className="pageHead" style={{ marginBottom: 12 }}>
              <div>
                <h2>{quote.quote_code}</h2>
                <p>
                  {quote.customer_name} / {quote.contact_method}: {quote.contact_value}
                </p>
                <ContactAction method={quote.contact_method} value={quote.contact_value} />
              </div>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Condition</th>
                    <th>Availability</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(quote.quote_items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.title_snapshot}</td>
                      <td>{categoryLabel(item.category_snapshot)}</td>
                      <td>{productConditionLabel(item.condition_snapshot)}</td>
                      <td>
                        {item.availability_status_snapshot ? productAvailabilityLabel(item.availability_status_snapshot) : "Unspecified"}
                        {item.lead_time_label_snapshot ? <div className="muted">{item.lead_time_label_snapshot}</div> : null}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              Created {formatDateTime(quote.created_at)} / Subtotal {formatMoney(quote.subtotal)}
              {quote.notes ? ` / Notes: ${quote.notes}` : ""}
            </p>
            <form action={updateQuoteStatus} className="formFooter">
              <input name="quote_id" type="hidden" value={quote.id} />
              <select name="status" defaultValue={quote.status}>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="quoted">Quoted</option>
                <option value="closed">Closed</option>
              </select>
              <button className="button buttonGhost" type="submit">
                Update status
              </button>
            </form>
          </article>
        ))}
        {!visibleQuotes.length ? <section className="notice">No quote requests match this filter.</section> : null}
      </div>
    </>
  );
}

function ContactAction({ method, value }: { method: string; value: string }) {
  const href = contactHref(method, value);
  if (!href) return null;

  return (
    <Link className="detailLink" href={href} target={href.startsWith("http") ? "_blank" : undefined}>
      Open contact
    </Link>
  );
}

function contactHref(method: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (method === "email" || trimmed.includes("@")) return `mailto:${trimmed}`;
  if (method === "phone") return `tel:${trimmed.replace(/[^\d+]/g, "")}`;
  return "";
}
