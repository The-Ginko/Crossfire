// src/managers/PlayerBehaviorTracker.js

/**
 * A manager to track simple, repeated player behaviors for the AI to counter.
 * This is a lightweight tracker, not a complex machine-learning model.
 * It's just enough to make the AI 'feel' like it's adapting.
 */
export class PlayerBehaviorTracker {
    constructor(scene) {
        this.scene = scene;

        // --- Configuration ---
        this.MEMORY_LIMIT = 20; // How many of the last shots to remember.
        this.BIAS_THRESHOLD = 0.7; // Player must take 70% of shots from one side to be 'camping'.

        // --- State ---
        // We'll track the side the human player fires from.
        // 'left', 'right'
        this.shotHistory = [];
        this.humanPlayerSide = 'none';
    }

    /**
     * Initializes the tracker with the human player's side.
     * @param {string} side - 'left' or 'right'
     */
    init(side) {
        this.humanPlayerSide = side;
        this.reset();
        console.log(`[PlayerBehaviorTracker] Initialized. Watching human on ${side} side.`);
    }

    /**
     * Resets the shot history.
     */
    reset() {
        this.shotHistory = [];
    }

    /**
     * Called by GameStateManager or InputManager whenever the human player fires.
     */
    recordHumanShot() {
        // If no human player, do nothing.
        if (this.humanPlayerSide === 'none') {
            return;
        }

        this.shotHistory.push(this.humanPlayerSide);

        // Keep the history from growing indefinitely
        if (this.shotHistory.length > this.MEMORY_LIMIT) {
            this.shotHistory.shift(); // Remove the oldest shot
        }
    }

    /**
     * Analyzes the shot history to see if the player is "camping" one side.
     * @returns {string} 'left', 'right', or 'none' if no clear bias is found.
     */
    getSideBias() {
        if (this.shotHistory.length < this.MEMORY_LIMIT / 2) {
            // Not enough data to make a call
            return 'none';
        }

        let leftShots = 0;
        let rightShots = 0;

        for (const side of this.shotHistory) {
            if (side === 'left') {
                leftShots++;
            } else {
                rightShots++;
            }
        }

        const totalShots = this.shotHistory.length;
        
        if ((leftShots / totalShots) >= this.BIAS_THRESHOLD) {
            return 'left';
        } else if ((rightShots / totalShots) >= this.BIAS_THRESHOLD) {
            return 'right';
        }

        // Player is mixing it up, no clear bias.
        return 'none';
    }

    /**
     * A helper for the AI to ask "what's the opposite of the player's bias?"
     * @returns {string} 'left', 'right', or 'none'
     */
    getCounterSide() {
        const bias = this.getSideBias();
        if (bias === 'left') {
            return 'right';
        } else if (bias === 'right') {
            return 'left';
        }
        return 'none';
    }
}

