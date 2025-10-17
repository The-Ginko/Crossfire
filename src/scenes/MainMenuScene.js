// src/scenes/MainMenuScene.js
export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.selectedGameMode = 'Classic';
        this.selectedPlayerCount = 2;
        this.selectedSide = 'left'; // Default side for 1-player games
    }

    preload() {
        // You can load specific menu assets here if needed, like custom fonts or button images.
        // For now, we'll use Phaser's built-in text objects.
    }

    create() {
        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;

        // --- Title ---
        this.add.text(cx, cy - 250, 'Crossfire', {
            fontSize: '84px',
            fontFamily: '"Press Start 2P", Arial',
            fill: '#FFD700'
        }).setOrigin(0.5);

        // --- UI Styles ---
        const labelStyle = { fontSize: '32px', fill: '#FFFFFF' };
        const optionStyle = { fontSize: '28px', fill: '#AAAAAA', fontStyle: 'bold' };
        const selectedOptionStyle = { ...optionStyle, fill: '#00FF00' }; // Highlight color

        // --- Game Mode Selection ---
        this.add.text(cx, cy - 150, 'Game Mode', labelStyle).setOrigin(0.5);

        const classicText = this.add.text(cx - 150, cy - 100, 'Classic', selectedOptionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectGameMode('Classic'));

        const blitzText = this.add.text(cx, cy - 100, 'Blitz', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectGameMode('Blitz'));

        const debugText = this.add.text(cx + 150, cy - 100, 'Debug', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectGameMode('Debug'));

        this.gameModeOptions = { Classic: classicText, Blitz: blitzText, Debug: debugText };

        // --- Player Count Selection ---
        this.add.text(cx, cy - 20, 'Number of Players', labelStyle).setOrigin(0.5);

        const zeroPlayerText = this.add.text(cx - 150, cy + 30, '0', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectPlayerCount(0));

        const onePlayerText = this.add.text(cx, cy + 30, '1', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectPlayerCount(1));

        const twoPlayerText = this.add.text(cx + 150, cy + 30, '2', selectedOptionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectPlayerCount(2));

        this.playerCountOptions = { 0: zeroPlayerText, 1: onePlayerText, 2: twoPlayerText };
        
        // --- Player Side Selection (for 1 Player mode) ---
        this.sideSelectionUI = this.add.group();
        const sideLabel = this.add.text(cx, cy + 80, 'Choose Your Side', labelStyle).setOrigin(0.5);
        
        const leftSideText = this.add.text(cx - 100, cy + 130, 'Left', selectedOptionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectSide('left'));
            
        const rightSideText = this.add.text(cx + 100, cy + 130, 'Right', optionStyle)
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', () => this.selectSide('right'));
            
        this.sideOptions = { left: leftSideText, right: rightSideText };
        
        this.sideSelectionUI.add(sideLabel);
        this.sideSelectionUI.add(leftSideText);
        this.sideSelectionUI.add(rightSideText);
        
        // Initially hidden, as the default is 2 players
        this.sideSelectionUI.setVisible(false);


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
                playerCount: this.selectedPlayerCount,
                humanPlayerSide: this.selectedSide // Pass the selected side
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
        
        // Show the side selection UI only if player count is 1
        this.sideSelectionUI.setVisible(count === 1);
    }
    
    selectSide(side) {
        this.selectedSide = side;
        this.updateButtonStyles(this.sideOptions, side);
    }

    updateButtonStyles(options, selectedKey) {
        const optionStyle = { fontSize: '28px', fill: '#AAAAAA', fontStyle: 'bold' };
        const selectedOptionStyle = { ...optionStyle, fill: '#00FF00' };

        for (const key in options) {
            options[key].setStyle(key == selectedKey ? selectedOptionStyle : optionStyle);
        }
    }
}
