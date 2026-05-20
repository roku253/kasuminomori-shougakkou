/**
 * 全ページ共通ヘッダー・タブ・フッター（谷津南小／鷺沼型）
 * body[data-sgn-base] 相対パス（例: ../../）
 * body[data-sgn-active] 現在タブ: home|guide|contact|access|events|life|newsletter
 */
(function () {
  var ACTIVE = document.body.getAttribute("data-sgn-active") || "home";
  var BASE = document.body.getAttribute("data-sgn-base") || "./";

  var FOOTER_TEXT =
    "霞ノ杜町立霞ノ杜小学校 ／ 〒000-0000 霞ノ杜町（フィクション）";
  var FICTION_HTML =
    "※本サイトは謎解き作品のための<strong>架空サイト</strong>です。記載・表示されるサービス名・地名・人物名・団体名などはフィクションであり、<strong>実在のものとは一切関係ありません</strong>。";

  function join(path) {
    var base = BASE || "./";
    if (base === ".") base = "./";
    if (base.charAt(base.length - 1) !== "/") base += "/";
    if (!path) return base;
    if (path.charAt(0) === "/") return path;
    return base + path;
  }

  var TABS = [
    { id: "home", label: "ホーム", href: "", login: false },
    { id: "guide", label: "学校案内", href: "guide/", login: false },
    { id: "contact", label: "お問い合わせ", href: "contact/", login: false },
    { id: "access", label: "アクセス", href: "access/", login: false },
    { id: "events", label: "年間行事", href: "portal/events/", login: true },
    { id: "life", label: "学校生活", href: "portal/life/", login: true },
    { id: "newsletter", label: "学校だより", href: "portal/newsletters/", login: true },
  ];

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
      if (tab.login) a.setAttribute("data-require-login", "");
      nav.appendChild(a);
    });

    return wrap;
  }

  /** 旧 muni-wrap / main 構造を sgn-site に寄せる */
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

    var mfooter = muni.querySelector(".muni-footer");
    if (mfooter) mfooter.className = "sgn-footer";

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
    var sides = body.querySelectorAll(".sgn-col-side");
    if (sides.length === 0) body.classList.add("sgn-body--full");
  }

  function mount() {
    var site = ensureSiteContainer();
    if (!site) return;

    var oldBanner = site.querySelector(".sgn-banner");
    var oldNav = site.querySelector(".sgn-gnav");
    if (oldBanner) oldBanner.remove();
    if (oldNav) oldNav.remove();

    var existing = site.querySelector(".sgn-chrome");
    if (existing) existing.remove();

    site.insertBefore(buildChrome(), site.firstChild);
    normalizeBodyLayout(site);
    normalizeFooter(site);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
