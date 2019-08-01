function Cell() {
  this.isBlock = false;
  this.label = '';
  this.letter = '';
  this.answer = [
    { index: -1, pos: -1 }, 
    { index: -1, pos: -1 } 
  ];
}
  Cell.prototype.reset = function() {
    this.label = '';
    this.answer.forEach(a => a.pos = a.index = -1);
  };
  
function Answer(num) {
  this.label = num;
  this.text = '';
  this.complete = false;
  this.solvalbe = false;
  this.anagramable = false;
}
  Answer.prototype.setFlags = function() {
    this.complete = (this.text.indexOf('-') === -1);
    this.solvable = !this.complete && !!(this.text.match(/(.*[A-Z].*){2,}/));
    this.anagramable = !!(this.text.match(/(.*[A-Z].*){3,}/)); 
  };

  Answer.prototype.editLetter = function(pos, letter) {
    this.text = this.text.substring(0, pos) + (letter || '-') + this.text.substr(pos + 1);
    this.setFlags();
  };
  
  let app = new Vue({
    el: '#app',
    data: {
      size: 9,
      title: '',
      autoMirror: true,
      isPreview: false,
      isPrinting: false,
      grid: [],
      clues: [[], []],
      answers: [[], []],
      dirSelect: 0,
      activeAnswer: -1
    },
    created: function() {
      // Build grid
      for (let r = 0; r < this.size; r++) {
        this.grid.push([]);
        for (let c = 0; c < this.size; c++) {
          this.grid[r].push(new Cell());
        }
      }
      this.updateNums();
    },
    watch: {
      size: function(current, old) {
        // Expand grid
        if (current > old) {
          this.grid.push([]);
          for (let i = 0; i < current; i++) {
            this.grid[i].push(new Cell());
            if (i !== current - 1) {
              this.grid[current - 1].push(new Cell());
            }
          }
        }
        // Shrink grid
        else {
          this.grid.pop();
          for (let i = 0; i < current; i++) {
            this.grid[i].pop();
          } 
        }
        this.updateNums();
      }
    },
    methods: {
      // Updates the numbers and answers whenever the grid layout changes
      updateNums: function() {
        let labelNum = 1;
        this.answers = [[],[]];
        this.grid.forEach(row => row.forEach(cell => cell.reset()));
        this.grid.forEach((row, r) => {
          row.forEach((cell, c) => {
            let labeled = false;
            if (!cell.isBlock) {
              //Across
              if (
                (c === 0 || row[c - 1].isBlock) &&
                (c < this.size - 1 && !row[c + 1].isBlock)
              ) {
                labeled = true;
                let ans = new Answer(labelNum);
                for (let i = c; i < this.size; i++) {
                  if (row[i].isBlock) {
                    break;
                  }
                  if (row[i].letter) {
                    ans.text += row[i].letter;
                  } else {
                    ans.text += '-';
                  }
                  row[i].answer[0] = {
                    index: this.answers[0].length,
                    pos: ans.text.length - 1
                  } 
                }
                ans.setFlags();
                this.answers[0].push(ans);
              }
              //Down  
              if (
                (r === 0 || this.grid[r - 1][c].isBlock) &&
                (this.grid[r + 1] && !this.grid[r + 1][c].isBlock)
              ) {
                labeled = true;
                let ans = new Answer(labelNum);
                for (let i = r; i < this.size; i++) {
                  if (this.grid[i][c].isBlock) {
                    break;
                  }
                  if (this.grid[i][c].letter) {
                    ans.text += this.grid[i][c].letter;
                  } else {
                    ans.text += '-';
                  }
                  this.grid[i][c].answer[1] = {
                    index: this.answers[1].length,
                    pos: ans.text.length - 1
                  }
                }
                ans.setFlags();
                this.answers[1].push(ans);
              }
              if (labeled) {
                cell.label = labelNum;
                labelNum++;
              } else {
                cell.label = '';
              }
            }
            // Add more clues if necessiary
            for (let i = this.clues[0].length; i < this.answers[0].length; i++) {
              this.clues[0].push('');
            }
            for (let i = this.clues[1].length; i < this.answers[1].length; i++) {
              this.clues[1].push('');
            }
          });
        });
      },
      
      // Change active answer when cell is selected / focused
      cellSelect: function(cell) {
        if (cell.answer[this.dirSelect].index === -1) {
          this.dirSelect = this.dirSelect ? 0 : 1;
        }
        this.activeAnswer = cell.answer[this.dirSelect].index;
      },
      
      // Keyboard listener for the grid
      cellKey: function(e, cell, r, c) {
        if (this.isPreview) {
          return;
        }
        // Add Letter
        if (e.keyCode >= 65 && e.keyCode <= 90) {
          if (cell.isBlock) {
            this.toggleBlock(cell);
            this.updateNums();
          }
          cell.letter = e.key.toUpperCase();
          this.updateAnswer(cell);
          // Simulate left or down key press
          this.cellKey(
            {
              keyCode: this.dirSelect ? 40 : 39,
              preventDefault: ()=>{}
            },
            cell, r, c
          );
        }
        // Directional Keys
        else if (e.keyCode >= 37 && e.keyCode <= 40) {
          e.preventDefault();
          if (
              ((e.keyCode === 37 || e.keyCode === 39) && this.dirSelect) ||
              ((e.keyCode === 38 || e.keyCode === 40) && !this.dirSelect)
          ) {
            this.dirSelect = this.dirSelect ? 0 : 1;
            this.activeAnswer = cell.answer[this.dirSelect].index;
            if (!cell.isBlock) {
              return;
            }
          }
          let row = r,
              col = c;
          if (e.keyCode === 37 && c > 0) {
            col--;
          } else if (e.keyCode === 38 && r > 0) {
            row--;
          } else if (e.keyCode === 39 && c < this.size - 1) {
            col++;
          } else if (e.keyCode === 40 && r < this.size - 1) {
            row++;
          }
          this.$refs.grid.childNodes[row].childNodes[col].focus();
        }
        // Toggle blocks
        else if (e.keyCode === 32) {
          e.preventDefault();
          this.toggleBlock(cell);
          this.updateNums();
        }
        //Backspace
        else if (e.keyCode === 8) {
          if (cell.isBlock) {
            this.toggleBlock(cell);
            this.updateNums();
          }
          cell.letter = '';
          // Simulate backspace move
          this.cellKey(
            {
              keyCode: this.dirSelect ? 38 : 37,
              preventDefault: ()=>{}
            },
            cell, r, c
          );
          this.updateAnswer(cell);
        }
      },

      // Updates the Answers' strings when cell letter changes 
      updateAnswer: function(cell) {
        if (cell.answer[0].index !== -1) {
          this.answers[0][cell.answer[0].index].editLetter(cell.answer[0].pos, cell.letter);
        }
        if (cell.answer[1].index !== -1) {
            this.answers[1][cell.answer[1].index].editLetter(cell.answer[1].pos, cell.letter);
        }
      },
      
      // Set grid cell to a block and mirror if necessicary
      toggleBlock: function(cell) {
        cell.isBlock = !cell.isBlock;
        if (this.autoMirror) {
          parentLoop:
          for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
              if (this.grid[r][c] === cell) {
                let mirrorBlock = this.grid[this.size - 1 - r][this.size - 1 - c];
                if (mirrorBlock .isBlock !== cell.isBlock) {
                  mirrorBlock.isBlock = !mirrorBlock.isBlock;
                }
                break parentLoop;
              }
            }
          }
        }
      },
      
      // Searches answers on external sites
      openSite: function(site, answer) {
        if (site === 'solv') {
          let url = answer.replace(/ /g, '');
          window.open('https://www.crosswordsolver.org/solve/' + url, '_blank');
        }
        if (site === 'dict') {
          let url = answer.replace(/ /g, '');
          window.open('https://www.dictionary.com/browse/' + url, '_blank');
        }
        if (site === 'thes') {
          let url = answer.replace(/ /g, '');
          window.open('https://www.thesaurus.com/browse/' + url, '_blank');
        }
        if (site === 'anag') {
          let url = answer.replace(/ |-/g, '');
          window.open('https://new.wordsmith.org/anagram/anagram.cgi?anagram=' + url, '_blank');
        }
      },
      
      // Print finished puzzle
      print: function() {
        this.isPrinting = true;
        setTimeout(() => window.print());
        setTimeout(() => this.isPrinting = false, 1000);
      }
    }
  });
