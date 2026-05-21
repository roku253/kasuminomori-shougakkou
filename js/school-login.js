/**
 * 卒業生認証（在学時氏名 + 生年月日）— PDF閲覧時のみ必須
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

  function nameOk(user) {
    var n = normalizeName(user);
    return VALID_NAMES.some(function (v) {
      return normalizeName(v) === n;
    });
  }

  function birthOk(pass) {
    var b = normalizeBirth(pass);
    return VALID_BIRTHS.some(function (v) {
      return normalizeBirth(v) === b;
    });
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
    if (el.closest(".sgn-notice-list") && /\.(pdf|html)($|\?|#)/i.test(href)) return true;
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
      '<p class="login-dialog-note">個人情報を含む資料です。認証情報を入力してください。</p>' +
      '<div class="login-dialog-body">' +
      '<div class="login-field"><label for="login-user">ユーザー名</label>' +
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

  function tryLogin() {
    var user = (document.getElementById("login-user").value || "").trim();
    var pass = document.getElementById("login-pass").value || "";
    var err = document.getElementById("login-error");
    if (nameOk(user) && birthOk(pass)) {
      setLoggedIn();
      document.getElementById("school-login-overlay").hidden = true;
      if (pendingPdfHref && pendingPdfHref !== "#" && !/^javascript:/i.test(pendingPdfHref)) {
        window.open(pendingPdfHref, "_blank", "noopener,noreferrer");
      }
      pendingPdfHref = null;
      return;
    }
    err.textContent = "認証に失敗しました。入力内容をご確認ください。";
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (!link || !isPdfGateTarget(link)) return;
    if (isLoggedIn()) return;
    e.preventDefault();
    e.stopPropagation();
    var href = link.href;
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

  window.KnSchoolLogin = {
    isLoggedIn: isLoggedIn,
    showModal: showModal,
    setLoggedIn: setLoggedIn,
    applyYearFilter: applyYearFilter,
    YEAR_MIN: YEAR_MIN,
    YEAR_MAX: YEAR_MAX,
  };

  if (isLoggedIn()) {
    document.documentElement.classList.remove("graduate-prelock");
    document.body.classList.add("graduate-logged-in");
  }

  function onReady() {
    guardGraduateOnlyPage();
    applyYearFilter();
    notifyAuthChange();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
