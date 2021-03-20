class World {
    nodes = {};

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    init(mode) {
        this.mode = mode;
        this.nodes = {};
        this.nextID = 0;
        
        this.addNode(-1);

        console.log("Initialized " + mode);
    }
    
    update() {
        var keys = Object.keys(this.nodes);
        for (var i = 0; i < keys.length - 1; ++i) {
            for (var j = i + 1; j < keys.length; ++j) {
                let k1 = parseInt(keys[i]);
                let k2 = parseInt(keys[j]);
                var n1 = this.nodes[k1];
                var n2 = this.nodes[k2];

                var offx = n1.position[0] - n2.position[0];
                var offy = n1.position[1] - n2.position[1];

                var sqr_dist = offx * offx + offy * offy;
                var dist = Math.sqrt(sqr_dist);
                var dx = offx / dist;
                var dy = offy / dist;

                if (n1.connections.indexOf(k2) >= 0) {
                    var s = dist - 100.0;
                    n1.force[0] -= dx * s * 0.01;
                    n1.force[1] -= dy * s * 0.01;
                    n2.force[0] += dx * s * 0.01;
                    n2.force[1] += dy * s * 0.01;
                }
                else {
                    n1.force[0] += dx * (1.0 / dist) * 100.0;
                    n1.force[1] += dy * (1.0 / dist) * 100.0;
                    n2.force[0] -= dx * (1.0 / dist) * 100.0;
                    n2.force[1] -= dy * (1.0 / dist) * 100.0;
                }
            }
        }

        for (let id in this.nodes) {
            var node = this.nodes[id];
            node.position[0] += node.force[0];
            node.position[1] += node.force[1];
            node.position[0] = Math.min(Math.max(node.position[0], 20.0), this.width - 20.0);
            node.position[1] = Math.min(Math.max(node.position[1], 20.0), this.height - 20.0);
            node.force[0] = 0.0;
            node.force[1] = 0.0;
        }
    }

    draw(ctx) {
        var keys = Object.keys(this.nodes);
        for (var i = 0; i < keys.length - 1; ++i) {
            for (var j = i + 1; j < keys.length; ++j) {
                var k1 = parseInt(keys[i]);
                var k2 = parseInt(keys[j]);
                var n1 = this.nodes[k1];
                var n2 = this.nodes[k2];

                if (n1.connections.indexOf(k2) >= 0) {
                    console.log(k1, n2);
                    ctx.beginPath();
                    ctx.moveTo(n1.position[0], n1.position[1]);
                    ctx.lineTo(n2.position[0], n2.position[1]);
                    ctx.stroke();
                }            
            }
        }

        for (let id in this.nodes) {
            var node = this.nodes[id];

            ctx.beginPath();
            ctx.arc(
                node.position[0],
                node.position[1],
                20, 0, 2 * Math.PI
            );
            ctx.fillStyle = "black";
            ctx.fill();
        
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = "white";
            ctx.fillText(
                id,
                node.position[0],
                node.position[1] + 6
            );
        }
    }

    addNode(target) {
        var node = new Node(this, this.nextID, target);
        this.nextID += 1;
        node.position[0] = Math.random() * this.width;
        node.position[1] = Math.random() * this.height;
        this.nodes[node.id] = node;
    }

    killNode(target) {
        console.log("Killed " + target.toString());
        delete this.nodes[target];
    }

    getNode(id) {
        return this.nodes[id];
    }
}

class Node {
    connections = [];
    position = [ 0.0, 0.0 ];
    force = [ 0.0, 0.0 ];
    id = 0;

    constructor(world, id, target) {
        this.world = world;
        this.id = id;

        var targetN = this.world.getNode(target);
        if (targetN != undefined) {
            this.connections.push(targetN.id);
            targetN.connections.push(this.id);
        }
    }
}

function animate(world, ctx) {
    world.update();

    ctx.clearRect(0, 0, world.width, world.height);
    world.draw(ctx);
    setTimeout(function() { animate(world, ctx); }, 50);
}

document.addEventListener("DOMContentLoaded", function(event) {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var world = new World(canvas.width, canvas.height);

    var modeSelect = document.getElementById("modeSelect");
    var initButton = document.getElementById("initButton");

    initButton.addEventListener("click", function(event) {
        world.init(modeSelect.value);
    });

    var idInput = document.getElementById("idInput");
    var addNodeButton = document.getElementById("addNodeButton");
    var killNodeButton = document.getElementById("killNodeButton");

    addNodeButton.addEventListener("click", function(event) { 
        world.addNode(parseInt(idInput.value));
    });

    killNodeButton.addEventListener("click", function(event) { 
        world.killNode(parseInt(idInput.value));
    });

    animate(world, ctx);
});