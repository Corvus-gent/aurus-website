// ============================================
// FORM OVERLAY FUNCTIONALITY
// ============================================
function initFormOverlays() {
  const overlay = document.getElementById("form-overlay");
  const closeBtn = document.getElementById("form-close");
  const backdrop = document.querySelector(".form-overlay-backdrop");
  // Select all elements with data-form attribute (dropdown links and intro button)
  const formTriggers = document.querySelectorAll("[data-form]");
  const successClose = document.getElementById("success-close");

  if (!overlay) return;

  // Open form when clicking any element with data-form attribute
  formTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      const formType = this.dataset.form;
      openFormOverlay(formType);

      // Close dropdown and mobile nav
      const navDropdown = document.querySelector(".nav-dropdown");
      const hamburger = document.querySelector(".hamburger");
      const nav = document.querySelector(".nav");

      if (navDropdown) navDropdown.classList.remove("active");
      if (hamburger) hamburger.classList.remove("active");
      if (nav) nav.classList.remove("active");
    });
  });

  // Close overlay
  if (closeBtn) {
    closeBtn.addEventListener("click", closeFormOverlay);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeFormOverlay);
  }

  if (successClose) {
    successClose.addEventListener("click", closeFormOverlay);
  }

  // Close on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("active")) {
      closeFormOverlay();
    }
  });

  // Handle form submissions
  const overlayForms = document.querySelectorAll(".overlay-form");
  overlayForms.forEach((form) => {
    form.addEventListener("submit", handleFormSubmit);
  });

  // Handle radio buttons for conditional fields (sleutel & label forms)
  initConditionalFields();

  // Handle file upload display
  initFileUploads();
}

function openFormOverlay(formType) {
  const overlay = document.getElementById("form-overlay");
  const forms = document.querySelectorAll(".overlay-form");
  const success = document.getElementById("form-success");

  // Hide all forms and success message
  forms.forEach((form) => form.classList.remove("active"));
  if (success) success.classList.remove("active");

  // Show selected form
  const targetForm = document.getElementById(`form-${formType}`);
  if (targetForm) {
    targetForm.classList.add("active");
  }

  // Show overlay
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeFormOverlay() {
  const overlay = document.getElementById("form-overlay");
  const forms = document.querySelectorAll(".overlay-form");
  const success = document.getElementById("form-success");

  overlay.classList.remove("active");
  document.body.style.overflow = "";

  // Reset forms after animation
  setTimeout(() => {
    forms.forEach((form) => {
      form.classList.remove("active");
      form.reset();
    });
    if (success) success.classList.remove("active");

    // Reset conditional fields
    const sleutelAdres = document.getElementById("sleutel-adres");
    const labelAdres = document.getElementById("label-adres");
    if (sleutelAdres) sleutelAdres.style.display = "none";
    if (labelAdres) labelAdres.style.display = "none";
  }, 300);
}

function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Here you would typically send the data to a server
  // For now, we'll just show the success message

  console.log("Form submitted:", Object.fromEntries(formData));

  // Hide current form and show success
  form.classList.remove("active");
  const success = document.getElementById("form-success");
  if (success) {
    success.classList.add("active");
  }
}

function initConditionalFields() {
  // Sleutel form - show address field when "post" is selected
  const sleutelRadios = document.querySelectorAll(
    '#form-sleutel input[name="levering"]',
  );
  const sleutelAdres = document.getElementById("sleutel-adres");

  sleutelRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (sleutelAdres) {
        sleutelAdres.style.display = this.value === "post" ? "block" : "none";
      }
    });
  });

  // Label form - show address field when "post" is selected
  const labelRadios = document.querySelectorAll(
    '#form-label input[name="levering"]',
  );
  const labelAdres = document.getElementById("label-adres");

  labelRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (labelAdres) {
        labelAdres.style.display = this.value === "post" ? "block" : "none";
      }
    });
  });
}

function initFileUploads() {
  const fileInputs = document.querySelectorAll(
    '.file-upload input[type="file"]',
  );

  fileInputs.forEach((input) => {
    input.addEventListener("change", function () {
      const textSpan = this.nextElementSibling;
      if (this.files.length > 0) {
        if (this.files.length === 1) {
          textSpan.textContent = this.files[0].name;
        } else {
          textSpan.textContent = `${this.files.length} bestanden geselecteerd`;
        }
        textSpan.style.color = "var(--color-black)";
      } else {
        textSpan.textContent = this.multiple
          ? "Bestanden kiezen"
          : "Bestand kiezen";
        textSpan.style.color = "";
      }
    });
  });
}

