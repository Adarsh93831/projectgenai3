import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";

import { useAuthStore } from "../store/auth.store.js";

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form);
      navigate("/");
    } catch (submitError) {
      setError(submitError?.response?.data?.message || "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <section className="glass slide-up relative w-full max-w-md overflow-hidden rounded-[28px] p-7 shadow-[0_28px_80px_rgba(31,47,38,0.24)] sm:p-8">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />

        <div className="relative z-10">
          <p className="inline-flex rounded-full border border-[var(--line)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            PDF Query AI
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Sign in to continue chatting with your document workspace.
          </p>

          <form className="stagger mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span className="mb-1.5 inline-block font-medium text-[var(--text-muted)]">Email</span>
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/65 px-3">
                <Mail size={16} className="text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-muted)]/80"
                  placeholder="you@company.com"
                />
              </div>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 inline-block font-medium text-[var(--text-muted)]">Password</span>
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white/65 px-3">
                <LockKeyhole size={16} className="text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-muted)]/80"
                  placeholder="••••••••"
                />
              </div>
            </label>

            {error ? (
              <p className="rounded-2xl border border-red-300/60 bg-red-100/60 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-ink)] transition hover:translate-y-[-1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            New here?{" "}
            <Link to="/register" className="font-semibold text-[var(--accent)] underline decoration-transparent transition hover:decoration-[var(--accent)]">
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
