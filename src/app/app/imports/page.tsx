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
          <h1>Google Sheets import</h1>
          <p>Paste a published CSV URL to import or update products. Rows with matching SKU are updated.</p>
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
                <td>{item.status}</td>
                <td>{item.total_rows}</td>
                <td>{item.imported_rows}</td>
                <td>{item.error_rows}</td>
              </tr>
            ))}
            {!imports.length ? (
              <tr>
                <td colSpan={5} className="muted">
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

