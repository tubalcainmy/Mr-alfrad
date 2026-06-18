/**
 * CEA Promo / Discount Banner Configuration
 * ------------------------------------------
 * This is the "backend" control for the discount countdown banner.
 * Edit the values below and re-deploy to start or stop a promotion —
 * no other code needs to change. The banner shows itself automatically
 * only while the current time is between startDateTime and endDateTime,
 * AND enabled is true. Outside that window, it stays hidden.
 *
 * Dates use ISO 8601 with timezone offset, e.g. "2026-07-01T00:00:00+01:00"
 * (+01:00 is West Africa Time / Nigeria).
 */
window.CEA_PROMO = {
  // Master switch. Set to false to force the banner off regardless of dates.
  enabled: true,

  // Promotion window
  startDateTime: "2026-07-01T00:00:00+01:00",
  endDateTime: "2026-07-15T23:59:59+01:00",

  // Banner content
  headline: "Launch Offer: Free Property Listing",
  subtext: "List your property at zero cost before our standard listing fees apply.",
  ctaText: "Claim My Free Listing",
  ctaTarget: "#lead-form",
};
