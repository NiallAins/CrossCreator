let size = 9,
    autoMirror = true;

let table = document.getElementById('grid'),
    across = document.getElementById('across'),
    down = document.getElementById('down');

let grid = [],
    cells = [],
    answers = [];

function createGrid() {
  table.innerHTML = '';
  for (let y = 0; y < size; y++) {
    let row = document.createElement('tr');
    for (let x = 0; x < size; x++) {
      row.innerHTML += `
        <td>
          <span></span>
          <input
            type="text"
            maxlength="1"
            onkeydown="cellKey(event, ${(y * size) + x})"
          >
        </td>
      `;
    }
    table.appendChild(row);
  }
  grid = table.getElementsByTagName('input');
  labels = table.getElementsByTagName('span');
  drawNums();
  getAnswers();
  drawClues();
}

function cellKey(ev, index) {
  switch (ev.keyCode) {
    // Arrow Keys: U, D, L, R
    case 38:
      if (index >= size) {
        grid[index - size].focus();
      }
      break;
    case 40:
      if (index + size < grid.length) {
        grid[index + size].focus();
      }
      break;
    case 37:
      if (index % size !== 0) {
        grid[index - 1].focus();
      }
      break;
    case 39:
      if (index % size !== size - 1) {
        grid[index + 1].focus();
      }
      break;
    //Backspace
    case 8:
      if (grid[index].value === '') {
        toggleBlock(index);
      } else {
        grid[index].value = '';
        getAnswers();
        drawClues();
      }
      break;
    //Space
    case 32:
      toggleBlock(index);
      break;
    //Enter
    case 13:
      toggleBlock(index);
      break;
    //Letters
    default:
      if (ev.keyCode >= 65 && ev.keyCode <= 90) {
        if (grid[index].className === 'block') {
          toggleBlock(index);
        }
        grid[index].value = ev.key.toUpperCase();
        getAnswers();
        drawClues();
      }
  }
}

function toggleBlock(index) {
  grid[index].classList.toggle('block');
  let oppIndex = (grid.length - 1) - index;
  if (autoMirror && index !== oppIndex) {
    grid[oppIndex].classList.toggle('block');
  }
  drawNums();
  getAnswers();
  drawClues();
}

function drawNums() {
  let labelNum = 1;
  answers = [];
  for (let i = 0; i < labels.length; i++) {
    let labeled = false;
    if (grid[i].className !== 'block') {
      //Across
      if (
        (i % size === 0 || grid[i - 1].className === 'block') &&
        (i % size < size - 1 && grid[i + 1].className !== 'block')
      ) {
        answers.push({
          start: i,
          index: labelNum,
          across: true
        });
        labeled = true;
      }
      //Down  
      if (
        (i < size || grid[i - size].className === 'block') &&
        (grid[i + size] && grid[i + size].className !== 'block')
      ) {
        answers.push({
          start: i,
          index: labelNum,
          across: false
        });
        labeled = true;
      }
      if (labeled) {
        labels[i].innerText = labelNum;
        labelNum++;
      } else {
        labels[i].innerText = '';
      }
    }
  }
}

function getAnswers() {
  across.innerHTML = '';
  down.innerHTML = '';
  answers.forEach((a, i) => {
    let answerStr = '',
        cell = a.start;
    if (a.across) {
      do {
        answerStr += grid[cell].value || '_ ';
        cell++;
      } while (cell % size !== 0 && grid[cell].className !== 'block');
      answers[i].answerStr = answerStr;
    } else {
      while (cell < grid.length && grid[cell].className !== 'block') {
        answerStr += grid[cell].value || '_ ';
        cell += size;
      }
      answers[i].answerStr = answerStr;
    }
  });
}

function drawClues() {
  across.innerHTML = '';
  down.innerHTML = '';
  answers.forEach(a => {
    let content = `
      <li value="${a.index}">
        <span class="preview-hide"> Answer: ${a.answerStr} </span>
    `;
    if (a.answerStr.match(/[a-zA-Z]/)) {
        if (a.answerStr.match(/[a-zA-Z]{3,}/)) {
          content += `<button class="tool anag preview-hide" onclick="openSite('anag', '${a.answerStr}')">A</button>`;
        }
        if (a.answerStr.match(/_/)) {
          content += `<button class="tool solv preview-hide" onclick="openSite('solv', '${a.answerStr}')">S</button>`;
        } else {
          content += `
            <button class="tool thes preview-hide" onclick="openSite('thes', '${a.answerStr}')">T</button>
            <button class="tool dict preview-hide" onclick="openSite('dict', '${a.answerStr}')">D</button>
          `;
        }
    }
    content += `
        <textarea class="clue" placeholder="Clue..." onkeydown="autoSize(this)"></textarea>
      </li>`;
    if (a.across) {
      across.innerHTML += content;
    } else {
      down.innerHTML += content;
    }
  });
}

function resize(increase) {
  size += increase ? 1 : -1;
  size = Math.max(size, 2);
  createGrid();
}

function autoSize(el) {
  setTimeout(() => {
    el.style.height = 'auto';
    el.style.padding = '0px 4px';
    el.style.height = el.scrollHeight + 'px';
  }, 0);
}

function openSite(site, answer) {
  if (site === 'solv') {
    let url = answer.replace(/ /g, '').replace(/_/g, '-');
    window.open('https://www.crosswordsolver.org/solve/' + url, '_blank');
  }
  if (site === 'dict') {
    let url = answer.replace(/ |_/g, '');
    window.open('https://www.dictionary.com/browse/' + url, '_blank');
  }
  if (site === 'thes') {
    let url = answer.replace(/ |_/g, '');
    window.open('https://www.thesaurus.com/browse/' + url, '_blank');
  }
  if (site === 'anag') {
    let url = answer.replace(/ |_/g, '');
    window.open('https://new.wordsmith.org/anagram/anagram.cgi?anagram=' + url, '_blank');
  }
}

createGrid();