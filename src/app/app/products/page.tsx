import Link from "next/link";
import { EmptyShopNotice } from "@/components/status";
import { categoryLabel } from "@/lib/categories";
import { getCurrentShop, getProducts } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { productAvailabilitySummary } from "@/lib/product-availability";
import { productConditionLabel } from "@/lib/product-conditions";
import { getProductHighlights } from "@/lib/product-foundation";
import { getBuilderAudit, getMissingBuilderFields } from "@/lib/pc-builder-contract";

export default async function ProductsPage() {
  const { shop } = await getCurrentShop();
  if (!shop) return <EmptyShopNotice />;

  const products = await getProducts(shop.id);
  const audit = getBuilderAudit(products);

  return (
    <>
      <header className="pageHead">
        <div>
          <h1>My Listings</h1>
          <p>Create, import, price, and publish the items shown on your seller profile.</p>
        </div>
        <Link className="button buttonPrimary" href="/app/products/new">
          Add listing
        </Link>
      </header>
      <section className="panel auditPanel">
        <div className="auditHead">
          <div>
            <h2>PC Builder data audit</h2>
            <p className="muted">Uses the same product fields as the Shopify PC Builder 2 contract.</p>
          </div>
          <div className="auditTotals">
            <strong>{audit.ready}</strong>
            <span>ready of {audit.active} active builder products</span>
          </div>
        </div>
        <div className="auditRows">
          {audit.rows.map((row) => (
            <div className="auditRow" key={row.key}>
              <div>
                <strong>{row.label}</strong>
                <span>
                  {row.ready}/{row.active} ready
                  {row.hidden ? ` / ${row.hidden} hidden` : ""}
                </span>
              </div>
              <p>
                {row.topMissing.length
                  ? row.topMissing.map((item) => `${item.label}: ${item.count}`).join(" / ")
                  : row.active
                    ? "Core fields complete"
                    : "No active builder products"}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Condition</th>
              <th>Brand</th>
              <th>Availability</th>
              <th>Inventory</th>
              <th>Builder specs</th>
              <th>Builder audit</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const highlights = getProductHighlights(product, 3);
              const missing = getMissingBuilderFields(product);

              return (
                <tr key={product.id}>
                  <td>
                    <strong>
                      {product.handle && shop ? (
                        <Link href={`/shop/${shop.slug}/products/${product.handle}`}>{product.title}</Link>
                      ) : (
                        product.title
                      )}
                    </strong>
                    <Link className="detailLink" href={`/app/products/${product.id}`}>
                      Edit listing
                    </Link>
                    {product.sku ? <div className="muted">SKU {product.sku}</div> : null}
                    {product.catalog_item_id ? <div className="muted">Linked catalog item</div> : null}
                  </td>
                  <td>{categoryLabel(product.category)}</td>
                  <td>{productConditionLabel(product.condition)}</td>
                  <td>{product.brand || "Unspecified"}</td>
                  <td>
                    {productAvailabilitySummary(product)}
                    {!product.is_active ? <div className="muted">Hidden from public list</div> : null}
                    {product.show_inventory_quantity ? <div className="muted">Public quantity enabled</div> : null}
                  </td>
                  <td>
                    {product.inventory_quantity}
                    <div className="muted">seller-managed</div>
                  </td>
                  <td>
                    {highlights.length ? (
                      <div className="chipRow">
                        {highlights.map((item) => (
                          <span className="specChip" key={`${product.id}:${item.label}`}>
                            {item.label}: {item.value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="muted">No specs</span>
                    )}
                  </td>
                  <td>
                    {missing.length ? (
                      <div className="auditMissing">
                        {missing.slice(0, 3).map((item) => (
                          <span key={`${product.id}:${item}`}>{item}</span>
                        ))}
                        {missing.length > 3 ? <span>+{missing.length - 3} more</span> : null}
                      </div>
                    ) : (
                      <span className="readyText">Ready</span>
                    )}
                  </td>
                  <td>
                    {formatMoney(product.price)}
                    {product.compare_at_price ? <div className="muted">Was {formatMoney(product.compare_at_price)}</div> : null}
                  </td>
                </tr>
              );
            })}
            {!products.length ? (
              <tr>
                <td colSpan={9} className="muted">
                  No listings yet. Add a listing, import a published CSV, or upload a Shopify export first.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
