// Default API endpoint for fetching colors
const defaultApiUrl = 'https://www.thecolorapi.com/scheme?hex=F6BE00&mode=analogic&count=5';

// Default color scheme in case the API fails
const defaultColors = [
    { name: "White", hex: "#FFFFFF" },
    { name: "Red", hex: "#FF0000" },
    { name: "Green", hex: "#00FF00" },
    { name: "Blue", hex: "#0000FF" },
    { name: "Black", hex: "#000000" }
  ];

// Fetch Colors from API with Fallback
async function fetchColors(apiUrl = defaultApiUrl) {
    console.log("Making API call to:", apiUrl);
    showLoadingSpinner(true);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Failed to fetch colors, status: ${response.status}`);
        const data = await response.json();

        // Transform data from API to match the existing structure
        const colorsFromApi = data.colors.map(color => ({
            name: color.name.value,
            hex: color.hex.value
        }));

        // Store colors in the global scope for filtering
        window.colors = colorsFromApi;
        renderColors(colorsFromApi);
    } catch (error) {
        console.error('Error fetching colors from API:', error);
        window.colors = defaultColors;  // Fallback to default colors
        renderColors(defaultColors);
    } finally {
        showLoadingSpinner(false);
    }
}

// Show or hide the loading spinner
function showLoadingSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    spinner.style.display = show ? 'flex' : 'none';
}

// Render Colors
function renderColors(colorsToRender) {
    const colorGrid = document.getElementById('colorGrid');
    colorGrid.innerHTML = ''; // Clear previous colors

    const selectedLanguage = document.getElementById('language').value;

    colorsToRender.forEach(color => {
        const colorBlock = document.createElement('div');
        colorBlock.classList.add('color-block');
        colorBlock.style.backgroundColor = color.hex;

        const colorName = document.createElement('div');
        colorName.classList.add('color-name');
        colorName.textContent = color.name;

        const colorCode = document.createElement('div');
        colorCode.classList.add('color-code');
        colorCode.textContent = formatColorCode(color.hex, selectedLanguage);

        const copyIcon = document.createElement('i');
        copyIcon.classList.add('fas', 'fa-copy', 'copy-icon');
        copyIcon.setAttribute('data-code', formatColorCode(color.hex, selectedLanguage));
        copyIcon.addEventListener('click', copyColorCode);

        colorBlock.appendChild(colorName);
        colorBlock.appendChild(colorCode);
        colorBlock.appendChild(copyIcon);
        colorGrid.appendChild(colorBlock);
    });
}

// Utility function to determine if a color is light
function isLightColor(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    // Calculate luminance
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 180; // If luminance is high, it's a light color
}

// Render Colors
function renderColors(colorsToRender) {
    const colorGrid = document.getElementById('colorGrid');
    colorGrid.innerHTML = ''; // Clear previous colors

    const selectedLanguage = document.getElementById('language').value;

    colorsToRender.forEach(color => {
        const colorBlock = document.createElement('div');
        colorBlock.classList.add('color-block');
        colorBlock.style.backgroundColor = color.hex;

        const colorName = document.createElement('div');
        colorName.classList.add('color-name');
        colorName.textContent = color.name;

        const colorCode = document.createElement('div');
        colorCode.classList.add('color-code');
        colorCode.textContent = formatColorCode(color.hex, selectedLanguage);

        // If the background is light, switch text color to black
        if (isLightColor(color.hex)) {
            colorName.classList.add('light-text');
            colorCode.classList.add('light-text');
        }

        const copyIcon = document.createElement('i');
        copyIcon.classList.add('fas', 'fa-copy', 'copy-icon');
        copyIcon.setAttribute('data-code', formatColorCode(color.hex, selectedLanguage));
        copyIcon.addEventListener('click', copyColorCode);

        colorBlock.appendChild(colorName);
        colorBlock.appendChild(colorCode);
        colorBlock.appendChild(copyIcon);
        colorGrid.appendChild(colorBlock);
    });
}


// Format color code based on the selected language
function formatColorCode(hex, language) {
    switch (language) {
        case 'css':
            return `background-color: ${hex};`;
        case 'js':
            return `const color = '${hex}';`;
        case 'python':
            return `color = '${hex}'`;
        default:
            return hex;
    }
}

// Copy color code to clipboard with tooltip feedback
function copyColorCode(event) {
    const colorCode = event.target.getAttribute('data-code');
    navigator.clipboard.writeText(colorCode).then(() => {
        createTooltip(event.target, "Copied!");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

// Create a tooltip to show feedback
function createTooltip(element, message) {
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.innerText = message;
    element.appendChild(tooltip);
    setTimeout(() => element.removeChild(tooltip), 2000);
}

// Filter Colors based on search input
function filterColors() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!window.colors) {
        console.error("No colors available to filter.");
        return;
    }
    const filteredColors = window.colors.filter(color => 
        color.name.toLowerCase().includes(searchTerm) || 
        color.hex.toLowerCase().includes(searchTerm)
    );
    renderColors(filteredColors);
}

// Onboarding Flow
function nextOnboardingStep() {
    document.getElementById(`onboardingStep${currentOnboardingStep}`).style.display = 'none';
    currentOnboardingStep += 1;
    const nextStep = document.getElementById(`onboardingStep${currentOnboardingStep}`);
    if (nextStep) nextStep.style.display = 'block';
}

function completeOnboarding() {
    document.getElementById('onboardingStep3').style.display = 'none';
}

// Handle Color Picker
function updateColors(event) {
    const colorHex = event.target.value.substring(1);  // Get the color value without the '#' character
    const apiUrl = `https://www.thecolorapi.com/scheme?hex=${colorHex}&mode=analogic&count=5`;
    fetchColors(apiUrl);  // Call the API with the correct URL
}

// Feedback Form Submission
document.getElementById('feedbackForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const feedbackText = document.getElementById('feedbackText').value;
    document.getElementById('feedbackMessage').textContent = "Thank you for your feedback!";
    console.log(feedbackText);
});

// Cookie Consent Modal
function acceptCookies() {
    document.getElementById('cookieConsentModal').style.display = 'none';
    document.cookie = "userAcceptedCookies=true; path=/; max-age=31536000";
}

function declineCookies() {
    document.getElementById('cookieConsentModal').style.display = 'none';
}

// Initial Fetch and Render of Colors on Page Load
window.onload = fetchColors;
