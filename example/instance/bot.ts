import Fosscord from "../../src/index";

const client = new Fosscord.Client({
	intents: [
		Fosscord.Intents.FLAGS.GUILD_MESSAGES
	],
	waitGuildTimeout: 0,
});

client.on("ready", () => {
	console.log(`ready as ${client.user?.tag}.`);
});

client.on("messageCreate", async message => {
	console.log(`${message.author.tag} : ${message.content}`);

	if (message.content === "ping") {
		message.reply("pong");
		return;
	}

	if (!client.instanced) return;

	if (message.content === "respawn")
		client.instanced.respawnAll();

	if (message.content === "fetchGuilds") {
		const guilds = await client.instanced.fetchClientValues('guilds.cache.size') as number[];
		if (!guilds) return;
		message.reply(`I am in ${guilds.reduce((curr, prev) => curr + prev)}`);
		return;
	}

	if (message.content.startsWith("getGuild")) {
		const id = message.content.split(" ").pop();
		if (!id) return;
		const instanceIds = await client.instanced.instanceIdsForGuildId(id);
		for (let curr of instanceIds) {
			message.reply(`Found guild ${curr.guild.name} in instance ${curr.instanceId} ( child: ${curr.childId } )`);
		}
		return;
	}

	if (message.content.startsWith("getUser")) {
		const id = message.content.split(" ").pop();
		if (!id) return;
		const instanceIds = await client.instanced.instanceIdsForUserId(id);
		for (let curr of instanceIds) {
			message.reply(`Found user ${curr.user.tag} in instance ${curr.instanceId} ( child: ${curr.childId } )`);
		}
		return;
	}
});

client.login(process.env.INSTANCE_TOKEN);