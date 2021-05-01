import { setupAnimations } from './animations';
import { Consts } from './consts';
import { loadMap } from './maps';
import { Player, Point } from './types';

export class GameScene extends Phaser.Scene {
    keys: Phaser.Types.Input.Keyboard.CursorKeys;

    layers: Phaser.Tilemaps.TilemapLayer[];
    spawns: Point[] = [];
    player: Player;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload(): void {
        this.load.spritesheet('player', './art/player.png', { frameWidth: Consts.spriteFrame, frameHeight: Consts.spriteFrame });
        this.load.spritesheet('sprites', './art/sprites.png', { frameWidth: Consts.spriteFrame, frameHeight: Consts.spriteFrame });
        this.load.tilemapCSV('map', './maps/demo01.csv');
    }

    create(): void {
        // Init engine stuff
        this.keys = this.input.keyboard.createCursorKeys();

        // Init game stuff
        setupAnimations(this);
        this.layers = loadMap(this);

        // Put default spawns
        const layer = this.layers[0];
        this.spawns[0] = { x: 1, y: 1};
        this.spawns[1] = { x: layer.width / Consts.spriteFrame, y: 1};
        this.spawns[2] = { x: layer.width / Consts.spriteFrame, y: layer.height / Consts.spriteFrame};
        this.spawns[3] = { x: 1, y: layer.height / Consts.spriteFrame};

        // Start game
        this.respawnPlayer();
    }

    update = (): void => {
        // Handle player keyboard input
        this.handleInput(this.player);
    };

    respawnPlayer = (): void => {
        const loc = this.spawns[Phaser.Math.Between(0, this.spawns.length - 1)];
        if (this.player != null) {
            this.player.spawn(loc.x, loc.y);
        } else {
            this.player = new Player(this, loc.x, loc.y);
        }
    };

    handleInput = (unit: Player): void => {
        const lr = this.keys.left.isDown || this.keys.right.isDown;
        const ud = this.keys.up.isDown || this.keys.down.isDown;

        unit.gameObj.setVelocity(0, 0);

        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            unit.placeBomb();
        }

        if (!lr && !ud) {
            unit.idle();
            return;
        }

        if (lr) {
            if (this.keys.left.isDown) {
                unit.left();
            } else if (this.keys.right.isDown) {
                unit.right();
            }

            return;
        }

        if (ud) {
            if (this.keys.up.isDown) {
                unit.up();
            } else if (this.keys.down.isDown) {
                unit.down();
            }

            return;
        }
    };
}