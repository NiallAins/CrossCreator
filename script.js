let app = new Vue({
  el: '#app',
  data: {
    size: 9,
    title: "",
    autoMirror: true,
    isPreview: false,
    grid: [],
    clues: {
      across: [],
      down: [],
    },
    answers: {
      across: [],
      down: []
    },
    dirSelect: 'down',
    activeAnswer: 1
  },
  created: function() {
    for (let r = 0; r < this.size; r++) {
      this.grid.push([]);
      for (let c = 0; c < this.size; c++) {
        this.grid[r].push({
          isBlock: false,
          label: '',
          letter: '',
          answer: {
            across: -1,
            down: -1
          }
        });
      }
    }
    this.updateNums();
  },
  watch: {
    size: function(current, old) {
      if (current > old) {
        this.grid.push([]);
        for (let i = 0; i < current; i++) {
          this.grid[i].push({
            isBlock: false,
            label: '',
            letter: '',
            answer: {
              across: -1,
              down: -1
            }
          });
          if (i !== current - 1) {
            this.grid[current - 1].push({
              isBlock: false,
              label: '',
              letter: '',
              answer: {
                across: -1,
                down: -1
              }
            });
          }
        }
      } else {
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
      this.answers = {
        across: [],
        down: []
      };
      this.grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          let labeled = false;
          c.label = '';
          if (!cell.isBlock) {
            //Across
            if (
              (c === 0 || row[c - 1].isBlock) &&
              (c < this.size - 1 && !row[c + 1].isBlock)
            ) {
              labeled = true;
              let ans = {
                label: labelNum,
                text: ''
              };
              for (let i = c; i < this.size; i++) {
                if (row[i].isBlock) {
                  row[i].answer.across = {
                    index: -1,
                    pos: 0
                  } 
                  break;
                }
                if (row[i].letter) {
                  ans.text += row[i].letter;
                } else {
                  ans.text += '-';
                }
                row[i].answer.across = {
                  index: this.answers.across.length,
                  pos: ans.text.length - 1
                } 
              }
              this.setAnswerFlags(ans);
              this.answers.across.push(ans);
            }
            //Down  
            if (
              (r === 0 || this.grid[r - 1][c].isBlock) &&
              (this.grid[r + 1] && !this.grid[r + 1][c].isBlock)
            ) {
              labeled = true;
              let ans = {
                label: labelNum,
                text: ''
              };
              for (let i = r; i < this.size; i++) {
                if (this.grid[i][c].isBlock) {
                  this.grid[i][c].answer.down = {
                    index: -1,
                    pos: 0
                  }
                  break;
                }
                if (this.grid[i][c].letter) {
                  ans.text += this.grid[i][c].letter;
                } else {
                  ans.text += '-';
                }
                this.grid[i][c].answer.down = {
                  index: this.answers.down.length,
                  pos: ans.text.length - 1
                }
              }
              this.setAnswerFlags(ans);
              this.answers.down.push(ans);
            }
            if (labeled) {
              cell.label = labelNum;
              labelNum++;
            } else {
              cell.label = '';
            }
          }
          // Add more clues if necessiary
          for (let i = this.clues.across.length; i < this.answers.across.length; i++) {
            this.clues.across.push('');
          }
          for (let i = this.clues.down.length; i < this.answers.down.length; i++) {
            this.clues.down.push('');
          }
        });
      });
    },
    
    // Set button flags for an answer
    setAnswerFlags: function(ans) {
      ans.complete = (ans.text.indexOf('-') === -1);
      ans.solvable = !ans.complete && !!(ans.text.match(/(.*[A-Z].*){2,}/));
      ans.anagramable = !!(ans.text.match(/(.*[A-Z].*){3,}/));
    },
    
    // Updates the Answers' strings when cell letter changes 
    updateAnswer: function(cell) {
      let letter = cell.letter || '-';
      if (cell.answer.across.index !== -1) {
        let ans = this.answers.across[cell.answer.across.index];
        ans.text =
          ans.text.substring(0, cell.answer.across.pos) +
          letter +
          ans.text.substr(cell.answer.across.pos + 1);
        this.setAnswerFlags(ans);
      }
      if (cell.answer.down.index !== -1) {
        let ans = this.answers.down[cell.answer.down.index];
        ans.text =
          ans.text.substring(0, cell.answer.down.pos) +
          letter +
          ans.text.substr(cell.answer.down.pos + 1);
        this.setAnswerFlags(ans);
      }
    },
    
    // Keyboard listener for the grid
    cellKey: function(e, cell, r, c) {
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
            keyCode: this.dirSelect === 'across' ? 39 : 40,
            preventDefault: ()=>{}
          },
          cell, r, c
        );
      }
      
      // Directional Keys
      else if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
        if ((e.keyCode === 37 || e.keyCode === 39) && this.dirSelect === 'down') {
          this.dirSelect = 'across';
          return;
        } else if ((e.keyCode === 38 || e.keyCode === 40) && this.dirSelect === 'across') {
          this.dirSelect = 'down';
          return;
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
      
      // Add blocks
      else if (e.keyCode === 32 || e.keyCode === 13) {
        e.preventDefault();
        this.toggleBlock(cell);
        this.updateNums();
      } else if (e.keyCode === 8) {
        if (cell.isBlock) {
          this.toggleBlock(cell);
          this.updateNums();
        } else if (cell.letter) {
          cell.letter = '';
        } else {
          this.toggleBlock(cell);
          this.updateNums();
        }
        this.updateAnswer(cell);
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
  }
});