// getting a random choice from the computer

function getComputerChoice() {
  const choicesArray = ["Rock", "Paper", "Scissors"]; // defining an array from whence the computer will get its random choice!
  const randomChoice = Math.floor(Math.random() * choicesArray.length);
  return choicesArray[randomChoice];
}

// prompt a player for input
function playerChoice() {
  const playerPrompt = String(
    prompt(
      "What is your choice?\n Rock, Paper, or Scissors?\nType in your choice!"
    )
  );
  return playerPrompt;
}


function playRound (playerSelection, computerSelection){

  if (computerSelection === "Rock" && playerSelection === "Scissors") {
    return `Computer wins! ${computerSelection} beats ${playerSelection}`;
  } 
  else if (computerSelection === "Paper" && playerSelection === "Rock") {
    return `Computer wins! ${computerSelection} beats ${playerSelection}`;
  } 
  else if (computerSelection === "Scissors" && playerSelection === "Paper") {
    return `Computer wins! ${computerSelection} beats ${playerSelection}`;
  } 
  else if (computerSelection === "Rock" && playerSelection === "Paper") {
    return `You win! ${playerSelection} beats ${computerSelection}`;
  } 
  else if (computerSelection === "Paper" && playerSelection === "Scissors") {
    return `You win! ${playerSelection} beats ${computerSelection}`;
  } 
  else if (computerSelection === "Scissors" && playerSelection === "Rock") {
    return `You win! ${playerSelection} beats ${computerSelection}`;
  } 
  else if (computerSelection === playerSelection ) {
    return `A tie, computer chose ${computerSelection}, you chose ${playerSelection}`;
  }  

}
const computerSelection = getComputerChoice();
const playerSelection = playerChoice();

console.log(playRound(playerSelection,computerSelection))

