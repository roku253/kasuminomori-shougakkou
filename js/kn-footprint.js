(function () {
  var KN_FP_KEY = "signal_trace_kn_footprint_v2";
  function knPurged() {
    try {
      var f = localStorage.getItem(KN_FP_KEY) || "";
      return f === "purged_delete" || f === "purged_keep";
    } catch (e) {
      return false;
    }
  }
  function knApplyFootprint() {
    if (!knPurged()) return;
    document.querySelectorAll('[data-kn-story-clue="1"],[data-kn-story-clue-wrap="1"]').forEach(function (el) {
      el.style.display = "none";
    });
  }
  window.addEventListener("storage", function (e) {
    if (e.key !== KN_FP_KEY) return;
    var v = e.newValue;
    if (v !== "purged_delete" && v !== "purged_keep") return;
    knApplyFootprint();
  });
  knApplyFootprint();
})();
