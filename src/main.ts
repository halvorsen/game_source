import * as Phaser from 'phaser';
import { GameScene } from './game/GameScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'app',
    width: 600,
    height: 800,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    backgroundColor: '#ffffff',
    scene: [GameScene],
};

export default new Phaser.Game(config);
