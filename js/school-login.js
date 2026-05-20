/**
 * 限定公開ページ用ログイン（卒業生：在学時氏名 + 生年月日）
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

  function homeUrl() {
    var base = document.body.getAttribute("data-school-home");
    if (base) return base;
    var path = location.pathname || "";
    if (/\/portal\//.test(path) || /\/archives\//.test(path)) return "../../";
    if (/\/guide\//.test(path) || /\/contact\//.test(path)) return "../";
    return "./";
  }

  function setLoggedIn() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {}
    document.documentElement.classList.remove("staff-prelock");
    document.body.classList.add("graduate-logged-in");
    applyYearFilter();
  }

  function lockStaffUI() {
    document.documentElement.classList.add("staff-prelock");
    document.body.classList.remove("graduate-logged-in");
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
      if (!logged) {
        if (y >= YEAR_MIN && y <= YEAR_MAX) {
          if (el.querySelector("[data-requires-graduate]")) {
            el.classList.remove("is-hidden-year");
          } else {
            el.classList.add("is-hidden-year");
          }
        } else {
          el.classList.remove("is-hidden-year", "is-gated");
        }
        return;
      }
      el.classList.remove("is-hidden-year", "is-gated");
    });
    document.querySelectorAll("[data-requires-graduate]").forEach(function (el) {
      if (logged) el.classList.remove("is-gated");
      else el.classList.add("is-gated");
    });
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
      '<p class="login-dialog-note">個人情報を含むページです。認証情報を入力してください。</p>' +
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
      pendingHref = null;
      if (document.body.hasAttribute("data-staff-page") && !isLoggedIn()) {
        window.location.href = homeUrl();
      }
    });
    el.querySelector("#login-submit").addEventListener("click", tryLogin);
    el.addEventListener("click", function (e) {
      if (e.target === el) {
        el.hidden = true;
        pendingHref = null;
        if (document.body.hasAttribute("data-staff-page") && !isLoggedIn()) {
          window.location.href = homeUrl();
        }
      }
    });
    document.getElementById("login-pass").addEventListener("keydown", function (e) {
      if (e.key === "Enter") tryLogin();
    });
    return el;
  }

  var pendingHref = null;

  function showModal(targetHref) {
    var overlay = ensureModal();
    pendingHref = targetHref || null;
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
      if (pendingHref) {
        window.location.href = pendingHref;
      } else {
        window.location.reload();
      }
      pendingHref = null;
      return;
    }
    err.textContent = "認証に失敗しました。入力内容をご確認ください。";
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-require-login]");
    if (!link) return;
    if (isLoggedIn()) return;
    e.preventDefault();
    e.stopPropagation();
    var href = link.getAttribute("href");
    if (!href || href === "#") {
      showModal(null);
      return;
    }
    showModal(href);
  });

  function guardStaffPage() {
    if (!document.body.hasAttribute("data-staff-page")) return;
    if (isLoggedIn()) {
      document.documentElement.classList.remove("staff-prelock");
      document.body.classList.add("graduate-logged-in");
      applyYearFilter();
      return;
    }
    lockStaffUI();
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
    document.documentElement.classList.remove("staff-prelock");
    document.body.classList.add("graduate-logged-in");
  } else if (document.body.hasAttribute("data-staff-page")) {
    lockStaffUI();
  }

  function onReady() {
    guardStaffPage();
    applyYearFilter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }
})();
