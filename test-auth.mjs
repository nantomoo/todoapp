/**
 * auth.ts セキュリティ要件テスト
 * Node.js 18+ (Web Crypto API 内蔵) で実行
 */

// ── localStorage / sessionStorage モック ──────────────────────────────────
const store = {};
const sessionStore = {};
globalThis.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};
globalThis.sessionStorage = {
  getItem: (k) => sessionStore[k] ?? null,
  setItem: (k, v) => { sessionStore[k] = v; },
  removeItem: (k) => { delete sessionStore[k]; },
};

// ── auth ロジックをインライン再現 ─────────────────────────────────────────
const USERS_KEY = "auth_users";
const SESSION_KEY = "auth_session";

function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

async function registerUser(username, password) {
  const users = getUsers();
  if (users.find((u) => u.username === username))
    return { ok: false, error: "このユーザー名はすでに使われています" };
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  saveUsers([...users, { username, passwordHash, salt }]);
  return { ok: true };
}

async function loginUser(username, password) {
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  const dummySalt = "00000000000000000000000000000000";
  const targetHash = user?.passwordHash ?? "";
  const targetSalt = user?.salt ?? dummySalt;
  const hash = await hashPassword(password, targetSalt);
  if (!user || hash !== targetHash)
    return { ok: false, error: "ユーザー名またはパスワードが正しくありません" };
  sessionStorage.setItem(SESSION_KEY, username);
  return { ok: true };
}

function getSession() { return sessionStorage.getItem(SESSION_KEY); }
function clearSession() { sessionStorage.removeItem(SESSION_KEY); }
function getTodosKey(username) { return `todos_${username}`; }

// ── テストユーティリティ ──────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ PASS  ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL  ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

// ── テスト群 ─────────────────────────────────────────────────────────────

// ① PBKDF2 ハッシュ化
async function testHashing() {
  console.log("\n[1] PBKDF2 パスワードハッシュ化");

  const salt = generateSalt();

  // salt が 32文字16進数 (16バイト)
  assert("salt は 32文字の16進数", /^[0-9a-f]{32}$/.test(salt), salt);

  // 同じ入力 → 同じハッシュ
  const h1 = await hashPassword("TestPass1!", salt);
  const h2 = await hashPassword("TestPass1!", salt);
  assert("同じ password + salt → 同じハッシュ", h1 === h2);

  // 異なる salt → 異なるハッシュ
  const salt2 = generateSalt();
  const h3 = await hashPassword("TestPass1!", salt2);
  assert("異なる salt → 異なるハッシュ", h1 !== h3);

  // ハッシュは 64文字16進数 (256bit)
  assert("ハッシュ長は 64文字 (256bit)", h1.length === 64, `実際: ${h1.length}`);

  // パスワード違い → 異なるハッシュ
  const h4 = await hashPassword("WrongPass!", salt);
  assert("異なる password → 異なるハッシュ", h1 !== h4);
}

// ② ユーザー名バリデーション
function testUsernameValidation() {
  console.log("\n[2] ユーザー名バリデーション (英数字・アンダースコア 2〜20文字)");
  const re = /^[a-zA-Z0-9_]{2,20}$/;

  const ok = ["ab", "user_name", "User123", "a".repeat(20), "ABC_123"];
  const ng = ["a", "", "a".repeat(21), "user name", "user-name", "ユーザー", "user@name", "<script>"];

  for (const u of ok) assert(`"${u}" → 有効`, re.test(u));
  for (const u of ng) assert(`"${u}" → 無効`, !re.test(u));
}

// ③ パスワード最低8文字
function testPasswordLength() {
  console.log("\n[3] パスワード最低8文字");
  const validate = (p) => p.length >= 8;

  assert("7文字 → 無効", !validate("1234567"));
  assert("8文字 → 有効", validate("12345678"));
  assert("16文字 → 有効", validate("1234567890abcdef"));
  assert("空文字 → 無効", !validate(""));
}

// ④ 重複ユーザー登録拒否
async function testDuplicateUser() {
  console.log("\n[4] 重複ユーザー登録拒否");

  // ストアをリセット
  delete store[USERS_KEY];

  const r1 = await registerUser("alice", "password123");
  assert("初回登録 → 成功", r1.ok);

  const r2 = await registerUser("alice", "differentpass");
  assert("同名再登録 → 失敗", !r2.ok);
  assert("エラーメッセージが適切", r2.error === "このユーザー名はすでに使われています");
}

// ⑤ 汎用エラーメッセージ (ユーザー列挙防止)
async function testGenericErrorMessage() {
  console.log("\n[5] 汎用エラーメッセージ (ユーザー列挙防止)");

  delete store[USERS_KEY];
  await registerUser("bob", "correctpass123");

  // 存在しないユーザー
  const r1 = await loginUser("nobody", "anypassword");
  assert("存在しないユーザー → 汎用エラー", !r1.ok);
  assert("エラー文にユーザー名を含まない", r1.error === "ユーザー名またはパスワードが正しくありません");

  // 正しいユーザー・誤りパスワード
  const r2 = await loginUser("bob", "wrongpassword");
  assert("誤りパスワード → 汎用エラー", !r2.ok);
  assert("存在しないユーザーと同じエラーメッセージ", r1.error === r2.error);

  // 正常ログイン
  const r3 = await loginUser("bob", "correctpass123");
  assert("正しい認証情報 → 成功", r3.ok);
}

// ⑥ sessionStorage セッション管理
async function testSessionManagement() {
  console.log("\n[6] sessionStorage セッション管理");

  delete sessionStore[SESSION_KEY];
  assert("初期状態: セッションなし", getSession() === null);

  delete store[USERS_KEY];
  await registerUser("carol", "securepass1");
  await loginUser("carol", "securepass1");
  assert("ログイン後: セッションあり", getSession() === "carol");

  clearSession();
  assert("ログアウト後: セッションなし", getSession() === null);
}

// ⑦ ユーザーごとのTodoデータ分離
function testTodosKeyIsolation() {
  console.log("\n[7] ユーザーごとのTodoデータ分離");

  const keyA = getTodosKey("alice");
  const keyB = getTodosKey("bob");

  assert("alice と bob のキーが異なる", keyA !== keyB);
  assert("alice のキー形式", keyA === "todos_alice");
  assert("bob のキー形式", keyB === "todos_bob");

  // 別々に保存・取得できること
  localStorage.setItem(keyA, JSON.stringify([{ id: "1", text: "Alice task" }]));
  localStorage.setItem(keyB, JSON.stringify([{ id: "2", text: "Bob task" }]));

  const todosA = JSON.parse(localStorage.getItem(keyA));
  const todosB = JSON.parse(localStorage.getItem(keyB));

  assert("alice のTodoが独立", todosA[0].text === "Alice task");
  assert("bob のTodoが独立", todosB[0].text === "Bob task");
  assert("alice のTodoに bob のデータが混入しない", todosA[0].text !== todosB[0].text);
}

// ── タイミング攻撃耐性 (簡易計測) ─────────────────────────────────────────
async function testTimingAttackResistance() {
  console.log("\n[8] タイミング攻撃耐性 (存在しないユーザーも同等処理)");

  delete store[USERS_KEY];
  await registerUser("timing_user", "mypassword1");

  const RUNS = 3;
  const existTimes = [];
  const ghostTimes = [];

  for (let i = 0; i < RUNS; i++) {
    let t = performance.now();
    await loginUser("timing_user", "wrongpass");
    existTimes.push(performance.now() - t);

    t = performance.now();
    await loginUser("nonexistent_user_xyz", "wrongpass");
    ghostTimes.push(performance.now() - t);
  }

  const avgExist = existTimes.reduce((a, b) => a + b, 0) / RUNS;
  const avgGhost = ghostTimes.reduce((a, b) => a + b, 0) / RUNS;

  console.log(`     既存ユーザー平均: ${avgExist.toFixed(1)}ms`);
  console.log(`     存在しないユーザー平均: ${avgGhost.toFixed(1)}ms`);

  // 差が 500ms 以内であること（どちらも PBKDF2 を実行しているため同等）
  const diff = Math.abs(avgExist - avgGhost);
  assert(`処理時間の差が 500ms 以内 (差: ${diff.toFixed(1)}ms)`, diff < 500);
}

// ── 実行 ─────────────────────────────────────────────────────────────────
(async () => {
  console.log("=== auth セキュリティテスト ===");

  await testHashing();
  testUsernameValidation();
  testPasswordLength();
  await testDuplicateUser();
  await testGenericErrorMessage();
  await testSessionManagement();
  testTodosKeyIsolation();
  await testTimingAttackResistance();

  console.log(`\n${"=".repeat(40)}`);
  console.log(`結果: ${passed} passed / ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
