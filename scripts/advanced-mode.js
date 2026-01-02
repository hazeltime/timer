
// Advanced Mode Toggle Logic
export const setupAdvancedModeToggle = (formDOM) => {
  const toggle = document.getElementById("advanced-mode-toggle");
  const wrapper = document.getElementById("advanced-fields-wrapper");
  if(!toggle || !wrapper) return;

  const updateVisibility = () => {
    // Sprint 11: Use CSS transition class instead of display:none
    if (toggle.checked) {
      wrapper.classList.add("visible");
    } else {
      wrapper.classList.remove("visible");
    }
  };

  // Restore state if needed, but default to simple (Hick's Law)
  toggle.checked = false; 
  updateVisibility();

  toggle.addEventListener("change", updateVisibility);
};
