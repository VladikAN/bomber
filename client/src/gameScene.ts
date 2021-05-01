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
        this.load.spritesheet('sprite', './art/sprite.png', { frameWidth: Consts.spriteFrame, frameHeight: Consts.spriteFrame });
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
        this.handleInput();
    };

    respawnPlayer = (): void => {
        const loc = this.spawns[Phaser.Math.Between(0, this.spawns.length - 1)];
        if (this.player != null) {
            this.player.spawn(loc.x, loc.y);
        } else {
            this.player = new Player(this, loc.x, loc.y);
        }
    };

    handleInput = (): void => {
        const lr = this.keys.left.isDown || this.keys.right.isDown;
        const ud = this.keys.up.isDown || this.keys.down.isDown;

        this.player.gameObj.setVelocity(0, 0);

        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.player.placeBomb();
        }

        if (!lr && !ud) {
            this.player.idle();
            return;
        }

        if (lr) {
            if (this.keys.left.isDown) {
                this.player.left();
            } else if (this.keys.right.isDown) {
                this.player.right();
            }

            return;
        }

        if (ud) {
            if (this.keys.up.isDown) {
                this.player.up();
            } else if (this.keys.down.isDown) {
                this.player.down();
            }

            return;
        }
    };
}