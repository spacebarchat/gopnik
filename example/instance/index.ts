import { InstanceManager, Instance } from "../../src/index";

const manager = new InstanceManager("./example/instance/bot.ts", {
	instances: [

	]
});

manager.on("childCreate", (child) => {
	console.log(`Created instance ${child.instance.baseUrl}`)
})

manager.spawn();