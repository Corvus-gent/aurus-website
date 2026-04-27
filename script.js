// FAQ Data - loaded from external JSON, with fallback data
const FAQ_DATA = {
  faq: [
    {
      id: 1,
      question: "Hoe snel krijg ik antwoord op mijn vraag?",
      answer:
        "Wij behandelen alle vragen zo snel mogelijk. Dringende zaken behandelen wij met voorrang.",
    },
    {
      id: 2,
      question: "Hoe wordt een algemene vergadering georganiseerd?",
      answer:
        "Wij plannen de vergadering, verzenden uitnodigingen, bereiden de agenda voor en stellen het verslag op. U hoeft enkel aanwezig te zijn.",
    },
    {
      id: 3,
      question: "Wat is het verschil tussen syndicus en rentmeesterschap?",
      answer:
        "Een syndicus beheert mede-eigendommen (zoals appartementsgebouwen) en zorgt voor het gemeenschappelijk beheer. Een rentmeester beheert private eigendommen voor individuele eigenaars, inclusief huurdersopvolging en financiële afhandeling.",
    },
    {
      id: 4,
      question: "Voor wie zijn jullie diensten bedoeld?",
      answer:
        "Onze diensten zijn bedoeld voor eigenaars van mede-eigendommen, private vastgoedeigenaars, en iedereen die professioneel beheer van hun vastgoed wenst in Oost- en West-Vlaanderen.",
    },
    {
      id: 5,
      question:
        "Hoe transparant is de financiële en administratieve opvolging?",
      answer:
        "Wij bieden volledige transparantie via duidelijke rapportages, online toegang tot documenten, en regelmatige updates over alle financiële en administratieve zaken van uw eigendom.",
    },
    {
      id: 6,
      question:
        "Kan ik ook beroep doen op jullie voor een specifieke opdracht?",
      answer:
        "Ja, naast volledig beheer bieden wij ook flexibele dienstverlening voor specifieke opdrachten. Contacteer ons om uw situatie te bespreken en een oplossing op maat te vinden.",
    },
  ],
};

// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".nav");
  const header = document.querySelector(".header");

  if (hamburger && nav) {
    hamburger.addEventListener("click", function () {
      hamburger.classList.toggle("active");
      nav.classList.toggle("active");
    });

    // Close menu when clicking on a nav link
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", function () {
        hamburger.classList.remove("active");
        nav.classList.remove("active");
      });
    });
  }

  // Load FAQ from JSON
  loadFAQ();

  // Initialize dropdown menu
  initDropdownMenu();

  // Initialize form overlays
  initFormOverlays();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  // Header scroll effect
  window.addEventListener("scroll", function () {
    if (window.scrollY > 100) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Form submission handling
  const contactForm = document.querySelector("#contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(contactForm);
      const name = formData.get("name");
      const email = formData.get("email");
      const message = formData.get("message");

      // Basic validation
      if (name && email && message) {
        // Here you would typically send the data to a server
        alert("Bedankt voor uw bericht! We nemen spoedig contact met u op.");
        contactForm.reset();
      }
    });
  }

  // Animate elements on scroll
  observeElements();
});

// ============================================
// DROPDOWN MENU FUNCTIONALITY
// ============================================
function initDropdownMenu() {
  const navDropdown = document.querySelector(".nav-dropdown");
  const dropdownBtn = document.querySelector(".nav-btn-dropdown");

  if (!navDropdown || !dropdownBtn) return;

  // For mobile: toggle on click
  dropdownBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Check if mobile
    if (window.innerWidth <= 992) {
      navDropdown.classList.toggle("active");
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!navDropdown.contains(e.target)) {
      navDropdown.classList.remove("active");
    }
  });
}

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

// ============================================
// FAQ FUNCTIONALITY
// ============================================

// Load FAQ items from JSON file (with fallback to embedded data)
async function loadFAQ() {
  const faqList = document.getElementById("faq-list");

  if (!faqList) return;

  try {
    // Try to fetch from JSON file first
    const response = await fetch("data/faq.json");
    if (!response.ok) throw new Error("Failed to load JSON");
    const data = await response.json();
    renderFAQ(data.faq);
  } catch (error) {
    console.log("Using fallback FAQ data");
    // Use embedded fallback data
    renderFAQ(FAQ_DATA.faq);
  }
}

// Render FAQ items to the DOM
function renderFAQ(faqItems) {
  const faqList = document.getElementById("faq-list");

  if (!faqList || !faqItems) return;

  faqList.innerHTML = faqItems
    .map((item) => {
      const number = String(item.id).padStart(2, "0");

      return `
            <div class="faq-item" data-faq-id="${item.id}">
                <button class="faq-question" aria-expanded="false">
                    <span class="faq-number">${number}</span>
                    <span class="faq-text">${item.question}</span>
                    <span class="faq-icon">
                        <svg width="24" height="8" viewBox="0 0 24 8" fill="none">
                            <path d="M1 4H23M23 4L20 1M23 4L20 7" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </span>
                </button>
                <div class="faq-answer">
                    <p>${item.answer}</p>
                </div>
            </div>
        `;
    })
    .join("");

  // Add click handlers for accordion functionality
  initFAQAccordion();
}

// Initialize FAQ accordion functionality
function initFAQAccordion() {
  const faqItems = document.querySelectorAll(".faq-question");

  faqItems.forEach((item) => {
    item.addEventListener("click", function () {
      const parent = this.parentElement;
      const isActive = parent.classList.contains("active");

      // Close all other items
      document.querySelectorAll(".faq-item").forEach((faq) => {
        faq.classList.remove("active");
        faq
          .querySelector(".faq-question")
          .setAttribute("aria-expanded", "false");
      });

      // Toggle current item
      if (!isActive) {
        parent.classList.add("active");
        this.setAttribute("aria-expanded", "true");
      }
    });
  });
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

// Intersection Observer for scroll animations
function observeElements() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-in");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    },
  );

  // Observe service cards and other elements
  document
    .querySelectorAll(".service-card, .principle-item, .location-details")
    .forEach((el) => {
      el.style.opacity = "0";
      observer.observe(el);
    });
}

