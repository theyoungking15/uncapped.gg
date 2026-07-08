"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { createProduct, importProducts, saveShopProfile, signInWithEmail, submitPublicQuote, updateProduct } from "@/server/actions";
import type { Product, ProductCatalogItem, ProductDataValue, Shop } from "@/lib/types";
import { CATEGORY_OPTIONS, categoryLabel } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import {
  PRODUCT_AVAILABILITIES,
  productAvailabilityOrDefault,
  productAvailabilitySummary,
  productIsQuoteable
} from "@/lib/product-availability";
import { PRODUCT_CONDITIONS, productConditionLabel, productConditionOrDefault } from "@/lib/product-conditions";
import { getProductEditorGroupsForCategory, type ProductEditorField } from "@/lib/product-editor-fields";
import { getProductHighlights } from "@/lib/product-foundation";
import {
  BUILDER_TAB_OPTIONS,
  getBuilderFacetsForTab,
  getFacetOptionValues,
  getProductFacetValues,
  normalizeBuilderTab,
  productMatchesQuery,
  type BuilderTab
} from "@/lib/pc-builder-contract";

const initialState = { ok: false, message: "" };
type ListingSortKey = "category" | "newest" | "price_asc" | "price_desc" | "title";

export function LoginForm() {
  const [state, action, pending] = useActionState(signInWithEmail, initialState);

  return (
    <form action={action} className="formStack">
      <label>
        <span>Email</span>
        <input name="email" type="email" placeholder="owner@example.com" required />
      </label>
      <button className="button buttonPrimary" disabled={pending} type="submit">
        {pending ? "Sending..." : "Send sign-in link"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ShopProfileForm({ shop }: { shop: Shop | null }) {
  const [state, action, pending] = useActionState(saveShopProfile, initialState);

  return (
    <form action={action} className="formGrid">
      <label>
        <span>Shop name</span>
        <input name="name" defaultValue={shop?.name || ""} placeholder="PC Zone" required />
      </label>
      <label>
        <span>Public shop link</span>
        <input name="slug" defaultValue={shop?.slug || ""} placeholder="pc-zone" required />
      </label>
      <label className="span2">
        <span>Tagline</span>
        <input name="tagline" defaultValue={shop?.tagline || ""} placeholder="Custom PC builds and parts quotes" />
      </label>
      <label className="span2">
        <span>About</span>
        <textarea name="about" rows={5} defaultValue={shop?.about || ""} placeholder="Tell buyers about your shop, warranty approach, location, and build experience." />
      </label>
      <label>
        <span>Facebook Page URL</span>
        <input name="facebook_page_url" defaultValue={shop?.facebook_page_url || ""} placeholder="https://facebook.com/..." />
      </label>
      <label>
        <span>Facebook Marketplace URL</span>
        <input name="facebook_marketplace_url" defaultValue={shop?.facebook_marketplace_url || ""} placeholder="https://facebook.com/marketplace/..." />
      </label>
      <label>
        <span>Messenger URL</span>
        <input name="messenger_url" defaultValue={shop?.messenger_url || ""} placeholder="https://m.me/..." />
      </label>
      <label>
        <span>External reviews URL</span>
        <input name="external_review_url" defaultValue={shop?.external_review_url || ""} placeholder="Facebook reviews, Marketplace profile, or proof link" />
      </label>
      <label>
        <span>External rating</span>
        <input name="external_rating" type="number" step="0.1" min="0" max="5" defaultValue={shop?.external_rating ? String(shop.external_rating) : ""} placeholder="4.8" />
      </label>
      <label>
        <span>Review count</span>
        <input name="external_review_count" type="number" min="0" defaultValue={shop?.external_review_count ? String(shop.external_review_count) : ""} placeholder="24" />
      </label>
      <label>
        <span>Phone</span>
        <input name="phone" defaultValue={shop?.phone || ""} placeholder="0912 345 6789" />
      </label>
      <label>
        <span>Logo URL</span>
        <input name="logo_url" defaultValue={shop?.logo_url || ""} placeholder="https://..." />
      </label>
      <label className="span2">
        <span>Address</span>
        <input name="address" defaultValue={shop?.address || ""} placeholder="City, province, branch, or pickup location" />
      </label>
      <div className="formFooter span2">
        <button className="button buttonPrimary" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save shop profile"}
        </button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function ImportProductsForm() {
  const [state, action, pending] = useActionState(importProducts, initialState);

  return (
    <form action={action} className="formStack">
      <label>
        <span>Published CSV URL</span>
        <input name="source_url" type="url" placeholder="https://docs.google.com/spreadsheets/..." />
      </label>
      <label>
        <span>Or upload CSV file</span>
        <input accept=".csv,text/csv" name="csv_file" type="file" />
      </label>
      <button className="button buttonPrimary" disabled={pending} type="submit">
        {pending ? "Importing..." : "Import products"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ProductCreateForm({ catalogItems }: { catalogItems: ProductCatalogItem[] }) {
  const [state, action, pending] = useActionState(createProduct, initialState);
  const [category, setCategory] = useState("processor");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState("");

  const categoryItems = useMemo(
    () => catalogItems.filter((item) => item.category === category),
    [catalogItems, category]
  );

  const brandOptions = useMemo(
    () =>
      Array.from(new Set(categoryItems.map((item) => item.brand || "").filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      ),
    [categoryItems]
  );

  const filteredCatalogItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return categoryItems
      .filter((item) => !brand || item.brand === brand)
      .filter((item) => !needle || catalogItemSearchText(item).includes(needle))
      .slice(0, 24);
  }, [brand, categoryItems, query]);

  const selectedCatalogItem = catalogItems.find((item) => item.id === selectedCatalogId) || null;

  function changeCategory(nextCategory: string) {
    setCategory(nextCategory);
    setBrand("");
    setQuery("");
    setSelectedCatalogId("");
  }

  return (
    <form action={action} className="productEditForm">
      <section className="editorSection">
        <div className="sectionIntro">
          <h2>Choose component</h2>
          <p>Start with the component category, then link the seller listing to a known catalog item when possible.</p>
        </div>
        <input name="catalog_item_id" type="hidden" value={selectedCatalogId} />
        <div className="formGrid">
          <label>
            <span>Component category</span>
            <select name="category" onChange={(event) => changeCategory(event.target.value)} value={category}>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Catalog search</span>
            <input onChange={(event) => setQuery(event.target.value)} placeholder="Search Ryzen 5 5600, RTX 4060, B650..." type="search" value={query} />
          </label>
          <label>
            <span>Brand filter</span>
            <select onChange={(event) => setBrand(event.target.value)} value={brand}>
              <option value="">All brands</option>
              {brandOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="span2 catalogPicker">
            {filteredCatalogItems.map((item) => (
              <button
                className={selectedCatalogId === item.id ? "catalogOption isSelected" : "catalogOption"}
                key={item.id}
                onClick={() => setSelectedCatalogId(item.id)}
                type="button"
              >
                <strong>{item.canonical_name}</strong>
                <span>{[item.brand, item.model || item.part_number, categoryLabel(item.category)].filter(Boolean).join(" / ")}</span>
                <CatalogHighlights item={item} />
              </button>
            ))}
            {!filteredCatalogItems.length ? (
              <div className="notice catalogEmpty">
                No catalog item matched this category yet. Create a manual listing below, or import Shopify/CSV products to seed the catalog.
              </div>
            ) : null}
          </div>
          {selectedCatalogItem ? (
            <div className="span2 linkedCatalogNotice">
              <strong>Linked catalog item</strong>
              <span>{selectedCatalogItem.canonical_name}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="editorSection">
        <div className="sectionIntro">
          <h2>Seller listing details</h2>
          <p>These fields belong to the seller listing: condition, price, inventory, availability, and contact context.</p>
        </div>
        <div className="formGrid">
          <label className="span2">
            <span>{selectedCatalogItem ? "Listing title override" : "Listing title"}</span>
            <input name="title" placeholder={selectedCatalogItem?.canonical_name || "Ryzen 5 5600 used good condition"} required={!selectedCatalogItem} />
          </label>
          <label>
            <span>Condition</span>
            <select name="condition" defaultValue="brand_new">
              {PRODUCT_CONDITIONS.map((condition) => (
                <option key={condition.key} value={condition.key}>
                  {condition.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Brand</span>
            <input key={`brand:${selectedCatalogItem?.id || "manual"}`} name="brand" defaultValue={selectedCatalogItem?.brand || ""} disabled={Boolean(selectedCatalogItem)} />
          </label>
          <label>
            <span>Price</span>
            <input name="price" type="number" step="0.01" min="0" defaultValue="0" required />
          </label>
          <label>
            <span>Compare-at price</span>
            <input name="compare_at_price" type="number" step="0.01" min="0" />
          </label>
          <label>
            <span>Seller SKU</span>
            <input name="sku" />
          </label>
          <label>
            <span>Model / part number</span>
            <input
              key={`model:${selectedCatalogItem?.id || "manual"}`}
              name="model"
              defaultValue={selectedCatalogItem?.model || selectedCatalogItem?.part_number || ""}
              disabled={Boolean(selectedCatalogItem)}
            />
          </label>
          <label>
            <span>Availability</span>
            <select name="availability_status" defaultValue="on_hand">
              {PRODUCT_AVAILABILITIES.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Inventory quantity</span>
            <input name="inventory_quantity" type="number" min="0" step="1" defaultValue="0" />
          </label>
          <label className="span2">
            <span>Fulfillment lead time</span>
            <input name="lead_time_label" placeholder="Required for pre-order, e.g. 7-14 days" />
          </label>
          <label>
            <span>Image URL</span>
            <input name="image_url" placeholder="https://..." />
          </label>
          <label>
            <span>Product URL</span>
            <input name="product_url" placeholder="https://..." />
          </label>
          <label className="span2">
            <span>Description</span>
            <textarea name="description" rows={5} />
          </label>
          <div className="span2 checkboxGrid">
            <label className="checkboxField">
              <input name="is_active" type="checkbox" defaultChecked />
              <span>Visible on public listings</span>
            </label>
            <label className="checkboxField">
              <input name="show_inventory_quantity" type="checkbox" />
              <span>Show exact quantity publicly</span>
            </label>
            <label className="checkboxField">
              <input name="pc_builder_enabled" type="checkbox" checked={Boolean(selectedCatalogItem)} readOnly />
              <span>Enabled for future PC Builder</span>
            </label>
          </div>
        </div>
      </section>
      <div className="editorActions">
        <button className="button buttonPrimary" disabled={pending} type="submit">
          {pending ? "Creating..." : "Create listing"}
        </button>
        <Link className="button buttonGhost" href="/app/products">
          Back to listings
        </Link>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function ProductEditForm({ product, shopSlug }: { product: Product; shopSlug: string }) {
  const [state, action, pending] = useActionState(updateProduct, initialState);

  return (
    <form action={action} className="productEditForm">
      <input name="product_id" type="hidden" value={product.id} />
      <section className="editorSection">
        <div className="sectionIntro">
          <h2>Product basics</h2>
          <p>Pricing, visibility, category, and public product information.</p>
        </div>
        <div className="formGrid">
          <label>
            <span>Title</span>
            <input name="title" defaultValue={product.title} required />
          </label>
          <label>
            <span>Category</span>
            <select name="category" defaultValue={product.category}>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Condition</span>
            <select name="condition" defaultValue={productConditionOrDefault(product.condition)}>
              {PRODUCT_CONDITIONS.map((condition) => (
                <option key={condition.key} value={condition.key}>
                  {condition.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Brand</span>
            <input name="brand" defaultValue={product.brand || ""} />
          </label>
          <label>
            <span>Price</span>
            <input name="price" type="number" step="0.01" min="0" defaultValue={String(product.price || 0)} required />
          </label>
          <label>
            <span>Compare-at price</span>
            <input name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product.compare_at_price ? String(product.compare_at_price) : ""} />
          </label>
          <label>
            <span>Seller SKU</span>
            <input name="sku" defaultValue={product.sku || ""} />
          </label>
          <label>
            <span>Model / part number</span>
            <input name="model" defaultValue={product.model || ""} />
          </label>
          <label>
            <span>Availability</span>
            <select name="availability_status" defaultValue={productAvailabilityOrDefault(product.availability_status)}>
              {PRODUCT_AVAILABILITIES.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Inventory quantity</span>
            <input name="inventory_quantity" type="number" min="0" step="1" defaultValue={String(product.inventory_quantity || 0)} />
          </label>
          <label>
            <span>Availability tier</span>
            <select name="availability_tier" defaultValue={product.availability_tier ? String(product.availability_tier) : ""}>
              <option value="">No tier</option>
              <option value="1">1 - On-hand</option>
              <option value="2">2 - Local source</option>
              <option value="3">3 - Overseas source</option>
              <option value="9">9 - Ask to confirm</option>
            </select>
          </label>
          <label>
            <span>Fulfillment lead time</span>
            <input name="lead_time_label" defaultValue={product.lead_time_label || ""} placeholder="Required for pre-order, e.g. 7-14 days" />
          </label>
          <label>
            <span>Image URL</span>
            <input name="image_url" defaultValue={product.image_url || ""} placeholder="https://..." />
          </label>
          <label className="span2">
            <span>Product URL</span>
            <input name="product_url" defaultValue={product.product_url || ""} placeholder="https://..." />
          </label>
          <label className="span2">
            <span>Description</span>
            <textarea name="description" rows={5} defaultValue={product.description || ""} />
          </label>
          <div className="span2 checkboxGrid">
            <label className="checkboxField">
              <input name="is_active" type="checkbox" defaultChecked={product.is_active} />
              <span>Visible on public listings</span>
            </label>
            <label className="checkboxField">
              <input name="show_inventory_quantity" type="checkbox" defaultChecked={product.show_inventory_quantity} />
              <span>Show exact quantity publicly</span>
            </label>
            <label className="checkboxField">
              <input name="pc_builder_enabled" type="checkbox" defaultChecked={product.pc_builder_enabled} />
              <span>Enabled for future PC Builder</span>
            </label>
          </div>
        </div>
      </section>

      {getProductEditorGroupsForCategory(product.category).map((group) => (
        <section className="editorSection" key={group.title}>
          <div className="sectionIntro">
            <h2>{group.title}</h2>
            <p>{group.description}</p>
          </div>
          <div className="formGrid">
            {group.fields.map((field) => (
              <EditorField field={field} key={field.path} product={product} />
            ))}
          </div>
        </section>
      ))}

      <div className="editorActions">
        <button className="button buttonPrimary" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save listing"}
        </button>
        <Link className="button buttonGhost" href="/app/products">
          Back to listings
        </Link>
        {product.handle ? (
          <Link className="button buttonGhost" href={`/shop/${shopSlug}/products/${product.handle}`} target="_blank">
            View public product
          </Link>
        ) : null}
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function QuoteRequestForm({ shop, products }: { shop: Shop; products: Product[] }) {
  const [state, action, pending] = useActionState(submitPublicQuote, initialState);
  const [activeTab, setActiveTab] = useState<BuilderTab | "all">("all");
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [availability, setAvailability] = useState("");
  const [sort, setSort] = useState<ListingSortKey>("category");
  const [facetFilters, setFacetFilters] = useState<Record<string, string>>({});

  const availableTabs = useMemo(
    () => BUILDER_TAB_OPTIONS.filter((tab) => products.some((product) => normalizeBuilderTab(product.category) === tab.key)),
    [products]
  );

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

  const facets = useMemo(() => (activeTab === "all" ? [] : getBuilderFacetsForTab(activeTab)), [activeTab]);
  const facetOptions = useMemo(
    () => Object.fromEntries(facets.map((facet) => [facet.key, getFacetOptionValues(tabProducts, facet.key)])) as Record<string, string[]>,
    [facets, tabProducts]
  );

  const filteredProducts = useMemo(
    () =>
      tabProducts.filter((product) => {
        if (brand && product.brand !== brand) return false;
        if (condition && productConditionOrDefault(product.condition) !== condition) return false;
        if (availability && productAvailabilityOrDefault(product.availability_status) !== availability) return false;
        if (!productMatchesQuery(product, query)) return false;

        return facets.every((facet) => {
          const selected = facetFilters[facet.key];
          if (!selected) return true;
          return getProductFacetValues(product, facet.key).includes(selected);
        });
      }),
    [availability, brand, condition, facetFilters, facets, query, tabProducts]
  );

  const sortedProducts = useMemo(
    () => sortListingProducts(filteredProducts, sort),
    [filteredProducts, sort]
  );

  const grouped = BUILDER_TAB_OPTIONS.map((category) => ({
    ...category,
    products: sortedProducts.filter((product) => normalizeBuilderTab(product.category) === category.key)
  })).filter((group) => group.products.length);

  function changeTab(nextTab: BuilderTab | "all") {
    setActiveTab(nextTab);
    setAvailability("");
    setFacetFilters({});
  }

  return (
    <form action={action} className="quoteForm">
      <input type="hidden" name="shop_slug" value={shop.slug} />
      <section className="quotePicker">
        <div className="priceListTools">
          <div className="tabStrip" role="tablist" aria-label="Product categories">
            <button
              aria-selected={activeTab === "all"}
              className={activeTab === "all" ? "isActive" : ""}
              onClick={() => changeTab("all")}
              role="tab"
              type="button"
            >
              All
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
                {tab.label}
              </button>
            ))}
          </div>
          <div className="filterBar">
            <label>
              <span>Search</span>
              <input onChange={(event) => setQuery(event.target.value)} placeholder="Search product, SKU, socket, chipset..." type="search" value={query} />
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
            {facets.map((facet) => {
              const options = facetOptions[facet.key] || [];
              if (!options.length) return null;

              return (
                <label key={facet.key}>
                  <span>{facet.label}</span>
                  <select
                    onChange={(event) =>
                      setFacetFilters((current) => ({
                        ...current,
                        [facet.key]: event.target.value
                      }))
                    }
                    value={facetFilters[facet.key] || ""}
                  >
                    <option value="">All</option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
          <p className="muted">
            Showing {filteredProducts.length} of {products.length} active products.
          </p>
        </div>
        {grouped.map((group) => (
          <div className="quoteGroup" key={group.key}>
            <h2>{group.label}</h2>
          <div className="quoteRows">
              {group.products.map((product) => {
                const quoteable = productIsQuoteable(product);

                return (
                  <div className={quoteable ? "quoteRow" : "quoteRow isDisabled"} key={product.id}>
                    <div>
                      <strong>{product.title}</strong>
                      {product.handle ? (
                        <Link className="detailLink" href={`/shop/${shop.slug}/products/${product.handle}`}>
                          View details
                        </Link>
                      ) : null}
                      <span>
                        {[product.brand, productAvailabilitySummary(product), categoryLabel(product.category)].filter(Boolean).join(" / ")}
                      </span>
                      <span>{productConditionLabel(product.condition)}</span>
                      <ProductHighlights product={product} />
                    </div>
                    <span>{formatMoney(product.price)}</span>
                    <input
                      aria-label={`Quantity for ${product.title}`}
                      min="0"
                      name={`qty:${product.id}`}
                      type="number"
                      inputMode="numeric"
                      defaultValue="0"
                      disabled={!quoteable}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {!grouped.length ? <section className="notice">No products match the current filters.</section> : null}
      </section>
      <section className="quoteDetails">
        <h2>Request a quote</h2>
        <label>
          <span>Name</span>
          <input name="customer_name" required />
        </label>
        <label>
          <span>Contact method</span>
          <select name="contact_method" defaultValue="messenger">
            <option value="messenger">Messenger</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label>
          <span>Contact detail</span>
          <input name="contact_value" placeholder="Messenger profile, phone, or email" required />
        </label>
        <label>
          <span>Notes</span>
          <textarea name="notes" rows={4} placeholder="Budget, preferred games, pickup/delivery notes, or substitutions." />
        </label>
        <button className="button buttonPrimary" disabled={pending} type="submit">
          {pending ? "Sending..." : "Send quote request"}
        </button>
        <ActionMessage state={state} />
      </section>
    </form>
  );
}

function EditorField({ product, field }: { product: Product; field: ProductEditorField }) {
  const value = formatEditorFieldValue(readEditorFieldValue(product, field.path), field);
  const className = field.kind === "list" ? "span2" : undefined;

  return (
    <label className={className}>
      <span>{field.label}</span>
      {field.kind === "list" ? (
        <textarea name={field.path} rows={2} defaultValue={value} />
      ) : (
        <input name={field.path} type={field.kind === "number" ? "number" : "text"} step={field.kind === "number" ? "any" : undefined} defaultValue={value} />
      )}
      {field.help ? <small className="fieldHelp">{field.help}</small> : null}
    </label>
  );
}

function ActionMessage({ state }: { state: { ok: boolean; message: string } }) {
  if (!state.message) return null;
  return <p className={state.ok ? "formMessage isOk" : "formMessage isError"}>{state.message}</p>;
}

function ProductHighlights({ product }: { product: Product }) {
  const highlights = getProductHighlights(product, 3);
  if (!highlights.length) return null;

  return (
    <div className="chipRow">
      {highlights.map((item) => (
        <span className="specChip" key={`${item.label}:${item.value}`}>
          {item.label}: {item.value}
        </span>
      ))}
    </div>
  );
}

function CatalogHighlights({ item }: { item: ProductCatalogItem }) {
  const highlights = catalogHighlightValues(item).slice(0, 4);
  if (!highlights.length) return null;

  return (
    <div className="chipRow">
      {highlights.map((highlight) => (
        <span className="specChip" key={`${item.id}:${highlight.label}`}>
          {highlight.label}: {highlight.value}
        </span>
      ))}
    </div>
  );
}

function catalogItemSearchText(item: ProductCatalogItem): string {
  return [
    item.canonical_name,
    item.brand,
    item.model,
    item.part_number,
    categoryLabel(item.category),
    ...(item.search_aliases || []),
    ...Object.values(item.specs || {}).map(dataValueLabel),
    ...Object.values(item.compat || {}).map(dataValueLabel)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function catalogHighlightValues(item: ProductCatalogItem): Array<{ label: string; value: string }> {
  const fieldMap: Record<string, Array<{ label: string; path: string }>> = {
    processor: [
      { label: "Socket", path: "compat.processor_sockets" },
      { label: "Memory", path: "compat.memory_technology" },
      { label: "Cores", path: "specs.cpu_core_count" },
      { label: "TDP", path: "specs.tdp" }
    ],
    motherboard: [
      { label: "Socket", path: "compat.processor_sockets" },
      { label: "Memory", path: "compat.memory_technology" },
      { label: "Chipset", path: "specs.socket_chipset" },
      { label: "Form", path: "specs.motherboard_form_factor" }
    ],
    memory: [
      { label: "Memory", path: "compat.memory_technology" },
      { label: "Capacity", path: "specs.ram_capacity" },
      { label: "Speed", path: "specs.ram_speed" },
      { label: "Modules", path: "specs.ram_module_count" }
    ],
    gpu: [
      { label: "Chipset", path: "specs.gpu_chipset" },
      { label: "VRAM", path: "specs.gpu_vram" },
      { label: "Length", path: "specs.gpu_length" },
      { label: "Min PSU", path: "compat.minimum_psu_watts" }
    ],
    ssd: [
      { label: "Interface", path: "specs.ssd_device_interface" },
      { label: "Read", path: "specs.read_mbps" },
      { label: "Write", path: "specs.write_mbps" },
      { label: "Form", path: "specs.m_2_form_factor" }
    ],
    powersupply: [
      { label: "Watts", path: "specs.psu_watts" },
      { label: "Certification", path: "specs.psu_certification" },
      { label: "Modularity", path: "specs.psu_modularity" }
    ],
    cpucooler: [
      { label: "Type", path: "specs.cpu_cooler_type" },
      { label: "Height", path: "specs.cooler_height" },
      { label: "Radiator", path: "specs.cooler_radiator_size" }
    ],
    case: [
      { label: "Motherboard", path: "compat.supported_motherboard" },
      { label: "GPU", path: "compat.gpu_clearance_mm" },
      { label: "Cooler", path: "specs.cooler_height" }
    ]
  };

  return (fieldMap[item.category] || fieldMap.processor)
    .map((field) => {
      const value = dataValueLabel(readCatalogValue(item, field.path));
      return value ? { label: field.label, value } : null;
    })
    .filter(Boolean) as Array<{ label: string; value: string }>;
}

function readCatalogValue(item: ProductCatalogItem, path: string): ProductDataValue | undefined {
  const [root, key] = path.split(".");
  if (root === "specs") return item.specs?.[key];
  if (root === "compat") return item.compat?.[key];
  return undefined;
}

function dataValueLabel(value: ProductDataValue | undefined): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(dataValueLabel).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const maybeObject = value as Record<string, ProductDataValue>;
    return (
      dataValueLabel(maybeObject.name) ||
      dataValueLabel(maybeObject.label) ||
      dataValueLabel(maybeObject.title) ||
      dataValueLabel(maybeObject.value) ||
      dataValueLabel(maybeObject.handle)
    );
  }
  return "";
}

function sortListingProducts(products: Product[], sort: ListingSortKey): Product[] {
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

function readEditorFieldValue(product: Product, path: string): ProductDataValue | undefined {
  const [root, key] = path.split(".");
  if (root === "specs") return product.specs?.[key];
  if (root === "compat") return product.compat?.[key];
  return undefined;
}

function formatEditorFieldValue(value: ProductDataValue | undefined, field: ProductEditorField): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map((item) => formatEditorFieldValue(item, field)).filter(Boolean).join(", ");
  if (typeof value === "object") return "";

  const raw = String(value).trim();
  if (!raw) return "";
  if (field.kind !== "number") return raw;

  const matched = raw.match(/-?\d+(\.\d+)?/);
  return matched ? matched[0] : "";
}
