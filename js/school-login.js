/**
 * 卒業生・関係者認証（在学時氏名 + 生年月日）
 * サーバー側 Cookie セッションと連携（個人情報を含む PDF の直URL防止）
 */
(function () {
  var SESSION_KEY = "kn_graduate_auth_v1";
  var YEAR_MIN = 2013;
  var YEAR_MAX = 2019;
  var API_LOGIN = "/api/auth/login";
  var API_LOGOUT = "/api/auth/logout";
  var API_SESSION = "/api/auth/session";

  function normalizeName(s) {
    return (s || "")
      .replace(/\s+/g, "")
      .replace(/　/g, "")
      .toLowerCase();
  }

  function isLoggedIn() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function notifyAuthChange() {
    document.dispatchEvent(new CustomEvent("kn-graduate-auth-changed"));
  }

  function setLoggedIn() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {}
    document.documentElement.classList.remove("staff-prelock", "graduate-prelock");
    document.body.classList.add("graduate-logged-in");
    notifyAuthChange();
    applyYearFilter();
  }

  function clearLoggedIn() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
    document.body.classList.remove("graduate-logged-in");
    notifyAuthChange();
    applyYearFilter();
  }

  function isProtectedPdfHref(href) {
    if (!href || href === "#") return false;
    try {
      var u = new URL(href, window.location.origin);
      var path = u.pathname;
      if (/^\/assets\/time-capsule[^/]*\.pdf$/i.test(path)) return true;
      var m = path.match(/\/assets\/pdf\/([^/]+\.pdf)$/i);
      if (!m) return false;
      return !m[1].toLowerCase().startsWith("notice-");
    } catch (e) {
      return /\.pdf($|\?)/i.test(href) && !/notice-/i.test(href);
    }
  }

  function applyYearFilter() {
    var logged = isLoggedIn();
    document.querySelectorAll("[data-year]").forEach(function (el) {
      var y = parseInt(el.getAttribute("data-year"), 10);
      if (isNaN(y)) return;
      if (logged) {
        if (y >= YEAR_MIN && y <= YEAR_MAX) {
          el.classList.remove("is-hidden-year", "is-gated");
        } else {
          el.classList.add("is-hidden-year");
        }
      } else {
        if (y >= YEAR_MIN && y <= YEAR_MAX) {
          el.classList.add("is-hidden-year");
        } else {
          el.classList.remove("is-hidden-year");
        }
      }
    });
    document.querySelectorAll("[data-requires-graduate], [data-require-pdf], [data-login-gate]").forEach(function (el) {
      if (logged) el.classList.remove("is-gated");
      else el.classList.add("is-gated");
    });
  }

  function isPdfGateTarget(el) {
    if (!el || el.tagName !== "A") return false;
    if (
      el.hasAttribute("data-requires-graduate") ||
      el.hasAttribute("data-require-pdf") ||
      el.hasAttribute("data-login-gate")
    )
      return true;
    if (el.closest(".pdf-issue-row")) return true;
    var href = el.getAttribute("href") || "";
    if (el.closest(".sgn-notice-list") && isProtectedPdfHref(href)) return true;
    return isProtectedPdfHref(href);
  }

  function ensureModal() {
    var el = document.getElementById("school-login-overlay");
    if (el) return el;

    el = document.createElement("div");
    el.id = "school-login-overlay";
    el.className = "login-overlay";
    el.hidden = true;
    el.innerHTML =
      '<div class="login-dialog" role="dialog" aria-labelledby="login-title" aria-modal="true">' +
      '<div class="login-dialog-header" id="login-title">閲覧には認証が必要です</div>' +
      '<p class="login-dialog-note">個人情報を含む資料です。関係者の方は在学時の氏名と生年月日を入力してください。認証後、一定時間はセッションで閲覧できます。</p>' +
      '<div class="login-dialog-body">' +
      '<div class="login-field"><label for="login-user">氏名（在学時）</label>' +
      '<input id="login-user" type="text" autocomplete="username" /></div>' +
      '<div class="login-field"><label for="login-pass">生年月日</label>' +
      '<input id="login-pass" type="password" autocomplete="current-password" placeholder="例: 20060412" /></div>' +
      "</div>" +
      '<p class="login-error" id="login-error" aria-live="polite"></p>' +
      '<div class="login-dialog-actions">' +
      '<button type="button" class="login-btn-primary" id="login-submit">ログイン</button>' +
      '<button type="button" class="login-btn-cancel" id="login-cancel">キャンセル</button>' +
      "</div></div>";
    document.body.appendChild(el);

    el.querySelector("#login-cancel").addEventListener("click", function () {
      el.hidden = true;
      pendingPdfHref = null;
    });
    el.querySelector("#login-submit").addEventListener("click", tryLogin);
    el.addEventListener("click", function (e) {
      if (e.target === el) {
        el.hidden = true;
        pendingPdfHref = null;
      }
    });
    document.getElementById("login-pass").addEventListener("keydown", function (e) {
      if (e.key === "Enter") tryLogin();
    });
    return el;
  }

  var pendingPdfHref = null;

  function showModal(pdfHref) {
    var overlay = ensureModal();
    pendingPdfHref = pdfHref || null;
    document.getElementById("login-error").textContent = "";
    document.getElementById("login-user").value = "";
    document.getElementById("login-pass").value = "";
    overlay.hidden = false;
    document.getElementById("login-user").focus();
  }

  function openPendingPdf() {
    if (pendingPdfHref && pendingPdfHref !== "#" && !/^javascript:/i.test(pendingPdfHref)) {
      window.open(pendingPdfHref, "_blank", "noopener,noreferrer");
    }
    pendingPdfHref = null;
  }

  function tryLogin() {
    var user = (document.getElementById("login-user").value || "").trim();
    var pass = document.getElementById("login-pass").value || "";
    var err = document.getElementById("login-error");
    err.textContent = "認証しています…";

    fetch(API_LOGIN, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: user, birth: pass }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok && data && data.ok, status: res.status };
        });
      })
      .then(function (result) {
        if (result.ok) {
          setLoggedIn();
          document.getElementById("school-login-overlay").hidden = true;
          openPendingPdf();
          return;
        }
        err.textContent = "認証に失敗しました。入力内容をご確認ください。";
      })
      .catch(function () {
        err.textContent =
          "認証サーバーに接続できません。Vercel 上で閲覧するか、vercel dev でローカル確認してください。";
      });
  }

  function syncSessionFromServer() {
    return fetch(API_SESSION, { credentials: "same-origin", cache: "no-store" })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data && data.ok) setLoggedIn();
        else clearLoggedIn();
      })
      .catch(function () {
        /* 静的ファイルのみの環境では Cookie API なし — UI は未ログインのまま */
        clearLoggedIn();
      });
  }

  function logout() {
    return fetch(API_LOGOUT, { method: "POST", credentials: "same-origin" })
      .then(function () {
        clearLoggedIn();
      })
      .catch(function () {
        clearLoggedIn();
      });
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (!link || !isPdfGateTarget(link)) return;
    if (isLoggedIn()) return;
    e.preventDefault();
    e.stopPropagation();
    var href = link.getAttribute("href") || link.href;
    showModal(href || null);
  });

  function guardGraduateOnlyPage() {
    if (!document.body.hasAttribute("data-graduate-page")) return;
    if (isLoggedIn()) {
      document.documentElement.classList.remove("graduate-prelock");
      return;
    }
    document.documentElement.classList.add("graduate-prelock");
    showModal(null);
  }

  function checkAuthQuery() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("auth") === "required" && !isLoggedIn()) {
        showModal(null);
      }
    } catch (e) {}
  }

  window.KnSchoolLogin = {
    isLoggedIn: isLoggedIn,
    showModal: showModal,
    setLoggedIn: setLoggedIn,
    clearLoggedIn: clearLoggedIn,
    logout: logout,
    syncSessionFromServer: syncSessionFromServer,
    applyYearFilter: applyYearFilter,
    isProtectedPdfHref: isProtectedPdfHref,
    YEAR_MIN: YEAR_MIN,
    YEAR_MAX: YEAR_MAX,
  };

  function onReady() {
    syncSessionFromServer().finally(function () {
      guardGraduateOnlyPage();
      checkAuthQuery();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
