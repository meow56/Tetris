"use strict";

const DEBUG_SHOW_ABOVE = false;
// Show all rows of the board.

let board;
let pixels = [];
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 40;
const VIS_HEIGHT = 20;
const GRAVITY = 1/64;
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
	this.ghostColor;
	this.lockTimer;
	this.rotation = 0;
	switch(this.name) {
		case "I":
			this.shape = [[0, 0, 0, 0, 0],
						  [0, 0, 0, 0, 0], 
						  [0, 1, 1, 1, 1], 
						  [0, 0, 0, 0, 0], 
						  [0, 0, 0, 0, 0]];
			this.color = "cyan";
			this.ghostColor = "#008080";
			break;
		case "J":
			this.shape = [[1, 0, 0], 
						  [1, 1, 1], 
						  [0, 0, 0]];
			this.color = "blue";
			this.ghostColor = "#000080";
			break;
		case "L":
			this.shape = [[0, 0, 1], 
						  [1, 1, 1], 
						  [0, 0, 0]];
			this.color = "orange";
			this.ghostColor = "#804000";
			break;
		case "O":
			this.shape = [[0, 1, 1],
						  [0, 1, 1], 
						  [0, 0, 0]];
			this.color = "yellow";
			this.ghostColor = "#808000";
			break;
		case "S":
			this.shape = [[0, 1, 1], 
						  [1, 1, 0], 
						  [0, 0, 0]];
			this.color = "lime";
			this.ghostColor = "#008000";
			break;
		case "T":
			this.shape = [[0, 1, 0], 
						  [1, 1, 1], 
						  [0, 0, 0]];
			this.color = "fuchsia";
			this.ghostColor = "#800080";
			break;
		case "Z":
			this.shape = [[1, 1, 0], 
						  [0, 1, 1], 
						  [0, 0, 0]];
			this.color = "red";
			this.ghostColor = "#800000";
			break;
		default:
			throw `Expected tetrimino, but got ${this.name}`;
	}

	this.fall = function(dist = GRAVITY) {
		let nextPos = this.position.slice();
		nextPos[1] -= dist;
		let lockOutTest = false;
		let difference;
		if(Math.floor(nextPos[1]) === Math.floor(this.position[1])) {
			nextPos[1]--;
			difference = 1;
			lockOutTest = true;
		} else {
			difference = Math.floor(this.position[1]) - Math.floor(nextPos[1]);
		}
		let halfStep = Math.floor(this.shape.length / 2);
		let isClipped;
		let vertOff = 0;
		let thisPos = this.position;
		do {
			isClipped = this.shape.some(function(row, rO) {
				let rowCheck = pixels[Math.floor(thisPos[1]) + halfStep - rO - vertOff];
				if(typeof rowCheck === "undefined") return row.includes(1);
				return row.some(function(mino, offset) {
					if(mino === 0) return false;
					let toCheck = rowCheck[thisPos[0] - halfStep + offset];
					return typeof toCheck.col !== "undefined";
				});
			});
		} while(!isClipped && ++vertOff <= difference)
		vertOff--;
		if(vertOff === 0) {
			// We are on the floor.
			if(typeof this.lockTimer === "undefined") this.lockTimer = LOCK_DELAY;
		} else if(vertOff === -1) {
			// Lock out!!!
			throw `Lock out!`;
		} else {
			if(lockOutTest || dist < 1) {
				this.position[1] -= dist;
				return;
			}
			this.position[1] -= vertOff;
		}
	}

	this.display = function() {
		let halfStep = Math.floor(this.shape.length / 2);

		let nextPos = [this.position[0], this.position[1] - BOARD_HEIGHT];
		let difference = Math.floor(this.position[1]) - Math.floor(nextPos[1]);
		let isClipped;
		let vertOff = 0;
		let thisPos = this.position;
		do {
			isClipped = this.shape.some(function(row, rO) {
				let rowCheck = pixels[Math.floor(thisPos[1]) + halfStep - rO - vertOff];
				if(typeof rowCheck === "undefined") return row.includes(1);
				return row.some(function(mino, offset) {
					if(mino === 0) return false;
					let toCheck = rowCheck[thisPos[0] - halfStep + offset];
					return typeof toCheck.col !== "undefined";
				});
			});
		} while(!isClipped && ++vertOff <= difference)
		vertOff--;
		for(let i = -halfStep; i + halfStep < this.shape.length; i++) {
			for(let j = -halfStep; j + halfStep <= this.shape.length; j++) {
				if(this.shape[i + halfStep][j + halfStep] === 1) {
					pixels[Math.floor(thisPos[1]) - vertOff - i]
						  [thisPos[0] + j].style = `background: ${this.ghostColor};`;
				}
			}
		}
		for(let i = -halfStep; i + halfStep < this.shape.length; i++) {
			for(let j = -halfStep; j + halfStep <= this.shape.length; j++) {
				if(this.shape[i + halfStep][j + halfStep] === 1) {
					pixels[Math.floor(this.position[1]) - i]
						  [this.position[0] + j].style = `background: ${this.color};`;
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
			if(typeof this.lockTimer !== "undefined") this.lockTimer = LOCK_DELAY;
		}
	}

	this.lock = function() {
		if(typeof this.lockTimer === "undefined") return;
		let nextPos = [this.position[0], this.position[1] - 1];
		let halfStep = Math.floor(this.shape.length / 2);
		let isGrounded = this.shape.some(function(row, rO) {
				let rowCheck = pixels[Math.floor(nextPos[1]) + halfStep - rO];
				if(typeof rowCheck === "undefined") return row.includes(1);
				return row.some(function(mino, offset) {
					if(mino === 0) return false;
					let toCheck = rowCheck[nextPos[0] - halfStep + offset];
					return typeof toCheck.col !== "undefined";
				});
			});
		if(isGrounded) this.lockTimer--;
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

	this.rotate = function(direction) {
		// direction: "CW" or "CCW"
		let newShape = [];
		let newRotState = this.rotation;
		if(direction === "CW") {
			for(let i = 0; i < this.shape.length; i++) { // what column?
				let newRow = [];
				for(let j = this.shape.length - 1; j >= 0; j--) { // what row?
					newRow.push(this.shape[j][i]);
				}
				newShape.push(newRow);
			}
			newRotState = (newRotState + 1) % 4;
		} else {
			for(let i = this.shape.length - 1; i >= 0; i--) { // what column?
				let newRow = [];
				for(let j = 0; j < this.shape.length; j++) { // what row?
					newRow.push(this.shape[j][i]);
				}
				newShape.push(newRow);
			}
			newRotState = (newRotState + 3) % 4; // or newRotState - 1 + 4
		}

		let offsetTable;
		if(this.name === "I") {
			offsetTable = I_OFFSETS;
		} else if(this.name === "O") {
			offsetTable = O_OFFSETS;
		} else {
			offsetTable = JLSTZ_OFFSETS;
		}

		let nextKick = 0;
		let halfStep = Math.floor(this.shape.length / 2);
		let isClipped;
		let nextPos;
		do {
			let nextOffset = offsetTable[nextKick++][this.rotation].slice();
			nextOffset[0] -= offsetTable[nextKick - 1][newRotState][0];
			nextOffset[1] -= offsetTable[nextKick - 1][newRotState][1];
			nextPos = [this.position[0] + nextOffset[0], this.position[1] + nextOffset[1]];
			isClipped = newShape.some(function(row, rO) {
					let rowCheck = pixels[Math.floor(nextPos[1]) + halfStep - rO];
					if(typeof rowCheck === "undefined") return row.includes(1);
					return row.some(function(mino, offset) {
						if(mino === 0) return false;
						let toCheck = rowCheck[nextPos[0] - halfStep + offset];
						return typeof toCheck === "undefined"
							|| typeof toCheck.col !== "undefined";
					});
				});
		} while(isClipped && nextKick !== offsetTable.length)
		if(!isClipped) {
			if(typeof this.lockTimer !== "undefined") this.lockTimer = LOCK_DELAY;
			this.rotation = newRotState;
			this.shape = newShape;
			this.position = nextPos;
		}
	}
}

const I_OFFSETS = [
	// 0         R/CW       2        L/CCW
	[[ 0,  0], [-1,  0], [-1,  1], [ 0,  1]], // offset 1
	[[-1,  0], [ 0,  0], [ 1,  1], [ 0,  1]], // offset 2
	[[ 2,  0], [-1,  0], [-2,  1], [ 0,  1]], // offset 3
	[[-1,  0], [ 0,  1], [ 1,  0], [ 0, -1]], // offset 4
	[[ 2,  0], [ 0, -2], [-2,  0], [ 0,  2]]  // offset 5
];
const O_OFFSETS = [
	// 0         R/CW       2        L/CCW
	[[ 0,  0], [ 0, -1], [-1, -1], [-1,  0]]  // offset 1
];
const JLSTZ_OFFSETS = [
	// 0         R/CW       2        L/CCW
	[[ 0,  0], [ 0,  0], [ 0,  0], [ 0,  0]], // offset 1
	[[ 0,  0], [ 1,  0], [ 0,  0], [-1,  0]], // offset 2
	[[ 0,  0], [ 1, -1], [ 0,  0], [-1, -1]], // offset 3
	[[ 0,  0], [ 0,  2], [ 0,  0], [ 0,  2]], // offset 4
	[[ 0,  0], [ 1,  2], [ 0,  0], [-1,  2]]  // offset 5
];

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
			let lineClears = pixels.filter(function(row) {
				return row.every(e => typeof e.col !== "undefined");
			});
			for(let i = lineClears.length - 1; i >= 0; i--) {
				let rowToClear = +lineClears[i][0].id.split(",")[0];
				pixels.forEach(function(row, rI) {
					if(rI === BOARD_HEIGHT - 1) {
						for(let i = 0; i < row.length; i++) {
							row[i].col = undefined;
						}
					} else if(rI >= rowToClear) {
						for(let i = 0; i < row.length; i++) {
							row[i].col = pixels[rI + 1][i].col;
						}
					}
				});
			}

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
	} else if(e.key === "ArrowUp") {
		currPiece.fall(BOARD_HEIGHT);
	} else if(e.key === "ArrowDown") {
		currPiece.fall(1);
	} else if(e.key.toLowerCase() === "z") {
		currPiece.rotate("CCW");
	} else if(e.key.toLowerCase() === "x") {
		currPiece.rotate("CW");
	}
}