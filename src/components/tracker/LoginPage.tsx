import { LockKeyhole, Mail, TrainFront } from "lucide-react";
import { useState } from "react";

export function LoginPage({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<boolean>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const valid = await onLogin(email, password);
    setSubmitting(false);
    if (!valid) setError("The email or password is incorrect.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrainFront className="size-6" aria-hidden />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Workforce operations
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Platform Workforce</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage railway station workforce records.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Use your assigned Admin or Supervisor account.</p>

          <label className="mt-5 block">
            <span className="mb-1 block text-xs font-semibold">Email</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@platformworkforce.in"
                className="min-h-11 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm"
              />
            </span>
          </label>

          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-semibold">Password</span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="min-h-11 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm"
              />
            </span>
          </label>

          {error && <p className="mt-3 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 min-h-11 w-full rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Preview accounts</p>
          <p className="mt-2">Admin: admin@platformworkforce.in · Admin@123</p>
          <p className="mt-1">Supervisor: supervisor@platformworkforce.in · Supervisor@123</p>
        </div>
      </div>
    </main>
  );
}