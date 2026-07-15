// booking-modal.js — standalone modal for tour booking, used on properties.html and property.html

(function () {
  var WORKER_BASE_URL = "https://cea-listing-worker.ceafricaorg.workers.dev";

  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var TIME_SLOTS = ["9:00am", "10:00am", "11:00am", "12:00pm", "2:00pm", "3:00pm", "4:00pm"];

  var state = {
    step: 1,
    listingId: null,
    address: null,
    selectedDate: null,
    selectedTime: null
  };

  function buildModal() {
    var overlay = document.createElement("div");
    overlay.className = "booking-overlay";
    overlay.id = "bookingOverlay";
    overlay.innerHTML =
      '<div class="booking-modal" id="bookingModal" role="dialog" aria-modal="true" aria-labelledby="bookingModalTitle">' +
        '<div class="booking-modal-header">' +
          '<h3 id="bookingModalTitle">Book a Property Tour</h3>' +
          '<button type="button" class="booking-close-btn" id="bookingCloseBtn" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="booking-modal-body" id="bookingModalBody"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById("bookingCloseBtn").addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
  }

  function openModal(listingId, address) {
    state.step = 1;
    state.listingId = listingId;
    state.address = address;
    state.selectedDate = null;
    state.selectedTime = null;

    var title = document.getElementById("bookingModalTitle");
    if (title) title.textContent = address ? "Book a Tour — " + address : "Book a Property Tour";

    renderStep();
    var overlay = document.getElementById("bookingOverlay");
    if (overlay) {
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
  }

  function closeModal() {
    var overlay = document.getElementById("bookingOverlay");
    if (overlay) overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function renderStep() {
    var body = document.getElementById("bookingModalBody");
    if (!body) return;
    if (state.step === 1) {
      body.innerHTML = buildStep1();
      wireStep1();
    } else {
      body.innerHTML = buildStep2();
      wireStep2();
    }
  }

  function buildStepDots() {
    return (
      '<div class="booking-steps">' +
        '<div class="booking-step-dot' + (state.step >= 1 ? " active" : "") + '"></div>' +
        '<div class="booking-step-dot' + (state.step >= 2 ? " active" : "") + '"></div>' +
      '</div>'
    );
  }

  function buildStep1() {
    var today = new Date();
    var dateChips = "";
    for (var i = 0; i < 7; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      var dayName = DAY_NAMES[d.getDay()];
      var dayNum = d.getDate();
      var monthName = MONTH_NAMES[d.getMonth()];
      var iso = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      var isSelected = state.selectedDate === iso ? " selected" : "";
      dateChips +=
        '<button type="button" class="date-chip' + isSelected + '" data-date="' + iso + '">' +
          '<span class="day-name">' + dayName + "</span>" +
          '<span class="day-num">' + dayNum + "</span>" +
          '<span class="day-name">' + monthName + "</span>" +
        "</button>";
    }

    var timeChips = "";
    for (var j = 0; j < TIME_SLOTS.length; j++) {
      var slot = TIME_SLOTS[j];
      var sel = state.selectedTime === slot ? " selected" : "";
      timeChips += '<button type="button" class="time-chip' + sel + '" data-time="' + slot + '">' + slot + "</button>";
    }

    return (
      buildStepDots() +
      '<p style="margin:0 0 14px;font-size:13px;color:var(--cea-muted);">Step 1 of 2 — Pick a time</p>' +
      '<div class="date-picker" id="datePicker">' + dateChips + "</div>" +
      '<p style="margin:0 0 10px;font-size:13px;font-weight:600;color:var(--cea-navy);">Available time slots</p>' +
      '<div class="time-grid" id="timeGrid">' + timeChips + "</div>" +
      '<div id="step1Error" style="display:none;color:#c0392b;font-size:12.5px;margin-bottom:8px;"></div>' +
      '<div class="booking-nav">' +
        '<span></span>' +
        '<button type="button" class="btn-submit" id="step1Next" style="width:auto;padding:11px 28px;">Next &rarr;</button>' +
      "</div>"
    );
  }

  function wireStep1() {
    var datePicker = document.getElementById("datePicker");
    if (datePicker) {
      datePicker.addEventListener("click", function (e) {
        var chip = e.target.closest(".date-chip");
        if (!chip) return;
        datePicker.querySelectorAll(".date-chip").forEach(function (c) { c.classList.remove("selected"); });
        chip.classList.add("selected");
        state.selectedDate = chip.getAttribute("data-date");
      });
    }

    var timeGrid = document.getElementById("timeGrid");
    if (timeGrid) {
      timeGrid.addEventListener("click", function (e) {
        var chip = e.target.closest(".time-chip");
        if (!chip) return;
        timeGrid.querySelectorAll(".time-chip").forEach(function (c) { c.classList.remove("selected"); });
        chip.classList.add("selected");
        state.selectedTime = chip.getAttribute("data-time");
      });
    }

    var nextBtn = document.getElementById("step1Next");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var err = document.getElementById("step1Error");
        if (!state.selectedDate) {
          if (err) { err.textContent = "Please select a date."; err.style.display = "block"; }
          return;
        }
        if (!state.selectedTime) {
          if (err) { err.textContent = "Please select a time slot."; err.style.display = "block"; }
          return;
        }
        if (err) err.style.display = "none";
        state.step = 2;
        renderStep();
      });
    }
  }

  function buildStep2() {
    return (
      buildStepDots() +
      '<p style="margin:0 0 14px;font-size:13px;color:var(--cea-muted);">Step 2 of 2 — Your details</p>' +
      '<p style="margin:0 0 18px;font-size:13px;color:var(--cea-navy);background:var(--cea-bg);padding:10px 14px;border-radius:8px;">' +
        '<strong>Selected:</strong> ' + formatDate(state.selectedDate) + " at " + state.selectedTime +
      "</p>" +
      '<div class="form-group">' +
        '<label for="bookingName">Full Name</label>' +
        '<input type="text" id="bookingName" name="bookingName" placeholder="e.g. Adaeze Okafor" autocomplete="name" />' +
        '<span class="error-msg" id="bookingNameErr">Please enter your full name.</span>' +
      "</div>" +
      '<div class="form-group">' +
        '<label for="bookingEmail">Email Address</label>' +
        '<input type="email" id="bookingEmail" name="bookingEmail" placeholder="e.g. you@example.com" autocomplete="email" />' +
        '<span class="error-msg" id="bookingEmailErr">Please enter a valid email address.</span>' +
      "</div>" +
      '<div class="form-group">' +
        '<label for="bookingPhone">Phone Number</label>' +
        '<input type="tel" id="bookingPhone" name="bookingPhone" placeholder="e.g. 0803 123 4567" autocomplete="tel" />' +
        '<span class="error-msg" id="bookingPhoneErr">Please enter your phone number.</span>' +
      "</div>" +
      '<div class="form-group">' +
        '<label for="bookingNotes">Message / Notes <span style="font-weight:400;color:var(--cea-muted);">(optional)</span></label>' +
        '<textarea id="bookingNotes" name="bookingNotes" rows="3" placeholder="Any questions about the property?" style="width:100%;padding:12px 14px;border:1.5px solid #dfe3ea;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;"></textarea>' +
      "</div>" +
      '<div id="step2Error" style="display:none;color:#c0392b;font-size:12.5px;margin-bottom:8px;"></div>' +
      '<div class="booking-nav">' +
        '<button type="button" class="booking-back-btn" id="step2Back">&larr; Back</button>' +
        '<button type="button" class="btn-submit" id="bookingConfirmBtn" style="width:auto;padding:11px 28px;">Confirm Booking</button>' +
      "</div>"
    );
  }

  function wireStep2() {
    var backBtn = document.getElementById("step2Back");
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        state.step = 1;
        renderStep();
      });
    }

    var confirmBtn = document.getElementById("bookingConfirmBtn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        var nameEl = document.getElementById("bookingName");
        var emailEl = document.getElementById("bookingEmail");
        var phoneEl = document.getElementById("bookingPhone");
        var notesEl = document.getElementById("bookingNotes");
        var err = document.getElementById("step2Error");

        var name = nameEl ? nameEl.value.trim() : "";
        var email = emailEl ? emailEl.value.trim() : "";
        var phone = phoneEl ? phoneEl.value.trim() : "";
        var notes = notesEl ? notesEl.value.trim() : "";

        var valid = true;

        if (!name) {
          if (nameEl) nameEl.parentElement.classList.add("has-error");
          valid = false;
        } else {
          if (nameEl) nameEl.parentElement.classList.remove("has-error");
        }

        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          if (emailEl) emailEl.parentElement.classList.add("has-error");
          valid = false;
        } else {
          if (emailEl) emailEl.parentElement.classList.remove("has-error");
        }

        if (!phone) {
          if (phoneEl) phoneEl.parentElement.classList.add("has-error");
          valid = false;
        } else {
          if (phoneEl) phoneEl.parentElement.classList.remove("has-error");
        }

        if (!valid) {
          if (err) { err.textContent = "Please fill in all required fields."; err.style.display = "block"; }
          return;
        }
        if (err) err.style.display = "none";

        var payload = {
          listingId: state.listingId,
          address: state.address,
          date: state.selectedDate,
          time: state.selectedTime,
          name: name,
          email: email,
          phone: phone,
          notes: notes
        };

        confirmBtn.disabled = true;
        confirmBtn.textContent = "Sending...";

        fetch(WORKER_BASE_URL + "/book-tour", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            if (!res.ok) throw new Error("Request failed: " + res.status);
            return res.json();
          })
          .then(function () {
            closeModal();
            showToast("Booking request sent! CEA will confirm your appointment by email.");
            if (typeof gtag === "function") {
              gtag("event", "book_tour", {
                item_id: state.listingId,
                item_name: state.address,
                event_category: "engagement"
              });
            }
            if (typeof fbq === "function") {
              fbq("trackCustom", "TourBooked", { listing_id: state.listingId, address: state.address });
            }
          })
          .catch(function () {
            confirmBtn.disabled = false;
            confirmBtn.textContent = "Confirm Booking";
            if (err) {
              err.textContent = "Something went wrong. Please try again or contact info@ceagroup.org.";
              err.style.display = "block";
            }
          });
      });
    }
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return DAY_NAMES[d.getDay()] + ", " + d.getDate() + " " + MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
  }

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function showToast(msg) {
    var toast = document.getElementById("bookingToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "bookingToast";
      toast.className = "booking-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 4000);
  }

  function init() {
    buildModal();

    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".book-tour-btn");
      if (!btn) return;
      var listingId = btn.getAttribute("data-listing-id") || "";
      var address = btn.getAttribute("data-address") || "";
      openModal(listingId, address);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
