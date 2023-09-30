const W = 1280;
const H = 720;

class BaseScene extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    player;
    cursors;
    speed;

    preload ()
    {
        this.load.path = "assets/";
        this.load.image('bg', 'bg/room1.png');
        this.load.image('pl', 'fg/player.png');
        this.load.image('red', 'fg/red.png');
    }

    create ()
    {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.speed = 2;
        this.instantiate_objects();
    }

    instantiate_objects() {
        this.add.image(W / 2, H / 2, 'bg');

        this.player = this.matter.add.sprite(400, 100, 'pl');

        this.player.setVelocity(0, 0);
        this.player.setBounce(1, 1);

        const logo2 = this.matter.add.image(400, 400, 'pl');

        logo2.setBounce(1, 1);
        // logo2.setCollideWorldBounds(true);
        logo2.setStatic(true);
        logo2.setFriction(0.005);
    }

    update ()
    {
        this.handle_controls();
    }

    handle_controls(player) {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.speed);
            // player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.speed);
            // player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            // player.anims.play('turn');
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-this.speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(this.speed);
        } else {
            this.player.setVelocityY(0);
            // player.anims.play('turn');
        }
    }
}


const config = {
    type: Phaser.AUTO,
    width: W,
    height: H,
    physics: {
        default: 'matter',
        matter: {
            debug: true,
            gravity: {
                y: 0.0
            }
        }
    },
    scene: BaseScene
};

const game = new Phaser.Game(config);
