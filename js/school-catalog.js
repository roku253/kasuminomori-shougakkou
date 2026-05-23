/**
 * 年度別カタログ（学校だより・年間行事・学校生活）
 * 表示: 2017–2026（10年）。在校生・卒業生とも同じ。PDF閲覧は認証後。
 */
(function () {
  var BASE = document.body.getAttribute("data-sgn-base") || "../../";
  var YEAR_MIN = 2017;
  var YEAR_MAX = 2026;

  function join(path) {
    var base = BASE;
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base + path;
  }

  function isLoggedIn() {
    if (window.KnSchoolLogin && typeof window.KnSchoolLogin.isLoggedIn === "function") {
      return window.KnSchoolLogin.isLoggedIn();
    }
    try {
      return sessionStorage.getItem("kn_graduate_auth_v1") === "1";
    } catch (e) {
      return false;
    }
  }

  var ERA_LABELS = {
    2026: "令和８年度",
    2025: "令和７年度",
    2024: "令和６年度",
    2023: "令和５年度",
    2022: "令和４年度",
    2021: "令和３年度",
    2020: "令和２年度",
    2019: "平成31年度",
    2018: "平成30年度",
    2017: "平成29年度",
  };

  var LIFE_BY_YEAR = {
    2026: "運動会・科学週間",
    2025: "合唱祭・社会科見学",
    2024: "町民体育祭ボランティア",
    2023: "プール開き・交通安全",
    2022: "遠足・音楽会",
    2021: "オンライン学習発表会",
    2020: "リモート学習・クラブ活動",
    2019: "卒業式・地域清掃",
    2018: "写生大会・クラブ発表",
    2017: "林間学校・読書週間",
  };

  function issueCount(year) {
    return year === 2026 ? 7 : 12;
  }

  function eraSlug(year) {
    if (year >= 2019) return "r" + (year - 2018);
    return "h" + (year - 1988);
  }

  function rangeYears(from, to) {
    var arr = [];
    for (var y = from; y >= to; y--) arr.push(y);
    return arr;
  }

  function addPdfLink(row, href, label, graduateOnly) {
    var a = document.createElement("a");
    var logged = isLoggedIn();
    if (graduateOnly && !logged) {
      a.href = "#";
      a.setAttribute("data-login-gate", "");
    } else {
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("data-require-pdf", "");
      if (graduateOnly) a.setAttribute("data-requires-graduate", "");
    }
    a.textContent = label;
    row.appendChild(a);
  }

  function buildNewsletterCatalog(container) {
    container.innerHTML = "";
    var logged = isLoggedIn();
    var years = rangeYears(YEAR_MAX, YEAR_MIN);

    years.forEach(function (year) {
      var block = document.createElement("section");
      block.className = "pdf-year-block";
      block.setAttribute("data-year", String(year));

      var title = document.createElement("h3");
      title.className = "pdf-year-title";
      title.textContent = ERA_LABELS[year] || year + "年度";
      block.appendChild(title);

      var row = document.createElement("div");
      row.className = "pdf-issue-row";
      var count = issueCount(year);
      for (var n = count; n >= 1; n--) {
        var nn = String(n).padStart(2, "0");
        var href = join("assets/pdf/newsletter-" + eraSlug(year) + "-" + nn + ".pdf");
        addPdfLink(row, href, "第" + n + "号", !logged);
      }
      block.appendChild(row);
      container.appendChild(block);
    });
  }

  function buildEventsCatalog(container) {
    container.innerHTML = "";
    var logged = isLoggedIn();
    var years = rangeYears(YEAR_MAX, YEAR_MIN);

    years.forEach(function (year) {
      var block = document.createElement("section");
      block.className = "pdf-year-block";
      block.setAttribute("data-year", String(year));

      var title = document.createElement("h3");
      title.className = "pdf-year-title";
      title.textContent = ERA_LABELS[year] || year + "年度";
      block.appendChild(title);

      var row = document.createElement("div");
      row.className = "pdf-issue-row";
      addPdfLink(
        row,
        join("assets/pdf/events-" + eraSlug(year) + ".pdf"),
        "年間行事予定表",
        !logged
      );
      var meta = document.createElement("span");
      meta.className = "pdf-meta";
      meta.textContent = " (PDF)";
      row.appendChild(meta);
      block.appendChild(row);
      container.appendChild(block);
    });
  }

  function buildLifeCatalog(container) {
    container.innerHTML = "";
    var years = rangeYears(YEAR_MAX, YEAR_MIN);

    years.forEach(function (year) {
      var block = document.createElement("section");
      block.className = "life-year-block pdf-year-block";
      block.setAttribute("data-year", String(year));

      var h = document.createElement("h3");
      h.className = "pdf-year-title";
      h.textContent = ERA_LABELS[year] || year + "年度";
      block.appendChild(h);

      var card = document.createElement("div");
      card.className = "card life-card";
      card.innerHTML =
        '<div class="life-photo" style="background:linear-gradient(145deg,#dfe8d4,#b8c9a8);min-height:100px;border:1px solid #ddd;margin-bottom:8px;"></div>' +
        "<p>" +
        (LIFE_BY_YEAR[year] || "当該年度の記録") +
        " … 当該年度の記録です。</p>";
      block.appendChild(card);
      container.appendChild(block);
    });
  }

  function init() {
    var type = document.body.getAttribute("data-catalog");
    var el = document.getElementById("catalog-root");
    if (!el || !type) return;
    if (type === "newsletter") buildNewsletterCatalog(el);
    if (type === "events") buildEventsCatalog(el);
    if (type === "life") buildLifeCatalog(el);
    if (window.KnSchoolLogin && window.KnSchoolLogin.applyYearFilter) {
      window.KnSchoolLogin.applyYearFilter();
    }
  }

  document.addEventListener("kn-graduate-auth-changed", init);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
