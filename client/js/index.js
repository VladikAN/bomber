var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {},
    scene: {
        preload: preload,
        create: create
    }
};

var game = new Phaser.Game(config);

function preload () {
    this.load.image('sprite', './art/sprite.png');
}

function create () {
    this.add.image(400, 300, 'sprite');
}