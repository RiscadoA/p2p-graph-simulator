/*
	Message types:

	- requestConnection:
		- src (id)
	- acceptConnection:
		- src (id)
*/

class RingNode extends GenericNode {
	static CON_TIMEOUT = 10.0; 

	constructor(id, target) {
		super(id);

		this.time = 0.0;
		this.requestedConnections = new Map();

		// Try to connect to network
		let con = world.addConnection(this, world.getNode(target), true);
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

		// Check connection timeouts
		for (const [target, [time, con]] of this.requestedConnections.entries()) {
			if (this.time - time > RingNode.CON_TIMEOUT) {
				world.killConnection(con.id);
				this.requestedConnections.delete(target);
				break;
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
}