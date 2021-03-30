/*
	Message types:

	- requestConnection:
		- src (id)
	- acceptConnection:
		- src (id)
	- requestBootstrap:
		- src (id)
	- bootstrap:
		- bootstrap peers (list of ids)
*/

class RingNode extends GenericNode {
	static CON_TIMEOUT = 10.0; 
	static MAX_BOOTSTRAP_PEERS = 8;

	constructor(id, world, target) {
		super(id);

		this.time = 0.0;
		this.requestedConnections = new Map();

		this.bootstrapPeers = new Set();
		this.successorCandidatesB = new Set();
		this.successorCandidatesW = new Set();
		this.neighbours = [];

		// Try to connect to network
		let con = world.addConnection(this, world.getNode(target), true);
		if (con != undefined) {
			con.send(this, {
				type: "requestConnection",
				src: this.id,
			});
			this.requestedConnections.set(target, [this.time, con]);
			this.bootstrapPeers.push(target);
		}
	}

	update(dt) {
		super.update(dt);

		this.time += dt;

		// Check connection timeouts
		for (const [target, [time, con]] of this.requestedConnections.entries()) {
			if (this.time - time > RingNode.CON_TIMEOUT) {
				world.killConnection(con.id);
				this.requestedConnections.delete(target);
				this.neighbours.splice(this.neighbours.indexOf(target), 1);
				break;
			}
        }
	}

	process(msg) {
		switch (msg.type) {
			case "requestConnection": {
				// Accept incoming connctions, send bootstrapping IDs
				let con = world.getConnection(this, world.getNode(msg.src));
				if (con != undefined) {
					con.send(this, {
						type: "acceptConnection",
						src: this.id,
					});
				}				
				break;
			}
			case "acceptConnection": {
				// Receive bootstrapping IDs
				if (this.requestedConnections.get(msg.src) != undefined) {
					con.promote();
					this.requestedConnections.delete(msg.src);
					if (this.neighbours.indexOf(msg.src) == -1) {
						this.neighbours.push(msg.src);
					}
				}
				break;
			}
			case "requestBootstrap" {
				break;
			}
		}
	}

	static distance(u, v) {
		return (((v - u) % world.nextIndex) + world.nextIndex) % world.nextIndex;
	}
}