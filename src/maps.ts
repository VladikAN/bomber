import { Consts, Tiles } from './consts';
import { Point } from './types';

export class MapLoader {
    map: Phaser.Tilemaps.Tilemap = null;
    levelLayer: Phaser.Tilemaps.TilemapLayer;

    loadMap = (scene: Phaser.Scene): Phaser.Tilemaps.TilemapLayer[] => {
        this.map = scene.add.tilemap('map', Consts.spriteFrame, Consts.spriteFrame);
        const tileset = this.map.addTilesetImage('sprites');

        // Put everything to the center
        scene.cameras.main.setZoom(1);
        scene.cameras.main.centerOn(
            this.map.widthInPixels / 2 + Consts.spriteFrame,
            this.map.heightInPixels / 2 + Consts.spriteFrame);

        // Create level from csv
        this.levelLayer = this.map.createLayer(0, tileset, Consts.spriteFrame, Consts.spriteFrame);
        this.levelLayer.setCollision([Tiles.wall, Tiles.brick]);

        // Create rect around the level
        const edgeLayer = this.map.createBlankLayer('edge', tileset, 0, 0, this.map.width + 2, this.map.height + 2);
        edgeLayer.setCollision([Tiles.wall]);
        edgeLayer.fill(Tiles.wall, 0, 0, this.map.width + 2, 1);
        edgeLayer.fill(Tiles.wall, 0, this.map.height + 1, this.map.width + 2, 1);
        edgeLayer.fill(Tiles.wall, 0, 0, 1, this.map.height + 2);
        edgeLayer.fill(Tiles.wall, this.map.width + 1, 0, 1, this.map.height + 2);

        return [this.levelLayer, edgeLayer];
    };

    getPickups = (): Phaser.Tilemaps.Tile[] => {
        const tiles = this.levelLayer.filterTiles((tile) => tile.index == Tiles.addBomb || tile.index == Tiles.powerUp);
        return tiles;
    };

    getSpawns = (): Point[] => {
        const layer = this.levelLayer;
        const lastH: number = layer.width / Consts.spriteFrame;
        const lastV: number = layer.height / Consts.spriteFrame;

        // Put default spawns
        const spawns: Point[] = [];
        spawns[0] = { x: 1, y: 1};
        spawns[1] = { x: lastH, y: 1};
        spawns[2] = { x: lastH, y: lastV};
        spawns[3] = { x: 1, y: lastV};

        return spawns;
    };
}