/**
 * QuickResolve Client-Side Helpers
 * Handles password toggles, form validation feedback, proof image upload preview,
 * and safe modal population (using textContent to prevent XSS).
 */
(function () {
  "use strict";

  // 1. Bootstrap form validation
  document.querySelectorAll(".needs-validation").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add("was-validated");
    });
  });

  // 2. Password visibility toggles
  document.querySelectorAll("[data-toggle-password]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetId = btn.getAttribute("data-toggle-password");
      var input = document.getElementById(targetId);
      if (!input) return;
      var icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        if (icon) {
          icon.classList.remove("bi-eye");
          icon.classList.add("bi-eye-slash");
        }
      } else {
        input.type = "password";
        if (icon) {
          icon.classList.remove("bi-eye-slash");
          icon.classList.add("bi-eye");
        }
      }
    });
  });

  // 3. Submit Complaint Page: Proof Image Preview & Size/Type Check
  var proofInput = document.getElementById("proofImage");
  if (proofInput) {
    proofInput.addEventListener("change", function () {
      var previewWrapper = document.getElementById("proofPreviewWrapper");
      var previewImg = document.getElementById("proofPreviewImg");
      var fileNameLabel = document.getElementById("proofFileName");
      var errorBox = document.getElementById("proofClientError");

      if (errorBox) {
        errorBox.classList.add("d-none");
        errorBox.textContent = "";
      }

      var file = proofInput.files && proofInput.files[0];
      if (!file) {
        if (previewWrapper) previewWrapper.classList.add("d-none");
        return;
      }

      var allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (allowedTypes.indexOf(file.type) === -1) {
        proofInput.value = "";
        if (previewWrapper) previewWrapper.classList.add("d-none");
        if (errorBox) {
          errorBox.textContent = "Only JPG, PNG, WEBP, or GIF images are allowed.";
          errorBox.classList.remove("d-none");
        }
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        proofInput.value = "";
        if (previewWrapper) previewWrapper.classList.add("d-none");
        if (errorBox) {
          errorBox.textContent = "Image file must be 5 MB or smaller.";
          errorBox.classList.remove("d-none");
        }
        return;
      }

      var reader = new FileReader();
      reader.onload = function (ev) {
        if (previewImg && ev.target && typeof ev.target.result === "string") {
          previewImg.src = ev.target.result;
        }
        if (fileNameLabel) {
          fileNameLabel.textContent = file.name + " (" + Math.round(file.size / 1024) + " KB)";
        }
        if (previewWrapper) {
          previewWrapper.classList.remove("d-none");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // 4. Complaint Detail Modal loader (Student & Admin)
  document.querySelectorAll("[data-view-complaint]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-detail-url");
      if (!url) return;

      fetch(url, { headers: { "Accept": "application/json" } })
        .then(function (resp) {
          if (!resp.ok) throw new Error("Failed to load complaint details");
          return resp.json();
        })
        .then(function (data) {
          var c = data.complaint;
          if (!c) return;

          setText("detailFormattedId", data.formattedId || ("QR-" + c.id));
          setText("detailTitle", c.title);
          setText("detailCategory", c.category);
          setText("detailDescription", c.description);
          setText("detailCreated", formatTimestamp(c.createdAt));
          setText("detailUpdated", formatTimestamp(c.updatedAt));
          setText("detailRemarks", c.adminRemarks || "No administrative remarks yet.");

          var statusBadge = document.getElementById("detailStatusBadge");
          if (statusBadge) {
            statusBadge.textContent = c.status;
            statusBadge.className = "badge-status " + statusClass(c.status);
          }

          var studentRow = document.getElementById("detailStudentRow");
          if (studentRow) {
            setText("detailStudentName", c.studentName || "");
            setText("detailStudentEmail", c.studentEmail || "");
          }

          var proofSection = document.getElementById("detailProofSection");
          var proofEmpty = document.getElementById("detailProofEmpty");
          var proofImg = document.getElementById("detailProofImg");
          var proofLink = document.getElementById("detailProofLink");

          if (data.proofUrl && proofImg) {
            proofImg.src = data.proofUrl;
            if (proofLink) proofLink.href = data.proofUrl;
            if (proofSection) proofSection.classList.remove("d-none");
            if (proofEmpty) proofEmpty.classList.add("d-none");
          } else {
            if (proofImg) proofImg.removeAttribute("src");
            if (proofSection) proofSection.classList.add("d-none");
            if (proofEmpty) proofEmpty.classList.remove("d-none");
          }

          var modalEl = document.getElementById("complaintDetailModal");
          if (modalEl && window.bootstrap) {
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
          }
        })
        .catch(function (err) {
          console.error(err);
        });
    });
  });

  // 5. Admin: Populate Update Status Modal
  document.querySelectorAll("[data-edit-status]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setVal("statusComplaintId", btn.getAttribute("data-id"));
      setText("statusComplaintCode", btn.getAttribute("data-code"));
      setText("statusComplaintTitle", btn.getAttribute("data-title"));
      setVal("statusSelect", btn.getAttribute("data-status"));
      setVal("adminRemarksInput", btn.getAttribute("data-remarks") || "");
    });
  });

  // 6. Admin: Populate Delete Confirmation Modal
  document.querySelectorAll("[data-delete-complaint]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setVal("deleteComplaintId", btn.getAttribute("data-id"));
      setText("deleteComplaintCode", btn.getAttribute("data-code"));
      setText("deleteComplaintTitle", btn.getAttribute("data-title"));
    });
  });

  // 7. Google OAuth 2.0 Sign-In popup handler
  var googleBtn = document.querySelector("[data-google-signin]");
  if (googleBtn) {
    googleBtn.addEventListener("click", function () {
      var endpoint = googleBtn.getAttribute("data-auth-url");
      var errBox = document.getElementById("googleAuthError");
      if (errBox) {
        errBox.classList.add("d-none");
        errBox.textContent = "";
      }
      if (!endpoint) return;

      fetch(endpoint, { headers: { "Accept": "application/json" } })
        .then(function (resp) {
          return resp.json();
        })
        .then(function (data) {
          if (!data || !data.configured || !data.url) {
            if (errBox) {
              errBox.textContent = (data && data.message)
                ? data.message
                : "Google Sign-In is not configured on this server.";
              errBox.classList.remove("d-none");
            }
            return;
          }
          var w = 520;
          var h = 620;
          var left = Math.max(0, (window.screen.width - w) / 2);
          var top = Math.max(0, (window.screen.height - h) / 2);
          var popup = window.open(
            data.url,
            "quickresolve_google_oauth",
            "width=" + w + ",height=" + h + ",left=" + left + ",top=" + top + ",noopener=no"
          );
          if (!popup) {
            window.location.href = data.url;
          }
        })
        .catch(function () {
          if (errBox) {
            errBox.textContent = "Unable to start Google Sign-In. Please check your connection.";
            errBox.classList.remove("d-none");
          }
        });
    });

    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin || !event.data) return;
      if (event.data.type === "GOOGLE_AUTH_SUCCESS" && event.data.redirectUrl) {
        window.location.href = event.data.redirectUrl;
      } else if (event.data.type === "GOOGLE_AUTH_ERROR") {
        var errBox = document.getElementById("googleAuthError");
        if (errBox) {
          errBox.textContent = event.data.error || "Google Sign-In failed.";
          errBox.classList.remove("d-none");
        }
      }
    });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value != null ? value : "";
  }

  function setVal(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value != null ? value : "";
  }

  function statusClass(status) {
    if (status === "Resolved") return "badge-status-resolved";
    if (status === "In Progress") return "badge-status-progress";
    return "badge-status-pending";
  }

  function formatTimestamp(ts) {
    if (!ts) return "N/A";
    try {
      return new Date(ts).toLocaleString();
    } catch (e) {
      return String(ts);
    }
  }
})();
