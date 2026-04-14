"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

type Filter = "all" | "active" | "completed";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 認証チェック & Todo 取得
  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.replace("/login");
        return;
      }
      const { username } = await meRes.json();
      setUsername(username);

      const todosRes = await fetch("/api/todos");
      if (todosRes.ok) {
        setTodos(await todosRes.json());
      }
      setMounted(true);
    })();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const addTodo = async () => {
    const text = input.trim();
    if (!text) return;
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const todo = await res.json();
      setTodos((prev) => [todo, ...prev]);
      setInput("");
      inputRef.current?.focus();
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
  };

  const deleteTodo = async (id: string) => {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const clearCompleted = async () => {
    const completed = todos.filter((t) => t.completed);
    await Promise.all(
      completed.map((t) => fetch(`/api/todos/${t.id}`, { method: "DELETE" }))
    );
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  const filterLabels: { key: Filter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "active", label: "未完了" },
    { key: "completed", label: "完了済み" },
  ];

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 pb-24 px-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
            ToDo
          </h1>
          <p className="text-sm text-stone-400 mt-1">タスクを整理しよう</p>
        </div>
        <div className="flex flex-col items-end gap-1 pt-1">
          <span className="text-xs text-stone-500">{username}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-stone-400 hover:text-rose-400 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* Input area */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex gap-2 bg-white rounded-2xl shadow-sm border border-stone-200 p-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="新しいタスクを入力..."
            className="flex-1 px-3 py-2 text-stone-700 placeholder-stone-300 bg-transparent outline-none text-sm"
          />
          <button
            onClick={addTodo}
            disabled={!input.trim()}
            className="px-4 py-2 bg-stone-800 text-white text-sm font-medium rounded-xl hover:bg-stone-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {todos.length > 0 && (
        <div className="w-full max-w-lg mb-4 flex gap-1 bg-stone-100 p-1 rounded-xl">
          {filterLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === key
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {label}
              {key === "active" && activeCount > 0 && (
                <span className="ml-1 text-stone-400">({activeCount})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Todo list */}
      <div className="w-full max-w-lg flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-300 text-sm">
            {filter === "completed"
              ? "完了したタスクはありません"
              : filter === "active"
              ? "未完了のタスクはありません"
              : "タスクを追加してみましょう"}
          </div>
        ) : (
          filtered.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-3 bg-white border border-stone-200 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md transition-all"
            >
              <button
                onClick={() => toggleTodo(todo.id, todo.completed)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  todo.completed
                    ? "bg-emerald-400 border-emerald-400"
                    : "border-stone-300 hover:border-stone-400"
                }`}
                aria-label={todo.completed ? "未完了に戻す" : "完了にする"}
              >
                {todo.completed && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 10 8"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M1 4l2.5 2.5L9 1"
                    />
                  </svg>
                )}
              </button>

              <span
                className={`flex-1 text-sm leading-relaxed transition-all ${
                  todo.completed
                    ? "line-through text-stone-300"
                    : "text-stone-700"
                }`}
              >
                {todo.text}
              </span>

              <button
                onClick={() => deleteTodo(todo.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-stone-100 text-stone-300 hover:text-rose-400 transition-all"
                aria-label="削除"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {completedCount > 0 && (
        <div className="w-full max-w-lg mt-4 flex justify-end">
          <button
            onClick={clearCompleted}
            className="text-xs text-stone-400 hover:text-rose-400 transition-colors"
          >
            完了済みを削除 ({completedCount})
          </button>
        </div>
      )}
    </main>
  );
}
