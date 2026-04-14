"use client";

import { useState, useRef, useEffect } from "react";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todos";

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTodos(loadTodos());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveTodos(todos);
  }, [todos, mounted]);

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      { id: generateId(), text, completed: false, createdAt: Date.now() },
      ...prev,
    ]);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-start pt-16 pb-24 px-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
          ToDo
        </h1>
        <p className="text-sm text-stone-400 mt-1">タスクを整理しよう</p>
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
        {!mounted ? null : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-300 text-sm animate-fade-in">
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
              className="group flex items-center gap-3 bg-white border border-stone-200 rounded-2xl px-4 py-3.5 shadow-sm hover:shadow-md transition-all animate-slide-in"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  todo.completed
                    ? "bg-emerald-400 border-emerald-400 animate-check-pop"
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

              {/* Text */}
              <span
                className={`flex-1 text-sm leading-relaxed transition-all ${
                  todo.completed
                    ? "line-through text-stone-300"
                    : "text-stone-700"
                }`}
              >
                {todo.text}
              </span>

              {/* Delete button */}
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

      {/* Footer: clear completed */}
      {completedCount > 0 && (
        <div className="w-full max-w-lg mt-4 flex justify-end animate-fade-in">
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
