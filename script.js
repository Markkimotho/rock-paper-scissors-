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

  if (computerSelection === "Rock" && playerSelection === "Scissors"||
      computerSelection === "Paper" && playerSelection === "Rock"||
      computerSelection === "Scissors" && playerSelection === "Paper"){
    return `Computer wins! ${computerSelection} beats ${playerSelection}`;
  } 
 
  else if(computerSelection === "Rock" && playerSelection === "Paper"|| 
          computerSelection === "Paper" && playerSelection === "Scissors"||
          computerSelection === "Scissors" && playerSelection === "Rock" ) {
    return `You win! ${playerSelection} beats ${computerSelection}`;
  } 
  
  else if (computerSelection === playerSelection ) {
    return `A tie, computer chose ${computerSelection}, you chose ${playerSelection}`;
  }  

}

let computerSelection = getComputerChoice();
let playerSelection = playerChoice();
console.log(playRound(playerSelection, computerSelection));


// working on the game function 

// function game (){
  
//   i=1
//   while (i<=5){
//     return playRound(playerSelection, computerSelection)
//   }
  
// }
// console.log(game());

