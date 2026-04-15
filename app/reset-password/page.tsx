"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "username" | "answer" | "newPassword" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("username");

  const [username, setUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: ユーザー名を送信して秘密の質問を取得
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "ユーザーが見つかりません");
      return;
    }
    setSecurityQuestion(data.securityQuestion);
    setStep("answer");
  };

  // Step 2: 秘密の質問の答えを送信してリセットトークンを取得
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/reset-password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), securityAnswer }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "認証に失敗しました");
      return;
    }
    setResetToken(data.resetToken);
    setStep("newPassword");
  };

  // Step 3: 新しいパスワードを設定
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, newPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "パスワードの更新に失敗しました");
      return;
    }
    setStep("done");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">ToDo</h1>
          <p className="text-sm text-stone-400 mt-1">パスワード再設定</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col gap-4">

          {step === "username" && (
            <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-4">
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
                  required
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "確認中..." : "次へ"}
              </button>
            </form>
          )}

          {step === "answer" && (
            <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-stone-500">秘密の質問</p>
                <p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-3 py-2.5">
                  {securityQuestion}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-stone-500" htmlFor="answer">
                  答え
                </label>
                <input
                  id="answer"
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors"
                  required
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !securityAnswer.trim()}
                className="py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "確認中..." : "次へ"}
              </button>
            </form>
          )}

          {step === "newPassword" && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-stone-500" htmlFor="newPassword">
                  新しいパスワード
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors"
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-stone-400">8文字以上</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-stone-500" htmlFor="confirmPassword">
                  パスワード（確認）
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:border-stone-400 transition-colors"
                  autoComplete="new-password"
                  required
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "更新中..." : "パスワードを更新"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-stone-700">パスワードを更新しました</p>
              <button
                onClick={() => router.replace("/login")}
                className="py-2.5 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 active:scale-95 transition-all"
              >
                ログインへ
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-stone-400 mt-6">
          <Link href="/login" className="text-stone-700 font-medium hover:underline">
            ログインへ戻る
          </Link>
        </p>
      </div>
    </main>
  );
}
