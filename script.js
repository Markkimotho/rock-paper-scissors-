// Constants
const choices = ['🪨', '📃', '✄'];
const rockBtn = document.querySelector('.rock');
const paperBtn = document.querySelector('.paper');
const scissorsBtn = document.querySelector('.scissors');
const score1 = document.querySelector('.sc1');
const score2 = document.querySelector('.sc2');
const results = document.querySelector('.display-results');
const compResults = document.querySelector('.comp-results');
const playResults = document.querySelector('.player-results');
const againBtn = document.querySelector('.again');
const scrollingText = document.querySelector('.scrolling-text');

// Game variables
let playerScore = 0;
let computerScore = 0;

// Function to get computer choice
function getComputerChoice() {
  const randomIndex = Math.floor(Math.random() * choices.length);
  return choices[randomIndex];
}

// Function to play a round of the game
function playRound(playerSelection) {
  const computerSelection = getComputerChoice();
  playResults.textContent = playerSelection;
  compResults.textContent = `Computer chose: ${computerSelection}`;

  if (playerSelection === computerSelection) {
    results.textContent = "It's a tie!";
  } else if (
    (playerSelection === choices[0] && computerSelection === choices[1]) ||
    (playerSelection === choices[1] && computerSelection === choices[2]) ||
    (playerSelection === choices[2] && computerSelection === choices[0])
  ) {
    playerScore++;
    results.textContent = 'Winner: YOU';
  } else {
    computerScore++;
    results.textContent = 'Winner: COMP';
  }

  updateScores();
  checkForWinner();
}

// Function to update the displayed scores
function updateScores() {
  score1.textContent = playerScore;
  score2.textContent = computerScore;
}

// Function to check if either player has reached 5 points
function checkForWinner() {
  if (playerScore === 5 || computerScore === 5) {
    endGame();
  }
}

// Function to handle end of the game
function endGame() {
  rockBtn.disabled = true;
  paperBtn.disabled = true;
  scissorsBtn.disabled = true;
  const gameResult = playerScore === 5 ? 'YOU' : 'COMP';
  results.textContent = `Game over! ${gameResult} won!`;
  againBtn.disabled = false; // Enable the "AGAIN" button
}

// Function to restart the game
function restartGame() {
  playerScore = 0;
  computerScore = 0;
  updateScores();
  results.textContent = '';
  playResults.textContent = '__';
  compResults.textContent = '__';
  enableButtons();
  scrollingText.style.display = 'block'; // Show scrolling text when the game is restarted
}

// Function to enable game buttons
function enableButtons() {
  rockBtn.disabled = false;
  paperBtn.disabled = false;
  scissorsBtn.disabled = false;
  againBtn.disabled = true; // Disable the "AGAIN" button until the game ends
}

// Event listeners for buttons
rockBtn.addEventListener('click', () => playRound(choices[0]));
paperBtn.addEventListener('click', () => playRound(choices[1]));
scissorsBtn.addEventListener('click', () => playRound(choices[2]));
againBtn.addEventListener('click', restartGame);