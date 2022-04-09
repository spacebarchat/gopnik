import Discord from 'discord.js';
import InstanceClientUtil from "./Instances/InstanceClientUtil";

interface patchFunction {
	(result: any, ...any: any[]): any;
}

const patch = (holdingObject: any, functionName: string, newFunction: patchFunction, callOriginal = true) => {
	var originalFunction = holdingObject[functionName];
	if (!originalFunction) originalFunction = holdingObject.prototype[functionName];
	var patched = (...args: any[]) => {
		if (callOriginal)
			var result = originalFunction.call(holdingObject, ...args);
		return newFunction.call(holdingObject, callOriginal ? result : originalFunction, ...args);
	};
	holdingObject.prototype[functionName] = holdingObject[functionName] = patched;
};

patch(Discord.Options, "createDefault", (result) => {
	return Object.assign(result, {
		http: {
			agent: {},
			version: 9,
			api: process.env.INSTANCE_API_ENDPOINT || 'https://dev.fosscord.com/api',
			cdn: process.env.INSTANCE_CDN_ENDPOINT || 'https://cdn.fosscord.com',
			invite: process.env.INSTANCE_INVITE_ENDPOINT || 'https://fosscord.com/invite',
		},
	});
});

type gatewayEvent = {
	op: number;
	t: string;
	d: { [key: string]: any; };
};

patch(Discord.WebSocketManager, "handlePacket", (func: Discord.WebSocketManager["handlePacket"], packet: gatewayEvent, shard: Discord.WebSocketShard) => {
	if (!packet || typeof packet.op !== "number" || !packet.t) return;    //what
	// console.log(`received packet ${JSON.stringify(packet)}`)

	if (packet.op === 0) {
		switch (packet.t) {
			case "READY":
				packet.d.application = packet.d.user;
				break;
		}

		for (var curr in packet.d) {
			if (packet.d[curr] === null)
				delete packet.d[curr];
		}
	}

	return func.call(shard.manager, packet, shard);
}, false);

const originalResolveData = Discord.MessagePayload.prototype.resolveData;
Discord.MessagePayload.prototype.resolveData = function (): Discord.MessagePayload {
	const ret = originalResolveData.call(this);
	if (!ret.data) return ret;

	if ("message_reference" in ret.data && ret.data.message_reference &&
		"reply" in ret.options && ret.options.reply) {
		var message = ret.options.reply.messageReference as Discord.Message;

		ret.data.message_reference.channel_id = message.channelId;
		ret.data.message_reference.guild_id = message.guildId as string;
	}

	if ("embeds" in ret.data && Array.isArray(ret.data.embeds)) {
		for (var embed of ret.data.embeds) {
			if (embed.footer && !embed.footer.text)
				delete embed.footer;
		}
	}

	this.data = ret.data;
	return ret;
};

export class Client extends Discord.Client {
	instanced = process.env.INSTANCE_MANAGER ? new InstanceClientUtil(this) : null;
};
// Object.assign(Discord, { Client });

export default {
	...Discord,
	Client
};