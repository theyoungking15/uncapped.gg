import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryLabel } from "@/lib/categories";
import { getActiveProductByHandle, getShopBySlug } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { productAvailabilityOrDefault, productAvailabilitySummary, productIsQuoteable } from "@/lib/product-availability";
import { productConditionLabel } from "@/lib/product-conditions";
import { getProductSpecRows } from "@/lib/product-foundation";

export default async function PublicProductPage({ params }: { params: Promise<{ slug: string; handle: string }> }) {
  const { slug, handle } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const product = await getActiveProductByHandle(shop.id, handle);
  if (!product) notFound();

  const images = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
  const specs = getProductSpecRows(product);
  const quoteable = productIsQuoteable(product);

  return (
    <main className="publicShell">
      <nav className="publicNav">
        <Link href={`/shop/${shop.slug}`}>
          <strong>{shop.name}</strong>
        </Link>
        <div>
          <Link href={`/shop/${shop.slug}/pricelist`}>Price list</Link>
          {shop.messenger_url ? (
            <Link href={shop.messenger_url} target="_blank">
              Messenger
            </Link>
          ) : null}
        </div>
      </nav>
      <section className="productDetail">
        <div className="productMedia">
          {images.length ? (
            images.slice(0, 6).map((image) => <img alt={product.title} key={image} src={image} />)
          ) : (
            <div className="imagePlaceholder">No image</div>
          )}
        </div>
        <article className="productInfo">
          <p className="eyebrow">{categoryLabel(product.category)}</p>
          <h1>{product.title}</h1>
          <p className="muted">
            {[product.brand, productConditionLabel(product.condition), productAvailabilitySummary(product)].filter(Boolean).join(" / ")}
          </p>
          <span className={`availabilityPill availability-${productAvailabilityOrDefault(product.availability_status)}`}>
            {productAvailabilitySummary(product)}
          </span>
          <div className="priceLine">
            <strong>{formatMoney(product.price)}</strong>
            {product.compare_at_price ? <span>{formatMoney(product.compare_at_price)}</span> : null}
          </div>
          {product.quick_description ? <p className="quickDescription">{product.quick_description}</p> : null}
          {specs.length ? (
            <section className="specPanel">
              <h2>Builder specs</h2>
              <dl>
                {specs.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          {product.description ? (
            <section className="specPanel">
              <h2>Details</h2>
              <p>{product.description}</p>
            </section>
          ) : null}
          <div className="heroActions">
            {quoteable ? (
              <Link className="button buttonPrimary" href={`/shop/${shop.slug}/pricelist`}>
                Add to quote
              </Link>
            ) : (
              <span className="button buttonGhost isButtonDisabled">Sold out</span>
            )}
            {shop.messenger_url ? (
              <Link className="button buttonGhost" href={shop.messenger_url} target="_blank">
                Ask on Messenger
              </Link>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
