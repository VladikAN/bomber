var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: { default: 'arcade' },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var consts = {
    playerSpeed: 48,
    bombTimer: 3000,
    animFrameRate: 12,
    spriteFrame: 16,
    spriteOffset: 8
};

var tiles = {
    wall: 49,
    free: 56,
    brick: 50
};

var map;
var layer;
var game = new Phaser.Game(config);

var cursors;
var player;

function preload () {
    this.load.spritesheet('sprite', './art/sprite.png', { frameWidth: consts.spriteFrame, frameHeight: consts.spriteFrame });
    this.load.tilemapCSV('map', './maps/demo01.csv');
}

function create () {
    map = this.add.tilemap('map', consts.spriteFrame, consts.spriteFrame);
    var tileset = map.addTilesetImage('sprite');
    layer = map.createLayer(0, tileset, 0, 0);
    layer.skipCull = true;

    cursors = this.input.keyboard.createCursorKeys();

    handleInput = handleInput.bind(this);
    
    setupBlast = setupBlast.bind(this);
    spawnBlast = spawnBlast.bind(this);
    setupBomb = setupBomb.bind(this);
    spawnBomb = spawnBomb.bind(this);
    setupPlayer = setupPlayer.bind(this);
    spawnPlayer = spawnPlayer.bind(this);

    alignToWorld = alignToWorld.bind(this);

    setupBlast();
    setupBomb();
    setupPlayer();

    player = spawnPlayer(1, 1);
}

function update() {
    handleInput();
}

function handleInput() {
    var lr = cursors.left.isDown || cursors.right.isDown;
    var ud = cursors.up.isDown || cursors.down.isDown;

    player.gameObj.setVelocity(0);

    if (!lr && !ud) {
        player.idle();
        return;
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
        player.placeBomb();
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
        key: 'be',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [42, 43, 44, 45, 46] }),
        frameRate: consts.animFrameRate
    });
    this.anims.create({
        key: 'bp',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [35, 36, 37, 38, 46] }),
        frameRate: consts.animFrameRate
    });
    this.anims.create({
        key: 'bf',
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
    gameObj.play('be');

    // Four directions to observe
    var obs = [{ x: 0, y: -consts.spriteFrame, n: 0 },
        { x: consts.spriteFrame, y: 0, n: 1 },
        { x: 0, y: consts.spriteFrame, n: 2 },
        { x: -consts.spriteFrame, y: 0, n: 3 }];

    // Put blast waves in four directions
    for (var o = 0; o < obs.length; o++) {
        for (var i = 1; i <= s; i++) {
            var offset = { x: obs[o].x * i, y: obs[o].y * i };
            var tile = layer.getTileAtWorldXY(gameObj.x + offset.x, gameObj.y + offset.y, true);
            if (!tile || tile.index != tiles.free) {
                break;
            }
            var tmp = this.physics.add.sprite(gameObj.x + offset.x, gameObj.y + offset.y, 'sprite');
            tmp.play(i == s ? 'bf' : 'bp');
            tmp.angle = 90 * obs[o].n;
        }
    }

    return { gameObj: gameObj };
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
    var gameObj = this.physics.add.sprite(
        x * consts.spriteFrame + consts.spriteOffset,
        y * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.play('bomb');

    var bomb = { gameObj: gameObj, power: s, destroyed: false };

    this.time.delayedCall(consts.bombTimer, function(b) {
        b.destroyed = true;
        b.gameObj.setActive(false).setVisible(false);

        var crd = alignToWorld(gameObj.x, gameObj.y);
        spawnBlast(crd.x, crd.y, b.power);
    }, [bomb], this);

    return bomb;
}

function setupPlayer() {
    this.anims.create({
        key: 'player-idle',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [4] })
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
}

function spawnPlayer(x, y) {
    var gameObj = this.physics.add.sprite(
        x * consts.spriteFrame + consts.spriteOffset,
        y * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.setDepth(1);
    gameObj.setCollideWorldBounds(true);
    gameObj.play('player-idle');
    
    return {
        gameObj: gameObj,
        power: 2,
        bombsCount: 3,
        bombs: [],
        left: function() {
            var tile = layer.getTileAtWorldXY(gameObj.x - consts.spriteOffset, gameObj.y, true);
            if (tile && tile.index == tiles.free) {
                gameObj.setVelocityX(-consts.playerSpeed);
            }
            gameObj.anims.play('player-left', true);
        },
        right: function() {
            var tile = layer.getTileAtWorldXY(gameObj.x + consts.spriteOffset, gameObj.y, true);
            if (tile && tile.index == tiles.free) {
                gameObj.setVelocityX(consts.playerSpeed);
            }
            gameObj.anims.play('player-right', true);
        },
        up: function() {
            var tile = layer.getTileAtWorldXY(gameObj.x, gameObj.y - consts.spriteOffset, true);
            if (tile && tile.index == tiles.free) {
                gameObj.setVelocityY(-consts.playerSpeed);
            }
            gameObj.anims.play('player-up', true);
        },
        down: function() {
            var tile = layer.getTileAtWorldXY(gameObj.x, gameObj.y + consts.spriteOffset, true);
            if (tile && tile.index == tiles.free) {
                gameObj.setVelocityY(consts.playerSpeed);
            }
            gameObj.anims.play('player-down', true);
        },
        idle: function() {
            gameObj.anims.play('player-idle', true);
        },
        hasBombs: function() {
            var state = [];
            for (var i = 0; i < this.bombs.length; i++) {
                if (!this.bombs[i].destroyed) {
                    state.push(this.bombs[i]);
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