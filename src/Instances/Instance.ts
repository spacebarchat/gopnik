import EventEmitter from "events";
import path from "path";
import childProcess from "child_process";
import Discord from "discord.js";
import InstanceManager, { InstanceOptions } from "./InstanceManager";

class Instance extends EventEmitter {
	manager: InstanceManager;
	id: number;
	env: { [key: string]: string | undefined; };
	process?: childProcess.ChildProcess;
	instance: InstanceOptions;
	_evals = new Map<string, Promise<any>>();
	_fetches = new Map<string, Promise<any>>();

	constructor(manager: typeof InstanceManager.prototype, id: number, instance: InstanceOptions) {
		super();

		this.id = id;
		this.manager = manager;
		this.instance = instance;

		this.env = Object.assign({}, process.env, {
			INSTANCE_MANAGER: true,
			INSTANCE_CHILD_ID: this.id,
			INSTANCE_COUNT: this.manager.options.instances.length,
			INSTANCE_TOKEN: instance.token,

			INSTANCE_API_ENDPOINT: instance.http?.api,
			INSTANCE_CDN_ENDPOINT: instance.http?.cdn,
			INSTANCE_INVITE_ENDPOINT: instance.http?.invite,
		});
	}

	spawn = async (timeout: number = 30000) => {
		this.process = childProcess.fork(path.resolve(this.manager.file), { env: this.env })
			.on("message", this._handleMessage.bind(this))
			.on("exit", this._handleExit);

		this.emit("spawn", this.process);

		// if (timeout === -1 || timeout === Infinity) return Promise.resolve(this.process);

		return this.process;
	};

	// spawn = (timeout?: number) => Discord.Shard.prototype.spawn.call(this, timeout);

	kill = () => {
		this.process?.removeListener("exit", this._handleExit);
		this.process?.kill();
		this._handleExit();
	};

	respawn = async (timeout?: number) => {
		this.kill();
		return this.spawn(timeout);
	};

	send = Discord.Shard.prototype.send.bind(this);

	fetchClientValue = Discord.Shard.prototype.fetchClientValue.bind(this);

	eval = Discord.Shard.prototype.eval.bind(this);

	//@ts-ignore
	_handleMessage = Discord.Shard.prototype._handleMessage.bind(this);

	//@ts-ignore
	_handleExit = Discord.Shard.prototype._handleExit.bind(this);
};

export default Instance;