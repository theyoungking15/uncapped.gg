import Link from "next/link";

export function EnvNotice() {
  return (
    <div className="notice">
      <h1>Supabase is not configured</h1>
      <p>Copy `.env.example` to `.env.local`, add the Supabase URL, anon key, and service role key, then run the migration.</p>
    </div>
  );
}

export function EmptyShopNotice() {
  return (
    <div className="notice">
      <h1>Create your shop profile</h1>
      <p>The dashboard is ready, but this account does not have a shop yet.</p>
      <Link className="button buttonPrimary" href="/app/settings">
        Set up shop
      </Link>
    </div>
  );
}

export function QuoteStatusBadge({ status }: { status: string }) {
  return <span className={`statusBadge status-${status}`}>{status}</span>;
}

