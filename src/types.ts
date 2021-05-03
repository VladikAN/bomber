import { Scene } from 'phaser';
import { Consts, Tiles } from './consts';
import { GameScene } from './gameScene';
import { alignToWorld, findBombs, findPlayers, pushObject } from './utils';

export class Point {
    x: number;
    y: number;
}

export enum Color {
    blue = 'blue',
    red = 'red'
}

export enum ObjType {
    player,
    bomb,
    powerup
}

export class BaseObj {
    scene: GameScene;
    type: ObjType;
    isDead = false;
    gameObj: Phaser.Physics.Arcade.Sprite = null;

    constructor(scene: GameScene, type: ObjType) {
        this.scene = scene;
        this.type = type;
    }
}

export class Player extends BaseObj {
    power = 1;
    bombsCount = 1;
    bombs: Bomb[] = [];
    color: Color;

    constructor(scene: GameScene, color: Color, x: number, y: number) {
        super(scene, ObjType.player);
        this.color = color;

        // Draw player
        const gameObj = scene.physics.add.sprite(
            x * Consts.spriteFrame + Consts.spriteOffset,
            y * Consts.spriteFrame + Consts.spriteOffset,
            'sprite');
        gameObj.setDepth(10); // put on top of others
        gameObj.play(`player-idle-${this.color}`);

        // Setup physics
        gameObj.setSize(Consts.spriteFrame * .5, Consts.spriteFrame * .5);
        gameObj.setCollideWorldBounds(true);
        this.scene.physics.add.collider(gameObj, scene.layers);

        this.gameObj = gameObj;
        pushObject(this);
    }

    handleInput = (input: PlayerInput): void => {
        this.checkPickups();
        this.gameObj.setVelocity(0, 0);

        if (input.keySpace) {
            this.placeBomb();
        }

        if (input.keyLeft || input.keyRight) {
            if (input.keyLeft) {
                this.left();
            } else if (input.keyRight) {
                this.right();
            }

            return;
        }

        if (input.keyUp || input.keyDown) {
            if (input.keyUp) {
                this.up();
            } else if (input.keyDown) {
                this.down();
            }

            return;
        }

        this.idle();
    };

    left = (): void => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocityX(-Consts.playerSpeed);
        this.gameObj.anims.play(`player-left-${this.color}`, true);
    };

    right = (): void => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocityX(Consts.playerSpeed);
        this.gameObj.anims.play(`player-right-${this.color}`, true);
    };

    up = (): void => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocityY(-Consts.playerSpeed);
        this.gameObj.anims.play(`player-up-${this.color}`, true);
    };

    down = (): void => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocityY(Consts.playerSpeed);
        this.gameObj.anims.play(`player-down-${this.color}`, true);
    };

    idle = (): void => {
        if (this.isDead) {
            return;
        }
        this.gameObj.setVelocity(0, 0);
        this.gameObj.anims.play(`player-idle-${this.color}`, true);
    };

    spawn = (x: number, y: number): void => {
        this.gameObj.x = x * Consts.spriteFrame + Consts.spriteOffset;
        this.gameObj.y = y * Consts.spriteFrame + Consts.spriteOffset;
        this.gameObj.setActive(true).setVisible(true);
        this.gameObj.anims.play(`player-idle-${this.color}`, true);
        this.power = 1;
        this.bombsCount = 1;
        this.isDead = false;
    };

    die = (): void => {
        if (this.isDead) {
            return;
        }
        this.isDead = true;
        this.gameObj.anims.play(`player-death-${this.color}`, true);
        this.gameObj.once('animationcomplete', () => { this.gameObj.setActive(false).setVisible(false); });
        this.scene.time.delayedCall(Consts.respawnTimer, (player: Player) => {
            const loc = player.scene.spawns[Phaser.Math.Between(0, player.scene.spawns.length - 1)];
            player.spawn(loc.x, loc.y);
        }, [this], this);
    };

    hasBombs = (): boolean => {
        const state: Bomb[] = [];
        for (let i = 0; i < this.bombs.length; i++) {
            if (!this.bombs[i].isDead) {
                state.push(this.bombs[i]);
            } else {
                // clean-up resources
                this.bombs[i].gameObj.destroy();
            }
        }
        this.bombs = state;
        return this.bombs.length < this.bombsCount;
    };

    placeBomb = (): void => {
        if (!this.hasBombs()) {
            return;
        }
        const crd = alignToWorld(this.gameObj.x, this.gameObj.y);
        if (findBombs(crd.x, crd.y).length > 0) {
            return;
        }
        const bomb = new Bomb(this.scene, crd.x, crd.y, this.power);
        this.bombs.push(bomb);
    };

    checkPickups = (): void => {
        this.scene.pickups
            .filter(pickup => !pickup.isDead)
            .forEach(pickup => {
                this.scene.physics.world.overlapTiles(this.gameObj, [pickup.tile], () => this._hitPickup(pickup), null, this);
            });
    };

    private _hitPickup = (pickup: PowerUp): void => {
        const org = pickup.tile.index;
        pickup.destroy();
        if (org == Tiles.powerUp) {
            this._powerUp();
        } else if (org == Tiles.addBomb) {
            this._addBomb();
        }
    };

    private _addBomb = (): void => {
        this.bombsCount = this.bombsCount < 5 ? this.bombsCount + 1 : this.bombsCount;
    };

    private _powerUp = (): void => {
        this.power = this.power < 3 ? this.power + 1 : this.power;
    };
}

export class PowerUp extends BaseObj {
    tile: Phaser.Tilemaps.Tile;

    constructor(scene: GameScene, tile: Phaser.Tilemaps.Tile) {
        super(scene, ObjType.powerup);
        this.tile = tile;
        pushObject(this);
    }

    destroy = (): void => {
        const org = this.tile.index;
        if (this.isDead || org == Tiles.free) {
            return;
        }

        this.tile.index = Tiles.free;
        this.isDead = true;

        this.scene.time.delayedCall(
            Consts.bonusTimer,
            (t: PowerUp, org: number) => {
                t.tile.index = org;
                t.isDead = false;
            },
            [this, org],
            this);
    };
}

export class Bomb extends BaseObj {
    power: number;

    constructor(scene: GameScene, x: number, y: number, power: number) {
        super(scene, ObjType.bomb);

        // Draw bomb
        const gameObj = scene.physics.add.sprite(
            x * Consts.spriteFrame + Consts.spriteOffset,
            y * Consts.spriteFrame + Consts.spriteOffset,
            'sprite');
        gameObj.play('bomb');

        // Bomb timer out
        scene.time.delayedCall(Consts.bombTimer, (b) => { b.boom(); }, [this], this);

        this.gameObj = gameObj;
        this.power = power;
        pushObject(this);
    }

    boom = (): void => {
        if (this.isDead) {
            return;
        }
        this.isDead = true;
        this.gameObj.setActive(false).setVisible(false);
        const crd = alignToWorld(this.gameObj.x, this.gameObj.y);
        spawnBlast(this.scene, crd.x, crd.y, this.power);
    };
}

const spawnBlast = (scene: GameScene, x: number, y: number, power: number): void => {
    // Put blast emitter
    const gameObj = scene.physics.add.sprite(
        x * Consts.spriteFrame + Consts.spriteOffset,
        y * Consts.spriteFrame + Consts.spriteOffset,
        'sprite');
    gameObj.play('blast-emitter');
    gameObj.setDepth(5);
    gameObj.once('animationcomplete', () => { gameObj.destroy(); });

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
            if (!tile || (tile.index == Tiles.brick || tile.index == Tiles.wall)) {
                bricks.push(tile);
                break;
            }

            // Locate player and bombs
            updateOnTile(tile);

            // Spawn blast wave
            const waveObj = scene.physics.add.sprite(gameObj.x + offset.x, gameObj.y + offset.y, 'sprite');
            waveObj.angle = 90 * observe[direction].n;
            waveObj.play(range == power ? 'blast-edge' : 'blast-wave');
            waveObj.setDepth(range == power ? 4 : 3);
            waveObj.once('animationcomplete', () => { waveObj.destroy(); });
        }
    }

    // Destroy brick walls
    for (let range = 0; range < bricks.length; range++) {
        destroyBricks(bricks[range]);
    }
};

const updateOnTile = (tile: Phaser.Tilemaps.Tile): void => {
    // Find players in range of tile. +1 because layer is shifted
    const players = findPlayers(tile.x + 1, tile.y + 1);
    players.forEach(p => p.die());

    // Find bombs in range of tile. +1 because layer is shifted
    const bombs = findBombs(tile.x + 1, tile.y + 1);
    bombs.forEach((b) => b.boom());
};

const destroyBricks = (tile: Phaser.Tilemaps.Tile): void => {
    if (!tile || tile.index != Tiles.brick) {
        return;
    }

    const scene: Scene = tile.tilemap.scene;

    // Swap tile and remove collision
    tile.setCollision(false);
    tile.index = Tiles.free;

    // Spawn animated brick wall
    const gameObj = scene.physics.add.sprite(
        (tile.x + 1) * Consts.spriteFrame + Consts.spriteOffset,
        (tile.y + 1) * Consts.spriteFrame + Consts.spriteOffset,
        'sprite');
    gameObj.play('brick-destroy');
    gameObj.once('animationcomplete', () => { gameObj.destroy(); });
};

export class PlayerInput {
    keyLeft: boolean;
    keyRight: boolean;
    keyUp: boolean;
    keyDown: boolean;
    keySpace: boolean;

    constructor(left: boolean, right: boolean, up: boolean, down: boolean, space: boolean) {
        this.keyLeft = left;
        this.keyRight = right;
        this.keyUp = up;
        this.keyDown = down;
        this.keySpace = space;
    }
}

export class PlayerInputHandler {
    private p1Left: Phaser.Input.Keyboard.Key;
    private p1Right: Phaser.Input.Keyboard.Key;
    private p1Up: Phaser.Input.Keyboard.Key;
    private p1Down: Phaser.Input.Keyboard.Key;
    private p1Bomb: Phaser.Input.Keyboard.Key;

    private p2Left: Phaser.Input.Keyboard.Key;
    private p2Right: Phaser.Input.Keyboard.Key;
    private p2Up: Phaser.Input.Keyboard.Key;
    private p2Down: Phaser.Input.Keyboard.Key;
    private p2Bomb: Phaser.Input.Keyboard.Key;

    constructor(scene: GameScene) {
        this.p1Left = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.p1Right = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.p1Up = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.p1Down = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.p1Bomb = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.p2Left = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.p2Right = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.p2Up = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.p2Down = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.p2Bomb = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    }

    readPlayer1 = (): PlayerInput => {
        return new PlayerInput(
            this.p1Left.isDown,
            this.p1Right.isDown,
            this.p1Up.isDown,
            this.p1Down.isDown,
            this.p1Bomb.isDown);
    };

    readPlayer2 = (): PlayerInput => {
        return new PlayerInput(
            this.p2Left.isDown,
            this.p2Right.isDown,
            this.p2Up.isDown,
            this.p2Down.isDown,
            this.p2Bomb.isDown);
    };
}