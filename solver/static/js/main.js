let m = 4, n = 4;
const BASE_GRID_W_SIZE = 480;
let BASE_CELL_WH_SIZE = 60; // in pixel
let cellRegion = Array.from({length: m*n + 1}, (_, i) => 0);
const action = {id: -1, regionCounter: 0, isCursorDragging: false, filledCell: 0, isCellVisited: Array.from({length: m*n + 1}, (_, i) => false)};


// CSS Styles
const SIDE_BORDER = '2px solid black';
const WALL_BORDER = '1px solid black';
const LOCAL_BORDER = '1px dashed gray';



const cellOrder = (i, j) => (i-1)*n + j;
const toCell = (order) => [Math.ceil(order/n), ((order-1) % n) + 1];
const insideGrid = (i, j) => (1 <= i && i <= m && 1 <= j && j <= n);
const isAdjacent = ([i, j], [x, y]) => (Math.abs(i-x) <= 1 && Math.abs(j-y) <= 1 && Math.abs(i-x) + Math.abs(j-y) == 1);

const updateExpansion = (r, c) => {
    const M = m + r;
    const N = n + c;
    const newCellRegion = Array.from({length: M*N + 1}, (_, i) => 0);
    const newIsCellVisited = Array.from({length: M*N + 1}, (_, i) => false);
    const newHint = Array.from({length: M*N + 1}, (_, i) => '');
    const newCellOrder = (i, j) => (i-1)*N + j;

    action.filledCell = 0;

    for (let i = 1; i <= Math.min(m, M); i++)
        for (let j = 1; j <= Math.min(n, N); j++) {
            newCellRegion[newCellOrder(i, j)] = cellRegion[cellOrder(i, j)];
            newIsCellVisited[newCellOrder(i, j)] = action.isCellVisited[cellOrder(i, j)];
            newHint[newCellOrder(i, j)] = document.querySelector(`#p${cellOrder(i, j)}`).innerHTML;
            if (newIsCellVisited[newCellOrder(i, j)])
                action.filledCell++;
        }

    m = M, n = N, cellRegion = newCellRegion, action.isCellVisited = newIsCellVisited;
    // BASE_CELL_WH_SIZE = BASE_GRID_W_SIZE/n;
    initializeEmptyGrid();
    
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            document.querySelector(`#p${cellOrder(i, j)}`).innerHTML = newHint[cellOrder(i, j)];
    cleanGrid();
    initializeCellEvents();
    refreshValidateSolveButton();
}

const createElementWithStyles = (elementType, [...styles]) => {
    const element = document.createElement(elementType);
    styles.forEach((style) => {
        element.classList.add(style);
    });
    return element;
}

// border-b-[4px] border-t-[4px] border-r-[4px] border-l-[4px] 
const createCell = (i, j) => {
    const cell = createElementWithStyles('div', ['bg-white', 'border-gray-600', 'cell', 'flex', 'justify-center', 'items-center']);
    cell.id = `c${cellOrder(i, j)}`;
    cell.style.width = `${BASE_CELL_WH_SIZE}px`;
    cell.style.height = `${BASE_CELL_WH_SIZE}px`;
    cell.style.userSelect = 'none';
    cell.style.border = LOCAL_BORDER;

    [[1, 0, 'borderBottom'], [-1, 0, 'borderTop'], [0, 1, 'borderRight'], [0, -1, 'borderLeft']].forEach(([dx, dy, dir]) => {
        if (!insideGrid(i + dx, j + dy))
            cell.style[dir] = SIDE_BORDER;
    });

    const child = createElementWithStyles('p', [n <= 5 ? 'text-5xl' : n <= 8 ? 'text-2xl' : n <= 12 ? 'text-md' : 'text-sm', 'flex', 'justify-center', 'items-center']);
    child.id = `p${cellOrder(i, j)}`;
    child.contentEditable = false;
    child.style.width = `${Math.floor(5 + BASE_CELL_WH_SIZE/2)}px`;
    child.style.height = `${Math.floor(5 +BASE_CELL_WH_SIZE/2)}px`;
    cell.appendChild(child);

    return cell;
}

const cleanGrid = () => {
    class Queue {
        constructor() {
            this.queue = [];
        }

        enqueue(item) {
            this.queue.push(item);
        }

        dequeue() {
            if (this.isEmpty()) {
                return null;
            }
            return this.queue.shift();
        }

        front() {
            if (this.isEmpty()) {
                return null;
            }
            return this.queue[0];
        }

        size() {
            return this.queue.length;
        }

        isEmpty() {
            return this.size() === 0;
        }

        clear() {
            this.queue = [];
        }
    }

    const isVisited = Array.from({length: m*n + 1}, (_, i) => false);
    const Q = new Queue();
    let newRegionCounter = 0;

    const BFS = (prevRegion) => {
        while (!Q.isEmpty()) {
            const [i, j] = Q.dequeue();
            isVisited[cellOrder(i, j)] = true;
            cellRegion[cellOrder(i, j)] = newRegionCounter;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                if (insideGrid(i + dx, j + dy) && cellRegion[cellOrder(i + dx, j + dy)] == prevRegion && !isVisited[cellOrder(i + dx, j + dy)])
                    Q.enqueue([i + dx, j + dy]);
            });
        }
    }
    
    for (let i = m; i >= 1; i--)
        for (let j = n; j >= 1; j--)
            if (!isVisited[cellOrder(i, j)])
                Q.enqueue([i, j]), BFS(cellRegion[cellOrder(i, j)]), newRegionCounter++;

    action.regionCounter = newRegionCounter;
}

// border-b-gray-300 border-t-gray-300 border-r-gray-300 border-l-gray-300
const purgeCellRegion = (i, j) => {
    [[1, 0, 'borderBottom', 'borderTop'], [-1, 0, 'borderTop', 'borderBottom'], [0, 1, 'borderRight', 'borderLeft'], [0, -1, 'borderLeft', 'borderRight']].forEach(([dx, dy, dirA, dirB]) => {
        if (insideGrid(i + dx, j + dy))
            if (cellRegion[cellOrder(i, j)] == cellRegion[cellOrder(i + dx, j + dy)]) {
                document.querySelector(`#c${cellOrder(i, j)}`).style[dirA] = LOCAL_BORDER;
                document.querySelector(`#c${cellOrder(i + dx, j + dy)}`).style[dirB] = LOCAL_BORDER;
            } else {
                document.querySelector(`#c${cellOrder(i, j)}`).style[dirA] = WALL_BORDER;
                document.querySelector(`#c${cellOrder(i + dx, j + dy)}`).style[dirB] = WALL_BORDER;
            }
    });
}

const applyRegionChanges = ([i, j], {regionCounter}) => {
    cellRegion[cellOrder(i, j)] = regionCounter;
    purgeCellRegion(i, j);
}

const initializeEmptyGrid = () => {
    const grid = document.querySelector('#grid');
    grid.innerHTML = '';
    grid.className = 'bg-gray-900 flex flex-wrap h-fit';
    grid.style.width = `${BASE_CELL_WH_SIZE*n}px`

    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            grid.appendChild(createCell(i, j));
    
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            purgeCellRegion(i, j);   
        
    cleanGrid();
}

const getCurrentGridData = () => {
    const hint = [], region = [];
    for (let i = 1; i <= m; i++) {
        const currentRegion = [], currentHint = [];
        for (let j = 1; j <= n; j++) {
            currentHint.push(parseInt(document.querySelector(`#c${cellOrder(i, j)}`).querySelector('p').innerHTML) || 0);
            currentRegion.push(cellRegion[cellOrder(i, j)]);
        }
        hint.push(currentHint);
        region.push(currentRegion);
    }
    return {m, n, hint, region};
}

const refreshValidateSolveButton = () => {
    const solveButton = document.querySelector('#solveButton');
    solveButton.disabled = (action.filledCell == m*n);
    solveButton.classList.remove((action.filledCell == m*n ? 'bg-teal-500' : 'bg-teal-800'));
    solveButton.classList.add((action.filledCell == m*n ? 'bg-teal-800' : 'bg-teal-500'));

    const validateButton = document.querySelector('#validateButton');
    validateButton.disabled = (action.filledCell !== m*n);
    validateButton.classList.remove((action.filledCell !== m*n ? 'bg-teal-500' : 'bg-teal-800'));
    validateButton.classList.add((action.filledCell !== m*n ? 'bg-teal-800' : 'bg-teal-500'));
}

// Events
const initializeCellEvents = () => {
    const cellObserver  = (element) => {
        const value = element.innerHTML;
        const order = element.id.substring(1);

        if (value === '') {
            if (action.isCellVisited[order])
                action.filledCell--;
            action.isCellVisited[order] = false;
        } else {
            if (!action.isCellVisited[order])
                action.filledCell++;
            action.isCellVisited[order] = true;
        }

        if (action.id == -1) {
            const solveButton = document.querySelector('#solveButton');
            solveButton.disabled = (action.filledCell == m*n);
            solveButton.classList.remove((action.filledCell == m*n ? 'bg-teal-500' : 'bg-teal-800'));
            solveButton.classList.add((action.filledCell == m*n ? 'bg-teal-800' : 'bg-teal-500'));

            const validateButton = document.querySelector('#validateButton');
            validateButton.disabled = (action.filledCell !== m*n);
            validateButton.classList.remove((action.filledCell !== m*n ? 'bg-teal-500' : 'bg-teal-800'));
            validateButton.classList.add((action.filledCell !== m*n ? 'bg-teal-800' : 'bg-teal-500'));
        }
    }

    document.querySelectorAll(".cell").forEach((element) => {
        element = element.querySelector('p');
        const observer = new MutationObserver((mutationsList, observer) => {
            cellObserver(element);
        });
        observer.observe(element, {characterData: true, childList: true, attributes: false});
    });    

    const isNumberKey = (key) => {
        return /^\d$/.test(key);
    }

    const isAllowedKey = (event) => {
        return event.key === 'Backspace' || event.key === 'Delete' || event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End';
    }

    document.querySelectorAll(".cell").forEach((element) => {
        element.addEventListener("mousemove", function(event) {
            if (!action.isCursorDragging || action.id != 1)
                return;

            const [i, j] = toCell(parseInt(event.target.id.substring(1)));
            applyRegionChanges([i, j], action);
        });

        element.addEventListener("click", function(event) {
            if (action.id != 1)
                return;

            const [i, j] = toCell(parseInt(event.target.id.substring(1)));
            applyRegionChanges([i, j], action);
        });

        element.querySelector('p').addEventListener('keydown', (event) => {
            const key = event.key;
            const currentValue = event.target.innerHTML;
            if ((!isNumberKey(key) && !isAllowedKey(event)))
                event.preventDefault();
                
            if (isNumberKey(key) && currentValue.length >= 3)
                event.preventDefault();
        })
    });
}

const initializeButtonEvents = () => {
    document.querySelector('#validateButton').disabled = true;
    document.querySelector('#validateButton').classList.remove((action.filledCell !== m*n ? 'bg-teal-500' : 'bg-teal-800'));
    document.querySelector('#validateButton').classList.add((action.filledCell !== m*n ? 'bg-teal-800' : 'bg-teal-500'));

    document.querySelector('#addRow').addEventListener('click', (event) => {
        updateExpansion(1, 0);
    });

    document.querySelector('#delRow').addEventListener('click', (event) => {
        if (m > 1) updateExpansion(-1, 0);
    });

    document.querySelector('#addCol').addEventListener('click', (event) => {
        updateExpansion(0, 1);
    });

    document.querySelector('#delCol').addEventListener('click', (event) => {
        if (n > 1) updateExpansion(0, -1);
    });
}

const initializeEvents = () => {
    const BASE_NAVI_TEXT = "Hello! I'll assist you in using the Solver.";
    const DRAW_REGION_NAVI_TEXT = 'Holdclick and drag in the grid to draw region!';
    const FILL_CELL_NAVI_TEXT = 'Click on the cell and type!';
    const UNSOLVABLE_NAVI_TEXT = 'Too bad, this Suguru puzzle is unsolvable :(';
    const VALIDATE_CORRECT_NAVI_TEXT = 'Wow! you solved the puzzle!';
    const VALIDATE_INCORRECT_NAVI_TEXT = 'Your configuration is incorrect...';      

    const greenButtonIds = ['drawRegionButton', 'fillCellButton', 'solveButton', 'validateButton'];
    const redButtonIds = ['clearCellsButton', 'clearRegionsButton'];
    const blueButtonIds = ['addCol', 'addRow', 'delCol', 'delRow'];
    const naviElement = document.querySelector('#navi').querySelector('p');

    const setNaviText = (text) => {
        naviElement.innerHTML = text;
    }

    document.querySelector('#drawRegionButton').addEventListener("click", (event) => {
        if (action.id !== 1) {
            action.id = 1, action.regionCounter++;
            event.target.innerHTML = 'Finish Draw Region';
            setNaviText(DRAW_REGION_NAVI_TEXT);
        } else {
            action.id = -1;
            event.target.innerHTML = 'Draw Region';
            cleanGrid();
            setNaviText(BASE_NAVI_TEXT);
        }

        [...greenButtonIds, ...redButtonIds].forEach((id) => {
            const button = document.querySelector(`#${id}`);
            if (id !== 'drawRegionButton') {
                const lightColor = (redButtonIds.includes(id) ? 'bg-red-400' : 'bg-teal-500');
                const darkColor = (redButtonIds.includes(id) ? 'bg-red-800' : 'bg-teal-800');
                
                button.disabled = (action.id == 1);
                button.classList.remove((action.id == 1 ? lightColor : darkColor));
                button.classList.add((action.id == 1 ? darkColor : lightColor));
            }
        });

        if (action.id == -1) {
            refreshValidateSolveButton();    
        }

        blueButtonIds.forEach((id) => {
            const button = document.querySelector(`#${id}`);
            const lightColor = 'bg-sky-500';
            const darkColor = 'bg-sky-800';
            
            button.disabled = (action.id == 1);
            button.classList.remove((action.id == 1 ? lightColor : darkColor));
            button.classList.add((action.id == 1 ? darkColor : lightColor));
        });
    });

    document.querySelector('#fillCellButton').addEventListener('click', (event) => {
        if (action.id !== 2) {
            action.id = 2;
            event.target.innerHTML = 'Finish Fill Cell';
            setNaviText(FILL_CELL_NAVI_TEXT);
        } else {
            action.id = -1;
            event.target.innerHTML = 'Fill Cell';
            setNaviText(BASE_NAVI_TEXT);
        }
        document.querySelectorAll(".cell").forEach((element) => {
            element.querySelector('p').contentEditable = (action.id == 2);
            element.style.userSelect = (action.id == 2 ? 'auto' : 'none');
        });

        [...greenButtonIds, ...redButtonIds].forEach((id) => {
            const button = document.querySelector(`#${id}`);
            if (id !== 'fillCellButton') {
                const lightColor = (redButtonIds.includes(id) ? 'bg-red-400' : 'bg-teal-500');
                const darkColor = (redButtonIds.includes(id) ? 'bg-red-800' : 'bg-teal-800');
                
                button.disabled = (action.id == 2);
                button.classList.remove((action.id == 2 ? lightColor : darkColor));
                button.classList.add((action.id == 2 ? darkColor : lightColor));
            }
        });

        if (action.id == -1) {
            refreshValidateSolveButton();    
        }

        blueButtonIds.forEach((id) => {
            const button = document.querySelector(`#${id}`);
            const lightColor = 'bg-sky-500';
            const darkColor = 'bg-sky-800';
            
            button.disabled = (action.id == 2);
            button.classList.remove((action.id == 2 ? lightColor : darkColor));
            button.classList.add((action.id == 2 ? darkColor : lightColor));
        });
    });

    document.querySelector('#solveButton').addEventListener('click', (event) => {
        const csrfToken = document.querySelector('#csrf-token-holder').querySelector('input').value;

        fetch('/solve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(getCurrentGridData())
        }).then(response => {
            if (!response.ok) {
                throw new Error('Request failed with status: ' + response.status);
            }
            return response.json();
        }).then(data => {
            const {solve_status, hint} = data;
            if (solve_status == 'unsolvable') {
                setNaviText(UNSOLVABLE_NAVI_TEXT);
                return;
            }

            for (let i = 1; i <= m; i++)
                for (let j = 1; j <= n; j++)
                    document.querySelector(`#c${cellOrder(i, j)}`).querySelector('p').innerHTML = `${hint[i-1][j-1]}`;
        })
    });

    document.querySelector('#validateButton').addEventListener('click', (event) => {
        const csrfToken = document.querySelector('#csrf-token-holder').querySelector('input').value;

        fetch('/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(getCurrentGridData())
        }).then(response => {
            if (!response.ok) {
                throw new Error('Request failed with status: ' + response.status);
            }
            return response.json();
        }).then(data => {
            const {solve_status, messages} = data;
            if (solve_status == 'unsolved') {
                setNaviText(VALIDATE_INCORRECT_NAVI_TEXT);
                messages.forEach((message, index) => {
                    const messageElement = createElementWithStyles('p', ['text-sm']);
                    messageElement.innerHTML = `(${index+1}) ${message}`;
                    naviElement.appendChild(messageElement);
                });
                return;
            }
            setNaviText(VALIDATE_CORRECT_NAVI_TEXT);
        })
    });

    document.querySelector('#clearCellsButton').addEventListener('click', (event) => {
        document.querySelectorAll('.cell').forEach((element) => {
            element.querySelector('p').innerHTML = '';
        })
    });

    document.querySelector('#clearRegionsButton').addEventListener('click', (event) => {
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                cellRegion[cellOrder(i, j)] = 0, purgeCellRegion(i, j);
    });

    document.body.addEventListener("mousedown", function(event) {
        action.isCursorDragging = true;
    });

    document.body.addEventListener("mouseup", function(event) {
        action.isCursorDragging = false;
    });
}


initializeEmptyGrid();
initializeEvents();
initializeCellEvents();
initializeButtonEvents();