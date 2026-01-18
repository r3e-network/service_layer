import { ref, computed } from 'vue';

export type TurtleColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan' | 'pink';

export interface Turtle {
    id: string;
    color: TurtleColor;
    isNew: boolean;
    isMatched: boolean;
}

export const TURTLE_COLORS: TurtleColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan', 'pink'];

const COLORS_MAP: Record<TurtleColor, string> = {
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    purple: '#8B5CF6',
    orange: '#F97316',
    cyan: '#06B6D4',
    pink: '#EC4899'
};

export type GameState = 'idle' | 'opening_box' | 'revealing_turtle' | 'moving_to_grid' | 'matching';

export function useTurtleGame() {
    const grid = ref<(Turtle | null)[]>(new Array(9).fill(null));
    const queue = ref<Turtle[]>([]);
    const winnings = ref(0);
    const isMsg = ref('');
    const isPlaying = ref(false);
    const totalOpened = ref(0);

    // Animation States
    const gameState = ref<GameState>('idle');
    const activeTurtle = ref<Turtle | null>(null); // The turtle currently being opened/moved

    // Game loop controls
    let loopTimer: any = null;

    const getColorHex = (c: TurtleColor) => COLORS_MAP[c];

    const generateTurtle = (): Turtle => ({
        id: Math.random().toString(36).substr(2, 9),
        color: TURTLE_COLORS[Math.floor(Math.random() * TURTLE_COLORS.length)],
        isNew: true,
        isMatched: false
    });

    const purchase = (amount: number) => {
        for (let i = 0; i < amount; i++) {
            queue.value.push(generateTurtle());
        }
        if (!isPlaying.value) {
            startGameLoop();
        }
    };

    const startGameLoop = () => {
        if (isPlaying.value) return;
        isPlaying.value = true;
        processStep();
    };

    const processStep = async () => {
        // 1. Check for matches first
        const matchFound = checkMatches();
        if (matchFound) {
            gameState.value = 'matching';
            await wait(1000); // Celebration time
            clearMatches();
            // Bonus logic
            queue.value.push(generateTurtle());
            isMsg.value = "Match! +1 Bonus Box";
            winnings.value += 0.1;
            setTimeout(() => isMsg.value = '', 1500);

            loopTimer = setTimeout(processStep, 500);
            return;
        }

        // 2. If no matches, try to open next box
        const emptyIndex = grid.value.findIndex(t => t === null);

        // Condition: Must have space AND have items in queue
        if (emptyIndex !== -1 && queue.value.length > 0) {
            const nextTurtle = queue.value.shift();
            if (nextTurtle) {
                totalOpened.value++;

                // --- Animation Sequence ---
                activeTurtle.value = nextTurtle;

                // Step A: Show Blind Box
                gameState.value = 'opening_box';
                await wait(600); // Box appears and shakes

                // Step B: Reveal Turtle
                gameState.value = 'revealing_turtle';
                await wait(800); // Turtle shown clearly

                // Step C: Move to Grid
                gameState.value = 'moving_to_grid';
                await wait(400); // Fly animation duration

                // Finalize placement
                grid.value[emptyIndex] = nextTurtle;
                activeTurtle.value = null; // Clear modal

                loopTimer = setTimeout(processStep, 300); // Short pause before next
                return;
            }
        }

        // 3. Game Over / Idle State
        if (queue.value.length === 0) {
            isPlaying.value = false;
            gameState.value = 'idle';
            isMsg.value = "All boxes opened!";
        } else if (grid.value.every(t => t !== null)) {
            // Grid full
            isMsg.value = "Board Full! Clearing...";
            await wait(1000);
            grid.value = new Array(9).fill(null);
            loopTimer = setTimeout(processStep, 500);
        } else {
            // Should not happen, but fallback
            loopTimer = setTimeout(processStep, 500);
        }
    };

    // Check 3 (or 2) adjacent same colors
    // Rules for "Turtle Match": Usually 2 same color collide = pop.
    // Logic: Check any 2 adjacent (Horizontally or Vertically)
    const checkMatches = (): boolean => {
        let hasMatch = false;
        const g = grid.value;

        // Check Rows (0,1,2), (3,4,5), (6,7,8)
        // Check Cols (0,3,6), (1,4,7), (2,5,8)

        // Let's just finding *any* adjacent pair for simplicity and high win rate as requested
        // "if matched... plus GAS win"

        // Helper to check and mark
        const checkPair = (i1: number, i2: number) => {
            if (g[i1] && g[i2] && g[i1]!.color === g[i2]!.color && !g[i1]!.isMatched && !g[i2]!.isMatched) {
                g[i1]!.isMatched = true;
                g[i2]!.isMatched = true;
                hasMatch = true;
            }
        };

        // Horizontal
        for (let row = 0; row < 3; row++) {
            checkPair(row * 3, row * 3 + 1);
            checkPair(row * 3 + 1, row * 3 + 2);
        }
        // Vertical
        for (let col = 0; col < 3; col++) {
            checkPair(col, col + 3);
            checkPair(col + 3, col + 6);
        }

        // Also diagonal? Maybe not for 3x3.

        return hasMatch;
    };

    const clearMatches = () => {
        grid.value = grid.value.map(t => (t && t.isMatched ? null : t));
    };

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    return {
        grid,
        queue,
        winnings,
        isPlaying,
        isMsg,
        totalOpened,
        gameState,
        activeTurtle,
        purchase,
        getColorHex
    };
}
