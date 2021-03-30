/*
	Message types:

	- requestBootstrap:
		- src (id)
	- bootstrap:
		- bootstrap peers (list of ids)
*/

class RingNode extends GenericNode {
	static CON_TIMEOUT = 10.0; 
	static MAX_BOOTSTRAP_PEERS = 8;
	static MAX_NEIGHBOURS = 1;

	constructor(id, world, target) {
		super(id);

		this.time = 0.0;
		this.requestedConnections = new Map();

		this.bootstrapPeers = new Set();
		this.successorCandidatesB = new Set();
		this.successorCandidatesW = new Set();
		this.neighbours = new Array(this.MAX_NEIGHBOURS);
		this.neighbours.fill(undefined);

		// Request bootstrap nodes
		let con = world.addConnection(this, world.getNode(target), 1);
		if (con != undefined) {
			con.send(this, {
				type: "requestBootstrap",
				src: this.id,
			});
			this.bootstrapPeers.add(target);
		}
	}

	update(dt) {
		super.update(dt);

		this.time += dt;
	}

	process(msg) {
		switch (msg.type) {
			case "requestBootstrap": {
				// Send bootstrapping IDs
				let con = world.addConnection(this, world.getNode(msg.src), 1);
				if (con != undefined) {
					con.send(this, {
						type: "bootstrap",
						src: this.id,
						peers: new Set(this.bootstrapPeers)
					});
				}				
				break;
			}
			case "bootstrap": {
				// Receive bootstrapping IDs
				for (let peer of msg.peers.values()) {
					if (this.bootstrapPeers.size >= this.MAX_BOOTSTRAP_PEERS) {
						break;
					}
					this.bootstrapPeers.add(peer);
				}

				// Set peer as successor if this doesn't have a successor
				if (this.neighbours[0] == undefined) {
					let con = world.addConnection(this, world.getNode(msg.src));
					if (con != undefined) {
						this.neighbours[0] = msg.src;
					}
				}
				break;
			}
		}
	}

	static distance(u, v) {
		return (((v - u) % world.nextIndex) + world.nextIndex) % world.nextIndex;
	}
}