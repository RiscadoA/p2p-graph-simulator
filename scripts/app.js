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
let nodeTex = PIXI.Texture.from('assets/node.png');

let createBut = new PIXI.Sprite(createButOffTex);
createBut.anchor.set(0.5);
createBut.scale.x = 0.25;
createBut.scale.y = 0.25;
createBut.x = 24;
createBut.y = 24;
createBut.interactive = true;
createBut.buttonMode = true;
createBut.data = { mode: "create" };
app.stage.addChild(createBut);
createBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

let deleteBut = new PIXI.Sprite(deleteButOffTex);
deleteBut.anchor.set(0.5);
deleteBut.scale.x = 0.25;
deleteBut.scale.y = 0.25;
deleteBut.x = 64;
deleteBut.y = 24;
deleteBut.interactive = true;
deleteBut.buttonMode = true;
deleteBut.data = { mode: "delete" };
app.stage.addChild(deleteBut);
deleteBut
    .on('pointerup', butPointerUp)
    .on('pointerover', butPointerOver)
    .on('pointerout', butPointerOut);

// Start app

let inputMode = "none";
let world = new World("ring");
app.ticker.add(delta => world.update(delta));

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
}

function butPointerUp() {
    if (inputMode == this.data.mode) {
        inputMode = "none";
    }
    else {
        inputMode = this.data.mode;
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
