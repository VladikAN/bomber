import 'phaser';
import { Consts } from './consts';
import { GameScene } from './gameScene';


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: Consts.screenW,
    height: Consts.screenH,
    physics: { default: 'arcade' },
    scene: [GameScene]
};

export class BomberManGame extends Phaser.Game {
    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }
}

window.onload = (): void => { new BomberManGame(config); };