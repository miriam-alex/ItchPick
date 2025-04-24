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

  console.log("added tag " + tagText)
  console.log(selectedTags)
}

function removeTag(button) {
  const tagEl = button.parentElement;
  // Slice is to get rid of the x and then trimming for any extra whitespace
  const tagText = tagEl.textContent.slice(0, -1).trim();
  console.log(tagText)
  selectedTags.delete(tagText);
  tagEl.remove();
  console.log(selectedTags)
  populateDropdown();
}

populateDropdown(); // Initial fill

// TRIGGERING SEARCH ON KEYPRESS

const input = document.getElementById("filter-text-val");

// Trigger function on Enter key
input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent default form behavior
    filterText();
  }
});


// GENERATING RESULTS (from class)

function galleryItemTemplate(title, url, image_url, description, rating, rating_count, tags) {
  rating_string = (rating == null || rating_count < 5) ? "" : `(${rating}★)`
  title_string = (rating == null || rating_count < 5) ? `${title}:` : `${title} ${rating_string}:`

  spanContents = ""

  tags.forEach(element => {
    const tagEl = `<span class=tag> ${element} </span>`
    spanContents += tagEl + " "
  });

  return `<div class="gallery-item">
      <a href="${url}" target="_blank" rel="noopener noreferrer">
        <img src="${image_url}" alt="Thumbnail of ${title}">
        <div class="overlay">
          <b>${title_string}</b>  ${description} 
          <span class="tag-span">
          ${spanContents}
          </span>
        </div>
      </a>
  </div>`
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
    tempDiv = document.createElement("div")
    // console.log(row)
    if (row.image_url == null) {
      row.image_url = "https://static.itch.io/images/itchio-textless-white.svg"
    }
    tempDiv.innerHTML = galleryItemTemplate(row.title, row.url, row.image_url, row.description, row.rating, row.rating_count, row.tags)
    document.getElementById("gallery").appendChild(tempDiv)
  }
}

function filterText() {
  document.getElementById("gallery").innerHTML = ""
  console.log("------------------------------------------")
  console.log("query: " + document.getElementById("filter-text-val").value)
  console.log("filter tags: ")
  console.log(selectedTags)
  
  if (filterText)
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

// MODAL CODE

const modal = document.getElementById("modal");
const icon = document.getElementById("filter-image");
const closeButton = document.querySelector(".close-button");

icon.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

closeButton.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Optional: Close modal on background click
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});