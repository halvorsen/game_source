import * as Phaser from 'phaser';

const GRID_SIZE = 10;
const TILE_SIZE = 50;

interface Tile {
    value: number;
    rect: Phaser.GameObjects.Rectangle;
    text: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
    private grid: number[] = new Array(100).fill(0);
    private tiles: (Tile | null)[] = new Array(100).fill(null);
    private startX: number = 0;
    private startY: number = 0;
    private isAnimating: boolean = false;

    constructor() {
        super('GameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#f0f0f0');

        this.startX = (this.sys.game.config.width as number - GRID_SIZE * TILE_SIZE) / 2;
        this.startY = (this.sys.game.config.height as number - GRID_SIZE * TILE_SIZE) / 2;

        this.initGrid();
        this.renderGrid();

        // Setup swipe/drag detection
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointerup', this.handlePointerUp, this);
    }

    private initGrid() {
        for (let i = 0; i < 100; i++) {
            // Random number 1-4 for testing, original could go up to 4 or so initially
            this.grid[i] = Math.floor(Math.random() * 4) + 1;
        }
    }

    private getScreenXY(index: number): { x: number, y: number } {
        const gridX = index % 10;
        const gridY = Math.floor(index / 10);
        // y=0 is bottom in logic, so invert Y for screen
        const phaserY = 9 - gridY;
        return {
            x: this.startX + gridX * TILE_SIZE + TILE_SIZE / 2,
            y: this.startY + phaserY * TILE_SIZE + TILE_SIZE / 2
        };
    }

    private createTileObject(value: number, pos: {x: number, y: number}, index: number): Tile {
        const rect = this.add.rectangle(pos.x, pos.y, TILE_SIZE - 4, TILE_SIZE - 4, this.getColorForValue(value));
        rect.setInteractive(); 
        rect.setData('index', index); 

        const text = this.add.text(pos.x, pos.y, value.toString(), {
            fontSize: '24px',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add a nice border radius-like effect using rounded rectangle if we want, but standard rect is fine for now
        // Let's add a slight shadow or border
        rect.setStrokeStyle(2, 0x000000, 0.2);

        return { value, rect, text };
    }

    private renderGrid() {
        // We only create new tiles if they don't exist.
        // For animations, we will handle creating and destroying tiles individually.
        for (let i = 0; i < 100; i++) {
            const value = this.grid[i];
            
            if (value === 0 && this.tiles[i]) {
                this.tiles[i]?.rect.destroy();
                this.tiles[i]?.text.destroy();
                this.tiles[i] = null;
            } else if (value !== 0 && !this.tiles[i]) {
                const pos = this.getScreenXY(i);
                this.tiles[i] = this.createTileObject(value, pos, i);
            } else if (value !== 0 && this.tiles[i]) {
                // Update existing
                const tile = this.tiles[i]!;
                tile.value = value;
                tile.text.setText(value.toString());
                tile.rect.setFillStyle(this.getColorForValue(value));
                tile.rect.setData('index', i);
                
                const pos = this.getScreenXY(i);
                tile.rect.setPosition(pos.x, pos.y);
                tile.text.setPosition(pos.x, pos.y);
            }
        }
    }

    private getColorForValue(val: number): number {
        // Beautiful bright colors similar to 2048 or casual games
        const colors = [
            0xffffff, // 0
            0xfff2e0, // 1
            0xffe4b5, // 2
            0xffc8a2, // 3
            0xffa07a, // 4
            0xfa8072, // 5
            0xff6347, // 6
            0xff4500, // 7
            0xff0000, // 8
            0x8b0000  // 9
        ];
        return colors[val] || 0x444444;
    }

    private pointerDownStart: Phaser.Math.Vector2 | null = null;
    private selectedIndex: number | null = null;

    private handlePointerDown(pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) {
        if (this.isAnimating) return;
        
        if (currentlyOver.length > 0) {
            const rect = currentlyOver[0] as Phaser.GameObjects.Rectangle;
            this.selectedIndex = rect.getData('index');
            this.pointerDownStart = new Phaser.Math.Vector2(pointer.x, pointer.y);
            
            // Pop effect on selection
            if (this.selectedIndex !== null && this.tiles[this.selectedIndex]) {
                const tile = this.tiles[this.selectedIndex]!;
                this.tweens.add({
                    targets: [tile.rect, tile.text],
                    scale: 1.1,
                    duration: 100,
                    yoyo: true
                });
            }
        }
    }

    private handlePointerUp(pointer: Phaser.Input.Pointer) {
        if (this.isAnimating) return;
        if (this.pointerDownStart && this.selectedIndex !== null) {
            const dx = pointer.x - this.pointerDownStart.x;
            const dy = pointer.y - this.pointerDownStart.y;
            
            if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal swipe
                    if (dx > 0) {
                        this.trySwipe(this.selectedIndex, 2); // Right
                    } else {
                        this.trySwipe(this.selectedIndex, 4); // Left
                    }
                } else {
                    // Vertical swipe
                    if (dy > 0) {
                        this.trySwipe(this.selectedIndex, 3); // Down
                    } else {
                        this.trySwipe(this.selectedIndex, 1); // Up
                    }
                }
            }
        }
        
        this.pointerDownStart = null;
        this.selectedIndex = null;
    }

    private trySwipe(center: number, direction: number) {
        const x = center % 10;
        const y = Math.floor(center / 10);
        let targetIndex = -1;
        let behindIndex = -1;

        if (direction === 1) { // UP
            if (y >= 9) return;
            targetIndex = center + 10;
            behindIndex = center - 10;
        } else if (direction === 2) { // RIGHT
            if (x >= 9) return;
            targetIndex = center + 1;
            behindIndex = center - 1;
        } else if (direction === 3) { // DOWN
            if (y <= 0) return;
            targetIndex = center - 10;
            behindIndex = center + 10;
        } else if (direction === 4) { // LEFT
            if (x <= 0) return;
            targetIndex = center - 1;
            behindIndex = center + 1;
        }

        let validBehind = false;
        if (direction === 1) validBehind = (y > 0);
        else if (direction === 2) validBehind = (x > 0);
        else if (direction === 3) validBehind = (y < 9);
        else if (direction === 4) validBehind = (x < 9);

        // Must not have block behind it
        if (validBehind && this.grid[behindIndex] !== 0) {
            this.playInvalidMoveAnim(center);
            return;
        }

        const centerVal = this.grid[center];
        const targetVal = this.grid[targetIndex];

        if (targetVal !== 0) {
            const sum = centerVal + targetVal;
            if (sum < 10) {
                this.grid[targetIndex] = sum;
                this.grid[center] = 0;
                this.animateTileMoveAndCombine(center, targetIndex, sum);
            } else if ((centerVal === 8 && targetVal === 8) || (centerVal === 9 && targetVal === 9)) {
                this.grid[targetIndex] = 0;
                this.grid[center] = 0;
                this.animateTileMoveAndDestroy(center, targetIndex);
            } else {
                this.playInvalidMoveAnim(center);
            }
        } else {
            // Move to empty
            this.grid[targetIndex] = centerVal;
            this.grid[center] = 0;
            this.animateTileMove(center, targetIndex, centerVal);
        }
    }

    private playInvalidMoveAnim(index: number) {
        const tile = this.tiles[index];
        if (!tile) return;
        this.isAnimating = true;
        this.tweens.add({
            targets: [tile.rect, tile.text],
            x: '+=5',
            duration: 50,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                this.isAnimating = false;
            }
        });
    }

    private animateTileMove(fromIndex: number, toIndex: number, val: number) {
        const tile = this.tiles[fromIndex]!;
        this.tiles[fromIndex] = null;
        this.tiles[toIndex] = tile;
        tile.rect.setData('index', toIndex);
        
        const targetPos = this.getScreenXY(toIndex);
        
        this.isAnimating = true;
        this.tweens.add({
            targets: [tile.rect, tile.text],
            x: targetPos.x,
            y: targetPos.y,
            duration: 150,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.isAnimating = false;
            }
        });
    }

    private animateTileMoveAndCombine(fromIndex: number, toIndex: number, newVal: number) {
        const movingTile = this.tiles[fromIndex]!;
        const targetTile = this.tiles[toIndex]!;
        this.tiles[fromIndex] = null;
        
        // Put moving tile above the target tile
        movingTile.rect.setDepth(10);
        movingTile.text.setDepth(11);
        
        const targetPos = this.getScreenXY(toIndex);
        
        this.isAnimating = true;
        this.tweens.add({
            targets: [movingTile.rect, movingTile.text],
            x: targetPos.x,
            y: targetPos.y,
            duration: 150,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                // Destroy moving tile
                movingTile.rect.destroy();
                movingTile.text.destroy();
                
                // Update target tile
                targetTile.value = newVal;
                targetTile.text.setText(newVal.toString());
                targetTile.rect.setFillStyle(this.getColorForValue(newVal));
                
                // Pop animation for the combined tile
                this.tweens.add({
                    targets: [targetTile.rect, targetTile.text],
                    scale: 1.2,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        this.isAnimating = false;
                    }
                });
            }
        });
    }

    private animateTileMoveAndDestroy(fromIndex: number, toIndex: number) {
        const movingTile = this.tiles[fromIndex]!;
        const targetTile = this.tiles[toIndex]!;
        this.tiles[fromIndex] = null;
        this.tiles[toIndex] = null;
        
        movingTile.rect.setDepth(10);
        movingTile.text.setDepth(11);
        
        const targetPos = this.getScreenXY(toIndex);
        
        this.isAnimating = true;
        this.tweens.add({
            targets: [movingTile.rect, movingTile.text],
            x: targetPos.x,
            y: targetPos.y,
            duration: 150,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                // Explosion / shrink animation for both
                this.tweens.add({
                    targets: [movingTile.rect, movingTile.text, targetTile.rect, targetTile.text],
                    scale: 0,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => {
                        movingTile.rect.destroy();
                        movingTile.text.destroy();
                        targetTile.rect.destroy();
                        targetTile.text.destroy();
                        this.isAnimating = false;
                    }
                });
            }
        });
    }
}
