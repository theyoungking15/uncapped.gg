import { EmptyShopNotice } from "@/components/status";
import { ImportProductsForm } from "@/components/action-forms";
import { getCurrentShop, getImports } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default async function ImportsPage() {
  const { shop } = await getCurrentShop();
  if (!shop) return <EmptyShopNotice />;

  const imports = await getImports(shop.id);

  return (
    <>
      <header className="pageHead">
        <div>
          <h1>Product import</h1>
          <p>Paste a published CSV URL or upload a Shopify CSV export. Rows with matching SKU or handle are updated.</p>
        </div>
      </header>
      <section className="panel">
        <ImportProductsForm />
      </section>
      <section className="table" style={{ marginTop: 18 }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Status</th>
              <th>Rows</th>
              <th>Imported</th>
              <th>Issues</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((item) => (
              <tr key={item.id}>
                <td>{formatDateTime(item.created_at)}</td>
                <td>
                  {item.source_type}
                  <div className="muted">{item.source_url}</div>
                  {item.error_report?.length ? (
                    <details className="importIssues">
                      <summary>{item.error_report.length} issue(s)</summary>
                      <ul>
                        {item.error_report.slice(0, 8).map((issue) => (
                          <li key={`${item.id}:${issue.row}:${issue.reason}`}>
                            Row {issue.row}: {issue.reason}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </td>
                <td>{item.status}</td>
                <td>{item.total_rows}</td>
                <td>{item.imported_rows}</td>
                <td>{item.error_rows}</td>
              </tr>
            ))}
            {!imports.length ? (
              <tr>
                <td colSpan={6} className="muted">
                  No imports yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
