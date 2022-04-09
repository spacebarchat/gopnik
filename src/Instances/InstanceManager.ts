import EventEmitter from "events";
import Discord from "discord.js";
import Instance from "./Instance";

//If http not provided, create standard(ish) endpoint urls from baseUrl
export type InstanceOptions = {
	token: string,
	baseUrl?: string,
	http?: Discord.HTTPOptions;
};

export interface InstanceManagerOptions {
	respawn?: boolean;
	childArgs?: string[];
	execArgs?: string[];
	instances: InstanceOptions[];
}

export type BroadcastEvalOptions = {
	context: any;
	instance: number;
};

class InstanceManager extends EventEmitter {
	options: InstanceManagerOptions;
	shards: Discord.Collection<number, Instance>;
	shardList = "auto";
	file: string;
	mode = "process";

	constructor(file: string, options: InstanceManagerOptions) {
		super();

		this.file = file;

		options = Object.assign({ respawn: true, childArgs: [], execArgs: [], instances: [] }, options);
		if (!options.instances.length) throw new Error("List of instances cannot be empty");

		this.options = options;
		this.shards = new Discord.Collection;
	}

	createChild = (options: InstanceOptions, id = this.shards.size) => {
		const child = new Instance(this, id, options);
		this.shards.set(id, child);
		this.emit("childCreate", child);
		return child;
	};

	spawn = async (timeout = 30000) => {
		for (const instance of this.options.instances) {
			if (instance.baseUrl) {
				instance.http = {
					api: `https://${instance.baseUrl}/api`,
					cdn: `https://${instance.baseUrl}/cdn`,
					invite: `https://${instance.baseUrl}/invite`
				};
			}

			const child = this.createChild(instance);
			await child.spawn(timeout);
		}
	};

	broadcast = Discord.ShardingManager.prototype.broadcast.bind(this);

	broadcastEval = (script: Function, options: BroadcastEvalOptions) => {
		const discordoptions = {
			context: options.context,
			shard: options.instance,
		};

		//@ts-ignore
		return Discord.ShardingManager.prototype.broadcastEval.call(this, script, discordoptions);
	};

	fetchClientValues = Discord.ShardingManager.prototype.fetchClientValues.bind(this);

	respawnAll = ({ instanceDelay = 5000, respawnDelay = 500, timeout = 30000 } = {}) => {
		return Discord.ShardingManager.prototype.respawnAll.call(this, {
			shardDelay: instanceDelay,
			respawnDelay,
			timeout,
		});
	};

	//@ts-ignore
	// _performOnShards = Discord.ShardingManager.prototype._performOnShards.bind(this);

	_performOnShards = (method: string, args: any[], shard?: number) => {
		const promises = [];
		//@ts-ignore
		for (const sh of this.shards.values()) promises.push(sh[method](...args));
		return Promise.all(promises);
	}
};

export default InstanceManager;