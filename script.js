const choices = ["Rock 🪨", "Paper 📃", "Scissors ✂"]

// Selecting the elements
const rockEl = document.querySelector(".choice1")
const paperEl = document.querySelector(".choice2")
const scissorsEl = document.querySelector(".choice3")
const againBtn = document.querySelector(".again-button")
const winner = document.querySelector(".winner")
const playScore = document.querySelector(".score-count1")
const compScore = document.querySelector(".score-count2")

let value,rockEvent ;
let score = 0;

// getting a random choice from the computer
const computerSelection = function getComputerChoice() {
  const choicesArray = ["Rock 🪨", "Paper 📃", "Scissors ✂"]; // defining an array from whence the computer will get its random choice!
  const randomChoice = Math.floor(Math.random() * choicesArray.length);
  document.querySelector(".computer-choice").textContent = choicesArray[randomChoice] 
  return choicesArray[randomChoice];
}
computerSelection();

// player choice

rockEl.addEventListener ('click', function(){
  value = rockEl.nodeValue = choices[0]
  document.querySelector(".player-choice").textContent = value
  
})

paperEl.addEventListener ('click', function(){
  value = paperEl.nodeValue = choices[1]
  document.querySelector(".player-choice").textContent = value
})

scissorsEl.addEventListener ('click', function(){
  value = scissorsEl.nodeValue = choices[2]
  document.querySelector(".player-choice").textContent = value
})




