import Link from "next/link";

export default function HomePage() {
  return (
    <main className="publicShell">
      <nav className="publicNav">
        <strong>Uncapped.gg</strong>
        <div>
          <Link href="/login">Owner login</Link>
        </div>
      </nav>
      <section className="hero">
        <h1>The PC sales system for computer shops.</h1>
        <p>
          Launch a hosted shop page, import a live price list from Google Sheets, and collect quote requests without
          building a full ecommerce site first.
        </p>
        <div className="heroActions">
          <Link className="button buttonPrimary" href="/login">
            Start shop setup
          </Link>
        </div>
      </section>
    </main>
  );
}

