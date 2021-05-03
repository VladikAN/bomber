import { Consts } from './consts';

export const setupAnimations = (scene: Phaser.Scene): void => {
    // Blast
    scene.anims.create(singleAnimation(scene, 'sprites', 'blast-emitter', [33, 34, 35, 36]));
    scene.anims.create(singleAnimation(scene, 'sprites', 'blast-wave', [25, 26, 27, 28]));
    scene.anims.create(singleAnimation(scene, 'sprites', 'blast-edge', [17, 18, 19, 20]));

    // Bricks
    scene.anims.create(singleAnimation(scene, 'sprites', 'brick-idle', [2]));
    scene.anims.create(singleAnimation(scene, 'sprites', 'brick-destroy', [3, 4, 5, 6, 7]));

    // Bomb
    scene.anims.create(loopAnimation(scene, 'sprites', 'bomb', [10, 10, 10, 11, 11]));

    // Player
    scene.anims.create(singleAnimation(scene, 'player', 'player-idle-blue', [4]));
    scene.anims.create(loopAnimation(scene, 'player', 'player-left-blue', [0, 1, 2]));
    scene.anims.create(loopAnimation(scene, 'player', 'player-right-blue', [6, 7, 8]));
    scene.anims.create(loopAnimation(scene, 'player', 'player-up-blue', [9, 10, 11]));
    scene.anims.create(loopAnimation(scene, 'player', 'player-down-blue', [3, 4, 5]));
    scene.anims.create(singleAnimation(scene, 'player', 'player-death-blue', [12, 13, 14, 15, 16, 17]));

    scene.anims.create(singleAnimation(scene, 'player', 'player-idle-red', [22]));
    scene.anims.create(loopAnimation(scene, 'player', 'player-left-red', [18, 19, 20]));
    scene.anims.create(loopAnimation(scene, 'player', 'player-right-red', [24, 25, 26]));
    scene.anims.create(loopAnimation(scene, 'player', 'player-up-red', [27, 28, 29]));
    scene.anims.create(loopAnimation(scene, 'player', 'player-down-red', [21, 22, 23]));
    scene.anims.create(singleAnimation(scene, 'player', 'player-death-red', [30, 31, 32, 33, 34, 35]));
};

const loopAnimation = (scene: Phaser.Scene, image: string, name: string, frames: number[]): Phaser.Types.Animations.Animation => {
    return {
        key: name,
        frames: scene.anims.generateFrameNumbers(image, { frames: frames }),
        frameRate: Consts.animationFrameRate,
        repeat: -1
    };
};

const singleAnimation = (scene: Phaser.Scene, image: string, name: string, frames: number[]): Phaser.Types.Animations.Animation => {
    return {
        key: name,
        frames: scene.anims.generateFrameNumbers(image, { frames: frames }),
        frameRate: Consts.animationFrameRate,
        repeat: 0
    };
};