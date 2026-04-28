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

