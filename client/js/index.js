var consts = {
    playerSpeed: 48,
    bombTimer: 3000,
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

var config = {
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

var map;
var levelLayer;
var edgeLayer;
var cursors;
var debugGraphics;
var player;

function preload () {
    this.load.spritesheet('sprite', './art/sprite.png', { frameWidth: consts.spriteFrame, frameHeight: consts.spriteFrame });
    this.load.tilemapCSV('map', './maps/demo01.csv');
}

function create () {
    cursors = this.input.keyboard.createCursorKeys();
    debugGraphics = this.add.graphics(); // tmp

    loadMap = loadMap.bind(this);
    handleInput = handleInput.bind(this);
    
    setupBlast = setupBlast.bind(this);
    spawnBlast = spawnBlast.bind(this);
    setupBricks = setupBricks.bind(this);
    destroyBricks = destroyBricks.bind(this);
    setupBomb = setupBomb.bind(this);
    spawnBomb = spawnBomb.bind(this);
    setupPlayer = setupPlayer.bind(this);
    spawnPlayer = spawnPlayer.bind(this);

    alignToWorld = alignToWorld.bind(this);
    drawDebug = drawDebug.bind(this);

    setupBlast();
    setupBomb();
    setupBricks();
    setupPlayer();

    loadMap();

    player = spawnPlayer(1, 1);
}

function loadMap() {
    map = this.add.tilemap('map', consts.spriteFrame, consts.spriteFrame);
    var tileset = map.addTilesetImage('sprite');

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

function drawDebug() {
    debugGraphics.clear();

    levelLayer.renderDebug(debugGraphics, {
        tileColor: new Phaser.Display.Color(0, 200, 0, 200),
        collidingTileColor: new Phaser.Display.Color(200, 0, 0, 200),
        faceColor: new Phaser.Display.Color(0, 0, 200, 200)
    });
}

function update() {
    //drawDebug();
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

function setupBlast() {
    this.anims.create({
        key: 'blast-emitter',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [42, 43, 44, 45, 46] }),
        frameRate: consts.animFrameRate
    });
    this.anims.create({
        key: 'blast-wave',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [35, 36, 37, 38, 46] }),
        frameRate: consts.animFrameRate
    });
    this.anims.create({
        key: 'blast-edge',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [28, 29, 30, 31, 46] }),
        frameRate: consts.animFrameRate
    });
}

function spawnBlast(x, y, s) {
    // Put blast emitter
    var gameObj = this.physics.add.sprite(
        x * consts.spriteFrame + consts.spriteOffset,
        y * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.play('blast-emitter');
    gameObj.once('animationcomplete', () => { gameObj.destroy() });

    // Four directions to observe
    var obs = [{ x: 0, y: -consts.spriteFrame, n: 0 },
        { x: consts.spriteFrame, y: 0, n: 1 },
        { x: 0, y: consts.spriteFrame, n: 2 },
        { x: -consts.spriteFrame, y: 0, n: 3 }];

    var bricks = [];

    // Put blast waves in four directions
    for (var d = 0; d < obs.length; d++) {
        for (var i = 1; i <= s; i++) {
            var offset = { x: obs[d].x * i, y: obs[d].y * i };
            
            // Remember brick wall for later destruction
            var tile = levelLayer.getTileAtWorldXY(gameObj.x + offset.x, gameObj.y + offset.y, true);
            if (!tile || tile.index != tiles.free) {
                bricks.push(tile);
                break;
            }

            // Locate player and bombs

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

function destroyBricks(tile) {
    if (!tile || tile.index != tiles.brick) {
        return;
    }

    // Swap tile and remove collision
    tile.setCollision(false);
    tile.index = 56;

    // Spawn animated brick wall
    var gameObj = this.physics.add.sprite(
        (tile.x + 1) * consts.spriteFrame + consts.spriteOffset,
        (tile.y + 1) * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.play('brick-destroy');
    gameObj.once('animationcomplete', () => { gameObj.destroy() });
}

function setupBricks() {
    this.anims.create({
        key: 'brick-idle',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [50] }),
        repeat: 0
    });

    this.anims.create({
        key: 'brick-destroy',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [50, 51, 52, 53, 54, 55] }),
        frameRate: consts.animFrameRate,
        repeat: 0
    });
}

function setupBomb() {
    this.anims.create({
        key: 'bomb',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [21, 21, 21, 22, 22] }),
        frameRate: consts.animFrameRate,
        repeat: -1
    });
}

function spawnBomb(x, y, s) {
    // Draw bomb
    var gameObj = this.physics.add.sprite(
        x * consts.spriteFrame + consts.spriteOffset,
        y * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.play('bomb');

    var bomb = {
        gameObj: gameObj,
        power: s,
        destroyed: false,
        boom: function() {
            this.destroyed = true;
            gameObj.setActive(false).setVisible(false);

            var crd = alignToWorld(gameObj.x, gameObj.y);
            spawnBlast(crd.x, crd.y, this.power);
        }
    };

    // Bomb timer out
    this.time.delayedCall(consts.bombTimer, function(b) { b.boom(); }, [bomb], this);
    return bomb;
}

function setupPlayer() {
    this.anims.create({
        key: 'player-idle',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [4] }),
        repeat: 0
    });
    this.anims.create({
        key: 'player-left',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [0, 1, 2] }),
        frameRate: consts.animFrameRate,
        repeat: -1
    });
    this.anims.create({
        key: 'player-right',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [7, 8, 9] }),
        frameRate: consts.animFrameRate,
        repeat: -1
    });
    this.anims.create({
        key: 'player-up',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [10, 11, 12] }),
        frameRate: consts.animFrameRate,
        repeat: -1
    });
    this.anims.create({
        key: 'player-down',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [3, 4, 5] }),
        frameRate: consts.animFrameRate,
        repeat: -1
    });
    this.anims.create({
        key: 'player-death',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [14, 15, 16, 17, 18] }),
        frameRate: consts.animFrameRate,
        repeat: 0
    });
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
    
    return {
        gameObj: gameObj,
        power: 2,
        bombsCount: 3,
        bombs: [],
        left: function() {
            gameObj.setVelocityX(-consts.playerSpeed);
            gameObj.anims.play('player-left', true);
        },
        right: function() {
            gameObj.setVelocityX(consts.playerSpeed);
            gameObj.anims.play('player-right', true);
        },
        up: function() {
            gameObj.setVelocityY(-consts.playerSpeed);
            gameObj.anims.play('player-up', true);
        },
        down: function() {
            gameObj.setVelocityY(consts.playerSpeed);
            gameObj.anims.play('player-down', true);
        },
        idle: function() {
            gameObj.anims.play('player-idle', true);
        },
        die: function() {
            gameObj.anims.play('player-death', true);
            gameObj.once('animationcomplete', () => { gameObj.setActive(false).setVisible(false); });
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
            var bomb = spawnBomb(crd.x, crd.y, this.power);
            this.bombs.push(bomb);
        }
    };
}

function alignToWorld(x, y) {
    return {
        x: Math.floor(x / consts.spriteFrame),
        y: Math.floor(y / consts.spriteFrame)
    };
}