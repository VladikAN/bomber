import { Consts, Tiles } from './consts';

export const loadMap = (scene: Phaser.Scene): Phaser.Tilemaps.TilemapLayer[] => {
    const map = scene.add.tilemap('map', Consts.spriteFrame, Consts.spriteFrame);
    const tileset = map.addTilesetImage('sprite');

    // Put everything to the center
    scene.cameras.main.setZoom(1);
    scene.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);

    // Create level from csv
    const levelLayer = map.createLayer(0, tileset, Consts.spriteFrame, Consts.spriteFrame);
    levelLayer.setCollision([Tiles.wall, Tiles.brick]);

    // Create rect around the level
    const edgeLayer = map.createBlankLayer('edge', tileset, 0, 0, map.width + 2, map.height + 2);
    edgeLayer.setCollision([Tiles.wall]);
    edgeLayer.fill(Tiles.wall, 0, 0, map.width + 2, 1);
    edgeLayer.fill(Tiles.wall, 0, map.height + 1, map.width + 2, 1);
    edgeLayer.fill(Tiles.wall, 0, 0, 1, map.height + 2);
    edgeLayer.fill(Tiles.wall, map.width + 1, 0, 1, map.height + 2);

    return [levelLayer, edgeLayer];
};