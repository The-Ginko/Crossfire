// src/scenes/MainMenuScene.js
import { OptionsManager } from '/src/managers/OptionsManager.js';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.selectedGameMode = 'Classic';
        this.selectedPlayerCount = 2;
        this.selectedSide = 'left';
    }

    create() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        this.optionsManager = new OptionsManager(this.game.registry);

        const labelStyle = { fontSize: '24px', fill: '#FFFFFF' };
        const optionStyle = { fontSize: '22px', fill: '#AAAAAA', fontStyle: 'bold' };
        const selectedOptionStyle = { ...optionStyle, fill: '#00FF00' };

        this.add.text(cx, cy - 320, 'Crossfire', {
            fontSize: '84px', fontFamily: '"Press Start 2P", Arial', fill: '#FFD700'
        }).setOrigin(0.5);

        let currentY = cy - 220;

        // --- Game Mode Selection ---
        this.add.text(cx, currentY, 'Game Mode', labelStyle).setOrigin(0.5);
        currentY += 40;
        this.gameModeOptions = {
            Classic: this.add.text(cx - 150, currentY, 'Classic', selectedOptionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectGameMode('Classic')),
            Blitz: this.add.text(cx, currentY, 'Blitz', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectGameMode('Blitz')),
            Debug: this.add.text(cx + 150, currentY, 'Debug', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectGameMode('Debug'))
        };
        currentY += 60;

        // --- Player Count Selection ---
        this.add.text(cx, currentY, 'Number of Players', labelStyle).setOrigin(0.5);
        currentY += 40;
        this.playerCountOptions = {
            0: this.add.text(cx - 150, currentY, '0', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerCount(0)),
            1: this.add.text(cx, currentY, '1', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerCount(1)),
            2: this.add.text(cx + 150, currentY, '2', selectedOptionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerCount(2))
        };
        currentY += 60;

        // --- UI Groups for different player counts ---
        this.onePlayerOptionsUI = this.add.group();
        this.twoPlayerOptionsUI = this.add.group();

        // --- Options for 1 Player ---
        let p1Y = currentY;
        const p1_inputTypeLabel = this.add.text(cx, p1Y, 'P1 Input Type', labelStyle).setOrigin(0.5);
        p1Y += 40;
        this.p1_inputTypeOptions = {
            keyboard: this.add.text(cx - 100, p1Y, 'Keyboard', selectedOptionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectInputType('keyboard')),
            mouse: this.add.text(cx + 100, p1Y, 'Mouse', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectInputType('mouse'))
        };
        p1Y += 60;
        this.p1_controlSchemeUI = this.add.group();
        const p1_controlSchemeLabel = this.add.text(cx, p1Y, 'P1 Control Scheme', labelStyle).setOrigin(0.5);
        p1Y += 80;
        this.p1_controlSchemeOptions = {
            acceleration: this.add.text(cx - 100, p1Y, 'Acceleration', selectedOptionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerControlScheme(1, 'acceleration')),
            fineAim: this.add.text(cx + 100, p1Y, 'Fine Aim', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerControlScheme(1, 'fineAim'))
        };
        this.p1_controlSchemeUI.add(p1_controlSchemeLabel).add(this.p1_controlSchemeOptions.acceleration).add(this.p1_controlSchemeOptions.fineAim);
        p1Y += 60;
        const p1_sideLabel = this.add.text(cx, p1Y, 'Choose Your Side', labelStyle).setOrigin(0.5);
        p1Y += 40;
        this.p1_sideOptions = {
            left: this.add.text(cx - 100, p1Y, 'Left', selectedOptionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectSide('left')),
            right: this.add.text(cx + 100, p1Y, 'Right', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectSide('right'))
        };
        this.onePlayerOptionsUI.add(p1_inputTypeLabel).add(this.p1_inputTypeOptions.keyboard).add(this.p1_inputTypeOptions.mouse).add(this.p1_controlSchemeUI).add(p1_sideLabel).add(this.p1_sideOptions.left).add(this.p1_sideOptions.right);

        // --- Options for 2 Players ---
        let p2Y = currentY;
        const p1_twoPlayerLabel = this.add.text(cx - 150, p2Y, 'P1 Controls', labelStyle).setOrigin(0.5);
        const p2_twoPlayerLabel = this.add.text(cx + 150, p2Y, 'P2 Controls', labelStyle).setOrigin(0.5);
        p2Y += 40;
        this.p2_p1_controlSchemeOptions = {
             acceleration: this.add.text(cx - 200, p2Y, 'Accel', selectedOptionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerControlScheme(1, 'acceleration')),
             fineAim: this.add.text(cx - 100, p2Y, 'Fine Aim', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerControlScheme(1, 'fineAim'))
        };
        this.p2_p2_controlSchemeOptions = {
             acceleration: this.add.text(cx + 100, p2Y, 'Accel', selectedOptionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerControlScheme(2, 'acceleration')),
             fineAim: this.add.text(cx + 200, p2Y, 'Fine Aim', optionStyle).setOrigin(0.5).setInteractive().on('pointerdown', () => this.selectPlayerControlScheme(2, 'fineAim'))
        };
        this.twoPlayerOptionsUI.add(p1_twoPlayerLabel).add(p2_twoPlayerLabel).add(this.p2_p1_controlSchemeOptions.acceleration).add(this.p2_p1_controlSchemeOptions.fineAim).add(this.p2_p2_controlSchemeOptions.acceleration).add(this.p2_p2_controlSchemeOptions.fineAim);
        p2Y += 80;

        // --- Start Game Button ---
        this.startButton = this.add.text(cx, p2Y, 'Start Game', {
            fontSize: '48px', fill: '#00DD00', backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        this.startButton.on('pointerdown', () => this.scene.start('PlayScene', {
            gameMode: this.selectedGameMode, playerCount: this.selectedPlayerCount, humanPlayerSide: this.selectedSide
        }));
        this.startButton.on('pointerover', () => this.startButton.setStyle({ fill: '#FFFFFF' }));
        this.startButton.on('pointerout', () => this.startButton.setStyle({ fill: '#00DD00' }));

        // Initial UI state
        this.selectPlayerCount(this.selectedPlayerCount);
    }

    selectGameMode(mode) { this.selectedGameMode = mode; this.updateButtonStyles(this.gameModeOptions, mode); }
    selectSide(side) { this.selectedSide = side; this.updateButtonStyles(this.p1_sideOptions, side); }
    
    selectPlayerCount(count) {
        this.selectedPlayerCount = count;
        this.updateButtonStyles(this.playerCountOptions, count);
        this.onePlayerOptionsUI.setVisible(count === 1);
        this.twoPlayerOptionsUI.setVisible(count === 2);
    }

    selectInputType(type) {
        this.optionsManager.setInputType(type);
        this.updateButtonStyles(this.p1_inputTypeOptions, type);
        this.p1_controlSchemeUI.setVisible(type === 'keyboard');
    }

    selectPlayerControlScheme(player, scheme) {
        this.optionsManager.setPlayerControlScheme(player, scheme);
        if (player === 1) {
            this.updateButtonStyles(this.p1_controlSchemeOptions, scheme);
            this.updateButtonStyles(this.p2_p1_controlSchemeOptions, scheme);
        } else { // player 2
            this.updateButtonStyles(this.p2_p2_controlSchemeOptions, scheme);
        }
    }

    updateButtonStyles(options, selectedKey) {
        const optionStyle = { fontSize: '22px', fill: '#AAAAAA', fontStyle: 'bold' };
        const selectedOptionStyle = { ...optionStyle, fill: '#00FF00' };
        for (const key in options) {
            options[key].setStyle(key == selectedKey ? selectedOptionStyle : optionStyle);
        }
    }
}

