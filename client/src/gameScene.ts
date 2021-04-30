import { setupAnimations } from "./animations";
import { Consts } from "./configs";
import { loadMap } from "./maps";
import { Player, Point } from "./types";

export class GameScene extends Phaser.Scene {
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
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
        this.cursors = this.input.keyboard.createCursorKeys();

        // Init game stuff
        setupAnimations(this);
        this.layers = loadMap(this)

        // Put default spawns
        const layer = this.layers[0];
        this.spawns[0] = { x: 1, y: 1};
        this.spawns[1] = { x: layer.width, y: 1};
        this.spawns[2] = { x: layer.width, y: layer.height};
        this.spawns[3] = { x: 1, y: layer.height};

        // Start game
        this.respawnPlayer();
    }

    update = () => {
        this.handleInput();
    }

    respawnPlayer = () => {
        var loc = this.spawns[Phaser.Math.Between(0, this.spawns.length - 1)];
        if (this.player != null) {
            this.player.spawn(loc.x, loc.y);
        } else {
            this.player = new Player(this, loc.x, loc.y);
        }
    }

    handleInput = () => {
        var lr = this.cursors.left.isDown || this.cursors.right.isDown;
        var ud = this.cursors.up.isDown || this.cursors.down.isDown;
    
        this.player.gameObj.setVelocity(0, 0);
    
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.player.placeBomb();
        }
        
        if (!lr && !ud) {
            this.player.idle();
            return;
        }
        
        if (lr) {
            if (this.cursors.left.isDown) {
                this.player.left();
            } else if (this.cursors.right.isDown) {
                this.player.right();
            }
    
            return;
        }
        
        if (ud) {
            if (this.cursors.up.isDown) {
                this.player.up();
            } else if (this.cursors.down.isDown) {
                this.player.down();
            }
    
            return;
        }
    }
}