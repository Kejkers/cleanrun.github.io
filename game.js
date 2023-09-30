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
        this.load.image('redwall', 'fg/redwall.png');
        this.load.image('trash', 'fg/trash.png');
    }

    create ()
    {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.speed = 6;
        this.instantiate_objects();
    }

    instantiate_objects() {
        this.add.image(W / 2, H / 2, 'bg');

        this.player = this.matter.add.sprite(100, 400, 'pl');

        this.player.setVelocity(0, 0);
        this.player.setBounce(1, 1);

        const trash = this.matter.add.image(400, 500, 'trash');

        trash.setBounce(1, 1);
        trash.setStatic(true);
        trash.setFriction(0.005);

        const topwall = this.matter.add.image(0, 0, 'redwall').setScale(30, 6);

        topwall.setBounce(1, 1);
        topwall.setStatic(true);
        topwall.setFriction(0.005);
    }

    update ()
    {
        this.player.rotation = 0;
        this.handle_controls();
    }

    handle_controls(player) {
        let speed = (this.cursors.shift.isDown)? this.speed * 2 : this.speed;

        let xmove = this.cursors.left.isDown || this.cursors.right.isDown;
        let ymove = this.cursors.up.isDown || this.cursors.down.isDown;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX((ymove)? -speed / 1.5 : -speed);
            // player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX((ymove)? speed / 1.5 : speed);
            // player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            // player.anims.play('turn');
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY((xmove)? -speed / 1.5 : -speed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY((xmove)? speed / 1.5 : speed);
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
