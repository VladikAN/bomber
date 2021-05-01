import { Consts } from "./consts";

export const setupAnimations = (scene: Phaser.Scene) => {
    // Blast
    scene.anims.create(singleAnimation(scene, 'blast-emitter', [42, 43, 44, 45, 46]));
    scene.anims.create(singleAnimation(scene, 'blast-wave', [35, 36, 37, 38, 46]));
    scene.anims.create(singleAnimation(scene, 'blast-edge', [28, 29, 30, 31, 46]));

    // Bricks
    scene.anims.create(singleAnimation(scene, 'brick-idle', [50]));
    scene.anims.create(singleAnimation(scene, 'brick-destroy', [50, 51, 52, 53, 54, 55]));

    // Bomb
    scene.anims.create(loopAnimation(scene, 'bomb', [21, 21, 21, 22, 22]));

    // Player
    scene.anims.create(singleAnimation(scene, 'player-idle', [4]));
    scene.anims.create(loopAnimation(scene, 'player-left', [0, 1, 2]));
    scene.anims.create(loopAnimation(scene, 'player-right', [7, 8, 9]));
    scene.anims.create(loopAnimation(scene, 'player-up', [10, 11, 12]));
    scene.anims.create(loopAnimation(scene, 'player-down', [3, 4, 5]));
    scene.anims.create(singleAnimation(scene, 'player-death', [14, 15, 16, 17, 18]));
}

const loopAnimation = (scene: Phaser.Scene, name: string, frames: number[]) => {
    return {
        key: name,
        frames: scene.anims.generateFrameNumbers('sprite', { frames: frames }),
        frameRate: Consts.animationFrameRate,
        repeat: -1
    };
}

const singleAnimation = (scene: Phaser.Scene, name: string, frames: number[]) => {
    return {
        key: name,
        frames: scene.anims.generateFrameNumbers('sprite', { frames: frames }),
        frameRate: Consts.animationFrameRate,
        repeat: 0
    };
}