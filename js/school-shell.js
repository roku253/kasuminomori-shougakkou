/**
 * 全ページ共通ヘッダー・タブ・左メニュー・フッター
 */
(function () {
  var ACTIVE = document.body.getAttribute("data-sgn-active") || "home";
  var BASE = document.body.getAttribute("data-sgn-base") || "./";

  var FOOTER_TEXT =
    "霞ノ杜町立霞ノ杜小学校 ／ 〒393-0000 霞ノ杜町大字杜ケ丘 1234";
  var FICTION_HTML =
    "※本サイトは謎解き作品のための<strong>架空サイト</strong>です。記載・表示されるサービス名・地名・人物名・団体名などはフィクションであり、<strong>実在のものとは一切関係ありません</strong>。";

  var TABS = [
    { id: "home", label: "ホーム", href: "" },
    { id: "guide", label: "学校案内", href: "guide/" },
    { id: "contact", label: "お問い合わせ", href: "contact/" },
  ];

  var MENU_PUBLIC = [
    { id: "life", label: "学校生活の様子", href: "portal/life/" },
    { id: "evaluation", label: "学校評価アンケート", href: "portal/evaluation/" },
    { id: "newsletter", label: "学校だより", href: "portal/newsletters/" },
    { id: "grade-news", label: "学年だより", href: "portal/grade-news/" },
    { id: "health", label: "保健だより", href: "portal/health/" },
    { id: "nurse", label: "保健室からのお知らせ", href: "portal/nurse/" },
    { id: "lunch", label: "給食だより・こんだて表", href: "portal/lunch/" },
    { id: "pta", label: "PTAからのお手紙", href: "portal/pta/" },
    { id: "shin1", label: "令和8年度入学新1年生", href: "portal/shin1/" },
  ];

  var MENU_GRADUATE = [
    { id: "events", label: "年間行事予定", href: "portal/events/" },
    { id: "life", label: "学校生活の様子", href: "portal/life/" },
    { id: "newsletter", label: "学校だより", href: "portal/newsletters/" },
    { id: "grade-news", label: "学年だより", href: "portal/grade-news/" },
    { id: "time-capsule", label: "タイムカプセル", href: "archives/time-capsule/" },
  ];

  function isGraduateLoggedIn() {
    try {
      return sessionStorage.getItem("kn_graduate_auth_v1") === "1";
    } catch (e) {
      return false;
    }
  }

  function join(path) {
    var base = BASE || "./";
    if (base === ".") base = "./";
    if (base.charAt(base.length - 1) !== "/") base += "/";
    if (!path) return base;
    if (path.charAt(0) === "/") return path;
    return base + path;
  }

  function resolveMenuHref(item) {
    var tier = document.body.getAttribute("data-portal-tier");
    var back = window.KnPortalConfig && window.KnPortalConfig.BACK;
    var useBack = tier === "back" || tier === "hub" || isGraduateLoggedIn();
    if (useBack && back && back[item.id]) {
      return join(back[item.id]);
    }
    return join(item.href);
  }

  function currentMenuId() {
    var p = (location.pathname || "").toLowerCase();
    if (/\/portal\/events/.test(p)) return "events";
    if (/\/portal\/life/.test(p)) return "life";
    if (/\/portal\/evaluation/.test(p)) return "evaluation";
    if (/\/portal\/newsletters/.test(p)) return "newsletter";
    if (/\/portal\/kn-hub/.test(p)) return "hub";
    if (/\/portal\/kn-gate/.test(p)) return "gate";
    if (/\/portal\/grade-news/.test(p)) return "grade-news";
    if (/\/portal\/health/.test(p)) return "health";
    if (/\/portal\/nurse/.test(p)) return "nurse";
    if (/\/portal\/lunch/.test(p)) return "lunch";
    if (/\/portal\/pta/.test(p)) return "pta";
    if (/\/portal\/shin1/.test(p)) return "shin1";
    if (/\/archives\/time-capsule/.test(p)) return "time-capsule";
    if (/\/archives\/2021/.test(p)) return "time-capsule";
    return null;
  }

  function buildChrome() {
    var wrap = document.createElement("div");
    wrap.className = "sgn-chrome";
    wrap.innerHTML =
      '<header class="sgn-header">' +
      '<div class="sgn-header-brand">' +
      '<div class="sgn-header-brand-inner">' +
      '<div class="sgn-logo" aria-hidden="true">霞</div>' +
      '<div class="sgn-header-titles">' +
      '<p class="sgn-header-ruby">かすみのもりちょうりつ</p>' +
      '<h1 class="sgn-header-name"><a href="' +
      join("") +
      '">霞ノ杜町立 霞ノ杜小学校</a></h1>' +
      '<p class="sgn-header-slogan">よく見て、よく考えて、ことばにする</p>' +
      "</div></div></div>" +
      '<div class="sgn-header-photo" role="img" aria-label="学校の様子（仮画像）"></div>' +
      "</header>" +
      '<nav class="sgn-tabs" aria-label="メインメニュー"></nav>';

    var nav = wrap.querySelector(".sgn-tabs");
    TABS.forEach(function (tab) {
      var a = document.createElement("a");
      a.href = join(tab.href);
      a.textContent = tab.label;
      if (tab.id === ACTIVE) a.className = "is-active";
      nav.appendChild(a);
    });

    return wrap;
  }

  function injectSidebar(site) {
    var body = site.querySelector(".sgn-body");
    if (!body) return;

    var current = currentMenuId();
    var items = isGraduateLoggedIn() ? MENU_GRADUATE : MENU_PUBLIC;
    var aside = body.querySelector(".sgn-col-side.sgn-menu-links");
    if (!aside) {
      aside = document.createElement("aside");
      aside.className = "sgn-col-side sgn-menu-links";
      var main = body.querySelector(".sgn-col-main");
      if (main) body.insertBefore(aside, main);
      else body.appendChild(aside);
    } else {
      aside.innerHTML = "";
    }

    var heading = document.createElement("h3");
    heading.textContent = "メニュー";
    aside.appendChild(heading);

    items.forEach(function (item) {
      if (item.id === current) return;
      var a = document.createElement("a");
      a.href = resolveMenuHref(item);
      a.textContent = item.label;
      aside.appendChild(a);
    });
  }

  function ensureSiteContainer() {
    var site = document.querySelector(".sgn-site");
    if (site) return site;

    var muni = document.querySelector(".muni-wrap");
    if (!muni) return null;

    muni.classList.add("sgn-site");
    muni.classList.remove("muni-wrap");

    var header = muni.querySelector(".muni-header");
    var nav = muni.querySelector(".muni-nav");
    if (header) header.remove();
    if (nav) nav.remove();

    var main = muni.querySelector("main");
    if (main) {
      var body = document.createElement("div");
      body.className = "sgn-body";
      var col = document.createElement("div");
      col.className = "sgn-col-main";
      while (main.firstChild) col.appendChild(main.firstChild);
      body.appendChild(col);
      main.replaceWith(body);
    }

    return muni;
  }

  function normalizeFooter(site) {
    var root = document.getElementById("site-root");
    if (!root) return;

    site.querySelectorAll(
      "footer.sgn-footer, footer.muni-footer, footer.sgn-site-footer, .school-fiction-note"
    ).forEach(function (n) {
      n.remove();
    });
    root.querySelectorAll(".school-fiction-note").forEach(function (n) {
      n.remove();
    });

    var footer = document.createElement("footer");
    footer.className = "sgn-site-footer";
    footer.setAttribute("role", "contentinfo");
    footer.innerHTML =
      '<p class="sgn-footer-line">' +
      FOOTER_TEXT +
      "</p>" +
      '<p class="sgn-footer-fiction" role="note">' +
      FICTION_HTML +
      "</p>";
    site.appendChild(footer);
  }

  function normalizeBodyLayout(site) {
    var body = site.querySelector(".sgn-body");
    if (!body) return;
    var menu = body.querySelector(".sgn-menu-links");
    var notice = body.querySelector(".sgn-notice-panel");
    if (!menu && !notice) body.classList.add("sgn-body--full");
  }

  function mount() {
    var site = ensureSiteContainer();
    if (!site) return;

    site.querySelectorAll(".sgn-banner, .sgn-gnav, .sgn-emergency, .staff-banner").forEach(function (n) {
      n.remove();
    });

    var existing = site.querySelector(".sgn-chrome");
    if (existing) existing.remove();

    site.insertBefore(buildChrome(), site.firstChild);
    injectSidebar(site);
    normalizeBodyLayout(site);
    normalizeFooter(site);
  }

  window.KnSchoolShell = { refreshSidebar: function () {
    var site = document.querySelector(".sgn-site");
    if (site) injectSidebar(site);
  }};

  document.addEventListener("kn-graduate-auth-changed", function () {
    document.body.classList.toggle("graduate-logged-in", isGraduateLoggedIn());
    window.KnSchoolShell.refreshSidebar();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
