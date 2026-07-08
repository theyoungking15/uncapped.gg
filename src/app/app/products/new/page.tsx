import Link from "next/link";
import { ProductCreateForm } from "@/components/action-forms";
import { EmptyShopNotice } from "@/components/status";
import { getCurrentShop, getProductCatalogItems } from "@/lib/data";

export default async function NewProductPage() {
  const { shop } = await getCurrentShop();
  if (!shop) return <EmptyShopNotice />;

  const catalogItems = await getProductCatalogItems();

  return (
    <>
      <header className="pageHead">
        <div>
          <p className="eyebrow">My Listings</p>
          <h1>Add listing</h1>
          <p>Choose a component, link a catalog item when possible, then add seller-specific price and inventory details.</p>
        </div>
        <Link className="button buttonGhost" href="/app/products">
          Back to listings
        </Link>
      </header>
      <ProductCreateForm catalogItems={catalogItems} />
    </>
  );
}
