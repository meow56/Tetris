"use strict";

let board;
let pixels = [];
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 40;
const VIS_HEIGHT = 20;
const GRAVITY = 1/64;
const LOCK_DELAY = 60;
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
			pixel.textContent = "█";
			if(i < VIS_HEIGHT) {
				board.appendChild(pixel);
			}
			pixels[i][j] = pixel;
		}
		if(i < VIS_HEIGHT) {
			board.appendChild(document.createElement("BR"));
		}
	}
	console.log(pixels);
	gameLoop = setInterval(mainLoop, 1000 / FRAMERATE)
}

function Piece(type) {
	this.name = type;
	this.position = [Math.floor((BOARD_WIDTH - 1) / 2), 21];
	this.shape;
	this.color;
	this.lockTimer;
	switch(this.name) {
		case "I":
			this.shape = [[0, 0, 0, 0], 
						  [1, 1, 1, 1], 
						  [0, 0, 0, 0], 
						  [0, 0, 0, 0]];
			this.position = [(BOARD_WIDTH - 1) / 2, 20.5];
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
			this.shape = [[1, 1], 
						  [1, 1]];
			this.position = [(BOARD_WIDTH - 1) / 2, 21.5];
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
		this.position[1] = Math.max(0, nextPos[1]);
		if(typeof this.lockTimer === "undefined" && nextPos[1] < 0) this.lockTimer = LOCK_DELAY;
	}

	this.display = function() {
		let halfStep = Math.floor(this.shape.length / 2);
		for(let i = -halfStep; i + halfStep < this.shape.length; i++) {
			for(let j = -halfStep; j + halfStep <= this.shape.length; j++) {
				if(this.shape[i + halfStep][j + halfStep] === 1) {
					pixels[Math.floor(this.position[1]) - i]
						  [Math.ceil(this.position[0]) + j].style = `color: ${this.color};`;
				}
			}
		}
	}
}

let currPiece;
function mainLoop() {
	try {
		pixels.forEach(function(row) {
			row.forEach(function(pixel) {
				pixel.style = ``;
			});
		});

		if(typeof currPiece === "undefined") {
			currPiece = new Piece("O");
		}

		currPiece.display();
		currPiece.fall();
	} catch(e) {
		clearInterval(gameLoop);
		throw e;
	}
}




function spawnBlock(what) {
	// Blah blah blah...

	// Then...

}

function rotateBlock(rotClockwise) {
	// Uh huh, uh huh...

	// Then...
}
