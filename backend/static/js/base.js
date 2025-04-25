// DYNAMICALLY GENERATING THE TAG DROPDOWN

/*
Counter({'Games': 2225, 'Free': 1981, 'Visual Novel': 352, 'Adventure': 268, 'Action': 194, 'Featured': 188, 
'Platformer': 177, 'Puzzle': 177, 'Interactive Fiction': 151, '$5 or less': 135, 'Simulation': 124, 'Role Playing': 70, 
'$15 or less': 68, 'Shooter': 67, 'Survival': 62, 'Strategy': 61, 'Educational': 32, 'Card Game': 30, 'Rhythm': 22, 
'Fighting': 21, 'Racing': 16, 'Sports': 13, 'On sale': 4})
*/

const words = ["Grandmas and cafes...", "Cute cats..."];
const availableTags = ["Visual Novel", "Adventure", "Action", "Featured", "Platformer", "Puzzle", "Simulation", "Role Playing", "Shooter", "Survival", "Strategy", "Educational", "Card Game", "Rhythm", "Fighting", "Racing", "Sports"];
let availableAuthors = [];
let availableAuthorsLowercase = []

const selectedTags = new Set();

const dropdown = document.getElementById("tagDropdown");
const tagsContainer = document.getElementById("tagsContainer");
const banner = document.getElementById("filter-banner")

let selectedDeveloper = "";
let selectedPrice = null;

function showLoader() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = `
    <div id="loader" style="display: flex; justify-content: center; align-items: center; height: 200px;">
      <div class="spinner" style="width: 40px; height: 40px; border: 4px solid rgba(255, 255, 255, 0.2); border-top: 4px solid #fa5c5c;; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>
  `;
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.remove();
}

function fetchDimensions(gameId, topQueryDim1, topQueryDim2, topQueryDim3, topQueryDim4, topQueryDim5) {
  
  fetch("/dimensions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_id: gameId })
  })
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById(`dims-container-${gameId}`);
      const gameDimHTML1 = 
        data.dim1 && data.dim1.length > 0
        ? `<p><strong>Top Words in Game's Top Dimension:</strong> ${data.dim1}</p>`
        : `<p>No game dimension data available.</p>`
      const gameDimHTML2 = 
        data.dim2 && data.dim2.length > 0
        ? `<p><strong>Top Words in Game's Second Top Dimension:</strong> ${data.dim2}</p>`
        : `<p>No game dimension data available.</p>`
      const gameDimHTML3 = 
        data.dim3 && data.dim3.length > 0
        ? `<p><strong>Top Words in Game's Third Top Dimension:</strong> ${data.dim3}</p>`
        : `<p>No game dimension data available.</p>`
      const gameDimHTML4 = 
        data.dim4 && data.dim4.length > 0
        ? `<p><strong>Top Words in Game's Fourth Top Dimension:</strong> ${data.dim4}</p>`
        : `<p>No game dimension data available.</p>`
      const gameDimHTML5 =
        data.dim5 && data.dim5.length > 0
        ? `<p><strong>Top Words in Game's Fifth Top Dimension:</strong> ${data.dim5}</p>`
        : `<p>No game dimension data available.</p>`

      const queryDimHTML1 = 
        topQueryDim1 && topQueryDim1.length > 0
          ? `<p><strong>Top Words in Query's Top Dimension:</strong> ${topQueryDim1}</p>`
          : `<p>No query dimension data available.</p>`
      const queryDimHTML2 =
        topQueryDim2 && topQueryDim2.length > 0
          ? `<p><strong>Top Words in Query's Second Top Dimension:</strong> ${topQueryDim2}</p>`
          : `<p>No query dimension data available.</p>`
      const queryDimHTML3 =
        topQueryDim3 && topQueryDim3.length > 0
          ? `<p><strong>Top Words in Query's Third Top Dimension:</strong> ${topQueryDim3}</p>`
          : `<p>No query dimension data available.</p>`
      const queryDimHTML4 =
        topQueryDim4 && topQueryDim4.length > 0
          ? `<p><strong>Top Words in Query's Fourth Top Dimension:</strong> ${topQueryDim4}</p>`
          : `<p>No query dimension data available.</p>`
      const queryDimHTML5 =
        topQueryDim5 && topQueryDim5.length > 0
          ? `<p><strong>Top Words in Query's Fifth Top Dimension:</strong> ${topQueryDim5}</p>`
          : `<p>No query dimension data available.</p>`

      container.innerHTML = gameDimHTML1 + queryDimHTML1 + gameDimHTML2 + queryDimHTML2 + gameDimHTML3 + queryDimHTML3 + gameDimHTML4 + queryDimHTML4 + gameDimHTML5 + queryDimHTML5;
    })
    .catch(err => console.error("Error fetching dimensions:", err));
}

// TAG SYSTEM CODE ----------------------------------------------------------

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

// GENERATING GALLERY RESULTS -------------------------------

function roundToOneDecimal(num)
{
  return Math.round(num * 10) / 10
}

function galleryItemTemplate(title, url, image_url, description, rating, rating_count, tags, recent_comments, author, price, score, id, top_query_dim1, top_query_dim2, top_query_dim3, top_query_dim4, top_query_dim5) {
  const rating_string = (rating == null || rating_count < 5) ? "" : `(${rating}★)`
  const title_string = (rating == null || rating_count < 5) ? `${title}:` : `${title} ${rating_string}`

  let spanContents = ""
  tags.forEach(element => {
    const tagEl = `<span class="tag"> ${element} </span>`
    spanContents += tagEl + " "
  });

  const gameObj = { title, url, image_url, description, tags, recent_comments, rating_count, rating, author, price, score, id, top_query_dim1, top_query_dim2, top_query_dim3, top_query_dim4, top_query_dim5};
  // console.log("Rendering game:", gameObj);

  return `
    <div class="gallery-item" 
      data-game='${escapeHTML(JSON.stringify(gameObj))}' 
      onclick="openSidebarFromElement(this)">
      <img src="${image_url}" alt="Thumbnail of ${title}">
      <div class="overlay">
        <b>${title_string}</b> 
        ${description}
        <span class="tag-span">${spanContents}</span>
        ${score ? `<p><strong>Score:</strong> ${roundToOneDecimal(score)}</p>` : ""}
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
      row.recent_comments,
      row.author,
      row.price,
      row.score,
      row.id,
      row.top_query_dim1,
      row.top_query_dim2,
      row.top_query_dim3,
      row.top_query_dim4,
      row.top_query_dim5,
    );
    document.getElementById("gallery").appendChild(tempDiv);
  }
}



function filterText() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  showLoader(); 
  // console.log("------------------------------------------")
  // console.log("query: " + document.getElementById("filter-text-val").value)
  const query = document.getElementById("filter-text-val").value.trim();
  fetch("/episodes?" + new URLSearchParams({ title: query }).toString())
    .then((response) => response.json())
    .then((data) => {
      data.forEach((row) => {
        // restricting search to just the selected developer, if specified
        const validDeveloper = selectedDeveloper === "" || row.author.toLowerCase() === selectedDeveloper;
        const validPrice = selectedPrice == null || row.price <= selectedPrice;

        // RESTRICTING SEARCH TO JUST THAT DEVELOPER
        if (validDeveloper && validPrice) {
          filterTextHelper(row);
        }
      });
    })
    .finally(() => {
      hideLoader();
    });
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
  document.body.classList.add("sidebar-open");
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("sidebar-content")

  const tagHTML = game.tags.map(tag => {
    const isSelected = selectedTags.has(tag);
    const extraClass = isSelected ? "tag-selected" : "";
    return `<span class="tag ${extraClass}">${tag}</span>`;
  }).join(" ");

  let scoreHTML = ""; 
  if (game.score > 0) {
    scoreHTML += `<p><strong>SVD Score (Boosted):</strong> ${game.score}</p>`
  }
  const showDimText = "Show Top 5 Dimensions"
  const hideDimText = "Hide Dimensions"
  const divID = `dims-container-${game.id}`

  const topDimHTML = `
  <button onclick="fetchDimensions(${game.id}, '${game.top_query_dim1}', '${game.top_query_dim2}', '${game.top_query_dim3}', '${game.top_query_dim4}', '${game.top_query_dim5}')" id="top-dim-btn" class="dim-btn">${showDimText}</button>
  <div id="${divID}"></div>`;


  let commentHTML = "";
  if (game.recent_comments && game.recent_comments.length > 0) {
    const topComments = [...game.recent_comments]
      .sort((a, b) => b[1] - a[1]) 
      .slice(0, 3); 
    commentHTML = `<p><strong>Top Comments:</strong><br><ul>`;
    topComments.forEach(commentPair => {
      const commentText = commentPair[0];
      const score = commentPair[1];
      commentHTML += `<li style="margin-bottom: 0.5em;">${commentText} <span style="color: gray;">(Upvotes: ${score})</span></li>`;
    });
    commentHTML += `</ul></p>`;
  }

content.innerHTML = `
  <h2>${game.title}</h2>
  <p><strong>Rating:</strong> ${(game.rating && game.rating_count >= 2) ? `${game.rating}★` : "No rating"} (${game.rating_count || 0} votes)</p>
  <img src="${game.image_url}" style="width: 100%; border-radius: 8px;" />
  <p style="margin-top: 1em;"><strong>Description:</strong><br>${game.description}</p>
  <p><strong>Tags:</strong><br>${tagHTML}</p>
  ${scoreHTML}
  ${topDimHTML}
  ${commentHTML}
  <p style="margin-top: 1em;"><a href="${game.url}" target="_blank" style="color: #fa5c5c;">Open in Itch.io →</a></p>
`;

    sidebar.classList.remove("hidden");
    sidebar.classList.add("visible");

    const topDimensionsButton = document.getElementById("top-dim-btn");
    const topDimensionsDiv = document.getElementById(divID);

    topDimensionsButton.addEventListener("click", () => {
      if (topDimensionsButton.textContent == showDimText) {
        topDimensionsButton.textContent = hideDimText
        topDimensionsDiv.style.display = "block";
      } else {
        topDimensionsButton.textContent = showDimText
        topDimensionsDiv.style.display = "none"
      }
    });
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
  document.body.classList.remove("sidebar-open");

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

// --------------- MODAL ----------------------------------

const suggestionBox = document.getElementById("author-suggestions")
const modal = document.getElementById("modal");
const icon = document.getElementById("filter-image");
const closeButton = document.querySelector(".close-button");
const priceInput = document.getElementById('price');
const priceValue = document.getElementById('price-value');
const applyFilterButton = document.getElementById('apply-filter-button');
const authorSearch = document.getElementById("author-search")

icon.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });
  
  closeButton.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

fetch('/authors')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    availableAuthors = [...new Set(data)]
    availableAuthorsLowercase = availableAuthors.map(author => author.toLowerCase());
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });

// code for price slider
priceInput.addEventListener('input', function () {
  priceValue.textContent = "$" + this.value;
  if (this.value == 25) {
    priceValue.textContent = "No limit"
  } else if (this.value == 0) {
    priceValue.textContent = "Free"
  }
});


function showBanner() {
  banner.style.display = "block"; 

  requestAnimationFrame(() => {
    banner.classList.add("show");
  });

  setTimeout(() => {
    banner.classList.remove("show");

    setTimeout(() => {
      banner.style.display = "none";
    }, 400); 
  }, 3000);
}

applyFilterButton.addEventListener("click", function() {
  selectedDeveloper = authorSearch.value.toLowerCase().trim();
  if (priceValue.value == 25) {
    selectedPrice = null;
  } else {
    selectedPrice = priceInput.value
  }
  modal.classList.add("hidden");
  showBanner();
});

function validateInput(value) {
  return availableAuthorsLowercase.includes(value.toLowerCase());
}

authorSearch.addEventListener("input", () => {
  const query = authorSearch.value.trim().toLowerCase();
  suggestionBox.innerHTML = ""; 

  applyFilterButton.disabled = !validateInput(query);
  console.log("input invalid: " + !validateInput(query))

  if (query === "") return;
  
  const matches = availableAuthors.filter(author => author.toLowerCase().includes(query));

  matches.forEach(match => {
    const li = document.createElement("li");
    li.textContent = match;
    li.addEventListener("click", () => {
      authorSearch.value = match; 
      suggestionBox.innerHTML = "";
      authorSearch.dispatchEvent(new Event('input'));
    });
    suggestionBox.appendChild(li);
  });
});