import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, Icon } from "@stanforte/shared";
import { authApi } from "@/lib/core";
import brandLogo from "../../../../../shared/assets/brand/stanforte-logo.png";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const urlToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [token, setToken] = useState(urlToken);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 py-12">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-primary-fixed/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-secondary-fixed/40 blur-3xl" />

      <section className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-card backdrop-blur-xl lg:grid-cols-[1fr_1.1fr]">
        <aside className="hidden bg-primary-fixed p-10 text-primary lg:block">
          <img src={brandLogo} alt="Stanforte Edge" className="h-11 w-auto object-contain" />
          <h1 className="mt-8 font-headline text-5xl font-bold tracking-tight leading-tight">
            Activate your staff portal account
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-on-surface-variant">
            Finish your account setup and gain secure access to requests, attendance, and team workflows.
          </p>
        </aside>

        <div className="p-8 md:p-10">
          <h2 className="font-headline text-2xl font-semibold text-primary">Activate Account</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Complete your profile setup to continue.</p>

          {error ? (
            <div role="alert" className="mt-5 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}
          {success ? (
            <div role="status" aria-live="polite" className="mt-5 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              {success}
            </div>
          ) : null}

          <form
            className="mt-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              setSuccess(null);

              if (!token) {
                setError("Invitation token is required.");
                return;
              }

              if (!firstName.trim() || !lastName.trim()) {
                setError("First name and last name are required.");
                return;
              }

              if (password.length < 8) {
                setError("Password must be at least 8 characters.");
                return;
              }

              setLoading(true);
              try {
                await authApi.acceptInvite({
                  token: token.trim(),
                  first_name: firstName.trim(),
                  last_name: lastName.trim(),
                  password,
                });
                setSuccess("Account activated. You can now sign in.");
              } catch (requestError) {
                setError(requestError instanceof Error ? requestError.message : "Unable to accept invitation.");
              } finally {
                setLoading(false);
              }
            }}
            noValidate
          >
            <label className="block">
              <span className="field-label">Invitation Token</span>
              <input
                className="input-base"
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste invitation token"
              />
            </label>
            <label className="block">
              <span className="field-label">First Name</span>
              <input
                className="input-base"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Enter your first name"
              />
            </label>
            <label className="block">
              <span className="field-label">Last Name</span>
              <input
                className="input-base"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Enter your last name"
              />
            </label>
            <label className="block">
              <span className="field-label">Password</span>
              <input
                className="input-base"
                autoComplete="new-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a strong password"
              />
            </label>

            <label className="flex items-start gap-3 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              <input type="checkbox" className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary/20" required />
              <span>I agree to the staff portal security and acceptable use policy.</span>
            </label>

            <Button type="submit" className="w-full justify-center py-4 text-base" disabled={loading}>
              <span>{loading ? "Activating..." : "Activate Account"}</span>
              {!loading ? <Icon name="arrow_forward" className="ml-2 text-[18px]" /> : null}
            </Button>
          </form>

          <div className="mt-5 text-sm text-slate-500">
            <Link className="font-semibold text-brand-900" to="/login">
              Already have access? Sign in
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
