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
})
app.stage.addChild(background);

// Add containers

let connectionContainer = new PIXI.Container();
let nodeContainer = new PIXI.Container();
app.stage.addChild(connectionContainer);
app.stage.addChild(nodeContainer);

// Init buttons

let createButOnTex = PIXI.Texture.from('assets/create_button_on.png');
let createButOffTex = PIXI.Texture.from('assets/create_button_off.png');
let deleteButOnTex = PIXI.Texture.from('assets/delete_button_on.png');
let deleteButOffTex = PIXI.Texture.from('assets/delete_button_off.png');
let freeButOnTex = PIXI.Texture.from('assets/free_on.png');
let freeButOffTex = PIXI.Texture.from('assets/free_off.png');
let ringButOnTex = PIXI.Texture.from('assets/ring_on.png');
let ringButOffTex = PIXI.Texture.from('assets/ring_off.png');
let nodeTex = PIXI.Texture.from('assets/node.png');

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

let freeBut = new PIXI.Sprite(freeButOffTex);
freeBut.scale.x = 0.25;
freeBut.scale.y = 0.25;
freeBut.x = 88;
freeBut.y = 8;
freeBut.interactive = true;
freeBut.buttonMode = true;
freeBut.data = { reset: true, mode: "free" };
app.stage.addChild(freeBut);
freeBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

let ringBut = new PIXI.Sprite(ringButOffTex);
ringBut.scale.x = 0.25;
ringBut.scale.y = 0.25;
ringBut.x = 88 + 68;
ringBut.y = 8;
ringBut.interactive = true;
ringBut.buttonMode = true;
ringBut.data = { reset: true, mode: "ring" };
app.stage.addChild(ringBut);
ringBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

// Start app

let inputMode = "none";
let world = new World("free");
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

    if (world.mode == "free" || freeBut.hovered) {
        freeBut.texture = freeButOnTex;
    }
    else {
        freeBut.texture = freeButOffTex;
    }

    if (world.mode == "ring" || ringBut.hovered) {
        ringBut.texture = ringButOnTex;
    }
    else {
        ringBut.texture = ringButOffTex;
    }
}

function butPointerUp() {
    if (this.data.reset) {
        world.destroy();
        world = new World(this.data.mode);
    }
    else {
        if (inputMode == this.data.mode) {
            inputMode = "none";
        }
        else {
            inputMode = this.data.mode;
        }
    
        updateButtonTex();
    }
}

function butPointerOver() {
    this.hovered = true;
    updateButtonTex();
}

function butPointerOut() {
    this.hovered = false;
    updateButtonTex();
}
