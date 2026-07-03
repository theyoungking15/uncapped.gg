"use client";

import { useActionState } from "react";
import { importPublishedSheet, saveShopProfile, signInWithEmail, submitPublicQuote } from "@/server/actions";
import type { Product, Shop } from "@/lib/types";
import { CATEGORY_OPTIONS, categoryLabel } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

const initialState = { ok: false, message: "" };

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
      <label>
        <span>Facebook Page URL</span>
        <input name="facebook_page_url" defaultValue={shop?.facebook_page_url || ""} placeholder="https://facebook.com/..." />
      </label>
      <label>
        <span>Messenger URL</span>
        <input name="messenger_url" defaultValue={shop?.messenger_url || ""} placeholder="https://m.me/..." />
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
  const [state, action, pending] = useActionState(importPublishedSheet, initialState);

  return (
    <form action={action} className="formStack">
      <label>
        <span>Published Google Sheets CSV URL</span>
        <input name="source_url" type="url" placeholder="https://docs.google.com/spreadsheets/..." required />
      </label>
      <button className="button buttonPrimary" disabled={pending} type="submit">
        {pending ? "Importing..." : "Import products"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function QuoteRequestForm({ shop, products }: { shop: Shop; products: Product[] }) {
  const [state, action, pending] = useActionState(submitPublicQuote, initialState);
  const grouped = CATEGORY_OPTIONS.map((category) => ({
    ...category,
    products: products.filter((product) => product.category === category.key)
  })).filter((group) => group.products.length);

  return (
    <form action={action} className="quoteForm">
      <input type="hidden" name="shop_slug" value={shop.slug} />
      <section className="quotePicker">
        {grouped.map((group) => (
          <div className="quoteGroup" key={group.key}>
            <h2>{group.label}</h2>
            <div className="quoteRows">
              {group.products.map((product) => (
                <label className="quoteRow" key={product.id}>
                  <div>
                    <strong>{product.title}</strong>
                    <span>
                      {[product.brand, product.stock_status, categoryLabel(product.category)].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <span>{formatMoney(product.price)}</span>
                  <input min="0" name={`qty:${product.id}`} type="number" inputMode="numeric" defaultValue="0" />
                </label>
              ))}
            </div>
          </div>
        ))}
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

function ActionMessage({ state }: { state: { ok: boolean; message: string } }) {
  if (!state.message) return null;
  return <p className={state.ok ? "formMessage isOk" : "formMessage isError"}>{state.message}</p>;
}

