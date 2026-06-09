import React, { useEffect, useMemo, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import faqData from "../data/faq.json";

import logo from "../resources/logo.png";
import heroImage from "../resources/Hero.png";
import quoteImage from "../resources/2nd.png";
import principlesImage from "../resources/3rd.png";
import serviceTechImage from "../resources/4th.png";
import serviceAdminImage from "../resources/5th.png";
import serviceFinanceImage from "../resources/6th.png";

const requestTypes = [
  { id: "sleutel", label: "Aanvraag Sleutel" },
  { id: "handzender", label: "Aanvraag Handzender" },
  { id: "label", label: "Aanvraag Label/Parlefoon/Brievenbus" },
  { id: "documenten", label: "Aanvraag Documenten" },
  { id: "adreswijziging", label: "Adreswijziging" },
  { id: "defect", label: "Melding Defect" },
  { id: "terugbetaling", label: "Terugbetaling Onkosten" },
];

const services = [
  {
    title: "Technisch Beheer",
    image: serviceTechImage,
    alt: "Modern building exterior",
    text: "Van routineonderhoud tot grote renovaties-wij coordineren alle technische aspecten van uw gebouw met zorg en expertise. U bent zeker van wettelijke correctheid, duidelijke communicatie en een gebouw dat zijn waarde behoudt.",
  },
  {
    title: "Administratief Beheer",
    image: serviceAdminImage,
    alt: "Building facade",
    text: "Opstellen en beheren van begrotingen, jaarrekeningen en financiele verslaggeving, verzekeringen en juridisch advies, algemene vergaderingen en besluitvorming. Wij nemen de administratieve last van u over.",
  },
  {
    title: "Financieel Beheer",
    image: serviceFinanceImage,
    alt: "Interior design",
    text: "Transparant beheer van uw middelen met gedetailleerde rapportages en overzichtelijke financiele planning. Wij beheren uw vastgoed alsof het ons eigen patrimonium is.",
  },
];

const emailConfig = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  sendAttachments: import.meta.env.VITE_EMAILJS_SEND_ATTACHMENTS === "true",
  sendImagePreviews: import.meta.env.VITE_EMAILJS_SEND_IMAGE_PREVIEWS !== "false",
};

const recaptchaSiteKey =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const emailFieldLabels = {
  aantal: "Aantal",
  achternaam: "Achternaam",
  adres: "Adres",
  andere_documenten: "Andere documenten",
  bedrag: "Bedrag",
  beschrijving: "Beschrijving",
  documenten: "Documenten",
  email: "E-mail",
  factuur: "Factuur/bon",
  form_title: "Formulier",
  foto_brievenbus: "Foto brievenbussen",
  foto_parlofoon: "Foto parlofoon inkom",
  fotos: "Foto's",
  gebouw: "Naam van het gebouw",
  gsm: "GSM",
  huidig_adres: "Huidig adres",
  iban: "IBAN rekeningnummer",
  ingangsdatum: "Ingangsdatum",
  levering: "Levering",
  locatie: "Locatie",
  message: "Bericht",
  name: "Naam",
  nieuw_adres: "Nieuw adres",
  onderwerp: "Onderwerp",
  opmerkingen: "Opmerkingen",
  page_url: "Pagina",
  phone: "Telefoon",
  reden: "Reden",
  subject: "Onderwerp",
  submitted_at: "Verzonden op",
  urgentie: "Urgentie",
  vraag: "Vraag",
  voornaam: "Voornaam",
  voorvoegsel: "Voorvoegsel",
};

const emailHiddenFields = [
  "form_title",
  "form_key",
  "g-recaptcha-response",
  "recaptcha_token",
  "from_name",
  "reply_to",
  "subject_line",
  "form_summary",
  "attachment_summary",
  "image_preview_html",
  "page_url",
  "submitted_at",
  "website",
];

const maxAttachmentBytes = Number(import.meta.env.VITE_EMAILJS_MAX_ATTACHMENT_BYTES || 10 * 1024 * 1024);
const maxPreviewVariableBytes = Number(import.meta.env.VITE_EMAILJS_MAX_PREVIEW_BYTES || 40 * 1024);

function formatEmailLabel(name) {
  return emailFieldLabels[name] || name.replaceAll("_", " ");
}

function getFormValue(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formatFormValue(value) {
  if (value instanceof File) {
    return value.name || "";
  }

  return String(value).trim();
}

let recaptchaScriptPromise;

function loadRecaptchaScript() {
  if (window.grecaptcha) return Promise.resolve(window.grecaptcha);

  if (!recaptchaScriptPromise) {
    recaptchaScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById("google-recaptcha-script");

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.grecaptcha), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "google-recaptcha-script";
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaSiteKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.grecaptcha);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return recaptchaScriptPromise;
}

async function getRecaptchaToken(action) {
  if (!recaptchaSiteKey) {
    throw new Error("VITE_RECAPTCHA_SITE_KEY ontbreekt.");
  }

  const grecaptcha = await loadRecaptchaScript();

  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(recaptchaSiteKey, { action })
        .then(resolve)
        .catch(reject);
    });
  });
}

async function validateCaptcha(form, action) {
  const honeypot = form.elements.website?.value.trim();

  if (honeypot) {
    return { ok: false, silent: true };
  }

  try {
    const token = await getRecaptchaToken(action.replaceAll("-", "_"));

    if (!token) {
      return { ok: false, message: "De beveiligingscontrole kon niet worden voltooid. Probeer opnieuw." };
    }

    return { ok: true, token };
  } catch (error) {
    console.error("Google reCAPTCHA kon niet worden uitgevoerd:", error);
    return { ok: false, message: "De beveiligingscontrole kon niet laden. Probeer later opnieuw." };
  }
}

function normalizeSubjectText(value) {
  return value.replaceAll("/", " en ").replace(/\s+/g, " ").trim();
}

function compactSubjectParts(parts) {
  return parts.map((part) => normalizeSubjectText(part)).filter(Boolean).join(" | ");
}

function buildSubjectLine(formData, formTitle) {
  const formKey = getFormValue(formData, "form_key");
  const building = getFormValue(formData, "gebouw");
  const firstName = getFormValue(formData, "voornaam");
  const lastName = getFormValue(formData, "achternaam");
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || getFormValue(formData, "name");
  const explicitSubject = getFormValue(formData, "subject") || getFormValue(formData, "onderwerp");
  const urgency = getFormValue(formData, "urgentie");
  const location = getFormValue(formData, "locatie");

  if (formKey === "contact-form") {
    return compactSubjectParts(["Contactformulier", explicitSubject || fullName]);
  }

  if (formKey === "form-algemeen") {
    return compactSubjectParts(["Algemene Vraag", explicitSubject, fullName || building]);
  }

  if (formKey === "form-defect") {
    return compactSubjectParts([
      urgency ? `Defect ${urgency.toUpperCase()}` : "Melding Defect",
      building,
      location,
    ]);
  }

  return compactSubjectParts([formTitle, building || fullName]);
}

async function buildEmailPayload(form, formTitle) {
  const formData = new FormData(form);
  formData.set("form_key", form.dataset.formKey || form.id);
  const fields = [];
  const attachments = [];
  const seenNames = new Set();
  let totalAttachmentBytes = 0;

  formData.forEach((_, name) => {
    if (seenNames.has(name) || emailHiddenFields.includes(name)) return;
    seenNames.add(name);

    const rawValues = formData.getAll(name);
    const fileValues = rawValues.filter((value) => value instanceof File && value.name);

    if (fileValues.length) {
      fileValues.forEach((file) => {
        totalAttachmentBytes += file.size;
        attachments.push(`${formatEmailLabel(name)}: ${file.name} (${formatBytes(file.size)})`);
      });
      return;
    }

    const values = rawValues.map(formatFormValue).filter(Boolean);

    if (!values.length) return;

    fields.push(`${formatEmailLabel(name)}: ${values.join(", ")}`);
  });

  const firstName = getFormValue(formData, "voornaam");
  const lastName = getFormValue(formData, "achternaam");
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const fromName = fullName || getFormValue(formData, "name") || "Website bezoeker";
  const replyTo = getFormValue(formData, "email");
  const subjectLine = buildSubjectLine(formData, formTitle);
  const imagePreviewHtml = emailConfig.sendImagePreviews
    ? await buildImagePreviewHtml(form, maxPreviewVariableBytes)
    : "";

  return {
    form_title: formTitle,
    from_name: fromName,
    reply_to: replyTo,
    subject_line: subjectLine,
    form_summary: fields.join("\n"),
    attachment_summary: attachments.join("\n") || "Geen bijlagen",
    image_preview_html: imagePreviewHtml,
    page_url: window.location.href,
    submitted_at: new Date().toLocaleString("nl-BE"),
    totalAttachmentBytes,
  };
}

async function buildImagePreviewHtml(form, maxBytes) {
  const imageFiles = Array.from(form.querySelectorAll('input[type="file"]'))
    .flatMap((input) => Array.from(input.files || []))
    .filter((file) => file.type.startsWith("image/"));

  if (!imageFiles.length) return "";

  const previews = [];
  let usedBytes = 0;

  for (const file of imageFiles.slice(0, 2)) {
    const remainingBytes = maxBytes - usedBytes;
    if (remainingBytes < 8 * 1024) break;

    const dataUrl = await createCompressedImageDataUrl(file, remainingBytes);
    if (!dataUrl) continue;

    usedBytes += dataUrl.length;
    previews.push(`
      <div style="margin:0 0 14px;">
        <p style="margin:0 0 6px;font-size:13px;color:#8a7f6f;">${escapeHtml(file.name)} - preview</p>
        <img src="${dataUrl}" alt="${escapeHtml(file.name)}" style="display:block;max-width:220px;width:100%;height:auto;border:1px solid #ded8cd;border-radius:6px;" />
      </div>
    `);
  }

  return previews.join("");
}

async function createCompressedImageDataUrl(file, maxBytes) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return "";

  const attempts = [
    { width: 220, quality: 0.5 },
    { width: 180, quality: 0.42 },
    { width: 140, quality: 0.35 },
    { width: 110, quality: 0.3 },
  ];

  for (const attempt of attempts) {
    const scale = Math.min(1, attempt.width / image.naturalWidth);
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", attempt.quality);
    if (dataUrl.length <= maxBytes) return dataUrl;
  }

  return "";
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Afbeelding kon niet geladen worden."));
    };
    image.src = objectUrl;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function appendHiddenField(form, name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}

function buildEmailJsForm(sourceForm, templatePayload) {
  if (emailConfig.sendAttachments) {
    Object.entries(templatePayload).forEach(([name, value]) => {
      let input = sourceForm.querySelector(`input[name="${name}"]`);
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        sourceForm.appendChild(input);
      }
      input.value = value;
    });

    return sourceForm;
  }

  const emailForm = document.createElement("form");

  new FormData(sourceForm).forEach((value, name) => {
    if (emailHiddenFields.includes(name) || value instanceof File) return;
    appendHiddenField(emailForm, name, value);
  });

  Object.entries(templatePayload).forEach(([name, value]) => {
    appendHiddenField(emailForm, name, value);
  });

  return emailForm;
}

function ArrowIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <path d="M1 1L11 7L1 13" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ButtonArrow({ light = false }) {
  return (
    <span className={`btn-circle${light ? " btn-circle-light" : ""}`}>
      <ArrowIcon />
    </span>
  );
}

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [overlayForm, setOverlayForm] = useState(null);
  const [overlaySuccess, setOverlaySuccess] = useState(false);
  const [legalPanel, setLegalPanel] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(null);

  useEffect(() => {
    if (emailConfig.publicKey) {
      emailjs.init({ publicKey: emailConfig.publicKey });
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = overlayForm || overlaySuccess || legalPanel ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayForm, overlaySuccess, legalPanel]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") closeOverlay();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    document
      .querySelectorAll(".service-card, .principle-item, .location-details")
      .forEach((element) => {
        element.style.opacity = "0";
        observer.observe(element);
      });

    return () => observer.disconnect();
  }, []);

  const openOverlay = (formType) => {
    setOverlayForm(formType);
    setOverlaySuccess(false);
    setMobileNavOpen(false);
    setMobileDropdownOpen(false);
  };

  const closeOverlay = () => {
    setOverlayForm(null);
    setOverlaySuccess(false);
    setLegalPanel(null);
  };

  const scrollToSection = (event, href) => {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
    setMobileNavOpen(false);
    setMobileDropdownOpen(false);
  };

  const submitForm = async (event, formTitle) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formKey = form.dataset.formKey || form.id;
    setSubmittingForm(formKey);

    const captcha = await validateCaptcha(form, formKey);

    if (!captcha.ok) {
      if (captcha.silent) {
        form.reset();
        setOverlaySuccess(true);
      } else {
        alert(captcha.message);
      }
      setSubmittingForm(null);
      return;
    }

    if (!emailConfig.publicKey || !emailConfig.serviceId || !emailConfig.templateId) {
      console.warn("EmailJS env variabelen ontbreken. Formulier is niet verzonden.");
      alert("Email is nog niet geconfigureerd. Vul de EmailJS waarden in .env in.");
      setSubmittingForm(null);
      return;
    }

    const emailPayload = await buildEmailPayload(form, formTitle);

    if (emailPayload.totalAttachmentBytes > maxAttachmentBytes) {
      alert(
        `De geselecteerde bestanden zijn samen ${formatBytes(emailPayload.totalAttachmentBytes)}. ` +
          `De limiet voor EmailJS is ingesteld op ${formatBytes(maxAttachmentBytes)}. ` +
          "Kies kleinere bestanden of verstuur uw aanvraag zonder bijlage.",
      );
      setSubmittingForm(null);
      return;
    }

    const { totalAttachmentBytes, ...templatePayload } = emailPayload;
    templatePayload.recaptcha_token = captcha.token;

    const emailForm = buildEmailJsForm(form, templatePayload);

    try {
      await emailjs.sendForm(emailConfig.serviceId, emailConfig.templateId, emailForm);
      form.reset();
      setOverlaySuccess(true);
    } catch (error) {
      console.error("Email verzenden mislukt:", error);
      alert("Er ging iets mis bij het verzenden. Probeer later opnieuw.");
    } finally {
      setSubmittingForm(null);
    }
  };

  return (
    <>
      <Header
        scrolled={scrolled}
        mobileNavOpen={mobileNavOpen}
        mobileDropdownOpen={mobileDropdownOpen}
        setMobileNavOpen={setMobileNavOpen}
        setMobileDropdownOpen={setMobileDropdownOpen}
        openOverlay={openOverlay}
        scrollToSection={scrollToSection}
      />
      <main>
        <Hero scrollToSection={scrollToSection} />
        <QuoteBanner />
        <Principles />
        <Services scrollToSection={scrollToSection} />
        <Faq activeFaq={activeFaq} setActiveFaq={setActiveFaq} scrollToSection={scrollToSection} />
        <Location />
        <Contact openOverlay={openOverlay} scrollToSection={scrollToSection} submitForm={submitForm} submittingForm={submittingForm} />
      </main>
      <Footer scrollToSection={scrollToSection} openLegal={setLegalPanel} />
      <LegalOverlay activePanel={legalPanel} onClose={() => setLegalPanel(null)} />
      <FormOverlay
        activeForm={overlayForm}
        success={overlaySuccess}
        onClose={closeOverlay}
        submitForm={submitForm}
        submittingForm={submittingForm}
      />
    </>
  );
}

function Header({
  scrolled,
  mobileNavOpen,
  mobileDropdownOpen,
  setMobileNavOpen,
  setMobileDropdownOpen,
  openOverlay,
  scrollToSection,
}) {
  return (
    <header className={`header${scrolled ? " scrolled" : ""}`}>
      <div className="header-container">
        <a href="#hero" className="logo" onClick={(event) => scrollToSection(event, "#hero")}>
          <img src={logo} alt="Aurus logo" className="logo-img" />
          <span className="logo-text">Aurus</span>
        </a>
        <nav className={`nav${mobileNavOpen ? " active" : ""}`}>
          <a href="#services" className="nav-btn" onClick={(event) => scrollToSection(event, "#services")}>
            DIENSTEN
          </a>
          <a href="#about" className="nav-btn" onClick={(event) => scrollToSection(event, "#about")}>
            OVER ONS
          </a>
          <div className={`nav-dropdown${mobileDropdownOpen ? " active" : ""}`}>
            <button
              className="nav-btn nav-btn-dropdown"
              type="button"
              onClick={() => setMobileDropdownOpen((open) => !open)}
            >
              AANVRAGEN
              <svg className="dropdown-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <div className="dropdown-menu">
              <div className="dropdown-inner">
                <div className="dropdown-intro">
                  <h3>Aanvragen</h3>
                  <p>
                    Dien snel en eenvoudig uw aanvragen in via onze digitale formulieren. Wij verwerken uw verzoek zo snel mogelijk.
                  </p>
                  <button className="btn btn-primary btn-small" type="button" onClick={() => openOverlay("algemeen")}>
                    <span>Algemene Vraag</span>
                  </button>
                </div>
                <div className="dropdown-links">
                  {[requestTypes.slice(0, 4), requestTypes.slice(4)].map((column, index) => (
                    <div className="dropdown-column" key={index}>
                      {column.map((item) => (
                        <button className="dropdown-link" type="button" key={item.id} onClick={() => openOverlay(item.id)}>
                          <span>{item.label}</span>
                          <ChevronIcon />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <a href="#contact" className="nav-btn" onClick={(event) => scrollToSection(event, "#contact")}>
            CONTACT
          </a>
        </nav>
        <button
          className={`hamburger${mobileNavOpen ? " active" : ""}`}
          aria-label="Menu"
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}

function Hero({ scrollToSection }) {
  return (
    <div className="fullscreen-stack-container">
      <section id="hero" className="hero fullscreen-stack-section">
        <div className="hero-bg">
          <img src={heroImage} alt="Modern building architecture" />
        </div>
        <div className="hero-content">
          <h1>
            Uw vertrouwde partner in <em>vastgoedbeheer</em>
          </h1>
          <p className="hero-subtitle">
            Transparant, professioneel en persoonlijk. Aurus biedt moderne syndicusdiensten die verder gaan dan administratie - wij zijn uw partner in het beheer en onderhoud van uw eigendom.
          </p>
          <a href="#contact" className="btn btn-primary" onClick={(event) => scrollToSection(event, "#contact")}>
            <span>CONTACTEER ONS</span>
            <ButtonArrow />
          </a>
        </div>
      </section>
      <section id="about" className="about fullscreen-stack-section fullscreen-stack-overlay">
        <div className="about-container">
          <div className="about-left">
            <h2>
              Wie Zijn <em>Wij?</em>
            </h2>
            <a href="#contact" className="btn btn-primary" onClick={(event) => scrollToSection(event, "#contact")}>
              <span>CONTACTEER ONS</span>
              <ButtonArrow />
            </a>
          </div>
          <div className="about-right">
            <p>
              Aurus Syndicus staat voor een moderne en persoonlijke benadering van vastgoedbeheer. Wij combineren jarenlange expertise met hedendaagse technologie om u de best mogelijke service te bieden. Of u nu eigenaar bent van een appartement of een volledige residentie beheert, wij zorgen voor uw zorgen.
            </p>
            <ul className="values-list">
              <li><strong>Transparantie:</strong> Heldere communicatie over alle aspecten van uw gebouw</li>
              <li><strong>Bereikbaarheid:</strong> Altijd een aanspreekpunt voor uw vragen</li>
              <li><strong>Professionaliteit:</strong> Grondige kennis van vastgoedwetgeving en -beheer</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuoteBanner() {
  return (
    <section className="quote-banner">
      <div className="quote-bg">
        <img src={quoteImage} alt="Modern architecture detail" />
      </div>
      <div className="quote-content">
        <h2>De details zijn voor ons. De rust is voor u.</h2>
      </div>
    </section>
  );
}

function Principles() {
  return (
    <section className="principles">
      <div className="principles-container">
        <div className="principles-grid">
          <div className="principle-item">
            <h3>Transparantie</h3>
            <p>Heldere communicatie over alle aspecten van uw gebouw. U weet altijd precies waar u aan toe bent met overzichtelijke rapportages en duidelijke financiele verslaggeving.</p>
          </div>
          <div className="principle-item">
            <h3>Bereikbaarheid</h3>
            <p>Altijd een aanspreekpunt voor uw vragen. Wij behandelen alle vragen zo snel mogelijk. Dringende zaken behandelen wij met voorrang.</p>
          </div>
          <div className="principles-title">
            <h2>Onze Waarden.</h2>
          </div>
          <div className="principle-item">
            <h3>Professionaliteit</h3>
            <p>Grondige kennis van vastgoedwetgeving en -beheer. Wij combineren jarenlange expertise met hedendaagse technologie om u de best mogelijke service te bieden.</p>
          </div>
        </div>
        <div className="principles-image">
          <img src={principlesImage} alt="Modern building" />
        </div>
      </div>
    </section>
  );
}

function Services({ scrollToSection }) {
  return (
    <section id="services" className="services">
      <h2 className="services-title">Onze Diensten.</h2>
      <div className="services-stack-container">
        {services.map((service, index) => (
          <div className="service-card service-card-stack" data-card-index={index} key={service.title}>
            <div className="service-image">
              <img src={service.image} alt={service.alt} />
            </div>
            <div className="service-content">
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <div className="service-footer">
                <span className="service-number">{index + 1}/3</span>
                <a href="#contact" className="btn btn-outline" onClick={(event) => scrollToSection(event, "#contact")}>
                  <span>MEER INFO</span>
                  <ButtonArrow light />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq({ activeFaq, setActiveFaq, scrollToSection }) {
  return (
    <section className="faq">
      <h2 className="faq-title">Veelgestelde Vragen</h2>
      <div className="faq-list">
        {faqData.faq.map((item) => {
          const active = activeFaq === item.id;
          return (
            <div className={`faq-item${active ? " active" : ""}`} key={item.id}>
              <button
                className="faq-question"
                aria-expanded={active}
                type="button"
                onClick={() => setActiveFaq(active ? null : item.id)}
              >
                <span className="faq-number">{String(item.id).padStart(2, "0")}</span>
                <span className="faq-text">{item.question}</span>
                <span className="faq-icon">
                  <svg width="24" height="8" viewBox="0 0 24 8" fill="none" aria-hidden="true">
                    <path d="M1 4H23M23 4L20 1M23 4L20 7" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              </button>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="faq-more">
        <a href="#contact" className="btn btn-outline" onClick={(event) => scrollToSection(event, "#contact")}>
          <span>Meer Vragen? Contacteer Ons</span>
        </a>
      </div>
    </section>
  );
}

function Location() {
  return (
    <section id="location" className="location">
      <div className="location-container">
        <h2>
          Hoe U Ons <em>Vindt</em>
        </h2>
        <div className="location-content">
          <div className="location-info">
            <h3>Routebeschrijving</h3>
            <p>Volg deze instructies om ons kantoor te bereiken:</p>
            <ul className="location-steps">
              <li><span className="step-number">1</span><span>Parkeer gratis in de ondergrondse parkeergarage Warande (Boomgaardstraat 13, 9880 Aalter)</span></li>
              <li><span className="step-number">2</span><span>Neem de trappen of de lift naar boven</span></li>
              <li><span className="step-number">3</span><span>Ga naar rechts en volg het gebouw</span></li>
              <li><span className="step-number">4</span><span>U komt aan bij kantoor 13 - Aurus Syndicus</span></li>
            </ul>
          </div>
          <div className="location-details">
            <h4>Kantooradres</h4>
            <p>Hof Van Praet 13</p>
            <p>9880 Aalter, Belgie</p>
            <div className="hours">
              <h4>Openingstijden</h4>
              <p>Maandag tot vrijdag: 9:00 - 17:00</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact({ openOverlay, scrollToSection, submitForm, submittingForm }) {
  return (
    <section id="contact" className="contact">
      <div className="contact-container">
        <h2>Contacteer Ons</h2>
        <p className="contact-subtitle">
          Heeft u een algemene vraag? Vul het formulier hieronder in. Voor specifieke aanvragen (sleutels, meldingen, etc.) kunt u gebruik maken van onze{" "}
          <span className="forms-dropdown-trigger">
            <a href="#" className="forms-dropdown-link" onClick={(event) => event.preventDefault()}>gespecialiseerde formulieren</a>
            <span className="forms-dropdown-menu">
              {requestTypes.map((item) => (
                <button className="forms-dropdown-item" type="button" key={item.id} onClick={() => openOverlay(item.id)}>
                  {item.label}
                </button>
              ))}
            </span>
          </span>.
        </p>
        <form className="contact-form" id="contact-form" data-form-key="contact-form" onSubmit={(event) => submitForm(event, "Contactformulier")}>
          <div className="form-group">
            <label htmlFor="name">NAAM:</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-MAIL:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">TELEFOON:</label>
            <input type="tel" id="phone" name="phone" />
          </div>
          <div className="form-group">
            <label htmlFor="subject">ONDERWERP:</label>
            <select id="subject" name="subject" required defaultValue="">
              <option value="">Selecteer een onderwerp</option>
              <option value="algemeen">Algemene vraag</option>
              <option value="offerte">Offerte aanvragen</option>
              <option value="informatie">Informatie over diensten</option>
              <option value="andere">Andere</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="message">BERICHT:</label>
            <textarea id="message" name="message" rows="3" required></textarea>
          </div>
          <CaptchaField />
          <button type="submit" className="btn btn-outline" disabled={submittingForm === "contact-form"}>
            <span>{submittingForm === "contact-form" ? "VERSTUREN..." : "VERZENDEN"}</span>
            <ButtonArrow light />
          </button>
        </form>
        <div className="contact-info-row">
          <div className="contact-info-item">
            <h4>Telefoon</h4>
            <p><a href="tel:+32093753949">+32 09 375 39 49</a></p>
          </div>
          <div className="contact-info-item">
            <h4>E-mail</h4>
            <p><a href="mailto:info@aurus.be">info@aurus.be</a></p>
          </div>
          <div className="contact-info-item">
            <h4>Adres</h4>
            <p>Hof Van Praet 13<br />9880 Aalter</p>
          </div>
        </div>
        <div className="emergency-note">
          <p><strong>Communicatie verloopt bij voorkeur via e-mail.</strong> Voor noodgevallen is er een noodnummer beschikbaar.</p>
        </div>
      </div>
    </section>
  );
}

const legalPanels = {
  privacy: {
    title: "Privacy Policy",
    items: [
      "Wij verwerken enkel gegevens die u zelf via onze formulieren bezorgt, zoals naam, e-mail, telefoonnummer, gebouwgegevens en uw bericht.",
      "Deze gegevens worden gebruikt om uw vraag of aanvraag te behandelen en worden niet verkocht of gedeeld voor marketingdoeleinden.",
      "Formulieren worden verzonden via EmailJS. Voor spambeperking gebruiken we Google reCAPTCHA v3.",
      "U kunt ons contacteren via info@aurus.be voor inzage, correctie of verwijdering van uw gegevens.",
    ],
  },
  terms: {
    title: "Algemene Voorwaarden",
    items: [
      "De informatie op deze website is algemeen en informatief.",
      "Aanvragen via de website worden pas bindend na bevestiging door Aurus Syndicus.",
      "Wij streven naar correcte informatie, maar behouden het recht om inhoud, diensten of prijzen te wijzigen.",
      "Voor concrete afspraken gelden de individuele communicatie en overeenkomsten met Aurus Syndicus.",
    ],
  },
  cookies: {
    title: "Cookie Policy",
    items: [
      "Deze website gebruikt geen tracking- of marketingcookies van onszelf.",
      "Google reCAPTCHA kan technische cookies of vergelijkbare opslag gebruiken om misbruik van formulieren te beperken.",
      "Google Fonts en reCAPTCHA kunnen uw browsergegevens verwerken volgens het beleid van Google.",
      "Door de website en formulieren te gebruiken, aanvaardt u deze noodzakelijke technische werking.",
    ],
  },
};

function Footer({ scrollToSection, openLegal }) {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-nav">
          <a href="#about" onClick={(event) => scrollToSection(event, "#about")}>OVER ONS</a>
          <a href="#services" onClick={(event) => scrollToSection(event, "#services")}>DIENSTEN</a>
          <a href="#contact" onClick={(event) => scrollToSection(event, "#contact")}>CONTACT</a>
        </div>
        <div className="footer-contact">
          <p>Hof Van Praet 13</p>
          <p>9880 AALTER</p>
          <p><a href="tel:+32093753949">+32 09 375 39 49</a></p>
          <p><a href="mailto:info@aurus.be">info@aurus.be</a></p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Aurus Syndicus | Alle rechten voorbehouden</p>
        <div className="footer-links">
          <button type="button" onClick={() => openLegal("privacy")}>Privacy Policy</button>
          <button type="button" onClick={() => openLegal("terms")}>Algemene Voorwaarden</button>
          <button type="button" onClick={() => openLegal("cookies")}>Cookie Policy</button>
        </div>
      </div>
    </footer>
  );
}

function LegalOverlay({ activePanel, onClose }) {
  const panel = activePanel ? legalPanels[activePanel] : null;

  return (
    <div className={`form-overlay${panel ? " active" : ""}`}>
      <button className="form-overlay-backdrop" type="button" aria-label="Sluiten" onClick={onClose}></button>
      <div className="form-modal">
        <button className="form-close" type="button" onClick={onClose} aria-label="Sluiten">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {panel && (
          <div className="legal-content">
            <h3>{panel.title}</h3>
            {panel.items.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormOverlay({ activeForm, success, onClose, submitForm, submittingForm }) {
  const activeDefinition = useMemo(() => formDefinitions.find((form) => form.id === activeForm), [activeForm]);

  return (
    <div className={`form-overlay${activeForm || success ? " active" : ""}`}>
      <button className="form-overlay-backdrop" type="button" aria-label="Sluiten" onClick={onClose}></button>
      <div className="form-modal">
        <button className="form-close" type="button" onClick={onClose} aria-label="Sluiten">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {activeDefinition && !success && (
          <OverlayForm definition={activeDefinition} submitForm={submitForm} submittingForm={submittingForm} />
        )}
        <div className={`form-success${success ? " active" : ""}`}>
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>Bedankt voor uw aanvraag!</h3>
          <p>Wij hebben uw aanvraag goed ontvangen en nemen zo snel mogelijk contact met u op.</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            <span>SLUITEN</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function OverlayForm({ definition, submitForm, submittingForm }) {
  const [delivery, setDelivery] = useState(definition.defaultDelivery || "");
  const formRef = useRef(null);
  const formKey = `form-${definition.id}`;

  useEffect(() => {
    setDelivery(definition.defaultDelivery || "");
    formRef.current?.reset();
  }, [definition.id, definition.defaultDelivery]);

  return (
    <form
      ref={formRef}
      className="overlay-form active"
      id={formKey}
      data-form-key={formKey}
      onSubmit={(event) => submitForm(event, definition.title)}
    >
      <h3>{definition.title}</h3>
      {definition.price && <p className="form-price">{definition.price}</p>}
      {definition.render({ delivery, setDelivery })}
      <CaptchaField />
      <button type="submit" className="btn btn-primary btn-full" disabled={submittingForm === formKey}>
        <span>{submittingForm === formKey ? "VERSTUREN..." : definition.submitLabel || "VERSTUREN"}</span>
        <ButtonArrow />
      </button>
    </form>
  );
}

function TextInput({ label, name, type = "text", required = false, placeholder, min, step, defaultValue }) {
  return (
    <div className="form-group">
      <label>{label}{required ? " *" : ""}</label>
      <input type={type} name={name} required={required} placeholder={placeholder} min={min} step={step} defaultValue={defaultValue} />
    </div>
  );
}

function TextArea({ label, name, required = false, rows = 3, placeholder }) {
  return (
    <div className="form-group">
      <label>{label}{required ? " *" : ""}</label>
      <textarea name={name} rows={rows} required={required} placeholder={placeholder}></textarea>
    </div>
  );
}

function CaptchaField() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function NameFields() {
  return (
    <div className="form-row">
      <TextInput label="Voornaam" name="voornaam" required />
      <TextInput label="Achternaam" name="achternaam" required />
    </div>
  );
}

function PhoneFields() {
  return (
    <div className="form-row">
      <div className="form-group form-group-small">
        <label>Voorvoegsel</label>
        <input type="text" name="voorvoegsel" placeholder="+32" />
      </div>
      <TextInput label="GSM" name="gsm" type="tel" required />
    </div>
  );
}

function DeliveryRadios({ name = "levering", value, setValue, options }) {
  return (
    <div className="form-group">
      <label>Maak uw keuze *</label>
      <div className="radio-group">
        {options.map((option) => (
          <label className="radio-label" key={option.value}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => setValue(option.value)}
              required
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FileUpload({ label, name, accept, multiple = false, required = false }) {
  const [labelText, setLabelText] = useState(multiple ? "Bestanden kiezen" : "Bestand kiezen");

  return (
    <div className="form-group">
      <label>{label}{required ? " *" : ""}</label>
      <div className="file-upload">
        <input
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          required={required}
          onChange={(event) => {
            const files = event.currentTarget.files;
            if (!files?.length) {
              setLabelText(multiple ? "Bestanden kiezen" : "Bestand kiezen");
            } else if (files.length === 1) {
              setLabelText(files[0].name);
            } else {
              setLabelText(`${files.length} bestanden geselecteerd`);
            }
          }}
        />
        <span className="file-upload-text">{labelText}</span>
      </div>
    </div>
  );
}

const formDefinitions = [
  {
    id: "sleutel",
    title: "Aanvraag Sleutel",
    price: "EUR 15.00 / aanvraag",
    defaultDelivery: "afhalen",
    render: ({ delivery, setDelivery }) => (
      <>
        <TextInput label="Naam van het gebouw" name="gebouw" required />
        <NameFields />
        <PhoneFields />
        <TextInput label="Email" name="email" type="email" required />
        <TextInput label="Aantal sleutels" name="aantal" type="number" min="1" defaultValue="1" required />
        <TextArea label="Reden aanvraag" name="reden" placeholder="Beschrijf kort waarom u een sleutel nodig heeft..." />
        <DeliveryRadios
          value={delivery}
          setValue={setDelivery}
          options={[
            { value: "afhalen", label: "Sleutels na bericht afhalen" },
            { value: "post", label: "Sleutels opsturen per post" },
          ]}
        />
        {delivery === "post" && <TextArea label="Opsturen naar adres" name="adres" rows={2} placeholder="Straat, nummer, postcode, gemeente" />}
      </>
    ),
  },
  {
    id: "adreswijziging",
    title: "Adreswijziging",
    render: () => (
      <>
        <TextInput label="Naam van het gebouw" name="gebouw" required />
        <NameFields />
        <TextInput label="Email" name="email" type="email" required />
        <TextArea label="Huidig adres" name="huidig_adres" rows={2} required placeholder="Straat, nummer, postcode, gemeente" />
        <TextArea label="Nieuw adres" name="nieuw_adres" rows={2} required placeholder="Straat, nummer, postcode, gemeente" />
        <TextInput label="Ingangsdatum" name="ingangsdatum" type="date" required />
        <TextArea label="Opmerkingen" name="opmerkingen" />
      </>
    ),
  },
  {
    id: "handzender",
    title: "Aanvraag Handzender",
    price: "Prijs op aanvraag",
    defaultDelivery: "afhalen",
    render: ({ delivery, setDelivery }) => (
      <>
        <TextInput label="Naam van het gebouw" name="gebouw" required />
        <NameFields />
        <PhoneFields />
        <TextInput label="Email" name="email" type="email" required />
        <TextInput label="Aantal handzenders" name="aantal" type="number" min="1" defaultValue="1" required />
        <DeliveryRadios
          value={delivery}
          setValue={setDelivery}
          options={[
            { value: "afhalen", label: "Handzender na bericht afhalen" },
            { value: "post", label: "Handzender opsturen per post" },
          ]}
        />
        {delivery === "post" && <TextArea label="Opsturen naar adres" name="adres" rows={2} placeholder="Straat, nummer, postcode, gemeente" />}
      </>
    ),
  },
  {
    id: "label",
    title: "Aanvraag Label Parlefoon/Brievenbus",
    price: "EUR 10.00 / aanvraag",
    defaultDelivery: "afhalen",
    render: ({ delivery, setDelivery }) => (
      <>
        <TextInput label="Naam van het gebouw" name="gebouw" required />
        <NameFields />
        <PhoneFields />
        <TextInput label="Email" name="email" type="email" required />
        <FileUpload label="Foto van geheel parlofoon inkom uploaden" name="foto_parlofoon" accept="image/*" />
        <FileUpload label="Foto van geheel brievenbussen uploaden" name="foto_brievenbus" accept="image/*" />
        <DeliveryRadios
          value={delivery}
          setValue={setDelivery}
          options={[
            { value: "afhalen", label: "Labels na bericht afhalen" },
            { value: "post", label: "Labels opsturen per post" },
          ]}
        />
        {delivery === "post" && <TextArea label="Labels opsturen per post naar?" name="adres" rows={2} placeholder="Straat, nummer, postcode, gemeente" />}
      </>
    ),
  },
  {
    id: "defect",
    title: "Melding Defect",
    submitLabel: "MELDEN",
    render: () => (
      <>
        <TextInput label="Naam van het gebouw" name="gebouw" required />
        <NameFields />
        <PhoneFields />
        <TextInput label="Email" name="email" type="email" required />
        <TextInput label="Locatie defect" name="locatie" required placeholder="Bijv. Lift, Garage, Gang 2e verdieping..." />
        <TextArea label="Beschrijving defect" name="beschrijving" rows={4} required placeholder="Beschrijf het probleem zo gedetailleerd mogelijk..." />
        <FileUpload label="Foto uploaden" name="fotos" accept="image/*" />
        <div className="form-group">
          <label>Urgentie *</label>
          <div className="radio-group">
            {["normaal", "dringend", "noodgeval"].map((value) => (
              <label className="radio-label" key={value}>
                <input type="radio" name="urgentie" value={value} defaultChecked={value === "normaal"} />
                <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>
      </>
    ),
  },
  {
    id: "terugbetaling",
    title: "Terugbetaling Onkosten",
    render: () => (
      <>
        <TextInput label="Naam van het gebouw" name="gebouw" required />
        <NameFields />
        <TextInput label="Email" name="email" type="email" required />
        <TextInput label="IBAN rekeningnummer" name="iban" required placeholder="BE00 0000 0000 0000" />
        <TextInput label="Bedrag terugbetaling (EUR)" name="bedrag" type="number" step="0.01" min="0" required />
        <TextArea label="Reden terugbetaling" name="reden" required placeholder="Beschrijf de reden voor terugbetaling..." />
        <FileUpload label="Foto van factuur/bon uploaden" name="factuur" accept="image/*" required />
      </>
    ),
  },
  {
    id: "documenten",
    title: "Aanvraag Documenten",
    render: () => (
      <>
        <TextInput label="Naam van het gebouw" name="gebouw" required />
        <NameFields />
        <TextInput label="Email" name="email" type="email" required />
        <div className="form-group">
          <label>Welke documenten heeft u nodig? *</label>
          <div className="checkbox-group">
            {[
              ["jaarrekening", "Jaarrekening"],
              ["notulen", "Notulen AV"],
              ["basisakte", "Basisakte"],
              ["reglement", "Reglement van mede-eigendom"],
              ["verzekeringsattest", "Verzekeringsattest"],
              ["andere", "Andere"],
            ].map(([value, label]) => (
              <label className="checkbox-label" key={value}>
                <input type="checkbox" name="documenten" value={value} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
        <TextArea label={'Specificeer indien "Andere"'} name="andere_documenten" rows={2} />
        <TextArea label="Reden aanvraag" name="reden" rows={2} placeholder="Bijv. Verkoop appartement, Notaris..." />
      </>
    ),
  },
  {
    id: "algemeen",
    title: "Algemene Vraag",
    render: () => (
      <>
        <TextInput label="Naam van het gebouw" name="gebouw" />
        <NameFields />
        <TextInput label="Email" name="email" type="email" required />
        <TextInput label="Onderwerp" name="onderwerp" required />
        <TextArea label="Uw vraag" name="vraag" rows={5} required placeholder="Stel hier uw vraag..." />
      </>
    ),
  },
];

export default App;
