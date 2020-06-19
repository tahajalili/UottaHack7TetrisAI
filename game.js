let gameCanvas;
let gridState;
let tilesInMotion = [];
let score = 0;
let holdTileID;
let tileID;
let canHold = true;
let gameLoop;
let tileQueue;
let movesTree;

function controller() {
    generateState();
    gameLoop = setInterval(onUpdate,1000);
    spawnTile(Math.floor(Math.random()*6));
    movesTree = initialiseTree();
    searchMovesTree(tileID, movesTree, 3);
}

function onUpdate() {
    dropTile();
    drawGame();
}

function fix_dpi(canvas) {
    //create a style object that returns width and height
    let dpi = window.devicePixelRatio;
    let style = {
        height() {
            return +getComputedStyle(canvas).getPropertyValue('height').slice(0,-2);
        },
        width() {
            return +getComputedStyle(canvas).getPropertyValue('width').slice(0,-2);
        }
    }
    //set the correct attributes for a crystal clear image!
    canvas.setAttribute('width', style.width() * dpi);
    canvas.setAttribute('height', style.height() * dpi);
}

function generateState() {
    let gridHeight = 20;
    let gridWidth = 10;
    tileQueue = [Math.floor(Math.random()*7),Math.floor(Math.random()*7),Math.floor(Math.random()*7)];
    gridState = Array(gridHeight);
    for(let y =0; y<gridHeight; y++) {
        gridState[y] = [0,0,0,0,0,0,0,0,0,0];        
    }
    drawQueue();
}

function drawGame() {
    gameCanvas = document.getElementById('game');
    fix_dpi(gameCanvas);
    let canvasWidth = gameCanvas.width;
    let canvasHeight = gameCanvas.height;
    let ctx = gameCanvas.getContext('2d');
    ctx.fillStyle = "red";
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;

    let gridHeight = gridState.length;
    let gridWidth = gridState[0].length;
    
    // Loop over the game state array (to draw the stuck tiles)
    for(let y = 0; y < gridHeight; y++) {
        for(let x = 0; x < gridWidth; x++) {
            if(gridState[y][x] == 1) {
                let xPos = Math.floor(x / gridWidth * canvasWidth);
                let yPos = Math.floor(y / gridHeight * canvasHeight);
                let width = Math.floor(1/gridWidth*canvasWidth);
                let height = Math.floor(1/gridHeight*canvasHeight);
                ctx.fillRect( xPos, yPos, width, height);
                ctx.strokeRect( xPos, yPos, width, height);
            }
        }
    }

    // Loop over the tiles in motion to draw those tiles
    tilesInMotion.forEach((tile) => {
        let xPos = Math.floor(tile.x / gridWidth * canvasWidth);
        let yPos = Math.floor(tile.y / gridHeight * canvasHeight);
        let width = Math.floor(1/gridWidth*canvasWidth);
        let height = Math.floor(1/gridHeight*canvasHeight);
        ctx.fillRect( xPos, yPos, width, height);
        ctx.strokeRect( xPos, yPos, width, height);
    });

    if(previewMove != undefined) {
        drawMovePreview(previewMove);
    }
}

function spawnTile(type) {
    tileID = type;
    switch(type) {
        case 0:
            // A 'T' tile
            tilesInMotion = [{y: 0, x: 5},{y: 1, x: 4}, {y: 1, x: 5}, {y: 1, x: 6}];
            break;
        case 1:
            // A right 'S' tile
            tilesInMotion = [{y: 0, x: 5},{y: 0, x: 6}, {y: 1, x: 4}, {y: 1, x: 5}];
            break;
        case 2:
            // A left 'Z' tile
            tilesInMotion = [{y: 0, x: 4},{y: 0, x: 5}, {y: 1, x: 5}, {y: 1, x: 6}];
            break;    
        case 3:
            // A 'L' tile
            tilesInMotion = [{y: 0, x: 4},{y: 1, x: 4}, {y: 2, x: 4}, {y: 2, x: 5}];
            break;
        case 4:
            // A 'reverse L' tile
            tilesInMotion = [{y: 0, x: 5},{y: 1, x: 5}, {y: 2, x: 4}, {y: 2, x: 5}];
            break;
        case 5:
            // A column tile
            tilesInMotion = [{y: 0, x: 5},{y: 1, x: 5}, {y: 2, x: 5}, {y: 3, x: 5}];
            break;
        case 6:
            // A box tile
            tilesInMotion = [{y: 0, x: 4},{y: 0, x: 5}, {y: 1, x: 4}, {y: 1, x: 5}];
            break;
    }
    if(collision(tilesInMotion,gridState)) {
        // Can't spawn a new tile, game over
        clearInterval(gameLoop);
        alert("Game over!");
    }
}

function dropTile() {
    let nextPos = [];
    tilesInMotion.forEach((tile) => {
        nextPos.push({y: tile.y+1, x: tile.x});
    });

    // Test for a collision
    if(!collision(nextPos,gridState)) {
        // No collision
        tilesInMotion = nextPos;
    }
    else {
        // Collision, commit current tile, spawn a new tile
        commitTile();
        checkForRows();
        spawnTile(tileQueue[0]);
        for(let i=0; i<2; i++) {
            tileQueue[i] = tileQueue[i+1];
        }
        tileQueue[2] = Math.floor(Math.random()*7);
        drawQueue();
        movesTree = initialiseTree();
        searchMovesTree(tileID, movesTree, 3);
    }
}

function collision(tilesInMotion, gridState) {
    let collision = false;
    tilesInMotion.forEach((tile) => {
        // Check if tile is going over the edge
        if(tile.x < 0 || tile.x >= gridState[0].length) {
            collision = true;
        }
        else if(tile.y < 0 || tile.y >= gridState.length) {
            collision = true;
        }
        // Check if tile is on bottom row
        else if(tile.y == gridState.length) {
            // If so, there will be a collision
            collision = true;
        }
        else if(gridState[tile.y][tile.x] == 1) {
            // There will be a collision
            collision = true;
        }
    });
    return collision;
}

function commitTile() {
    // Go through each tile
    tilesInMotion.forEach((tile) => {
        // Add it to the permanent grid
        gridState[tile.y][tile.x] = 1;
    });
    // Can now hold tiles
    canHold = true;
    // Update button style
    document.getElementById('holdButton').style.backgroundColor = '#2373ce';
}

function onKeyDown(event) {
    let key = event.key;
    switch(key) {
        case 'a':
            // Move falling peice left
            movePeice('L');
            break;
        case 'd':
            // Move falling peice right
            movePeice('R');
            break;
        case 's':
            // Move falling peice down
            movePeice('D');
            break;
        case 'w':
            // Rotate peice
            rotatePeice();
            break;
    }
    // Redraw the game
    drawGame();
}

function movePeice(direction) {
    let newPos = [];
    let deltaX = 0, deltaY = 0;
    if(direction == 'L') {
        deltaX=-1;
    }
    else if(direction == 'R') {
        deltaX=1;
    }
    else if(direction == 'D') {
        deltaY=1;
    }

    // Make a 'temporary' move
    tilesInMotion.forEach((tile) => {
        newPos.push({y: tile.y+deltaY, x: tile.x+deltaX});
    });

    // Test for a collision
    if(!collision(newPos, gridState)) {
        tilesInMotion = newPos;
    }
}

function rotatePeice() {
    let minX = gridState[0].length; maxX = 0;
    let minY = gridState.length;
    
    tilesInMotion.forEach((tile) => {
        if(tile.x < minX) { minX = tile.x }
        if(tile.y < minY) { minY = tile.y }
    });


    let newPos = [];
    // Create a transpose of the falling peice
    tilesInMotion.forEach((tile) => {
        newPos.push({y: tile.x - minX + minY, x: (tile.y - minY) + minX});
    });

    // Get the maximum X
    newPos.forEach((tile) => {
        if(tile.x > maxX) { maxX = tile.x }
    });

    // Now reverse the columns
    newPos.forEach((tile) => {
        tile.x = (maxX - tile.x) + minX;
    });

    // Check for any potential collisions
    if(!collision(newPos, gridState)) {
        tilesInMotion = newPos;
    }
}

function checkForRows() {
    let rowsCleared = 0;
    for(let y = 0; y < gridState.length; y++) {
        if(arraysEqual(gridState[y],[1,1,1,1,1,1,1,1,1,1])) {
            rowsCleared++;
            // Move all above rows down
            for(let row = y; row > 0; row--) {
                gridState[row] = gridState[row-1]
            }
            // Top row will be cleared
            gridState[0] = [0,0,0,0,0,0,0,0,0,0];
        }
    }
    switch(rowsCleared) {
        case 1:
            addScore(100);
            break;
        case 2:
            addScore(400);
            break;
        case 3:
            addScore(900);
            break;
        case 4:
            addScore(2000);
            break;
    }
}

function arraysEqual(arr1, arr2) {
    if(arr1.length != arr2.length) {
        return false;
    }
    else {
        let equal = true;
        arr1.forEach((item,index) => {
            if(item != arr2[index]) {
                equal = false;
                return false;
            }
        });
        return equal;
    }
}

function addScore(number) {
    score += number;
    document.getElementById('scoreCounter').innerHTML = "Score: " + score;
}

function swapHold() {
    if(canHold) {
        if(holdTileID == undefined) {
            holdTileID = Math.floor(Math.random()*7);
        }
        let tempID = tileID;
        spawnTile(holdTileID);
        holdTileID = tempID;
        drawHold();
        drawGame();
        // Can't hold tile until current one has been committed.
        canHold = false;
        // Update button style
        document.getElementById('holdButton').style.backgroundColor = '#174a85';
    }
}

function drawHold() {
    let holdCanvas = document.getElementById('holdDisplay');
    fix_dpi(holdCanvas);
    let ctx = holdCanvas.getContext('2d');
    let width;
    let height;
    switch(holdTileID) {
        case 0:
            // A 'T' tile
            holdTileMatrix = [{y: 0, x: 1},{y: 1, x: 0}, {y: 1, x: 1}, {y: 1, x: 2}];
            width = 3;
            height = 2;
            break;
        case 1:
            // A right 'S' tile
            holdTileMatrix = [{y: 1, x: 0},{y: 1, x: 1}, {y: 0, x: 1}, {y: 0, x: 2}];
            width = 3;
            height = 2;
            break;
        case 2:
            // A left 'Z' tile
            holdTileMatrix = [{y: 0, x: 0},{y: 0, x: 1}, {y: 1, x: 1}, {y: 1, x: 2}];
            width = 3;
            height = 2;
            break;    
        case 3:
            // A 'L' tile
            holdTileMatrix = [{y: 0, x: 0},{y: 1, x: 0}, {y: 2, x: 0}, {y: 2, x: 1}];
            width = 2;
            height = 3;
            break;
        case 4:
            // A 'reverse L' tile
            holdTileMatrix = [{y: 0, x: 1},{y: 1, x: 1}, {y: 2, x: 1}, {y: 2, x: 0}];
            width = 2;
            height = 3;
            break;
        case 5:
            // A column tile
            holdTileMatrix = [{y: 0, x: 0},{y: 1, x: 0}, {y: 2, x: 0}, {y: 3, x: 0}];
            width = 1;
            height = 4;
            break;
        case 6:
            // A box tile
            holdTileMatrix = [{y: 0, x: 0},{y: 0, x: 1}, {y: 1, x: 0}, {y: 1, x: 1}];
            width = 2;
            height = 2;
            break;
    }
    let canvasWidth = holdCanvas.width, canvasHeight = holdCanvas.height;
    let xOffset = (canvasWidth / 2) - width * 15;
    let yOffset = (canvasHeight / 2) - height * 15;
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,holdCanvas.width,holdCanvas.height);
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    holdTileMatrix.forEach((tile) => {
        ctx.fillRect(tile.x * 30 + xOffset, tile.y * 30 + yOffset, 30, 30);
        ctx.strokeRect(tile.x * 30 + xOffset, tile.y * 30 + yOffset, 30, 30);
    });
}

function drawQueue() {
    let queueCanvas = document.getElementById('nextPeices');
    fix_dpi(queueCanvas);
    let ctx = queueCanvas.getContext('2d');
    let canvasWidth = queueCanvas.width, canvasHeight = 90;
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvasWidth,canvasHeight);
    for(let index=0; index < 3; index++) {
        let queueOffset = index * 90;
        let tileID = tileQueue[index];
        let tileMatrix;
        let width, height;
        switch(tileID) {
            case 0:
                // A 'T' tile
                tileMatrix = [{y: 0, x: 1},{y: 1, x: 0}, {y: 1, x: 1}, {y: 1, x: 2}];
                width = 3;
                height = 2;
                break;
            case 1:
                // A right 'S' tile
                tileMatrix = [{y: 1, x: 0},{y: 1, x: 1}, {y: 0, x: 1}, {y: 0, x: 2}];
                width = 3;
                height = 2;
                break;
            case 2:
                // A left 'Z' tile
                tileMatrix = [{y: 0, x: 0},{y: 0, x: 1}, {y: 1, x: 1}, {y: 1, x: 2}];
                width = 3;
                height = 2;
                break;    
            case 3:
                // A 'L' tile
                tileMatrix = [{y: 0, x: 0},{y: 1, x: 0}, {y: 2, x: 0}, {y: 2, x: 1}];
                width = 2;
                height = 3;
                break;
            case 4:
                // A 'reverse L' tile
                tileMatrix = [{y: 0, x: 1},{y: 1, x: 1}, {y: 2, x: 1}, {y: 2, x: 0}];
                width = 2;
                height = 3;
                break;
            case 5:
                // A column tile
                tileMatrix = [{y: 0, x: 0},{y: 1, x: 0}, {y: 2, x: 0}, {y: 3, x: 0}];
                width = 1;
                height = 4;
                break;
            case 6:
                // A box tile
                tileMatrix = [{y: 0, x: 0},{y: 0, x: 1}, {y: 1, x: 0}, {y: 1, x: 1}];
                width = 2;
                height = 2;
                break;
        }

        let xOffset = (canvasWidth / 2) - width * 7.5;
        let yOffset = (canvasHeight / 2) - height * 7.5;
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        tileMatrix.forEach((tile) => {
            ctx.fillRect(tile.x * 15 + xOffset, tile.y * 15 + yOffset + queueOffset, 15, 15);
            ctx.strokeRect(tile.x * 15 + xOffset, tile.y * 15 + yOffset + queueOffset, 15, 15);
        });
    }
}

function pauseGame() {
    document.getElementById('pauseButton').style.display = 'None';
    document.getElementById('resumeButton').style.display = 'Block';
    clearInterval(gameLoop);
}

function resumeGame() {
    document.getElementById('pauseButton').style.display = 'Block';
    document.getElementById('resumeButton').style.display = 'None';
    gameLoop = setInterval(onUpdate,1000);
}