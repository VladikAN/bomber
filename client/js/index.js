var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {},
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var cursors;
var player;

function preload () {
    this.load.spritesheet('sprite', './art/sprite.png', { frameWidth: 16, frameHeight: 16 });
}

function create () {
    cursors = this.input.keyboard.createCursorKeys();

    setupPlayer = setupPlayer.bind(this);
    player = setupPlayer();
}

function update() {
    if (cursors.left.isDown) {
        player.anims.play('player-left', true);
    } else if (cursors.right.isDown) {
        player.anims.play('player-right', true);
    } else if (cursors.up.isDown) {
        player.anims.play('player-up', true);
    } else if (cursors.down.isDown) {
        player.anims.play('player-down', true);
    } else {
        player.anims.play('player-idle', true);
    }
}

function setupPlayer() {
    this.anims.create({
        key: 'player-idle',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [4] })
    });
    this.anims.create({
        key: 'player-left',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [0, 1, 2] }),
        frameRate: 12,
        repeat: -1
    });
    this.anims.create({
        key: 'player-right',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [10, 11, 12] }),
        frameRate: 12,
        repeat: -1
    });
    this.anims.create({
        key: 'player-up',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [13, 14, 15] }),
        frameRate: 12,
        repeat: -1
    });
    this.anims.create({
        key: 'player-down',
        frames: this.anims.generateFrameNumbers('sprite', { frames: [3, 4, 5] }),
        frameRate: 12,
        repeat: -1
    });

    var player = this.add.sprite(400, 300);
    player.setScale(1.5);
    player.play('player-idle');
    return player;
}