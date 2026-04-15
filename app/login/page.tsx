"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      router.replace("/");
    } else {
      setError(data.error ?? "エラーが発生しました");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
            ToDo
          </h1>
          <p className="text-sm text-stone-400 mt-1">ログイン</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-medium text-stone-500"
              htmlFor="username"
            >
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors"
              autoComplete="username"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-medium text-stone-500"
              htmlFor="password"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="mt-1 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 mt-6">
          <p className="text-center text-sm text-stone-400">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-stone-700 font-medium hover:underline">
              新規登録
            </Link>
          </p>
          <Link href="/reset-password" className="text-sm text-stone-400 hover:underline">
            パスワードをお忘れの方
          </Link>
        </div>
      </div>
    </main>
  );
}
