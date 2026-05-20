/**
 * 年度別カタログ（学校だより・年間行事等）の動的生成
 */
(function () {
  var BASE = document.body.getAttribute("data-sgn-base") || "../../";

  function join(path) {
    var base = BASE;
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base + path;
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
  };

  function issueCount(year) {
    return year === 2026 ? 7 : 12;
  }

  function eraSlug(year) {
    if (year >= 2019) {
      var r = year - 2018;
      return "r" + r;
    }
    return "h" + (year - 1988);
  }

  function buildNewsletterCatalog(container) {
    var years = [];
    for (var y = 2026; y >= 2016; y--) years.push(y);
    years.forEach(function (year) {
      var block = document.createElement("section");
      block.className = "pdf-year-block";
      block.setAttribute("data-year", String(year));
      if (year !== 2016) block.classList.add("is-archive");

      var title = document.createElement("h3");
      title.className = "pdf-year-title";
      title.textContent = ERA_LABELS[year] || year + "年度";
      block.appendChild(title);

      var gate = document.createElement("p");
      gate.className = "pdf-gate-msg";
      gate.textContent = "閲覧には認証が必要です（お問い合わせのFAQをご参照ください）。";
      block.appendChild(gate);

      var row = document.createElement("div");
      row.className = "pdf-issue-row";
      var slug = eraSlug(year);
      var count = issueCount(year);
      for (var n = count; n >= 1; n--) {
        var a = document.createElement("a");
        var nn = String(n).padStart(2, "0");
        if (year === 2016) {
          a.href = join("assets/pdf/newsletter-h28-" + nn + ".pdf");
          a.setAttribute("data-requires-graduate", "");
        } else {
          a.href = join("assets/pdf/newsletter-" + slug + "-" + nn + ".pdf");
        }
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "第" + n + "号";
        row.appendChild(a);
      }
      block.appendChild(row);
      container.appendChild(block);
    });
  }

  function buildEventsCatalog(container, mode) {
    var publicYears = [2026, 2025, 2024, 2023, 2022, 2021];
    var archiveYears = [2019, 2018, 2017, 2016, 2015, 2014, 2013];
    var years = mode === "archive" ? archiveYears : publicYears.concat(archiveYears);

    years.forEach(function (year) {
      var block = document.createElement("section");
      block.className = "pdf-year-block";
      block.setAttribute("data-year", String(year));
      if (year < 2020 || year > 2026) block.classList.add("is-archive");

      var title = document.createElement("h3");
      title.className = "pdf-year-title";
      title.textContent = ERA_LABELS[year] || year + "年度";
      block.appendChild(title);

      var gate = document.createElement("p");
      gate.className = "pdf-gate-msg";
      gate.textContent = "閲覧には認証が必要です。";
      block.appendChild(gate);

      var row = document.createElement("div");
      row.className = "pdf-issue-row";
      var a = document.createElement("a");
      a.href = join("assets/pdf/events-" + eraSlug(year) + ".pdf");
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "年間行事予定表";
      a.innerHTML += ' <span class="pdf-meta">(PDF)</span>';
      if (year <= 2019) a.setAttribute("data-requires-graduate", "");
      row.appendChild(a);
      block.appendChild(row);
      container.appendChild(block);
    });
  }

  function buildLifeCatalog(container) {
    var items = [
      { year: 2026, title: "令和8年度", event: "運動会・科学週間", img: "life-2026.svg" },
      { year: 2025, title: "令和7年度", event: "合唱祭・社会科見学", img: "life-2025.svg" },
      { year: 2024, title: "令和6年度", event: "町民体育祭ボランティア", img: "life-2024.svg" },
      { year: 2023, title: "令和5年度", event: "プール開き・交通安全", img: "life-2023.svg" },
      { year: 2022, title: "令和4年度", event: "遠足・音楽会", img: "life-2022.svg" },
      { year: 2021, title: "令和3年度", event: "オンライン学習発表会", img: "life-2021.svg" },
      { year: 2019, title: "平成31年度", event: "卒業式・地域清掃", img: "life-2019.svg" },
      { year: 2018, title: "平成30年度", event: "写生大会・クラブ発表", img: "life-2018.svg" },
      { year: 2017, title: "平成29年度", event: "林間学校", img: "life-2017.svg" },
      { year: 2016, title: "平成28年度", event: "河川敷清掃・写生大会", img: "life-2016.svg" },
      { year: 2015, title: "平成27年度", event: "読書週間", img: "life-2015.svg" },
      { year: 2014, title: "平成26年度", event: "運動会", img: "life-2014.svg" },
      { year: 2013, title: "平成25年度", event: "入学式", img: "life-2013.svg" },
    ];
    items.forEach(function (item) {
      var block = document.createElement("section");
      block.className = "life-year-block pdf-year-block";
      block.setAttribute("data-year", String(item.year));
      if (item.year < 2020 || item.year > 2026) block.classList.add("is-archive");

      var h = document.createElement("h3");
      h.className = "pdf-year-title";
      h.textContent = item.title;
      block.appendChild(h);

      var card = document.createElement("div");
      card.className = "card life-card";
      card.innerHTML =
        '<div class="life-photo" style="background:url(' +
        join("assets/images/life/" + item.img) +
        ') center/cover no-repeat;min-height:100px;border:1px solid #ddd;margin-bottom:8px;"></div>' +
        "<p>" +
        item.event +
        ' … <a href="' +
        join("portal/events/") +
        '" data-require-login>年間行事</a>と連動した記録です。</p>';
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
