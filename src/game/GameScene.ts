import * as Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private grid: number[][] = [];
    private tileSize: number = 50;
    private gridWidth: number = 10;
    private gridHeight: number = 10;
    private tiles: Phaser.GameObjects.Text[][] = [];

    constructor() {
        super('GameScene');
    }

    preload() {
        // Load assets here
    }

    create() {
        this.cameras.main.setBackgroundColor('#f0f0f0');

        const startX = (this.sys.game.config.width as number - this.gridWidth * this.tileSize) / 2;
        const startY = (this.sys.game.config.height as number - this.gridHeight * this.tileSize) / 2;

        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            this.tiles[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                const value = Math.floor(Math.random() * 9) + 1; // Random number 1-9
                this.grid[y][x] = value;

                // Draw tile background
                this.add.rectangle(
                    startX + x * this.tileSize + this.tileSize / 2,
                    startY + y * this.tileSize + this.tileSize / 2,
                    this.tileSize - 2,
                    this.tileSize - 2,
                    0xaaaaaa
                );

                // Draw number
                const text = this.add.text(
                    startX + x * this.tileSize + this.tileSize / 2,
                    startY + y * this.tileSize + this.tileSize / 2,
                    value.toString(),
                    {
                        fontSize: '24px',
                        color: '#000000',
                        fontStyle: 'bold'
                    }
                ).setOrigin(0.5);

                this.tiles[y][x] = text;
            }
        }
    }
}
