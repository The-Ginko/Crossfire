// src/ai/OpponentController.js
// This is now a "dumb" host for a personality.
// Its only job is to hold the personality and call its update loop.

export class OpponentController {
    constructor(personality) {
        this.personality = personality;
    }

    update(time, delta) {
        if (this.personality) {
            this.personality.update(time, delta);
        }
    }
}
