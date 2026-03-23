// script.js — Whisper Wall Frontend Logic

// ─── Config ───────────────────────────────────────────────
const API_BASE = "https://whisperwall-81ls.onrender.com";

// Auto-refresh every 30 seconds
const REFRESH_INTERVAL = 30000;

// Anti-spam: minimum seconds between posts
const SPAM_DELAY = 10000;

// ─── State ────────────────────────────────────────────────
let activeCategory = "All";
let searchQuery = "";
let lastPostTime = 0;
let selectedCategory = "Other"; // for post form
let likedIds = JSON.parse(localStorage.getItem("likedIds") || "[]");

// ─── Utility: Time Ago ────────────────────────────────────
/**
 * Converts a date string to a human-readable "time ago" format
 * e.g. "5 minutes ago", "2 hours ago"
 */
function timeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60)  return "just now";
  if (diffMin < 60)  return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHr < 24)   return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  if (diffDay < 30)  return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  return past.toLocaleDateString();
}

// ─── Utility: Show Toast ──────────────────────────────────
/**
 * Shows a brief toast notification at the bottom of the page
 */
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = "toast"; }, 3000);
}

// ─── Create Confession Card HTML ──────────────────────────
/**
 * Builds and returns a DOM element for a confession card
 */
function createCard(confession) {
  const card = document.createElement("div");
  card.className = "confession-card";
  card.dataset.id = confession._id;

  const isLiked = likedIds.includes(confession._id);

  card.innerHTML = `
    <div class="card-category">${confession.category || "Other"}</div>
    <p class="card-text">${escapeHtml(confession.text)}</p>
    <div class="card-footer">
      <span class="card-time">${timeAgo(confession.createdAt)}</span>
      <button 
        class="like-btn ${isLiked ? "liked" : ""}" 
        onclick="handleLike('${confession._id}', this)"
        ${isLiked ? 'title="Already liked"' : 'title="Like this confession"'}
      >
        ❤ <span class="like-count">${confession.likes}</span>
      </button>
    </div>
  `;

  return card;
}

// ─── Escape HTML (security) ───────────────────────────────
/**
 * Prevents XSS by escaping special HTML characters
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// ─── Fetch & Render All Confessions ──────────────────────
/**
 * Fetches confessions from the backend and renders them
 */
async function loadConfessions() {
  const grid = document.getElementById("confessionsGrid");
  const emptyState = document.getElementById("emptyState");
  if (!grid) return;

  try {
    // Build query string for search + category filter
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (activeCategory !== "All") params.append("category", activeCategory);

    const res = await fetch(`${API_BASE}?${params.toString()}`);
    const data = await res.json();

    grid.innerHTML = ""; // Clear previous cards

    if (!data.success || data.data.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // Create and append cards
    data.data.forEach((confession, i) => {
      const card = createCard(confession);
      // Staggered animation delay
      card.style.animationDelay = `${i * 0.06}s`;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading confessions:", err);
    grid.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1;">Could not load confessions. Is the server running?</p>`;
  }
}

// ─── Fetch & Render Top Confessions ──────────────────────
/**
 * Fetches the most-liked confessions and renders them
 */
async function loadTopConfessions() {
  const topList = document.getElementById("topList");
  if (!topList) return;

  try {
    const res = await fetch(`${API_BASE}/top`);
    const data = await res.json();

    topList.innerHTML = "";

    if (!data.success || data.data.length === 0) {
      topList.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No confessions yet — be the first!</p>`;
      return;
    }

    data.data.forEach((c, i) => {
      const item = document.createElement("div");
      item.className = "top-item";
      item.innerHTML = `
        <span class="top-rank">${String(i + 1).padStart(2, "0")}</span>
        <span class="top-text">${escapeHtml(c.text)}</span>
        <span class="top-likes">❤ ${c.likes}</span>
      `;
      topList.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading top confessions:", err);
  }
}

// ─── Handle Like ──────────────────────────────────────────
/**
 * Sends a PUT request to like a confession and updates the UI
 */
async function handleLike(id, btn) {
  // Prevent double-liking
  if (likedIds.includes(id)) {
    showToast("You already liked this one!", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/${id}/like`, { method: "PUT" });
    const data = await res.json();

    if (data.success) {
      // Update UI
      const countEl = btn.querySelector(".like-count");
      if (countEl) countEl.textContent = data.data.likes;

      // Mark as liked
      btn.classList.add("liked", "pop");
      btn.title = "Already liked";
      setTimeout(() => btn.classList.remove("pop"), 300);

      // Save liked state
      likedIds.push(id);
      localStorage.setItem("likedIds", JSON.stringify(likedIds));

      // Refresh top list
      loadTopConfessions();
    }
  } catch (err) {
    showToast("Failed to like. Try again.", "error");
  }
}

// ─── Search Input Handler ─────────────────────────────────
function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  let debounceTimer;
  input.addEventListener("input", (e) => {
    // Debounce: wait 400ms after user stops typing
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      loadConfessions();
    }, 400);
  });
}

// ─── Category Filter Handler ──────────────────────────────
function setupCategoryFilter() {
  const filterEl = document.getElementById("categoryFilter");
  if (!filterEl) return;

  filterEl.addEventListener("click", (e) => {
    if (!e.target.classList.contains("pill")) return;

    // Update active pill
    filterEl.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
    e.target.classList.add("active");

    activeCategory = e.target.dataset.cat;
    loadConfessions();
  });
}

// ═══════════════════════════════════════════════════════════
// POST PAGE LOGIC
// ═══════════════════════════════════════════════════════════

// ─── Character Counter ────────────────────────────────────
function setupCharCounter() {
  const textarea = document.getElementById("confessionText");
  const counter = document.getElementById("charCount");
  if (!textarea || !counter) return;

  textarea.addEventListener("input", () => {
    const len = textarea.value.length;
    counter.textContent = len;
    const wrapper = counter.parentElement;
    wrapper.className = "char-counter";
    if (len > 250) wrapper.classList.add("warn");
    if (len > 280) wrapper.classList.add("danger");
  });
}

// ─── Category Select on Post Page ────────────────────────
function setupCategorySelect() {
  const selectEl = document.getElementById("categorySelect");
  if (!selectEl) return;

  selectEl.addEventListener("click", (e) => {
    if (!e.target.classList.contains("pill")) return;
    selectEl.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
    e.target.classList.add("active");
    selectedCategory = e.target.dataset.cat;
  });
}

// ─── Post Form Submission ─────────────────────────────────
function setupPostForm() {
  const submitBtn = document.getElementById("submitBtn");
  const textarea = document.getElementById("confessionText");
  const errorEl = document.getElementById("formError");

  if (!submitBtn) return;

  submitBtn.addEventListener("click", async () => {
    const text = textarea.value.trim();
    errorEl.textContent = "";

    // Validation: check for empty text
    if (!text) {
      errorEl.textContent = "Please write something before posting.";
      return;
    }

    // Validation: check text length
    if (text.length > 300) {
      errorEl.textContent = "Confession is too long (max 300 characters).";
      return;
    }

    // Anti-spam: check time since last post
    const now = Date.now();
    if (now - lastPostTime < SPAM_DELAY) {
      const wait = Math.ceil((SPAM_DELAY - (now - lastPostTime)) / 1000);
      errorEl.textContent = `Please wait ${wait} more second${wait !== 1 ? "s" : ""} before posting again.`;
      return;
    }

    // Disable button while posting
    submitBtn.disabled = true;
    submitBtn.querySelector(".btn-text").textContent = "Posting...";

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category: selectedCategory }),
      });

      const data = await res.json();

      if (data.success) {
        lastPostTime = Date.now();
        showToast("Your confession was posted! ✓", "success");
        textarea.value = "";
        document.getElementById("charCount").textContent = "0";

        // Redirect to feed after 1.5s
        setTimeout(() => { window.location.href = "index.html"; }, 1500);
      } else {
        errorEl.textContent = data.message || "Something went wrong.";
      }
    } catch (err) {
      errorEl.textContent = "Could not connect to server. Is it running?";
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector(".btn-text").textContent = "Post Confession";
    }
  });
}

// ─── Auto-Refresh ─────────────────────────────────────────
function startAutoRefresh() {
  const grid = document.getElementById("confessionsGrid");
  if (!grid) return; // Only on index page

  setInterval(() => {
    loadConfessions();
    loadTopConfessions();
  }, REFRESH_INTERVAL);
}

// ─── Init ─────────────────────────────────────────────────
/**
 * Entry point — runs on page load
 */
document.addEventListener("DOMContentLoaded", () => {
  // Index page setup
  if (document.getElementById("confessionsGrid")) {
    loadConfessions();
    loadTopConfessions();
    setupSearch();
    setupCategoryFilter();
    startAutoRefresh();
  }

  // Post page setup
  if (document.getElementById("submitBtn")) {
    setupCharCounter();
    setupCategorySelect();
    setupPostForm();
  }
});
