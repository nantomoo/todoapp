"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SECURITY_QUESTIONS = [
  "子供のころのあだ名は？",
  "ペットの名前は？",
  "母親の旧姓は？",
  "出身地の小学校の名前は？",
  "好きな食べ物は？",
];

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) {
      return "ユーザー名は2〜20文字の英数字・アンダースコアで入力してください";
    }
    if (password.length < 8) {
      return "パスワードは8文字以上で入力してください";
    }
    if (password !== confirm) {
      return "パスワードが一致しません";
    }
    if (!securityAnswer.trim()) {
      return "秘密の質問の答えを入力してください";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);

    const registerRes = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        password,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
      }),
    });
    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      setLoading(false);
      setError(registerData.error ?? "登録に失敗しました");
      return;
    }

    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    setLoading(false);

    if (loginRes.ok) {
      router.replace("/");
    } else {
      router.replace("/login");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
            ToDo
          </h1>
          <p className="text-sm text-stone-400 mt-1">新規アカウント登録</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-500" htmlFor="username">
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
            <p className="text-xs text-stone-400">2〜20文字の英数字・アンダースコア</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-500" htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors"
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-stone-400">8文字以上</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-stone-500" htmlFor="confirm">
              パスワード（確認）
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="border-t border-stone-100 pt-4 flex flex-col gap-4">
            <p className="text-xs font-medium text-stone-500">秘密の質問（パスワードリセット用）</p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-500" htmlFor="securityQuestion">
                質問
              </label>
              <select
                id="securityQuestion"
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors bg-white"
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-stone-500" htmlFor="securityAnswer">
                答え
              </label>
              <input
                id="securityAnswer"
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors"
                required
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password || !confirm || !securityAnswer.trim()}
            className="mt-1 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? "登録中..." : "アカウントを作成"}
          </button>
        </form>

        <p className="text-center text-sm text-stone-400 mt-6">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-stone-700 font-medium hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
