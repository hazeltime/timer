
// Limit Toggle Logic
export const setupLimitToggle = (formDOM) => {
  const toggle = document.getElementById("infinite-runs-toggle");
  const wrapper = document.getElementById("max-occurrences-wrapper");
  const input = document.getElementById("max-occurrences-input");
  
  if(!toggle || !wrapper || !input) return;

  const updateState = () => {
    if (toggle.checked) {
      wrapper.style.opacity = "0.5";
      wrapper.style.pointerEvents = "none";
      input.disabled = true;
      input.value = 0; // Standard for infinite
    } else {
      wrapper.style.opacity = "1";
      wrapper.style.pointerEvents = "auto";
      input.disabled = false;
      if (parseInt(input.value) === 0) input.value = 1; // Default to 1 if enabling limit
    }
  };

  // Initial Sync (Input might be loaded with value > 0)
  if (parseInt(input.value) > 0) {
    toggle.checked = false;
  } else {
    toggle.checked = true;
  }
  updateState();

  toggle.addEventListener("change", updateState);
};
