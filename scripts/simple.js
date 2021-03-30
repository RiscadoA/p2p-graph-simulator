/*
	Message types:

	- requestConnection:
		- src (id)
	- acceptConnection:
		- src (id)
	- givePeers:
		- src (id)
		- peers (id list)
*/

class SimpleNode extends GenericNode {
	static CON_TIMEOUT = 10.0;

	constructor(id, world, target) {
		super(id);

		this.time = 0.0;
		this.cpsTime = 0.0;
		this.nuTime = 0.0;
		this.requestedConnections = new Map();
		this.peers = [];

		// Try to connect to network
		let con = world.addConnection(this, world.getNode(target), 2);
		if (con != undefined) {
			con.send(this, {
				type: "requestConnection",
				src: this.id,
			});
			this.requestedConnections.set(target, [this.time, con]);
		}
	}

	update(dt) {
		super.update(dt);

		this.time += dt;
		this.cpsTime += dt;
		this.nuTime += dt;

		// Check connection timeouts
		for (const [target, [time, con]] of this.requestedConnections.entries()) {
			if (this.time - time > SimpleNode.CON_TIMEOUT) {
				con.destroy(this);
				this.requestedConnections.delete(target);
				break;
			}
        }

		// Check existing connections
		let notify = false;

		for (const peer of this.peers) {
			if (world.getConnection(this, world.getNode(peer)) == undefined) {
				this.peers.splice(this.peers.indexOf(peer), 1);
				notify = true;
				break;
			}
		}

		if (notify) {
			for (const peer of this.peers) {
				let con = world.getConnection(this, world.getNode(peer));
				if (con != undefined) {
					con.send(this, {
						type: "givePeers",
						src: this.id,
						peers: this.peers
					});
				}
			}
		}
	}

	process(msg) {
		switch (msg.type) {
			case "requestConnection": {
				let con = world.addConnection(this, world.getNode(msg.src));
				if (con == undefined) {
					return;
				}

				// Accept all connection requests
				con.send(this, {
					type: "acceptConnection",
					src: this.id,
				});
				con.send(this, {
					type: "givePeers",
					src: this.id,
					peers: this.peers
				});
				this.peers.push(msg.src);
				
				break;
			}

			case "acceptConnection": {
				if (this.requestedConnections.get(msg.src) != undefined) {
					let con = world.getConnection(this, world.getNode(msg.src));
					if (con == undefined) {
						return;
					}

					con.promote(this, world.getNode(msg.src), undefined);
					this.peers.push(msg.src);
					this.requestedConnections.delete(msg.src);
				}
				break;
			}

			case "givePeers": {
				for (const peer of msg.peers) {
					if (peer == this.id || world.getConnection(this, world.getNode(peer)) != undefined) {
						continue;
					}

					let con = world.addConnection(this, world.getNode(peer), 2);
					if (con != undefined) {
						con.send(this, {
							type: "requestConnection",
							src: this.id,
						});
						this.requestedConnections.set(peer, [this.time, con]);
					}
				}

				break;
			}
		}
	}
}