// DYNAMICALLY GENERATING THE TAG DROPDOWN

const availableTags = ["Visual Novel", "Simulation", "Rhythm", "Puzzle"];

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
    dropdown.style.display = 'none';
  } else {
    dropdown.disabled = false;
  }
}

function addSelectedTag(selectElement) {
  const tagText = selectElement.value;

  if (!tagText || selectedTags.has(tagText)){
    return;
  }

  const tagEl = document.createElement("span");
  tagEl.className = "tag";
  tagEl.innerHTML = `${tagText} <button class="remove-tag" onclick="removeTag(this)">×</button>`;

  tagsContainer.insertBefore(tagEl, dropdown);
  selectedTags.add(tagText);
  populateDropdown();

  console.log("added tag " + tagText)
  console.log(selectedTags)
}

function removeTag(button) {
  const tagEl = button.parentElement;
  // Slice is to get rid of the x and then trimming for any extra whitespace
  const tagText = tagEl.textContent.slice(0, -2).trim();
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

function answerBoxTemplate(title, titleDesc, rating, score) {
  return `<div class=''>
        <h3 class='episode-title'>${title}</h3>
        <p class='episode-desc'>${titleDesc}</p>
        <p class='episode-rating'>Rating: ${rating}</p>
        <p class='cosine-score'>Cosine Similarity: ${score}</p> 
    </div>`
}

function sendFocus() {
  document.getElementById('filter-text-val').focus()
}

function setsOverlap(set1, set2) {
  return [...set1].some(element => set2.has(element));
}

function filterText() {
  document.getElementById("answer-box").innerHTML = ""
  console.log("------------------------------------------")
  console.log("query: " + document.getElementById("filter-text-val").value)
  fetch("/episodes?" + new URLSearchParams({ title: document.getElementById("filter-text-val").value }).toString())
    .then((response) => response.json())
    .then((data) => data.forEach(row => {
      var rowTagSet = new Set(row.tags)
      if (selectedTags.size == 0 || setsOverlap(rowTagSet, selectedTags)) {
        tempDiv = document.createElement("div")
        console.log(row.title + " has the following tags")
        console.log(rowTagSet)
        tempDiv.innerHTML = answerBoxTemplate(row.title, row.description, row.rating, row.score)
        document.getElementById("answer-box").appendChild(tempDiv)
      }
    }));

}