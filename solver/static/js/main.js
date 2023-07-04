let m = 5, n = 5;
let cellRegion;
const action = {id: -1, regionCounter: 0, isCursorDragging: false};

const MAX_ROW = 30, MAX_COL = 30;
const SIDE_BORDER = '2px solid black';
const WALL_BORDER = '1px solid black';
const LOCAL_BORDER = '1px dashed #DCDCDC';
const BASE_CELL_WH_SIZE = window.innerWidth <= 560 ? 40 : 60;

const cellOrder = (i, j) => (i-1)*n + j;
const toCell = (order) => [Math.ceil(order/n), ((order-1) % n) + 1];
const insideGrid = (i, j) => (1 <= i && i <= m && 1 <= j && j <= n);
const isAdjacent = ([i, j], [x, y]) => (Math.abs(i-x) <= 1 && Math.abs(j-y) <= 1 && Math.abs(i-x) + Math.abs(j-y) == 1);
const clamp = (val, min, max) => Math.max(Math.min(val, max), min);

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

    const child = createElementWithStyles('p', ['text-xl', 'flex', 'justify-center', 'items-center']);
    child.id = `p${cellOrder(i, j)}`;
    child.contentEditable = false;
    child.style.width = `${Math.floor(5 + BASE_CELL_WH_SIZE/2)}px`;
    child.style.height = `${Math.floor(5 +BASE_CELL_WH_SIZE/2)}px`;
    cell.appendChild(child);
    return cell;
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
    cellRegion = Array.from({length: m*n + 1}, (_, i) => 0);

    grid.replaceChildren();
    grid.style['grid-template-columns'] = `repeat(${n}, 1fr)`;
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            grid.appendChild(createCell(i, j));
        
    initializeCellEvents();
}

const getCurrentGridData = async () => {
    const hint = [], region = [];
    let lastRegionNumber = 0;

    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            lastRegionNumber = Math.max(lastRegionNumber, cellRegion[cellOrder(i, j)]);
    
    const regionSize = Array.from({length: lastRegionNumber + 1}, (_, i) => 0);

    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            regionSize[cellRegion[cellOrder(i, j)]]++;

    for (let i = 1; i <= m; i++) {
        const currentRegion = [], currentHint = [];
        for (let j = 1; j <= n; j++) {
            const cellElement = document.querySelector(`#c${cellOrder(i, j)}`).querySelector('p');
            if (cellElement && parseInt(cellElement.innerHTML) > regionSize[cellRegion[cellOrder(i, j)]])
                cellElement.innerHTML = '', await delay(50);
            currentHint.push(parseInt(cellElement.innerHTML) || 0);
            currentRegion.push(cellRegion[cellOrder(i, j)]);
        }
        hint.push(currentHint);
        region.push(currentRegion);
    }
    return {m, n, hint, region};
}

const initializeModal = () => {
    const toggleModal = () => {
        const body = document.querySelector('body'), modal = document.querySelector(".modal");
        modal.classList.toggle('opacity-0');
        modal.classList.toggle('pointer-events-none');
        body.classList.toggle('modal-active');
    }

    document.querySelector('#modalButton').addEventListener('click', toggleModal);
    document.querySelector('#modalOverlay').addEventListener('click', toggleModal);
    document.querySelector('#closeModal').addEventListener('click', toggleModal);
}

const initializeCellEvents = () => {
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

const showToast = (message) => {
    const toast = document.querySelector('#toast');
    toast.innerHTML = message;
    
    setTimeout(() => {
        toast.innerHTML = '';
    }, 3000);
}

const initializeSelectDropdown = () => {
    const selectContainer = document.querySelector('#dropdown-container');
    const selectElement = createElementWithStyles('select', ['disabled:pointer-events-none', 'font-Nunito', 'text-md', 'rounded-tr-md', 'rounded-br-md', 'bg-slate-500', 'block', 'w-full', 'text-white', 'hover:bg-slate-700']);
    selectElement.id = 'select-element'

    const createOptionElement = (value, text) => {
        const option = createElementWithStyles('option', []);
        option.value = value;
        option.text = text;
        return option;
    };

    selectElement.appendChild(createOptionElement(-1, '...'));
    testcases.forEach((_element, index) => {
        const {label} = testcases[index];
        selectElement.appendChild(createOptionElement(index, `${label} (${label <= 6 ? 'Easy' : label <= '25' ? 'Medium' : label <= '110' ? 'Hard' : label <= '174' ? 'Very Hard' : 'Expert'})`));
    });

    selectContainer.appendChild(selectElement);
}

const DRAW_REGION_ID = 1, FILL_CELL_ID = 2, SOLVE_ID = 3, VALIDATE_ID = 4;
const buttonIds = [[DRAW_REGION_ID, 'drawRegionButton'], [FILL_CELL_ID, 'fillCellButton'], [SOLVE_ID, 'solveButton'], [VALIDATE_ID, 'validateButton']];
const playModeButtonIds = ['fillCellButton', 'validateButton', 'solveButton', 'clearCellsButton'];
const editModeButtonIds = ['drawRegionButton', 'fillCellButton', 'validateButton', 'solveButton'];
const disabledButtonStyles = ['bg-slate-900'];
const enabledButtonStyles = ['bg-slate-500'];
const initialButtonStyles = ['disabled:pointer-events-none', 'hover:shadow-lg', 'hover:scale-105', 'shadow-sm', 'font-Nunito', 'block', 'bg-slate-500', 'hover:bg-slate-700', 'text-white', 'w-fit', 'px-2', 'py-1', 'rounded-sm'];

const specialButtonIds = ['clearRegionsButton', 'clearCellsButton'];
const initialSpecialButtonStyles = ['disabled:text-white', 'hover:shadow-lg', 'hover:scale-105', 'disabled:pointer-events-none', 'shadow-sm', 'text-slate-600', 'font-Nunito', 'block', 'bg-slate-200', 'hover:bg-slate-300', 'w-fit', 'px-2', 'py-1', 'rounded-sm'];
const disabledSpecialButtonStyles = ['bg-slate-900'];
const enabledSpecialButtonStyles = ['bg-slate-200'];

const showPlayButtons = () => {
    playModeButtonIds.forEach((buttonId) => {
        deleteElementStyles(buttonId, ['hidden']);
    });
}

const hidePlayButtons = () => {
    playModeButtonIds.forEach((buttonId) => {
        addElementStyles(buttonId, ['hidden']);
    });
}

const showEditButtons = () => {
    [...editModeButtonIds, ...specialButtonIds].forEach((buttonId) => {
        deleteElementStyles(buttonId, ['hidden']);
    });
}

const hideEditButtons = () => {
    [...editModeButtonIds, ...specialButtonIds].forEach((buttonId) => {
        addElementStyles(buttonId, ['hidden']);
    });
}

const showPlayEditButtons = (playMode = true) => {
    const helperElement = document.querySelector('#mode-helper');
    if (playMode) {
        hideEditButtons();
        showPlayButtons();
        disableGridSizeInput();
        helperElement.innerHTML = 'you are currently in Play Mode, good luck!'
        return;
    }
    hidePlayButtons();
    showEditButtons();
    enableGridSizeInput();
    helperElement.innerHTML = 'you are currently in Creative Mode, enjoy customizing the puzzle!'
}

const initializeButtonStyles = () => {
    buttonIds.forEach(([, elementId]) => {
        addElementStyles(elementId, initialButtonStyles);
    });
}

const initializeSpecialButtonStyles = () => {
    specialButtonIds.forEach((elementId) => {
        addElementStyles(elementId, initialSpecialButtonStyles);
    });
}

const deleteElementStyles = (elementId, [...styles]) => {
    const element = document.querySelector(`#${elementId}`);
    styles.forEach((style) => {
        element.classList.remove(style);
    });
}

const addElementStyles = (elementId, [...styles]) => {
    const element = document.querySelector(`#${elementId}`);
    styles.forEach((style) => {
        element.classList.add(style);
    });
}

const disableButton = (elementId) => {
    deleteElementStyles(elementId, enabledButtonStyles);
    addElementStyles(elementId, disabledButtonStyles);
    document.querySelector(`#${elementId}`).disabled = true;
}

const enableButton = (elementId) => {
    deleteElementStyles(elementId, disabledButtonStyles);
    addElementStyles(elementId, enabledButtonStyles);
    document.querySelector(`#${elementId}`).disabled = false;
}

const disableSpecialButton = (elementId) => {
    deleteElementStyles(elementId, enabledSpecialButtonStyles);
    addElementStyles(elementId, disabledSpecialButtonStyles);
    document.querySelector(`#${elementId}`).disabled = true;
}

const enableSpecialButton = (elementId) => {
    deleteElementStyles(elementId, disabledSpecialButtonStyles);
    addElementStyles(elementId, enabledSpecialButtonStyles);
    document.querySelector(`#${elementId}`).disabled = false;
}

const disableGridSizeInput = () => {
    document.querySelector('#m').disabled = true;
    document.querySelector('#n').disabled = true;
}

const enableGridSizeInput = () => {
    if (!document.querySelector('#switchModeButton').innerHTML.includes('Play')) return;
    document.querySelector('#m').disabled = false;
    document.querySelector('#n').disabled = false;
}

const enableDropdownSelect = () => {
    const selectElement = document.querySelector('#dropdown-container').querySelector('select');
    selectElement.disabled = false;
    deleteElementStyles(selectElement.id, ['bg-slate-900']);
    addElementStyles(selectElement.id, ['bg-slate-500']);
}

const disableDropdownSelect = () => {
    const selectElement = document.querySelector('#dropdown-container').querySelector('select');
    selectElement.disabled = true;
    deleteElementStyles(selectElement.id, ['bg-slate-500']);
    addElementStyles(selectElement.id, ['bg-slate-900']);
}

const disableSwitchModeButton = () => {
    const buttonElement = document.querySelector('#switchModeButton');
    buttonElement.disabled = true;
    deleteElementStyles(buttonElement.id, ['bg-slate-500']);
    addElementStyles(buttonElement.id, ['bg-slate-900']);
}

const enableSwitchModeButton = () => {
    const buttonElement = document.querySelector('#switchModeButton');
    buttonElement.disabled = false;
    deleteElementStyles(buttonElement.id, ['bg-slate-900']);
    addElementStyles(buttonElement.id, ['bg-slate-500']);
}

const disableAllWidget = () => {
    buttonIds.forEach(([, elementId]) => {
        disableButton(elementId);
    });
    specialButtonIds.forEach((elementId) => {
        disableSpecialButton(elementId);
    });
    document.querySelector('#promise-loading').classList.remove('hidden');
    disableGridSizeInput();
    disableDropdownSelect();
    disableSwitchModeButton();
}

const enableAllWidget = () => {
    buttonIds.forEach(([, elementId]) => {
        enableButton(elementId);
    });
    specialButtonIds.forEach((elementId) => {
        enableSpecialButton(elementId);
    });
    document.querySelector('#promise-loading').classList.add('hidden');
    enableGridSizeInput();
    enableDropdownSelect();
    enableSwitchModeButton();
}

const delay = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const initializeEvents = () => {

    const changeOrRevertAction = (selectedActionId) => {

        const updateNavigationText = (actionId) => {
            const naviContainer = document.querySelector('#navi-container');
            switch (actionId) {
                case DRAW_REGION_ID:
                    naviContainer.innerHTML = 'click any cell to draw a region. you may also click and hold, then drag. double-click the draw region button to start drawing a new region.';
                    break;
                case FILL_CELL_ID:
                    naviContainer.innerHTML = 'click any cell, and type-in a number to fill the cell.';
                    break;
                default:
                    naviContainer.innerHTML = '';
                    break;
            }
        }

        const updateButtonHelperText = (actionId) => {
            const buttonHelper = document.querySelector('#button-helper');
            switch (actionId) {
                case DRAW_REGION_ID:
                    buttonHelper.innerHTML = 're-click the Draw Region button to finish!';
                    break;
                case FILL_CELL_ID:
                    buttonHelper.innerHTML = 're-click the Fill Cell button to finish!';
                    break;
                default:
                    buttonHelper.innerHTML = '';
                    break;
            }
        }

        action.id = (action.id === -1 ? selectedActionId : -1);

        buttonIds.forEach(([actionId, elementId]) => {
            if (actionId === selectedActionId)
                return;
            if (action.id === selectedActionId)
                disableButton(elementId);
            else
                enableButton(elementId);
        });

        specialButtonIds.forEach((elementId) => {
            if (action.id === selectedActionId)
                disableSpecialButton(elementId);
            else
                enableSpecialButton(elementId);
        });

        if (action.id === selectedActionId)
            disableGridSizeInput(), disableButton('switchModeButton'), disableDropdownSelect();
        else
            enableGridSizeInput(), enableButton('switchModeButton'), enableDropdownSelect();

        updateButtonHelperText(action.id);
        updateNavigationText(action.id);
    }

    const initializeSwitchModeButton = () => {
        const switchModeButton = document.querySelector('#switchModeButton');
        switchModeButton.addEventListener('click', () => {
            const modeNow = switchModeButton.innerHTML.includes('Play') ? 'Enter Creative Mode' : 'Enter Play Mode';
            switchModeButton.innerHTML = modeNow;
            showPlayEditButtons(!switchModeButton.innerHTML.includes('Play'));
        });
    }

    const initializeGridSizeInputEvent = () => {
        document.querySelector('#m').addEventListener('change', (event) => {
            event.target.value = clamp(parseInt(event.target.value) || 1, 1, MAX_ROW);
            m = parseInt(event.target.value);
            document.querySelector('#dropdown-container').querySelector('select').value = -1;
            initializeEmptyGrid();
        });
        document.querySelector('#n').addEventListener('change', (event) => {
            event.target.value = clamp(parseInt(event.target.value) || 1, 1, MAX_ROW);
            n = parseInt(event.target.value);
            document.querySelector('#dropdown-container').querySelector('select').value = -1;
            initializeEmptyGrid();
        });
    }

    const initializeDrawRegionEvent = () => {
        document.querySelector('#drawRegionButton').addEventListener('click', () => {
            changeOrRevertAction(DRAW_REGION_ID);
            if (action.id != -1)
                action.regionCounter++;
        });
    }

    const initializeFillCellEvent = () => {
        document.querySelector('#fillCellButton').addEventListener('click', () => {
            changeOrRevertAction(FILL_CELL_ID);
            document.querySelectorAll(".cell").forEach((element) => {
                if (!document.querySelector('#switchModeButton').innerHTML.includes('Play')) {
                    if (element.querySelector('p').innerHTML && !element.classList.contains('autocompleted'))
                        return;
                } else {
                    addElementStyles(element.id, ['locked-cell', 'font-bold', 'text-red-500']);
                }

                if (action.id == -1 && !element.querySelector('p').innerHTML)
                    deleteElementStyles(element.id, ['locked-cell', 'font-bold', 'text-red-500']);
                element.querySelector('p').contentEditable = (action.id !== -1);
                element.style.userSelect = (action.id !== -1 ? 'auto' : 'none');
            });
        });
    }

    const initializeClearButtonEvents = () => {
        document.querySelector('#clearCellsButton').addEventListener('click', () => {
            document.querySelectorAll('.cell').forEach((element) => {
                if (!document.querySelector('#switchModeButton').innerHTML.includes('Play') && element.classList.contains('locked-cell'))
                    return;
                element.querySelector('p').innerHTML = '';
                deleteElementStyles(element.id, ['locked-cell', 'font-bold', 'text-red-500']);
            })
        });
        document.querySelector('#clearRegionsButton').addEventListener('click', () => {
            for (let i = 1; i <= m; i++)
                for (let j = 1; j <= n; j++)
                    cellRegion[cellOrder(i, j)] = 0, purgeCellRegion(i, j);
        });
    }

    const initializeLevelDropdownEvent = () => {
        document.querySelector('#dropdown-container').querySelector('select').addEventListener('change', (element) => {
            if (element.target.value < 0) {
                m = 5, n = 5;
                initializeEmptyGrid();
                return;
            }
            const {M, N, hint, region} = testcases[element.target.value];
            m = M, n = N;
            document.querySelector('#m').value = m, document.querySelector('#n').value = n;
            initializeEmptyGrid();
            let maxRegion = 0;
            for (let i = 1; i <= m; i++)
                for (let j = 1; j <= n; j++) {
                    document.querySelector(`#p${cellOrder(i, j)}`).innerHTML = hint[i-1][j-1] || '';
                    applyRegionChanges([i, j], {regionCounter: region[i-1][j-1]}), maxRegion = Math.max(maxRegion, region[i-1][j-1]);
                    if (hint[i-1][j-1])
                        addElementStyles(`c${cellOrder(i, j)}`, ['locked-cell', 'font-bold', 'text-red-500']);
                }
            action.regionCounter = maxRegion + 1;
        });
    }

    const initializeCursorDraggingEvent = () => {
        document.body.addEventListener("mousedown", () => {
            action.isCursorDragging = true;
        });
    
        document.body.addEventListener("mouseup", () => {
            action.isCursorDragging = false;
        });
    }

    const initializeSolveButtonEvents = () => {
        const csrfToken = document.querySelector('#csrf-token-holder').querySelector('input').value;

        const request = async (endpoint) => {
            return fetch(endpoint, 
                {method: 'POST', 
                headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrfToken},
                body: JSON.stringify(await getCurrentGridData())});
        }

        const handleResponse = async(data) => {
            const {solve_status, hint, message} = data;
            if (solve_status == 'unsolvable' || solve_status == 'timeout' || solve_status == 'unsolved' || solve_status == 'validation_success') {
                showToast(message);
                return;
            }
            for (let i = 1; i <= m; i++)
                for (let j = 1; j <= n; j++) {
                    const cellElement = document.querySelector(`#c${cellOrder(i, j)}`);
                    cellElement.querySelector('p').innerHTML = `${hint[i-1][j-1]}`;
                    if (!cellElement.classList.contains('text-red-500'))
                        cellElement.classList.add('autocompleted');
                    await delay(10);
                }
        }

        document.querySelector('#solveButton').addEventListener('click', async () => {
            disableAllWidget();
            await request('/solve')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Request failed with status: ' + response.status);
                }
                return response.json();
            }).then(async data => {
                await handleResponse(data);
            }).finally(() => {
                enableAllWidget();
            });
        });
    
        document.querySelector('#validateButton').addEventListener('click', async () => {
            disableAllWidget();
            await request('/validate')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Request failed with status: ' + response.status);
                }
                return response.json();
            }).then(async data => {
                await handleResponse(data);
            }).finally(() => {
                enableAllWidget();
            });
        });
    }

    initializeGridSizeInputEvent();
    initializeDrawRegionEvent();
    initializeLevelDropdownEvent();
    initializeSwitchModeButton();
    initializeFillCellEvent();
    initializeClearButtonEvents();
    initializeCursorDraggingEvent();
    initializeSolveButtonEvents();
}

const testcases = [{"M":3,"N":3,"hint":[[0,0,0],[0,5,0],[0,0,0]],"region":[[0,0,0],[0,0,0],[0,0,0]],"label":1},{"M":3,"N":3,"hint":[[0,0,0],[0,0,3],[0,2,0]],"region":[[1,1,1],[1,1,1],[2,2,2]],"label":2},{"M":3,"N":3,"hint":[[0,0,0],[0,0,2],[0,0,0]],"region":[[1,1,2],[1,1,2],[1,3,2]],"label":3},{"M":4,"N":4,"hint":[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],"region":[[1,1,2,2],[1,1,2,2],[3,3,4,4],[3,3,4,4]],"label":4},{"M":4,"N":4,"hint":[[0,0,0,0],[0,0,4,0],[0,0,0,0],[0,2,0,0]],"region":[[1,1,2,2],[1,1,2,2],[3,2,2,4],[3,3,3,4]],"label":5},{"M":5,"N":5,"hint":[[0,0,0,0,2],[2,0,2,0,5],[0,0,5,6,0],[2,0,1,0,0],[0,0,0,0,0]],"region":[[1,1,1,2,2],[3,3,1,1,1],[3,3,4,4,4],[4,4,4,5,5],[5,5,5,5,5]],"label":6},{"M":6,"N":6,"hint":[[0,0,1,0,3,4],[4,0,0,0,0,2],[0,2,0,0,4,0],[5,0,3,0,0,2],[0,0,0,0,0,3],[1,0,3,2,0,0]],"region":[[1,1,1,1,7,7],[2,2,2,2,7,7],[2,4,4,4,4,4],[3,3,6,6,8,8],[3,3,6,6,5,8],[3,5,5,5,5,8]],"label":7},{"M":6,"N":6,"hint":[[1,0,4,1,0,2],[0,3,0,0,0,5],[1,0,0,3,0,0],[0,5,0,0,0,2],[4,0,0,5,0,0],[0,0,0,1,4,0]],"region":[[1,1,5,5,5,5],[1,1,1,6,6,7],[2,2,6,6,7,7],[2,2,4,4,7,7],[2,4,4,4,8,8],[3,3,3,3,8,8]],"label":8},{"M":6,"N":6,"hint":[[0,1,0,0,0,1],[3,0,4,0,5,0],[0,2,0,0,0,2],[1,0,0,0,0,0],[4,0,1,2,0,2],[3,2,0,3,0,3]],"region":[[1,1,4,4,7,7],[1,1,5,5,5,7],[1,3,3,5,5,7],[2,3,3,3,8,7],[2,2,6,6,8,8],[2,2,6,6,8,8]],"label":9},{"M":6,"N":6,"hint":[[3,1,0,4,2,1],[2,0,0,0,0,5],[0,0,0,4,0,0],[0,0,0,0,3,0],[0,0,0,2,0,1],[4,0,0,0,5,2]],"region":[[1,1,1,7,7,7],[2,2,2,2,7,7],[3,3,6,6,6,6],[3,3,6,8,9,9],[4,4,4,4,9,9],[5,5,5,5,5,9]],"label":10},{"M":6,"N":6,"hint":[[0,3,0,2,0,3],[4,0,4,0,1,0],[0,0,0,5,0,4],[3,5,0,0,0,0],[0,0,0,2,0,0],[5,2,0,0,4,0]],"region":[[1,1,1,5,5,5],[2,4,1,6,5,5],[2,4,4,6,6,6],[2,2,4,7,7,6],[3,2,4,7,7,8],[3,3,3,3,7,8]],"label":11},{"M":6,"N":6,"hint":[[0,0,3,0,0,0],[3,5,0,1,4,0],[0,0,2,3,0,0],[0,0,0,0,0,1],[3,0,0,0,0,0],[2,0,4,1,0,1]],"region":[[1,4,4,4,6,6],[1,4,4,6,6,9],[1,1,5,5,7,7],[2,5,5,5,7,7],[2,2,2,3,8,8],[3,3,3,3,8,8]],"label":12},{"M":6,"N":6,"hint":[[0,3,0,0,1,3],[0,2,0,2,0,2],[4,0,0,0,0,3],[2,0,0,0,0,4],[0,0,3,0,5,0],[5,2,0,0,0,1]],"region":[[1,1,1,1,7,7],[2,1,5,5,7,7],[2,4,5,5,8,8],[2,4,4,4,8,8],[2,3,3,4,8,6],[3,3,3,6,6,6]],"label":13},{"M":6,"N":6,"hint":[[0,0,0,0,0,3],[0,0,1,0,1,4],[3,0,0,3,0,0],[1,0,0,0,0,5],[0,3,0,0,0,0],[4,0,4,3,0,4]],"region":[[1,1,1,1,7,7],[2,2,5,5,7,7],[2,2,5,5,6,6],[2,4,4,6,6,8],[3,3,4,6,8,8],[3,3,4,4,8,8]],"label":14},{"M":6,"N":6,"hint":[[1,2,1,0,0,1],[3,0,0,2,5,2],[0,0,0,0,0,0],[1,3,0,0,0,3],[0,0,4,0,5,0],[5,0,0,0,0,2]],"region":[[1,1,5,5,5,9],[1,4,4,4,5,5],[1,2,4,4,7,8],[2,2,6,6,7,8],[2,3,3,6,8,8],[3,3,3,6,6,8]],"label":15},{"M":6,"N":6,"hint":[[1,3,0,0,0,3],[0,0,2,0,1,0],[0,1,0,0,0,0],[0,0,3,1,0,1],[0,0,4,0,5,0],[0,2,0,1,0,4]],"region":[[1,1,5,5,8,8],[1,4,4,5,8,8],[1,2,4,5,5,7],[2,2,4,4,7,7],[2,3,3,7,7,6],[3,3,6,6,6,6]],"label":16},{"M":6,"N":6,"hint":[[0,1,0,0,2,0],[0,0,0,0,0,1],[1,0,0,4,0,4],[0,3,0,0,1,0],[0,0,1,4,0,4],[1,0,2,0,5,0]],"region":[[1,1,1,1,7,7],[2,4,4,1,7,7],[2,2,4,4,4,8],[3,2,5,5,8,8],[3,5,5,5,8,6],[3,3,6,6,6,6]],"label":17},{"M":6,"N":6,"hint":[[0,0,1,0,0,4],[0,4,0,2,0,5],[3,0,1,5,0,2],[0,4,0,0,0,0],[0,0,0,4,0,2],[0,0,0,0,0,0]],"region":[[1,1,5,5,7,7],[1,1,3,5,5,7],[2,2,3,6,8,7],[2,3,3,6,8,7],[2,3,4,6,8,8],[2,4,4,6,6,8]],"label":18},{"M":6,"N":6,"hint":[[1,0,2,1,0,2],[0,0,0,0,4,5],[0,0,4,0,0,0],[0,3,0,5,0,2],[0,4,0,0,0,0],[0,0,0,4,0,3]],"region":[[1,1,1,7,7,7],[1,2,5,7,7,8],[2,2,5,5,5,8],[2,2,4,4,8,8],[3,4,4,4,8,6],[3,3,6,6,6,6]],"label":19},{"M":7,"N":7,"hint":[[3,0,0,3,1,2,0],[0,6,0,4,0,0,3],[2,0,0,0,3,2,0],[0,5,0,0,0,0,0],[3,0,4,0,0,4,0],[0,0,1,5,1,0,1],[1,0,0,2,0,3,4]],"region":[[1,1,6,6,6,11,11],[1,1,7,5,5,12,11],[1,1,5,5,8,12,12],[2,5,5,8,8,9,12],[2,2,8,8,9,9,10],[3,3,3,9,9,9,10],[4,3,3,10,10,10,10]],"label":20},{"M":7,"N":7,"hint":[[0,0,1,0,4,0,1],[0,0,0,0,0,3,0],[2,0,4,0,6,0,1],[0,5,0,2,0,0,3],[1,0,0,0,0,0,2],[2,0,0,0,4,5,0],[6,4,0,1,3,0,1]],"region":[[1,1,6,6,7,7,7],[1,1,6,6,7,9,9],[2,2,6,7,7,9,9],[2,5,5,5,5,9,10],[3,3,3,5,5,10,10],[3,4,4,8,8,10,10],[4,4,4,4,8,8,8]],"label":21},{"M":6,"N":6,"hint":[[3,0,3,0,2,0],[0,0,0,0,0,0],[3,4,0,4,0,4],[0,0,0,1,0,0],[0,0,3,0,5,0],[0,0,2,0,2,0]],"region":[[1,1,4,4,4,4],[1,1,4,5,5,7],[2,2,5,5,7,7],[2,2,2,7,7,8],[3,3,6,6,6,8],[3,3,6,6,8,8]],"label":22},{"M":6,"N":6,"hint":[[0,0,1,0,0,4],[0,4,0,0,1,0],[2,0,1,0,0,0],[0,0,0,2,1,0],[0,0,0,0,0,5],[4,3,4,0,0,0]],"region":[[1,4,4,4,4,8],[1,1,1,1,8,8],[2,2,5,5,5,8],[2,2,5,5,7,7],[3,3,3,7,7,6],[3,3,6,6,6,6]],"label":23},{"M":6,"N":6,"hint":[[0,0,2,0,4,2],[3,0,0,0,0,0],[0,0,0,0,0,2],[0,0,0,4,0,5],[4,0,0,3,0,4],[1,5,1,0,1,0]],"region":[[1,1,5,5,5,9],[1,3,3,5,6,9],[1,3,3,6,6,8],[1,3,6,6,7,8],[2,2,2,4,4,8],[2,4,4,4,8,8]],"label":24},{"M":7,"N":7,"hint":[[2,3,0,6,0,0,1],[1,0,2,0,2,6,0],[0,0,0,5,0,0,0],[5,0,0,0,0,4,0],[0,0,0,1,0,6,1],[0,0,2,0,0,4,0],[0,5,0,1,3,0,2]],"region":[[1,4,4,6,6,10,10],[1,4,4,6,6,10,10],[1,4,6,6,8,10,11],[2,2,2,2,8,10,11],[2,3,7,7,8,9,11],[3,3,7,5,5,9,9],[3,5,5,5,9,9,9]],"label":25},{"M":6,"N":6,"hint":[[2,0,0,1,0,3],[0,5,0,5,0,1],[4,0,0,0,0,0],[3,5,0,0,0,2],[0,2,0,0,0,0],[1,0,0,2,0,1]],"region":[[1,1,3,3,3,7],[1,3,3,5,7,7],[1,2,5,5,8,8],[2,2,5,5,8,8],[2,4,4,4,8,6],[2,4,6,6,6,6]],"label":26},{"M":6,"N":6,"hint":[[1,0,1,5,0,0],[0,0,0,0,3,2],[0,0,0,1,0,0],[0,0,2,0,0,3],[5,0,0,0,5,0],[0,2,0,2,0,4]],"region":[[1,4,4,4,4,9],[2,4,5,5,5,9],[2,2,5,5,8,8],[3,2,6,6,8,8],[3,3,6,6,8,7],[3,3,7,7,7,7]],"label":27},{"M":7,"N":7,"hint":[[1,0,0,3,0,2,4],[0,2,0,0,1,0,3],[6,0,3,0,0,6,0],[0,0,0,4,1,0,1],[2,0,3,5,0,0,0],[0,0,0,0,0,0,6],[3,0,4,3,4,0,0]],"region":[[1,1,6,6,6,6,10],[1,1,7,7,7,7,10],[1,1,7,2,8,7,10],[2,2,2,2,8,8,10],[3,3,3,3,3,8,10],[4,5,5,5,3,9,10],[4,4,4,5,5,9,9]],"label":28},{"M":6,"N":6,"hint":[[1,0,0,5,1,2],[3,0,0,2,0,4],[0,0,1,0,0,0],[0,5,0,0,0,0],[2,0,1,0,0,0],[0,3,0,5,0,1]],"region":[[1,5,5,5,7,7],[1,1,5,5,7,9],[2,2,6,7,7,9],[3,2,2,2,8,9],[3,3,3,8,8,9],[4,4,4,8,8,9]],"label":29},{"M":6,"N":6,"hint":[[0,0,0,1,0,1],[0,0,0,0,2,0],[0,0,3,4,0,3],[1,0,0,0,0,0],[0,2,0,4,0,0],[1,0,3,0,3,0]],"region":[[1,1,1,1,7,7],[2,2,2,1,7,7],[3,3,2,6,6,6],[4,3,3,3,8,6],[4,4,4,4,8,8],[5,5,5,5,8,8]],"label":30},{"M":6,"N":6,"hint":[[2,0,2,0,5,0],[0,4,0,0,0,0],[3,0,0,0,2,0],[0,0,0,5,0,0],[0,0,3,0,0,0],[4,0,0,0,3,5]],"region":[[1,4,4,4,4,6],[1,4,2,6,6,6],[1,2,2,5,7,8],[2,2,5,5,7,8],[3,5,5,7,7,8],[3,3,3,3,8,8]],"label":31},{"M":6,"N":6,"hint":[[2,0,0,0,3,4],[0,0,3,0,0,1],[4,0,0,0,3,0],[2,0,0,0,0,1],[0,0,0,0,0,0],[0,0,3,0,0,4]],"region":[[1,1,5,6,8,8],[1,1,5,5,9,8],[1,3,3,5,9,8],[2,3,3,3,9,9],[2,4,4,7,7,9],[2,4,4,4,7,7]],"label":32},{"M":6,"N":6,"hint":[[2,0,2,0,0,4],[0,3,0,0,2,0],[1,0,2,0,0,0],[0,0,0,5,0,0],[0,0,3,0,0,1],[4,0,0,2,0,0]],"region":[[1,1,6,6,6,6],[1,3,3,3,3,6],[1,3,4,4,7,8],[1,4,4,4,7,8],[2,2,2,5,5,8],[2,5,5,5,8,8]],"label":33},{"M":6,"N":6,"hint":[[2,0,1,0,2,5],[0,0,0,3,0,1],[5,0,0,5,0,0],[0,2,0,0,1,0],[0,0,0,0,0,0],[4,2,5,4,0,1]],"region":[[1,4,4,4,4,5],[1,4,5,5,5,5],[2,2,2,6,6,7],[2,2,6,6,7,7],[3,3,6,7,7,8],[3,3,3,8,8,8]],"label":34},{"M":7,"N":7,"hint":[[2,1,0,2,0,3,5],[4,0,4,0,0,0,0],[1,0,0,0,1,0,3],[0,0,0,0,0,0,0],[1,0,0,2,0,5,0],[0,3,0,5,0,0,4],[0,0,2,0,0,1,0]],"region":[[1,1,5,5,5,5,9],[1,1,4,4,7,5,9],[2,4,4,4,7,9,9],[2,2,6,7,7,9,10],[3,2,6,7,8,10,10],[3,3,6,8,8,10,10],[3,3,6,8,8,11,11]],"label":35},{"M":7,"N":7,"hint":[[3,0,1,5,0,0,0],[0,0,0,4,3,0,0],[0,0,2,0,0,1,3],[1,0,0,4,0,0,0],[0,0,0,0,0,0,3],[6,5,0,5,0,6,0],[2,0,4,0,0,0,1]],"region":[[1,1,1,1,1,8,8],[2,2,2,4,4,8,8],[2,4,4,4,7,9,9],[2,4,5,5,7,9,10],[3,3,5,5,7,9,10],[3,3,6,7,7,10,10],[3,3,6,6,6,10,10]],"label":36},{"M":8,"N":8,"hint":[[0,6,0,1,0,3,0,0],[5,0,2,0,5,0,4,0],[3,0,0,0,3,0,0,3],[0,1,5,0,0,0,6,0],[4,0,0,1,4,3,0,5],[0,6,0,0,2,0,4,0],[2,0,0,5,0,0,0,6],[0,6,4,0,0,1,0,3]],"region":[[1,1,6,7,7,7,13,13],[1,1,6,6,8,11,13,13],[1,1,3,6,8,11,11,11],[2,2,3,8,8,12,11,11],[2,2,3,8,8,12,12,14],[3,3,3,9,10,10,12,14],[4,4,4,9,9,10,14,14],[5,4,4,4,9,9,14,14]],"label":37},{"M":8,"N":8,"hint":[[1,0,3,0,0,5,3,0],[5,0,0,4,0,2,0,0],[0,0,6,0,1,0,1,0],[4,0,0,5,0,5,0,3],[3,6,0,1,0,0,4,0],[2,0,0,0,3,0,0,3],[0,6,0,1,0,0,5,0],[1,0,3,0,3,0,0,1]],"region":[[1,1,2,2,7,11,11,11],[2,2,2,7,7,11,11,13],[3,3,3,7,8,8,11,13],[3,3,5,5,8,8,8,13],[3,5,5,5,5,9,9,13],[4,6,6,6,9,9,10,12],[4,6,6,6,10,10,10,12],[4,4,4,4,10,10,12,12]],"label":38},{"M":7,"N":7,"hint":[[1,0,2,0,5,0,4],[2,0,0,3,0,3,0],[0,0,0,0,1,0,2],[0,0,0,5,0,3,0],[3,0,0,0,0,0,4],[0,4,0,1,0,0,0],[0,0,2,4,0,2,3]],"region":[[1,2,7,7,9,9,9],[2,2,7,7,7,9,9],[2,4,4,4,10,10,11],[3,5,5,5,10,10,11],[3,6,6,5,10,10,11],[3,6,6,5,5,8,11],[3,6,6,8,8,8,11]],"label":39},{"M":7,"N":7,"hint":[[4,0,6,0,4,3,4],[0,2,1,0,1,0,0],[3,0,0,0,0,0,5],[0,0,0,0,2,0,2],[0,6,0,4,0,0,0],[0,0,0,0,1,0,5],[1,0,3,5,4,0,6]],"region":[[1,1,5,5,5,5,10],[1,1,5,7,7,7,10],[2,2,5,4,8,8,10],[2,2,4,4,8,8,10],[3,4,4,6,6,8,10],[3,4,6,6,9,9,9],[3,3,3,3,9,9,9]],"label":40},{"M":8,"N":8,"hint":[[0,0,1,0,4,0,2,3],[3,0,4,0,2,0,0,0],[0,2,0,0,0,5,1,0],[3,0,6,0,4,0,0,5],[0,1,5,1,0,0,2,0],[6,0,2,0,0,6,0,5],[4,0,4,0,4,0,2,0],[1,0,0,3,0,1,0,1]],"region":[[1,1,1,9,9,9,9,13],[1,1,5,5,5,5,13,13],[2,2,6,6,5,5,13,13],[3,3,3,6,6,12,12,12],[3,3,3,7,11,11,12,12],[4,4,7,7,11,11,11,14],[4,4,8,10,11,8,14,14],[4,4,8,8,8,8,14,14]],"label":41},{"M":7,"N":7,"hint":[[1,0,0,0,0,0,2],[0,3,0,0,0,4,0],[0,1,5,1,0,0,0],[0,0,0,2,4,5,0],[0,2,1,0,0,0,3],[0,4,0,4,2,0,2],[0,0,2,0,1,0,0]],"region":[[1,2,2,9,9,11,11],[2,2,7,7,9,9,11],[3,3,7,7,7,9,12],[3,6,6,6,6,12,12],[4,4,6,6,10,10,12],[4,5,5,10,10,8,12],[5,5,8,8,8,8,12]],"label":42},{"M":6,"N":6,"hint":[[1,0,0,0,0,2],[0,0,4,0,3,5],[3,0,0,0,0,0],[0,0,0,0,0,0],[0,0,3,0,0,4],[3,0,0,0,3,1]],"region":[[1,4,4,4,4,7],[1,5,5,5,7,7],[1,1,5,5,7,7],[2,2,6,6,6,8],[3,2,2,6,6,8],[3,3,3,3,8,8]],"label":43},{"M":7,"N":7,"hint":[[0,0,0,1,0,0,2],[6,0,2,0,0,1,0],[0,0,0,5,4,0,2],[0,4,0,0,0,6,0],[1,0,2,1,0,0,3],[0,5,0,0,6,0,2],[0,0,2,0,4,0,4]],"region":[[1,1,7,7,7,9,9],[1,1,1,7,7,9,10],[1,4,4,4,4,9,10],[2,5,5,5,4,4,10],[2,2,5,5,5,10,10],[3,2,2,8,8,8,8],[3,6,6,6,6,8,8]],"label":44},{"M":6,"N":6,"hint":[[0,0,0,0,4,0],[4,0,0,0,0,0],[0,2,0,0,0,0],[0,0,0,2,0,0],[0,0,0,0,4,0],[5,0,0,2,0,0]],"region":[[1,2,2,2,2,3],[1,1,2,4,3,3],[1,5,4,4,4,3],[5,5,5,4,6,3],[7,5,8,8,9,9],[8,8,8,9,9,9]],"label":45},{"M":7,"N":7,"hint":[[2,0,0,0,0,0,1],[0,4,0,5,0,4,0],[3,6,0,4,0,0,1],[0,0,0,0,0,0,0],[5,6,0,0,0,5,3],[0,0,0,2,0,0,1],[1,2,1,3,0,3,2]],"region":[[1,1,1,7,7,7,7],[2,4,4,4,4,10,10],[2,4,4,8,8,10,10],[2,5,5,8,8,11,11],[2,2,5,6,8,9,11],[3,2,6,6,9,9,11],[3,3,6,6,6,9,9]],"label":46},{"M":7,"N":7,"hint":[[4,0,2,3,2,0,5],[0,0,0,0,5,1,0],[5,0,0,2,0,0,0],[6,0,1,0,4,0,1],[0,2,0,0,1,0,3],[1,5,0,0,0,0,0],[2,0,4,5,0,6,0]],"region":[[1,1,4,4,7,7,10],[2,1,5,4,8,7,10],[2,1,5,5,8,8,10],[2,1,5,5,8,8,10],[2,3,6,6,8,9,10],[2,3,3,6,9,9,9],[2,3,3,6,6,9,9]],"label":47},{"M":7,"N":7,"hint":[[0,0,0,2,0,4,3],[5,0,4,0,1,0,0],[0,0,1,2,0,6,0],[2,0,0,0,3,0,1],[0,0,0,0,0,4,0],[5,1,0,4,6,0,1],[0,0,0,0,0,5,4]],"region":[[1,1,6,6,6,6,10],[1,1,1,1,7,10,10],[2,5,5,5,7,11,11],[3,3,7,7,7,11,11],[3,3,7,8,8,11,11],[4,3,8,8,9,9,9],[4,4,4,4,9,9,9]],"label":48},{"M":8,"N":8,"hint":[[0,0,2,0,0,0,5,1],[0,3,0,4,0,0,0,4],[2,5,0,3,5,0,6,0],[1,0,1,0,0,0,1,3],[4,0,0,3,0,3,0,0],[0,3,2,0,2,0,1,5],[2,0,1,0,0,3,0,6],[5,3,6,2,1,0,1,2]],"region":[[1,4,4,8,8,8,8,8],[2,2,4,4,10,10,13,13],[2,2,2,4,4,10,13,13],[2,3,7,7,7,10,13,13],[3,3,7,7,11,11,11,11],[3,5,5,7,9,9,9,11],[3,6,5,9,9,12,12,11],[3,6,6,6,6,6,12,12]],"label":49},{"M":8,"N":8,"hint":[[4,1,0,2,1,0,0,3],[5,2,5,0,6,0,0,0],[0,6,1,0,0,0,0,1],[1,0,2,0,5,0,6,4],[4,0,0,0,0,0,1,0],[0,3,0,3,0,0,0,3],[0,5,0,6,0,0,5,0],[2,0,2,0,3,1,0,2]],"region":[[1,1,1,1,8,8,8,8],[1,2,2,1,9,9,9,9],[2,2,4,4,9,11,11,9],[2,4,4,4,10,10,10,13],[2,3,6,4,10,10,12,13],[3,3,6,6,6,10,12,13],[3,3,7,7,7,7,12,13],[3,5,5,5,7,7,12,12]],"label":50},{"M":6,"N":6,"hint":[[0,5,0,0,0,5],[0,0,0,0,2,0],[0,4,0,0,0,0],[0,0,0,0,1,0],[0,5,0,0,0,0],[0,0,0,0,1,0]],"region":[[3,3,2,2,1,1],[3,5,2,4,1,1],[3,6,6,4,4,1],[3,7,6,6,4,4],[9,7,7,6,8,8],[9,7,7,8,8,8]],"label":51},{"M":7,"N":7,"hint":[[2,0,0,0,3,0,1],[0,0,0,0,0,5,0],[2,0,0,3,2,0,1],[5,0,1,6,0,0,0],[0,4,0,0,0,4,0],[1,0,0,0,6,0,3],[0,4,0,2,0,4,1]],"region":[[1,4,4,7,7,7,7],[1,1,4,4,9,9,7],[2,5,5,5,5,9,9],[2,2,5,5,10,9,9],[2,2,6,8,8,8,8],[2,6,6,8,8,11,11],[3,3,3,3,3,11,11]],"label":52},{"M":6,"N":6,"hint":[[0,0,0,2,0,3],[0,0,4,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,5,0],[3,0,0,4,2,0]],"region":[[9,9,9,9,7,7],[8,5,5,9,7,7],[5,5,6,6,4,7],[5,1,6,4,4,4],[1,1,3,3,4,2],[1,1,2,2,2,2]],"label":53},{"M":6,"N":6,"hint":[[0,0,0,0,0,4],[0,0,0,3,0,0],[0,0,0,0,0,0],[4,0,0,0,4,0],[0,0,0,0,0,0],[0,2,0,1,0,2]],"region":[[6,6,6,7,9,9],[4,6,7,7,7,9],[4,6,5,7,8,9],[4,5,5,5,2,3],[4,4,5,2,2,3],[1,1,2,2,3,3]],"label":54},{"M":8,"N":8,"hint":[[2,0,5,1,0,4,2,0],[0,3,0,0,2,0,0,0],[4,0,5,0,1,0,2,0],[2,0,0,0,0,5,0,5],[0,0,0,0,0,0,0,4],[0,2,0,0,3,0,3,0],[0,4,0,4,0,2,0,2],[2,0,5,0,1,5,0,3]],"region":[[1,4,4,4,8,8,8,8],[1,1,6,4,4,11,11,8],[1,1,6,6,6,11,11,12],[2,2,7,7,6,11,11,12],[3,2,2,7,9,9,12,12],[3,5,7,7,9,9,10,12],[3,5,5,7,10,10,10,13],[3,3,5,5,10,10,13,13]],"label":55},{"M":7,"N":7,"hint":[[0,0,3,0,1,0,1],[2,0,1,0,0,2,0],[0,3,0,0,3,0,0],[2,0,0,1,0,0,1],[0,4,6,0,0,0,0],[2,0,0,2,0,0,3],[1,0,0,4,0,2,0]],"region":[[1,1,1,7,7,7,11],[1,1,4,4,6,7,9],[2,4,4,6,6,7,9],[2,4,6,6,8,7,9],[2,3,3,3,8,9,9],[3,3,5,5,8,9,10],[3,5,5,8,8,10,10]],"label":56},{"M":6,"N":6,"hint":[[3,0,0,0,0,5],[0,0,0,1,0,0],[0,3,0,0,0,3],[0,0,0,1,0,4],[0,3,0,0,0,3],[2,0,1,0,1,4]],"region":[[1,1,1,6,6,6],[1,2,2,6,6,7],[2,2,4,4,7,7],[2,3,4,4,7,7],[3,3,5,5,8,8],[3,3,5,5,8,8]],"label":57},{"M":6,"N":6,"hint":[[0,3,4,0,0,2],[0,5,0,0,0,0],[0,0,0,0,0,3],[0,1,0,0,0,0],[0,0,0,0,0,0],[0,0,0,4,0,0]],"region":[[2,2,2,1,1,1],[5,2,2,4,4,3],[5,5,6,6,4,4],[7,5,5,6,6,4],[7,7,7,7,6,8],[9,9,8,8,8,8]],"label":58},{"M":8,"N":8,"hint":[[3,0,1,2,0,4,0,0],[0,2,0,0,0,0,6,5],[0,0,3,0,0,0,0,3],[1,0,0,5,0,0,0,0],[4,0,6,0,2,0,4,6],[0,5,0,0,0,0,0,5],[6,0,2,0,0,0,4,0],[3,4,0,0,4,0,0,3]],"region":[[1,1,1,8,8,12,12,14],[2,1,1,8,8,8,12,12],[3,5,7,9,9,9,9,12],[3,5,7,7,7,7,13,12],[3,5,5,5,5,7,13,13],[3,6,6,6,11,11,11,13],[4,4,4,6,6,11,11,13],[4,4,4,10,10,10,10,13]],"label":59},{"M":9,"N":9,"hint":[[0,3,0,2,0,4,1,0,3],[0,5,1,0,0,0,5,4,0],[0,4,0,4,7,0,0,6,7],[1,0,1,0,3,4,0,2,5],[3,0,0,2,0,0,3,0,3],[0,0,6,0,4,1,0,2,0],[5,0,5,0,0,0,0,0,3],[0,0,0,0,5,1,0,0,0],[1,0,3,4,2,0,3,1,4]],"region":[[1,5,5,7,7,10,10,15,15],[1,6,5,8,10,10,15,15,15],[2,6,5,8,10,13,14,14,14],[2,6,6,8,10,14,14,16,16],[2,6,6,8,10,14,11,16,16],[2,3,6,8,9,14,11,17,16],[2,3,3,9,9,11,11,17,17],[3,3,3,9,11,11,12,12,17],[4,4,4,4,12,12,12,12,17]],"label":60},{"M":8,"N":8,"hint":[[5,2,3,0,4,0,4,1],[0,4,0,0,0,3,5,0],[6,0,0,3,6,2,0,1],[0,2,0,0,4,0,5,0],[4,0,5,0,0,0,0,2],[5,0,0,0,0,2,0,0],[0,4,0,6,0,0,5,4],[1,0,0,0,2,0,0,1]],"region":[[1,1,4,4,4,4,10,10],[1,1,5,5,9,10,10,10],[1,1,5,5,9,9,9,9],[2,2,5,7,7,7,11,9],[2,2,6,8,7,7,11,13],[2,3,6,8,8,11,11,13],[3,3,6,6,8,11,13,13],[3,3,6,6,8,12,13,13]],"label":61},{"M":7,"N":7,"hint":[[0,3,2,0,0,4,5],[0,0,0,0,1,0,1],[3,2,0,2,0,6,0],[0,6,0,0,0,0,2],[0,0,0,3,0,6,0],[0,5,0,0,0,0,4],[0,2,0,0,4,0,3]],"region":[[1,1,5,5,9,9,9],[2,1,6,5,5,9,9],[2,1,6,6,10,10,10],[2,2,7,6,11,10,10],[2,2,7,7,11,11,10],[3,3,3,8,8,11,11],[4,3,3,8,8,8,11]],"label":62},{"M":7,"N":7,"hint":[[0,0,2,0,5,0,6],[0,3,0,0,0,3,0],[0,0,6,0,0,0,2],[4,3,0,0,0,0,0],[1,0,0,0,0,3,0],[0,3,0,6,0,0,5],[0,0,2,0,2,3,1]],"region":[[1,2,2,6,6,6,6],[1,2,6,6,9,11,11],[2,2,7,7,7,7,11],[2,5,7,7,8,8,12],[3,5,5,8,8,12,12],[3,3,5,5,5,12,12],[4,4,4,4,10,10,10]],"label":63},{"M":9,"N":9,"hint":[[2,0,2,5,1,0,4,2,0],[0,0,0,0,0,2,1,0,1],[5,0,4,0,0,0,0,7,0],[0,6,0,0,0,2,3,2,4],[2,0,2,0,4,5,0,0,3],[4,0,0,0,3,0,0,4,0],[1,5,0,2,4,0,6,0,5],[0,0,4,0,0,3,0,3,0],[3,1,0,0,6,0,4,0,1]],"region":[[1,1,6,6,10,10,13,13,13],[2,1,1,6,6,10,12,12,13],[2,2,2,9,6,12,12,12,15],[3,5,2,9,9,12,12,15,15],[3,5,7,7,9,9,14,15,15],[3,5,8,7,7,9,14,14,14],[3,5,8,8,7,7,7,14,14],[4,5,5,8,11,11,11,16,16],[4,4,4,4,4,11,11,16,16]],"label":64},{"M":6,"N":6,"hint":[[0,0,0,2,0,0],[0,2,0,0,1,0],[1,0,0,5,0,4],[0,0,4,0,0,0],[0,0,5,0,4,0],[0,0,0,3,0,1]],"region":[[1,1,1,1,7,7],[2,2,5,5,7,7],[2,2,6,5,5,8],[2,3,6,6,5,8],[3,3,6,6,4,8],[3,4,4,4,4,8]],"label":65},{"M":8,"N":8,"hint":[[2,0,0,5,3,0,2,0],[0,0,2,0,0,0,0,0],[5,0,3,0,3,0,4,0],[0,0,0,5,0,0,0,1],[3,0,3,0,3,0,0,4],[2,0,2,0,2,1,6,0],[1,0,0,1,0,3,0,1],[0,4,2,3,0,1,4,3]],"region":[[1,1,3,3,3,3,12,12],[1,3,3,7,7,7,12,10],[1,4,7,7,10,10,10,10],[1,5,5,5,9,9,13,13],[2,5,5,9,9,11,13,13],[2,6,6,9,11,11,13,13],[2,6,6,6,11,11,14,14],[2,2,8,8,8,8,14,14]],"label":66},{"M":8,"N":8,"hint":[[1,0,3,0,2,0,4,1],[0,4,0,0,1,6,0,2],[0,2,0,4,0,0,4,0],[4,0,1,0,0,0,0,2],[0,0,5,0,0,0,3,0],[0,0,1,0,2,6,1,0],[1,3,0,6,0,5,0,0],[2,0,5,0,4,0,0,4]],"region":[[1,4,6,6,6,11,11,11],[2,4,6,6,9,11,11,11],[2,4,4,9,9,10,10,10],[2,4,4,9,10,10,12,12],[2,3,7,7,7,12,12,12],[3,3,7,7,7,12,13,13],[3,5,5,5,5,5,13,13],[3,5,8,8,8,8,8,13]],"label":67},{"M":8,"N":8,"hint":[[0,1,4,0,6,0,1,2],[0,0,0,0,5,0,5,0],[5,0,5,0,0,1,0,0],[1,3,0,0,2,0,4,0],[0,0,2,0,0,0,0,5],[0,0,0,5,0,5,3,0],[0,4,0,6,0,6,0,0],[1,0,3,0,3,2,0,3]],"region":[[1,1,5,5,5,10,10,10],[2,1,1,7,5,5,10,10],[2,2,1,7,7,5,13,13],[2,2,6,8,7,7,14,13],[2,3,6,6,9,11,14,14],[3,3,6,6,9,11,14,14],[3,3,4,4,9,11,11,11],[4,4,4,4,9,12,12,11]],"label":68},{"M":7,"N":7,"hint":[[3,1,0,1,0,0,0],[0,0,4,0,5,0,3],[3,0,0,3,0,0,0],[0,5,0,0,0,3,6],[0,0,0,1,2,0,0],[1,0,0,0,0,5,0],[0,2,0,2,0,0,2]],"region":[[1,1,6,6,6,8,8],[2,1,1,8,8,8,8],[2,4,4,4,4,9,9],[2,4,4,9,9,9,9],[2,2,5,5,5,10,10],[3,5,5,10,10,10,10],[3,3,7,7,7,11,11]],"label":69},{"M":6,"N":6,"hint":[[4,0,0,0,0,0],[0,0,0,0,0,0],[0,0,4,0,0,1],[0,0,0,2,0,0],[5,0,0,3,5,0],[0,0,0,0,0,0]],"region":[[1,1,2,3,3,3],[1,2,2,2,3,4],[1,5,2,6,3,4],[5,5,6,6,6,4],[5,7,7,6,8,4],[5,8,8,8,8,4]],"label":70},{"M":7,"N":7,"hint":[[3,0,0,4,0,6,0],[0,4,6,0,0,0,3],[0,0,0,4,0,0,1],[0,0,2,6,1,0,4],[0,3,0,3,0,6,0],[1,0,0,0,2,0,3],[4,3,1,3,0,0,0]],"region":[[1,4,4,4,4,5,10],[1,1,1,5,5,5,10],[1,1,5,5,8,8,10],[2,2,2,2,8,8,9],[2,2,6,6,8,8,9],[3,3,6,6,6,9,9],[3,3,7,7,7,7,7]],"label":71},{"M":7,"N":7,"hint":[[1,4,0,6,0,5,1],[0,0,0,0,3,0,3],[0,1,0,5,0,0,6],[5,0,3,0,0,0,0],[1,4,0,6,0,5,4],[0,2,0,0,0,0,0],[3,0,0,0,0,2,5]],"region":[[1,1,1,1,8,8,8],[2,2,1,1,8,8,10],[2,2,2,4,4,4,10],[2,4,4,4,9,9,10],[3,3,6,6,9,6,10],[3,3,3,6,6,6,10],[3,5,7,7,7,7,10]],"label":72},{"M":6,"N":6,"hint":[[0,2,0,0,0,0],[0,0,0,1,0,0],[0,0,0,0,5,0],[0,3,0,0,0,3],[0,0,0,0,0,0],[0,0,0,0,0,5]],"region":[[6,6,7,8,8,8],[6,7,7,7,8,9],[6,1,7,5,8,9],[6,1,5,5,5,4],[1,1,2,5,4,4],[1,2,2,3,4,4]],"label":73},{"M":7,"N":7,"hint":[[0,0,0,0,4,0,2],[0,0,0,0,0,3,0],[0,0,2,0,0,6,0],[0,4,5,0,0,3,0],[0,0,0,2,0,0,6],[0,4,0,0,4,0,3],[3,0,6,1,0,1,2]],"region":[[1,1,1,1,1,11,9],[2,2,2,2,8,8,9],[3,3,3,8,8,9,9],[4,6,6,6,9,9,10],[4,4,6,6,10,10,10],[5,4,7,7,7,10,10],[5,5,7,7,7,12,12]],"label":74},{"M":6,"N":6,"hint":[[0,1,0,0,0,0],[0,5,0,5,0,0],[0,0,0,0,2,0],[2,0,0,5,0,5],[0,0,0,0,0,0],[2,4,1,0,1,3]],"region":[[1,1,5,5,5,8],[2,2,5,6,6,8],[2,2,2,6,6,8],[3,3,3,3,6,8],[3,4,4,7,7,8],[4,4,4,7,7,7]],"label":75},{"M":6,"N":6,"hint":[[1,4,0,3,0,3],[2,0,0,0,1,0],[0,0,0,0,0,0],[3,0,0,0,0,0],[0,5,0,0,0,0],[2,0,1,0,0,2]],"region":[[1,4,4,4,4,8],[1,5,5,5,8,8],[1,5,5,6,8,9],[1,6,6,6,7,9],[2,6,3,7,7,9],[3,3,3,7,7,9]],"label":76},{"M":8,"N":8,"hint":[[1,0,2,0,0,2,0,0],[0,0,0,0,6,0,5,0],[2,0,0,0,0,2,0,3],[0,5,1,0,0,6,0,2],[4,0,4,0,3,1,0,0],[2,0,0,0,0,0,2,0],[0,4,2,0,2,4,0,5],[5,0,3,0,0,0,2,4]],"region":[[1,3,3,3,3,9,9,9],[1,4,4,3,3,10,12,9],[1,4,4,6,7,10,12,12],[1,1,4,6,7,10,12,12],[2,1,6,6,7,10,13,13],[2,5,6,6,7,10,13,13],[2,5,5,7,7,10,11,11],[2,2,5,5,8,11,11,11]],"label":77},{"M":8,"N":8,"hint":[[0,0,4,0,0,0,3,2],[0,3,0,0,0,2,0,1],[5,0,5,0,6,0,3,0],[3,0,4,0,0,1,0,1],[0,0,0,0,0,0,0,0],[2,0,0,2,0,5,0,5],[0,3,0,0,4,0,3,0],[4,0,4,6,0,2,4,1]],"region":[[1,1,2,2,10,10,11,11],[2,2,2,2,10,10,11,11],[3,5,5,5,5,10,12,12],[3,5,6,6,5,9,12,12],[3,6,6,7,7,9,13,12],[3,6,7,7,9,9,13,13],[3,4,4,9,9,8,8,13],[4,4,8,8,8,8,13,13]],"label":78},{"M":7,"N":7,"hint":[[3,4,0,6,0,3,1],[2,0,0,0,0,0,2],[0,3,0,6,0,0,0],[4,0,5,0,5,0,0],[0,0,0,0,0,0,0],[5,0,0,3,4,0,0],[4,3,4,0,0,1,3]],"region":[[1,1,1,1,1,10,10],[2,2,6,6,1,10,10],[2,2,6,6,6,6,7],[2,3,3,7,7,7,7],[3,3,3,8,8,8,9],[4,4,4,4,9,9,9],[4,5,5,5,5,11,9]],"label":79},{"M":6,"N":6,"hint":[[0,0,0,1,5,0],[4,0,2,0,0,4],[3,0,3,0,0,0],[4,0,0,0,0,0],[0,0,3,0,0,0],[1,0,1,0,0,4]],"region":[[1,3,5,5,5,5],[1,3,3,3,3,5],[1,1,6,6,6,8],[2,4,4,6,6,8],[2,2,4,7,7,7],[2,2,4,4,7,7]],"label":80},{"M":6,"N":6,"hint":[[0,0,0,2,0,1],[0,1,0,0,0,0],[0,0,0,0,3,4],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,3,0,0,2]],"region":[[1,2,2,2,3,4],[1,1,2,2,3,4],[5,1,6,3,3,7],[5,5,6,6,3,7],[5,5,8,6,6,7],[8,8,8,8,7,7]],"label":81},{"M":8,"N":8,"hint":[[0,1,3,0,1,0,0,2],[0,5,0,5,0,0,0,5],[4,0,3,0,2,0,0,3],[0,0,0,4,5,0,6,0],[0,4,0,0,0,1,0,5],[3,0,0,0,0,0,6,0],[0,2,0,0,0,2,0,2],[3,0,5,3,4,0,3,0]],"region":[[1,1,6,6,6,10,12,12],[1,1,4,4,6,10,13,13],[1,4,4,4,4,10,13,13],[1,2,2,7,7,7,13,13],[2,2,7,7,9,9,9,9],[2,5,5,5,9,11,11,11],[3,3,8,5,5,8,11,11],[3,3,8,8,8,8,11,14]],"label":82},{"M":7,"N":7,"hint":[[0,0,0,0,2,1,0],[0,4,0,5,0,0,0],[1,0,0,0,1,0,0],[0,3,0,5,3,0,1],[2,0,2,4,0,0,0],[6,0,0,0,5,0,0],[1,0,4,2,0,1,3]],"region":[[1,1,1,7,7,7,7],[2,2,4,4,4,4,7],[2,4,4,8,8,11,11],[2,5,5,8,8,11,11],[2,3,5,8,10,6,9],[2,3,6,6,6,6,9],[3,3,6,9,9,9,9]],"label":83},{"M":8,"N":8,"hint":[[3,0,5,0,1,0,1,0],[0,1,0,3,0,5,0,3],[0,0,0,0,4,0,0,1],[0,0,0,5,6,0,0,4],[5,0,3,0,0,0,3,0],[1,0,0,0,0,0,0,4],[5,0,3,0,2,0,0,5],[0,4,0,6,0,0,6,2]],"region":[[1,1,1,1,1,9,9,13],[2,4,6,6,6,6,9,13],[2,4,4,6,6,10,9,13],[2,5,4,7,7,10,10,13],[2,5,4,4,7,11,10,12],[2,5,5,7,7,10,10,12],[3,3,5,7,8,8,12,12],[3,3,3,3,8,8,12,12]],"label":84},{"M":9,"N":9,"hint":[[3,2,0,4,0,3,5,0,0],[0,0,1,0,1,6,0,4,0],[1,3,0,3,0,7,0,0,1],[0,0,0,7,5,0,0,4,0],[0,0,2,6,0,0,2,0,3],[4,0,0,0,0,5,0,4,0],[0,0,1,0,0,0,3,6,1],[4,5,0,3,0,1,0,4,7],[2,0,6,0,4,6,0,2,0]],"region":[[1,5,7,9,9,12,12,12,12],[1,5,7,9,9,12,13,17,17],[1,5,7,9,9,12,13,17,17],[1,5,5,5,5,12,13,13,17],[2,2,2,8,8,13,13,14,16],[2,2,8,8,8,8,14,14,16],[3,6,6,6,6,14,14,16,16],[4,4,4,4,11,15,16,16,11],[4,4,4,10,11,11,11,11,11]],"label":85},{"M":6,"N":6,"hint":[[0,2,0,0,0,0],[0,0,5,0,0,0],[3,0,0,0,0,0],[0,0,0,0,3,0],[3,0,0,0,0,0],[0,0,0,5,0,0]],"region":[[7,7,7,7,9,6],[8,5,7,6,6,6],[5,5,5,4,6,1],[3,5,4,4,4,1],[3,3,2,4,1,1],[3,2,2,2,2,1]],"label":86},{"M":8,"N":8,"hint":[[1,0,4,1,0,5,0,4],[2,0,2,6,2,6,0,0],[0,1,0,0,0,0,2,0],[6,0,5,2,0,0,5,0],[0,0,0,0,4,0,0,3],[0,0,0,1,0,0,5,0],[0,0,0,0,0,0,2,6],[0,6,2,0,0,5,0,4]],"region":[[1,4,4,8,8,8,13,13],[2,4,4,4,8,9,13,13],[2,4,5,5,8,9,14,14],[2,3,5,5,9,9,14,14],[2,3,5,6,9,11,12,14],[2,3,6,6,9,12,12,10],[2,3,6,7,7,12,12,10],[3,3,7,7,10,10,10,10]],"label":87},{"M":8,"N":8,"hint":[[2,0,4,0,0,3,6,4],[0,3,0,0,6,5,2,0],[2,0,2,0,0,0,0,0],[0,0,0,0,5,0,2,6],[0,6,0,2,0,3,0,0],[4,0,4,0,5,0,0,0],[0,6,0,6,0,4,0,4],[2,0,4,0,5,0,1,3]],"region":[[1,1,1,1,8,8,10,10],[1,2,2,5,8,10,10,10],[2,2,5,5,8,10,12,12],[3,5,5,8,8,6,12,12],[3,6,6,6,6,6,12,12],[3,4,4,4,9,9,9,9],[3,4,7,7,7,11,11,9],[4,4,7,7,7,11,11,11]],"label":88},{"M":6,"N":6,"hint":[[4,0,0,2,0,0],[0,0,0,0,0,0],[1,0,0,0,2,0],[0,0,0,0,0,0],[0,5,0,0,0,4],[4,0,0,0,0,0]],"region":[[1,2,2,2,2,3],[1,2,4,5,5,5],[1,1,4,4,5,5],[1,6,6,4,4,7],[8,8,6,6,7,7],[8,8,8,6,7,9]],"label":89},{"M":8,"N":8,"hint":[[1,0,3,0,3,0,0,5],[0,5,4,0,0,5,0,0],[0,0,0,0,0,0,0,1],[3,0,5,0,0,2,4,0],[0,2,0,0,0,0,0,3],[0,0,0,3,0,4,0,0],[0,0,1,0,5,0,0,1],[3,0,3,0,0,2,0,2]],"region":[[1,1,1,7,7,7,12,12],[2,1,1,7,7,11,12,12],[2,4,5,8,8,11,11,12],[2,4,5,5,8,8,11,11],[2,4,5,5,9,10,13,13],[3,4,5,9,9,10,13,13],[3,4,6,6,6,10,13,14],[3,3,6,6,10,10,14,14]],"label":90},{"M":8,"N":8,"hint":[[5,0,0,1,0,0,1,2],[0,3,4,0,5,4,0,3],[0,0,0,2,0,2,0,2],[0,4,0,3,4,0,5,0],[2,0,0,0,0,0,0,1],[5,0,0,0,5,0,0,3],[0,0,0,0,1,0,1,0],[1,5,0,4,0,4,0,5]],"region":[[1,5,5,8,8,8,11,11],[1,1,5,5,11,11,11,11],[1,1,6,5,12,12,13,13],[2,2,6,6,6,12,12,12],[3,2,2,9,6,7,7,14],[3,3,7,7,7,7,14,14],[4,3,3,10,10,10,15,14],[4,4,4,4,10,10,14,14]],"label":91},{"M":8,"N":8,"hint":[[3,2,0,0,0,5,0,3],[4,0,0,5,4,0,0,1],[0,0,2,0,0,6,0,2],[0,0,0,5,4,0,1,0],[0,2,1,0,0,0,0,0],[4,0,4,6,0,0,4,0],[1,0,0,0,2,0,0,0],[5,0,2,4,0,0,0,5]],"region":[[1,1,1,7,7,7,11,12],[1,4,4,4,7,7,11,12],[2,4,6,6,6,9,11,12],[2,4,6,6,6,9,11,13],[2,4,5,5,8,9,9,13],[2,5,5,5,8,9,9,13],[2,5,3,3,8,10,10,13],[3,3,3,8,8,10,10,13]],"label":92},{"M":9,"N":9,"hint":[[1,7,0,0,1,0,6,0,4],[2,0,0,3,0,3,0,0,0],[0,4,5,0,5,4,2,0,6],[3,0,3,0,6,0,0,0,7],[0,2,0,7,0,0,6,0,5],[0,0,3,0,5,3,0,4,0],[0,2,0,1,7,0,0,0,3],[0,5,6,0,0,2,0,5,0],[2,0,0,4,6,0,1,0,3]],"region":[[1,2,2,2,9,12,12,14,14],[2,2,7,9,9,12,12,14,14],[2,3,7,9,9,12,12,12,15],[2,3,7,7,7,10,10,15,15],[3,3,7,7,10,10,11,15,15],[3,4,4,8,8,8,11,15,15],[4,4,8,8,11,11,11,13,13],[5,6,8,6,11,11,13,13,16],[5,6,6,6,6,13,13,16,16]],"label":93},{"M":8,"N":8,"hint":[[6,2,0,0,0,1,0,0],[3,0,5,0,5,0,0,5],[0,0,0,0,0,4,0,0],[2,0,1,0,1,0,2,4],[6,0,0,3,0,0,0,1],[1,0,0,0,0,0,3,0],[0,0,6,0,3,0,0,4],[2,1,0,0,0,4,0,0]],"region":[[1,4,4,4,4,9,9,12],[1,1,1,7,9,9,9,12],[2,1,1,7,7,7,7,12],[2,2,6,6,10,7,12,12],[2,2,6,6,10,10,12,14],[2,5,5,5,11,10,10,14],[3,5,5,5,11,11,11,14],[3,3,3,8,11,11,13,14]],"label":94},{"M":6,"N":6,"hint":[[0,1,0,2,0,0],[0,0,5,0,4,1],[4,0,4,0,0,0],[0,0,0,1,0,4],[4,0,0,0,2,0],[0,0,4,1,0,4]],"region":[[1,1,1,1,6,6],[2,2,6,6,6,8],[2,2,5,5,8,8],[3,5,5,5,8,8],[3,3,3,7,7,7],[4,4,4,4,7,7]],"label":95},{"M":10,"N":10,"hint":[[6,1,0,3,0,4,5,0,5,6],[0,0,6,0,7,0,0,0,4,0],[4,1,0,2,0,0,0,3,0,3],[0,0,0,5,0,0,1,6,0,4],[0,5,3,0,4,0,3,7,1,6],[0,0,0,5,7,1,0,0,0,5],[0,1,0,0,0,0,0,1,4,0],[4,2,0,1,0,7,4,0,2,7],[0,5,0,0,0,1,0,0,0,0],[1,0,6,0,3,0,3,2,1,3]],"region":[[1,1,7,7,7,13,13,15,15,15],[1,1,8,8,8,8,13,15,15,15],[1,4,4,8,8,8,13,16,16,15],[1,4,4,4,11,11,13,16,16,16],[2,5,5,5,5,11,13,16,17,17],[2,5,9,9,5,11,11,16,17,17],[3,6,6,9,5,14,14,14,18,17],[3,6,6,9,9,14,14,14,18,17],[3,6,6,6,12,12,12,14,18,17],[3,3,3,10,10,10,12,12,18,18]],"label":96},{"M":10,"N":10,"hint":[[2,0,1,0,0,0,6,4,5,2],[5,0,0,3,0,2,0,0,0,1],[1,0,4,0,0,6,3,6,5,0],[7,0,0,5,0,1,0,1,0,7],[0,5,7,0,0,0,4,0,2,0],[0,0,1,6,4,5,6,3,0,1],[3,4,0,0,3,0,0,2,5,4],[0,0,0,6,0,0,3,0,0,0],[7,0,2,0,5,0,0,4,0,4],[4,0,1,0,6,4,0,0,3,1]],"region":[[1,4,4,8,8,8,8,8,8,8],[1,4,4,7,7,11,11,15,15,15],[1,1,1,7,11,11,11,15,15,15],[1,1,7,7,11,11,12,12,16,16],[2,5,5,9,9,12,12,12,16,16],[2,6,5,5,9,9,9,14,16,16],[2,6,6,5,5,9,9,14,17,16],[2,2,6,3,5,10,10,14,17,17],[3,2,3,3,10,10,14,14,13,17],[3,3,3,10,10,13,13,13,13,17]],"label":97},{"M":9,"N":9,"hint":[[3,1,0,0,5,0,4,0,2],[7,0,0,0,0,0,6,1,0],[0,0,0,4,2,0,0,0,2],[3,4,5,0,0,3,0,0,0],[0,7,0,0,6,0,2,0,3],[3,0,0,0,0,4,0,7,0],[0,0,0,4,3,0,2,0,4],[7,0,0,6,0,0,1,0,2],[0,2,0,0,2,3,0,7,0]],"region":[[1,6,6,6,11,11,11,16,16],[1,1,1,1,11,11,11,16,16],[2,7,2,1,1,14,15,15,15],[2,2,2,9,9,14,14,15,15],[2,2,9,9,12,14,14,12,17],[3,3,3,3,12,12,12,12,17],[3,8,4,4,13,13,13,12,17],[4,4,4,4,4,10,13,17,17],[5,5,10,10,10,10,13,13,13]],"label":98},{"M":8,"N":8,"hint":[[0,0,0,0,2,0,2,1],[2,3,0,0,0,1,0,0],[5,0,2,0,6,0,2,0],[0,1,0,0,0,5,0,4],[2,0,4,0,1,0,1,0],[0,6,0,3,0,0,0,6],[2,0,0,0,5,0,0,0],[0,3,1,4,0,4,0,3]],"region":[[1,2,6,6,6,6,15,15],[2,2,6,7,9,9,15,15],[2,2,7,7,9,13,13,13],[3,2,7,9,9,11,11,13],[3,3,7,9,10,11,11,14],[4,3,3,8,11,11,12,14],[5,5,3,8,12,12,12,14],[5,5,8,8,12,14,14,14]],"label":99},{"M":8,"N":8,"hint":[[0,2,0,3,2,3,0,1],[5,0,1,0,0,0,2,0],[0,0,5,0,1,0,0,5],[0,3,0,6,0,0,2,0],[4,0,0,0,5,0,0,0],[0,0,0,0,0,1,0,2],[0,0,0,0,0,6,0,1],[3,0,1,2,0,0,0,2]],"region":[[1,1,1,1,6,6,13,13],[2,2,6,6,6,6,13,13],[2,2,3,5,9,9,12,12],[2,3,3,5,9,9,12,12],[3,3,5,5,9,12,12,10],[3,5,5,8,8,8,10,10],[4,4,7,7,10,10,10,11],[4,4,7,7,11,11,11,11]],"label":100},{"M":10,"N":10,"hint":[[1,0,0,7,5,0,1,0,3,2],[5,0,3,0,1,0,3,4,0,0],[4,0,4,2,0,7,0,7,3,6],[0,7,0,7,1,0,2,0,0,1],[2,6,0,0,2,0,7,0,2,0],[4,0,1,4,0,6,0,5,7,0],[0,2,7,2,0,0,3,0,3,4],[1,0,0,0,0,4,0,1,0,0],[0,2,4,0,3,0,3,0,0,3],[3,0,0,6,1,0,2,1,2,4]],"region":[[1,4,4,4,4,12,12,14,17,17],[1,5,5,5,4,9,12,14,14,17],[1,5,5,4,4,9,13,14,14,17],[1,5,5,7,8,9,14,14,18,17],[1,1,2,7,9,9,10,15,18,17],[2,2,2,7,9,9,10,15,18,18],[2,3,6,7,10,10,10,15,18,18],[3,3,6,7,10,10,11,15,15,18],[3,6,6,7,7,11,11,16,15,16],[3,6,6,6,11,11,11,16,16,16]],"label":101},{"M":8,"N":8,"hint":[[1,0,4,0,1,2,0,0],[0,0,0,0,0,0,3,2],[1,0,0,0,5,0,5,0],[0,2,0,2,0,4,0,4],[3,0,0,5,0,0,5,0],[1,0,0,0,1,4,0,0],[0,4,0,6,0,0,2,0],[3,0,2,0,0,4,0,0]],"region":[[1,5,5,5,5,12,12,13],[1,1,1,1,7,7,12,13],[2,2,7,7,7,7,12,12],[3,2,2,8,8,8,8,14],[3,2,2,6,6,10,8,14],[3,3,6,6,10,10,10,14],[4,6,6,9,9,9,9,14],[4,4,4,4,11,9,9,14]],"label":102},{"M":8,"N":8,"hint":[[2,0,2,4,0,4,3,0],[3,0,0,0,2,0,0,0],[0,0,4,5,3,0,2,0],[0,0,0,0,0,1,0,1],[0,0,0,0,5,0,2,0],[1,0,0,0,0,0,0,6],[0,0,0,0,3,0,3,0],[5,0,0,0,0,4,0,5]],"region":[[1,1,4,4,10,10,10,10],[1,4,4,4,10,8,13,13],[2,2,2,8,8,8,13,13],[2,5,5,8,8,11,11,13],[3,5,5,9,9,9,11,11],[3,6,5,9,9,12,14,11],[3,6,6,6,6,12,12,11],[3,3,7,7,7,7,12,12]],"label":103},{"M":9,"N":9,"hint":[[4,2,0,1,2,1,0,4,2],[1,0,4,0,0,3,0,1,0],[0,0,6,1,5,0,6,0,4],[7,3,0,0,0,0,0,0,7],[0,0,4,3,6,0,7,2,0],[0,2,6,7,0,0,4,0,0],[4,0,4,0,1,0,0,0,2],[1,0,0,5,0,3,1,6,0],[2,6,0,0,0,2,0,0,3]],"region":[[1,4,4,4,9,9,13,13,13],[1,1,4,4,9,9,13,13,13],[2,1,6,6,10,11,13,14,14],[2,2,6,6,10,10,10,10,14],[3,2,6,6,7,7,12,14,14],[3,2,2,7,7,7,12,14,15],[3,5,2,7,7,12,12,14,15],[3,5,5,5,5,12,12,15,15],[3,5,5,8,8,8,12,15,15]],"label":104},{"M":8,"N":8,"hint":[[3,0,0,5,0,0,0,2],[0,0,3,0,0,0,0,0],[5,0,0,6,0,4,0,6],[2,0,0,2,1,0,0,0],[0,3,0,0,0,0,0,3],[1,0,0,0,4,1,0,4],[0,0,0,0,0,5,0,0],[1,0,0,2,0,2,1,5]],"region":[[1,4,4,5,5,5,13,13],[1,4,4,5,9,9,13,13],[1,2,5,5,6,9,9,11],[1,2,6,6,6,11,11,11],[1,2,6,7,7,11,11,12],[2,2,7,7,7,10,10,12],[2,3,3,8,10,10,10,12],[3,3,8,8,10,12,12,12]],"label":105},{"M":9,"N":9,"hint":[[4,0,0,0,0,6,2,3,7],[1,0,2,3,0,0,0,0,5],[0,0,0,0,2,1,0,0,2],[3,0,1,0,3,0,2,1,0],[0,0,0,7,0,1,4,0,2],[0,0,6,0,3,0,0,6,1],[0,1,0,0,6,0,0,0,0],[3,4,6,5,0,3,0,0,7],[2,0,1,0,1,0,0,1,0]],"region":[[1,1,4,4,9,9,9,9,9],[1,4,4,4,9,11,11,14,9],[1,4,7,7,7,7,11,14,14],[1,5,5,7,7,7,11,11,15],[2,5,5,6,6,10,10,10,15],[2,5,5,6,6,10,13,15,15],[2,6,6,6,10,10,13,15,15],[3,3,3,3,10,12,12,12,15],[3,3,3,8,8,8,8,12,12]],"label":106},{"M":8,"N":8,"hint":[[4,0,2,1,0,0,5,2],[0,1,0,0,0,0,0,0],[0,0,0,0,6,0,3,5],[0,0,4,0,1,0,1,0],[4,0,0,0,0,0,0,2],[0,3,5,0,0,2,0,0],[2,0,0,2,6,0,0,4],[0,0,1,0,4,1,0,1]],"region":[[1,1,1,1,9,9,9,9],[2,2,2,1,9,10,10,9],[3,2,2,5,5,10,10,10],[3,3,5,5,7,7,12,10],[3,5,5,7,7,11,12,12],[4,4,4,7,6,11,13,12],[4,4,6,6,6,11,11,11],[4,6,6,8,8,8,8,11]],"label":107},{"M":8,"N":8,"hint":[[4,2,0,3,0,1,0,6],[5,0,4,0,0,0,4,1],[0,3,0,0,4,0,0,0],[6,0,0,0,6,1,0,0],[1,0,0,0,0,0,0,3],[0,2,4,0,0,3,0,0],[3,0,6,0,2,0,0,5],[1,0,3,4,0,4,2,0]],"region":[[1,1,6,7,7,7,7,8],[2,1,6,8,8,8,8,8],[2,1,6,6,9,10,10,10],[2,4,4,6,9,10,10,12],[2,2,4,6,9,9,12,12],[3,2,4,4,9,9,12,12],[3,5,5,4,5,11,11,12],[3,3,5,5,5,11,11,11]],"label":108},{"M":9,"N":9,"hint":[[5,0,1,0,1,0,0,2,7],[0,3,0,0,5,0,5,4,0],[4,0,1,0,0,3,0,0,2],[0,3,0,6,0,0,0,4,0],[5,0,0,0,1,4,0,7,5],[1,0,1,6,0,0,1,0,1],[0,4,0,0,3,0,7,3,0],[0,0,0,0,0,6,0,0,5],[4,0,6,7,0,3,0,4,3]],"region":[[1,1,7,7,9,9,9,9,11],[1,1,7,7,4,11,11,11,11],[1,4,8,8,4,11,13,12,14],[1,4,4,4,4,11,13,12,14],[2,2,2,2,2,2,12,12,14],[3,5,5,5,5,12,12,14,14],[3,6,5,5,5,12,10,14,15],[3,6,6,6,10,10,10,15,15],[3,6,6,6,10,10,10,15,15]],"label":109},{"M":7,"N":7,"hint":[[5,0,5,0,1,0,0],[0,3,0,0,0,4,0],[6,2,0,0,5,6,2],[5,0,3,2,0,0,0],[3,0,4,0,0,0,2],[0,1,0,0,0,0,0],[6,0,4,0,3,0,5]],"region":[[1,1,5,5,5,5,10],[1,1,6,6,6,5,5],[1,1,7,7,6,8,8],[2,2,7,7,6,8,8],[2,2,7,7,8,8,9],[2,3,3,3,9,9,9],[2,4,4,4,4,4,9]],"label":110},{"M":8,"N":8,"hint":[[2,0,6,0,0,4,1,0],[3,0,0,0,0,5,0,0],[4,0,5,0,1,0,3,1],[0,2,0,0,0,4,0,0],[3,0,3,0,0,0,3,0],[5,0,0,5,0,0,0,2],[4,0,0,0,0,0,3,0],[3,0,4,0,0,1,0,1]],"region":[[1,1,1,1,9,9,10,10],[1,2,2,1,9,10,10,10],[2,2,2,2,9,8,12,12],[3,5,5,8,8,8,12,12],[3,3,5,5,8,8,11,11],[3,3,6,6,6,11,11,11],[4,4,6,6,6,7,13,11],[4,4,7,7,7,7,13,13]],"label":111},{"M":9,"N":9,"hint":[[1,7,5,3,0,4,0,2,0],[0,4,0,1,0,0,6,0,3],[2,3,0,0,7,0,0,7,0],[6,0,4,3,0,3,0,2,3],[0,0,0,0,4,0,7,6,0],[2,0,1,0,0,0,0,5,7],[0,4,3,0,0,0,3,0,6],[3,0,0,6,1,6,0,2,0],[5,4,5,2,0,4,5,0,5]],"region":[[1,3,3,3,3,3,12,12,12],[1,1,1,8,9,3,3,12,12],[1,1,4,8,9,9,9,13,13],[2,4,4,8,10,9,9,13,13],[2,4,6,8,8,9,11,13,13],[2,4,6,6,6,6,11,13,14],[2,5,5,7,6,6,11,14,14],[2,5,5,7,7,11,11,14,14],[2,2,7,7,7,11,11,14,14]],"label":112},{"M":10,"N":10,"hint":[[0,0,1,4,5,4,0,2,0,5],[0,3,0,0,0,3,6,0,6,3],[0,4,0,0,1,0,0,0,7,0],[6,0,1,3,0,3,0,3,0,6],[5,0,5,0,7,0,4,0,4,0],[0,3,0,2,0,6,0,6,0,1],[0,2,5,7,0,4,0,7,4,2],[0,0,0,0,0,0,0,5,0,5],[0,0,3,0,3,0,4,0,2,0],[3,7,0,2,7,5,0,1,0,0]],"region":[[1,4,4,4,11,11,11,16,16,16],[1,1,1,4,11,11,11,16,16,16],[1,5,5,5,12,12,12,12,18,18],[1,5,5,5,5,14,14,12,18,18],[2,2,6,6,6,6,14,14,18,18],[2,6,6,9,9,6,15,14,14,18],[2,3,3,7,7,7,15,15,15,15],[2,3,7,7,7,7,13,13,13,15],[3,3,8,10,13,13,13,17,17,15],[3,3,8,8,8,8,8,8,17,17]],"label":113},{"M":10,"N":10,"hint":[[5,0,1,5,0,3,0,4,3,1],[0,0,2,0,4,0,2,1,0,6],[2,6,0,1,0,3,0,0,4,0],[0,0,0,0,2,0,7,6,3,0],[3,0,3,0,7,1,0,1,0,4],[0,5,0,5,0,0,2,0,2,0],[0,6,3,0,0,3,0,0,0,5],[0,0,0,4,0,4,0,0,0,0],[0,3,0,2,0,0,6,3,0,1],[1,4,5,0,4,1,0,1,2,4]],"region":[[1,1,1,4,4,4,14,14,14,14],[1,4,4,4,5,12,12,12,14,14],[1,5,5,5,5,12,12,12,13,13],[1,5,7,7,7,13,13,13,13,13],[1,5,7,7,9,9,9,16,16,16],[2,2,7,9,9,10,10,16,16,16],[2,2,2,9,9,10,10,15,15,15],[3,6,2,2,10,10,15,15,17,17],[3,3,8,8,11,11,11,11,17,17],[3,3,8,8,8,8,11,11,17,17]],"label":114},{"M":10,"N":10,"hint":[[3,1,0,1,2,0,0,3,5,1],[0,0,3,0,5,4,6,1,0,2],[5,7,0,0,0,0,0,0,0,0],[0,2,0,1,0,1,5,6,0,4],[0,5,3,4,6,0,0,0,3,0],[0,0,0,5,0,1,0,0,0,0],[0,5,0,7,4,0,0,3,0,6],[7,0,4,0,0,5,0,1,7,2],[2,3,0,6,0,0,0,3,0,0],[1,0,7,0,3,0,2,0,6,4]],"region":[[1,1,1,2,2,12,12,12,15,15],[1,1,2,2,9,9,9,9,15,16],[2,2,2,3,9,9,9,10,15,16],[3,3,3,3,10,10,10,10,15,16],[4,3,3,7,7,7,10,10,16,16],[4,4,7,7,7,7,8,13,16,17],[5,5,5,8,8,8,8,13,17,17],[5,5,6,8,8,13,13,13,17,17],[5,6,6,6,11,11,14,14,17,17],[5,6,6,6,11,14,14,14,14,14]],"label":115},{"M":9,"N":9,"hint":[[2,0,5,7,0,6,1,0,2],[4,3,0,0,4,0,0,6,4],[6,0,6,2,1,0,4,0,0],[5,4,0,0,0,0,0,6,2],[0,3,0,0,3,0,4,0,3],[4,0,0,2,0,7,0,0,0],[0,0,1,0,3,0,2,0,3],[0,0,0,4,0,7,0,0,0],[3,1,0,1,0,1,3,4,0]],"region":[[1,1,1,8,8,8,12,12,12],[1,1,1,5,5,8,8,13,12],[2,4,5,5,5,8,8,13,13],[2,4,5,5,6,11,11,11,13],[2,4,4,6,6,11,11,11,13],[2,2,4,6,9,9,9,11,13],[3,2,6,6,9,9,9,9,14],[3,3,7,7,7,7,7,10,14],[3,3,7,7,10,10,10,10,14]],"label":116},{"M":9,"N":9,"hint":[[5,0,2,1,0,3,0,2,0],[0,0,0,0,0,0,5,0,1],[2,1,0,6,0,0,0,0,2],[0,7,0,0,0,4,0,4,0],[5,0,2,0,6,0,0,0,1],[0,0,0,0,0,0,2,0,0],[1,4,0,5,0,0,1,3,0],[2,0,2,0,0,0,0,7,2],[1,3,0,5,4,0,1,0,1]],"region":[[1,4,4,4,4,10,13,13,13],[1,4,4,7,7,10,10,10,10],[1,1,1,6,7,11,11,14,14],[2,2,1,6,7,11,11,14,14],[2,2,5,6,9,11,12,15,14],[2,2,5,6,9,12,12,15,16],[2,5,5,6,9,9,12,15,16],[3,3,6,6,8,9,9,15,15],[3,3,3,8,8,8,8,15,15]],"label":117},{"M":8,"N":8,"hint":[[3,0,1,0,4,0,2,1],[0,0,0,6,0,1,3,0],[3,0,3,0,4,0,0,2],[0,5,0,1,0,1,5,0],[4,0,0,0,0,0,0,0],[0,6,0,4,0,0,3,0],[3,0,2,0,5,4,0,1],[2,4,0,0,1,0,3,0]],"region":[[1,1,1,1,1,1,10,10],[2,2,2,2,6,6,10,10],[2,2,6,6,6,10,10,12],[3,5,5,5,9,9,9,12],[3,3,3,5,5,9,9,12],[4,4,7,8,5,11,11,11],[4,4,7,8,8,11,11,13],[4,4,7,7,8,8,8,13]],"label":118},{"M":9,"N":9,"hint":[[4,0,1,0,3,0,4,0,3],[1,2,0,0,0,2,7,6,0],[0,0,0,0,6,4,3,0,0],[1,2,0,0,0,1,0,1,5],[0,0,4,7,0,0,6,0,2],[2,0,0,0,0,1,7,0,4],[3,0,0,0,6,0,0,1,0],[6,0,0,3,0,4,0,0,3],[1,0,0,0,1,0,2,1,5]],"region":[[1,1,6,6,6,6,13,13,13],[1,1,7,7,7,6,6,6,13],[2,2,8,8,7,11,11,11,14],[3,2,8,8,7,11,11,14,14],[3,2,2,2,7,12,12,14,14],[3,3,3,2,10,10,12,12,12],[3,5,9,9,9,10,12,12,15],[3,5,9,9,9,10,10,15,15],[4,4,4,4,9,10,10,15,15]],"label":119},{"M":9,"N":9,"hint":[[1,0,0,3,7,6,4,0,5],[7,0,0,0,1,0,2,0,0],[3,0,5,0,2,6,0,0,3],[0,6,0,0,0,0,0,1,0],[0,0,4,0,2,0,7,0,2],[1,5,0,0,0,0,0,0,1],[0,3,6,7,2,0,1,0,2],[6,0,0,0,0,4,0,3,0],[0,0,6,5,0,3,1,0,4]],"region":[[1,1,1,1,11,11,11,11,11],[2,2,2,8,8,8,8,11,11],[2,2,2,8,9,9,9,9,9],[2,5,5,9,9,13,13,13,13],[3,3,5,5,5,13,13,15,15],[3,4,4,10,5,13,15,15,15],[3,4,7,7,7,7,7,16,16],[4,4,6,6,12,7,7,16,16],[4,6,6,6,6,14,14,14,14]],"label":120},{"M":10,"N":10,"hint":[[1,6,0,0,0,7,3,2,6,0],[0,0,0,0,5,0,6,0,0,0],[7,3,0,0,4,0,7,5,0,0],[0,0,2,0,0,3,0,0,6,0],[3,0,6,0,0,4,0,2,0,0],[2,7,0,5,2,0,7,3,0,6],[0,0,0,4,0,6,1,0,2,0],[0,3,0,0,5,0,0,3,0,4],[0,0,6,0,0,0,5,7,5,0],[3,1,4,0,1,2,0,1,3,0]],"region":[[1,1,1,10,8,8,14,14,14,14],[1,1,8,8,8,8,8,17,14,14],[1,5,5,5,5,5,13,13,13,15],[1,2,9,9,9,13,13,13,13,15],[2,2,9,9,9,6,6,18,18,15],[2,6,6,6,6,6,15,15,15,15],[2,3,7,7,11,11,11,11,19,19],[3,3,7,7,11,11,11,12,12,16],[3,7,7,4,4,12,12,12,16,16],[4,4,4,4,12,12,16,16,16,20]],"label":121},{"M":10,"N":10,"hint":[[4,1,5,0,6,0,2,0,5,2],[7,0,2,0,4,5,7,1,0,1],[0,1,0,6,0,0,4,5,0,3],[2,3,0,0,3,0,1,0,1,0],[0,5,0,4,0,0,0,5,0,7],[1,0,2,0,6,0,3,0,1,0],[0,0,4,5,0,4,2,5,0,6],[3,0,0,0,7,0,1,0,1,0],[0,4,0,0,0,6,7,3,0,4],[0,2,5,7,3,0,0,5,0,3]],"region":[[1,4,4,4,4,11,11,11,16,17],[1,1,4,8,4,11,11,11,16,17],[1,1,6,6,4,11,12,12,16,16],[1,1,6,6,6,12,12,12,16,16],[2,2,7,7,6,12,12,14,14,14],[2,2,7,7,9,9,9,9,13,14],[2,5,5,7,9,13,13,13,13,14],[2,5,5,7,9,10,10,13,14,14],[3,3,5,3,9,10,10,13,15,15],[3,3,3,3,10,10,10,15,15,15]],"label":122},{"M":8,"N":8,"hint":[[2,0,0,0,0,0,0,0],[0,0,0,0,0,5,0,1],[0,0,0,0,0,0,0,0],[0,3,5,0,0,0,0,0],[0,0,0,0,0,4,0,0],[0,5,0,5,0,0,0,3],[0,4,0,3,0,0,2,5],[0,0,0,0,0,0,0,0]],"region":[[1,2,3,4,4,4,4,5],[1,3,3,3,4,6,5,5],[1,1,3,7,6,6,6,5],[1,8,7,7,7,6,9,5],[8,8,10,10,7,11,9,9],[8,12,10,13,11,11,11,9],[12,12,12,13,13,11,14,9],[15,12,13,13,14,14,14,14]],"label":123},{"M":8,"N":8,"hint":[[5,0,3,0,0,3,0,4],[0,4,6,4,0,0,0,0],[6,1,0,1,0,1,0,5],[0,4,2,0,0,0,0,0],[2,0,0,0,4,0,0,2],[0,5,0,0,0,1,0,0],[4,0,0,1,4,0,0,1],[3,0,6,0,2,6,4,5]],"region":[[1,1,1,1,8,8,8,12],[2,2,1,1,9,9,8,12],[3,2,2,7,7,9,8,12],[3,3,2,2,7,9,11,12],[3,3,6,6,9,9,11,12],[3,5,5,6,6,11,11,10],[4,4,5,5,6,11,11,10],[4,4,5,5,10,10,10,10]],"label":124},{"M":8,"N":8,"hint":[[5,3,0,0,0,1,0,1],[4,0,0,0,0,0,2,0],[0,6,4,0,0,1,0,1],[1,0,0,2,0,0,0,0],[0,4,0,4,0,0,6,4],[5,0,6,0,2,0,3,0],[0,4,0,1,0,1,0,2],[2,0,3,0,0,0,3,0]],"region":[[1,1,1,1,4,10,11,11],[1,4,4,4,4,11,11,11],[2,2,2,5,9,9,9,14],[2,5,5,5,9,9,13,13],[2,5,6,6,7,7,13,13],[2,3,6,7,7,8,13,13],[3,3,6,7,8,8,12,12],[3,6,6,8,8,12,12,12]],"label":125},{"M":10,"N":10,"hint":[[0,4,1,5,0,5,1,6,0,4],[3,0,0,0,6,2,0,0,5,3],[0,1,0,1,0,4,0,6,0,1],[3,0,2,0,7,3,0,4,0,0],[1,0,0,4,0,0,1,0,0,0],[0,0,6,5,0,3,0,3,0,0],[3,0,2,0,2,0,5,0,7,0],[0,0,0,0,6,7,0,1,0,2],[0,1,0,0,0,0,2,0,5,4],[4,6,2,0,1,4,0,3,0,6]],"region":[[1,1,1,1,10,10,14,14,14,14],[1,2,1,1,10,10,10,10,14,14],[2,2,8,8,8,13,13,13,13,18],[2,3,6,6,8,8,8,8,13,13],[3,3,6,6,11,11,11,11,17,17],[3,6,6,6,11,12,12,11,17,17],[3,7,7,7,12,12,12,12,12,16],[4,4,4,4,4,4,4,15,15,16],[5,5,5,5,9,9,15,15,16,16],[5,5,5,9,9,9,9,16,16,16]],"label":126},{"M":10,"N":10,"hint":[[4,0,7,5,0,1,0,1,3,0],[0,0,0,0,0,4,0,0,0,4],[5,0,0,6,5,0,1,0,7,5],[6,2,0,0,7,0,7,4,0,0],[0,4,3,4,0,0,0,5,0,0],[3,0,0,0,0,5,0,0,0,0],[5,0,2,3,6,0,1,0,3,0],[0,4,5,0,0,2,0,4,0,7],[2,3,0,0,0,6,1,3,0,1],[0,7,0,0,5,3,0,4,2,5]],"region":[[1,1,6,6,6,6,6,14,16,18],[2,1,1,1,8,6,6,14,16,16],[2,4,1,1,8,11,13,14,16,16],[2,4,4,4,8,11,13,13,16,17],[2,2,4,8,8,11,12,13,16,17],[2,2,7,8,8,11,12,13,17,17],[3,5,7,9,9,11,12,13,13,17],[3,3,7,9,9,12,12,15,15,15],[3,3,7,9,9,10,10,15,15,15],[3,3,7,7,10,10,10,10,10,15]],"label":127},{"M":10,"N":10,"hint":[[0,2,1,0,4,0,2,0,1,3],[7,5,0,6,5,0,7,0,2,5],[0,6,0,0,2,3,0,4,0,0],[4,0,3,0,5,4,0,5,0,2],[6,0,0,1,2,0,2,0,0,4],[0,2,0,0,0,0,1,0,0,2],[3,1,0,0,3,2,6,0,6,0],[2,0,0,0,0,0,4,0,0,7],[0,6,0,6,0,2,5,0,5,3],[2,0,4,2,1,4,0,3,0,0]],"region":[[1,1,1,7,7,7,10,13,13,13],[2,1,1,7,7,10,10,13,13,17],[2,1,5,7,7,10,10,10,17,17],[2,4,5,5,5,11,11,10,17,17],[2,4,6,5,5,11,11,14,14,14],[2,4,6,6,8,11,12,12,14,14],[2,4,4,6,8,8,8,12,15,14],[2,3,4,6,8,8,8,15,15,15],[3,3,4,6,9,9,9,15,15,15],[3,3,3,6,9,9,9,16,16,16]],"label":128},{"M":9,"N":9,"hint":[[4,0,0,0,0,5,7,0,3],[0,0,0,0,0,3,0,1,6],[4,0,0,3,5,0,2,4,0],[0,5,0,6,0,4,0,0,5],[0,4,0,0,1,0,2,6,0],[3,0,5,0,0,4,0,1,4],[5,0,4,1,3,0,6,0,3],[0,7,3,0,2,7,2,5,0],[1,0,6,1,0,3,0,3,0]],"region":[[1,1,1,1,11,11,11,11,13],[2,2,3,3,11,11,11,13,13],[2,2,3,9,9,9,13,13,13],[3,3,3,9,7,9,14,14,13],[4,4,7,7,7,9,9,14,14],[4,4,5,5,10,10,10,14,14],[4,6,5,10,10,12,12,12,12],[4,5,5,8,8,8,12,12,12],[5,5,8,8,8,8,15,15,15]],"label":129},{"M":9,"N":9,"hint":[[4,0,2,5,2,0,0,0,1],[0,3,0,0,0,0,0,0,0],[6,0,2,0,0,5,0,1,3],[5,0,5,0,0,0,7,0,0],[0,2,0,6,0,0,0,0,0],[0,0,3,0,3,0,5,0,3],[2,0,5,2,0,0,6,0,2],[0,6,0,0,3,0,0,5,0],[1,0,4,1,0,2,0,0,4]],"region":[[1,1,1,1,9,9,13,13,15],[2,2,2,1,9,9,13,13,15],[3,2,2,8,8,7,13,14,15],[3,2,2,8,8,7,11,15,15],[3,5,7,7,7,7,11,16,16],[3,5,6,6,10,10,11,17,16],[3,5,5,6,10,10,11,17,17],[3,5,5,6,11,11,11,17,17],[4,6,6,6,12,12,12,12,12]],"label":130},{"M":8,"N":8,"hint":[[4,0,2,4,2,0,2,0],[0,0,0,5,0,3,0,3],[0,0,0,0,0,0,4,0],[3,0,0,0,0,0,0,0],[6,5,0,0,5,0,0,0],[2,0,0,0,0,3,0,1],[0,3,0,4,0,6,0,0],[4,0,6,0,3,0,0,4]],"region":[[1,1,1,9,9,9,11,11],[1,1,6,6,6,9,12,11],[2,2,4,4,6,6,12,12],[2,4,4,10,10,6,12,12],[2,5,5,5,10,10,10,13],[2,3,5,5,7,7,10,13],[2,3,7,7,7,7,8,13],[3,3,8,8,8,8,8,13]],"label":131},{"M":9,"N":9,"hint":[[2,0,4,0,0,3,0,1,2],[0,0,0,0,2,0,0,3,0],[0,3,0,4,0,6,5,0,1],[6,0,2,0,0,3,0,0,0],[1,4,0,3,5,0,0,0,5],[0,7,0,2,4,0,0,4,0],[0,0,3,0,0,0,0,0,1],[3,0,0,0,0,0,6,5,0],[2,6,0,3,0,3,4,2,1]],"region":[[1,1,1,4,4,10,10,10,10],[1,4,4,4,4,4,14,14,14],[1,5,5,7,7,7,14,14,14],[2,2,5,7,7,11,11,15,15],[2,2,6,7,7,8,11,11,15],[2,2,6,8,8,8,12,12,15],[2,3,6,8,9,12,12,12,15],[3,3,6,8,9,12,13,13,13],[3,6,6,9,9,13,13,13,13]],"label":132},{"M":8,"N":8,"hint":[[0,3,0,0,0,0,0,3],[0,0,0,0,0,0,0,0],[0,0,0,5,0,0,0,0],[0,0,0,0,0,4,0,0],[0,0,0,0,0,0,0,3],[0,0,4,0,1,0,0,0],[0,1,0,0,3,0,0,0],[5,0,0,0,0,1,2,0]],"region":[[1,2,2,2,2,3,4,4],[1,1,5,2,3,3,3,4],[1,5,5,5,6,3,7,4],[1,8,5,6,6,6,7,4],[9,8,8,10,6,11,7,7],[9,8,10,10,10,11,11,7],[9,8,12,10,11,11,13,13],[9,9,12,12,12,13,13,13]],"label":133},{"M":10,"N":10,"hint":[[4,0,3,6,0,0,0,0,3,1],[0,1,0,5,2,0,0,0,0,0],[2,4,6,0,0,3,0,2,0,5],[0,1,0,7,0,0,5,0,1,0],[5,0,0,0,1,7,0,7,0,5],[0,0,0,0,3,0,2,0,6,0],[0,0,3,0,1,6,0,7,0,4],[4,1,6,0,5,0,0,0,5,2],[6,0,0,0,0,1,0,0,0,0],[0,4,5,2,3,0,5,0,0,3]],"region":[[1,1,8,8,8,8,12,12,16,16],[1,1,8,8,12,12,12,16,16,16],[1,5,5,5,5,13,13,13,18,16],[1,6,6,9,5,5,13,13,18,18],[2,7,6,9,9,5,9,13,13,17],[2,7,6,10,9,9,9,17,17,17],[2,7,6,10,10,14,14,14,17,17],[2,2,2,2,10,10,15,14,14,19],[3,3,3,3,3,11,15,15,14,19],[4,3,3,11,11,11,15,15,14,19]],"label":134},{"M":9,"N":9,"hint":[[0,0,1,0,1,0,5,0,2],[4,6,0,2,0,3,0,7,0],[3,0,0,3,0,7,4,0,1],[0,7,0,0,0,0,0,0,2],[5,0,0,1,6,0,0,1,0],[0,4,2,0,5,0,2,0,7],[0,0,0,0,0,0,0,1,3],[0,2,0,0,1,0,3,0,0],[3,5,0,6,0,5,0,5,0]],"region":[[1,1,5,5,8,8,8,8,14],[1,1,6,5,8,8,12,8,14],[1,2,6,5,5,5,5,14,14],[1,2,6,7,9,9,13,14,13],[1,2,6,7,9,9,13,13,13],[2,2,7,7,9,11,11,13,13],[2,2,7,3,9,9,11,15,15],[3,4,4,3,10,10,11,15,15],[3,3,3,3,10,10,10,15,16]],"label":135},{"M":10,"N":10,"hint":[[0,7,0,4,0,3,5,7,0,0],[3,6,0,5,0,0,0,2,4,1],[0,0,0,0,7,0,0,0,5,2],[5,0,7,0,5,0,4,7,0,0],[1,0,1,0,6,1,3,0,0,0],[0,4,0,0,0,0,0,1,3,0],[3,0,0,4,0,1,6,2,0,0],[0,0,1,0,3,0,7,1,0,1],[0,4,7,6,0,4,0,0,0,4],[2,0,1,0,2,0,0,6,2,3]],"region":[[1,2,7,7,11,11,11,17,17,17],[2,2,7,7,7,14,11,11,17,17],[2,2,7,9,7,14,9,17,17,19],[2,2,4,9,9,9,9,10,15,19],[3,3,4,10,10,10,10,10,15,19],[3,4,4,10,12,12,12,12,15,19],[4,4,8,8,8,8,12,12,15,18],[4,6,6,8,8,8,15,15,15,18],[5,5,6,6,13,13,13,13,18,18],[5,5,5,6,6,6,16,13,13,18]],"label":136},{"M":9,"N":9,"hint":[[0,0,1,0,4,0,0,0,7],[3,5,0,5,2,1,0,5,0],[0,0,6,0,6,4,0,4,6],[4,0,5,0,0,0,0,0,5],[1,6,0,0,0,0,0,3,0],[0,0,7,0,2,0,2,0,0],[3,0,0,4,0,0,6,0,3],[4,0,6,5,0,0,0,5,0],[3,7,0,0,6,0,7,2,1]],"region":[[1,1,5,7,7,7,11,13,13],[1,1,5,7,7,11,11,13,14],[2,1,5,5,7,12,12,13,14],[2,1,5,5,7,12,12,13,14],[2,1,6,6,6,12,13,13,14],[2,3,3,4,6,8,8,14,14],[2,3,3,4,8,8,9,9,10],[3,3,3,4,9,9,9,9,10],[4,4,4,4,10,10,10,10,10]],"label":137},{"M":9,"N":9,"hint":[[4,0,0,1,0,2,0,5,3],[2,0,0,0,6,0,6,0,0],[0,5,0,5,0,0,0,3,0],[0,0,2,0,4,5,0,0,4],[0,0,0,6,0,3,0,7,0],[4,0,4,0,0,1,4,0,3],[0,7,0,2,5,0,6,0,1],[1,0,4,0,0,2,0,5,0],[3,0,5,0,4,0,4,0,1]],"region":[[1,1,1,1,9,11,11,11,11],[2,2,6,6,9,9,11,11,12],[2,2,5,6,9,9,12,12,12],[2,5,5,6,9,9,12,13,13],[3,5,5,6,6,10,10,13,15],[3,3,5,7,6,10,10,13,15],[4,3,5,7,10,10,13,13,15],[4,3,7,7,10,8,13,14,14],[3,3,8,8,8,8,14,14,14]],"label":138},{"M":9,"N":9,"hint":[[6,2,1,5,0,2,0,0,4],[0,5,0,0,7,0,0,6,1],[7,6,0,0,0,0,0,0,2],[3,0,0,3,0,0,0,5,1],[0,7,0,1,5,0,3,0,0],[1,0,3,2,0,2,0,0,1],[3,0,1,0,3,0,0,0,0],[0,4,0,0,6,0,0,0,5],[2,0,5,1,0,2,0,4,0]],"region":[[1,1,1,1,1,11,12,12,12],[1,2,7,7,1,11,12,12,12],[2,2,2,7,7,11,11,13,13],[2,5,2,5,5,5,11,13,13],[2,5,5,5,10,10,11,14,13],[3,6,6,6,6,10,10,14,14],[3,3,6,6,8,8,10,15,14],[4,4,8,8,8,8,8,15,14],[4,4,4,9,9,9,9,15,15]],"label":139},{"M":10,"N":10,"hint":[[2,0,6,3,0,2,0,1,0,2],[7,4,0,0,0,6,0,0,3,0],[5,0,0,0,5,0,7,0,5,1],[0,0,6,1,0,0,0,1,0,2],[0,0,2,0,5,0,4,0,4,0],[0,4,0,0,0,1,0,0,5,3],[0,6,0,0,0,6,0,7,0,2],[5,3,0,0,4,1,0,6,0,0],[0,1,0,7,6,0,3,0,3,0],[2,0,2,0,3,4,0,1,0,0]],"region":[[1,5,5,9,9,13,13,13,15,15],[1,1,5,5,9,9,9,9,15,17],[1,1,6,5,5,6,6,15,15,17],[1,1,6,6,6,6,11,15,17,17],[2,2,7,7,7,11,11,12,17,16],[3,3,7,7,11,11,12,12,17,16],[4,3,7,7,12,12,12,12,16,16],[4,3,3,10,10,10,10,16,16,18],[4,3,3,8,8,8,14,14,18,18],[4,4,8,8,8,8,14,14,18,19]],"label":140},{"M":10,"N":10,"hint":[[2,0,0,5,0,5,1,4,6,1],[4,0,7,3,7,3,0,3,0,0],[0,0,1,0,1,0,1,0,7,3],[6,2,0,6,0,2,0,5,0,0],[0,7,0,0,3,0,1,0,0,6],[4,0,5,4,0,4,0,0,1,4],[0,0,1,0,5,0,0,6,0,2],[0,4,0,0,0,3,0,0,5,0],[1,2,0,5,7,5,0,0,2,4],[3,6,1,0,4,0,6,5,0,6]],"region":[[1,1,1,8,8,10,10,13,13,18],[1,1,1,8,8,10,10,13,13,18],[2,2,1,8,9,10,13,13,15,17],[2,2,2,8,10,10,14,14,15,17],[3,2,2,8,11,11,14,14,15,17],[3,3,6,6,6,11,14,15,15,17],[4,3,6,7,11,11,14,15,17,17],[4,4,6,7,11,12,12,15,17,19],[5,4,6,7,11,12,12,16,16,16],[4,4,7,7,12,12,12,16,16,16]],"label":141},{"M":10,"N":10,"hint":[[4,0,7,2,6,0,1,5,0,1],[0,0,4,0,0,5,7,0,7,4],[0,3,0,0,0,0,3,1,0,2],[0,0,0,0,0,5,0,4,0,0],[2,3,7,5,7,0,1,3,0,2],[1,0,0,0,0,0,0,4,0,0],[4,5,0,0,6,0,5,0,6,1],[0,0,2,0,0,1,6,0,3,0],[3,0,5,0,2,0,0,7,5,1],[4,0,0,6,0,5,2,0,0,3]],"region":[[1,1,1,1,11,11,11,17,17,17],[1,4,4,1,11,11,11,18,17,17],[1,4,5,5,12,14,11,18,17,17],[2,4,5,5,12,12,12,18,18,18],[2,5,5,10,10,10,12,15,15,19],[2,5,7,10,10,15,12,15,19,19],[2,2,2,10,10,15,15,15,19,19],[3,6,8,8,13,13,13,13,13,19],[3,3,3,8,9,9,13,13,16,16],[3,3,9,9,9,9,16,16,16,16]],"label":142},{"M":8,"N":8,"hint":[[5,0,0,3,0,0,0,0],[0,0,0,0,5,4,0,3],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1],[0,0,3,1,0,0,0,3],[0,0,0,0,0,0,0,0],[0,2,0,0,0,0,0,0],[0,0,1,0,0,4,2,0]],"region":[[1,1,2,2,3,3,3,3],[1,1,4,2,2,2,5,3],[1,4,4,4,6,5,5,5],[7,8,4,6,6,6,9,5],[7,8,8,10,6,9,9,9],[7,8,10,10,10,11,9,12],[7,8,13,10,11,11,11,12],[7,13,13,13,13,11,12,12]],"label":143},{"M":9,"N":9,"hint":[[7,1,0,1,0,6,0,0,4],[0,2,3,0,5,0,3,0,3],[1,0,7,4,0,2,0,5,0],[0,0,0,0,6,0,0,0,3],[6,0,3,2,0,0,0,0,0],[2,5,0,0,0,0,0,2,0],[0,0,1,0,4,0,4,0,1],[5,7,0,3,0,7,0,5,0],[1,0,0,0,1,0,4,6,1]],"region":[[1,5,1,1,11,11,11,15,15],[1,1,1,1,11,11,11,15,15],[2,6,8,8,8,8,13,13,13],[2,6,6,9,9,8,8,8,13],[2,2,6,6,9,9,14,14,13],[2,2,7,7,7,9,9,14,14],[3,7,7,7,7,12,12,14,14],[3,3,3,10,10,10,12,12,12],[4,4,3,3,3,10,10,10,10]],"label":144},{"M":6,"N":6,"hint":[[0,0,0,0,5,0],[4,0,2,0,0,4],[3,0,3,0,0,0],[0,0,0,0,0,0],[0,0,3,0,0,0],[1,0,0,0,0,4]],"region":[[1,3,5,5,5,5],[1,3,3,3,3,5],[1,1,6,6,6,8],[2,4,4,6,6,8],[2,2,4,7,7,7],[2,2,4,4,7,7]],"label":145},{"M":8,"N":8,"hint":[[5,0,3,2,0,5,0,2],[0,0,0,0,3,0,0,0],[2,0,0,6,0,0,0,3],[0,1,4,0,0,0,2,0],[5,0,0,0,0,6,0,4],[0,1,0,0,5,0,0,0],[2,0,2,3,0,0,0,0],[3,0,4,0,6,1,0,5]],"region":[[1,1,1,6,9,9,9,9],[1,1,2,6,6,9,11,11],[2,2,2,3,6,9,11,11],[2,3,3,3,7,7,11,12],[3,3,4,7,7,10,10,12],[4,4,4,7,10,10,10,12],[4,4,5,7,10,8,8,12],[5,5,5,8,8,8,8,12]],"label":146},{"M":10,"N":10,"hint":[[3,0,1,0,0,4,2,7,0,4],[0,0,5,0,7,0,0,0,6,0],[2,0,6,1,0,0,7,0,4,2],[0,0,4,0,5,0,2,0,0,5],[4,0,0,0,0,0,4,0,0,3],[6,0,7,3,1,0,0,0,6,4],[2,3,0,6,0,0,6,0,3,0],[7,0,0,0,3,1,0,2,1,2],[0,4,0,4,6,0,0,0,4,0],[3,0,2,5,0,3,1,2,0,0]],"region":[[1,1,1,1,8,11,11,13,13,13],[2,1,1,1,8,12,11,11,13,13],[2,2,2,2,8,12,12,11,16,13],[2,2,6,6,8,8,12,14,16,13],[3,3,6,6,8,8,12,14,16,16],[4,3,6,6,6,12,12,14,17,17],[4,3,3,7,9,9,10,14,17,17],[4,5,5,7,9,9,10,14,17,17],[4,4,7,7,9,9,10,15,15,15],[4,4,7,7,10,10,10,10,15,15]],"label":147},{"M":10,"N":10,"hint":[[1,0,5,0,3,0,5,0,0,6],[3,0,0,4,6,7,0,0,2,4],[6,1,0,0,3,0,0,4,3,0],[2,0,0,4,0,2,0,0,7,1],[3,4,0,0,0,5,0,3,0,0],[0,0,5,0,0,0,1,0,4,5],[3,0,0,0,3,0,5,0,0,2],[1,0,6,4,0,6,0,2,4,5],[0,0,0,3,0,0,0,0,3,0],[2,0,4,0,1,5,3,7,0,6]],"region":[[1,1,1,8,8,8,11,11,15,15],[1,1,1,8,8,8,11,11,15,15],[2,2,7,9,9,8,11,14,15,15],[3,2,7,9,9,11,11,14,15,16],[3,2,7,9,10,10,10,14,16,16],[3,2,2,9,10,12,12,14,16,16],[4,4,2,10,10,6,14,14,16,17],[4,4,4,10,6,6,14,13,17,17],[4,6,6,6,6,13,13,13,17,17],[5,5,5,5,5,13,13,13,17,17]],"label":148},{"M":10,"N":10,"hint":[[6,2,5,3,0,7,0,7,2,0],[5,4,0,2,1,0,3,0,0,1],[3,0,3,0,5,0,2,0,0,7],[0,4,2,6,0,0,0,4,0,4],[1,5,0,0,1,4,0,2,6,2],[7,0,6,0,3,0,3,0,3,0],[0,4,0,0,0,5,2,0,0,0],[0,0,0,7,2,0,0,5,0,5],[0,0,4,0,4,7,0,0,6,0],[5,0,0,0,6,0,5,0,3,2]],"region":[[1,6,6,6,6,6,6,8,17,17],[1,6,8,8,8,8,8,8,17,18],[1,1,9,9,11,11,11,11,17,18],[1,1,9,9,9,11,11,11,17,18],[2,2,9,9,12,12,12,12,18,18],[2,2,2,2,2,12,12,14,18,18],[3,4,4,4,4,13,13,15,15,15],[4,4,5,5,5,13,13,15,15,16],[5,5,5,10,10,10,13,13,13,16],[5,7,7,10,10,10,10,16,16,16]],"label":149},{"M":8,"N":8,"hint":[[0,0,0,0,0,0,4,0],[2,4,0,0,0,0,0,0],[0,0,0,5,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1],[2,5,0,0,0,3,0,0],[0,0,1,0,2,0,0,0],[0,0,0,5,0,0,0,0]],"region":[[13,13,11,12,12,14,14,14],[13,11,11,11,12,12,10,14],[7,7,11,8,12,10,10,10],[7,7,8,8,9,9,10,4],[7,5,8,8,6,9,9,4],[5,5,5,6,6,6,3,4],[1,5,2,2,6,3,3,4],[1,1,2,2,2,3,3,4]],"label":150},{"M":9,"N":9,"hint":[[4,0,2,0,0,1,0,0,3],[0,6,5,0,4,2,0,0,5],[4,0,1,3,0,0,4,2,0],[0,3,0,6,0,0,0,5,4],[0,0,0,0,0,0,3,0,1],[6,0,3,5,0,0,1,0,3],[0,1,0,0,0,0,0,2,1],[3,0,7,0,5,0,0,6,0],[0,6,3,2,0,3,5,0,5]],"region":[[1,1,1,1,10,10,10,14,14],[2,3,3,3,10,10,12,14,13],[3,3,5,5,7,7,12,14,13],[3,3,5,5,7,12,12,14,13],[4,5,5,7,7,12,13,13,13],[4,4,7,7,8,8,11,11,15],[4,6,6,8,8,11,11,15,15],[4,6,6,6,11,11,9,15,15],[4,6,6,9,9,9,9,15,15]],"label":151},{"M":8,"N":8,"hint":[[3,4,0,5,0,1,0,3],[1,5,0,3,0,5,0,2],[0,0,1,0,1,0,4,0],[5,3,0,0,0,0,0,5],[0,1,0,0,0,0,2,0],[4,0,0,0,0,0,0,6],[5,0,0,0,2,0,0,3],[4,0,0,1,0,0,0,1]],"region":[[1,1,1,7,9,9,12,12],[2,1,1,7,7,9,9,12],[2,5,5,5,7,7,9,12],[3,5,5,5,8,8,9,13],[3,3,3,8,8,8,13,13],[3,3,6,6,10,10,13,13],[4,4,6,6,10,10,10,13],[4,4,4,6,11,11,11,11]],"label":152},{"M":8,"N":8,"hint":[[2,0,3,0,0,3,4,1],[0,0,4,0,2,0,0,3],[0,5,0,0,3,0,0,0],[1,0,4,0,0,0,2,0],[0,3,0,0,0,0,0,1],[1,0,1,0,1,0,0,0],[5,3,0,2,0,4,0,0],[0,0,4,0,3,0,0,5]],"region":[[1,4,4,7,9,9,12,12],[1,1,4,4,9,9,12,12],[2,2,4,4,8,9,12,14],[2,2,6,6,8,10,10,13],[2,2,6,6,8,10,10,13],[3,3,6,8,8,10,11,13],[3,3,6,5,5,11,11,13],[3,5,5,5,5,11,13,13]],"label":153},{"M":8,"N":8,"hint":[[0,0,0,0,0,0,0,0],[2,0,0,4,0,0,2,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,4,0,0],[0,0,0,5,0,5,0,0],[0,4,0,0,0,0,0,0],[0,0,0,0,3,1,0,4],[5,1,0,0,0,0,0,0]],"region":[[9,13,13,13,13,12,12,11],[9,10,10,13,12,12,11,11],[9,9,10,10,12,8,8,11],[4,9,6,10,8,8,7,11],[4,5,6,6,8,7,7,7],[4,5,5,6,6,3,3,7],[4,4,5,5,2,2,3,3],[1,1,1,1,1,2,2,3]],"label":154},{"M":8,"N":8,"hint":[[3,0,1,0,0,0,2,1],[0,0,0,6,0,1,3,0],[3,0,3,0,0,0,0,2],[0,5,0,1,0,0,5,0],[4,0,0,0,0,0,0,0],[0,6,0,0,0,0,3,0],[3,0,2,0,5,0,0,1],[0,4,0,0,1,0,3,0]],"region":[[1,1,1,1,1,1,10,10],[2,2,2,2,6,6,10,10],[2,2,6,6,6,10,10,12],[3,5,5,5,9,9,9,12],[3,3,3,5,5,9,9,12],[4,4,7,8,5,11,11,11],[4,4,7,8,8,11,11,13],[4,4,7,7,8,8,8,13]],"label":155},{"M":8,"N":8,"hint":[[5,3,0,3,0,0,0,0],[0,4,0,0,0,6,0,4],[6,0,0,1,3,0,0,0],[4,0,0,0,0,2,0,0],[0,0,0,0,0,3,0,1],[0,0,1,2,0,4,0,0],[2,0,4,0,0,0,0,0],[1,0,0,2,0,1,0,4]],"region":[[1,1,1,7,10,10,14,14],[1,1,1,7,7,7,14,14],[2,2,2,8,8,7,7,11],[2,2,2,8,8,8,11,11],[3,3,3,3,3,11,11,12],[3,4,4,9,9,9,12,12],[4,4,4,9,9,12,12,13],[5,6,6,6,6,13,13,13]],"label":156},{"M":10,"N":10,"hint":[[0,3,5,0,2,0,5,1,0,2],[4,0,2,7,0,4,0,0,3,0],[0,0,1,0,6,0,0,0,6,5],[3,2,0,2,0,0,0,1,0,1],[0,6,0,0,0,6,7,0,4,0],[1,5,2,0,1,0,1,0,0,0],[7,0,0,6,0,3,0,7,0,5],[6,2,0,2,0,0,0,0,6,0],[0,5,0,0,3,0,5,0,0,2],[2,0,0,2,0,1,6,4,1,6]],"region":[[1,1,7,7,7,11,14,14,17,17],[1,1,1,1,7,7,14,14,17,17],[2,5,5,1,10,10,10,14,14,17],[2,2,5,5,10,10,10,16,18,18],[2,2,2,5,5,5,10,16,16,18],[2,6,8,8,8,12,12,16,19,19],[3,6,6,6,6,12,12,12,12,19],[3,6,6,9,9,13,15,15,12,19],[3,3,3,3,9,13,15,15,15,19],[4,4,4,3,9,9,9,9,15,19]],"label":157},{"M":10,"N":10,"hint":[[4,0,7,0,2,4,0,5,0,0],[5,0,5,0,6,0,3,0,2,0],[0,1,0,1,0,1,5,0,6,3],[6,0,7,0,0,0,0,0,0,4],[1,0,0,5,2,0,4,1,0,6],[0,4,2,0,0,6,0,3,5,0],[3,0,6,1,0,0,1,0,0,1],[0,0,0,4,0,4,0,7,4,0],[0,2,3,6,3,0,0,0,5,0],[4,0,1,0,0,2,0,2,0,3]],"region":[[1,1,7,8,8,11,11,11,11,11],[1,1,7,7,8,8,8,16,16,16],[1,4,4,7,9,9,8,8,12,16],[1,1,4,7,7,9,12,12,12,16],[2,4,4,5,7,9,12,12,12,16],[2,4,4,5,5,9,13,13,17,17],[2,5,5,5,5,9,14,13,17,17],[2,6,6,6,6,9,14,13,13,17],[2,3,3,3,6,6,14,15,13,13],[3,3,3,3,10,6,15,15,15,15]],"label":158},{"M":10,"N":10,"hint":[[1,0,0,3,0,0,5,4,0,0],[2,0,0,0,6,0,6,3,7,6],[0,7,2,3,0,3,0,1,4,0],[5,0,0,0,4,0,4,0,0,0],[4,3,0,2,0,7,1,0,0,2],[6,0,1,0,1,0,0,5,4,0],[7,3,0,4,0,7,0,2,0,1],[0,0,0,1,5,0,4,0,5,2],[5,4,0,3,0,0,3,7,6,0],[6,0,1,0,7,0,0,2,0,3]],"region":[[1,4,4,4,4,12,12,12,12,15],[1,1,7,7,4,12,12,15,15,15],[2,1,7,7,4,9,9,9,15,15],[2,1,1,8,9,9,13,13,13,15],[2,5,1,8,8,13,13,16,13,13],[2,5,5,5,10,10,10,16,16,16],[2,2,2,5,5,5,10,10,10,16],[3,6,6,6,11,11,11,17,17,17],[3,3,3,6,6,14,11,11,17,17],[3,3,3,6,6,14,11,11,17,17]],"label":159},{"M":8,"N":8,"hint":[[0,0,0,3,0,0,2,0],[4,0,0,0,0,0,0,0],[0,2,0,0,0,0,0,0],[0,1,5,0,0,1,5,0],[0,2,0,0,0,0,0,0],[0,0,0,0,4,0,0,4],[0,0,0,0,0,3,0,0],[0,5,0,0,0,5,0,0]],"region":[[13,13,13,10,11,11,12,12],[13,9,9,10,11,11,12,12],[9,9,10,10,11,8,8,12],[9,7,7,10,5,5,8,8],[4,4,7,7,5,6,6,8],[1,4,4,7,5,3,6,6],[1,1,4,2,5,3,3,6],[1,1,2,2,2,2,3,3]],"label":160},{"M":10,"N":10,"hint":[[5,2,1,0,1,0,7,3,0,2],[3,6,0,7,0,0,1,0,1,3],[0,0,3,0,6,4,0,2,4,0],[0,4,0,4,0,0,0,1,0,6],[5,0,5,0,0,0,6,0,5,0],[0,1,0,6,4,1,0,2,0,1],[4,0,0,0,0,5,0,6,0,0],[0,5,3,1,0,4,0,1,4,0],[2,7,4,0,5,0,5,0,5,6],[3,0,0,6,0,4,3,6,0,2]],"region":[[1,1,1,1,8,8,8,8,15,15],[1,1,6,1,9,9,9,8,15,15],[2,2,6,6,6,9,8,8,15,14],[3,2,7,6,6,9,9,14,14,14],[3,2,7,7,7,7,9,14,14,12],[3,2,2,7,7,11,11,11,14,12],[3,4,4,4,4,12,12,12,12,12],[3,5,4,4,4,13,13,13,16,16],[3,5,5,5,10,13,13,10,16,16],[3,5,5,5,10,10,10,10,16,16]],"label":161},{"M":8,"N":8,"hint":[[3,2,0,0,0,1,5,2],[1,0,3,0,5,6,0,3],[4,0,0,0,3,0,0,0],[1,0,0,0,0,0,0,0],[0,3,4,0,0,6,0,3],[4,0,0,0,0,3,0,0],[6,0,4,0,0,0,0,0],[3,1,0,2,4,3,0,5]],"region":[[1,1,4,6,6,6,11,11],[1,1,4,6,6,6,11,11],[1,4,4,7,7,7,7,11],[2,2,2,8,8,7,7,12],[2,2,2,8,8,8,8,12],[3,3,3,3,10,10,10,12],[3,5,5,9,10,10,12,12],[3,5,5,9,9,9,9,9]],"label":162},{"M":8,"N":8,"hint":[[0,4,0,0,1,0,0,5],[3,0,0,0,0,2,0,4],[0,5,0,0,0,0,1,0],[3,0,1,0,3,5,0,5],[0,6,0,5,0,1,0,4],[5,0,0,0,2,0,6,0],[0,0,0,4,0,0,0,1],[0,0,0,1,0,0,6,0]],"region":[[1,1,1,1,1,9,9,9],[2,2,2,2,9,9,12,12],[3,6,6,6,6,6,12,12],[3,6,7,7,7,10,10,13],[3,3,7,7,7,10,11,13],[3,3,8,8,10,10,11,13],[4,4,8,8,8,11,11,13],[5,4,4,4,11,11,13,13]],"label":163},{"M":10,"N":10,"hint":[[0,2,0,0,0,1,4,1,0,4],[0,0,4,0,0,5,0,6,0,0],[6,0,0,0,0,0,0,0,3,0],[5,0,4,2,0,3,6,5,0,0],[0,7,0,0,5,0,2,0,0,4],[2,0,2,0,0,0,0,0,0,3],[0,0,0,3,2,0,1,0,2,0],[4,3,4,6,1,5,0,7,1,4],[0,0,1,0,0,4,2,0,0,0],[0,4,0,6,7,0,6,0,2,4]],"region":[[1,2,2,8,10,10,10,15,15,18],[2,2,8,8,8,10,10,16,18,18],[2,4,4,9,10,10,13,16,18,19],[2,4,5,9,11,13,13,16,18,19],[2,5,5,9,11,13,13,16,18,19],[3,5,5,6,11,11,13,16,19,19],[3,5,6,6,11,11,14,16,17,17],[3,5,6,6,7,7,14,16,17,17],[3,6,6,7,7,14,14,17,17,12],[3,7,7,7,12,12,12,12,12,12]],"label":164},{"M":10,"N":10,"hint":[[1,0,2,3,0,5,1,0,2,3],[0,0,0,5,0,0,0,3,5,0],[3,0,6,0,2,0,4,0,2,0],[0,0,0,1,0,1,0,6,0,4],[0,2,6,0,0,0,3,5,0,5],[6,4,0,0,0,4,1,0,7,0],[0,0,5,0,0,0,0,0,0,4],[0,3,0,1,4,0,2,0,6,2],[2,0,4,0,0,0,0,0,0,0],[1,3,0,3,6,1,2,3,0,7]],"region":[[1,1,7,7,7,12,12,12,12,12],[1,1,1,7,10,12,12,15,15,15],[2,5,1,7,10,10,14,15,15,15],[2,5,5,7,7,10,14,14,14,15],[2,2,5,5,5,10,14,14,17,17],[3,2,2,9,9,13,13,16,17,17],[3,3,6,6,9,13,13,16,16,17],[3,6,6,6,6,6,13,13,16,17],[3,3,8,8,8,11,11,13,16,17],[4,3,8,8,11,11,11,11,16,16]],"label":165},{"M":10,"N":10,"hint":[[0,6,5,0,6,0,5,0,0,5],[4,0,3,0,2,1,4,0,3,1],[0,7,0,6,0,0,6,0,2,0],[2,0,5,0,0,5,0,0,0,4],[1,0,0,7,3,0,0,0,5,0],[0,5,0,5,0,0,0,1,0,1],[0,0,3,0,1,0,3,0,0,5],[4,0,0,4,0,5,2,0,2,3],[3,0,0,6,3,4,0,3,4,0],[2,0,4,0,1,0,5,0,1,7]],"region":[[1,1,6,6,10,10,10,10,14,14],[1,1,6,6,6,10,10,10,14,17],[1,1,7,7,7,7,14,14,14,17],[1,2,7,9,9,9,9,9,17,17],[2,2,7,3,11,11,11,12,17,17],[2,2,7,3,11,11,11,12,15,15],[3,3,3,3,11,12,12,12,15,16],[3,5,5,5,5,12,13,15,15,16],[4,5,8,5,5,13,13,13,16,16],[4,4,8,8,8,13,13,16,16,16]],"label":166},{"M":10,"N":10,"hint":[[5,2,6,4,0,2,0,6,0,3],[0,1,0,0,0,0,1,0,0,0],[3,0,0,0,0,2,6,0,7,4],[0,1,5,0,0,1,0,0,1,0],[3,0,2,1,3,0,6,2,0,5],[0,6,3,0,5,0,7,0,7,1],[7,5,0,1,0,3,2,0,0,2],[3,2,0,0,7,0,7,6,4,0],[0,6,1,0,0,0,0,2,7,3],[2,7,0,6,0,1,6,1,0,4]],"region":[[1,1,1,7,7,7,7,14,14,16],[1,1,1,7,9,7,7,14,14,16],[1,5,5,8,10,10,10,10,14,16],[2,2,5,8,10,10,11,11,14,16],[2,2,5,8,8,10,11,11,14,15],[2,2,5,5,8,11,11,11,15,15],[2,3,3,5,8,12,12,12,15,15],[3,3,6,6,8,12,12,12,15,15],[3,6,6,6,6,4,12,13,13,13],[4,4,4,4,4,4,13,13,13,13]],"label":167},{"M":8,"N":8,"hint":[[0,0,5,0,1,0,0,0],[0,0,0,0,0,0,0,4],[0,0,2,0,0,0,0,0],[0,0,0,0,0,0,0,3],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,5],[2,0,0,0,0,0,0,1],[0,0,3,1,0,3,0,4]],"region":[[3,3,3,3,2,1,1,1],[5,3,4,2,2,2,1,1],[5,4,4,4,2,8,7,6],[5,5,4,8,8,8,6,6],[5,10,10,10,9,8,6,6],[10,10,12,9,9,9,11,11],[14,12,12,12,9,13,11,11],[14,14,12,13,13,13,13,11]],"label":168},{"M":10,"N":10,"hint":[[2,0,3,5,0,0,3,0,0,1],[3,1,0,0,6,0,1,4,0,0],[0,0,5,0,3,0,0,7,0,1],[1,3,0,0,0,0,3,0,3,0],[5,4,5,0,7,0,6,1,0,6],[0,7,0,0,0,4,0,3,0,0],[1,3,0,0,1,0,1,0,4,0],[0,2,0,0,7,0,5,0,2,0],[5,0,6,3,0,0,0,0,1,3],[2,3,0,0,6,0,7,2,0,0]],"region":[[1,1,1,1,1,10,10,10,16,16],[2,2,6,6,1,10,10,10,16,16],[3,2,2,6,6,11,11,14,14,14],[3,5,2,2,6,11,11,15,15,14],[3,5,5,6,6,11,11,15,15,14],[3,3,5,9,9,9,9,9,14,14],[4,3,5,9,9,12,12,12,12,18],[4,3,7,7,7,13,13,13,12,12],[4,4,4,8,7,7,13,13,17,17],[4,4,8,8,7,7,13,13,17,17]],"label":169},{"M":10,"N":10,"hint":[[5,6,0,7,2,1,7,0,1,5],[3,0,2,3,0,0,5,3,0,6],[1,0,1,0,0,3,0,2,0,2],[3,0,0,2,0,0,0,0,1,0],[0,0,5,0,5,0,0,5,0,3],[2,0,0,0,0,1,0,0,0,1],[0,6,0,7,0,0,0,0,0,4],[1,2,5,0,6,2,0,1,0,6],[7,0,7,0,7,3,4,0,0,5],[5,3,0,3,1,0,0,0,0,2]],"region":[[1,1,1,5,10,10,10,16,17,17],[1,1,1,5,8,10,10,16,16,17],[2,2,5,5,8,10,10,12,16,17],[2,2,5,5,8,11,12,12,16,17],[3,2,2,5,8,11,12,12,16,17],[3,4,2,7,8,11,13,13,18,18],[3,4,4,8,8,11,11,13,18,18],[3,4,4,9,9,9,14,13,18,18],[3,4,4,9,9,9,14,14,18,14],[3,3,6,6,6,9,15,14,14,14]],"label":170},{"M":10,"N":10,"hint":[[0,0,2,0,4,0,6,0,4,5],[0,4,3,5,1,2,0,7,0,1],[2,6,2,0,6,0,0,0,6,0],[0,3,0,3,0,1,0,5,0,0],[1,0,1,0,0,0,3,0,4,2],[0,2,0,2,4,0,0,0,3,0],[4,0,3,7,0,2,0,2,0,0],[0,0,0,4,0,0,6,0,0,7],[6,0,7,0,6,0,0,2,3,2],[3,1,0,4,0,5,3,4,0,1]],"region":[[1,5,5,5,5,10,10,10,10,10],[1,1,1,8,5,11,11,15,15,10],[2,6,1,8,5,5,11,15,15,15],[2,6,1,8,8,8,11,16,15,15],[2,6,6,6,7,8,11,16,16,16],[2,7,6,6,7,12,11,17,16,16],[2,7,7,7,7,12,12,17,16,14],[3,3,3,3,3,9,12,12,12,14],[4,4,4,9,9,9,13,13,12,14],[4,4,4,4,9,9,14,14,14,14]],"label":171},{"M":10,"N":10,"hint":[[0,6,0,1,4,7,0,2,0,7],[0,0,0,0,0,3,6,5,0,0],[1,5,0,2,1,0,4,0,6,5],[4,7,1,0,6,0,0,2,0,3],[0,0,2,3,0,0,7,0,4,0],[6,0,1,0,0,0,0,0,0,0],[2,0,0,3,0,5,0,5,0,0],[0,1,5,0,6,0,0,3,7,1],[5,0,6,0,0,3,0,0,0,2],[1,2,0,2,1,0,1,6,0,3]],"region":[[1,5,5,5,10,10,12,12,16,16],[1,1,5,5,10,10,12,12,15,16],[2,6,5,5,10,12,12,12,15,16],[2,6,7,7,10,10,15,15,15,16],[2,6,6,7,11,11,11,15,15,16],[2,6,6,7,7,11,11,11,17,16],[2,2,6,8,9,13,13,11,17,18],[3,3,8,8,9,14,13,13,17,18],[3,3,8,9,9,14,14,13,17,17],[4,3,8,8,9,9,14,13,17,17]],"label":172},{"M":9,"N":9,"hint":[[0,2,0,0,5,0,0,0,6],[1,0,5,0,0,0,0,2,0],[0,3,0,6,0,0,0,0,5],[6,0,1,0,0,3,0,4,6],[1,0,0,0,0,0,0,0,5],[0,2,0,7,0,5,0,4,2],[3,0,5,0,1,0,0,0,0],[0,4,2,0,6,0,6,0,2],[6,0,7,5,0,3,2,4,0]],"region":[[1,1,1,1,10,10,10,10,10],[2,2,5,1,10,8,8,12,12],[3,2,5,8,8,8,8,12,12],[3,2,5,5,5,5,5,12,13],[3,2,6,6,6,6,11,13,13],[3,3,3,6,6,6,11,13,13],[4,4,7,7,7,11,11,13,13],[4,4,7,7,11,11,9,9,14],[4,4,4,9,9,9,9,9,14]],"label":173},{"M":10,"N":10,"hint":[[2,3,0,0,3,0,0,1,4,0],[5,0,0,5,4,0,4,0,0,3],[3,0,1,0,2,0,0,7,6,0],[0,0,5,0,6,0,0,1,0,4],[2,0,0,1,0,7,0,0,5,0],[0,4,0,2,0,6,2,0,1,2],[0,0,3,6,0,0,3,7,0,6],[0,0,2,0,0,7,0,1,0,2],[4,0,0,5,4,0,0,5,0,4],[2,5,1,0,0,0,1,0,3,0]],"region":[[1,1,1,6,6,6,12,12,13,13],[2,6,6,6,2,12,12,12,13,16],[2,2,2,2,2,13,13,13,13,16],[3,3,3,8,8,10,10,10,16,16],[3,3,3,8,8,10,14,14,14,17],[4,3,8,8,8,10,14,14,17,17],[4,7,7,7,10,10,9,14,15,15],[4,7,7,9,9,9,9,14,15,18],[5,5,7,9,11,11,11,15,15,18],[5,5,5,9,11,11,15,15,18,18]],"label":174},{"M":8,"N":8,"hint":[[3,0,0,0,0,0,0,2],[0,0,5,0,0,0,0,0],[0,1,0,0,4,0,3,0],[4,0,0,0,0,0,0,0],[0,0,0,0,0,0,2,0],[0,0,3,0,0,0,0,0],[0,0,0,0,0,0,0,4],[4,0,0,0,0,0,0,0]],"region":[[2,2,2,2,1,1,1,1],[2,5,4,4,4,4,3,1],[5,5,5,6,4,3,3,3],[9,5,8,6,6,6,3,7],[9,8,8,8,10,6,7,7],[9,9,8,10,10,10,11,7],[9,13,13,12,10,11,11,7],[13,13,12,12,12,12,11,11]],"label":175},{"M":10,"N":10,"hint":[[0,3,0,0,0,7,0,5,0,0],[5,0,1,6,0,0,3,2,0,4],[0,0,5,2,0,2,0,4,5,0],[3,0,6,0,0,0,1,0,0,3],[6,2,0,0,1,0,0,0,6,0],[0,5,0,7,0,0,4,0,5,4],[2,0,2,3,4,0,1,0,3,0],[0,0,0,0,2,0,0,0,0,4],[4,0,5,4,0,1,3,0,3,0],[2,1,0,3,7,0,7,6,1,4]],"region":[[1,1,7,7,11,11,11,11,15,16],[1,1,7,7,11,11,11,15,15,16],[2,1,7,7,7,12,12,12,12,16],[2,6,6,6,6,12,12,12,16,16],[2,2,6,6,9,9,9,13,17,17],[3,2,2,9,9,9,9,13,17,17],[3,3,4,10,10,13,13,13,17,17],[4,4,4,10,10,10,13,13,18,18],[4,4,8,8,8,8,14,14,18,18],[5,5,8,8,8,14,14,14,14,14]],"label":176},{"M":10,"N":10,"hint":[[1,0,5,2,0,5,0,1,3,6],[5,0,3,0,0,0,3,2,0,2],[2,0,2,0,5,0,0,7,1,0],[1,3,0,7,0,0,2,0,5,2],[0,5,0,0,0,6,0,0,4,0],[4,6,7,0,5,0,0,0,0,0],[0,2,0,1,0,1,0,1,0,1],[5,0,4,0,5,0,2,0,7,0],[1,0,0,0,0,0,0,0,3,1],[2,7,4,0,1,7,6,5,4,0]],"region":[[1,4,4,4,8,9,9,9,17,17],[1,1,1,4,9,9,13,9,17,17],[2,2,1,4,10,10,13,14,17,17],[2,5,5,4,10,10,13,14,14,14],[2,5,5,4,10,10,11,11,14,14],[2,5,5,7,7,10,11,12,14,18],[2,5,3,7,6,11,11,12,18,18],[2,3,3,7,6,11,12,12,16,16],[3,3,7,7,6,11,12,15,16,16],[3,6,6,6,6,12,12,16,16,16]],"label":177},{"M":8,"N":8,"hint":[[0,2,0,2,0,0,0,0],[0,0,0,0,0,0,4,0],[0,0,5,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,3,0,0,0,0,0,5],[0,0,0,0,0,0,0,0],[0,0,0,0,0,4,0,0],[0,2,0,5,0,0,0,3]],"region":[[1,1,2,2,2,2,3,4],[1,1,2,5,6,6,6,4],[1,7,7,5,6,6,8,4],[7,7,5,5,5,8,8,8],[9,7,10,10,11,11,11,8],[9,10,10,11,11,12,13,13],[9,9,10,14,12,12,13,13],[9,14,14,14,14,12,12,13]],"label":178},{"M":8,"N":8,"hint":[[0,0,0,0,0,0,0,0],[0,0,0,0,0,3,0,1],[0,2,0,0,2,4,0,0],[3,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[3,0,0,0,0,3,0,5],[5,0,0,0,0,1,0,0]],"region":[[1,1,2,2,3,3,3,3],[1,1,4,2,2,2,5,3],[6,4,4,4,7,5,5,5],[6,6,4,7,7,7,5,8],[9,6,6,10,7,11,8,8],[9,12,10,10,10,11,11,8],[9,12,12,10,11,11,13,8],[9,9,12,12,13,13,13,13]],"label":179},{"M":10,"N":10,"hint":[[2,1,0,0,0,3,0,0,0,5],[6,3,4,0,5,0,0,0,1,0],[0,1,0,6,0,0,3,0,0,3],[6,3,0,1,0,0,0,4,0,0],[2,0,6,0,4,0,1,0,1,6],[0,3,0,2,0,0,0,7,0,0],[2,0,0,0,4,0,3,0,3,0],[0,1,2,6,0,0,0,0,0,1],[0,0,0,0,0,6,0,7,5,0],[2,0,1,2,5,0,0,2,0,4]],"region":[[1,1,1,7,7,7,12,12,12,13],[1,1,1,1,7,7,13,13,13,13],[2,2,2,8,8,8,13,14,14,16],[2,2,4,4,9,8,14,14,16,16],[2,2,4,9,9,8,14,14,16,18],[3,4,4,9,10,8,8,16,16,18],[4,4,5,9,10,11,11,16,17,18],[5,5,5,10,10,11,15,17,17,18],[5,6,6,10,10,11,15,18,18,18],[6,6,6,11,11,11,15,15,15,15]],"label":180},{"M":9,"N":9,"hint":[[5,0,4,0,6,7,0,3,6],[4,0,0,0,0,0,0,0,2],[0,1,0,0,4,0,0,6,0],[0,0,6,0,1,0,3,0,2],[1,3,0,0,4,0,0,4,0],[0,4,0,0,0,3,1,0,5],[0,3,0,2,0,0,7,0,4],[2,0,7,0,0,0,0,3,0],[1,3,6,0,5,1,6,0,4]],"region":[[1,5,5,5,5,5,13,13,13],[1,1,5,5,9,9,13,13,13],[1,1,1,7,7,9,9,15,13],[2,2,7,7,10,10,10,15,15],[2,2,7,7,11,11,10,10,15],[3,3,3,3,11,11,11,11,15],[3,6,6,6,12,12,14,11,15],[4,6,8,8,8,12,14,14,14],[4,4,8,8,8,8,14,14,14]],"label":181},{"M":10,"N":10,"hint":[[2,0,0,6,0,4,7,0,3,1],[0,7,0,3,0,0,6,0,0,5],[2,0,5,0,6,0,0,4,7,0],[1,0,7,0,7,0,0,0,2,3],[0,0,0,0,0,0,0,0,0,1],[0,4,0,0,5,0,2,1,0,4],[3,0,5,0,0,7,0,0,2,1],[0,0,3,6,4,0,5,4,3,0],[1,0,7,0,0,0,6,0,1,6],[0,2,0,3,0,4,0,4,0,0]],"region":[[1,1,1,1,1,1,1,16,16,16],[2,2,2,2,11,11,12,16,16,16],[2,2,2,7,7,7,12,12,16,18],[3,3,7,7,12,12,12,12,17,17],[3,4,7,9,9,9,15,15,17,17],[4,4,7,10,10,10,15,15,15,17],[4,6,6,6,6,10,10,10,10,19],[4,6,5,5,6,13,13,13,13,13],[4,5,5,5,6,14,14,14,14,13],[5,5,8,8,8,8,8,14,14,13]],"label":182},{"M":8,"N":8,"hint":[[0,0,1,4,5,0,1,4],[0,5,0,0,0,4,0,0],[3,0,0,0,1,0,0,5],[0,0,0,0,0,0,4,0],[2,0,0,0,4,0,0,1],[0,0,4,3,0,5,0,5],[2,1,0,0,0,0,0,0],[4,0,5,0,2,0,4,2]],"region":[[1,5,5,5,5,10,10,13],[1,1,1,1,5,10,10,13],[2,2,6,6,6,9,11,13],[3,2,2,6,6,9,11,13],[3,3,7,6,9,9,11,13],[3,3,7,7,9,11,11,12],[4,4,7,7,8,11,12,12],[4,4,7,8,8,8,12,12]],"label":183},{"M":8,"N":8,"hint":[[3,0,1,0,0,0,2,1],[0,0,0,0,0,1,3,0],[3,0,3,0,0,0,0,2],[0,5,0,1,0,0,5,0],[4,0,0,0,0,0,0,0],[0,6,0,0,0,0,3,0],[3,0,2,0,5,0,0,0],[0,4,0,0,1,0,3,0]],"region":[[1,1,1,1,1,1,10,10],[2,2,2,2,6,6,10,10],[2,2,6,6,6,10,10,12],[3,5,5,5,9,9,9,12],[3,3,3,5,5,9,9,12],[4,4,7,8,5,11,11,11],[4,4,7,8,8,11,11,13],[4,4,7,7,8,8,8,13]],"label":184},{"M":10,"N":10,"hint":[[1,4,0,3,6,0,3,1,0,2],[2,0,5,7,0,5,0,2,6,0],[0,0,0,0,6,0,7,0,0,3],[0,0,3,0,5,3,0,0,2,0],[1,0,0,0,0,0,7,0,0,5],[2,0,0,0,0,0,6,0,0,0],[0,3,6,0,4,3,0,2,0,3],[6,0,0,1,0,0,4,0,0,4],[0,1,3,0,6,0,1,7,0,0],[3,4,2,0,5,0,6,0,4,1]],"region":[[1,5,5,5,5,5,13,14,14,18],[1,1,1,1,5,5,13,13,14,18],[2,2,7,1,1,10,10,13,14,18],[3,2,7,7,10,10,10,15,14,14],[3,2,8,7,10,10,12,15,15,15],[3,2,8,9,9,12,12,16,16,15],[3,2,8,8,8,12,12,16,15,15],[3,3,6,8,8,12,12,16,16,16],[4,6,6,4,4,11,11,11,17,17],[4,4,4,4,11,11,11,11,17,17]],"label":185},{"M":10,"N":10,"hint":[[2,0,1,6,4,3,0,2,0,3],[0,5,0,0,0,0,1,0,6,0],[6,0,6,2,0,0,0,5,0,4],[0,1,0,0,0,0,0,6,0,7],[3,0,2,0,0,0,0,0,0,5],[4,0,0,1,0,0,2,0,4,0],[0,5,0,0,0,7,0,0,0,2],[2,1,7,1,3,0,2,3,0,5],[0,4,5,0,5,0,1,0,0,0],[1,0,3,0,0,3,0,2,1,2]],"region":[[1,1,6,6,6,6,6,6,14,14],[1,1,1,8,8,11,14,14,14,16],[1,2,2,8,7,11,11,14,14,16],[2,2,7,7,7,12,11,11,11,16],[2,2,7,5,5,12,12,12,12,16],[3,5,5,5,5,9,15,15,15,16],[3,5,3,3,9,9,15,13,16,16],[3,3,3,9,9,13,13,13,17,17],[4,4,4,9,9,13,13,10,17,17],[4,4,4,10,10,10,10,10,17,17]],"label":186}];

initializeEmptyGrid();
initializeSelectDropdown();
showPlayEditButtons();
initializeEvents();
initializeCellEvents();
initializeButtonStyles();
initializeModal();
initializeSpecialButtonStyles();