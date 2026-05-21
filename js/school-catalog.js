/**
 * 年度別カタログ（学校だより・年間行事・学校生活）
 * 未ログイン: 2020-2026（現役6年生の入学年度〜）
 * ログイン後: 2013-2019（卒業生アーカイブ）
 */
(function () {
  var BASE = document.body.getAttribute("data-sgn-base") || "../../";
  var YEAR_MIN = 2013;
  var YEAR_MAX = 2019;
  var PUBLIC_ENROLL = 2020;
  var PUBLIC_END = 2026;

  function join(path) {
    var base = BASE;
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base + path;
  }

  function isLoggedIn() {
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
    2016: "平成28年度",
    2015: "平成27年度",
    2014: "平成26年度",
    2013: "平成25年度",
  };

  function issueCount(year) {
    return year === 2026 ? 7 : 12;
  }

  function eraSlug(year) {
    if (year >= 2019) return "r" + (year - 2018);
    return "h" + (year - 1988);
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
    var years = [];
    if (logged) {
      for (var y = YEAR_MAX; y >= YEAR_MIN; y--) years.push(y);
    } else {
      for (var y2 = PUBLIC_END; y2 >= PUBLIC_ENROLL; y2--) years.push(y2);
    }

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
        var href;
        if (year === 2016) {
          href = join("assets/pdf/newsletter-h28-" + nn + ".html");
        } else {
          href = join("assets/pdf/newsletter-" + eraSlug(year) + "-" + nn + ".html");
        }
        addPdfLink(row, href, "第" + n + "号", !logged);
      }
      block.appendChild(row);
      container.appendChild(block);
    });
  }

  function buildEventsCatalog(container) {
    container.innerHTML = "";
    var logged = isLoggedIn();
    var years = logged
      ? rangeYears(YEAR_MAX, YEAR_MIN)
      : rangeYears(PUBLIC_END, PUBLIC_ENROLL);

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
        join("assets/pdf/events-" + eraSlug(year) + ".html"),
        "年間行事予定表",
        logged || year > YEAR_MAX
      );
      var meta = document.createElement("span");
      meta.className = "pdf-meta";
      meta.textContent = " (PDF)";
      row.appendChild(meta);
      block.appendChild(row);
      container.appendChild(block);
    });
  }

  function rangeYears(from, to) {
    var arr = [];
    for (var y = from; y >= to; y--) arr.push(y);
    return arr;
  }

  function buildLifeCatalog(container) {
    container.innerHTML = "";
    var logged = isLoggedIn();
    var publicItems = [
      { year: 2026, title: "令和8年度", event: "運動会・科学週間" },
      { year: 2025, title: "令和7年度", event: "合唱祭・社会科見学" },
      { year: 2024, title: "令和6年度", event: "町民体育祭ボランティア" },
      { year: 2023, title: "令和5年度", event: "プール開き・交通安全" },
      { year: 2022, title: "令和4年度", event: "遠足・音楽会" },
      { year: 2021, title: "令和3年度", event: "オンライン学習発表会" },
    ];
    var archiveItems = [
      { year: 2019, title: "平成31年度", event: "卒業式・地域清掃" },
      { year: 2018, title: "平成30年度", event: "写生大会・クラブ発表" },
      { year: 2017, title: "平成29年度", event: "林間学校" },
      { year: 2016, title: "平成28年度", event: "河川敷清掃・写生大会" },
      { year: 2015, title: "平成27年度", event: "読書週間" },
      { year: 2014, title: "平成26年度", event: "運動会" },
      { year: 2013, title: "平成25年度", event: "入学式" },
    ];
    var items = logged ? archiveItems : publicItems;

    items.forEach(function (item) {
      var block = document.createElement("section");
      block.className = "life-year-block pdf-year-block";
      block.setAttribute("data-year", String(item.year));

      var h = document.createElement("h3");
      h.className = "pdf-year-title";
      h.textContent = item.title;
      block.appendChild(h);

      var card = document.createElement("div");
      card.className = "card life-card";
      card.innerHTML =
        '<div class="life-photo" style="background:linear-gradient(145deg,#dfe8d4,#b8c9a8);min-height:100px;border:1px solid #ddd;margin-bottom:8px;"></div>' +
        "<p>" +
        item.event +
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
