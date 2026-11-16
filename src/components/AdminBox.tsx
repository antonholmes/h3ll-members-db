import { useState, type FormEvent } from "react";

type Props = { admin: boolean; onLogin: () => void; onLogout: () => void };

const field =
  "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm outline-none focus:border-red-500";

export default function AdminBox({ admin, onLogin, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      if (res.ok) {
        setPassword("");
        setOpen(false);
        onLogin();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Login failed");
      }
    } catch {
      setError("Could not reach the server");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    onLogout();
  }

  if (admin) {
    return (
      <div className="mt-2 flex justify-end gap-2 text-xs text-zinc-500">
        <span>Signed in as admin</span>
        <button className="underline hover:text-zinc-200" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 text-right text-xs">
      <button
        className="text-zinc-500 underline hover:text-zinc-200"
        onClick={() => setOpen((o) => !o)}
      >
        Admin login
      </button>
      {open && (
        <form
          onSubmit={submit}
          className="mt-2 space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-left"
        >
          <input
            className={field}
            placeholder="Username"
            autoComplete="username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            className={field}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={busy || !user || !password}
            className="w-full rounded-md bg-red-600 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}
    </div>
  );
}
