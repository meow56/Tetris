"use strict";

const DEBUG_SHOW_ABOVE = false;
// Show all rows of the board.

let board;
let pixels = [];
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 40;
const VIS_HEIGHT = 20;
// Note that the board is taller than is visible,
// which means you can place a piece partly off screen.
// (Placing it fully off screen is still game over, though.)
const INIT_GRAVITY = 1/64;
let GRAVITY = INIT_GRAVITY;
// How fast pieces fall. 1G moves a piece 1 unit per frame.
const LV_GRAV_MULT = 1.3;
// How much to multiply gravity by when leveling up.
const LV_LINE_REQ = 20;
// How many lines to clear per level.
const LOCK_DELAY = 60;
// How many frames to wait before locking a piece.
const DAS = 8;
// DAS (Delayed Auto Shift): the delay between when you first hold down
// a movement key and when the piece starts moving automatically. 
// The above value is in frames.
const ARR = 1;
// ARR (Auto Repeat Rate): the rate at which the piece moves automatically.
// The above value is in frames (ie the piece moves every X frames.)
const PREVIEW_LENGTH = 5;
// How many future pieces to show to the player.
// May not work very well above VIS_HEIGHT / 4.

const LEFT_MARGIN_WIDTH = 6;
// How wide the left margin is,
// which contains information about the current held piece,
// current level, score, line clears, and number of lines needed to level up.

for(let i = 0; i < BOARD_HEIGHT; i++) {
	pixels.push([]);
}

let scores;

const FRAMERATE = 60;
let gameLoop;
window.onload = function() {
	board = document.getElementById("board");
	for(let i = BOARD_HEIGHT - 1; i >= 0; i--) {
		let boardRow = document.createElement("TR");

		for(let j = 0; j < LEFT_MARGIN_WIDTH; j++) {
			let hold = document.createElement("TD");
			hold.id = `Q${i},${j}`;
			if(i === VIS_HEIGHT - 1) {
				hold.textContent = "HOLD"[j];
			}
			if(i === VIS_HEIGHT - 7) {
				hold.textContent = "LVL 01"[j];
			}
			if(i === VIS_HEIGHT - 9) {
				hold.textContent = "SCORE"[j];
			}
			if(i === VIS_HEIGHT - 10) {
				hold.textContent = "0";
			}
			if(i === VIS_HEIGHT - 12) {
				hold.textContent = "LN 000"[j];
			}
			if(i === VIS_HEIGHT - 13) {
				hold.textContent = "NEX 20"[j];
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
			pixel.style = `background: black;`;
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

	buttons = [document.getElementById("left"),
			   document.getElementById("right"),
			   document.getElementById("CCW"),
			   document.getElementById("CW"),
			   document.getElementById("hold"),
			   document.getElementById("hard"),
			   document.getElementById("soft")];
// Left, Right, CCW, CW, Hold, HardDrop, SoftDrop
	document.getElementById("left").onclick = function() {
		remapping = 1;
		for(let i = 0; i < buttons.length; i++) {
			if(buttons[i].textContent.includes("(remapping...)")) {
				buttons[i].textContent = buttons[i].textContent.slice(0, -15);
			}
		}
		this.textContent += " (remapping...)";
		this.blur();
	}.bind(document.getElementById("left"))
	document.getElementById("right").onclick = function() {
		remapping = 2;
		for(let i = 0; i < buttons.length; i++) {
			if(buttons[i].textContent.includes("(remapping...)")) {
				buttons[i].textContent = buttons[i].textContent.slice(0, -15);
			}
		}
		this.textContent += " (remapping...)";
		this.blur();
	}.bind(document.getElementById("right"))
	document.getElementById("CCW").onclick = function() {
		remapping = 3;
		for(let i = 0; i < buttons.length; i++) {
			if(buttons[i].textContent.includes("(remapping...)")) {
				buttons[i].textContent = buttons[i].textContent.slice(0, -15);
			}
		}
		this.textContent += " (remapping...)";
		this.blur();
	}.bind(document.getElementById("CCW"))
	document.getElementById("CW").onclick = function() {
		remapping = 4;
		for(let i = 0; i < buttons.length; i++) {
			if(buttons[i].textContent.includes("(remapping...)")) {
				buttons[i].textContent = buttons[i].textContent.slice(0, -15);
			}
		}
		this.textContent += " (remapping...)";
		this.blur();
	}.bind(document.getElementById("CW"))
	document.getElementById("hard").onclick = function() {
		remapping = 6;
		for(let i = 0; i < buttons.length; i++) {
			if(buttons[i].textContent.includes("(remapping...)")) {
				buttons[i].textContent = buttons[i].textContent.slice(0, -15);
			}
		}
		this.textContent += " (remapping...)";
		this.blur();
	}.bind(document.getElementById("hard"))
	document.getElementById("soft").onclick = function() {
		remapping = 7;
		for(let i = 0; i < buttons.length; i++) {
			if(buttons[i].textContent.includes("(remapping...)")) {
				buttons[i].textContent = buttons[i].textContent.slice(0, -15);
			}
		}
		this.textContent += " (remapping...)";
		this.blur();
	}.bind(document.getElementById("soft"))
	document.getElementById("hold").onclick = function() {
		remapping = 5;
		for(let i = 0; i < buttons.length; i++) {
			if(buttons[i].textContent.includes("(remapping...)")) {
				buttons[i].textContent = buttons[i].textContent.slice(0, -15);
			}
		}
		this.textContent += " (remapping...)";
		this.blur();
	}.bind(document.getElementById("hold"))

	document.getElementById("start").onclick = function() {
		if(gameLoop === undefined) {
			gameLoop = setInterval(mainLoop, 1000 / FRAMERATE);
			this.textContent = "Pause the game.";
		} else {
			gameLoop = clearInterval(gameLoop);
			this.textContent = "Resume the game.";
		}
		this.blur();
	}.bind(document.getElementById("start"));

	scores = localStorage.getItem("leaders");
	if(scores === null) scores = "None.";
	scores = scores.split(",");
	let leaderboards = document.createElement("OL");
	leaderboards.id = "leaderboards";
	let maxLength = 0;
	for(const score of scores) {
		if(maxLength < score.length) maxLength = score.length;
	}
	for(const score of scores) {
		let nextRank = document.createElement("LI");
		nextRank.textContent = score.padStart(maxLength, "0");
		leaderboards.appendChild(nextRank);
	}
	let loadingP = document.getElementById("loadingBoard");
	loadingP.parentNode.replaceChild(leaderboards, loadingP)

}

function Piece(type) {
	this.name = type;
	this.position = [LEFT_MARGIN_WIDTH + 1 + Math.floor((BOARD_WIDTH - 1) / 2), 21];
	this.shape;
	this.color;
	this.ghostColor;
	this.lockTimer;
	this.rotation = 0;
	this.hardDropped = false;
	this.tSpin = false;
	this.mini = false;
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

	this.fall = function(dist = GRAVITY, drop = 0) {
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
			this.tSpin = false;
			this.position[1] -= vertOff;
			score += drop * vertOff;
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
			this.tSpin = false;
		}
	}

	this.lock = function() {
		if(typeof this.lockTimer === "undefined") return;
		let nextPos = [this.position[0], this.position[1] - 1];
		let isGrounded = this.collision(nextPos);
		if(isGrounded) this.lockTimer--;
		let aboveBoard = true;
		if(this.lockTimer <= 0) {
			let halfStep = Math.floor(this.shape.length / 2);
			for(let i = -halfStep; i + halfStep < this.shape.length; i++) {
				for(let j = -halfStep; j + halfStep <= this.shape.length; j++) {
					if(this.shape[i + halfStep][j + halfStep] === 1) {
						pixels[Math.floor(this.position[1]) - i]
							  [this.position[0] + j].col = this.color;
						if(Math.floor(this.position[1]) - i < VIS_HEIGHT) {
							aboveBoard = false;
						}
					}
				}
			}
			if(aboveBoard) {
				// Top out!!!
				return "Top out";
			}
			if(this.tSpin) {
				let filledCorners = 0;
				let thisY = Math.floor(this.position[1]);
				let thisX = this.position[0];
				let TLCor = pixels[thisY + 1][thisX - 1];
				let TRCor = pixels[thisY + 1][thisX + 1];
				filledCorners += +(TLCor.id === "spacer" || typeof TLCor.col === "string");
				filledCorners += +(TRCor.id === "spacer" || typeof TRCor.col === "string");
				let downRow = pixels[thisY - 1];
				let BLCor, BRCor;
				if(typeof downRow === "undefined") {
					filledCorners += 2;
				} else {
					BLCor = downRow[thisX - 1];
					BRCor = downRow[thisX + 1];
					filledCorners += +(BLCor.id === "spacer" || typeof BLCor.col === "string");
					filledCorners += +(BRCor.id === "spacer" || typeof BRCor.col === "string");
				}
				if(filledCorners < 3) this.tSpin = false;
				let miniCheck = [this.rotation, (this.rotation + 1) % 4];
				let miniFilled = 0;
				/* (rotation independent)
				 * 0 # 1
				 * # # #
				 * 3   2
				 */
				if(miniCheck.includes(0)) {
					miniFilled += +(TLCor.id === "spacer" || typeof TLCor.col === "string");
				}
				if(miniCheck.includes(1)) {
					miniFilled += +(TRCor.id === "spacer" || typeof TRCor.col === "string");
				}
				if(miniCheck.includes(2)) {
					if(typeof downRow === "undefined") {
						miniFilled++;
					} else {
						miniFilled += +(BRCor.id === "spacer" || typeof BRCor.col === "string");
					}
				}
				if(miniCheck.includes(3)) {
					if(typeof downRow === "undefined") {
						miniFilled++;
					} else {
						miniFilled += +(BLCor.id === "spacer" || typeof BLCor.col === "string");
					}
				}
				if(miniFilled < 2) this.mini = true;
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
			if(this.name === "T") this.tSpin = true;
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
let buttons;

let linesCleared = 0;
let level = 1;
let score = 0;
let backToBack = false;
let combo = -1;

function mainLoop() {
	try {
		pixels.forEach(function(row) {
			row.forEach(function(pixel) {
				if(pixel.id === "spacer") return;
				if(pixel.id[0] === "Q") return;
				pixel.style = `background: ${pixel.col || "black"};`;
			});
		});

		if(typeof currPiece === "undefined") createNewPiece();

		currPiece.display();
		for(let i = 0; i < controller.length; i++) {
			controller[i] *= +!!KEYBOARD.get(keybinds[i]);
			controller[i] += +!!KEYBOARD.get(keybinds[i]);
		}
		if(controller[0] && controller[1]) {

		} else if(controller[0]) {
			let autoRepeating = controller[0] > DAS && (controller[0] - DAS - 1) % ARR === 0;
			if(controller[0] === 1 || autoRepeating) currPiece.move("left");
		} else if(controller[1]) {
			let autoRepeating = controller[1] > DAS && (controller[1] - DAS - 1) % ARR === 0;
			if(controller[1] === 1 || autoRepeating) currPiece.move("right");
		}

		if(controller[2] && controller[3]) {

		} else if(controller[2]) {
			if(controller[2] === 1) currPiece.rotate("CCW");
		} else if(controller[3]) {
			if(controller[3] === 1) currPiece.rotate("CW");
		}

		if(controller[5] === 1) {
			currPiece.fall(BOARD_HEIGHT, 2);
			currPiece.hardDropped = true;
			currPiece.lockTimer = 0;
		}
		if(controller[6]) {
			currPiece.fall(1, 1);
		}
		if(controller[4] === 1) hold();
		if(typeof currPiece === "undefined") createNewPiece();

		if(currPiece.fall()) {
			gameOver();
			return;
		}
		let lockResult = currPiece.lock();
		if(lockResult === "Top out") {
			gameOver();
		} else if(lockResult) {
			lockHandler();
		}
		let displayScore = score.toString().padStart(6, "0");
		for(let i = 0; i < displayScore.length; i++) {
			pixels[VIS_HEIGHT - 10][i].textContent = displayScore[i];
		}
	} catch(e) {
		clearInterval(gameLoop);
		throw e;
	}
}

function lockHandler() {
	firstHold = false;
	let lineClears = pixels.filter(function(row) {
		return row.every(e => typeof e.col !== "undefined" 
						   || e.id === "spacer"
						   || e.id[0] === "Q");
	});

	if(lineClears.length === 0) {
		combo = -1;
	} else {
		score += 50 * ++combo * level;
	}

	if(lineClears.length !== 4
	   && lineClears.length !== 0
	   && !currPiece.tSpin) backToBack = false;
	let lineClearPoints = [0, 100, 300, 500, 800];
	let tClearPoints = [400, 800, 1200, 1600];
	let miniPoints = [100, 200, 1200];
	let clearDisplay = "";
	if(currPiece.tSpin) {
		if(currPiece.mini) {
			clearDisplay += `${(backToBack && lineClears.length !== 0) ? "BTB" : ""}mT`;
			score += miniPoints[lineClears.length] * level * (backToBack ? 1.5 : 1);
			switch(lineClears.length) {
				case 0:
					clearDisplay += "Spin";
					break;
				case 1:
					clearDisplay += "1";
					break;
				case 2:
					clearDisplay += "2";
					break;
				case 3:
					clearDisplay += "3";
					break;
			}
		} else {
			clearDisplay += (backToBack && lineClears.length !== 0) ? "BTBTS" : "TS";
			score += tClearPoints[lineClears.length] * level * (backToBack ? 1.5 : 1);
			switch(lineClears.length) {
				case 0:
					clearDisplay += "pin";
					break;
				case 1:
					clearDisplay += "1";
					break;
				case 2:
					clearDisplay += "2";
					break;
				case 3:
					clearDisplay += "3";
					break;
			}
		}
	} else {
		clearDisplay += (backToBack && lineClears.length !== 0) ? "BTB" : "";
		score += lineClearPoints[lineClears.length] * level * (backToBack ? 1.5 : 1);
		switch(lineClears.length) {
			case 1:
				clearDisplay += "Single";
				break;
			case 2:
				clearDisplay += "Double";
				break;
			case 3:
				clearDisplay += "Triple";
				break;
			case 4:
				clearDisplay += "Tetris";
				break;
		}
	}
	clearDisplay = clearDisplay.slice(0, 6);
	for(let j = 0; j < 6; j++) {
		pixels[VIS_HEIGHT - 15][j].textContent = clearDisplay[j];
	}
	if(combo > 0) {
		let comboDisplay = combo.toString().padStart(2, "0");
		comboDisplay += "CMBO";
		for(let j = 0; j < 6; j++) {
			pixels[VIS_HEIGHT - 16][j].textContent = comboDisplay[j];
		}
	} else {
		for(let j = 0; j < 6; j++) {
			pixels[VIS_HEIGHT - 16][j].textContent = "";
		}
	}
	if(lineClears.length === 4 || currPiece.tSpin) backToBack = true;
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
		pixels[VIS_HEIGHT - 7][4].textContent = strLV[0];
		pixels[VIS_HEIGHT - 7][5].textContent = strLV[1];
	}

	let displayLines = linesCleared.toString().padStart(3, "0");
	let displayNext = (level * LV_LINE_REQ - linesCleared).toString().padStart(2, "0");
	for(let i = 0; i < 3; i++) {
		pixels[VIS_HEIGHT - 12][i + 3].textContent = displayLines[i];
	}
	for(let i = 0; i < 2; i++) {
		pixels[VIS_HEIGHT - 13][i + 4].textContent = displayNext[i];
	}

	currPiece = undefined;
}

function gameOver() {
	pixels.forEach(function(row, rI) {
		row.forEach(function(pixel, index) {
			if(pixel.id === "spacer") return;
			if(pixel.id[0] === "Q") return;
			pixel.style = `background: ${pixel.col ? "gray" : "black"};`;
			let halfBoard = Math.floor(VIS_HEIGHT / 2);
			if(rI === halfBoard + 1) {
				pixel.style = "";
				let toDisplay = "GAME  OVER".padStart(11 + LEFT_MARGIN_WIDTH, " ");
				pixel.textContent = toDisplay[index];
			} else if(rI === halfBoard || rI === halfBoard + 2) {
				pixel.style = "";
			}
		});
	});
	clearInterval(gameLoop);
	let startButton = document.getElementById("start");
	startButton.textContent = "Start the game.";
	startButton.onclick = function() {
		linesCleared = 0;
		score = 0;
		backToBack = false;
		combo = -1;
		currPiece = undefined;
		level = 1;
		GRAVITY = INIT_GRAVITY;
		heldPiece = undefined;
		firstHold = false;
		currBag = shuffle(PIECES.slice());
		pixels.forEach(function(row, i) {
			row.forEach(function(pixel, j) {
				if(pixel.id === "spacer") return;
				if(pixel.id[0] === "Q") {
					if(i === VIS_HEIGHT - 7) {
						pixel.textContent = "LVL 01"[j];
					}
					if(i === VIS_HEIGHT - 9) {
						pixel.textContent = "SCORE"[j];
					}
					if(i === VIS_HEIGHT - 10) {
						pixel.textContent = "000000"[j];
					}
					if(i === VIS_HEIGHT - 12) {
						console.log("Here at " + i + "," + j);
						pixel.textContent = "LN 000"[j];
					}
					if(i === VIS_HEIGHT - 13) {
						pixel.textContent = "NEX 20"[j];
					}
					if(i === VIS_HEIGHT - 15) {
						pixel.textContent = "";
					}
					if(i === VIS_HEIGHT - 16) {
						pixel.textContent = "";
					}
					return;
				}
				pixel.col = undefined;
				pixel.style = `background: black;`;
				pixel.textContent = "";
			});
		});
		document.getElementById("start").onclick = function() {
			if(gameLoop === undefined) {
				gameLoop = setInterval(mainLoop, 1000 / FRAMERATE);
				this.textContent = "Pause the game.";
			} else {
				gameLoop = clearInterval(gameLoop);
				this.textContent = "Resume the game.";
			}
			this.blur();
		}.bind(document.getElementById("start"));
		gameLoop = setInterval(mainLoop, 1000 / FRAMERATE);
	};
	if(scores[0] === "None.") {
		scores = [score];
	} else {
		scores.push(score);
	}
	scores.sort((a, b) => +b - +a);
	while(scores.length > 5) {
		scores.pop();
	}
	let leaderboards = document.getElementById("leaderboards");
	while(leaderboards.firstChild) {
		leaderboards.removeChild(leaderboards.firstChild);
	}
	let maxLength = 0;
	for(const score of scores) {
		if(maxLength < score.length) maxLength = score.length;
	}
	for(const score of scores) {
		let nextRank = document.createElement("LI");
		nextRank.textContent = score.toString().padStart(maxLength, "0");;
		leaderboards.appendChild(nextRank);
	}
	localStorage.setItem("leaders", scores);
}

function createNewPiece() {
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
				pixels[i][BOARD_WIDTH + j + LEFT_MARGIN_WIDTH + 2].style = "";
			}
		}
		for(let i = 0; i < PREVIEW_LENGTH; i++) {
			let thisPreH = VIS_HEIGHT - (i * 4) - 2;
			let thisPreW = BOARD_WIDTH + LEFT_MARGIN_WIDTH + 1;
			let thisShape = SHAPES.get(currBag[i]);
			let thisColor = COLORS.get(currBag[i]);
			for(let j = 0; j < thisShape.length; j++) {
				pixels[thisPreH + thisShape[j][0]][thisPreW + thisShape[j][1]].style
					= `background: ${thisColor}`;
			}
		}
	}
}

const KEYBOARD = new Map();
let remapping = 0;

document.onkeydown = function(e) {
	if(e.key === " " || e.key.startsWith("Arrow")) {
		e.preventDefault();
	}
	if(remapping !== 0) {
		keybinds[remapping - 1] = e.key;
		let displayText = e.key;
		if(displayText.length === 1) displayText = displayText.toUpperCase();
		if(displayText.startsWith("Arrow")) {
			displayText = displayText.slice(5).toLowerCase() + " arrow key";
		}
		if(displayText === "CapsLock") displayText = "Caps Lock";
		if(displayText === " ") displayText = "Space";
		buttons[remapping - 1].textContent = displayText;
		remapping = 0;

		return;
	}
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
	toHold.position = [LEFT_MARGIN_WIDTH + 1 + Math.floor((BOARD_WIDTH - 1) / 2), 21];
	while(toHold.rotation !== 0) {
		toHold.rotate("CW");
	}
	toHold.position = [LEFT_MARGIN_WIDTH + 1 + Math.floor((BOARD_WIDTH - 1) / 2), 21];
	toHold.hardDropped = false;
	toHold.lockTimer = undefined;
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