// property-detail.js — renders a single property detail page from ?id= query param

(function () {
  var WORKER_BASE_URL = "https://cea-listing-worker.ceafricaorg.workers.dev";

  var currentPhotoIndex = 0;
  var photos = [];

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function fetchListing(id) {
    fetch(WORKER_BASE_URL + "/listings/" + encodeURIComponent(id))
      .then(function (res) {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(function (listing) {
        renderDetail(listing);
      })
      .catch(function () {
        var content = document.getElementById("detailContent");
        if (content) {
          content.innerHTML =
            '<div class="no-results" style="padding:80px 20px;">' +
              '<div class="no-results-icon">&#128683;</div>' +
              '<h3>Property not found</h3>' +
              '<p>This listing may have been removed or the link is incorrect.</p>' +
              '<p><a href="properties.html" class="btn-submit" style="display:inline-block;width:auto;padding:12px 24px;text-decoration:none;">Browse all properties</a></p>' +
            "</div>";
        }
      });
  }

  function setMeta(name, content, attr) {
    attr = attr || "name";
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (el) el.setAttribute("content", content);
  }

  function buildBuyerJourney() {
    return (
      '<div id="buyerJourneyWrap" style="margin-top:20px;border-top:1px solid #e3e7ed;padding-top:14px;">' +
        '<button type="button" id="buyerJourneyToggle" style="' +
          'display:flex;align-items:center;justify-content:space-between;width:100%;' +
          'background:none;border:none;padding:0;cursor:pointer;font-family:inherit;' +
          'font-size:13px;font-weight:700;color:var(--cea-navy);text-align:left;' +
        '">' +
          '<span>How buying with CEA works</span>' +
          '<span id="buyerJourneyChevron" style="font-size:11px;color:var(--cea-muted);transition:transform 0.2s;">&#9660;</span>' +
        '</button>' +
        '<div id="buyerJourneySteps" style="display:none;margin-top:14px;">' +
          buildJourneyStep("1", "#2ecc71", "Book a Tour",
            "Pick a date and time that works for you. A CEA representative will confirm your appointment by email.") +
          buildJourneyStep("2", "#3498db", "Property Verification",
            "Our team physically visits the property, verifies the title documents, boundaries, and confirms clear ownership.") +
          buildJourneyStep("3", "#e67e22", "Agree &amp; Secure",
            "Negotiate a price with CEA oversight. Sign a purchase agreement and pay a securing deposit to hold the property.") +
          buildJourneyStep("4", "#1a2e4a", "Transfer &amp; Own",
            "Complete all documentation and title transfer under CEA supervision. The property is legally yours.") +
        "</div>" +
      "</div>"
    );
  }

  function buildJourneyStep(num, color, title, desc) {
    return (
      '<div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start;">' +
        '<div style="' +
          'flex-shrink:0;width:28px;height:28px;border-radius:50%;' +
          'background:' + color + ';color:#fff;' +
          'display:flex;align-items:center;justify-content:center;' +
          'font-size:12px;font-weight:800;' +
        '">' + num + '</div>' +
        '<div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--cea-navy);margin-bottom:2px;">' + title + '</div>' +
          '<div style="font-size:12.5px;color:var(--cea-muted);line-height:1.5;">' + desc + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderDetail(listing) {
    var pageTitle = (listing.address || "Property") + " | CEA Verified | Castlerock Econetwork Africa";
    document.title = pageTitle;

    var desc = (listing.description || "").slice(0, 155);
    var img = (listing.photos && listing.photos[0]) ? listing.photos[0] : "https://tubalcainmy.github.io/Mr-alfrad/logo.jpg";
    setMeta("description", desc);
    setMeta("og:title", pageTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:image", img, "property");
    setMeta("twitter:title", pageTitle, "name");
    setMeta("twitter:description", desc, "name");
    setMeta("twitter:image", img, "name");

    if (typeof gtag === "function") {
      gtag("event", "view_item", {
        item_id: listing.id,
        item_name: listing.address,
        item_category: listing.propertyType,
        item_category2: listing.location,
        price: listing.price,
        currency: "NGN"
      });
    }
    if (typeof fbq === "function") {
      fbq("track", "ViewContent", {
        content_ids: [listing.id],
        content_name: listing.address,
        content_type: "property",
        value: listing.price,
        currency: "NGN"
      });
    }

    photos = (listing.photos && listing.photos.length > 0) ? listing.photos : [];
    currentPhotoIndex = 0;

    var priceFormatted = listing.price
      ? "&#8358;" + Number(listing.price).toLocaleString("en-NG")
      : "Price on request";

    var listedDateFormatted = listing.listedDate ? formatDate(listing.listedDate) : "Recently listed";

    var titleBadgeHtml = listing.titleType
      ? '<span class="cea-verified-badge" style="position:static;display:inline-block;margin-bottom:10px;background:var(--cea-navy);">Title: ' + escHtml(listing.titleType) + "</span>"
      : "";

    var galleryMainHtml = "";
    if (photos.length > 0) {
      galleryMainHtml = '<img src="' + escHtml(photos[0]) + '" alt="' + escHtml(listing.address) + '" id="galleryMainImg" />';
    } else {
      galleryMainHtml = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--cea-muted);font-size:14px;">No photos available</div>';
    }

    var thumbsHtml = "";
    for (var i = 0; i < photos.length; i++) {
      thumbsHtml +=
        '<div class="gallery-thumb' + (i === 0 ? " active" : "") + '" data-index="' + i + '">' +
          '<img src="' + escHtml(photos[i]) + '" alt="Photo ' + (i + 1) + '" loading="lazy" />' +
        "</div>";
    }

    var descShort = (listing.description && listing.description.length > 300)
      ? listing.description.substring(0, 300) + "..."
      : listing.description || "";
    var hasLongDesc = listing.description && listing.description.length > 300;

    var descHtml =
      '<p id="propDescText" style="font-size:14px;color:var(--cea-muted);margin:0 0 4px;">' + escHtml(descShort) + "</p>" +
      (hasLongDesc
        ? '<button type="button" id="readMoreBtn" style="background:none;border:none;color:var(--cea-green);font-size:13px;font-weight:600;cursor:pointer;padding:0;">Read more</button>'
        : "");

    var mapHtml = "";
    if (listing.latitude && listing.longitude) {
      var mapSrc =
        "https://maps.google.com/maps?q=" + listing.latitude + "," + listing.longitude +
        "&z=15&output=embed";
      mapHtml = '<iframe src="' + mapSrc + '" loading="lazy" title="Property location map" allowfullscreen></iframe>';
    } else {
      mapHtml =
        '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:var(--cea-muted);font-size:14px;">Map coordinates not available for this listing.</div>';
    }

    var videoHtml = "";
    if (listing.videoUrl) {
      var ytMatch = listing.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (ytMatch) {
        videoHtml =
          '<div class="video-section">' +
            '<h3 class="video-section-title">Property Video</h3>' +
            '<div class="video-wrap">' +
              '<iframe src="https://www.youtube.com/embed/' + ytMatch[1] + '" loading="lazy" title="Property video" allowfullscreen frameborder="0"></iframe>' +
            "</div>" +
          "</div>";
      } else {
        videoHtml =
          '<div class="video-section">' +
            '<h3 class="video-section-title">Property Video</h3>' +
            '<div class="video-wrap">' +
              '<video controls style="width:100%;border-radius:var(--radius);">' +
                '<source src="' + escHtml(listing.videoUrl) + '" />' +
                'Your browser does not support video playback.' +
              "</video>" +
            "</div>" +
          "</div>";
      }
    }

    var content = document.getElementById("detailContent");
    if (!content) return;

    content.innerHTML =
      '<div class="property-detail-grid">' +
        '<div class="detail-gallery">' +
          '<div class="gallery-main">' + galleryMainHtml + "</div>" +
          (photos.length > 1 ? '<div class="gallery-thumbs" id="galleryThumbs">' + thumbsHtml + "</div>" : "") +
        "</div>" +
        '<div class="detail-sticky">' +
          '<div class="detail-card">' +
            '<span class="cea-verified-badge" style="position:static;display:inline-block;margin-bottom:10px;">&#10003; CEA Verified</span>' +
            titleBadgeHtml +
            '<p style="margin:4px 0 0;font-size:13px;color:var(--cea-muted);">' + escHtml(listing.propertyType || "") + " &bull; " + escHtml(listing.location || "") + "</p>" +
            '<div class="detail-price">' + priceFormatted + "</div>" +
            descHtml +
            '<div class="detail-meta-grid">' +
              (listing.size
                ? '<div class="detail-meta-item"><div class="label">Size</div><div class="value">' + escHtml(listing.size) + "</div></div>"
                : "") +
              '<div class="detail-meta-item"><div class="label">Type</div><div class="value">' + escHtml(listing.propertyType || "&#8212;") + "</div></div>" +
              '<div class="detail-meta-item"><div class="label">Location</div><div class="value">' + escHtml(listing.location || "&#8212;") + "</div></div>" +
              '<div class="detail-meta-item"><div class="label">Listed</div><div class="value">' + listedDateFormatted + "</div></div>" +
            "</div>" +
            '<button class="btn-submit book-tour-btn" data-listing-id="' + escHtml(listing.id || "") + '" data-address="' + escHtml(listing.address || "") + '" style="font-size:15px;padding:14px;">Book a Tour</button>' +
            '<button class="share-btn" id="shareBtn">&#128279; Share this listing</button>' +
            buildBuyerJourney() +
          "</div>" +
        "</div>" +
      "</div>" +
      videoHtml +
      '<div class="map-section">' + mapHtml + "</div>";

    wireGallery(listing);
    wireShareBtn(listing);
    wireReadMore(listing);
    wireBuyerJourney();
  }

  function wireBuyerJourney() {
    var toggle = document.getElementById("buyerJourneyToggle");
    var steps = document.getElementById("buyerJourneySteps");
    var chevron = document.getElementById("buyerJourneyChevron");
    if (!toggle || !steps) return;
    toggle.addEventListener("click", function () {
      var open = steps.style.display !== "none";
      steps.style.display = open ? "none" : "block";
      if (chevron) chevron.style.transform = open ? "" : "rotate(180deg)";
    });
  }

  function wireGallery(listing) {
    if (photos.length <= 1) return;
    var thumbsContainer = document.getElementById("galleryThumbs");
    if (!thumbsContainer) return;
    thumbsContainer.addEventListener("click", function (e) {
      var thumb = e.target.closest(".gallery-thumb");
      if (!thumb) return;
      var index = parseInt(thumb.getAttribute("data-index"), 10);
      currentPhotoIndex = index;
      var mainImg = document.getElementById("galleryMainImg");
      if (mainImg) mainImg.src = photos[index];
      thumbsContainer.querySelectorAll(".gallery-thumb").forEach(function (t) { t.classList.remove("active"); });
      thumb.classList.add("active");
    });
  }

  function wireShareBtn(listing) {
    var btn = document.getElementById("shareBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          showCopied(btn);
        }).catch(function () {
          fallbackCopy(url, btn);
        });
      } else {
        fallbackCopy(url, btn);
      }
    });
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    showCopied(btn);
  }

  function showCopied(btn) {
    var original = btn.innerHTML;
    btn.innerHTML = "&#10003; Copied!";
    setTimeout(function () { btn.innerHTML = original; }, 2000);
  }

  function wireReadMore(listing) {
    var btn = document.getElementById("readMoreBtn");
    if (!btn || !listing.description) return;
    btn.addEventListener("click", function () {
      var textEl = document.getElementById("propDescText");
      if (textEl) textEl.textContent = listing.description;
      btn.style.display = "none";
    });
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

  function showError(msg) {
    var content = document.getElementById("detailContent");
    if (content) {
      content.innerHTML =
        '<div class="no-results" style="padding:80px 20px;">' +
          '<div class="no-results-icon">&#128683;</div>' +
          '<h3>' + msg + '</h3>' +
          '<p style="margin-bottom:20px;">The listing may have been removed or the link is incorrect.</p>' +
          '<p><a href="properties.html" class="btn-submit" style="display:inline-block;width:auto;padding:12px 24px;text-decoration:none;">Browse all properties</a></p>' +
        "</div>";
    }
  }

  function init() {
    var id = getQueryParam("id");
    if (!id) {
      var content = document.getElementById("detailContent");
      if (content) {
        content.innerHTML =
          '<div class="no-results" style="padding:80px 20px;">' +
            '<div class="no-results-icon">&#128269;</div>' +
            '<h3>No property specified</h3>' +
            '<p><a href="properties.html" class="btn-submit" style="display:inline-block;width:auto;padding:12px 24px;text-decoration:none;">Browse all properties</a></p>' +
          "</div>";
      }
      return;
    }

    var loadTimeout = setTimeout(function () {
      showError("This listing is taking too long to load");
    }, 15000);

    fetch(WORKER_BASE_URL + "/listings/" + encodeURIComponent(id))
      .then(function (res) {
        clearTimeout(loadTimeout);
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(function (listing) {
        renderDetail(listing);
      })
      .catch(function () {
        clearTimeout(loadTimeout);
        showError("Property not found");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
