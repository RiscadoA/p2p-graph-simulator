const NODE_SCALE = 0.4;
const ARROW_SCALE = 0.4;

class World {
    mode = "simple";
    speed = 500.0;

    constructor(mode) {
        this.mode = mode;
        this.nodes = new Map();
        this.connections = new Map();
        this.nextNodeID = 0;
        this.nextConID = 0;
        
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

                    let con = this.getConnection(n1, n2);
                    if (con == undefined) {
                        con = this.getConnection(n2, n1);
                    }
                    if (con != undefined && !(con.uses[0] != undefined && con.uses[1] != undefined)) {
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

            node.position[0] += node.force[0] * dt * 1000.0;
            node.position[1] += node.force[1] * dt * 1000.0;
            node.position[0] = Math.min(Math.max(node.position[0], NODE_SCALE * 64.0), window.innerWidth - NODE_SCALE * 64.0);
            node.position[1] = Math.min(Math.max(node.position[1], NODE_SCALE * 64.0), window.innerHeight - NODE_SCALE * 64.0);
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
        if (this.mode == "simple") {
            node = new SimpleNode(this.nextNodeID, this, target);
        }
        else if (this.mode == "ring") {
            node = new RingNode(this.nextNodeID, this, target);
        }
        this.nextNodeID += 1;
        this.nodes.set(node.id, node);

        let targetN = this.getNode(target);
        if (targetN != undefined) {
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
        if (n1 == undefined || n2 == undefined) {
            return undefined;
        }

        for (let i = 0; i < n1.connections.length; ++i) {
            let con = n1.connections[i];
            if (con.n1 == n2 || con.n2 == n2) {
                return con;
            }
        }

        return undefined;
    }
    
    addConnection(n1, n2, uses = undefined) {
        if (n1 == undefined || n2 == undefined) {
            return undefined;
        }

        let con = this.getConnection(n1, n2);
        if (con != undefined) {
            con.promote(n1, n2, uses);
            return con;
        }

        con = this.getConnection(n2, n1);
        if (con != undefined) {
            con.promote(n1, n2, uses);
            n1.connections.push(con);
            return con;
        }

        con = new Connection(this.nextConID, n1, n2, uses);
        this.nextConID += 1;
        this.connections.set(con.id, con);
        n1.connections.push(con);
        return con;
    }

    killConnection(id) {
        let con = this.connections.get(id);
        if (con == undefined) {
            return;
        }
        con.destroy(con.n1);
        con.destroy(con.n2);
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

    destroy() {
        let it = this.nodes.entries().next();
        while (!it.done) {
            this.killNode(it.value[0]);
            it = this.nodes.entries().next();
        }
    }
}

class Connection {
    id = -1;
    n1 = null;
    n2 = null;
    temp = false;
    uses = [undefined, undefined];

    constructor(id, n1, n2, uses) {
        this.id = id;
        this.n1 = n1;
        this.n2 = n2;
        this.uses = [uses, 0];
        this.dirs = [true, false];
        this.queue = [];
        this.time = 0.0;
        this.tooltip = undefined;

        // Graphics
        this.graphics = new PIXI.Graphics();
        this.graphics.beginFill(0xFFFFFF);
        this.graphics.drawRect(0, -0.5, 1, 1);
        this.graphics.alpha = 0.5;
        this.graphics.hitArea = new PIXI.Rectangle(0, -0.5, 1, 1);
        this.graphics.interactive = true;
        this.graphics.buttonMode = true;
        this.graphics.connection = this;
        this.graphics.on('pointerup', function() { world.connectionClicked(this.connection.id); });
        connectionContainer.addChild(this.graphics);
        this.arrows = [undefined, undefined]
        this.checkGraphics();
    }

    checkGraphics() {
        for (let i = 0; i < 2; ++i) {
            if (this.dirs[i]) {
                if (this.arrows[i] == undefined) {
                    this.arrows[i] = new PIXI.Sprite(arrowTex);
                    this.arrows[i].anchor.set(0.5);
                    this.arrows[i].scale.x = ARROW_SCALE;
                    this.arrows[i].scale.y = ARROW_SCALE;
                    this.arrows[i].alpha = 0.5;
                    arrowContainer.addChild(this.arrows[i]);
                }
                
                if (this.uses[i] != undefined) {
                    this.arrows[i].tint = 0x888888;
                }
                else {
                    this.arrows[i].tint = 0xFFFFFF;
                }
            }
            else if (this.arrows[i] != undefined && !this.dirs[i]) {
                arrowContainer.removeChild(this.arrows[i]);
                this.arrows[i] = undefined;
            }
        }

        if (!this.dirs[0] && !this.dirs[1]) {
            connectionContainer.removeChild(this.graphics);
        }
    }

    update(dt) {
        // Connection dead?
        if (!this.dirs[0] && !this.dirs[1]) {
            world.killConnection(this.id);
        }
        else if (this.n1.destroyed || this.n2.destroyed) {
            world.killConnection(this.id);
        }

        // Update graphics
        let dirx = this.n2.position[0] - this.n1.position[0];
        let diry = this.n2.position[1] - this.n1.position[1];
        let sqr_dist = dirx * dirx + diry * diry;
        let dist = Math.sqrt(sqr_dist);
        dirx /= dist;
        diry /= dist;
        this.graphics.rotation = Math.atan2(diry, dirx);
        this.graphics.x = this.n1.position[0];
        this.graphics.y = this.n1.position[1];
        this.graphics.scale.x = dist;
        this.graphics.scale.y = NODE_SCALE * 10.0;
        if (this.arrows[1] != undefined) {
            this.arrows[1].rotation = Math.atan2(diry, dirx) - Math.PI / 2.0;
            this.arrows[1].x = this.n1.position[0] + dirx * (NODE_SCALE * 64.0 + ARROW_SCALE * 16.0);
            this.arrows[1].y = this.n1.position[1] + diry * (NODE_SCALE * 64.0 + ARROW_SCALE * 16.0);
            this.graphics.x = this.n1.position[0] + dirx * (NODE_SCALE * 64.0 + ARROW_SCALE * 31.0);
            this.graphics.y = this.n1.position[1] + diry * (NODE_SCALE * 64.0 + ARROW_SCALE * 31.0);
            this.graphics.scale.x -= (NODE_SCALE * 64.0 + ARROW_SCALE * 31.0);
        }
        if (this.arrows[0] != undefined) {
            this.arrows[0].rotation = Math.atan2(diry, dirx) + Math.PI / 2.0;
            this.arrows[0].x = this.n2.position[0] - dirx * (NODE_SCALE * 64.0 + ARROW_SCALE * 16.0);
            this.arrows[0].y = this.n2.position[1] - diry * (NODE_SCALE * 64.0 + ARROW_SCALE * 16.0);
            this.graphics.scale.x -= (NODE_SCALE * 64.0 + ARROW_SCALE * 31.0);
        }

        // Pump messages
        this.time += Math.random() * dt;
        if (this.time > 0.2) {
            this.time = 0.0;

            if (this.queue.length > 0) {
                let [node, msg] = this.queue.shift();
                if (this.n1 == node && this.dirs[0]) {
                    this.n2.pushMessage(msg);
                    if (this.uses[0] != undefined) {
                        this.uses[0] -= 1;
                        if (this.uses[0] <= 0) {
                            this.destroy(this.n1);
                        }
                    }
                }
                else if (this.n2 == node && this.dirs[1]) {
                    this.queue.push([msg]);
                    this.n1.pushMessage(msg);
                    if (this.uses[1] != undefined) {
                        this.uses[1] -= 1;
                        if (this.uses[1] <= 0) {
                            this.destroy(this.n2);
                        }
                    }
                }
            }
        }
    }

    promote(n1, n2, uses) {
        if (this.n1 == n1 && this.n2 == n2) {
            if (!this.dirs[0]) {
                this.uses[0] = 0;
            }
            this.dirs[0] = true;
            if (uses == undefined) {
                this.uses[0] = uses;
            }
            else if (this.uses[0] != undefined) {
                this.uses[0] += uses;
            }
            this.checkGraphics();
        }
        else if (this.n1 == n2 && this.n2 == n1) {
            if (!this.dirs[1]) {
                this.uses[1] = 0;
            }
            this.dirs[1] = true;
            if (uses == undefined) {
                this.uses[1] = uses;
            }
            else if (this.uses[1] != undefined) {
                this.uses[1] += uses;
            }
            this.checkGraphics();
        }
    }

    destroy(src) {
        if (this.n1 == src && this.dirs[0]) {
            this.dirs[0] = false;
            this.uses[0] = 0;
            let index = this.n1.connections.indexOf(this);
            if (index > -1) {
                this.n1.connections.splice(index, 1);
            }
        }
        else if (this.n2 == src && this.dirs[1]) {
            this.dirs[1] = false;
            this.uses[1] = 0;
            let index = this.n2.connections.indexOf(this);
            if (index > -1) {
                this.n2.connections.splice(index, 1);
            }
        }

        this.checkGraphics();
    }

    send(node, msg) {
        this.queue.push([node, msg]);
    }

    isIngoing(node) {
        if (this.n1 == node) {
            return this.dirs[1];
        }
        else if (this.n2 == node) {
            return this.dirs[0];
        }
    }

    isOutgoing(node) {
        if (this.n1 == node) {
            return this.dirs[0];
        }
        else if (this.n2 == node) {
            return this.dirs[1];
        }
    }

    getOther(node) {
        if (this.n1 == node) {
            return this.n2;
        }
        else if (this.n2 == node) {
            return this.n1;
        }
    }
}

class GenericNode {
    connections = [];
    position = [ 0.0, 0.0 ];
    force = [ 0.0, 0.0 ];
    id = 0;
    destroyed = false;

    constructor(id) {
        this.id = id;
        this.sprite = new PIXI.Sprite(nodeTex);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.x = NODE_SCALE;
        this.sprite.scale.y = NODE_SCALE;
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        this.sprite.node = this;
        this.sprite.tint = Math.random() * 0xFFFFFF;
        this.sprite
            .on('pointerup', function() {
                world.nodeClicked(this.node.id);
            })
            .on('pointerover', function() {
                this.tooltip = new PIXI.Text(this.node.id, {
                    fontSize: 40,
                    fontWeight: 'bold',
                    fill: '#000000',
                    align : 'center'
                });
                this.tooltip.x = -this.tooltip.width / 2.0;
                this.tooltip.y = -this.tooltip.height / 2.0;
                this.addChild(this.tooltip);
            })
            .on('pointerout', function() {
                this.removeChild(this.tooltip);
                delete this.tooltip;
            });
        nodeContainer.addChild(this.sprite);

        this.queue = [];
    }

    pushMessage(msg) {
        this.queue.push(msg);
    }
    
    process(msg) {
        // Overriden by child classes
    }

    update(dt) {
        this.sprite.x = this.position[0];
        this.sprite.y = this.position[1];

        while (this.queue.length > 0) {
            this.process(this.queue.shift());
        }
    }

    destroy() {
        nodeContainer.removeChild(this.sprite);
        delete this.sprite;
        this.destroyed = true;
    }
}
