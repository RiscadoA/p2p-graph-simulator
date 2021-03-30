// Init PIXI application

let app = new PIXI.Application({
    antialias: true,
});
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoDensity = true;
app.renderer.resize(window.innerWidth, window.innerHeight);
app.renderer.backgroundColor = 0x333333;
document.body.appendChild(app.view);

// Init background

let background = new PIXI.Container();
background.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);
background.interactive = true;
background.on('pointerup', function (event) {
    if (inputMode == "create") {
        let pos = event.data.getLocalPosition(background);
        world.addNode(-1, [pos.x, pos.y])
    }
    else if (inputMode == "line") {
        world.nodeUp(-1);
    }
});
background.on('pointerover', function (event) {
    if (inputMode == "line") {
        world.nodeOver(-1);
    }
});
app.stage.addChild(background);

// Add containers

let connectionContainer = new PIXI.Container();
let arrowContainer = new PIXI.Container();
let nodeContainer = new PIXI.Container();
app.stage.addChild(connectionContainer);
app.stage.addChild(arrowContainer);
app.stage.addChild(nodeContainer);

// Init buttons

let createButOnTex = PIXI.Texture.from('assets/create_button_on.png');
let createButOffTex = PIXI.Texture.from('assets/create_button_off.png');
let deleteButOnTex = PIXI.Texture.from('assets/delete_button_on.png');
let deleteButOffTex = PIXI.Texture.from('assets/delete_button_off.png');
let lineButOnTex = PIXI.Texture.from('assets/line_on.png');
let lineButOffTex = PIXI.Texture.from('assets/line_off.png');
let simpleButOnTex = PIXI.Texture.from('assets/simple_on.png');
let simpleButOffTex = PIXI.Texture.from('assets/simple_off.png');
let ringButOnTex = PIXI.Texture.from('assets/ring_on.png');
let ringButOffTex = PIXI.Texture.from('assets/ring_off.png');
let helpButOnTex = PIXI.Texture.from('assets/help_on.png');
let helpButOffTex = PIXI.Texture.from('assets/help_off.png');
let nodeTex = PIXI.Texture.from('assets/node.png');
let arrowTex = PIXI.Texture.from('assets/arrow.png');

let createBut = new PIXI.Sprite(createButOffTex);
createBut.scale.x = 0.25;
createBut.scale.y = 0.25;
createBut.x = 8;
createBut.y = 8;
createBut.interactive = true;
createBut.buttonMode = true;
createBut.data = { reset: false, mode: "create" };
app.stage.addChild(createBut);
createBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

let deleteBut = new PIXI.Sprite(deleteButOffTex);
deleteBut.scale.x = 0.25;
deleteBut.scale.y = 0.25;
deleteBut.x = 48;
deleteBut.y = 8;
deleteBut.interactive = true;
deleteBut.buttonMode = true;
deleteBut.data = { reset: false, mode: "delete" };
app.stage.addChild(deleteBut);
deleteBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

let lineBut = new PIXI.Sprite(lineButOffTex);
lineBut.scale.x = 0.25;
lineBut.scale.y = 0.25;
lineBut.x = 88;
lineBut.y = 8;
lineBut.interactive = true;
lineBut.buttonMode = true;
lineBut.data = { reset: false, mode: "line" };
app.stage.addChild(lineBut);
lineBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

let simpleBut = new PIXI.Sprite(simpleButOffTex);
simpleBut.scale.x = 0.25;
simpleBut.scale.y = 0.25;
simpleBut.x = 128;
simpleBut.y = 8;
simpleBut.interactive = true;
simpleBut.buttonMode = true;
simpleBut.data = { reset: true, mode: "simple" };
app.stage.addChild(simpleBut);
simpleBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

let ringBut = new PIXI.Sprite(ringButOffTex);
ringBut.scale.x = 0.25;
ringBut.scale.y = 0.25;
ringBut.x = 202;
ringBut.y = 8;
ringBut.interactive = true;
ringBut.buttonMode = true;
ringBut.data = { reset: true, mode: "ring" };
app.stage.addChild(ringBut);
ringBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

let helpBut = new PIXI.Sprite(ringButOffTex);
helpBut.scale.x = 0.25;
helpBut.scale.y = 0.25;
helpBut.x = window.innerWidth - 40;
helpBut.y = 8;
helpBut.interactive = true;
helpBut.buttonMode = true;
helpBut.data = { mode: "help" };
app.stage.addChild(helpBut);
helpBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

let numberButsTex = [];
let numberButs = [];
for (let i = 1; i <= 4; ++i) {
    let onTex = PIXI.Texture.from('assets/' + i + '_on.png');
    let offTex = PIXI.Texture.from('assets/' + i + '_off.png');
    numberButsTex.push([onTex, offTex]);
    let but = new PIXI.Sprite(offTex);
    but.scale.x = 0.25;
    but.scale.y = 0.25;
    but.x = 8 + 40 * (i - 1);
    but.y = 48;
    but.interactive = true;
    but.buttonMode = true;
    but.number = i;
    but.data = { reset: true, mode: "number" };
    numberButs.push(but);
    app.stage.addChild(but);
    but
        .on('pointerup', butPointerUp)
        .on('pointerover', butPointerOver)
        .on('pointerout', butPointerOut);
    but.visible = false;
}

// Start app

let inputMode = "none";
let world = new World("simple");
app.ticker.add(delta => world.update(delta * 0.001));
updateButtonTex();

function updateButtonTex() {
    if (inputMode == "create" || createBut.hovered) {
        createBut.texture = createButOnTex;
    }
    else {
        createBut.texture = createButOffTex;
    }

    if (inputMode == "delete" || deleteBut.hovered) {
        deleteBut.texture = deleteButOnTex;
    }
    else {
        deleteBut.texture = deleteButOffTex;
    }

    if (inputMode == "line" || lineBut.hovered) {
        lineBut.texture = lineButOnTex;
    }
    else {
        lineBut.texture = lineButOffTex;
    }

    if (world.mode == "simple" || simpleBut.hovered) {
        simpleBut.texture = simpleButOnTex;
    }
    else {
        simpleBut.texture = simpleButOffTex;
    }

    if (world.mode == "ring" || ringBut.hovered) {
        ringBut.texture = ringButOnTex;
    }
    else {
        ringBut.texture = ringButOffTex;
    }
    
    if (helpBut.hovered) {
        helpBut.texture = helpButOnTex;
    }
    else {
        helpBut.texture = helpButOffTex;
    }

    if (world.mode == "ring") {
        for (let i = 0; i < 4; ++i) {
            numberButs[i].visible = true;
            if (RingNode.MAX_NEIGHBOURS == i + 1) {
                numberButs[i].texture = numberButsTex[i][0];
            }
            else {
                numberButs[i].texture = numberButsTex[i][1];
            }
        }
    }
    else {
        for (let i = 0; i < 4; ++i) {
            numberButs[i].visible = false;
        }
    }
}

function butPointerUp() {
    if (this.data.reset) {
        let mode = this.data.mode;
        if (this.data.mode == "number") {
            mode = world.mode;
            if (mode == "ring") {
                RingNode.MAX_NEIGHBOURS = parseInt(this.number);
            }
        }

        world.destroy();
        world = new World(mode);
    }
    else {
        if (this.data.mode == "help") {
            window.open('https://riscadoa.com/web-dev/ourchat-1/');
        }
        else if (inputMode == this.data.mode) {
            inputMode = "none";
        }
        else {
            inputMode = this.data.mode;
        }
    }

    updateButtonTex();
}

function butPointerOver() {
    this.hovered = true;
    updateButtonTex();
}

function butPointerOut() {
    this.hovered = false;
    updateButtonTex();
}
