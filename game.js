const W = 1280;
const H = 720;
const EXTRA_BOUNDS_SIZE = 300;
const DEBUG = true;


function randomPos() {
    return {
        x: Math.random(),
        y: Math.random()
    }
}

function getDistance({x: x1, y: y1}, {x: x2, y: y2}) {
    return Phaser.Math.Distance.Between(x1, y1, x2, y2);
}

function getAngle({x: x1, y: y1}, {x: x2, y: y2}) {
    return Phaser.Math.Angle.Between(x1, y1, x2, y2);
}

function getAngleDifference(from, to1, to2) {
    return Math.abs(getAngle(from, to1) - getAngle(from, to2));
}

function getDistanceFactors(p2, p1) {
    const {x: x1, y: y1} = p1;
    const {x: x2, y: y2} = p2;
    let dx = x2 - x1;
    let dy = y2 - y1;
    let total = Math.abs(dx) + Math.abs(dy);
    let xFactor = (dx / total);
    let yFactor = (dy / total);
    return new Phaser.Math.Vector2(xFactor, yFactor);
}

class BaseScene extends Phaser.Scene {

    itemPickAndDrop;
    broomHandler;

    constructor(key='basescene') {
        super({ key: key });
        this.itemPickAndDrop = new ItemPickAndDrop(this, W, H);
        this.broomHandler = new BroomHandler(this, W, H);
    }

    player;
    cursors;
    speed;
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

        if (this.itemPickAndDrop === undefined) {
            this.itemPickAndDrop = new ItemPickAndDrop(this, W, H);
        }
        this.itemPickAndDrop.preloadAssets();
        this.broomHandler.preloadAssets();
    }

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.speed = 6;
        this.itemPickAndDrop.initKeyboardAction();
        this.trashLeft = (this.trashLeft === undefined)? 50 : this.trashLeft;
        this.instantiate_objects(this.trashLeft);
        this.timeSeconds = 90;
        this.timeText = this.add.text(W / 2, 8, 'Hurry up!', { color: '#ffffff' });
        this.add.text(50, 8, 'Press SPACE to restart', { color: '#ffffff' });
    }

    instantiate_objects(maxObjects=50) {
        console.log(maxObjects);
        this.trashLeft = maxObjects;

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

        this.player = this.matter.add.sprite(100, 400, 'player_sheet').setScale(0.304878, 0.3);

        this.player.setVelocity(0, 0);
        this.player.setBounce(1, 1);
        this.player.name = "player";
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 4, end: 4 }),
            frameRate: 10,
            duration: 1,
            repeat: -1
        });
        this.anims.create({
            key: 'go',
            frames: this.anims.generateFrameNumbers('player_sheet', { start: 0, end: 5 }),
            frameRate: 10,
            duration: 4,
            repeat: -1
        });
        this.player.play('idle');
        this.player.lookLeft = true;

        const topwall = this.matter.add.image(EXTRA_BOUNDS_SIZE, 0, 'transparent').setScale(W + EXTRA_BOUNDS_SIZE, 190);

        topwall.setBounce(1, 1);
        topwall.setStatic(true);
        topwall.setFriction(0.005);

        const leftwall = this.matter.add.image(-EXTRA_BOUNDS_SIZE + 2, 0, 'transparent').setScale(EXTRA_BOUNDS_SIZE, H);

        leftwall.setBounce(1, 1);
        leftwall.setStatic(true);
        leftwall.setFriction(0.005);

        const rightwall = this.matter.add.image(EXTRA_BOUNDS_SIZE + W - 2, 0, 'transparent').setScale(EXTRA_BOUNDS_SIZE, H);

        rightwall.setBounce(1, 1);
        rightwall.setStatic(true);
        rightwall.setFriction(0.005);

        const botwall = this.matter.add.image(-EXTRA_BOUNDS_SIZE, H + EXTRA_BOUNDS_SIZE - 2, 'transparent').setScale(W + EXTRA_BOUNDS_SIZE, EXTRA_BOUNDS_SIZE);

        botwall.setBounce(1, 1);
        botwall.setStatic(true);
        botwall.setFriction(0.005);

        this.itemPickAndDrop.initItemPlaceholder();
        this.broomHandler.createBroom(randomPos())

        const table = this.matter.add.image(W/2, H/2, 'table');

        table.setBounce(1, 1);
        table.setStatic(true);
        table.setFriction(0.005);

        for (let i = 0; i < maxObjects; i++) {
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
        r.name = 'rubbish';
    }

    update() {
        if (this.cursors.space.isDown) {
            this.trashLeft = 50;
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

    handle_controls() {
        let speed = (this.cursors.shift.isDown) ? this.speed * 2 : this.speed;

        let xmove = this.cursors.left.isDown || this.cursors.right.isDown || this.input.keyboard.addKey('A').isDown || this.input.keyboard.addKey('D').isDown;
        let ymove = this.cursors.up.isDown || this.cursors.down.isDown || this.input.keyboard.addKey('W').isDown || this.input.keyboard.addKey('S').isDown;

        if (this.cursors.left.isDown || this.input.keyboard.addKey('A').isDown) {
            this.player.setVelocityX((ymove)? -speed / 1.5 : -speed);
            this.player.anims.play('go', true);
            if (!this.player.lookLeft) {
                this.player.lookLeft = true;
                this.player.setFlipX(false);
            }
        } else if (this.cursors.right.isDown || this.input.keyboard.addKey('D').isDown) {
            this.player.setVelocityX((ymove)? speed / 1.5 : speed);
            this.player.anims.play('go', true);
            if (this.player.lookLeft) {
                this.player.lookLeft = false;
                this.player.setFlipX(true);
            }
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown || this.input.keyboard.addKey('W').isDown) {
            this.player.setVelocityY((xmove)? -speed / 1.5 : -speed);
            this.player.anims.play('go', true);
        } else if (this.cursors.down.isDown || this.input.keyboard.addKey('S').isDown) {
            this.player.setVelocityY((xmove)? speed / 1.5 : speed);
            this.player.anims.play('go', true);
        } else {
            this.player.setVelocityY(0);
        }

        if (!xmove && !ymove) {
            this.player.anims.play('idle', true);
        }

        this.itemPickAndDrop.checkIfKeyboardActionHappens();

        this.broomHandler.active = this.itemPickAndDrop.itemOnPlaceholder === this.broomHandler.broomReference;
        this.broomHandler.handleClick();
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
        currentScene = 'learn';
        // currentScene = 'basescene';
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


class Learn extends BaseScene {
    constructor() {
        super('learn');
    }

    create() {
        this.trashLeft = 2;
        super.create();
        this.add.text(50, 32, 'Your parents are coming!\nMove to rubbish and throw it to the window!', { color: '#ffffff' });
    }

    update() {
        if (this.trashLeft === 0) {
            this.input.keyboard.on('keydown', this.next_scene);
            this.timeText.text = "You are ready for real challenge! Press any key...";
            return;
        }

        super.update();
    }

    upd_time(diff) {}

    next_scene() {
        currentScene = 'basescene';
        this.scene.scene.start(currentScene);
    }
}


const config = {
    type: Phaser.AUTO,
    width: W,
    height: H,
    physics: {
        default: 'matter',
        matter: {
            debug: DEBUG,
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
        const distance = getDistance(this.game.player, item);
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
        let {x: xFactor, y: yFactor} = getDistanceFactors({x, y}, item);
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

class BroomHandler {
    broomReference;
    game;
    w;
    h;
    active = true;
    inUse = false;

    static FUCKING_SPEED = 15;
    static ANGLE_IN_RADIANS = Math.PI / 2;
    static DIRECTION_ERROR_IN_RADIANS = Math.PI * (1 / 3);
    static BROOM_LENGTH = 150;

    constructor(game, w, h) {
        this.game = game;
        this.w = w;
        this.h = h;
    }

    preloadAssets() {
        this.game.load.image('broom', 'fg/broom.png');
    }

    createBroom({x, y}) {
        this.broomReference = this.game.matter.add.image(x * this.w, y * this.h, 'broom');
        this.broomReference.setScale(2, 2);
        this.broomReference.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, 64, 64),
            Phaser.Geom.Rectangle.Contains
        );
    }

    handleClick() {
        let p = this.game.input.mousePointer;
        if (!p.rightButtonDown()) {
            this.inUse = false;
        }
        if (p.rightButtonDown() && this.active && !this.inUse) {
            this.inUse = true;
            this.act(p);
        }
    }

    act(targetPosXY) {
        this.game.matter.world.localWorld.bodies
            .map(x => x.gameObject)
            .filter(x => x.name === 'rubbish'
                && getDistance(this.game.player, x) < BroomHandler.BROOM_LENGTH
                && getAngleDifference(this.game.player, targetPosXY, x) < BroomHandler.ANGLE_IN_RADIANS)
            .forEach(x => {
                let factors = getDistanceFactors(targetPosXY, x);
                factors.rotate((BroomHandler.DIRECTION_ERROR_IN_RADIANS * Math.random()) - (BroomHandler.DIRECTION_ERROR_IN_RADIANS / 2));
                const speedMP = BroomHandler.FUCKING_SPEED // базовая скорость / база
                    * (1.5 - Math.random() / 2) // случайное изменение скорости чисто по приколу
                    * 2.0 * (1.0 - Math.max(getDistance(this.game.player, x) / BroomHandler.BROOM_LENGTH, 0.5)); // уменьшение скорости для дальних объектов
                x.setVelocityX(factors.x * speedMP);
                x.setVelocityY(factors.y * speedMP);
                x.setAngularVelocity(0.5 - Math.random()); // пусть вертится хуле нет
            });
    }
}

