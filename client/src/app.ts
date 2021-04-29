import "phaser";

var consts = {
    playerSpeed: 48,
    bombTimer: 3000,
    respawnTimer: 2000,
    animFrameRate: 12,
    spriteFrame: 16,
    spriteOffset: 8,
    screenW: 800,
    screenH: 600
};

var tiles = {
    wall: 49,
    free: 56,
    brick: 50
};

const config = {
    type: Phaser.AUTO,
    width: consts.screenW,
    height: consts.screenH,
    physics: { default: 'arcade' },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var levelLayer;
var edgeLayer;
var cursors;
var player;

var spawns = [];
var objects = [];

function preload() {
    this.load.spritesheet('sprite', './art/sprite.png', { frameWidth: consts.spriteFrame, frameHeight: consts.spriteFrame });
    this.load.tilemapCSV('map', './maps/demo01.csv');
}

function create() {
    cursors = this.input.keyboard.createCursorKeys();

    setupAnimations();
    loadMap();
    respawnPlayer();
}

function setupAnimations() {
    // Blast
    this.anims.create(buildOnceAnimation('blast-emitter', [42, 43, 44, 45, 46]));
    this.anims.create(buildOnceAnimation('blast-wave', [35, 36, 37, 38, 46]));
    this.anims.create(buildOnceAnimation('blast-edge', [28, 29, 30, 31, 46]));

    // Bricks
    this.anims.create(buildOnceAnimation('brick-idle', [50]));
    this.anims.create(buildOnceAnimation('brick-destroy', [50, 51, 52, 53, 54, 55]));

    // Bomb
    this.anims.create(buildLoopAnimation('bomb', [21, 21, 21, 22, 22]));

    // Player
    this.anims.create(buildOnceAnimation('player-idle', [4]));
    this.anims.create(buildLoopAnimation('player-left', [0, 1, 2]));
    this.anims.create(buildLoopAnimation('player-right', [7, 8, 9]));
    this.anims.create(buildLoopAnimation('player-up', [10, 11, 12]));
    this.anims.create(buildLoopAnimation('player-down', [3, 4, 5]));
    this.anims.create(buildOnceAnimation('player-death', [14, 15, 16, 17, 18]));
}

function loadMap() {
    var map = this.add.tilemap('map', consts.spriteFrame, consts.spriteFrame);
    var tileset = map.addTilesetImage('sprite');

    // Put default spawns
    spawns[0] = { x: 1, y: 1};
    spawns[1] = { x: map.width, y: 1};
    spawns[2] = { x: map.width, y: map.height};
    spawns[3] = { x: 1, y: map.height};

    // Put everything to the center
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);

    // Create level from csv
    levelLayer = map.createLayer(0, tileset, consts.spriteFrame, consts.spriteFrame);
    levelLayer.setCollision([tiles.wall, tiles.brick]);
    
    // Create rect around the level
    edgeLayer = map.createBlankLayer('edge', tileset, 0, 0, map.width + 2, map.height + 2);
    edgeLayer.setCollision([tiles.wall]);
    edgeLayer.fill(tiles.wall, 0, 0, map.width + 2, 1);
    edgeLayer.fill(tiles.wall, 0, map.height + 1, map.width + 2, 1);
    edgeLayer.fill(tiles.wall, 0, 0, 1, map.height + 2);
    edgeLayer.fill(tiles.wall, map.width + 1, 0, 1, map.height + 2);
}

function update() {
    handleInput();
}

function handleInput() {
    var lr = cursors.left.isDown || cursors.right.isDown;
    var ud = cursors.up.isDown || cursors.down.isDown;

    player.gameObj.setVelocity(0);

    if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
        player.placeBomb();
    }
    
    if (!lr && !ud) {
        player.idle();
        return;
    }
    
    if (lr) {
        if (cursors.left.isDown) {
            player.left();
        } else if (cursors.right.isDown) {
            player.right();
        }

        return;
    }
    
    if (ud) {
        if (cursors.up.isDown) {
            player.up();
        } else if (cursors.down.isDown) {
            player.down();
        }

        return;
    }
}

function spawnBlast(x, y, s) {
    // Put blast emitter
    var gameObj = this.physics.add.sprite(
        x * consts.spriteFrame + consts.spriteOffset,
        y * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.play('blast-emitter');
    gameObj.setDepth(2);
    gameObj.once('animationcomplete', () => { gameObj.destroy() });

    // Four directions to observe
    var obs = [{ x: 0, y: -consts.spriteFrame, n: 0 },
        { x: consts.spriteFrame, y: 0, n: 1 },
        { x: 0, y: consts.spriteFrame, n: 2 },
        { x: -consts.spriteFrame, y: 0, n: 3 }];

    var bricks = [];

    // Put blast waves in four directions
    for (var d = 0; d < obs.length; d++) {
        for (var i = 0; i <= s; i++) {
            var offset = { x: obs[d].x * i, y: obs[d].y * i };
            
            // Remember brick wall for later destruction
            var tile = levelLayer.getTileAtWorldXY(gameObj.x + offset.x, gameObj.y + offset.y, true);
            if (!tile || tile.index != tiles.free) {
                bricks.push(tile);
                break;
            }

            // Locate player and bombs
            updateOnTile(tile);

            // Spawn blast wave
            var waveObj = this.physics.add.sprite(gameObj.x + offset.x, gameObj.y + offset.y, 'sprite');
            waveObj.angle = 90 * obs[d].n;
            waveObj.play(i == s ? 'blast-edge' : 'blast-wave');
            waveObj.once('animationcomplete', () => { waveObj.destroy() });
        }
    }

    // Destroy brick walls
    for (var i = 0; i < bricks.length; i++) {
        destroyBricks(bricks[i]);
    }

    return { gameObj: gameObj };
}

function updateOnTile(tile) {
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

function destroyBricks(tile) {
    if (!tile || tile.index != tiles.brick) {
        return;
    }

    // Swap tile and remove collision
    tile.setCollision(false);
    tile.index = tiles.free;

    // Spawn animated brick wall
    var gameObj = this.physics.add.sprite(
        (tile.x + 1) * consts.spriteFrame + consts.spriteOffset,
        (tile.y + 1) * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.play('brick-destroy');
    gameObj.once('animationcomplete', () => { gameObj.destroy() });
}

function spawnBomb(x, y, s) {
    // Draw bomb
    var gameObj = this.physics.add.sprite(
        x * consts.spriteFrame + consts.spriteOffset,
        y * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.play('bomb');

    var bomb = {
        type: 'bomb',
        gameObj: gameObj,
        power: s,
        destroyed: false,
        boom: function() {
            if (this.destroyed) {
                return;
            }
            this.destroyed = true;
            gameObj.setActive(false).setVisible(false);
            var crd = alignToWorld(gameObj.x, gameObj.y);
            spawnBlast(crd.x, crd.y, this.power);
        }
    };

    // Bomb timer out
    this.time.delayedCall(consts.bombTimer, function(b) { b.boom(); }, [bomb], this);

    objects.push(bomb);
    return bomb;
}

function spawnPlayer(x, y) {
    // Draw player
    var gameObj = this.physics.add.sprite(
        x * consts.spriteFrame + consts.spriteOffset,
        y * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.setDepth(1); // put on top of others
    gameObj.play('player-idle');

    // Setup physics
    gameObj.setCollideWorldBounds(true);
    gameObj.setSize(consts.spriteFrame * .5, consts.spriteFrame * .8);
    this.physics.add.collider(gameObj, levelLayer);
    this.physics.add.collider(gameObj, edgeLayer);
    
    var time = this.time;

    var result = {
        type: 'player',
        dead: false,
        gameObj: gameObj,
        power: 2,
        bombsCount: 3,
        bombs: [],
        left: function() {
            if (this.dead) {
                return;
            }
            gameObj.setVelocityX(-consts.playerSpeed);
            gameObj.anims.play('player-left', true);
        },
        right: function() {
            if (this.dead) {
                return;
            }
            gameObj.setVelocityX(consts.playerSpeed);
            gameObj.anims.play('player-right', true);
        },
        up: function() {
            if (this.dead) {
                return;
            }
            gameObj.setVelocityY(-consts.playerSpeed);
            gameObj.anims.play('player-up', true);
        },
        down: function() {
            if (this.dead) {
                return;
            }
            gameObj.setVelocityY(consts.playerSpeed);
            gameObj.anims.play('player-down', true);
        },
        idle: function() {
            if (this.dead) {
                return;
            }
            gameObj.anims.play('player-idle', true);
        },
        spawn: function(x, y) {
            gameObj.x = x * consts.spriteFrame + consts.spriteOffset;
            gameObj.y = y * consts.spriteFrame + consts.spriteOffset;
            gameObj.setActive(true).setVisible(true);
            gameObj.anims.play('player-idle', true);
            this.dead = false;
        },
        die: function() {
            if (this.dead) {
                return;
            }
            this.dead = true;
            gameObj.anims.play('player-death', true);
            gameObj.once('animationcomplete', () => { gameObj.setActive(false).setVisible(false); });
            time.delayedCall(consts.respawnTimer, function() { respawnPlayer(); }, [], this);
        },
        hasBombs: function() {
            var state = [];
            for (var i = 0; i < this.bombs.length; i++) {
                if (!this.bombs[i].destroyed) {
                    state.push(this.bombs[i]);
                } else {
                    // clean-up resources
                    this.bombs[i].gameObj.destroy();
                }
            }
            this.bombs = state;
            return this.bombs.length < this.bombsCount;
        },
        placeBomb: function() {
            if (!this.hasBombs()) {
                return;
            }
            var crd = alignToWorld(gameObj.x, gameObj.y);
            if (findBomb(crd.x, crd.y)) {
                return;
            }
            var bomb = spawnBomb(crd.x, crd.y, this.power);
            this.bombs.push(bomb);
        }
    };

    objects.push(result);
    return result;
}

function findPlayer(x, y) {
    for (var i = 0; i < objects.length; i++) {
        if (objects[i].type != 'player' || objects[i].dead) {
            continue;
        }
        var crd = alignToWorld(objects[i].gameObj.x, objects[i].gameObj.y);
        if (crd.x == x && crd.y == y) {
            return objects[i];
        }
    }
    return null;
}

function findBomb(x, y) {
    for (var i = 0; i < objects.length; i++) {
        if (objects[i].type != 'bomb' || objects[i].destroyed) {
            continue;
        }
        var crd = alignToWorld(objects[i].gameObj.x, objects[i].gameObj.y);
        if (crd.x == x  && crd.y == y ) {
            return objects[i];
        }
    }
    return null;
}

function alignToWorld(x, y) {
    return { x: Math.floor(x / consts.spriteFrame), y: Math.floor(y / consts.spriteFrame) };
}

function buildLoopAnimation(name, frames) {
    return { key: name, frames: this.anims.generateFrameNumbers('sprite', { frames: frames }), frameRate: consts.animFrameRate, repeat: -1 };
}

function buildOnceAnimation(name, frames) {
    return { key: name, frames: this.anims.generateFrameNumbers('sprite', { frames: frames }), frameRate: consts.animFrameRate, repeat: 0 };
}

function respawnPlayer() {
    var loc = spawns[Phaser.Math.Between(0, spawns.length - 1)];
    if (player) {
        player.spawn(loc.x, loc.y);
    } else {
        player = spawnPlayer(loc.x, loc.y);
    }
}