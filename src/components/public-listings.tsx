"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categoryLabel } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import {
  PRODUCT_AVAILABILITIES,
  productAvailabilitySummary,
  productIsQuoteable,
  productAvailabilityOrDefault
} from "@/lib/product-availability";
import { PRODUCT_CONDITIONS, productConditionLabel, productConditionOrDefault } from "@/lib/product-conditions";
import { getProductHighlights } from "@/lib/product-foundation";
import { BUILDER_TAB_OPTIONS, normalizeBuilderTab, productMatchesQuery, type BuilderTab } from "@/lib/pc-builder-contract";
import type { Product } from "@/lib/types";

type ListingSortKey = "category" | "newest" | "price_asc" | "price_desc" | "title";

export function PublicListings({ products, shopSlug }: { products: Product[]; shopSlug: string }) {
  const [activeTab, setActiveTab] = useState<BuilderTab | "all">("all");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [availability, setAvailability] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<ListingSortKey>("category");

  const availableTabs = useMemo(
    () => BUILDER_TAB_OPTIONS.filter((tab) => products.some((product) => normalizeBuilderTab(product.category) === tab.key)),
    [products]
  );
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      const key = normalizeBuilderTab(product.category);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [products]);

  const tabProducts = useMemo(
    () => products.filter((product) => activeTab === "all" || normalizeBuilderTab(product.category) === activeTab),
    [activeTab, products]
  );

  const brandOptions = useMemo(
    () =>
      Array.from(new Set(tabProducts.map((product) => product.brand || "").filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      ),
    [tabProducts]
  );

  const filteredProducts = useMemo(
    () =>
      tabProducts.filter((product) => {
        const price = Number(product.price || 0);
        const minimum = parsePriceBound(minPrice);
        const maximum = parsePriceBound(maxPrice);
        if (brand && product.brand !== brand) return false;
        if (condition && productConditionOrDefault(product.condition) !== condition) return false;
        if (availability && productAvailabilityOrDefault(product.availability_status) !== availability) return false;
        if (minimum !== null && price < minimum) return false;
        if (maximum !== null && price > maximum) return false;
        return productMatchesQuery(product, query);
      }),
    [availability, brand, condition, maxPrice, minPrice, query, tabProducts]
  );

  const sortedProducts = useMemo(() => sortProducts(filteredProducts, sort), [filteredProducts, sort]);
  const grouped = BUILDER_TAB_OPTIONS.map((category) => ({
    ...category,
    products: sortedProducts.filter((product) => normalizeBuilderTab(product.category) === category.key)
  })).filter((group) => group.products.length);

  function changeTab(nextTab: BuilderTab | "all") {
    setActiveTab(nextTab);
    setBrand("");
    setCondition("");
    setAvailability("");
  }

  return (
    <section className="sellerSection" id="listings">
      <div className="sectionTitle">
        <div>
          <p className="eyebrow">Listings</p>
          <h2>Items for sale</h2>
        </div>
        <Link className="button buttonGhost" href={`/shop/${shopSlug}/pricelist`}>
          Request a quote
        </Link>
      </div>
      <div className="sellerListingsLayout">
        <aside className="priceListTools listingSidebar" aria-label="Listing filters">
          <div className="filterPanelHeader">
            <strong>Filters</strong>
            <span>{filteredProducts.length} results</span>
          </div>
          <div className="filterSection">
            <span className="filterSectionLabel">Category</span>
            <div className="categoryList" role="tablist" aria-label="Listing categories">
              <button
                aria-selected={activeTab === "all"}
                className={activeTab === "all" ? "isActive" : ""}
                onClick={() => changeTab("all")}
                role="tab"
                type="button"
              >
                <span>All listings</span>
                <strong>{products.length}</strong>
              </button>
              {availableTabs.map((tab) => (
                <button
                  aria-selected={activeTab === tab.key}
                  className={activeTab === tab.key ? "isActive" : ""}
                  key={tab.key}
                  onClick={() => changeTab(tab.key)}
                  role="tab"
                  type="button"
                >
                  <span>{tab.label}</span>
                  <strong>{categoryCounts.get(tab.key) || 0}</strong>
                </button>
              ))}
            </div>
          </div>
          <div className="filterStack">
            <label>
              <span>Search</span>
              <input onChange={(event) => setQuery(event.target.value)} placeholder="Search listings, SKU, specs..." type="search" value={query} />
            </label>
            <label>
              <span>Brand</span>
              <select onChange={(event) => setBrand(event.target.value)} value={brand}>
                <option value="">All brands</option>
                {brandOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Condition</span>
              <select onChange={(event) => setCondition(event.target.value)} value={condition}>
                <option value="">All conditions</option>
                {PRODUCT_CONDITIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Availability</span>
              <select onChange={(event) => setAvailability(event.target.value)} value={availability}>
                <option value="">All availability</option>
                {PRODUCT_AVAILABILITIES.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="priceRangeField">
              <span>Price range</span>
              <div>
                <input
                  aria-label="Minimum price"
                  inputMode="numeric"
                  min="0"
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="Min"
                  type="number"
                  value={minPrice}
                />
                <input
                  aria-label="Maximum price"
                  inputMode="numeric"
                  min="0"
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="Max"
                  type="number"
                  value={maxPrice}
                />
              </div>
            </div>
            <label>
              <span>Sort</span>
              <select onChange={(event) => setSort(event.target.value as ListingSortKey)} value={sort}>
                <option value="category">Category first</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price low to high</option>
                <option value="price_desc">Price high to low</option>
                <option value="title">Title</option>
              </select>
            </label>
          </div>
          <p className="muted">
            Showing {filteredProducts.length} of {products.length} active listings.
          </p>
        </aside>
        <div className="listingResults">
          <div className="listingResultsBar">
            <div>
              <strong>{activeTab === "all" ? "All listings" : categoryLabel(activeTab)}</strong>
              <span>
                {filteredProducts.length} result{filteredProducts.length === 1 ? "" : "s"}
              </span>
            </div>
            <Link className="button buttonGhost" href={`/shop/${shopSlug}/pricelist`}>
              Quote selected items
            </Link>
          </div>
          <div className="listingGroups">
            {grouped.map((group) => (
              <div className="listingGroup" key={group.key}>
                <h3>{group.label}</h3>
                <div className="listingGrid">
                  {group.products.map((product) => (
                    <ListingCard key={product.id} product={product} shopSlug={shopSlug} />
                  ))}
                </div>
              </div>
            ))}
            {!grouped.length ? <section className="notice">No listings match the current filters.</section> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ListingCard({ product, shopSlug }: { product: Product; shopSlug: string }) {
  const image = product.image_urls?.[0] || product.image_url;
  const highlights = getProductHighlights(product, 3);
  const detailsHref = product.handle ? `/shop/${shopSlug}/products/${product.handle}` : `/shop/${shopSlug}/pricelist`;
  const quoteable = productIsQuoteable(product);
  const meta = [product.brand, productAvailabilitySummary(product)].filter(Boolean);

  return (
    <article className="listingCard">
      <Link className="listingMedia" href={detailsHref}>
        {image ? <img alt={product.title} src={image} /> : <div className="imagePlaceholder">No image</div>}
        <span className="conditionBadge">{productConditionLabel(product.condition)}</span>
        <span className={`availabilityBadge availability-${productAvailabilityOrDefault(product.availability_status)}`}>
          {productAvailabilitySummary(product)}
        </span>
      </Link>
      <div className="listingCardBody">
        <div className="listingMeta">
          <span>{categoryLabel(product.category)}</span>
        </div>
        <h4>
          <Link href={detailsHref}>{product.title}</Link>
        </h4>
        <div className="listingPrice">
          <strong>{formatMoney(product.price)}</strong>
          {product.compare_at_price ? <span>{formatMoney(product.compare_at_price)}</span> : null}
        </div>
        {meta.length ? <p className="listingMetaLine">{meta.join(" / ")}</p> : null}
        {highlights.length ? (
          <div className="chipRow">
            {highlights.map((item) => (
              <span className="specChip" key={`${product.id}:${item.label}`}>
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="listingCardFooter">
        <Link className="button buttonGhost" href={detailsHref}>
          View details
        </Link>
        {quoteable ? (
          <Link className="button buttonPrimary" href={`/shop/${shopSlug}/pricelist`}>
            Request quote
          </Link>
        ) : (
          <span className="button buttonGhost isButtonDisabled">Sold out</span>
        )}
      </div>
    </article>
  );
}

function parsePriceBound(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function sortProducts(products: Product[], sort: ListingSortKey): Product[] {
  const sorted = [...products];

  if (sort === "newest") {
    return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (sort === "price_asc") {
    return sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0) || a.title.localeCompare(b.title));
  }

  if (sort === "price_desc") {
    return sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0) || a.title.localeCompare(b.title));
  }

  if (sort === "title") {
    return sorted.sort((a, b) => a.title.localeCompare(b.title));
  }

  return sorted;
}
