import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Icon } from "@stanforte/shared";

export default function SessionReauthPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950/60 px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(166,200,255,0.25),transparent_40%)]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/70 bg-white p-7 shadow-card">
        <h2 className="font-headline text-2xl font-bold text-primary">Session Expired</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Please confirm your password to continue your work securely.
        </p>

        <div className="mt-5 rounded-2xl bg-surface-container-low px-4 py-3 text-sm">
          <p className="font-semibold text-primary">Marcus Holloway</p>
          <p className="mt-1 text-on-surface-variant">Operations Accountant</p>
        </div>

        {error ? (
          <div role="alert" className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <form
          className="mt-5 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setLoading(true);

            try {
              if (!password) {
                throw new Error("Please enter your password.");
              }
              // Placeholder until real re-auth endpoint is wired
              navigate("/requests", { replace: true });
            } catch (authError) {
              setError(authError instanceof Error ? authError.message : "Unable to continue.");
            } finally {
              setLoading(false);
            }
          }}
        >
          <label className="block">
            <span className="field-label">Password</span>
            <div className="relative">
              <Icon name="lock" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                className="input-base pl-10"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          <Button type="submit" className="w-full justify-center" disabled={loading}>
            {loading ? "Checking..." : "Unlock Session"}
            {!loading ? <Icon name="arrow_forward" className="ml-2 text-[18px]" /> : null}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <button className="font-medium text-secondary hover:text-primary" type="button" onClick={() => navigate(-1)}>
            Go back
          </button>
          <Link className="font-medium text-danger hover:underline" to="/login">
            Sign out
          </Link>
        </div>
      </section>
    </main>
  );
}
