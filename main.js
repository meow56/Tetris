"use strict";

const DEBUG_SHOW_ABOVE = false;
// Show all rows of the board.

let board;
let pixels = [];
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 40;
const VIS_HEIGHT = 20;
let GRAVITY = 1/64;
const LV_GRAV_MULT = 1.3;
const LV_LINE_REQ = 20;
const LOCK_DELAY = 60;
const DAS = 8;
const ARR = 1;
const PREVIEW_LENGTH = 5;

for(let i = 0; i < BOARD_HEIGHT; i++) {
	pixels.push([]);
}

const FRAMERATE = 60;
let gameLoop;
window.onload = function() {
	board = document.getElementById("board");
	for(let i = BOARD_HEIGHT - 1; i >= 0; i--) {
		let boardRow = document.createElement("TR");

		for(let j = 0; j < 4; j++) {
			let hold = document.createElement("TD");
			hold.id = `Q${i},${j}`;
			if(i === VIS_HEIGHT - 1) {
				hold.textContent = "HOLD"[j];
			}
			if(i === VIS_HEIGHT - 7) {
				hold.textContent = "LV01"[j];
			}
			if(DEBUG_SHOW_ABOVE || i < VIS_HEIGHT) {
				boardRow.appendChild(hold);
			}
			pixels[i].push(hold);
		}

		let spacer = document.createElement("TD");
		spacer.id = "spacer";
		if(DEBUG_SHOW_ABOVE || i < VIS_HEIGHT) {
			boardRow.appendChild(spacer);
		}
		pixels[i].push(spacer);
		for(let j = 0; j < BOARD_WIDTH; j++) {
			const pixel = document.createElement("TD");
			pixel.id = `${i},${j}`;
			if(DEBUG_SHOW_ABOVE || i < VIS_HEIGHT) {
				boardRow.appendChild(pixel);
			}
			pixels[i].push(pixel);
		}
		spacer = document.createElement("TD");
		spacer.id = "spacer";
		if(DEBUG_SHOW_ABOVE || i < VIS_HEIGHT) {
			boardRow.appendChild(spacer);
		}
		pixels[i].push(spacer);
		for(let j = 0; j < 4; j++) {
			let nextQueue = document.createElement("TD");
			nextQueue.id = `Q${i},${j}`;
			if(i === VIS_HEIGHT - 1) {
				nextQueue.textContent = "NEXT"[j];
			}
			if(DEBUG_SHOW_ABOVE || i < VIS_HEIGHT) {
				boardRow.appendChild(nextQueue);
			}
			pixels[i].push(nextQueue);
		}
		if(DEBUG_SHOW_ABOVE || i < VIS_HEIGHT) {
			board.appendChild(boardRow);
		}
	}
	console.log(pixels);
	gameLoop = setInterval(mainLoop, 1000 / FRAMERATE);
}

function Piece(type) {
	this.name = type;
	this.position = [5 + Math.floor((BOARD_WIDTH - 1) / 2), 21];
	this.shape;
	this.color;
	this.ghostColor;
	this.lockTimer;
	this.rotation = 0;
	this.hardDropped = false;
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
		if(Math.floor(nextPos[1]) === Math.floor(this.position[1])) {
			this.position[1] -= dist;
			return;
		}
		let difference = Math.floor(this.position[1]) - Math.floor(nextPos[1]);
		let isClipped;
		let vertOff = 0;
		do {
			isClipped = this.collision([this.position[0], this.position[1] - vertOff]);
		} while(!isClipped && ++vertOff <= difference)
		vertOff--;
		if(vertOff === 0) {
			// We are on the floor.
			if(typeof this.lockTimer === "undefined") this.lockTimer = LOCK_DELAY;
		} else if(vertOff === -1) {
			// Lock out!!!
			return true;
		} else {
			if(dist < 1) {
				this.position[1] -= dist;
				return;
			}
			this.position[1] -= vertOff;
		}
	}

	this.collision = function(nextPos, shape = this.shape) {
		let halfStep = Math.floor(shape.length / 2);
		return shape.some(function(row, rO) {
			let rowCheck = pixels[Math.floor(nextPos[1]) + halfStep - rO];
			if(typeof rowCheck === "undefined") return row.includes(1);
			return row.some(function(mino, offset) {
				if(mino === 0) return false;
				let toCheck = rowCheck[nextPos[0] - halfStep + offset];
				return typeof toCheck.col !== "undefined" || toCheck.id === "spacer";
			});
		});
	}

	this.display = function() {
		let halfStep = Math.floor(this.shape.length / 2);

		let nextPos = [this.position[0], this.position[1] - BOARD_HEIGHT];
		let difference = Math.floor(this.position[1]) - Math.floor(nextPos[1]);
		let isClipped;
		let vertOff = 0;
		do {
			isClipped = this.collision([this.position[0], this.position[1] - vertOff]);
		} while(!isClipped && ++vertOff <= difference)
		vertOff--;
		for(let i = -halfStep; i + halfStep < this.shape.length; i++) {
			for(let j = -halfStep; j + halfStep <= this.shape.length; j++) {
				if(this.shape[i + halfStep][j + halfStep] === 1) {
					pixels[Math.floor(this.position[1]) - vertOff - i]
						  [this.position[0] + j].style = `background: ${this.ghostColor};`;
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
		if(this.hardDropped) return;
		// direction: "left" or "right"
		let nextPos = [this.position[0] + (direction === "left" ? -1 : 1), this.position[1]];

		let isClipped = this.collision(nextPos);
		if(!isClipped) {
			this.position = nextPos;
			if(typeof this.lockTimer !== "undefined") this.lockTimer = LOCK_DELAY;
		}
	}

	this.lock = function() {
		if(typeof this.lockTimer === "undefined") return;
		let nextPos = [this.position[0], this.position[1] - 1];
		let isGrounded = this.collision(nextPos);
		if(isGrounded) this.lockTimer--;
		if(this.lockTimer <= 0) {
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
		if(this.hardDropped) return;
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
			let nextOffset = offsetTable[nextKick][this.rotation].slice();
			nextOffset[0] -= offsetTable[nextKick][newRotState][0];
			nextOffset[1] -= offsetTable[nextKick++][newRotState][1];
			nextPos = [this.position[0] + nextOffset[0], this.position[1] + nextOffset[1]];
			isClipped = this.collision(nextPos, newShape);
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
let currBag = shuffle(PIECES.slice());
const DEBUG_PIECE_SEQUENCE = [];
let debugPieceInd = 0;

const SHAPES = new Map();
SHAPES.set("I", [[-2, 1], [-2, 2], [-2, 3], [-2, 4]]);
SHAPES.set("O", [[-1, 2], [-1, 3], [-2, 2], [-2, 3]]);
SHAPES.set("T", [[-1, 2], [-2, 1], [-2, 2], [-2, 3]]);
SHAPES.set("S", [[-1, 3], [-1, 2], [-2, 2], [-2, 1]]);
SHAPES.set("Z", [[-1, 1], [-1, 2], [-2, 2], [-2, 3]]);
SHAPES.set("J", [[-1, 1], [-2, 1], [-2, 2], [-2, 3]]);
SHAPES.set("L", [[-1, 3], [-2, 1], [-2, 2], [-2, 3]]);
const COLORS = new Map();
COLORS.set("I", "cyan");
COLORS.set("O", "yellow");
COLORS.set("T", "fuchsia");
COLORS.set("S", "lime");
COLORS.set("Z", "red");
COLORS.set("J", "blue");
COLORS.set("L", "orange");

// Left, Right, CCW, CW, Hold, HardDrop, SoftDrop
let keybinds = ["ArrowLeft", "ArrowRight", "z", "x", "Shift", "ArrowUp", "ArrowDown"];
let controller = [0, 0, 0, 0, 0, 0, 0];

let linesCleared = 0;
let level = 1;
let points = 0;

function mainLoop() {
	try {
		pixels.forEach(function(row) {
			row.forEach(function(pixel) {
				if(pixel.id === "spacer") return;
				if(pixel.id[0] === "Q") return;
				pixel.style = `background: ${pixel.col || "black"};`;
			});
		});

		if(controller[4] === 1) hold();
		if(typeof currPiece === "undefined") {
			if(!firstHold) hasHeld = false;
			if(DEBUG_PIECE_SEQUENCE.length !== 0) {
				if(debugPieceInd === DEBUG_PIECE_SEQUENCE.length) {
					clearInterval(gameLoop);
					return;
				}
				currPiece = new Piece(DEBUG_PIECE_SEQUENCE[debugPieceInd++]);
			} else {
				if(currBag.length <= PREVIEW_LENGTH) {
					currBag = currBag.concat(shuffle(PIECES.slice()));
				}
				currPiece = new Piece(currBag.shift());
				for(let i = 0; i < VIS_HEIGHT; i++) {
					for(let j = 0; j < 4; j++) {
						pixels[i][BOARD_WIDTH + j + 6].style = "";
					}
				}
				for(let i = 0; i < PREVIEW_LENGTH; i++) {
					let thisPreH = VIS_HEIGHT - (i * 4) - 2;
					let thisPreW = BOARD_WIDTH + 5;
					let thisShape = SHAPES.get(currBag[i]);
					let thisColor = COLORS.get(currBag[i]);
					for(let j = 0; j < thisShape.length; j++) {
						pixels[thisPreH + thisShape[j][0]][thisPreW + thisShape[j][1]].style
							= `background: ${thisColor}`;
					}
				}
			}
		}

		currPiece.display();
		for(let i = 0; i < controller.length; i++) {
			controller[i] *= +!!KEYBOARD.get(keybinds[i]);
			controller[i] += +!!KEYBOARD.get(keybinds[i]);
		}
		if(controller[0] && controller[1]) {

		} else if(controller[0]) {
			let autoRepeating = controller[0] > DAS + 1 && controller[0] % ARR === 0;
			if(controller[0] === 1 || autoRepeating) currPiece.move("left");
		} else if(controller[1]) {
			let autoRepeating = controller[1] > DAS + 1 && controller[1] % ARR === 0;
			if(controller[1] === 1 || autoRepeating) currPiece.move("right");
		}

		if(controller[2] && controller[3]) {

		} else if(controller[2]) {
			if(controller[2] === 1) currPiece.rotate("CCW");
		} else if(controller[3]) {
			if(controller[3] === 1) currPiece.rotate("CW");
		}

		if(controller[5] === 1) {
			currPiece.fall(BOARD_HEIGHT);
			currPiece.hardDropped = true;
			currPiece.lockTimer = 0;
		}
		if(controller[6]) currPiece.fall(1);

		if(currPiece.fall()) {
			pixels.forEach(function(row, rI) {
				row.forEach(function(pixel, index) {
					if(pixel.id === "spacer") return;
					if(pixel.id[0] === "Q") return;
					pixel.style = `background: ${pixel.col ? "gray" : "black"};`;
					let halfBoard = Math.floor(VIS_HEIGHT / 2);
					if(rI === halfBoard + 1) {
						pixel.style = "";
						pixel.textContent = "     GAME  OVER"[index];
					} else if(rI === halfBoard || rI === halfBoard + 2) {
						pixel.style = "";
					}
				});
			});
			clearInterval(gameLoop);
			return;
		}
		if(currPiece.lock()) {
			firstHold = false;
			let lineClears = pixels.filter(function(row) {
				return row.every(e => typeof e.col !== "undefined" 
								   || e.id === "spacer"
								   || e.id[0] === "Q");
			});
			for(let i = lineClears.length - 1; i >= 0; i--) {
				let rowToClear = +lineClears[i][10].id.split(",")[0];
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

			linesCleared += lineClears.length;
			if(linesCleared >= level * LV_LINE_REQ) {
				level++;
				GRAVITY *= LV_GRAV_MULT;
				let strLV = level.toString().padStart(2, "0");
				pixels[VIS_HEIGHT - 7][2].textContent = strLV[0];
				pixels[VIS_HEIGHT - 7][3].textContent = strLV[1];
			}

			currPiece = undefined;
		}
	} catch(e) {
		clearInterval(gameLoop);
		throw e;
	}
}

const KEYBOARD = new Map();

document.onkeydown = function(e) {
	KEYBOARD.set(e.key, true);
}

document.onkeyup = function(e) {
	KEYBOARD.set(e.key, false);
}

function shuffle(arr) {
	let finalOut = [];
	while(arr.length !== 0) {
		finalOut.push(...arr.splice(Math.floor(Math.random() * arr.length), 1));
	}
	return finalOut;
}

let hasHeld = false;
let firstHold = false;
let heldPiece;
function hold() {
	if(hasHeld) return;
	hasHeld = true;
	if(typeof heldPiece === "undefined") firstHold = true;
	let toHold = currPiece;
	currPiece = heldPiece;
	toHold.position = [5 + Math.floor((BOARD_WIDTH - 1) / 2), 21];
	while(toHold.rotation !== 0) {
		toHold.rotate("CW");
	}
	toHold.position = [5 + Math.floor((BOARD_WIDTH - 1) / 2), 21];
	toHold.hardDropped = false;
	heldPiece = toHold;
	for(let i = 0; i < VIS_HEIGHT; i++) {
		for(let j = 0; j < 4; j++) {
			pixels[i][j].style = "";
		}
	}
	let thisPreH = VIS_HEIGHT - 2;
	let thisPreW = -1;
	let thisShape = SHAPES.get(heldPiece.name);
	let thisColor = COLORS.get(heldPiece.name);
	for(let j = 0; j < thisShape.length; j++) {
		pixels[thisPreH + thisShape[j][0]][thisPreW + thisShape[j][1]].style
			= `background: ${thisColor}`;
	}
}