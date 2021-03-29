/*
	Message types:

	- requestConnection:
		- src (id)
	- acceptConnection:
		- src (id)
*/

class RingNode extends GenericNode {
	static CON_TIMEOUT = 10.0; 
	static CLOSEST_PEER_SEARCH_TIME = 5.0;
	static NEIGHBOUR_UPDATE_TIME = 5.0;

	constructor(id, world, target) {
		super(id);

		this.time = 0.0;
		this.cpsTime = 0.0;
		this.nuTime = 0.0;
		this.requestedConnections = new Map();

		this.peers = new Set();
		this.neighbours = [];
		this.sucW = new Set();
		this.sucB = new Set();
		this.s = target;

		// Try to connect to network
		let con = world.addConnection(this, world.getNode(target), true);
		if (con != undefined) {
			con.send(this, {
				type: "requestConnection",
				src: this.id,
			});
			this.requestedConnections.set(target, [this.time, con]);
			this.neighbours.add(target);
		}
	}

	update(dt) {
		super.update(dt);

		this.time += dt;
		this.cpsTime += dt;
		this.nuTime += dt;

		// Check connection timeouts
		for (const [target, [time, con]] of this.requestedConnections.entries()) {
			if (this.time - time > RingNode.CON_TIMEOUT) {
				world.killConnection(con.id);
				this.requestedConnections.delete(target);
				break;
			}
        }

		// Closest peer search
		if (this.cpsTime > RingNode.CLOSEST_PEER_SEARCH_TIME) {
			this.cpsTime = 0.0;
			
			let arr = Array.from(this.neighbours);
    		this.s = arr[Math.floor(Math.random() * arr.length)];
			let con = world.getConnection(this, world.getNode(this.s));

			if (con != undefined) {
				con.send(this, {
					type: "cps",
					src: this.id,
					u: this.id,
				});
			}
		}
		// Neighbour update
		else if (this.nuTime > RingNode.NEIGHBOUR_UPDATE_TIME) {
			this.nuTime = 0.0;
			
		}
		// Update peer list
		else {
			this.peers = new Set([this.sucW, this.sucB, new Set(this.neighbours)]);
			if (this.s != -1) {
				this.peers.add(this.s);
			}

			for (const peer of this.peers.values()) {
				let dist = RingNode.distance(this.id, peer);
				if (this.neighbours.length == 0 || RingNode.distance(this.id, peer) < RingNode.distance(this.id, this.neighbours[0])) {
					this.suc = peer;
				}
			}
		}
	}

	process(msg) {
		let con = world.getConnection(this, world.getNode(msg.src));
		if (con == undefined) {
			return;
		}

		switch (msg.type) {
			case "requestConnection":
				// Accept all incoming connections for now
				con.send(this, {
					type: "acceptConnection",
					src: this.id,
				});
				break;
			case "acceptConnection":
				if (this.requestedConnections.get(msg.src) != undefined) {
					con.promote();
					this.requestedConnections.delete(msg.src);
				}
				break;
		}
	}

	static distance(u, v) {
		return (((v - u) % world.nextIndex) + world.nextIndex) % world.nextIndex;
	}
}