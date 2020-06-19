class Tree {
    constructor(peice, grid, depth, score) {
        this.peice = peice;
        this.grid = grid;
        this.depth = depth;
        this.score = score;
        this.children = [];
    }

    getScore() {
        return this.score;
    }

    setScore(score) {
        this.score = score;
    }

    addChild(child) {
        this.children.push(child);
        return this.children.length - 1;
    }

    removeChild(index) {
        this.children.splice(index,1);
    }

    getChild(index) {
        return this.children[index];
    }

    getChildren() {
        return this.children;
    }
}

let previewMove;

function initialiseTree() {
    let currentState = [];
    for(let i = 0; i < gridState.length; i++) {
        currentState.push(gridState[i].slice());
    }
    movesTree = new Tree(tileID,currentState, 0, 0);
    return movesTree;
}

function expandTree(currentPeice, tree, depthLimit) {
    // If we are not at the depth limit, expand the tree
    let possibleMoves = getPossibleMoves(currentPeice, tree.grid);
    let bestScore = -Infinity;
    possibleMoves.forEach((move) => {
        // Make a copy of the current grid state
        let tempGridState = copyArrayByValue(tree.grid);
        // Evaluate the move
        let score = evaluateGrid2(move, tempGridState);
        // Merge the move
        let childGrid = mergeMove(move, tempGridState);
        // Create a sub tree
        let childTree = new Tree(move, childGrid, tree.depth + 1, score);
        if(tree.depth + 1 < depthLimit) {
            // Expand the child tree

            /* Before we expand the tree with the grid
            we need to remove complete rows */
            for(let row = 0; row < childTree.grid.length; row++) {
                if(arraysEqual(childTree.grid[row],[1,1,1,1,1,1,1,1,1,1])) {
                    // This row is complete, move all above rows down one
                    for(let y = row; y > 0; y--) {
                        childTree.grid[y] = childTree.grid[y-1];
                    }
                    // Clear the top row
                    childTree.grid[0] = [0,0,0,0,0,0,0,0,0,0];
                }
            }
            
            childTree = expandTree(tileQueue[tree.depth], childTree, depthLimit);
        }
        // Add the child to the main tree
        tree.addChild(childTree);
        if(childTree.getScore() > bestScore) {
            bestScore = childTree.getScore();
        }
    });
    tree.setScore(bestScore + tree.getScore());
    return tree;
}

function searchMovesTree(currentPeice, tree, depthLimit) {
    tree = expandTree(currentPeice, tree, depthLimit);
    let bestScore = -Infinity, bestMove = 0;
    let children = tree.getChildren();
    children.forEach((child, childIndex) => {
        if(child.getScore() > bestScore) {
            bestScore = child.getScore();
            bestMove = childIndex;
        }
    });
    previewMove = children[bestMove].peice;
    drawMovePreview(children[bestMove].peice);
}

function getPossibleMoves(currentPeice, gridState) {
    let moves = [];
    // Get the current peice matrix
    let peice;
    // Got to account for 3 tile wide peices
    for(let xPos = 0; xPos < gridState[0].length; xPos++) {
        // For each column
        let maxY = 0;
        for(let rotation = 0; rotation < 4; rotation++) {
            
            for(let yPos = 0; yPos < gridState.length; yPos++) {
                switch(currentPeice) {
                    case 0:
                        // A 'T' tile
                        peice = [{y: 0, x: 1},{y: 1, x: 0}, {y: 1, x: 1}, {y: 1, x: 2}];
                        break;
                    case 1:
                        // A right 'S' tile
                        peice = [{y: 0, x: 1},{y: 0, x: 2}, {y: 1, x: 0}, {y: 1, x: 1}];
                        break;
                    case 2:
                        // A left 'Z' tile
                        peice = [{y: 0, x: 0},{y: 0, x: 1}, {y: 1, x: 1}, {y: 1, x: 2}];
                        break;    
                    case 3:
                        // A 'L' tile
                        peice = [{y: 0, x: 0},{y: 1, x: 0}, {y: 2, x: 0}, {y: 2, x: 1}];
                        break;
                    case 4:
                        // A 'reverse L' tile
                        peice = [{y: 0, x: 1},{y: 1, x: 1}, {y: 2, x: 1}, {y: 2, x: 0}];
                        break;
                    case 5:
                        // A column tile
                        peice = [{y: 0, x: 0},{y: 1, x: 0}, {y: 2, x: 0}, {y: 3, x: 0}];
                        break;
                    case 6:
                        // A box tile
                        peice = [{y: 0, x: 0},{y: 0, x: 1}, {y: 1, x: 0}, {y: 1, x: 1}];
                        break;
                }

                // Rotation the peice rotation times
                for(let i=0; i < rotation; i++) {
                    // Rotate the peice
                    peice = copyAndRoatePeice(peice);
                }

                // Drop the peice down
                peice.forEach((tile) => {
                    tile.y += yPos;
                    tile.x += xPos;
                });
                // Test for a collision
                if(!collision(peice, gridState)) {
                    // We could place the peice here
                    maxY = yPos;
                }
                else {
                    // We have reached the point at which we can't place a peice anymore.
                    peice.forEach((tile) => {tile.y--});
                    if(!collision(peice, gridState)) {
                        peice.x = xPos;
                        peice.r = rotation;
                        moves.push(peice);
                    }
                    break;
                }
            }
        }
    }
    return moves;
}

function evaluateGrid(propsedPeice, gridState) {
    // Get the top row with tiles in it before the proposed move
    let maxY = gridState.length;
    for(let row = gridState.length - 1; row >= 0; row--) {
        if(gridState[row].includes(1)) {
            // New top row
            maxY = row;
        }
    }

    // Make the proposed move
    propsedPeice.forEach((tile) => {
        gridState[tile.y][tile.x] = 1;
    });

    // For every tile there is below (and including the maxY row), add a score point
    let score = 0;
    for(let y = gridState.length - 1; y >= maxY; y--) {
        for(let x = 0; x < gridState[0].length; x++) {
            if(gridState[y][x] == 1) {
                score++;
            }
        }
    }
    return score;
}

function evaluateGrid2( proposedPeice, gridState) {
    // Work out the lowest tile in the proposed peice
    let sumY = 0;
    proposedPeice.forEach((tile) => {
        sumY += tile.y;
    });

    return sumY / 4;
}

function copyArrayByValue(arr) {
    let newArray = [];
    arr.forEach((originalRow) => {
        let newRow = [];
        originalRow.forEach((value) => {
            newRow.push(value);
        });
        newArray.push(newRow);
    })
    return newArray;
}

function copyAndRoatePeice(peice) {
    // Get the 'offset' of the peice
    let minX = gridState[0].length; maxX = 0;
    let minY = gridState.length;

    peice.forEach((tile) => {
        if(tile.x < minX) { minX = tile.x }
        if(tile.y < minY) { minY = tile.y }
    });
    
    // Make a transpose of the original peice (by value)
    let newPeice = [];
    peice.forEach((tile) => {
        newPeice.push({y: tile.x, x: tile.y});
    });

    // Get the maximum X
    newPeice.forEach((tile) => {
        if(tile.x > maxX) { maxX = tile.x }
    });

    // Now reverse the columns
    newPeice.forEach((tile) => {
        tile.x = maxX - tile.x + minX;
        if(tile.y > 20) {
            console.log(newPeice);
        }
    });

    return newPeice;
}

function onDrawMoveButton(event) {
    drawMovePreview(possibleMoves[event.target.id]);
}

function drawMovePreview(move) {
    let gameCanvas = document.getElementById('game');
    let ctx = gameCanvas.getContext('2d');
    let canvasWidth = gameCanvas.width;
    let canvasHeight = gameCanvas.height;
    let gridHeight = gridState.length;
    let gridWidth = gridState[0].length;
    ctx.fillStyle = '#00000000';
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 4;
    move.forEach((tile) => {
        let xPos = Math.floor(tile.x / gridWidth * canvasWidth);
        let yPos = Math.floor(tile.y / gridHeight * canvasHeight);
        let width = Math.floor(1/gridWidth*canvasWidth);
        let height = Math.floor(1/gridHeight*canvasHeight);
        ctx.fillRect( xPos, yPos, width, height);
        ctx.strokeRect( xPos, yPos, width, height);
    });
}

function mergeMove(move, grid) {
    move.forEach((tile) => {
        grid[tile.y][tile.x] = 1;
    });
    return grid;
}