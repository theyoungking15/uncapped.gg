import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicListings } from "@/components/public-listings";
import { getActiveProducts, getShopBySlug } from "@/lib/data";

export default async function PublicShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const products = await getActiveProducts(shop.id);
  const categoryCount = new Set(products.map((product) => product.category)).size;
  const reviewSummary =
    shop.external_rating !== null && shop.external_rating !== undefined
      ? `${Number(shop.external_rating).toFixed(1)}/5${shop.external_review_count ? ` from ${shop.external_review_count} reviews` : ""}`
      : "External proof available";

  return (
    <main className="publicShell">
      <nav className="publicNav">
        <strong>{shop.name}</strong>
        <div>
          <a href="#listings">Listings</a>
          <a href="#about">About</a>
          <a href="#reviews">Reviews</a>
          <Link href={`/shop/${shop.slug}/pricelist`}>Price list</Link>
        </div>
      </nav>
      <section className="sellerProfile">
        <header className="sellerProfileHeader">
          <div className="sellerIdentity">
            {shop.logo_url ? <img alt="" src={shop.logo_url} /> : <span>{shop.name.slice(0, 1).toUpperCase()}</span>}
            <div>
              <p className="eyebrow">Seller profile</p>
              <h1>{shop.name}</h1>
              <p>{shop.tagline || "Browse parts, build a quote list, and send a request directly to this shop."}</p>
            </div>
          </div>
          <div className="sellerStats">
            <div>
              <strong>{products.length}</strong>
              <span>active listings</span>
            </div>
            <div>
              <strong>{categoryCount}</strong>
              <span>categories</span>
            </div>
            <div>
              <strong>{shop.external_rating ? Number(shop.external_rating).toFixed(1) : "-"}</strong>
              <span>external rating</span>
            </div>
          </div>
          <div className="heroActions">
            <Link className="button buttonPrimary" href={`/shop/${shop.slug}/pricelist`}>
              Request a quote
            </Link>
            {shop.messenger_url ? (
              <Link className="button buttonGhost" href={shop.messenger_url} target="_blank">
                Message seller
              </Link>
            ) : null}
            {shop.facebook_marketplace_url ? (
              <Link className="button buttonGhost" href={shop.facebook_marketplace_url} target="_blank">
                Facebook Marketplace
              </Link>
            ) : null}
            {shop.facebook_page_url ? (
              <Link className="button buttonGhost" href={shop.facebook_page_url} target="_blank">
                Facebook Page
              </Link>
            ) : null}
          </div>
          {[shop.address, shop.phone].filter(Boolean).length ? (
            <p className="muted sellerContact">{[shop.address, shop.phone].filter(Boolean).join(" / ")}</p>
          ) : null}
        </header>
        {products.length ? (
          <PublicListings products={products} shopSlug={shop.slug} />
        ) : (
          <section className="notice">This seller has no active listings yet.</section>
        )}
        <section className="sellerSection" id="about">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">About</p>
              <h2>About this seller</h2>
            </div>
          </div>
          <p className="sellerCopy">
            {shop.about ||
              shop.tagline ||
              "This seller has not added an about section yet. Use Messenger or Facebook to ask about availability, warranty, pickup, or delivery."}
          </p>
        </section>
        <section className="sellerSection" id="reviews">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Reviews</p>
              <h2>External review proof</h2>
            </div>
          </div>
          <div className="reviewProof">
            <div>
              <strong>{reviewSummary}</strong>
              <p className="muted">Reviews are linked as external proof for now. Native Uncapped.gg reviews can be added later.</p>
            </div>
            <div className="heroActions">
              {shop.facebook_marketplace_url ? (
                <Link className="button buttonGhost" href={shop.facebook_marketplace_url} target="_blank">
                  Facebook Marketplace
                </Link>
              ) : null}
              {shop.external_review_url ? (
                <Link className="button buttonGhost" href={shop.external_review_url} target="_blank">
                  View reviews
                </Link>
              ) : null}
              {shop.facebook_page_url ? (
                <Link className="button buttonGhost" href={shop.facebook_page_url} target="_blank">
                  Facebook Page
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
