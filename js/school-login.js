/**
 * 保護者ポータル風ログイン（霞ノ杜小学校）
 * 正: kasuminomori / shougakkou
 */
(function () {
  var SESSION_KEY = "kn_school_staff_v1";
  var VALID_USER = "kasuminomori";
  var VALID_PASS = "shougakkou";
  var SITE_HOST = "https://roku253.github.io/kasuminomori-shougakkou/";

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
    if (/\/portal\//.test(path) || /\/archives\/2016\//.test(path)) return "../../";
    if (/\/archives\//.test(path)) return "../../";
    if (/\/guide\//.test(path) || /\/contact\//.test(path) || /\/access\//.test(path)) return "../";
    return "./";
  }

  function setLoggedIn() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {}
    document.documentElement.classList.remove("staff-prelock");
    document.body.classList.add("staff-logged-in");
  }

  function lockStaffUI() {
    document.documentElement.classList.add("staff-prelock");
    document.body.classList.remove("staff-logged-in");
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
      '<div class="login-dialog-header" id="login-title">ログイン</div>' +
      '<div class="login-dialog-url" id="login-url"></div>' +
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
    var urlEl = document.getElementById("login-url");
    if (urlEl) {
      urlEl.textContent = targetHref
        ? SITE_HOST + targetHref.replace(/^\.\//, "").replace(/^\//, "")
        : SITE_HOST;
    }
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
    if (user === VALID_USER && pass === VALID_PASS) {
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
    err.textContent = "ユーザー名またはパスワードが正しくありません。";
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
      document.body.classList.add("staff-logged-in");
      return;
    }
    lockStaffUI();
    showModal(null);
  }

  window.KnSchoolLogin = {
    isLoggedIn: isLoggedIn,
    showModal: showModal,
    setLoggedIn: setLoggedIn,
  };

  if (isLoggedIn()) {
    document.documentElement.classList.remove("staff-prelock");
    document.body.classList.add("staff-logged-in");
  } else if (document.body.hasAttribute("data-staff-page")) {
    lockStaffUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", guardStaffPage);
  } else {
    guardStaffPage();
  }
})();
