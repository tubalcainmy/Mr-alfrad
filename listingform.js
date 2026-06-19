(function () {
  // Replace with your deployed Cloudflare Worker URL.
  var WORKER_BASE_URL = "https://cea-listing-worker.YOUR-SUBDOMAIN.workers.dev";

  // Replace with your live/test Paystack PUBLIC key (never the secret key).
  var PAYSTACK_PUBLIC_KEY = "pk_test_REPLACE_ME";

  var loadingState = document.getElementById("loadingState");
  var expiredState = document.getElementById("expiredState");
  var formSection = document.getElementById("listingFormSection");

  var params = new URLSearchParams(window.location.search);
  var token = params.get("token");

  function showExpired() {
    loadingState.style.display = "none";
    formSection.style.display = "none";
    expiredState.style.display = "flex";
  }

  function showForm() {
    loadingState.style.display = "none";
    expiredState.style.display = "none";
    formSection.style.display = "block";
  }

  if (!token) {
    showExpired();
    return;
  }

  fetch(WORKER_BASE_URL + "/verify-token?token=" + encodeURIComponent(token))
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.valid) {
        showForm();
      } else {
        showExpired();
      }
    })
    .catch(showExpired);

  var form = document.getElementById("listingForm");
  if (!form) return;

  var submitBtn = document.getElementById("listingSubmitBtn");
  var statusEl = document.getElementById("listingFormStatus");
  var submitGateNote = document.getElementById("submitGateNote");

  var identityVerified = false;
  var paymentRef = null; // null until paid, or "FREE" if no fee due

  function updateSubmitGate() {
    var ready = identityVerified && paymentRef !== null;
    submitBtn.disabled = !ready;
    submitGateNote.style.display = ready ? "none" : "block";
  }

  var fields = {
    propertyType: {
      input: document.getElementById("propertyType"),
      group: document.getElementById("group-propertyType"),
      validate: function (v) { return v.trim().length > 0; },
    },
    address: {
      input: document.getElementById("address"),
      group: document.getElementById("group-address"),
      validate: function (v) { return v.trim().length >= 5; },
    },
    price: {
      input: document.getElementById("price"),
      group: document.getElementById("group-price"),
      validate: function (v) { return Number(v) > 0; },
    },
    description: {
      input: document.getElementById("description"),
      group: document.getElementById("group-description"),
      validate: function (v) { return v.trim().length >= 10; },
    },
    email: {
      input: document.getElementById("email"),
      group: document.getElementById("group-email"),
      validate: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    },
    firstName: {
      input: document.getElementById("firstName"),
      group: document.getElementById("group-firstName"),
      validate: function (v) { return v.trim().length >= 2; },
    },
    lastName: {
      input: document.getElementById("lastName"),
      group: document.getElementById("group-lastName"),
      validate: function (v) { return v.trim().length >= 2; },
    },
    dob: {
      input: document.getElementById("dob"),
      group: document.getElementById("group-dob"),
      validate: function (v) { return v.trim().length > 0; },
    },
    vnin: {
      input: document.getElementById("vnin"),
      group: document.getElementById("group-vnin"),
      validate: function (v) { return v.trim().length >= 10; },
    },
    titleDocument: {
      input: document.getElementById("titleDocument"),
      group: document.getElementById("group-titleDocument"),
      validate: function () { return fields.titleDocument.input.files.length > 0; },
    },
    propertyPhotos: {
      input: document.getElementById("propertyPhotos"),
      group: document.getElementById("group-propertyPhotos"),
      validate: function () { return fields.propertyPhotos.input.files.length > 0; },
    },
  };

  function setError(field, hasError) {
    field.group.classList.toggle("has-error", hasError);
  }

  Object.keys(fields).forEach(function (key) {
    var field = fields[key];
    field.input.addEventListener("input", function () {
      if (field.group.classList.contains("has-error") && field.validate(field.input.value)) {
        setError(field, false);
      }
    });
  });

  // --- Identity verification (Virtual NIN) ---
  var verifyIdentityBtn = document.getElementById("verifyIdentityBtn");
  var identityStatusEl = document.getElementById("identityStatus");
  var identityFieldKeys = ["firstName", "lastName", "dob", "vnin"];

  verifyIdentityBtn.addEventListener("click", function () {
    var isValid = true;
    identityFieldKeys.forEach(function (key) {
      var field = fields[key];
      var valid = field.validate(field.input.value);
      setError(field, !valid);
      if (!valid) isValid = false;
    });

    if (!isValid) {
      identityStatusEl.className = "form-status failure";
      identityStatusEl.textContent = "Please correct the highlighted identity fields above.";
      return;
    }

    verifyIdentityBtn.disabled = true;
    verifyIdentityBtn.textContent = "Verifying...";
    identityStatusEl.className = "form-status";
    identityStatusEl.textContent = "";

    var identityPayload = {
      firstname: fields.firstName.input.value.trim(),
      lastname: fields.lastName.input.value.trim(),
      dob: fields.dob.input.value.trim(),
      vnin: fields.vnin.input.value.trim(),
    };

    fetch(WORKER_BASE_URL + "/verify-identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(identityPayload),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        verifyIdentityBtn.disabled = false;
        if (data.verified) {
          identityVerified = true;
          verifyIdentityBtn.textContent = "Identity Verified";
          verifyIdentityBtn.disabled = true;
          identityStatusEl.className = "form-status success";
          identityStatusEl.textContent = "Your identity has been verified against your Virtual NIN.";
          if (typeof gtag === "function") {
            gtag("event", "identity_verified", { form: "stage2_listing_form" });
          }
          if (typeof fbq === "function") {
            fbq("trackCustom", "IdentityVerified");
          }
          updateSubmitGate();
        } else {
          verifyIdentityBtn.textContent = "Verify My Identity";
          identityStatusEl.className = "form-status failure";
          identityStatusEl.textContent =
            "We couldn't verify your identity (" + (data.reason || "no match") +
            "). Please check your details and try again.";
        }
      })
      .catch(function () {
        verifyIdentityBtn.disabled = false;
        verifyIdentityBtn.textContent = "Verify My Identity";
        identityStatusEl.className = "form-status failure";
        identityStatusEl.textContent = "Verification request failed. Please try again.";
      });
  });

  // --- Payment (listing fee, waived/discounted automatically during an active promo) ---
  var payBtn = document.getElementById("payBtn");
  var paymentAmountText = document.getElementById("paymentAmountText");
  var paymentStatusEl = document.getElementById("paymentStatus");

  function computeFeeNaira() {
    var base = window.CEA_LISTING_FEE_NAIRA || 0;
    var promo = window.CEA_PROMO;
    if (!promo || !promo.enabled) return base;

    var now = Date.now();
    var start = new Date(promo.startDateTime).getTime();
    var end = new Date(promo.endDateTime).getTime();
    if (isNaN(start) || isNaN(end) || now < start || now > end) return base;

    if (promo.discountType === "free") return 0;
    if (promo.discountType === "percent") {
      var off = base * ((promo.discountValue || 0) / 100);
      return Math.max(0, Math.round(base - off));
    }
    return base;
  }

  var feeNaira = computeFeeNaira();

  if (feeNaira <= 0) {
    paymentAmountText.textContent = "Your listing fee is currently waived by an active promotion. No payment required.";
    payBtn.style.display = "none";
    paymentRef = "FREE";
    updateSubmitGate();
  } else {
    paymentAmountText.textContent = "Listing fee: ₦" + feeNaira.toLocaleString() + ". Payment is required before your listing is submitted for verification.";
    payBtn.disabled = false;
    payBtn.addEventListener("click", function () {
      var payerEmail = fields.email.input.value.trim();
      if (!fields.email.validate(payerEmail)) {
        setError(fields.email, true);
        paymentStatusEl.className = "form-status failure";
        paymentStatusEl.textContent = "Please enter a valid email address before paying.";
        return;
      }

      if (typeof PaystackPop === "undefined") {
        paymentStatusEl.className = "form-status failure";
        paymentStatusEl.textContent = "Payment library failed to load. Please refresh and try again.";
        return;
      }

      var handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: payerEmail,
        amount: feeNaira * 100, // kobo
        currency: "NGN",
        ref: "CEA-" + Date.now(),
        callback: function (response) {
          paymentRef = response.reference;
          paymentStatusEl.className = "form-status success";
          paymentStatusEl.textContent = "Payment received. Reference: " + response.reference;
          payBtn.textContent = "Paid";
          payBtn.disabled = true;
          if (typeof gtag === "function") {
            gtag("event", "purchase", {
              transaction_id: response.reference,
              value: feeNaira,
              currency: "NGN",
            });
          }
          if (typeof fbq === "function") {
            fbq("track", "Purchase", { value: feeNaira, currency: "NGN" });
          }
          updateSubmitGate();
        },
        onClose: function () {
          paymentStatusEl.className = "form-status failure";
          paymentStatusEl.textContent = "Payment window closed before completion.";
        },
      });
      handler.openIframe();
    });
  }

  // --- Final submission (requires identity verified + payment complete) ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!identityVerified) {
      statusEl.className = "form-status failure";
      statusEl.textContent = "Please verify your identity before submitting.";
      return;
    }
    if (paymentRef === null) {
      statusEl.className = "form-status failure";
      statusEl.textContent = "Please complete payment before submitting.";
      return;
    }

    var isValid = true;
    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      var valid = field.validate(field.input.value);
      setError(field, !valid);
      if (!valid) isValid = false;
    });

    if (!isValid) {
      statusEl.className = "form-status failure";
      statusEl.textContent = "Please correct the highlighted fields above.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    statusEl.className = "form-status";
    statusEl.textContent = "";

    var formData = new FormData(form);
    formData.append("token", token);
    formData.append("paystackRef", paymentRef);
    formData.append("feePaidNaira", String(feeNaira));

    fetch(WORKER_BASE_URL + "/submit-listing", {
      method: "POST",
      body: formData,
    })
      .then(function (res) {
        if (!res.ok) throw new Error("Submit failed");
        return res.json();
      })
      .then(function (data) {
        if (!data.ok) throw new Error(data.reason || "Submit failed");
        if (typeof gtag === "function") {
          gtag("event", "listing_submitted", { form: "stage2_listing_form" });
        }
        if (typeof fbq === "function") {
          fbq("trackCustom", "ListingSubmitted");
        }
        window.location.href = "thankyou.html";
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Listing for Verification";
        statusEl.className = "form-status failure";
        statusEl.textContent = "Something went wrong. Please try again in a moment.";
      });
  });
})();
