"use strict";

const DEBUG_SHOW_ABOVE = false;
// Show all rows of the board.

let board;
let pixels = [];
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 40;
const VIS_HEIGHT = 20;
const GRAVITY = 1/4;
const LOCK_DELAY = 60;
const DAS = 0;
const ARR = 0;
// To do: implement DAS and ARR that doesn't rely on the OS's repeating function

for(let i = 0; i < BOARD_HEIGHT; i++) {
	pixels.push([]);
}

const FRAMERATE = 60;
let gameLoop;
window.onload = function() {
	board = document.getElementById("board");
	for(let i = BOARD_HEIGHT - 1; i >= 0; i--) {
		for(let j = 0; j < BOARD_WIDTH; j++) {
			const pixel = document.createElement("SPAN");
			pixel.id = i.toString() + "," + j;
			pixel.textContent = " ";
			if(DEBUG_SHOW_ABOVE || i < VIS_HEIGHT) {
				board.appendChild(pixel);
			}
			pixels[i][j] = pixel;
		}
		if(DEBUG_SHOW_ABOVE || i < VIS_HEIGHT) {
			board.appendChild(document.createElement("BR"));
		}
	}
	console.log(pixels);
	gameLoop = setInterval(mainLoop, 1000 / FRAMERATE);
}

function Piece(type) {
	this.name = type;
	this.position = [Math.floor((BOARD_WIDTH - 1) / 2), 21];
	this.shape;
	this.color;
	this.lockTimer;
	switch(this.name) {
		case "I":
			this.shape = [[0, 0, 0, 0, 0],
						  [0, 0, 0, 0, 0], 
						  [0, 1, 1, 1, 1], 
						  [0, 0, 0, 0, 0], 
						  [0, 0, 0, 0, 0]];
			this.color = "cyan";
			break;
		case "J":
			this.shape = [[1, 0, 0], 
						  [1, 1, 1], 
						  [0, 0, 0]];
			this.color = "blue";
			break;
		case "L":
			this.shape = [[0, 0, 1], 
						  [1, 1, 1], 
						  [0, 0, 0]];
			this.color = "orange";
			break;
		case "O":
			this.shape = [[0, 1, 1],
						  [0, 1, 1], 
						  [0, 0, 0]];
			this.color = "yellow";
			break;
		case "S":
			this.shape = [[0, 1, 1], 
						  [1, 1, 0], 
						  [0, 0, 0]];
			this.color = "green";
			break;
		case "T":
			this.shape = [[0, 1, 0], 
						  [1, 1, 1], 
						  [0, 0, 0]];
			this.color = "purple";
			break;
		case "Z":
			this.shape = [[1, 1, 0], 
						  [0, 1, 1], 
						  [0, 0, 0]];
			this.color = "red";
			break;
		default:
			throw `Expected tetrimino, but got ${this.name}`;
	}

	this.fall = function() {
		let nextPos = this.position.slice();
		nextPos[1] -= GRAVITY;
		if(Math.floor(nextPos[1]) === Math.floor(this.position[1])) {
			this.position[1] = nextPos[1];
			return;
		}
		let bottom = Math.floor(nextPos[1]);
		let bottomRow;
		if(this.shape.length === 5) {
			if(this.shape[4].includes(1)) {
				bottom -= 2;
				bottomRow = this.shape[4];
			} else if(this.shape[3].includes(1)) {
				bottom--;
				bottomRow = this.shape[3];
			} else {
				bottomRow = this.shape[2];
			}
		} else {
			if(this.shape[2].includes(1)) {
				bottom--;
				bottomRow = this.shape[2];
			} else {
				bottomRow = this.shape[1];
			}
		}
		let halfStep = Math.floor(this.shape.length / 2);
		let isClipped;
		let vertOff = 0;
		do {
			isClipped = this.shape.some(function(row, rO) {
				let rowCheck = pixels[Math.floor(nextPos[1]) + halfStep - rO + vertOff];
				if(typeof rowCheck === "undefined") return row.includes(1);
				return row.some(function(mino, offset) {
					if(mino === 0) return false;
					let toCheck = rowCheck[nextPos[0] - halfStep + offset];
					return typeof toCheck.col !== "undefined";
				});
			});
		} while(isClipped && Math.floor(nextPos[1]) + vertOff++ <= Math.floor(this.position[1]))

		if(Math.floor(nextPos[1]) + vertOff === Math.floor(this.position[1])) {
			// We are on the floor.
			if(typeof this.lockTimer === "undefined") this.lockTimer = LOCK_DELAY;
		} else if(Math.floor(nextPos[1]) + vertOff > Math.floor(this.position[1])) {
			// Lock out!!!
			throw `Lock out!`;
		} else {
			this.position[1] = nextPos[1] + vertOff;
		}
	}

	this.display = function() {
		let halfStep = Math.floor(this.shape.length / 2);
		for(let i = -halfStep; i + halfStep < this.shape.length; i++) {
			for(let j = -halfStep; j + halfStep <= this.shape.length; j++) {
				if(this.shape[i + halfStep][j + halfStep] === 1) {
					pixels[Math.floor(this.position[1]) - i]
						  [Math.ceil(this.position[0]) + j].style = `background: ${this.color};`;
				}
			}
		}
	}

	this.move = function(direction) {
		// direction: "left" or "right"
		let nextPos = [this.position[0] + (direction === "left" ? -1 : 1), this.position[1]];

		let halfStep = Math.floor(this.shape.length / 2);
		let isClipped;
		isClipped = this.shape.some(function(row, rO) {
						let rowCheck = pixels[Math.floor(nextPos[1]) + halfStep - rO];
						return row.some(function(mino, offset) {
							if(mino === 0) return false;
							let toCheck = rowCheck[nextPos[0] - halfStep + offset];
							return typeof toCheck === "undefined"
								|| typeof toCheck.col !== "undefined";
						});
					});
		if(!isClipped) {
			this.position = nextPos;
		}
	}

	this.lock = function() {
		if(typeof this.lockTimer === "undefined") return;
		this.lockTimer--;
		if(this.lockTimer === 0) {
			let halfStep = Math.floor(this.shape.length / 2);
			for(let i = -halfStep; i + halfStep < this.shape.length; i++) {
				for(let j = -halfStep; j + halfStep <= this.shape.length; j++) {
					if(this.shape[i + halfStep][j + halfStep] === 1) {
						pixels[Math.floor(this.position[1]) - i]
							  [Math.ceil(this.position[0]) + j].col = this.color;
					}
				}
			}
			return true;
		}
	}
}

let currPiece;
const PIECES = ["I", "J", "L", "O", "S", "Z", "T"];
const DEBUG_PIECE_SEQUENCE = [];
let debugPieceInd = 0;
function mainLoop() {
	try {
		pixels.forEach(function(row) {
			row.forEach(function(pixel) {
				pixel.style = `background: ${pixel.col || "black"};`;
			});
		});

		if(typeof currPiece === "undefined") {
			if(DEBUG_PIECE_SEQUENCE.length !== 0) {
				if(debugPieceInd === DEBUG_PIECE_SEQUENCE.length) {
					clearInterval(gameLoop);
					return;
				}
				currPiece = new Piece(DEBUG_PIECE_SEQUENCE[debugPieceInd++]);
			} else {
				// (not how tetris generates pieces)
				currPiece = new Piece(PIECES[Math.floor(Math.random() * 7)]);
			}
		}

		currPiece.display();
		currPiece.fall();
		if(currPiece.lock()) {

			// check line clears

			currPiece = undefined;
		}
	} catch(e) {
		clearInterval(gameLoop);
		throw e;
	}
}

document.onkeydown = function(e) {
	if(typeof currPiece === "undefined") return;
	if(e.key === "ArrowLeft") {
		currPiece.move("left");
	} else if(e.key === "ArrowRight") {
		currPiece.move("right");
	}
}