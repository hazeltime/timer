
// Advanced Mode Toggle Logic
export const setupAdvancedModeToggle = (formDOM) => {
  const toggle = document.getElementById("advanced-mode-toggle");
  const wrapper = document.getElementById("advanced-fields-wrapper");
  if(!toggle || !wrapper) return;

  const updateVisibility = () => {
    wrapper.style.display = toggle.checked ? "flex" : "none";
  };

  // Restore state if needed, but default to simple (Hick's Law)
  toggle.checked = false; 
  updateVisibility();

  toggle.addEventListener("change", updateVisibility);
};
