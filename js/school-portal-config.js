/**
 * 表（公開）／裏（資料あり）ポータルパス — GitHub Pages 用
 */
(function (global) {
  var GATE = "portal/kn-gate.html";
  var HUB = "portal/kn-hub.html";

  var BACK = {
    events: "portal/events/back.html",
    life: "portal/life/back.html",
    newsletter: "portal/newsletters/back.html",
    "grade-news": "portal/grade-news/back.html",
    health: "portal/health/back.html",
    lunch: "portal/lunch/back.html",
  };

  global.KnPortalConfig = {
    GATE: GATE,
    HUB: HUB,
    BACK: BACK,
  };
})(typeof window !== "undefined" ? window : globalThis);
