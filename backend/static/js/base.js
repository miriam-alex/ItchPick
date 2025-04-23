// DYNAMICALLY GENERATING THE TAG DROPDOWN

/*
Counter({'Games': 2225, 'Free': 1981, 'Visual Novel': 352, 'Adventure': 268, 'Action': 194, 'Featured': 188, 
'Platformer': 177, 'Puzzle': 177, 'Interactive Fiction': 151, '$5 or less': 135, 'Simulation': 124, 'Role Playing': 70, 
'$15 or less': 68, 'Shooter': 67, 'Survival': 62, 'Strategy': 61, 'Educational': 32, 'Card Game': 30, 'Rhythm': 22, 
'Fighting': 21, 'Racing': 16, 'Sports': 13, 'On sale': 4})
*/

const words = ["Grandmas and cafes...", "Cute cats..."];
const availableTags = ["Visual Novel", "Adventure", "Action", "Featured", "Platformer", "Puzzle", "Simulation", "Role Playing", "Shooter", "Survival", "Strategy", "Educational", "Card Game", "Rhythm", "Fighting", "Racing", "Sports"];

const selectedTags = new Set();

const dropdown = document.getElementById("tagDropdown");
const tagsContainer = document.getElementById("tagsContainer");

function populateDropdown() {
  dropdown.innerHTML = '<option disabled selected>+ Add a tag</option>';
  availableTags.forEach(tag => {
    if (!selectedTags.has(tag)) {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      dropdown.appendChild(option);
    }
  });

  if (dropdown.options.length === 1) {
    dropdown.style.visibility = "hidden";
  } else {
    dropdown.disabled = false;
    dropdown.style.visibility = "visible"
  }
}

function addSelectedTag(selectElement) {
  const tagText = selectElement.value;

  if (!tagText || selectedTags.has(tagText)) {
    return;
  }

  const tagEl = document.createElement("span");
  tagEl.className = "tag";
  tagEl.innerHTML = `${tagText}<button class="remove-tag" onclick="removeTag(this)">×</button>`;

  tagsContainer.insertBefore(tagEl, dropdown);
  selectedTags.add(tagText);
  populateDropdown();
}

function removeTag(button) {
  const tagEl = button.parentElement;
  const tagText = tagEl.textContent.slice(0, -1).trim();
  selectedTags.delete(tagText);
  tagEl.remove();
  populateDropdown();
}

populateDropdown();

// TRIGGERING SEARCH ON KEYPRESS

const input = document.getElementById("filter-text-val");

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    filterText();
  }
});

// GENERATING RESULTS

function galleryItemTemplate(title, url, image_url, description, rating, rating_count, tags, recent_comments) {
  const rating_string = (rating == null || rating_count < 5) ? "" : `(${rating}★)`
  const title_string = (rating == null || rating_count < 5) ? `${title}:` : `${title} ${rating_string}:`

  let spanContents = ""
  tags.forEach(element => {
    const tagEl = `<span class="tag"> ${element} </span>`
    spanContents += tagEl + " "
  });

  const gameObj = { title, url, image_url, description, tags, recent_comments, rating_count, rating};
  console.log("Rendering game:", gameObj);

  return `
    <div class="gallery-item" 
      data-game='${escapeHTML(JSON.stringify(gameObj))}' 
      onclick="openSidebarFromElement(this)">
      <img src="${image_url}" alt="Thumbnail of ${title}">
      <div class="overlay">
        <b>${title_string}</b> ${description}
        <span class="tag-span">${spanContents}</span>
      </div>
    </div>`;
}

function sendFocus() {
  document.getElementById('filter-text-val').focus()
}

function setsOverlap(set1, set2) {
  return [...set1].some(element => set2.has(element));
}

function filterTextHelper(row) {
  var rowTagSet = new Set(row.tags)
  if (selectedTags.size == 0 || setsOverlap(rowTagSet, selectedTags)) {
    const tempDiv = document.createElement("div");
    if (row.image_url == null) {
      row.image_url = "https://static.itch.io/images/itchio-textless-white.svg";
    }
    tempDiv.innerHTML = galleryItemTemplate(
      row.title,
      row.url,
      row.image_url,
      row.description,
      row.rating,
      row.rating_count,
      row.tags,
      row.recent_comments
    );
    document.getElementById("gallery").appendChild(tempDiv);
  }
}

function filterText() {
  document.getElementById("gallery").innerHTML = "";
  fetch("/episodes?" + new URLSearchParams({ title: document.getElementById("filter-text-val").value }).toString())
    .then((response) => response.json())
    .then((data) => data.forEach(row => {
      filterTextHelper(row)
    }));
}

// SEARCH BAR ANIMATION CODE

const searchBar = document.getElementById('filter-text-val');

let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const currentWord = words[wordIndex];
  let displayedText = currentWord.substring(0, charIndex);

  searchBar.setAttribute("placeholder", displayedText);

  if (!isDeleting && charIndex < currentWord.length) {
    charIndex++;
    setTimeout(typeEffect, 100);
  } else if (isDeleting && charIndex > 0) {
    charIndex--;
    setTimeout(typeEffect, 50);
  } else {
    isDeleting = !isDeleting;
    if (!isDeleting) wordIndex = (wordIndex + 1) % words.length;
    setTimeout(typeEffect, 1000);
  }
}

typeEffect();

// SIDEBAR FUNCTIONS

function openSidebar(game) {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("sidebar-content");

  const tagHTML = game.tags.map(tag => `<span class="tag">${tag}</span>`).join(" ");

  let commentHTML = "";
    if (game.recent_comments) {
      commentHTML = `<p><strong>Top Comments:</strong><br><ul>`;
        commentHTML += `<li style="margin-bottom: 0.5em;">${game.recent_comments}</li>`;
      commentHTML += `</ul></p>`;
}

content.innerHTML = `
  <h2>${game.title}</h2>
  <p><strong>Rating:</strong> ${(game.rating && game.rating_count >= 2) ? `${game.rating}★` : "No rating"} (${game.rating_count || 0} votes)</p>
  <img src="${game.image_url}" style="width: 100%; border-radius: 8px;" />
  <p style="margin-top: 1em;"><strong>Description:</strong><br>${game.description}</p>
  <p><strong>Tags:</strong><br>${tagHTML}</p>
  ${commentHTML}
  <p style="margin-top: 1em;"><a href="${game.url}" target="_blank" style="color: #fa5c5c;">Open in Itch.io →</a></p>
`;

  sidebar.classList.remove("hidden");
  sidebar.classList.add("visible");
}

function openSidebarFromElement(el) {
  try {
    const game = JSON.parse(unescapeHTML(el.dataset.game));
    openSidebar(game);
  } catch (err) {
    console.error("Failed to parse game data:", err);
  }
}

function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.remove("visible");
  sidebar.classList.add("hidden");
}

// ESCAPE HELPERS

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}

function unescapeHTML(str) {
  return str.replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&");
}
