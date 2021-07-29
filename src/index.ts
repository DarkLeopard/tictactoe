enum PlayerSide {
    A = 'a',
    B = 'b',
}

interface Player {
    side: PlayerSide;
    isWinner: boolean;
    checkWinner: () => boolean;
    turn: (x: number, y: number) => void;
    statistic: {
        doneTurns: number;
    };
    reset: () => void;
}
interface Statistic {
    wins: number;
    winByPlayers: {
        [key in PlayerSide]: number;
    };
    noWinners: number;
    games: number;
    minTurnsToWin: number;
    maxTurnsToWin: number;
    allTurns: number;
}

type CellValue = false | PlayerSide;

const statistic: Statistic = startGame();
console.log(statistic);

function startGame(fieldSize: number = 3, times: number = 10000): Statistic {
    let field: Map<string, CellValue> = createField(fieldSize);
    const player1: Player = getNewComp(PlayerSide.A, field);
    const player2: Player = getNewComp(PlayerSide.B, field);
    const statistic: Statistic = {
        allTurns: 0,
        games: 0,
        maxTurnsToWin: 0,
        minTurnsToWin: 0,
        noWinners: 0,
        winByPlayers: {
            [PlayerSide.A]: 0,
            [PlayerSide.B]: 0,
        },
        wins: 0,
    };

    for (let i = 0; i < times; i++) {
        const gameResult: Player | null = autoGame(player1, player2, field);
        if (!!gameResult) {
            statistic.wins++;
            statistic.winByPlayers[gameResult.side]++;
            statistic.maxTurnsToWin = statistic.maxTurnsToWin > gameResult.statistic.doneTurns ? statistic.maxTurnsToWin : gameResult.statistic.doneTurns;
            statistic.minTurnsToWin = statistic.minTurnsToWin < gameResult.statistic.doneTurns ? statistic.minTurnsToWin : gameResult.statistic.doneTurns;
        } else {
            statistic.noWinners++;
        }
        statistic.games++;
        statistic.allTurns += player1.statistic.doneTurns + player2.statistic.doneTurns;

        player1.reset();
        player2.reset();
        field.forEach((value, key, map) => {
            map.set(key, false);
        })
    }

    return statistic;
}

function getRandomValue(min: number, max: number) {
    return (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min + 1)) + min;
}

function autoGame(player1: Player, player2: Player, field: Map<string, CellValue>): Player | null {
    let isGameFinished: boolean = false;
    let gameResult: Player | null = null;
    let currentPlayer: Player = player1;

    const changePlayerTurn: () => void = () => {
        currentPlayer = currentPlayer?.side === player1.side ? player2 : player1;
    }

    for (; isGameFinished === false;) {
        const emptyCells: string[] = [];
        field.forEach((value, key, map) => {
            if (map.get(key) === false) {
                emptyCells.push(key);
            }
        })
        if (emptyCells.length < 1) {
            isGameFinished = true;
            gameResult = null;
        } else {
            const r = getRandomValue(0, emptyCells.length - 1);
            const randomChoice: string[] = emptyCells[r].split('');
            const choiceX: number = Number(randomChoice[1]);
            const choiceY: number = Number(randomChoice[3]);

            currentPlayer.turn(choiceX, choiceY);
            currentPlayer.checkWinner();
            if (currentPlayer.isWinner) {
                currentPlayer.statistic.doneTurns = currentPlayer.statistic.doneTurns++;
                isGameFinished = true;
                gameResult = currentPlayer;
            } else {
                currentPlayer.statistic.doneTurns = currentPlayer.statistic.doneTurns++;
                changePlayerTurn();
            }
        }
    }

    return gameResult;
}

function getNewComp(side: PlayerSide, field: Map<string, CellValue>): Player {
    const newComp: Player = {
        side: side,
        isWinner: false,
        checkWinner: (): boolean => {
            const check: boolean = checkWinner(field, side);
            newComp.isWinner = check;
            return check;
        },
        turn: (x: number, y: number) => turn(x, y, field, side, newComp),
        statistic: {
            doneTurns: 0,
        },
        reset: () => {
            newComp.isWinner = false;
            newComp.statistic = {
                doneTurns: 0,
            }
        }
    };
    return newComp;
}

function createField(size: number): Map<string, false> {
    const field: Map<string, false> = new Map();

    for (let i = 1; i <= size; i++) {
        field.set(`x${i}y1`, false);
    }
    for (let i = 2; i <= size; i++) {
        field.forEach((value, key, map) => {
            map.set(key.split('').map((value1, index) => index === 3 ? i : value1).join(''), false);
        });
    }

    return field;
}

function turn(
    xCell: number,
    yCell: number,
    field: Map<string, CellValue>,
    cellValue: CellValue,
    player: Player
): void {
    const currentFieldValue: CellValue | undefined = field.get(`x${xCell}y${yCell}`);
    if (currentFieldValue === undefined) {
        throw Error(`Cell is undefuned!! Cell - x${xCell}y${yCell}, current cellValue - ${currentFieldValue}, new cellValue - ${cellValue}`);
    }
    if (currentFieldValue === false) {
        field.set(`x${xCell}y${yCell}`, cellValue);
        player.statistic.doneTurns++;
    } else {
        throw Error(`Cell already done! Cell - x${xCell}y${yCell}, current cellValue - ${currentFieldValue}, new cellValue - ${cellValue}`);
    }
}

function checkWinner(field: Map<string, CellValue>, winner: CellValue): boolean {
    let result: boolean = false;
    const lines: Map<number, CellValue[]> = getLinesValues(field);
    const cols: Map<number, CellValue[]> = getColsValues(field);
    const diagonalLines: Map<number, CellValue[]> = getDiagonalLines(field);

    lines.forEach((line) => {
        if (!result) {
            result = line.every((lineValue) => lineValue === winner);
        }
    })
    cols.forEach((col) => {
        if (!result) {
            result = col.every((colValue) => colValue === winner);
        }
    })
    diagonalLines.forEach((line) => {
        if (!result) {
            result = line.every((lineValue) => lineValue === winner);
        }
    })
    return result;
}

function getColsValues(field: Map<string, CellValue>): Map<number, CellValue[]> {
    const fieldSize: number = getFieldSize(field);
    const cols: Map<number, CellValue[]> = new Map<number, CellValue[]>();
    field.forEach((value, key) => {
        for (let i = 1; i <= fieldSize; i++) {
            const test: RegExp = new RegExp(`^x${i}`);
            if (test.test(key)) {
                cols.set(i, [...(cols.get(i) || []), ...[value]]);
            }
        }
    })
    return cols;
}

function getLinesValues(field: Map<string, CellValue>): Map<number, CellValue[]> {
    const fieldSize: number = getFieldSize(field);
    const lines: Map<number, CellValue[]> = new Map<number, CellValue[]>();
    field.forEach((value, key) => {
        for (let i = 1; i <= fieldSize; i++) {
            const test: RegExp = new RegExp(`y${i}$`);
            if (test.test(key)) {
                lines.set(i, [...(lines.get(i) || []), ...[value]]);
            }
        }

    })
    return lines;
}

function getDiagonalLines(field: Map<string, CellValue>): Map<number, CellValue[]> {
    const fieldSize: number = getFieldSize(field);
    const lines: Map<number, CellValue[]> = new Map<number, CellValue[]>();
    lines.set(1, []);
    lines.set(2, []);

    field.forEach((value, key) => {
        for (let i = 1; i <= fieldSize; i++) {
            const test: RegExp = new RegExp(`^x${i}y${i}$`);
            if (test.test(key)) {
                lines.set(1, [...(lines.get(1) || []), ...[value]]);
            }
        }

    })
    field.forEach((value, key) => {
        for (let x = 1, y = fieldSize; x <= fieldSize;) {
            const test: RegExp = new RegExp(`^x${x}y${y}$`);
            if (test.test(key)) {
                lines.set(2, [...(lines.get(2) || []), ...[value]]);
            }
            x++;
            y--;
        }

    })
    return lines;
}

function getFieldSize(field: Map<string, CellValue>): number {
    return Math.sqrt(field.size);
}
