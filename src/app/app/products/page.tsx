import { EmptyShopNotice } from "@/components/status";
import { categoryLabel } from "@/lib/categories";
import { getCurrentShop, getProducts } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export default async function ProductsPage() {
  const { shop } = await getCurrentShop();
  if (!shop) return <EmptyShopNotice />;

  const products = await getProducts(shop.id);

  return (
    <>
      <header className="pageHead">
        <div>
          <h1>Products</h1>
          <p>Imported products are grouped for the future PC Builder category model.</p>
        </div>
      </header>
      <section className="table">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Stock</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.title}</strong>
                  {product.sku ? <div className="muted">SKU {product.sku}</div> : null}
                </td>
                <td>{categoryLabel(product.category)}</td>
                <td>{product.brand || "Unspecified"}</td>
                <td>{product.stock_status || "available"}</td>
                <td>{formatMoney(product.price)}</td>
              </tr>
            ))}
            {!products.length ? (
              <tr>
                <td colSpan={5} className="muted">
                  No products yet. Import a published Google Sheet first.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

