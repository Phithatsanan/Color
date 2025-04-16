/***************************************************/
/*                   Global Vars                   */
/***************************************************/
let currentColorHex = "F6BE00";
let currentSchemeMode = "analogic";
let currentSchemeCount = 5;
window.colors = []; // store fetched colors
const fallbackColors = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Green", hex: "#00FF00" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Black", hex: "#000000" }
];

/***************************************************/
/*                 Tab Navigation                 */
/***************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-item");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remove active from all
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      // Activate selected
      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");

      // If user just clicked "Favorites" tab, re-render the favorites:
      if (targetId === "favoritesTab") {
        renderFavorites();
      }
      // If user just clicked "colorBlindnessTab", run simulator:
      if (targetId === "colorBlindnessTab") {
        simulateColorBlindness();
      }
    });
  });
});

/***************************************************/
/*        Fetch & Render Colors (Explorer)        */
/***************************************************/
async function fetchColors() {
  showLoadingSpinner(true);
  const url = `https://www.thecolorapi.com/scheme?hex=${currentColorHex}&mode=${currentSchemeMode}&count=${currentSchemeCount}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch colors");
    const data = await res.json();
    window.colors = data.colors.map(col => ({
      name: col.name.value,
      hex: col.hex.value
    }));
    renderColors(window.colors);
  } catch (err) {
    console.error("Error fetching:", err);
    window.colors = fallbackColors;
    renderColors(window.colors);
  } finally {
    showLoadingSpinner(false);
  }
}

function renderColors(colorArr) {
  const colorGrid = document.getElementById("colorGrid");
  colorGrid.innerHTML = "";
  const selectedFormat = document.getElementById("language").value;

  colorArr.forEach(({ name, hex }) => {
    const block = document.createElement("div");
    block.classList.add("color-block");
    block.style.backgroundColor = hex;

    // Text for name & code
    const nameEl = document.createElement("div");
    nameEl.classList.add("color-name");
    nameEl.textContent = name;

    const codeEl = document.createElement("div");
    codeEl.classList.add("color-code");
    const formatted = formatColorCode(hex, selectedFormat);
    codeEl.textContent = formatted;

    // If it's a bright color, invert text
    if (isLightColor(hex)) {
      block.classList.add("light-bg");
      nameEl.classList.remove("color-name");
      codeEl.classList.remove("color-code");
    }

    // COPY button
    const copyBtn = document.createElement("button");
    copyBtn.classList.add("copy-btn");
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => copyText(formatted));

    // FAVORITES button
    const favBtn = document.createElement("button");
    favBtn.classList.add("fav-btn");
    favBtn.textContent = "Add to Favorites";
    favBtn.addEventListener("click", () => addToFavorites({ name, hex }));

    block.appendChild(nameEl);
    block.appendChild(codeEl);
    block.appendChild(copyBtn);
    block.appendChild(favBtn);
    colorGrid.appendChild(block);
  });
}

/***************************************************/
/*                Copy to Clipboard               */
/***************************************************/
function copyText(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => alert(`Copied: ${text}`))
    .catch(err => console.error("Copy failed:", err));
}

/***************************************************/
/*               Format Conversions               */
/***************************************************/
function formatColorCode(hex, format) {
  switch (format) {
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
      return hex; // default is hex
  }
}

function hexToRGBString(hex) {
  const r = parseInt(hex.substr(1,2), 16);
  const g = parseInt(hex.substr(3,2), 16);
  const b = parseInt(hex.substr(5,2), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToHSLString(hex) {
  const r = parseInt(hex.substr(1, 2), 16) / 255;
  const g = parseInt(hex.substr(3, 2), 16) / 255;
  const b = parseInt(hex.substr(5, 2), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // grayscale
  } else {
    const diff = max - min;
    s = l > 0.5 ? diff/(2 - max - min) : diff/(max + min);
    switch (max) {
      case r: h = (g - b)/diff + (g < b ? 6 : 0); break;
      case g: h = (b - r)/diff + 2; break;
      case b: h = (r - g)/diff + 4; break;
    }
    h /= 6;
  }
  h = Math.round(360 * h);
  s = Math.round(100 * s);
  l = Math.round(100 * l);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function hexToCMYKString(hex) {
  const r = parseInt(hex.substr(1,2),16)/255;
  const g = parseInt(hex.substr(3,2),16)/255;
  const b = parseInt(hex.substr(5,2),16)/255;
  const k = 1 - Math.max(r,g,b);
  const c = (1-r-k)/(1-k) || 0;
  const m = (1-g-k)/(1-k) || 0;
  const y = (1-b-k)/(1-k) || 0;
  return `cmyk(${(c*100).toFixed(0)}%, ${(m*100).toFixed(0)}%, ${(y*100).toFixed(0)}%, ${(k*100).toFixed(0)}%)`;
}

/***************************************************/
/*                Light Color Check               */
/***************************************************/
function isLightColor(hex) {
  const r = parseInt(hex.substr(1,2), 16);
  const g = parseInt(hex.substr(3,2), 16);
  const b = parseInt(hex.substr(5,2), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 180;
}

/***************************************************/
/*             Search & Filter Colors             */
/***************************************************/
function filterColors() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  if (!window.colors.length) return;

  const filtered = window.colors.filter(color => {
    const { name, hex } = color;
    const stringsToMatch = [
      name.toLowerCase(),
      hex.toLowerCase(),
      hexToRGBString(hex).toLowerCase(),
      hexToHSLString(hex).toLowerCase(),
      hexToCMYKString(hex).toLowerCase()
    ];
    return stringsToMatch.some(str => str.includes(searchTerm));
  });
  renderColors(filtered);
}

/***************************************************/
/*     Add & Remove Favorites (Favorites Tab)     */
/***************************************************/
function addToFavorites(colorObj) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!favorites.some(f => f.hex === colorObj.hex)) {
    favorites.push(colorObj);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    alert(`Added ${colorObj.name} to favorites!`);
  } else {
    alert(`${colorObj.name} is already in favorites!`);
  }
}

function renderFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  const listEl = document.getElementById("favoritesList");
  listEl.innerHTML = "";

  favorites.forEach(fav => {
    const item = document.createElement("div");
    item.classList.add("favorite-item");

    const swatch = document.createElement("div");
    swatch.classList.add("favorite-color-swatch");
    swatch.style.backgroundColor = fav.hex;

    const nameSpan = document.createElement("span");
    nameSpan.textContent = fav.name;

    const removeBtn = document.createElement("i");
    removeBtn.classList.add("fas", "fa-trash", "remove-favorite");
    removeBtn.addEventListener("click", () => removeFavorite(fav.hex));

    item.appendChild(swatch);
    item.appendChild(nameSpan);
    item.appendChild(removeBtn);

    listEl.appendChild(item);
  });
}

function removeFavorite(hex) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter(f => f.hex !== hex);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavorites();
}

/***************************************************/
/*           Accessibility: Contrast Check        */
/***************************************************/
function checkContrast() {
  const c1 = document.getElementById("contrastColor1").value;
  const c2 = document.getElementById("contrastColor2").value;
  const ratio = getContrastRatio(c1, c2).toFixed(2);
  document.getElementById("contrastResult").textContent = `Contrast Ratio: ${ratio}`;
}
function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const bright = Math.max(lum1, lum2);
  const dark = Math.min(lum1, lum2);
  return (bright + 0.05)/(dark + 0.05);
}
function getRelativeLuminance(hex) {
  const rgb = [1,3,5].map(i => {
    let c = parseInt(hex.substr(i,2),16)/255;
    return (c <= 0.03928) ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  });
  return 0.2126*rgb[0] + 0.7152*rgb[1] + 0.0722*rgb[2];
}

/***************************************************/
/*      Color Blindness Simulator (Tab 3)         */
/***************************************************/
const colorBlindTypes = [
  { type: "None", fn: (r,g,b)=>[r,g,b] },
  { type: "Protanopia", fn: protanopia },
  { type: "Deuteranopia", fn: deuteranopia },
  { type: "Tritanopia", fn: tritanopia },
  { type: "Achromatopsia", fn: achromatopsia }
];

function simulateColorBlindness() {
  const color = document.getElementById("simulatorColorPicker").value;
  const r = parseInt(color.substr(1,2),16);
  const g = parseInt(color.substr(3,2),16);
  const b = parseInt(color.substr(5,2),16);

  const gallery = document.getElementById("simulationGallery");
  gallery.innerHTML = "";

  colorBlindTypes.forEach(({ type, fn }) => {
    const [nr, ng, nb] = fn(r,g,b);
    const hexVal = rgbToHex(nr, ng, nb);
    const swatch = document.createElement("div");
    swatch.classList.add("simulated-swatch");
    swatch.style.backgroundColor = hexVal;
    swatch.style.color = isLightColor(hexVal) ? "#000" : "#fff";
    swatch.innerHTML = `<strong>${type}</strong><br>${hexVal}`;
    gallery.appendChild(swatch);
  });
}

// Simple color-blindness approximation
function protanopia(r,g,b) {
  const nr = 0.567*r + 0.433*g;
  const ng = 0.558*r + 0.442*g;
  const nb = 0.242*g + 0.758*b;
  return [Math.round(nr), Math.round(ng), Math.round(nb)];
}
function deuteranopia(r,g,b) {
  const nr = 0.625*r + 0.375*g;
  const ng = 0.7*r + 0.3*g;
  const nb = 0.3*g + 0.7*b;
  return [Math.round(nr), Math.round(ng), Math.round(nb)];
}
function tritanopia(r,g,b) {
  const nr = 0.95*r + 0.05*g;
  const ng = 0.433*g + 0.567*b;
  const nb = 0.475*g + 0.525*b;
  return [Math.round(nr), Math.round(ng), Math.round(nb)];
}
function achromatopsia(r,g,b) {
  const grey = 0.299*r + 0.587*g + 0.114*b;
  return [Math.round(grey), Math.round(grey), Math.round(grey)];
}
function rgbToHex(r,g,b) {
  return "#" + [r,g,b].map(c => {
    const hex = c.toString(16);
    return hex.length===1 ? "0"+hex : hex;
  }).join("");
}

/***************************************************/
/*         Gradient Generator (Tab 4)             */
/***************************************************/
function generateGradient() {
  const c1 = document.getElementById("gradientColor1").value;
  const c2 = document.getElementById("gradientColor2").value;
  const gradient = `linear-gradient(90deg, ${c1}, ${c2})`;

  const preview = document.getElementById("gradientPreview");
  preview.style.background = gradient;

  const codeEl = document.getElementById("gradientCode");
  codeEl.textContent = `CSS Code: background: ${gradient};`;
}

/***************************************************/
/*             Cookie Consent Handling            */
/***************************************************/
function acceptCookies() {
  document.getElementById("cookieConsentModal").style.display = "none";
  document.cookie = "userAcceptedCookies=true; path=/; max-age=31536000";
}
function declineCookies() {
  document.getElementById("cookieConsentModal").style.display = "none";
}

/***************************************************/
/*                   Utilities                    */
/***************************************************/
function showLoadingSpinner(show) {
  document.getElementById("loadingSpinner").style.display = show ? "flex" : "none";
}

/***************************************************/
/*             On Page Load: Fetch Colors         */
/***************************************************/
window.onload = () => {
  // Show cookies modal if not accepted
  if (document.cookie.indexOf("userAcceptedCookies") === -1) {
    document.getElementById("cookieConsentModal").style.display = "block";
  }

  // Fetch initial colors for the Explorer tab
  fetchColors();
};
