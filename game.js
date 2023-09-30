const W = 1280;
const H = 720;

function randomPos() {
    return {
        x: Math.random(),
        y: Math.random()
    }
}

class BaseScene extends Phaser.Scene {

    itemPickAndDrop;

    constructor() {
        super({ key: 'basescene' });
        this.itemPickAndDrop = new ItemPickAndDrop(this, W, H);
    }

    player;
    cursors;
    speed;
    rubbish;
    timeSeconds;
    timeText;

    preload() {
        this.load.path = "assets/";
        this.load.image('bg', 'bg/room1.png');
        this.load.image('pl', 'fg/player.png');
        this.load.atlas('player_sheet', 'fg/player_sheet.png', 'fg/player_sheet.json');
        this.load.image('redwall', 'fg/redwall.png');
        this.load.image('trash', 'fg/trash.png');
        this.load.image('dildo', 'fg/dildo.png');

        this.itemPickAndDrop.preloadAssets();
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.speed = 6;
        this.itemPickAndDrop.initKeyboardAction();
        this.instantiate_objects();
        this.timeSeconds = 90;
        this.timeText = this.add.text(W / 2, 8, 'Timer felt asleep :<', { color: '#ffffff' });
    }

    instantiate_objects() {
        this.add.image(W / 2, H / 2, 'bg');

        this.player = this.matter.add.sprite(100, 400, 'player_sheet');

        this.player.setVelocity(0, 0);
        this.player.setBounce(1, 1);
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 0, end: 0 }),
            frameRate: 10,
            duration: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'go',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 0, end: 3 }),
            frameRate: 10,
            duration: 4,
            repeat: -1
        });
        this.player.play('idle');

        const trash = this.matter.add.image(400, 500, 'trash');

        trash.setBounce(1, 1);
        trash.setStatic(true);
        trash.setFriction(0.005);

        const topwall = this.matter.add.image(0, 0, 'redwall').setScale(30, 6);

        topwall.setBounce(1, 1);
        topwall.setStatic(true);
        topwall.setFriction(0.005);

        this.itemPickAndDrop.initItemPlaceholder();

        for (let i = 0; i < 50; i++) {
            this.createRubbish(randomPos(), 'dildo');
        }
    }

    createRubbish(xy, imageName) {
        const r = this.matter.add.image(
            W * xy.x,
            H * xy.y,
            imageName
        );
        r.setInteractive(new Phaser.Geom.Rectangle(-8, -8, 48, 48), Phaser.Geom.Rectangle.Contains);
    }

    update() {
        if (this.cursors.space.isDown) {
            this.sys.game.destroy(true);
            game = new Phaser.Game(config);
        }

        const tdiff = this.timeSeconds - (this.time.now - this.time.startTime) / 1000;
        if (tdiff <= 0) {
            return;
        }

        this.player.rotation = 0;
        this.handle_controls();
        this.upd_time(tdiff);
    }

    handle_controls(player) {
        let speed = (this.cursors.shift.isDown) ? this.speed * 2 : this.speed;

        let xmove = this.cursors.left.isDown || this.cursors.right.isDown;
        let ymove = this.cursors.up.isDown || this.cursors.down.isDown;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX((ymove)? -speed / 1.5 : -speed);
            this.player.anims.play('go', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX((ymove)? speed / 1.5 : speed);
            this.player.anims.play('go', true);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.setVelocityY((xmove)? -speed / 1.5 : -speed);
            this.player.anims.play('go', true);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY((xmove)? speed / 1.5 : speed);
            this.player.anims.play('go', true);
        } else {
            this.player.setVelocityY(0);
        }

        if (!xmove && !ymove) {
            this.player.anims.play('idle', true);
        }

        this.itemPickAndDrop.checkIfKeyboardActionHappens();
    }

    upd_time(diff) {
        let secondsLeft = Math.round(diff);
        let minutesLeft = (secondsLeft >= 60)? Math.round(secondsLeft / 60) : 0;
        let residSeconds = secondsLeft - minutesLeft * 60;
        this.timeText.text = minutesLeft.toString() + ':' + ((residSeconds < 10)? '0' : '') + residSeconds.toString();
    }
}

class Menu extends Phaser.Scene {
    constructor ()
    {
        super({ key: 'menu' });
    }

    preload ()
    {
    }

    create ()
    {
        this.add.text(W / 11, H / 8, 'Clean.run!!!', { color: '#ffffff' });
        this.add.text(W / 11, H / 6, 'Ludum dare 54 game', { color: '#ffffff' });
        this.add.text(W / 11, H / 4, 'Press any key to start', { color: '#ffffff' });
        this.add.text(W / 11, H / 2, 'Press SPACE while playing to restart game', { color: '#ffffff' });
        this.input.keyboard.on('keydown', this.start_game);
    }

    start_game() {
        currentScene = 'basescene';
        this.scene.scene.start(currentScene);
    }
}


class PreLoader extends Phaser.Scene {
    constructor ()
    {
        super({ key: 'pre' });
    }

    create()
    {
        this.scene.start(currentScene);
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
    scene: [PreLoader, Menu, BaseScene]
};

const game = new Phaser.Game(config);
let currentScene = 'menu';


class ItemPickAndDrop {

    itemOnPlaceholder;
    squarePos;
    canThrow; // ебаный костыль

    static THROW_DELTA_POS = 100;
    static THROW_SPEED = 10;
    static SQUARE_POS_X = 0.9;
    static SQUARE_POS_Y = 0.05;

    constructor(game, w, h) {
        this.game = game;
        this.squarePos = {
            x: w * ItemPickAndDrop.SQUARE_POS_X,
            y: h * ItemPickAndDrop.SQUARE_POS_Y
        }
    }

    preloadAssets() {
        this.game.load.image('square', 'fg/square.png');
    }

    initItemPlaceholder() {
        let {x, y} = this.squarePos;
        this.game.add.image(x, y, 'square');
    }

    initKeyboardAction() {
        const input = this.game.input;
        input.mouse.disableContextMenu();
        input.on('gameobjectdown', (pointer, gameObject) => {
            if (!gameObject) {
                return;
            }
            if (!this.isPickedUp()) {
                this.take(gameObject);
            }
        });
    }

    checkIfKeyboardActionHappens() {
        if (!this.isPickedUp()) {
            return
        }
        let p = this.game.input.mousePointer;
        if (!p.primaryDown) {
            this.canThrow = true;
        }
        if (p.primaryDown && this.canThrow) {
            this.throw(p.x, p.y);
        }
    }

    take(item) {
        let {x, y} = this.squarePos;
        this.itemOnPlaceholder = item;
        item.setStatic(true);
        item.x = x;
        item.y = y;
        this.canThrow = false;
    }

    throw(x, y) {
        let item = this.itemOnPlaceholder;
        this.itemOnPlaceholder = null;
        item.setStatic(false);
        item.x = this.game.player.x;
        item.y = this.game.player.y;
        let dx = x - item.x;
        let dy = y - item.y;
        let total = Math.abs(dx) + Math.abs(dy);
        let xFactor = (dx / total);
        let yFactor = (dy / total);
        item.x = item.x + (xFactor * ItemPickAndDrop.THROW_DELTA_POS);
        item.y = item.y + (yFactor * ItemPickAndDrop.THROW_DELTA_POS);
        item.setVelocityX(xFactor * ItemPickAndDrop.THROW_SPEED);
        item.setVelocityY(yFactor * ItemPickAndDrop.THROW_SPEED);
    }

    isPickedUp() {
        return !!this.itemOnPlaceholder;
    }
}
