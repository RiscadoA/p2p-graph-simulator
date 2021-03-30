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
	constructor(id, world, target) {
		super(id);

		this.peers = [];

		// Try to connect to network
		let con = world.addConnection(this, world.getNode(target), 1);
		if (con != undefined) {
			con.send(this, {
				type: "requestConnection",
				src: this.id,
			});
		}
	}

	update(dt) {
		super.update(dt);

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
				let con = world.addConnection(this, world.getNode(msg.src));
				if (con == undefined) {
					return;
				}

				con.promote(this, world.getNode(msg.src), undefined);
				con.send(this, {
					type: "givePeers",
					src: this.id,
					peers: this.peers
				});
				
				this.peers.push(msg.src);
				break;
			}

			case "givePeers": {
				for (const peer of msg.peers) {
					if (peer == this.id || world.getConnection(this, world.getNode(peer)) != undefined) {
						continue;
					}

					let con = world.addConnection(this, world.getNode(peer), 1);
					if (con != undefined) {
						con.send(this, {
							type: "requestConnection",
							src: this.id,
						});
					}
				}

				break;
			}
		}
	}

	lineConnect(target) {
		// Try to connect
		let con = world.addConnection(this, world.getNode(target), 1);
		if (con != undefined) {
			con.send(this, {
				type: "requestConnection",
				src: this.id,
			});
		}
	}
}