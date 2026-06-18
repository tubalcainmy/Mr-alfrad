(function () {
  var config = window.CEA_PROMO;
  if (!config || !config.enabled) return;

  var start = new Date(config.startDateTime).getTime();
  var end = new Date(config.endDateTime).getTime();
  if (isNaN(start) || isNaN(end) || start >= end) return;

  var mount = document.getElementById("promoBanner");
  if (!mount) return;

  var countdownInterval = null;

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function render() {
    mount.innerHTML =
      '<div class="promo-bar">' +
      '<div class="container promo-bar-inner">' +
      '<div class="promo-text">' +
      '<strong class="promo-headline">' + config.headline + "</strong>" +
      '<span class="promo-subtext">' + config.subtext + "</span>" +
      "</div>" +
      '<div class="promo-countdown" id="promoCountdown" aria-live="polite"></div>' +
      '<a href="' + config.ctaTarget + '" class="promo-cta">' + config.ctaText + "</a>" +
      "</div>" +
      "</div>";
    document.body.classList.add("has-promo-banner");
  }

  function remove() {
    mount.innerHTML = "";
    document.body.classList.remove("has-promo-banner");
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function tick() {
    var now = Date.now();

    if (now < start || now > end) {
      remove();
      return;
    }

    if (!document.getElementById("promoCountdown")) {
      render();
    }

    var remaining = end - now;
    var days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    var hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    var minutes = Math.floor((remaining / (1000 * 60)) % 60);
    var seconds = Math.floor((remaining / 1000) % 60);

    var countdownEl = document.getElementById("promoCountdown");
    if (countdownEl) {
      countdownEl.textContent =
        "Ends in " + days + "d " + pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
    }
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
})();
