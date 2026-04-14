const USERS_KEY = "auth_users";
const SESSION_KEY = "auth_session";

export type UserRecord = {
  username: string;
  passwordHash: string;
  salt: string;
};

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function getUsers(): UserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerUser(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const users = getUsers();
  if (users.find((u) => u.username === username)) {
    return { ok: false, error: "このユーザー名はすでに使われています" };
  }
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  saveUsers([...users, { username, passwordHash, salt }]);
  return { ok: true };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  // ユーザーが存在しない場合も同じ処理を行い、タイミング攻撃を防ぐ
  const dummySalt = "00000000000000000000000000000000";
  const targetHash = user?.passwordHash ?? "";
  const targetSalt = user?.salt ?? dummySalt;
  const hash = await hashPassword(password, targetSalt);
  if (!user || hash !== targetHash) {
    return {
      ok: false,
      error: "ユーザー名またはパスワードが正しくありません",
    };
  }
  setSession(username);
  return { ok: true };
}

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function setSession(username: string) {
  sessionStorage.setItem(SESSION_KEY, username);
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getTodosKey(username: string): string {
  return `todos_${username}`;
}
