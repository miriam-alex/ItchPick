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

function fetchDimensions(gameId, queryDims) {

  ordinal_numbers = ["First", "Second", "Third", "Fourth", "Fifth"]
  
  fetch("/dimensions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_id: gameId })
  })
    .then(res => res.json())
    .then(gameDims => {
      const container = document.getElementById(`dims-container-${gameId}`);
      container.innerHTML =  "<canvas id='dimsChart'></canvas>"
      queryDims = JSON.parse(queryDims)

      console.log("GAME DIMS")
      console.log(gameDims)
      console.log("QUERY DIMS")
      console.log(queryDims)

      // List of words that we don't want to show to the user (will omit)
      const uselessWords = ["license","button","level","version","itch","io","arrow","controls","mouse","v1","space","https","wasd", "linkify","href"]
      const uselessWordsSet = new Set(uselessWords);

      const gameWeights = gameDims.map(dim => dim.relative_strength);
      const queryWeights = queryDims.map(dim => dim.relative_strength);
      const gameWords = gameDims
                      .map(dim => dim.dimension.filter(word => !uselessWordsSet.has(word)))
      const queryWords = queryDims
                      .map(dim => dim.dimension.filter(word => !uselessWordsSet.has(word)))
      renderDimsChart(gameWeights, queryWeights, gameWords, queryWords);

      if (queryWeights[0] === 0) {
        const note = document.createElement("p");
        note.textContent = "Note: query contains no recognizable terms";
        container.appendChild(note);
      }

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

  tags = tags.slice(0,3)

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
  let count = 0;
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
          count++;
        }
      });
      if (count === 0) {
        const gallery = document.getElementById("gallery");
        gallery.innerHTML = `
          <div style="text-align: center; padding: 40px; font-size: 1.2em; color: #999;">
            No results found
          </div>`;
      }
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

  console.log("game object: ")
  console.log(game)

  query_dims = JSON.stringify([game.top_query_dim1, game.top_query_dim2, game.top_query_dim3, game.top_query_dim4, game.top_query_dim5]).replace(/"/g, '&quot;');

  const topDimHTML = `
  <button onclick="fetchDimensions(${game.id}, '${query_dims}')" id="top-dim-btn" class="dim-btn">${showDimText}</button>
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
    <p><strong>Price:</strong> ${(game.price == 0 ? "Free" : "$" + game.price)}</p>
    <img src="${game.image_url}" style="width: 100%; border-radius: 8px;" />
    <p style="margin-top: 1em;"><strong>Description:</strong><br>${game.description}</p>
    <p><strong>Tags:</strong><br>${tagHTML}</p>
    ${scoreHTML}
    ${commentHTML}
    ${topDimHTML}
    <div id="circular-graph-${game.id}" style="margin-top: 20px;"></div>
    <p style="margin-top: 1em;"><a href="${game.url}" target="_blank" style="color: #fa5c5c;">Open in Itch.io →</a></p>
  `;

  sidebar.classList.remove("hidden");
  // renderCircularGraph([
  //   game.top_query_dim1,
  //   game.top_query_dim2,
  //   game.top_query_dim3,
  //   game.top_query_dim4,
  //   game.top_query_dim5
  // ], `circular-graph-${game.id}`);    
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

// let's see if the circle renders -_-

const width = 400, height = 500; 


function renderCircularGraph(dimStrings, containerId) {
  const width = 400, height = 400, innerRadius = 40, ringStep = 25;
  const colorBase = "#fa5c5c"; // base hue

  // word strings into array
  const dimWords = dimStrings.map(str => str.split(",").map(w => w.trim()).filter(Boolean));

  const allWords = dimWords.flat();
  const totalBars = allWords.length;

  const svg = d3.select(`#${containerId}`).html("").append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const angleScale = d3.scaleBand()
    .domain(d3.range(totalBars))
    .range([0, 2 * Math.PI])
    .padding(0.03);

  let barIndex = 0;
  dimWords.forEach((words, dimIndex) => {
    const barHeight = 40 + dimIndex * 15; // dim1 length > dim5
    const brightness = 0.6 + 0.1 * dimIndex; // lighten colors for each dimension
    const dimColor = d3.hsl(colorBase);
    dimColor.l = brightness;

    words.forEach((word, i) => {
      const angle = angleScale(barIndex);
      const x0 = Math.cos(angle) * innerRadius;
      const y0 = Math.sin(angle) * innerRadius;
      const x1 = Math.cos(angle) * (innerRadius + barHeight);
      const y1 = Math.sin(angle) * (innerRadius + barHeight);

      // each bar 
      g.append("line")
        .attr("x1", x0)
        .attr("y1", y0)
        .attr("x2", x1)
        .attr("y2", y1)
        .attr("stroke", dimColor.toString())
        .attr("stroke-width", 4);

        const labelRadius = innerRadius + barHeight + 20 + (barIndex % 2 === 0 ? 4 : 0);  // stagger for evens and odds
        const lx = Math.cos(angle) * labelRadius;
        const ly = Math.sin(angle) * labelRadius;

        const angleDeg = (angle * 180 / Math.PI);
        const shouldFlip = angleDeg > 90 && angleDeg < 270;

        g.append("text")
          .attr("x", lx)
          .attr("y", ly)
          .attr("dy", "0.35em")
          .attr("transform", `rotate(${shouldFlip ? angleDeg + 180 : angleDeg}, ${lx}, ${ly})`)
          .style("text-anchor", "middle")
          .style("alignment-baseline", "middle")
          .style("font-size", "9px")
          .style("fill", "#fff")
          .text(word);

        


      barIndex++;
    });
  });
}

// TODO: add a legend?

function renderDimsChart(gameWeights, queryWeights, gameWords, queryWords) {
  const ctx = document.getElementById('dimsChart').getContext('2d');

  const latentDimensions = ['Dim 1', 'Dim 2', 'Dim 3', 'Dim 4', 'Dim 5'];

  gameWords = gameWords.map(wordArray => wordArray.slice(0,5).join(', '))
  queryWords = queryWords.map(wordArray => wordArray.slice(0,5).join(', '))

  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: latentDimensions,
          datasets: [
              {
                  label: 'Weight of game dimension',
                  data: gameWeights,
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
              },
              {
                  label: 'Weight of query dimension',
                  data: queryWeights,
                  backgroundColor: 'rgba(255, 99, 132, 0.6)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
              }
          ]
      },
      options: {
        responsive: true,
        devicePixelRatio: 2,
        maintainAspectRatio: true,
        plugins: {
            tooltip: {
                backgroundColor: '#333',
                bodyFont: {
                    family: 'Lato',
                    size: 12
                },
                callbacks: {
                    afterBody: function(context) {
                        const index = context[0].dataIndex;
                        return [
                            'Game Top Words: ' + gameWords[index],
                            'Query Top Words: ' + queryWords[index]
                        ];
                    }
                }
            },
            title: {
                display: true,
                color: '#fff',
                font: {
                    family: 'Lato',
                    size: 12,
                    weight: 'bold'
                }
            },
            legend: {
                labels: {
                    color: '#fff',
                    font: {
                        family: 'Lato'
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#fff',
                    font: {
                        family: 'Lato'
                    }
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#fff',
                    font: {
                        family: 'Lato'
                    }
                }
            }
        }
      }
  });
  }