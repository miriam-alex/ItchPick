// DYNAMICALLY GENERATING THE TAG DROPDOWN

const tagList = ["Free", "Visual Novel", "Simulation", "Rhythm", "Puzzle"];

const dropdown = document.getElementById("tag-dropdown");

// placeholder option
const defaultOption = document.createElement("option");
defaultOption.value = "";
defaultOption.disabled = true;
defaultOption.selected = true;
defaultOption.textContent = "Select tag(s)";
dropdown.appendChild(defaultOption);

tagList.forEach(function (tag) {
  const option = document.createElement("option");
  option.value = tag;
  option.textContent = tag;
  dropdown.appendChild(option);
});


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

function filterText() {
  document.getElementById("answer-box").innerHTML = ""
  selectedTagString = document.getElementById("tag-dropdown").value
  console.log("------------------------------------------")
  console.log("query: " + document.getElementById("filter-text-val").value)
  console.log("tag: " + document.getElementById("tag-dropdown").value)
  fetch("/episodes?" + new URLSearchParams({ title: document.getElementById("filter-text-val").value }).toString())
    .then((response) => response.json())
    .then((data) => data.forEach(row => {
      if (selectedTagString == "" || row.tags.includes(selectedTagString)) {
        console.log(row.tags)
        tempDiv = document.createElement("div")
        tempDiv.innerHTML = answerBoxTemplate(row.title, row.description, row.rating, row.score)
        document.getElementById("answer-box").appendChild(tempDiv)
      }
    }));

}