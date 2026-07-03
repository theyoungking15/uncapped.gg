import { ShopProfileForm } from "@/components/action-forms";
import { getCurrentShop } from "@/lib/data";

export default async function SettingsPage() {
  const { shop } = await getCurrentShop();

  return (
    <>
      <header className="pageHead">
        <div>
          <h1>Shop profile</h1>
          <p>This creates the hosted public shop page and stores Facebook/Messenger contact links.</p>
        </div>
      </header>
      <section className="panel">
        <ShopProfileForm shop={shop} />
      </section>
    </>
  );
}

