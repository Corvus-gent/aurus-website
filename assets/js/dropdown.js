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

