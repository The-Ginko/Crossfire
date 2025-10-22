// src/managers/OptionsManager.js
export class OptionsManager {
  constructor(registry) {
    this.registry = registry;
    this.defaults = {
      // Per-player control schemes for 2-player mode
      p1_controlScheme: 'acceleration',
      p2_controlScheme: 'acceleration',
      // Settings for 1-player mode
      p1_inputType: 'keyboard'
    };

    for (const key in this.defaults) {
      if (!this.registry.has(key)) {
        this.registry.set(key, this.defaults[key]);
      }
    }
  }

  // --- Methods for Per-Player Settings ---

  setPlayerControlScheme(player, scheme) {
    const key = `p${player}_controlScheme`;
    if ((scheme === 'acceleration' || scheme === 'fineAim') && (player === 1 || player === 2)) {
      this.registry.set(key, scheme);
      console.log(`Player ${player} control scheme set to: ${scheme}`);
    }
  }

  getPlayerControlScheme(player) {
    const key = `p${player}_controlScheme`;
    return this.registry.get(key);
  }

  setInputType(type) {
    if (type === 'keyboard' || type === 'mouse') {
      this.registry.set('p1_inputType', type);
      console.log(`Player 1 input type set to: ${type}`);
    }
  }

  getInputType() {
    return this.registry.get('p1_inputType');
  }
}

