// properties.js — fetches listings and renders the property grid on properties.html

(function () {
  var WORKER_BASE_URL = "https://cea-listing-worker.ceafricaorg.workers.dev";
  var PAGE_SIZE = 9;

  var allListings = [];
  var filteredListings = [];
  var currentPage = 1;

  var gridEl = document.getElementById("propertyGrid");
  var paginationEl = document.getElementById("propertyPagination");
  var locationSelect = document.getElementById("filterLocation");
  var typeSelect = document.getElementById("filterType");
  var priceInput = document.getElementById("filterPrice");
  var searchBtn = document.getElementById("searchBtn");

  function fetchListings() {
    showSkeletons();
    fetch(WORKER_BASE_URL + "/listings")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to fetch listings");
        return res.json();
      })
      .then(function (data) {
        allListings = Array.isArray(data) ? data : (data.listings || []);
        filteredListings = allListings.slice();
        currentPage = 1;
        renderGrid(filteredListings);
      })
      .catch(function () {
        if (gridEl) {
          gridEl.innerHTML =
            '<div class="no-results">' +
              '<div class="no-results-icon">&#128683;</div>' +
              '<h3>Could not load listings</h3>' +
              '<p>Please refresh the page or try again later.</p>' +
            "</div>";
        }
      });
  }

  function showSkeletons() {
    if (!gridEl) return;
    var html = "";
    for (var i = 0; i < 6; i++) {
      html +=
        '<div class="skeleton-card">' +
          '<div class="skeleton skeleton-photo"></div>' +
          '<div class="skeleton-body">' +
            '<div class="skeleton skeleton-line short"></div>' +
            '<div class="skeleton skeleton-line"></div>' +
            '<div class="skeleton skeleton-line short"></div>' +
            '<div class="skeleton skeleton-line tall"></div>' +
          "</div>" +
        "</div>";
    }
    gridEl.innerHTML = html;
    if (paginationEl) paginationEl.innerHTML = "";
  }

  function applyFilters() {
    var location = locationSelect ? locationSelect.value : "";
    var type = typeSelect ? typeSelect.value : "";
    var maxPrice = priceInput ? parseFloat(priceInput.value) : NaN;

    filteredListings = allListings.filter(function (listing) {
      if (location && listing.location !== location) return false;
      if (type && listing.propertyType !== type) return false;
      if (!isNaN(maxPrice) && maxPrice > 0 && listing.price > maxPrice) return false;
      return true;
    });

    currentPage = 1;
    renderGrid(filteredListings);

    // GA4 search event
    if (typeof gtag === "function") {
      gtag("event", "search", {
        search_term: [location, type, maxPrice > 0 ? "max:" + maxPrice : ""].filter(Boolean).join(" | ") || "all"
      });
    }
  }

  function renderGrid(listings) {
    if (!gridEl) return;

    if (!listings || listings.length === 0) {
      gridEl.innerHTML =
        '<div class="no-results">' +
          '<div class="no-results-icon">&#128269;</div>' +
          '<h3>No properties found</h3>' +
          '<p>Try adjusting your filters.</p>' +
        "</div>";
      if (paginationEl) paginationEl.innerHTML = "";
      return;
    }

    var start = (currentPage - 1) * PAGE_SIZE;
    var end = start + PAGE_SIZE;
    var pageListings = listings.slice(start, end);

    var html = "";
    for (var i = 0; i < pageListings.length; i++) {
      html += renderCard(pageListings[i]);
    }
    gridEl.innerHTML = html;

    renderPagination(listings.length);
  }

  function renderCard(listing) {
    var detailUrl = "property.html?id=" + encodeURIComponent(listing.id || "");
    var photoSrc = (listing.photos && listing.photos.length > 0) ? listing.photos[0] : "";

    var photoHtml = photoSrc
      ? '<img src="' + escHtml(photoSrc) + '" alt="' + escHtml(listing.address) + '" loading="lazy" onerror="this.onerror=null;this.parentElement.classList.add(\'no-photo\');this.remove();" />'
      : "";
    var wrapClass = "property-photo-wrap" + (photoSrc ? "" : " no-photo");

    var titleBadge = listing.titleType
      ? '<span class="title-badge">Title: ' + escHtml(listing.titleType) + "</span>"
      : "";

    var priceFormatted = listing.price
      ? "&#8358;" + Number(listing.price).toLocaleString("en-NG")
      : "Price on request";

    var desc = listing.description || "";
    var descSnippet = desc.length > 140 ? desc.substring(0, 140) + "…" : desc;

    return (
      '<div class="property-card">' +
        '<a href="' + detailUrl + '" class="property-card-link" aria-label="View details for ' + escHtml(listing.address || "this property") + '">' +
          '<div class="' + wrapClass + '">' +
            photoHtml +
            '<span class="cea-verified-badge">&#10003; CEA Verified</span>' +
            titleBadge +
          "</div>" +
          '<div class="property-card-body">' +
            '<span class="prop-type-chip">' + escHtml(listing.propertyType || "Property") + "</span>" +
            '<h3 class="prop-address">' + escHtml(listing.address || "") + "</h3>" +
            '<div class="prop-meta">' +
              '<span>' + escHtml(listing.location || "") + "</span>" +
              '<span class="prop-price">' + priceFormatted + "</span>" +
            "</div>" +
            (descSnippet ? '<p class="prop-desc">' + escHtml(descSnippet) + "</p>" : "") +
          "</div>" +
        "</a>" +
        '<div class="property-card-footer">' +
          '<button class="book-tour-btn" data-listing-id="' + escHtml(listing.id || "") + '" data-address="' + escHtml(listing.address || "") + '">Book a Tour</button>' +
          '<a href="' + detailUrl + '" class="view-details-link">View Details &#8594;</a>' +
        "</div>" +
      "</div>"
    );
  }

  function renderPagination(total) {
    if (!paginationEl) return;
    var totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) {
      paginationEl.innerHTML = "";
      return;
    }

    var html = "";
    html += '<button class="page-btn" id="pagePrev" ' + (currentPage === 1 ? "disabled" : "") + '>&laquo; Prev</button>';

    for (var p = 1; p <= totalPages; p++) {
      html += '<button class="page-btn' + (p === currentPage ? " active" : "") + '" data-page="' + p + '">' + p + "</button>";
    }

    html += '<button class="page-btn" id="pageNext" ' + (currentPage === totalPages ? "disabled" : "") + '>Next &raquo;</button>';
    paginationEl.innerHTML = html;

    var prevBtn = document.getElementById("pagePrev");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        if (currentPage > 1) { currentPage--; renderGrid(filteredListings); scrollToGrid(); }
      });
    }

    var nextBtn = document.getElementById("pageNext");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (currentPage < totalPages) { currentPage++; renderGrid(filteredListings); scrollToGrid(); }
      });
    }

    paginationEl.querySelectorAll(".page-btn[data-page]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentPage = parseInt(this.getAttribute("data-page"), 10);
        renderGrid(filteredListings);
        scrollToGrid();
      });
    });
  }

  function scrollToGrid() {
    if (gridEl) gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return parts[2] + " " + months[parseInt(parts[1], 10) - 1] + " " + parts[0];
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function init() {
    if (searchBtn) {
      searchBtn.addEventListener("click", applyFilters);
    }
    if (priceInput) {
      priceInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") applyFilters();
      });
    }
    fetchListings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
