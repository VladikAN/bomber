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
    playerSpeed: 200,
    animFrameRate: 12,
    spriteFrame: 16
};

var game = new Phaser.Game(config);

var cursors;
var player;

function preload () {
    this.load.spritesheet('sprite', './art/sprite.png', { frameWidth: consts.spriteFrame, frameHeight: consts.spriteFrame });
}

function create () {
    cursors = this.input.keyboard.createCursorKeys();

    setupBomb = setupBomb.bind(this);
    spawnBomb = spawnBomb.bind(this);
    setupPlayer = setupPlayer.bind(this);
    spawnPlayer = spawnPlayer.bind(this);

    setupBomb();
    setupPlayer();

    player = spawnPlayer(400, 300);
    spawnBomb(200, 300);
}

function update() {
    player.setVelocity(0);
    if (cursors.left.isDown) {
        player.setVelocityX(-consts.playerSpeed);
        player.anims.play('player-left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(consts.playerSpeed);
        player.anims.play('player-right', true);
    } else if (cursors.up.isDown) {
        player.setVelocityY(-consts.playerSpeed);
        player.anims.play('player-up', true);
    } else if (cursors.down.isDown) {
        player.setVelocityY(consts.playerSpeed);
        player.anims.play('player-down', true);
    } else {
        player.anims.play('player-idle', true);
    }
}

function setupBomb() {
    this.anims.create({
        key: 'bomb',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [30, 30, 30, 31, 31] }),
        frameRate: consts.animFrameRate,
        repeat: -1
    });
}

function spawnBomb(x, y) {
    var bomb = this.physics.add.sprite(x, y, 'sprite');
    bomb.setCollideWorldBounds(true);
    bomb.setScale(2);
    bomb.play('bomb');
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
        frames: this.anims.generateFrameNumbers('sprite', { frames: [10, 11, 12] }),
        frameRate: consts.animFrameRate,
        repeat: -1
    });
    this.anims.create({
        key: 'player-up',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [13, 14, 15] }),
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
    var player = this.physics.add.sprite(x, y, 'sprite');
    player.setCollideWorldBounds(true);
    player.setScale(2);
    player.play('player-idle');
    return player;
}