var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade'
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var consts = {
    playerSpeed: 48,
    animFrameRate: 12,
    spriteFrame: 16,
    spriteOffset: 8
};

var tiles = {
    wall: 49,
    free: 56,
    brick: 50,
    obstacle: [49, 50]
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

    setupBomb = setupBomb.bind(this);
    spawnBomb = spawnBomb.bind(this);
    setupPlayer = setupPlayer.bind(this);
    spawnPlayer = spawnPlayer.bind(this);
    alignToWorld = alignToWorld.bind(this);

    setupBomb();
    setupPlayer();

    player = spawnPlayer(1, 1);
}

function update() {
    player.gameObj.setVelocity(0);
    if (cursors.space.isDown) {
        player.placeBomb();
    } else if (cursors.left.isDown) {
        player.left();
    } else if (cursors.right.isDown) {
        player.right();
    } else if (cursors.up.isDown) {
        player.up();
    } else if (cursors.down.isDown) {
        player.down();
    } else {
        player.idle();
    }
}

function setupBomb() {
    this.anims.create({
        key: 'bomb',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [21, 21, 21, 22, 22] }),
        frameRate: consts.animFrameRate,
        repeat: -1
    });
}

function spawnBomb(x, y) {
    var gameObj = this.physics.add.sprite(
        x * consts.spriteFrame + consts.spriteOffset,
        y * consts.spriteFrame + consts.spriteOffset,
        'sprite');
    gameObj.setCollideWorldBounds(true);
    gameObj.play('bomb');

    return {
        gameObj: gameObj
    };
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
    gameObj.setCollideWorldBounds(true);
    gameObj.play('player-idle');
    
    return {
        gameObj: gameObj,
        left: function() {
            var tile = layer.getTileAtWorldXY(gameObj.x - consts.spriteOffset, gameObj.y, true);
            if (tile.index == tiles.free) {
                gameObj.setVelocityX(-consts.playerSpeed);
            }
            gameObj.anims.play('player-left', true);
        },
        right: function() {
            var tile = layer.getTileAtWorldXY(gameObj.x + consts.spriteOffset, gameObj.y, true);
            if (tile.index == tiles.free) {
                gameObj.setVelocityX(consts.playerSpeed);
            }
            gameObj.anims.play('player-right', true);
        },
        up: function() {
            var tile = layer.getTileAtWorldXY(gameObj.x, gameObj.y - consts.spriteOffset, true);
            if (tile.index == tiles.free) {
                gameObj.setVelocityY(-consts.playerSpeed);
            }
            gameObj.anims.play('player-up', true);
        },
        down: function() {
            var tile = layer.getTileAtWorldXY(gameObj.x, gameObj.y + consts.spriteOffset, true);
            if (tile.index == tiles.free) {
                gameObj.setVelocityY(consts.playerSpeed);
            }
            gameObj.anims.play('player-down', true);
        },
        idle: function() {
            gameObj.anims.play('player-idle', true);
        },
        placeBomb: function() {
            var crd = alignToWorld(gameObj.x, gameObj.y);
            spawnBomb(crd.x, crd.y);
        }
    };
}

function alignToWorld(x, y) {
    return {
        x: Math.floor(x / consts.spriteFrame),
        y: Math.floor(y / consts.spriteFrame)
    };
}