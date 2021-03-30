/*
	Message types:

	- requestBootstrap:
		- src (id)
	- bootstrap:
		- bootstrap peers (list of ids)
	- closerPeerSearch:
		- src (id)
	- successorCandidate:
		- succesor (id)
*/

class RingNode extends GenericNode {
	static UPDATE_TIME = 1.0; 
	static MAX_BOOTSTRAP_PEERS = 8;
	static MAX_NEIGHBOURS = 1;

	constructor(id, world, target) {
		super(id);

		this.time = 0.0;
		this.requestedConnections = new Map();

		this.bootstrapPeers = new Set();
		this.bootstrappingPeer = undefined;
		this.peers = new Set();
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

		// Update RN protocol
		this.time += dt;
		if (this.time > RingNode.UPDATE_TIME) {
			this.time = 0.0;

			// Choose random action
			let action = Math.floor(Math.random() * 3);
			switch(action) {
				case 0: {
					// Update peer set
					this.peers = new Set([
						...this.successorCandidatesW,
						...this.successorCandidatesB,
						...this.neighbours
					]);
					this.peers.add(this.bootstrappingPeer);						
					this.peers.delete(undefined);

					this.successorCandidatesW.clear();
					this.successorCandidatesB.clear();

					// Find closest peer
					let target = undefined;
					let targetDistance = undefined;

					for (let peer of this.peers.values()) {
						let dist = RingNode.distance(this.id, peer);
						if (target == undefined || dist < targetDistance) {
							target = peer;
							targetDistance = dist;
						}
					}

					// Set it as the successor if it isn't already
					if (target != undefined && this.neighbours[0] != target) {
						let con = world.addConnection(this, world.getNode(target));
						if (con != undefined) {
							// Destroy old connection
							if (this.neighbours[0] != undefined) {
								let oldCon = world.getConnection(this, world.getNode(this.neighbours[0]));
								if (oldCon != undefined) {
									oldCon.destroy(this);
								}	
							}

							this.neighbours[0] = target;
						}
					}

					break;
				}
				case 1: {
					// Peer is isolated
					if (this.bootstrapPeers.size == 0) {
						break;
					}

					// Choose a new bootstrapping peer
					let index = Math.floor(Math.random() * (this.bootstrapPeers.size + 1));
					let peer = undefined;
					if (index == 0) {
						peer = this.neighbours[0];
					}
					
					if (peer == undefined) {
						index = Math.floor(Math.random() * this.bootstrapPeers.size) + 1;
						peer = Array.from(this.bootstrapPeers)[index - 1];
					}
					
					// Try to connect
					let con = world.addConnection(this, world.getNode(peer), 1);
					if (con != undefined) {
						this.bootstrappingPeer = peer;
					}
					else {
						// Remove peer from bootstrap peers set
						this.bootstrapPeers.delete(peer);

						// Use last bootstrap peer
						if (this.bootstrappingPeer != undefined) {
							con = world.addConnection(this, world.getNode(this.bootstrappingPeer), 1);
						}
					}

					// Start closer-peer search
					if (con != undefined) {
						con.send(this, {
							type: "closerPeerSearch",
							src: this.id
						});
					}

					break;
				}
				case 2: {
					// Get neighbours

					break;
				}
			}
		}
	}

	process(msg) {
		switch (msg.type) {
			case "requestBootstrap": {
				if (msg.src == this.id) {
					break;
				}

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
				if (msg.src == this.id) {
					break;
				}

				// Receive bootstrapping IDs
				for (let peer of msg.peers.values()) {
					if (this.bootstrapPeers.size >= RingNode.MAX_BOOTSTRAP_PEERS) {
						break;
					}
					if (peer != this.id) {
						this.bootstrapPeers.add(peer);
					}
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
			case "closerPeerSearch": {
				if (msg.src == this.id) {
					break;
				}

				// Get closest to msg.src from [this.id, ...this.neighbours]
				let closest = this.id;
				let closestDistance = RingNode.distance(this.id, msg.src);
				for (let i = 0; i < this.neighbours.length; ++i) {
					if (this.neighbours[i] != undefined) {
						let dist = RingNode.distance(this.neighbours[i], msg.src);
						if (dist < closestDistance) {
							closest = this.neighbours[i];
							closestDistance = dist;
						}
					}
				}

				// If this is the closest peer, stop search
				if (closest == this.id) {
					let con = world.addConnection(this, world.getNode(msg.src), 1);
					if (con != undefined) {
						this.successorCandidatesB.add(msg.src);
						con.send(this, {
							type: "successorCandidate",
							successor: this.neighbours[0],
						});
					}
				}
				// Else, continue the search on the closest peer
				else {
					let con = world.addConnection(this, world.getNode(closest), 1);
					if (con != undefined) {
						con.send(this, {
							type: "closerPeerSearch",
							src: msg.src,
						});
					}
				}

				break;
			}
			case "successorCandidate": {
				if (msg.successor != this.id) {
					this.successorCandidatesW.add(msg.successor);
				}
				break;
			}
		}
	}

	static distance(u, v) {
		const MAX_INDEX = 1000000; 
		return (((v - u) % MAX_INDEX) + MAX_INDEX) % MAX_INDEX;
	}
}