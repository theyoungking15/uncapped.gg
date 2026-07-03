import { updateQuoteStatus } from "@/server/actions";
import { QuoteStatusBadge, EmptyShopNotice } from "@/components/status";
import { categoryLabel } from "@/lib/categories";
import { getCurrentShop, getQuotes } from "@/lib/data";
import { formatDateTime, formatMoney } from "@/lib/format";

export default async function QuotesPage() {
  const { shop } = await getCurrentShop();
  if (!shop) return <EmptyShopNotice />;

  const quotes = await getQuotes(shop.id);

  return (
    <>
      <header className="pageHead">
        <div>
          <h1>Quote inbox</h1>
          <p>Customer quote requests from the public price list appear here.</p>
        </div>
      </header>
      <div className="quotePicker">
        {quotes.map((quote) => (
          <article className="panel" key={quote.id}>
            <div className="pageHead" style={{ marginBottom: 12 }}>
              <div>
                <h2>{quote.quote_code}</h2>
                <p>
                  {quote.customer_name} · {quote.contact_method}: {quote.contact_value}
                </p>
              </div>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(quote.quote_items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.title_snapshot}</td>
                      <td>{categoryLabel(item.category_snapshot)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              Created {formatDateTime(quote.created_at)} · Subtotal {formatMoney(quote.subtotal)}
              {quote.notes ? ` · Notes: ${quote.notes}` : ""}
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
        {!quotes.length ? <section className="notice">No quote requests yet.</section> : null}
      </div>
    </>
  );
}

