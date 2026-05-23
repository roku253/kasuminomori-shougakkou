/**
 * 卒業生・関係者認証（在学時氏名 + 生年月日）
 * GitHub Pages: sessionStorage + 表／裏 HTML の切り分け（裏のみ PDF・カタログ）
 */
(function () {
  var SESSION_KEY = "kn_graduate_auth_v1";
  var YEAR_MIN = 2013;
  var YEAR_MAX = 2019;

  var VALID_NAMES = [
    "佐藤ユウ",
    "佐藤 ユウ",
    "さとうゆう",
    "サトウユウ",
    "satouyuu",
    "sato yuu",
  ];
  var VALID_BIRTHS = ["20060412", "2006/04/12", "2006-04-12", "2006.4.12"];

  function normalizeName(s) {
    return (s || "")
      .replace(/\s+/g, "")
      .replace(/　/g, "")
      .toLowerCase();
  }

  function normalizeBirth(s) {
    return (s || "").replace(/[^\d]/g, "");
  }

  function portalTier() {
    return document.body.getAttribute("data-portal-tier") || "default";
  }

  function joinBase(path) {
    var base = document.body.getAttribute("data-sgn-base") || "/";
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base + path;
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

  function credentialsOk(user, pass) {
    var n = normalizeName(user);
    var b = normalizeBirth(pass);
    return (
      VALID_NAMES.some(function (v) {
        return normalizeName(v) === n;
      }) &&
      VALID_BIRTHS.some(function (v) {
        return normalizeBirth(v) === b;
      })
    );
  }

  function hubUrl() {
    var cfg = window.KnPortalConfig;
    return joinBase(cfg ? cfg.HUB : "portal/kn-hub.html");
  }

  function gateUrl() {
    var cfg = window.KnPortalConfig;
    return joinBase(cfg ? cfg.GATE : "portal/kn-gate.html");
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
    if (portalTier() === "public" || portalTier() === "gate") return false;
    if (!el || el.tagName !== "A") return false;
    if (
      el.hasAttribute("data-requires-graduate") ||
      el.hasAttribute("data-require-pdf") ||
      el.hasAttribute("data-login-gate")
    )
      return true;
    if (el.closest(".pdf-issue-row")) return true;
    return false;
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
      '<p class="login-dialog-note">個人情報を含む資料です。卒業生の方は在学時の氏名と生年月日を入力してください。</p>' +
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
    el.querySelector("#login-submit").addEventListener("click", tryModalLogin);
    el.addEventListener("click", function (e) {
      if (e.target === el) {
        el.hidden = true;
        pendingPdfHref = null;
      }
    });
    document.getElementById("login-pass").addEventListener("keydown", function (e) {
      if (e.key === "Enter") tryModalLogin();
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

  function tryModalLogin() {
    var user = (document.getElementById("login-user").value || "").trim();
    var pass = document.getElementById("login-pass").value || "";
    var err = document.getElementById("login-error");
    if (credentialsOk(user, pass)) {
      setLoggedIn();
      document.getElementById("school-login-overlay").hidden = true;
      openPendingPdf();
      return;
    }
    err.textContent = "認証に失敗しました。入力内容をご確認ください。";
  }

  function initGatePage() {
    var form = document.getElementById("kn-gate-form");
    if (!form) return;
    var err = document.getElementById("kn-gate-error");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var user = (document.getElementById("kn-gate-user").value || "").trim();
      var pass = document.getElementById("kn-gate-pass").value || "";
      if (credentialsOk(user, pass)) {
        setLoggedIn();
        location.href = hubUrl();
        return;
      }
      if (err) err.textContent = "認証に失敗しました。入力内容をご確認ください。";
    });
    if (isLoggedIn()) {
      location.replace(hubUrl());
    }
  }

  document.addEventListener("click", function (e) {
    var tier = portalTier();
    if (tier === "public" || tier === "gate" || tier === "hub") return;
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
    location.replace(gateUrl());
  }

  window.KnSchoolLogin = {
    isLoggedIn: isLoggedIn,
    showModal: showModal,
    setLoggedIn: setLoggedIn,
    clearLoggedIn: clearLoggedIn,
    applyYearFilter: applyYearFilter,
    hubUrl: hubUrl,
    gateUrl: gateUrl,
    YEAR_MIN: YEAR_MIN,
    YEAR_MAX: YEAR_MAX,
  };

  function onReady() {
    var tier = portalTier();
    if (tier === "gate") {
      initGatePage();
      return;
    }
    if (isLoggedIn()) {
      document.documentElement.classList.remove("graduate-prelock");
      document.body.classList.add("graduate-logged-in");
    }
    applyYearFilter();
    if (tier === "back") {
      guardGraduateOnlyPage();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
