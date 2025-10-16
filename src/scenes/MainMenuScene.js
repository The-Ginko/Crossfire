// src/scenes/MainMenuScene.js
export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.selectedGameMode = 'Classic';
        this.selectedPlayerCount = 2;
    }

    preload() {
        // You can load specific menu assets here if needed, like custom fonts or button images.
        // For now, we'll use Phaser's built-in text objects.
    }

    create() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // --- Title ---
        this.add.text(cx, cy - 200, 'Crossfire', {
            fontSize: '84px',
            fontFamily: '"Press Start 2P", Arial',
            fill: '#FFD700'
        }).setOrigin(0.5);

        // --- UI Styles ---
        const labelStyle = { fontSize: '32px', fill: '#FFFFFF' };
        const optionStyle = { fontSize: '28px', fill: '#AAAAAA', fontStyle: 'bold' };
        const selectedOptionStyle = { ...optionStyle, fill: '#00FF00' }; // Highlight color

        // --- Game Mode Selection ---
        this.add.text(cx, cy - 80, 'Game Mode', labelStyle).setOrigin(0.5);

        const classicText = this.add.text(cx - 150, cy - 20, 'Classic', selectedOptionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectGameMode('Classic'));

        const blitzText = this.add.text(cx, cy - 20, 'Blitz', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectGameMode('Blitz'));

        const debugText = this.add.text(cx + 150, cy - 20, 'Debug', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectGameMode('Debug'));

        this.gameModeOptions = { Classic: classicText, Blitz: blitzText, Debug: debugText };

        // --- Player Count Selection ---
        this.add.text(cx, cy + 60, 'Number of Players', labelStyle).setOrigin(0.5);

        const zeroPlayerText = this.add.text(cx - 150, cy + 120, '0', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectPlayerCount(0));

        const onePlayerText = this.add.text(cx, cy + 120, '1', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectPlayerCount(1));

        const twoPlayerText = this.add.text(cx + 150, cy + 120, '2', selectedOptionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectPlayerCount(2));

        this.playerCountOptions = { 0: zeroPlayerText, 1: onePlayerText, 2: twoPlayerText };


        // --- Start Game Button ---
        const startButton = this.add.text(cx, cy + 220, 'Start Game', {
            fontSize: '48px',
            fill: '#00DD00',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('PlayScene', {
                gameMode: this.selectedGameMode,
                playerCount: this.selectedPlayerCount
            });
        });

        startButton.on('pointerover', () => startButton.setStyle({ fill: '#FFFFFF' }));
        startButton.on('pointerout', () => startButton.setStyle({ fill: '#00DD00' }));
    }

    selectGameMode(mode) {
        this.selectedGameMode = mode;
        this.updateButtonStyles(this.gameModeOptions, mode);
    }

    selectPlayerCount(count) {
        this.selectedPlayerCount = count;
        this.updateButtonStyles(this.playerCountOptions, count);
    }

    updateButtonStyles(options, selectedKey) {
        const optionStyle = { fontSize: '28px', fill: '#AAAAAA', fontStyle: 'bold' };
        const selectedOptionStyle = { ...optionStyle, fill: '#00FF00' };

        for (const key in options) {
            options[key].setStyle(key == selectedKey ? selectedOptionStyle : optionStyle);
        }
    }
}