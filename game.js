const W = 1280;
const H = 720;


function randomPos() {
    return {
        x: Math.random(),
        y: Math.random()
    }
}

const maxTrash = 10;

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
    trashLeft;

    preload() {
        this.load.path = "assets/";
        this.load.image('bg', 'bg/room1.png');
        this.load.image('pl', 'fg/player.png');
        this.load.atlas('player_sheet', 'fg/player_sheet.png', 'fg/player_sheet.json');
        this.load.image('redwall', 'fg/redwall.png');
        this.load.image('socks', 'fg/socks.png');
        this.load.image('transparent', 'fg/transparent.png');
        this.load.image('window', 'fg/window.png');
        this.load.image('table', 'fg/table.png');

        this.itemPickAndDrop.preloadAssets();
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.speed = 6;
        this.itemPickAndDrop.initKeyboardAction();
        this.instantiate_objects();
        this.timeSeconds = 90;
        this.timeText = this.add.text(W / 2, 8, 'Timer felt asleep :<', { color: '#ffffff' });
        this.add.text(50, 8, 'Press SPACE to restart', { color: '#ffffff' });
    }

    instantiate_objects() {
        this.trashLeft = maxTrash;

        this.add.image(W / 2, H / 2, 'bg');

        const wallwindow = this.matter.add.image(W / 2, 140, 'window').setScale(2, 2);

        wallwindow.setSensor(true);
        wallwindow.setStatic(true);
        wallwindow.setOnCollide(function(coldata) {
            if (!coldata.bodyA.isStatic && !(coldata.bodyA.gameObject.name === "player")) {
                this.gameObject.scene.trashLeft -= 1;
                coldata.bodyA.gameObject.destroy();

            } else if (!coldata.bodyB.isStatic && !(coldata.bodyB.gameObject.name === "player")) {
                this.gameObject.scene.trashLeft -= 1;
                coldata.bodyB.gameObject.destroy();
            }
        });

        this.player = this.matter.add.sprite(100, 400, 'player_sheet');

        this.player.setVelocity(0, 0);
        this.player.setBounce(1, 1);
        this.player.name = "player";
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

        const topwall = this.matter.add.image(0, 0, 'transparent').setScale(1280, 190);

        topwall.setBounce(1, 1);
        topwall.setStatic(true);
        topwall.setFriction(0.005);

        const leftwall = this.matter.add.image(0, 0, 'transparent').setScale(1, 720);

        leftwall.setBounce(1, 1);
        leftwall.setStatic(true);
        leftwall.setFriction(0.005);

        const rightwall = this.matter.add.image(1278, 0, 'transparent').setScale(1, 720);

        rightwall.setBounce(1, 1);
        rightwall.setStatic(true);
        rightwall.setFriction(0.005);

        const botwall = this.matter.add.image(0, 718, 'transparent').setScale(1280, 1);

        botwall.setBounce(1, 1);
        botwall.setStatic(true);
        botwall.setFriction(0.005);

        this.itemPickAndDrop.initItemPlaceholder();

        const table = this.matter.add.image(W/2, H/2, 'table');

        table.setBounce(1, 1);
        table.setStatic(true);
        table.setFriction(0.005);

        for (let i = 0; i < maxTrash; i++) {
            this.createRubbish(randomPos(), 'socks');
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
            this.scene.start('pre');
        }

        if (this.trashLeft === 0) {
            this.timeText.text = "You've done this!";
            return;
        }

        const tdiff = this.timeSeconds - (this.time.now - this.time.startTime) / 1000;
        if (tdiff <= 0 || this.player.body === undefined) {
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
        let minutesLeft = (secondsLeft >= 60)? Math.floor(secondsLeft / 60) : 0;
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
        // currentScene = 'learn';
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


// TODO: simplify
// TODO: simplify
// TODO: simplify
class Learn extends Phaser.Scene {
    itemPickAndDrop;

    constructor() {
        super({ key: 'learn' });
        this.itemPickAndDrop = new ItemPickAndDrop(this, W, H);
    }

    player;
    cursors;
    speed;
    rubbish;
    timeSeconds;
    timeText;
    trashLeft;

    preload() {
        this.load.path = "assets/";
        this.load.image('bg', 'bg/room1.png');
        this.load.image('pl', 'fg/player.png');
        this.load.atlas('player_sheet', 'fg/player_sheet.png', 'fg/player_sheet.json');
        this.load.image('redwall', 'fg/redwall.png');
        this.load.image('socks', 'fg/socks.png');
        this.load.image('transparent', 'fg/transparent.png');
        this.load.image('window', 'fg/window.png');

        this.itemPickAndDrop.preloadAssets();
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.speed = 6;
        this.itemPickAndDrop.initKeyboardAction();
        this.instantiate_objects();
        this.timeText = this.add.text(50, 8, 'Your parents are coming! Move to socks and click on it, then throw it to window.', { color: '#ffffff' });
    }

    instantiate_objects() {
        this.trashLeft = 2;

        this.add.image(W / 2, H / 2, 'bg');

        const wallwindow = this.matter.add.image(W / 2, 360, 'window').setScale(2, 2);

        wallwindow.setSensor(true);
        wallwindow.setStatic(true);
        wallwindow.setOnCollide(function(coldata) {
            if (!coldata.bodyA.isStatic && !(coldata.bodyA.gameObject.name === "player")) {
                this.gameObject.scene.trashLeft -= 1;
                console.log(this.trashLeft);
                coldata.bodyA.gameObject.destroy();

            } else if (!coldata.bodyB.isStatic && !(coldata.bodyB.gameObject.name === "player")) {
                this.gameObject.scene.trashLeft -= 1;
                console.log(this.trashLeft);
                coldata.bodyB.gameObject.destroy();
            }
        });

        this.player = this.matter.add.sprite(100, 400, 'player_sheet');

        this.player.setVelocity(0, 0);
        this.player.setBounce(1, 1);
        this.player.name = "player";
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

        const topwall = this.matter.add.image(0, 0, 'transparent').setScale(1280, 190);

        topwall.setBounce(1, 1);
        topwall.setStatic(true);
        topwall.setFriction(0.005);

        const leftwall = this.matter.add.image(0, 0, 'transparent').setScale(1, 720);

        leftwall.setBounce(1, 1);
        leftwall.setStatic(true);
        leftwall.setFriction(0.005);

        const rightwall = this.matter.add.image(1278, 0, 'transparent').setScale(1, 720);

        rightwall.setBounce(1, 1);
        rightwall.setStatic(true);
        rightwall.setFriction(0.005);

        const botwall = this.matter.add.image(0, 718, 'transparent').setScale(1280, 1);

        botwall.setBounce(1, 1);
        botwall.setStatic(true);
        botwall.setFriction(0.005);

        this.itemPickAndDrop.initItemPlaceholder();

        for (let i = 0; i < 2; i++) {
            this.createRubbish(randomPos(), 'socks');
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
            this.scene.start('pre');
        }

        if (this.trashLeft === 0) {
            this.input.keyboard.on('keydown', this.next_scene);
            this.timeText.text = "You are ready for the real challenge! Press any key...";
            return;
        }

        const tdiff = this.timeSeconds - (this.time.now - this.time.startTime) / 1000;
        if (tdiff <= 0 || this.player.body === undefined) {
            return;
        }

        this.player.rotation = 0;
        this.handle_controls();

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

    next_scene() {
        currentScene = 'basescene';
        this.scene.scene.start(currentScene);
    }
}
// TODO: simplify
// TODO: simplify
// TODO: simplify


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
    scene: [PreLoader, Menu, Learn, BaseScene]
};

const game = new Phaser.Game(config);
let currentScene = 'menu';


class ItemPickAndDrop {

    itemOnPlaceholder;
    squarePos;
    canThrow; // ебаный костыль

    static THROW_DELTA_POS = 100;
    static THROW_SPEED = 15;
    static SQUARE_POS_X = 0.9;
    static SQUARE_POS_Y = 0.05;

    constructor(game, w, h, player) {
        this.game = game;
        this.squarePos = {
            x: w * ItemPickAndDrop.SQUARE_POS_X,
            y: h * ItemPickAndDrop.SQUARE_POS_Y
        };
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
        const distance = Math.sqrt((this.game.player.x - item.x) * (this.game.player.x - item.x) + (this.game.player.y - item.y) * (this.game.player.y - item.y));
        if (distance > 160) {
            return;
        }
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
        item.setAngularVelocity(0.25);
    }

    isPickedUp() {
        //     v wow so cool
        return !!this.itemOnPlaceholder;
    }
}
