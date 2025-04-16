/***************************************************/
/*                 Global Variables               */
/***************************************************/

// Default color scheme URL. We’ll dynamically replace the color and mode.
let currentColorHex = "F6BE00";
let currentSchemeMode = "analogic";
const defaultApiUrl = () =>
  `https://www.thecolorapi.com/scheme?hex=${currentColorHex}&mode=${currentSchemeMode}&count=5`;

// Fallback colors if the API fails
const fallbackColors = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#00FF00" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Black", hex: "#000000" }
];

// To store the current color set from the API
window.colors = [];

/***************************************************/
/*                 Onboarding Logic               */
/***************************************************/
let onboardingStep = 1;
function startOnboarding() {
  const overlay = document.getElementById("onboardingOverlay");
  overlay.style.display = "flex";
  showOnboardingSlide(1);
}

function showOnboardingSlide(step) {
  document
    .getElementById(`onboardingSlide${step}`)
    .style.display = "block";
}

function hideOnboardingSlide(step) {
  document
    .getElementById(`onboardingSlide${step}`)
    .style.display = "none";
}

function nextOnboardingSlide() {
  hideOnboardingSlide(onboardingStep);
  onboardingStep++;
  showOnboardingSlide(onboardingStep);
}

function endOnboarding() {
  hideOnboardingSlide(onboardingStep);
  document.getElementById("onboardingOverlay").style.display = "none";
  onboardingStep = 1;
}

/***************************************************/
/*                 Fetch Colors                   */
/***************************************************/
async function fetchColors() {
  const url = defaultApiUrl();
  showLoadingSpinner(true);
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch colors, status: ${response.status}`);
    const data = await response.json();
    const apiColors = data.colors.map((color) => ({
      name: color.name.value,
      hex: color.hex.value
    }));
    window.colors = apiColors;
    renderColors(apiColors);
  } catch (error) {
    console.error("Error fetching colors from API:", error);
    window.colors = fallbackColors;
    renderColors(fallbackColors);
  } finally {
    showLoadingSpinner(false);
  }
}

/***************************************************/
/*                Render Colors                   */
/***************************************************/
function renderColors(colorsToRender) {
  const colorGrid = document.getElementById("colorGrid");
  colorGrid.innerHTML = "";

  const selectedLanguage = document.getElementById("language").value;

  colorsToRender.forEach((color) => {
    const colorBlock = document.createElement("div");
    colorBlock.classList.add("color-block");
    colorBlock.style.backgroundColor = color.hex;

    const colorName = document.createElement("div");
    colorName.classList.add("color-name");
    colorName.textContent = color.name;

    const colorCode = document.createElement("div");
    colorCode.classList.add("color-code");
    colorCode.textContent = formatColorCode(color.hex, selectedLanguage);

    // Adjust text color for light backgrounds
    if (isLightColor(color.hex)) {
      colorName.classList.add("light-text");
      colorCode.classList.add("light-text");
    }

    // Copy Icon
    const copyIcon = document.createElement("i");
    copyIcon.classList.add("fas", "fa-copy", "copy-icon");
    copyIcon.setAttribute(
      "data-code",
      formatColorCode(color.hex, selectedLanguage)
    );
    copyIcon.addEventListener("click", copyColorCode);

    // Add a star icon to add to favorites
    const favIcon = document.createElement("i");
    favIcon.classList.add("fas", "fa-star");
    favIcon.style.position = "absolute";
    favIcon.style.top = "10px";
    favIcon.style.right = "40px";
    favIcon.style.cursor = "pointer";
    favIcon.style.fontSize = "1.2rem";
    favIcon.setAttribute("title", "Add to Favorites");
    favIcon.addEventListener("click", () => addToFavorites(color));

    colorBlock.appendChild(colorName);
    colorBlock.appendChild(colorCode);
    colorBlock.appendChild(favIcon);
    colorBlock.appendChild(copyIcon);
    colorGrid.appendChild(colorBlock);
  });
}

/***************************************************/
/*             Favorites Management               */
/***************************************************/
function addToFavorites(color) {
  // Retrieve existing favorites from localStorage
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  // Check if color already exists
  if (!favorites.some((fav) => fav.hex === color.hex)) {
    favorites.push(color);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert(`Added ${color.name} to Favorites!`);
  } else {
    alert(`${color.name} is already in your Favorites!`);
  }
  renderFavorites();
}

function removeFavorite(colorHex) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter((fav) => fav.hex !== colorHex);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
}

function renderFavorites() {
  const favoritesDrawer = document.getElementById("favoritesDrawer");
  const favoritesList = document.getElementById("favoritesList");
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favoritesList.innerHTML = "";

  favorites.forEach((fav) => {
    const item = document.createElement("div");
    item.classList.add("favorite-item");

    const swatch = document.createElement("div");
    swatch.classList.add("favorite-color-swatch");
    swatch.style.backgroundColor = fav.hex;

    const name = document.createElement("span");
    name.textContent = fav.name;
    name.style.marginRight = "0.5rem";

    // Remove button
    const removeBtn = document.createElement("i");
    removeBtn.classList.add("fas", "fa-trash", "remove-favorite");
    removeBtn.addEventListener("click", () => removeFavorite(fav.hex));

    item.appendChild(swatch);
    item.appendChild(name);
    item.appendChild(removeBtn);
    favoritesList.appendChild(item);
  });
}

/***************************************************/
/*              Copy to Clipboard                 */
/***************************************************/
function copyColorCode(event) {
  const colorCode = event.target.getAttribute("data-code");
  navigator.clipboard
    .writeText(colorCode)
    .then(() => {
      alert("Copied: " + colorCode);
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}

/***************************************************/
/*                Format Color Code               */
/***************************************************/
function formatColorCode(hex, language) {
  switch (language) {
    case "css":
      return `background-color: ${hex};`;
    case "js":
      return `const color = '${hex}';`;
    case "python":
      return `color = '${hex}'`;
    default:
      return hex;
  }
}

/***************************************************/
/*              Filter & Search Colors            */
/***************************************************/
function filterColors() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  if (!window.colors) {
    console.error("No colors available to filter.");
    return;
  }
  const filteredColors = window.colors.filter(
    (color) =>
      color.name.toLowerCase().includes(searchTerm) ||
      color.hex.toLowerCase().includes(searchTerm)
  );
  renderColors(filteredColors);
}

/***************************************************/
/*              Update Colors by Picker           */
/***************************************************/
function updateColors(event) {
  currentColorHex = event.target.value.substring(1);
  fetchColors();
}

/***************************************************/
/*            Update Colors by Scheme Mode         */
/***************************************************/
function updateColorsFromMode(event) {
  currentSchemeMode = event.target.value;
  fetchColors();
}

/***************************************************/
/*                   Utilities                    */
/***************************************************/
function isLightColor(hex) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 180;
}

function showLoadingSpinner(show) {
  const spinner = document.getElementById("loadingSpinner");
  spinner.style.display = show ? "flex" : "none";
}

/***************************************************/
/*        Favorites Drawer Toggle Logic           */
/***************************************************/
document.getElementById("favoritesBtn").addEventListener("click", () => {
  renderFavorites();
  openFavorites();
});

function openFavorites() {
  const drawer = document.getElementById("favoritesDrawer");
  drawer.style.right = "0";
}
function closeFavorites() {
  const drawer = document.getElementById("favoritesDrawer");
  drawer.style.right = `-${getComputedStyle(drawer).width}`;
}

/***************************************************/
/*               Feedback Modal Logic             */
/***************************************************/
const feedbackModal = document.getElementById("feedbackModal");
const feedbackBtn = document.getElementById("feedbackBtn");
const feedbackForm = document.getElementById("feedbackForm");

feedbackBtn.addEventListener("click", () => {
  feedbackModal.style.display = "flex";
});

function closeFeedbackModal() {
  feedbackModal.style.display = "none";
}

feedbackForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const feedbackText = document.getElementById("feedbackText").value;
  document.getElementById("feedbackMessage").textContent = "Thank you for your feedback!";
  console.log("Feedback submitted:", feedbackText);
  setTimeout(() => {
    feedbackModal.style.display = "none";
    document.getElementById("feedbackMessage").textContent = "";
    feedbackForm.reset();
  }, 2000);
});

/***************************************************/
/*            Cookie Consent Logic                */
/***************************************************/
function acceptCookies() {
  document.getElementById("cookieConsentModal").style.display = "none";
  document.cookie = "userAcceptedCookies=true; path=/; max-age=31536000";
}
function declineCookies() {
  document.getElementById("cookieConsentModal").style.display = "none";
}

/***************************************************/
/*           Initial Fetch on Page Load           */
/***************************************************/
window.onload = () => {
  // Check if user already accepted cookies
  if (document.cookie.indexOf("userAcceptedCookies") === -1) {
    document.getElementById("cookieConsentModal").style.display = "block";
  }
  // Load initial colors
  fetchColors();
};
