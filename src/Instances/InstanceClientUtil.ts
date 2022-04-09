import Discord from "discord.js";
import Fosscord from "../index";

class InstanceClientUtil {
	client: typeof Fosscord.Client.prototype;
	_singleton?: InstanceClientUtil;
	id = new URL(process.env.INSTANCE_API_ENDPOINT as string).hostname;
	client_id = parseInt(process.env.INSTANCE_CHILD_ID as string);

	constructor(client: typeof Fosscord.Client.prototype) {
		this.client = client;

		if (!process.send) throw new Error("not child process?");

		process.on("message", this._handleMessage.bind(this));
		client.on("ready", () => {
			process.send!({ _ready: true });
		});
	}

	send = (message: any): Promise<void> => new Promise((resolve, reject): void => {
		process.send!(message, (err: Error) => {
			if (err) reject(err);
			resolve();
		});
	});

	fetchClientValues = Discord.ShardClientUtil.prototype.fetchClientValues.bind(this);

	broadcastEval = Discord.ShardClientUtil.prototype.broadcastEval.bind(this);

	respawnAll = Discord.ShardClientUtil.prototype.respawnAll.bind(this);

	//@ts-ignore
	_handleMessage = Discord.ShardClientUtil.prototype._handleMessage.bind(this);

	// @ts-ignore
	_respond = Discord.ShardClientUtil.prototype._respond.bind(this);

	singleton = Discord.ShardClientUtil.singleton.bind(this);

	instanceIdsForGuildId = async (id: Discord.Snowflake): Promise<{ guild: typeof Fosscord.Guild.prototype, childId: number, instanceId: string; }[]> => {
		const resp = await this.broadcastEval((c, { id }) => {
			const client = c as typeof Fosscord.Client.prototype;
			//@ts-ignore
			if (!client.instanced) throw new Error("this cannot be possible lol");
			//@ts-ignore
			return { guild: client.guilds.cache.find((x) => x.id === id), childId: client.instanced.client_id, instanceId: client.instanced.id };
		}, { context: { id } }) as { guild: typeof Fosscord.Guild.prototype, childId: number, instanceId: string; }[];
		return resp.filter(x => !!x.guild);
	};

	instanceIdsForUserId = async (id: Discord.Snowflake): Promise<{ user: typeof Fosscord.User.prototype, childId: number, instanceId: string; }[]> => {
		const resp = await this.broadcastEval((c, { id }) => {
			const client = c as typeof Fosscord.Client.prototype;
			//@ts-ignore
			if (!client.instanced) throw new Error("this cannot be possible lol");
			//@ts-ignore
			return { user: client.users.cache.find((x) => x.id === id), childId: client.instanced.client_id, instanceId: client.instanced.id };
		}, { context: { id } }) as { user: typeof Fosscord.User.prototype, childId: number, instanceId: string; }[];
		return resp.filter(x => !!x.user);
	};
}

export default InstanceClientUtil;