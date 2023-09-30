class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.path = "assets/";
        this.load.image('bg', 'bg/room1.png');
        this.load.image('pl', 'fg/player.png');
        this.load.image('red', 'fg/red.png');
    }

    create ()
    {
        this.instantiate_objects();
    }

    instantiate_objects() {
        this.add.image(0, 0, 'bg');

        const particles = this.add.particles(0, 0, 'red', {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD'
        });

        const logo = this.matter.add.image(400, 100, 'pl');

        logo.setVelocity(0, 0);
        logo.setBounce(1, 1);
        // logo.setCollideWorldBounds(true);

        particles.startFollow(logo);

        const logo2 = this.matter.add.image(400, 400, 'pl');

        logo2.setBounce(1, 1);
        // logo2.setCollideWorldBounds(true);
        logo2.setStatic(true);
        logo2.setFriction(0.005);
    }

}


const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    physics: {
        default: 'matter',
        matter: {
            debug: true,
            gravity: {
                y: 0.3
            }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
