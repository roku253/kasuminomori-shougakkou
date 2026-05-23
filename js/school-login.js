
(function () {
  var SESSION_KEY = "kn_graduate_auth_v1";
  var YEAR_MIN = 2017;
  var YEAR_MAX = 2026;

  var CREDENTIAL_HASHES = [
    "8e7c3101e9d2c5335f0b4649649744d40da8488c101b4ca43aaec6cb535071b5",
    "2742060bc4cafe8c2ba0c3286f59adce5a9b57d6aacd56f4ca306e6e34e2a8dc",
    "6b8f529a2e4fb57dd51af07f51567689fb1331ee2a045aab06021b882b538219",
    "61040bdc7fb80b8c1a771e69a29270a568495230b6d7ddfb3e53838aa26d3a82",
    "7d21881db9e4f20451882aca7f89b4d1facebd8779bc0ced1969e8ce613ee8b9",
  ];

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

  function sha256Hex(str) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      return Promise.resolve("");
    }
    var data = new TextEncoder().encode(str);
    return window.crypto.subtle.digest("SHA-256", data).then(function (buf) {
      var arr = new Uint8Array(buf);
      var hex = "";
      for (var i = 0; i < arr.length; i++) {
        hex += arr[i].toString(16).padStart(2, "0");
      }
      return hex;
    });
  }

  function credentialsOk(user, pass) {
    var payload = normalizeName(user) + "|" + normalizeBirth(pass);
    return sha256Hex(payload).then(function (hex) {
      if (!hex) return false;
      return CREDENTIAL_HASHES.indexOf(hex) !== -1;
    });
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
      if (y < YEAR_MIN || y > YEAR_MAX) {
        el.classList.add("is-hidden-year");
      } else {
        el.classList.remove("is-hidden-year");
      }
    });
    document.querySelectorAll("[data-requires-graduate], [data-require-pdf], [data-login-gate]").forEach(function (el) {
      if (logged) el.classList.remove("is-gated");
      else el.classList.add("is-gated");
    });
  }

  function isPdfGateTarget(el) {
    if (portalTier() === "gate" || portalTier() === "hub") return false;
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
      '<p class="login-dialog-note">個人情報を含む資料です。認証の入力方法は<a href="' +
      joinBase("contact/index.html") +
      '">お問い合わせ</a>のよくあるご質問をご覧ください。</p>' +
      '<div class="login-dialog-body">' +
      '<div class="login-field"><label for="login-user">ログインID</label>' +
      '<input id="login-user" type="text" autocomplete="username" /></div>' +
      '<div class="login-field"><label for="login-pass">パスワード</label>' +
      '<input id="login-pass" type="password" autocomplete="current-password" /></div>' +
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
    credentialsOk(user, pass).then(function (ok) {
      if (ok) {
        setLoggedIn();
        document.getElementById("school-login-overlay").hidden = true;
        openPendingPdf();
        return;
      }
      err.textContent = "認証に失敗しました。入力内容をご確認ください。";
    });
  }

  function initGatePage() {
    var form = document.getElementById("kn-gate-form");
    if (!form) return;
    var err = document.getElementById("kn-gate-error");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var user = (document.getElementById("kn-gate-user").value || "").trim();
      var pass = document.getElementById("kn-gate-pass").value || "";
      credentialsOk(user, pass).then(function (ok) {
        if (ok) {
          setLoggedIn();
          location.href = hubUrl();
          return;
        }
        if (err) err.textContent = "認証に失敗しました。入力内容をご確認ください。";
      });
    });
    if (isLoggedIn()) {
      location.replace(hubUrl());
    }
  }

  document.addEventListener("click", function (e) {
    var tier = portalTier();
    if (tier === "gate" || tier === "hub") return;
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
