import { setupAnimations } from './animations';
import { Consts } from './consts';
import { MapLoader } from './maps';
import { Color, Player, PlayerInputHandler, Point, PowerUp } from './types';

export class GameScene extends Phaser.Scene {
    layers: Phaser.Tilemaps.TilemapLayer[] = [];
    pickups: PowerUp[] = [];
    spawns: Point[] = [];
    player1: Player;
    player2: Player;
    inputHandler: PlayerInputHandler;

    constructor() {
        super({ key: 'GameScene' });
    }

    preload(): void {
        this.load.spritesheet('player', './art/player.png', { frameWidth: Consts.spriteFrame, frameHeight: Consts.spriteFrame });
        this.load.spritesheet('sprites', './art/sprites.png', { frameWidth: Consts.spriteFrame, frameHeight: Consts.spriteFrame });
        this.load.tilemapCSV('map', './maps/demo01.csv');
    }

    create(): void {
        // Init game stuff
        setupAnimations(this);

        const map = new MapLoader();
        this.layers = map.loadMap(this);
        this.spawns = map.getSpawns();
        this.pickups = map.getPickups().map(tile => new PowerUp(this, tile));

        // Start game
        this.player1 = new Player(this, Color.blue, this.spawns[0].x, this.spawns[0].y);
        this.player2 = new Player(this, Color.red, this.spawns[2].x, this.spawns[2].y);
        this.inputHandler = new PlayerInputHandler(this);
    }

    update = (): void => {
        // Handle player1 keyboard input
        const input1 = this.inputHandler.readPlayer1();
        this.player1.handleInput(input1);

        // Handle player2 keyboard input
        const input2 = this.inputHandler.readPlayer2();
        this.player2.handleInput(input2);
    };
}