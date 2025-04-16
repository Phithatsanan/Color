/***************************************************/
/*                   Global Vars                   */
/***************************************************/
let currentColorHex = "F6BE00";
let currentSchemeMode = "analogic";
let currentSchemeCount = 5;
const fallbackColors = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#00FF00" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Black", hex: "#000000" }
];

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
  document.getElementById(`onboardingSlide${step}`).style.display = "block";
}

function hideOnboardingSlide(step) {
  document.getElementById(`onboardingSlide${step}`).style.display = "none";
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
/*           Fetch & Render Color Scheme          */
/***************************************************/
async function fetchColors() {
  const url = `https://www.thecolorapi.com/scheme?hex=${currentColorHex}&mode=${currentSchemeMode}&count=${currentSchemeCount}`;
  showLoadingSpinner(true);
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch colors, status: ${response.status}`);
    const data = await response.json();

    // Transform data
    window.colors = data.colors.map((color) => {
      const { value: hex } = color.hex;
      const { value: name } = color.name;
      return { name, hex };
    });
    renderColors(window.colors);
  } catch (error) {
    console.error("Error fetching colors:", error);
    window.colors = fallbackColors;
    renderColors(fallbackColors);
  } finally {
    showLoadingSpinner(false);
  }
}

function renderColors(colorsArray) {
  const colorGrid = document.getElementById("colorGrid");
  colorGrid.innerHTML = "";

  const selectedLanguage = document.getElementById("language").value;

  colorsArray.forEach((colorObj) => {
    const { name, hex } = colorObj;
    const colorBlock = document.createElement("div");
    colorBlock.classList.add("color-block");
    colorBlock.style.backgroundColor = hex;

    // Determine if text color should be black
    if (isLightColor(hex)) {
      colorBlock.classList.add("light-bg");
    }

    // Name & Code
    const colorName = document.createElement("div");
    colorName.classList.add("color-name");
    colorName.textContent = name;

    const colorCode = document.createElement("div");
    colorCode.classList.add("color-code");
    const formattedCode = formatColorCode(hex, selectedLanguage);
    colorCode.textContent = formattedCode;

    // Adjust text color for light BG
    if (isLightColor(hex)) {
      colorName.classList.add("light-text");
      colorCode.classList.add("light-text");
    }

    // Copy Icon
    const copyIcon = document.createElement("i");
    copyIcon.classList.add("fas", "fa-copy", "copy-icon");
    copyIcon.setAttribute("data-code", formattedCode);
    copyIcon.addEventListener("click", copyColorCode);

    // Favorites Icon
    const favIcon = document.createElement("i");
    favIcon.classList.add("fas", "fa-star");
    favIcon.setAttribute("title", "Add to Favorites");
    favIcon.addEventListener("click", () => addToFavorites({ name, hex }));

    colorBlock.appendChild(colorName);
    colorBlock.appendChild(colorCode);
    colorBlock.appendChild(favIcon);
    colorBlock.appendChild(copyIcon);
    colorGrid.appendChild(colorBlock);
  });
}

/***************************************************/
/*              Copy to Clipboard Logic           */
/***************************************************/
function copyColorCode(e) {
  const code = e.target.getAttribute("data-code");
  navigator.clipboard
    .writeText(code)
    .then(() => alert(`Copied: ${code}`))
    .catch((err) => console.error("Failed to copy:", err));
}

/***************************************************/
/*            Color Format Conversions            */
/***************************************************/
function formatColorCode(hex, format) {
  switch (format.toLowerCase()) {
    case "css":
      return `background-color: ${hex};`;
    case "js":
      return `const color = '${hex}';`;
    case "python":
      return `color = '${hex}'`;
    case "rgb":
      return hexToRGBString(hex);
    case "hsl":
      return hexToHSLString(hex);
    case "cmyk":
      return hexToCMYKString(hex);
    default:
      return hex; // hex
  }
}

// Convert HEX to RGB string
function hexToRGBString(hex) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// Convert HEX to HSL string
function hexToHSLString(hex) {
  const r = parseInt(hex.substr(1, 2), 16) / 255;
  const g = parseInt(hex.substr(3, 2), 16) / 255;
  const b = parseInt(hex.substr(5, 2), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if(max === min){
    h = s = 0; // achromatic
  } else {
    const diff = max - min;
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch(max){
      case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
      case g: h = (b - r) / diff + 2; break;
      case b: h = (r - g) / diff + 4; break;
    }
    h /= 6;
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Convert HEX to CMYK string (approximate)
function hexToCMYKString(hex) {
  const r = parseInt(hex.substr(1, 2), 16) / 255;
  const g = parseInt(hex.substr(3, 2), 16) / 255;
  const b = parseInt(hex.substr(5, 2), 16) / 255;

  const k = 1 - Math.max(r, g, b);
  const c = (1 - r - k) / (1 - k) || 0;
  const m = (1 - g - k) / (1 - k) || 0;
  const y = (1 - b - k) / (1 - k) || 0;

  return `cmyk(${(c*100).toFixed(0)}%, ${(m*100).toFixed(0)}%, ${(y*100).toFixed(0)}%, ${(k*100).toFixed(0)}%)`;
}

/***************************************************/
/*                 Search & Filter                */
/***************************************************/
function filterColors() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  if (!window.colors) return;

  const filtered = window.colors.filter((colorObj) => {
    const { name, hex } = colorObj;
    const colorFormats = [
      name.toLowerCase(),
      hex.toLowerCase(),
      hexToRGBString(hex).toLowerCase(),
      hexToHSLString(hex).toLowerCase(),
      hexToCMYKString(hex).toLowerCase()
    ];
    return colorFormats.some((fmt) => fmt.includes(searchTerm));
  });
  renderColors(filtered);
}

/***************************************************/
/*               Favorites Logic                  */
/***************************************************/
function addToFavorites(colorObj) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const exists = favorites.some((fav) => fav.hex === colorObj.hex);
  if (!exists) {
    favorites.push(colorObj);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert(`Added ${colorObj.name} to Favorites!`);
  } else {
    alert(`${colorObj.name} is already in your Favorites!`);
  }
  renderFavorites();
}

function renderFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const listEl = document.getElementById("favoritesList");
  listEl.innerHTML = "";

  favorites.forEach((fav) => {
    const item = document.createElement("div");
    item.classList.add("favorite-item");

    const swatch = document.createElement("div");
    swatch.classList.add("favorite-color-swatch");
    swatch.style.backgroundColor = fav.hex;

    const name = document.createElement("span");
    name.textContent = fav.name;
    name.style.marginRight = "0.5rem";

    const removeBtn = document.createElement("i");
    removeBtn.classList.add("fas", "fa-trash", "remove-favorite");
    removeBtn.addEventListener("click", () => removeFavorite(fav.hex));

    item.appendChild(swatch);
    item.appendChild(name);
    item.appendChild(removeBtn);
    listEl.appendChild(item);
  });
}

function removeFavorite(hex) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter((fav) => fav.hex !== hex);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
}

/***************************************************/
/*               Advanced Tools Logic             */
/***************************************************/

/* 1. Contrast Checker */
function checkContrast() {
  const color1 = document.getElementById("contrastColor1").value;
  const color2 = document.getElementById("contrastColor2").value;
  const ratio = getContrastRatio(color1, color2).toFixed(2);
  document.getElementById("contrastResult").textContent = `Contrast Ratio: ${ratio}`;

  // (Optional) Check if ratio meets WCAG guidelines
  // For example: ratio >= 4.5 for normal text
  // You could add more robust checking and display pass/fail messages
}

/** Returns contrast ratio of two hex colors */
function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/** Returns the relative luminance of a hex color */
function getRelativeLuminance(hex) {
  const rgb = [1, 3, 5].map((i) => {
    let channel = parseInt(hex.substr(i, 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  // rgb[0] = R, rgb[1] = G, rgb[2] = B
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/* 2. Color-Blindness Simulator (Simple) */
const colorBlindTypes = [
  { type: "None", fn: (r, g, b) => [r, g, b] },
  { type: "Protanopia", fn: protanopia },
  { type: "Deuteranopia", fn: deuteranopia },
  { type: "Tritanopia", fn: tritanopia },
  { type: "Achromatopsia", fn: achromatopsia }
];
function simulateColorBlindness() {
  const color = document.getElementById("simulatorColorPicker").value;
  const r = parseInt(color.substr(1, 2), 16);
  const g = parseInt(color.substr(3, 2), 16);
  const b = parseInt(color.substr(5, 2), 16);

  const gallery = document.getElementById("simulationGallery");
  gallery.innerHTML = "";

  colorBlindTypes.forEach(({ type, fn }) => {
    const [nr, ng, nb] = fn(r, g, b);
    const hexVal = rgbToHex(nr, ng, nb);
    const swatch = document.createElement("div");
    swatch.classList.add("simulated-swatch");
    swatch.style.backgroundColor = hexVal;
    swatch.style.color = isLightColor(hexVal) ? "#000" : "#fff";
    swatch.innerHTML = `<strong>${type}</strong><br>${hexVal}`;
    gallery.appendChild(swatch);
  });
}

/** Conversion to hex */
function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((val) => {
        const hex = val.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/** Basic color-blindness transformations (approximate) */
function protanopia(r, g, b) {
  // Very approximate matrix
  const nr = 0.567 * r + 0.433 * g + 0.0 * b;
  const ng = 0.558 * r + 0.442 * g + 0.0 * b;
  const nb = 0.0 * r + 0.242 * g + 0.758 * b;
  return [Math.round(nr), Math.round(ng), Math.round(nb)];
}
function deuteranopia(r, g, b) {
  const nr = 0.625 * r + 0.375 * g + 0.0 * b;
  const ng = 0.7 * r + 0.3 * g + 0.0 * b;
  const nb = 0.0 * r + 0.3 * g + 0.7 * b;
  return [Math.round(nr), Math.round(ng), Math.round(nb)];
}
function tritanopia(r, g, b) {
  const nr = 0.95 * r + 0.05 * g + 0.0 * b;
  const ng = 0.0 * r + 0.433 * g + 0.567 * b;
  const nb = 0.0 * r + 0.475 * g + 0.525 * b;
  return [Math.round(nr), Math.round(ng), Math.round(nb)];
}
function achromatopsia(r, g, b) {
  // average out R, G, B
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  return [Math.round(grey), Math.round(grey), Math.round(grey)];
}

/* 3. Gradient Generator */
function generateGradient() {
  const color1 = document.getElementById("gradientColor1").value;
  const color2 = document.getElementById("gradientColor2").value;
  const gradient = `linear-gradient(90deg, ${color1}, ${color2})`;

  const preview = document.getElementById("gradientPreview");
  preview.style.background = gradient;

  const codeEl = document.getElementById("gradientCode");
  codeEl.textContent = `CSS Code: background: ${gradient};`;
}

/***************************************************/
/*                 Utility Functions              */
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
/*           Advanced Tools Drawer Logic          */
/***************************************************/
document.getElementById("advancedToolsBtn").addEventListener("click", () => {
  openAdvancedTools();
  simulateColorBlindness(); // so it shows something by default
});
function openAdvancedTools() {
  const drawer = document.getElementById("advancedToolsDrawer");
  drawer.style.left = "0";
}
function closeAdvancedTools() {
  const drawer = document.getElementById("advancedToolsDrawer");
  drawer.style.left = `-${getComputedStyle(drawer).width}`;
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
/*          Event: Color Picker & Selects         */
/***************************************************/
function updateColors() {
  // Grab the new color from the picker & updates
  const colorPicker = document.getElementById("colorPicker");
  if (colorPicker) {
    currentColorHex = colorPicker.value.substring(1); // remove '#'
  }
  // Grab scheme mode & count
  currentSchemeMode = document.getElementById("schemeMode").value;
  currentSchemeCount = document.getElementById("schemeCount").value;
  fetchColors();
}

/***************************************************/
/*             Initial Page Load Logic            */
/***************************************************/
window.onload = () => {
  // Show cookies modal if not accepted
  if (document.cookie.indexOf("userAcceptedCookies") === -1) {
    document.getElementById("cookieConsentModal").style.display = "block";
  }
  // Fetch initial colors
  fetchColors();
};
