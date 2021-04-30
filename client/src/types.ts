import { Game, Scene, Time } from "phaser";
import { Consts, Tiles } from "./configs";
import { GameScene } from "./gameScene";
import { alignToWorld, findBomb, findPlayer, pushObject } from "./utils";

export class Point {
    x: number;
    y: number;
}

export class BaseObj {
    scene: GameScene;
    type: string;
    isDead: boolean = false;
    gameObj: Phaser.Physics.Arcade.Sprite = null;

    constructor(scene: GameScene, type: string) {
        this.scene = scene;
        this.type = type;
    }
}

export class Player extends BaseObj {
    power: number = 1;
    bombsCount: number = 1;
    bombs: Bomb[] = [];
    time: Time.Clock;

    constructor(scene: GameScene, x: number, y: number) {
        super(scene, 'player');

        // Draw player
        this.gameObj = scene.physics.add.sprite(
            x * Consts.spriteFrame + Consts.spriteOffset,
            y * Consts.spriteFrame + Consts.spriteOffset,
            'sprite');
        this.gameObj.setDepth(1); // put on top of others
        this.gameObj.play('player-idle');

        // Setup physics
        this.gameObj.setCollideWorldBounds(true);
        this.gameObj.setSize(Consts.spriteFrame * .5, Consts.spriteFrame * .8);
        this.scene.physics.add.collider(this.gameObj, scene.layers);

        this.time = scene.time;

        pushObject(this);
    }

    left = () => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocityX(-Consts.playerSpeed);
        this.gameObj.anims.play('player-left', true);
    }

    right = () => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocityX(Consts.playerSpeed);
        this.gameObj.anims.play('player-right', true);
    };

    up = () => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocityY(-Consts.playerSpeed);
        this.gameObj.anims.play('player-up', true);
    }

    down = () => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocityY(Consts.playerSpeed);
        this.gameObj.anims.play('player-down', true);
    }

    idle = () => {
        if (this.isDead) {
            return;
        }
        this.gameObj.anims.play('player-idle', true);
    }

    spawn = (x: number, y: number) => {
        this.gameObj.x = x * Consts.spriteFrame + Consts.spriteOffset;
        this.gameObj.y = y * Consts.spriteFrame + Consts.spriteOffset;
        this.gameObj.setActive(true).setVisible(true);
        this.gameObj.anims.play('player-idle', true);
        this.isDead = false;
    }

    die = () => {
        if (this.isDead) {
            return;
        }
        this.isDead = true;
        this.gameObj.anims.play('player-death', true);
        this.gameObj.once('animationcomplete', () => { this.gameObj.setActive(false).setVisible(false); });
        this.time.delayedCall(Consts.respawnTimer, function() { this.scene.respawnPlayer(); }, [], this);
    }

    hasBombs = (): boolean => {
        const state: Bomb[] = [];
        for (var i = 0; i < this.bombs.length; i++) {
            if (!this.bombs[i].isDead) {
                state.push(this.bombs[i]);
            } else {
                // clean-up resources
                this.bombs[i].gameObj.destroy();
            }
        }
        this.bombs = state;
        return this.bombs.length < this.bombsCount;
    }

    placeBomb = () => {
        if (!this.hasBombs()) {
            return;
        }
        var crd = alignToWorld(this.gameObj.x, this.gameObj.y);
        if (findBomb(crd.x, crd.y)) {
            return;
        }
        const bomb = new Bomb(this.scene, crd.x, crd.y, this.power);
        this.bombs.push(bomb);
    }
}

export class Bomb extends BaseObj {
    power: number;

    constructor(scene: GameScene, x: number, y: number, power: number) {
        super(scene, 'bomb');

        // Draw bomb
        this.gameObj = scene.physics.add.sprite(
            x * Consts.spriteFrame + Consts.spriteOffset,
            y * Consts.spriteFrame + Consts.spriteOffset,
            'sprite');
        this.gameObj.play('bomb');

        // Bomb timer out
        scene.time.delayedCall(Consts.bombTimer, (b) => { b.boom(); }, [this], this);

        this.power = power;
        pushObject(this);
    }

    boom = () => {
        if (this.isDead) {
            return;
        }
        this.isDead = true;
        this.gameObj.setActive(false).setVisible(false);
        var crd = alignToWorld(this.gameObj.x, this.gameObj.y);
        spawnBlast(this.scene, crd.x, crd.y, this.power);
    }
}

const spawnBlast = (scene: GameScene, x: number, y: number, power: number) => {
    // Put blast emitter
    const gameObj = scene.physics.add.sprite(
        x * Consts.spriteFrame + Consts.spriteOffset,
        y * Consts.spriteFrame + Consts.spriteOffset,
        'sprite');
    gameObj.play('blast-emitter');
    gameObj.setDepth(2);
    gameObj.once('animationcomplete', () => { gameObj.destroy() });

    // Four directions to observe
    const observe = [{ x: 0, y: -Consts.spriteFrame, n: 0 },
        { x: Consts.spriteFrame, y: 0, n: 1 },
        { x: 0, y: Consts.spriteFrame, n: 2 },
        { x: -Consts.spriteFrame, y: 0, n: 3 }];

    const bricks: Phaser.Tilemaps.Tile[] = [];
    const layer: Phaser.Tilemaps.TilemapLayer = scene.layers[0];

    // Put blast waves in four directions
    for (let direction = 0; direction < observe.length; direction++) {
        for (let range = 0; range <= power; range++) {
            const offset = { x: observe[direction].x * range, y: observe[direction].y * range };
            
            // Remember brick wall for later destruction
            const tile = layer.getTileAtWorldXY(gameObj.x + offset.x, gameObj.y + offset.y, true);
            if (!tile || tile.index != Tiles.free) {
                bricks.push(tile);
                break;
            }

            // Locate player and bombs
            updateOnTile(tile);

            // Spawn blast wave
            const waveObj = scene.physics.add.sprite(gameObj.x + offset.x, gameObj.y + offset.y, 'sprite');
            waveObj.angle = 90 * observe[direction].n;
            waveObj.play(range == power ? 'blast-edge' : 'blast-wave');
            waveObj.once('animationcomplete', () => { waveObj.destroy() });
        }
    }

    // Destroy brick walls
    for (var range = 0; range < bricks.length; range++) {
        destroyBricks(bricks[range]);
    }

    return { gameObj: gameObj };
}

const updateOnTile = (tile: Phaser.Tilemaps.Tile) => {
    // Find players in range of tile. +1 because layer is shifted
    var p = findPlayer(tile.x + 1, tile.y + 1);
    if (p) {
        p.die();
    }
    // Find bombs in range of tile. +1 because layer is shifted
    var b = findBomb(tile.x + 1, tile.y + 1);
    if (b) {
        b.boom();
    }
}

const destroyBricks = (tile: Phaser.Tilemaps.Tile) => {
    if (!tile || tile.index != Tiles.brick) {
        return;
    }

    const scene: Scene = tile.tilemap.scene;

    // Swap tile and remove collision
    tile.setCollision(false);
    tile.index = Tiles.free;

    // Spawn animated brick wall
    var gameObj = scene.physics.add.sprite(
        (tile.x + 1) * Consts.spriteFrame + Consts.spriteOffset,
        (tile.y + 1) * Consts.spriteFrame + Consts.spriteOffset,
        'sprite');
    gameObj.play('brick-destroy');
    gameObj.once('animationcomplete', () => { gameObj.destroy() });
}