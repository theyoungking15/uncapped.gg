import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductEditForm } from "@/components/action-forms";
import { EmptyShopNotice } from "@/components/status";
import { getCurrentShop, getProductById } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { productAvailabilitySummary } from "@/lib/product-availability";
import { productConditionLabel } from "@/lib/product-conditions";
import { getMissingBuilderFields } from "@/lib/pc-builder-contract";

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop } = await getCurrentShop();
  if (!shop) return <EmptyShopNotice />;

  const product = await getProductById(shop.id, id);
  if (!product) notFound();

  const missing = getMissingBuilderFields(product);

  return (
    <>
      <header className="pageHead">
        <div>
          <p className="eyebrow">Listing editor</p>
          <h1>{product.title}</h1>
          <p>
            {product.brand || "Unspecified brand"} / {productConditionLabel(product.condition)} / {productAvailabilitySummary(product)} /{" "}
            {formatMoney(product.price)}
          </p>
        </div>
        <Link className="button buttonGhost" href="/app/products">
          Back to listings
        </Link>
      </header>
      {missing.length ? (
        <section className="notice editorNotice">
          <strong>Builder audit</strong>
          <p>Missing: {missing.join(" / ")}</p>
        </section>
      ) : (
        <section className="notice editorNotice isOkNotice">
          <strong>Builder audit</strong>
          <p>This product has the required core fields for its category.</p>
        </section>
      )}
      <ProductEditForm product={product} shopSlug={shop.slug} />
    </>
  );
}
