const rockBtn = document.querySelector(".rock");
const paperBtn = document.querySelector(".paper");
const scissorsBtn = document.querySelector(".scissors");
const score1 = document.querySelector(".sc1");
const score2 = document.querySelector(".sc2");
const results = document.querySelector(".display-results");
const compResults = document.querySelector(".comp-results");
const playResults = document.querySelector(".player-results");
const againBtn = document.querySelector(".again");
const choices = ["🪨", "📃", "✄"];
let initialScore1 = parseInt(score1.textContent);
let initialScore2 = parseInt(score2.textContent);
let roundCount = 0;

function playRound(playerSelection, computerSelection) {
  if (playerSelection === computerSelection) {
    winner = "TIE";
  } else if (
    (playerSelection === "🪨" && computerSelection === "📃") ||
    (playerSelection === "📃" && computerSelection === "✄") ||
    (playerSelection === "✄" && computerSelection === "🪨")
  ) {
    initialScore2++;
    winner = "COMP";
  } else {
    initialScore1++;
    winner = "YOU";
  }

  score1.textContent = initialScore1;
  score2.textContent = initialScore2;
  results.textContent = `Winner: ${winner}`;

  if (initialScore1 === 5 || initialScore2 === 5) {
    endGame();
  }
}

function getComputerChoice() {
  const random = Math.floor(Math.random() * choices.length);
  const choice = choices[random];
  compResults.textContent = choice;
  return choice;
}

function displayOption(btn) {
  if (initialScore1 < 5 && initialScore2 < 5) {
    const selectedOption = btn.value;
    if (selectedOption === "rock") {
      playResults.textContent = choices[0];
      playRound(choices[0], getComputerChoice());
    } else if (selectedOption === "paper") {
      playResults.textContent = choices[1];
      playRound(choices[1], getComputerChoice());
    } else if (selectedOption === "scissors") {
      playResults.textContent = choices[2];
      playRound(choices[2], getComputerChoice());
    }
  }
}

function endGame() {
  rockBtn.disabled = true;
  paperBtn.disabled = true;
  scissorsBtn.disabled = true;
  let gameResult;
  if (initialScore1 === 5) {
    gameResult = "YOU";
  } else {
    gameResult = "COMP";
  }
  results.textContent = `Game over! ${gameResult} won!`;
  againBtn.disabled = false;
}

function restartGame() {
  initialScore1 = 0;
  initialScore2 = 0;
  score1.textContent = initialScore1;
  score2.textContent = initialScore2;
  results.textContent = "";
  playResults.textContent = "-";
  compResults.textContent = "-";
  rockBtn.disabled = false;
  paperBtn.disabled = false;
  scissorsBtn.disabled = false;
  againBtn.disabled = true;
}

rockBtn.addEventListener("click", function () {
  displayOption(rockBtn);
});

paperBtn.addEventListener("click", function () {
  displayOption(paperBtn);
});

scissorsBtn.addEventListener("click", function () {
  displayOption(scissorsBtn);
});

againBtn.addEventListener("click", function () {
  restartGame();
});
