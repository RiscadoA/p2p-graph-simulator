class World {
    speed = 50.0;

    constructor(mode) {
        this.mode = mode;
        this.nodes = new Map();
        this.connections = new Map();
        this.nextID = 0;    
        this.addNode(-1, [ window.innerWidth / 2.0, window.innerHeight / 2.0 ]);
    }
    
    update(dt) {
        // Apply forces between every pair of nodes
        let it1 = this.nodes.entries();
        let r1 = it1.next();
        while (!r1.done) {
            let it2 = this.nodes.entries();
            let r2 = it2.next();
            while (!r2.done && r2.value[1] != r1.value[1]) {
                r2 = it2.next();
            }

            if (!r2.done) {
                r2 = it2.next();
                while (!r2.done) {
                    let n1 = r1.value[1];
                    let n2 = r2.value[1];

                    let offx = n1.position[0] - n2.position[0];
                    let offy = n1.position[1] - n2.position[1];

                    let sqr_dist = offx * offx + offy * offy;
                    let dist = Math.sqrt(sqr_dist);
                    let dx = offx / dist;
                    let dy = offy / dist;

                    if (this.getConnection(n1, n2) != undefined) {
                        let s = dist - 100.0;
                        n1.force[0] -= dx * s * 0.02;
                        n1.force[1] -= dy * s * 0.02;
                        n2.force[0] += dx * s * 0.02;
                        n2.force[1] += dy * s * 0.02;
                    }
                    else {
                        n1.force[0] += dx * (1.0 / dist) * 100.0;
                        n1.force[1] += dy * (1.0 / dist) * 100.0;
                        n2.force[0] -= dx * (1.0 / dist) * 100.0;
                        n2.force[1] -= dy * (1.0 / dist) * 100.0;
                    }

                    r2 = it2.next();
                }
            }

            r1 = it1.next();
        }

        for (const [id, node] of this.nodes.entries()) {
            let offx = window.innerWidth / 2.0 - node.position[0];
            let offy = window.innerHeight / 2.0 - node.position[1];
            node.force[0] += offx / 200.0;
            node.force[1] += offy / 200.0;

            node.position[0] += node.force[0] * dt;
            node.position[1] += node.force[1] * dt;
            node.position[0] = Math.min(Math.max(node.position[0], 32.0), window.innerWidth - 32.0);
            node.position[1] = Math.min(Math.max(node.position[1], 32.0), window.innerHeight - 32.0);
            node.force[0] = 0.0;
            node.force[1] = 0.0;

            node.update(this.speed * dt);
        }

        for (const [id, con] of this.connections.entries()) {
            con.update(this.speed * dt);
        }
    }

    addNode(target, position = undefined) {
        var node;
        if (this.mode == "ring") {
            node = new Node(this.nextID);
        }
        this.nextID += 1;
        this.nodes.set(node.id, node);

        let targetN = this.getNode(target);
        if (targetN != undefined) {
            this.addConnection(node, targetN);
            node.position[0] = targetN.position[0] + (Math.random() - 0.5) * 200.0;
            node.position[1] = targetN.position[1] + (Math.random() - 0.5) * 200.0;
        }
        else {
            node.position[0] = Math.random() * window.innerWidth;
            node.position[1] = Math.random() * window.innerHeight;
        }

        if (position != undefined) {
            node.position[0] = position[0];
            node.position[1] = position[1];
        }
    }

    getConnection(n1, n2) {
        for (let i = 0; i < n1.connections.length; ++i) {
            let con = n1.connections[i];
            if (con.n1 == n2 || con.n2 == n2) {
                return con;
            }
        }

        return undefined;
    }
    
    addConnection(n1, n2) {
        let con = new Connection(this.nextID, n1, n2);
        this.nextID += 1;
        this.connections.set(con.id, con);
        n1.connections.push(con);
        n2.connections.push(con);
    }

    killConnection(id) {
        this.connections.get(id).destroy();
        this.connections.delete(id);
    }

    killNode(id) {
        let node = this.nodes.get(id);
        while (node.connections.length > 0) {
            this.killConnection(node.connections[0].id);
        }
        this.nodes.get(id).destroy();
        this.nodes.delete(id);
    }

    getNode(id) {
        return this.nodes.get(id);
    }

    nodeClicked(id) {
        if (inputMode == "create") {
            this.addNode(id);
        }
        else if (inputMode == "delete") {
            this.killNode(id);
        }
    }

    connectionClicked(id) {
        if (inputMode == "delete") {
            this.killConnection(id);
        }
    }
}

class Connection {
    id = -1;
    n1 = null;
    n2 = null;

    constructor(id, n1, n2) {
        this.id = id;
        this.n1 = n1;
        this.n2 = n2;
        this.graphics = new PIXI.Graphics();
        this.graphics.beginFill(0xFFFFFF);
        this.graphics.drawRect(0, -0.5, 1, 1);
        this.graphics.hitArea = new PIXI.Rectangle(0, -0.5, 1, 1);
        this.graphics.interactive = true;
        this.graphics.buttonMode = true;
        this.graphics.connection = this;
        this.graphics.on('pointerup', function() { world.connectionClicked(this.connection.id); })
        connectionContainer.addChild(this.graphics);
    }

    update() {
        let offx = this.n2.position[0] - this.n1.position[0];
        let offy = this.n2.position[1] - this.n1.position[1];
        let sqr_dist = offx * offx + offy * offy;
        let dist = Math.sqrt(sqr_dist);

        this.graphics.rotation = Math.atan2(offy, offx);
        this.graphics.x = this.n1.position[0];
        this.graphics.y = this.n1.position[1];
        this.graphics.scale.x = dist;
        this.graphics.scale.y = 5.0;
    }

    destroy() {
        let index = this.n1.connections.indexOf(this);
        if (index > -1) {
            this.n1.connections.splice(index, 1);
        }
        index = this.n2.connections.indexOf(this);
        if (index > -1) {
            this.n2.connections.splice(index, 1);
        }
        connectionContainer.removeChild(this.graphics);
    }
}

class Node {
    connections = [];
    position = [ 0.0, 0.0 ];
    force = [ 0.0, 0.0 ];
    id = 0;

    constructor(id) {
        this.id = id;
        this.sprite = new PIXI.Sprite(nodeTex);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.x = 0.5;
        this.sprite.scale.y = 0.5;
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        this.sprite.node = this;
        this.sprite.tint = Math.random() * 0xFFFFFF;
        this.sprite.on('pointerup', function() { world.nodeClicked(this.node.id); })
        nodeContainer.addChild(this.sprite);
    }

    update(dt) {
        this.sprite.x = this.position[0];
        this.sprite.y = this.position[1];
    }

    destroy() {
        nodeContainer.removeChild(this.sprite);
        delete this.sprite;
    }
}

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
