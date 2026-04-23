// ── Default user ──────────────────────────────────────────
const user = { username: "Deep", password: "1234" };

// ── Ripple effect ─────────────────────────────────────────
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".ripple-wrap");
  if (!btn) return;
  const ripple = document.createElement("span");
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.className = "ripple";
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ── Toast ─────────────────────────────────────────────────
function showToast(icon, msg) {
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `<span style="font-size:20px">${icon}</span> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.animation = "toastOut 0.35s ease forwards";
    setTimeout(() => t.remove(), 350);
  }, 2800);
}

// ── LOGIN ─────────────────────────────────────────────────
function login(btn) {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  const errEl = document.getElementById("error");

  if (u === user.username && p === user.password) {
    localStorage.setItem("loggedIn", true);
    if (!localStorage.getItem("balance")) {
      localStorage.setItem("balance", 0);
      localStorage.setItem("transactions", JSON.stringify([]));
    }
    if (btn) btn.innerHTML = "<span>Signing in…</span>";
    setTimeout(() => (window.location.href = "dashboard.html"), 600);
  } else {
    errEl.innerText = "Invalid username or password.";
    errEl.style.animation = "none";
    void errEl.offsetWidth;
    errEl.style.animation = "shake 0.4s ease";
  }
}

// ── LOGOUT ────────────────────────────────────────────────
function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "index.html";
}

// ── SECTION NAV ───────────────────────────────────────────
function showSection(id, navBtn) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (navBtn) navBtn.classList.add("active");
  else {
    const nb = document.getElementById("nav-" + id);
    if (nb) nb.classList.add("active");
  }
  if (id === "history") loadHistory("historyList", false);
  if (id === "home")    { updateStats(); loadRecentHistory(); }
}

// ── FORMAT ────────────────────────────────────────────────
function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// ── UPDATE BALANCE ────────────────────────────────────────
function updateBalance() {
  const el = document.getElementById("balance");
  if (!el) return;
  const bal = parseInt(localStorage.getItem("balance")) || 0;
  el.innerText = fmt(bal);
}

// ── UPDATE STATS ──────────────────────────────────────────
function updateStats() {
  const tx = JSON.parse(localStorage.getItem("transactions") || "[]");
  let deposited = 0, withdrawn = 0;
  tx.forEach(t => {
    if (t.type === "Deposit")            deposited += t.amount;
    if (t.type === "Withdraw" || t.type === "Transfer") withdrawn += t.amount;
  });
  const d = document.getElementById("stat-deposited");
  const w = document.getElementById("stat-withdrawn");
  const c = document.getElementById("stat-txcount");
  if (d) d.innerText = fmt(deposited);
  if (w) w.innerText = fmt(withdrawn);
  if (c) c.innerText = tx.length;
}

// ── ADD TRANSACTION ───────────────────────────────────────
function addTransaction(type, amount, extra = "") {
  const tx = JSON.parse(localStorage.getItem("transactions") || "[]");
  const now = new Date();
  tx.unshift({
    type, amount, extra,
    date: now.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }),
    time: now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })
  });
  localStorage.setItem("transactions", JSON.stringify(tx));
}

// ── DEPOSIT ───────────────────────────────────────────────
function deposit() {
  const amtEl = document.getElementById("depositAmount");
  const amt = parseInt(amtEl.value);
  if (!amt || amt <= 0) { showToast("⚠️", "Please enter a valid amount."); return; }

  let bal = parseInt(localStorage.getItem("balance")) || 0;
  bal += amt;
  localStorage.setItem("balance", bal);
  addTransaction("Deposit", amt);
  updateBalance();
  updateStats();
  amtEl.value = "";
  showToast("✅", `${fmt(amt)} deposited successfully.`);
}

// ── WITHDRAW ──────────────────────────────────────────────
function withdraw() {
  const amtEl = document.getElementById("withdrawAmount");
  const amt = parseInt(amtEl.value);
  if (!amt || amt <= 0) { showToast("⚠️", "Please enter a valid amount."); return; }

  let bal = parseInt(localStorage.getItem("balance")) || 0;
  if (amt > bal) { showToast("🚫", "Insufficient balance."); return; }

  bal -= amt;
  localStorage.setItem("balance", bal);
  addTransaction("Withdraw", amt);
  updateBalance();
  updateStats();
  amtEl.value = "";
  showToast("✅", `${fmt(amt)} withdrawn successfully.`);
}

// ── TRANSFER ──────────────────────────────────────────────
function transfer() {
  const amtEl = document.getElementById("transferAmount");
  const recEl = document.getElementById("receiver");
  const amt = parseInt(amtEl.value);
  const rec = recEl.value.trim();

  if (!rec)             { showToast("⚠️", "Please enter a recipient."); return; }
  if (!amt || amt <= 0) { showToast("⚠️", "Please enter a valid amount."); return; }

  let bal = parseInt(localStorage.getItem("balance")) || 0;
  if (amt > bal) { showToast("🚫", "Insufficient balance."); return; }

  bal -= amt;
  localStorage.setItem("balance", bal);
  addTransaction("Transfer", amt, "To " + rec);
  updateBalance();
  updateStats();
  amtEl.value = "";
  recEl.value = "";
  showToast("✅", `${fmt(amt)} sent to ${rec}.`);
}

// ── ICON MAP ──────────────────────────────────────────────
const TX_META = {
  Deposit:  { icon: "↓", cls: "deposit",  sign: "+" },
  Withdraw: { icon: "↑", cls: "withdraw", sign: "-" },
  Transfer: { icon: "⇄", cls: "transfer", sign: "-" },
};

// ── BUILD TX ITEM ─────────────────────────────────────────
function buildTxItem(t, delay) {
  const m = TX_META[t.type] || { icon: "•", cls: "deposit", sign: "" };
  const li = document.createElement("li");
  li.className = "tx-item";
  li.style.animationDelay = delay + "ms";
  li.innerHTML = `
    <div class="tx-icon-wrap ${m.cls}">${m.icon}</div>
    <div class="tx-details">
      <div class="tx-type">${t.type} ${t.extra ? `<span style="color:var(--text-muted);font-size:12px;font-weight:400;">${t.extra}</span>` : ""}</div>
      <div class="tx-meta">${t.date || "—"} &nbsp;·&nbsp; ${t.time || ""}</div>
    </div>
    <div class="tx-amount ${m.cls}">${m.sign}${fmt(t.amount)}</div>
  `;
  return li;
}

// ── LOAD HISTORY ──────────────────────────────────────────
function loadHistory(listId, limit) {
  const list = document.getElementById(listId);
  if (!list) return;
  const tx = JSON.parse(localStorage.getItem("transactions") || "[]");
  const items = limit ? tx.slice(0, limit) : tx;

  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><div class="emoji">🪙</div><p>No transactions yet. Start by making a deposit!</p></div>`;
    return;
  }
  items.forEach((t, i) => list.appendChild(buildTxItem(t, i * 50)));
}

function loadRecentHistory() {
  loadHistory("recentList", 3);
}

// ── INIT ──────────────────────────────────────────────────
window.onload = function () {
  updateBalance();
  updateStats();
  loadRecentHistory();

  // Enter key on login
  const passEl = document.getElementById("password");
  if (passEl) {
    passEl.addEventListener("keydown", e => {
      if (e.key === "Enter") login();
    });
  }
};
