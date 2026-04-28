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
      question: "Hoe transparant is de financiële en administratieve opvolging?",
      answer:
        "Wij bieden volledige transparantie via duidelijke rapportages, online toegang tot documenten, en regelmatige updates over alle financiële en administratieve zaken van uw eigendom.",
    },
    {
      id: 6,
      question: "Kan ik ook beroep doen op jullie voor een specifieke opdracht?",
      answer:
        "Ja, naast volledig beheer bieden wij ook flexibele dienstverlening voor specifieke opdrachten. Contacteer ons om uw situatie te bespreken en een oplossing op maat te vinden.",
    },
  ],
};

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

