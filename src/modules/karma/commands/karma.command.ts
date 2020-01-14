import { Message } from "discord.js";
import Post from "../entities/KarmaReward";
import { Repository } from "typeorm";
import { Bot, Command } from "@despair/discord";
import { KarmaModule } from "..";

export default class KarmaCommand extends Command {
    public name: string = 'karma';
    public async handler(ctx: Bot, msg: Message, _cmd: string, args: string[]) {

        if (!msg.guild) return;

        const postRepository = await this._ctx.db.getRepository(Post) as Repository<Post>;

        switch (args[0]) {

            case 'top': {

                const top = new Map;
                
                const posts = await postRepository.find({ where: { guild_id: msg.guild.id } });

                const guild = await msg.guild.fetchMembers();

                for (const p of posts) {
                    if (!top.has(p.author)) {
                        top.set(p.author, { name: null, karma: 0 });
                    }

                    const author = top.get(p.author);

                    if (!author.name)
                        author.name = guild.members.get(p.author).user.username;
                    author.karma += p.karma;
                }

                let topArray = Array.from(top.values());

                topArray = topArray.sort((a, b) => { return b.karma - a.karma; });

                topArray = topArray.slice(0, 11);

                let content = 'Топ щитпостеров:\n';
                for (const [i, u] of topArray.entries()) {
                    content += `**${i + 1}.** ${u.name} - **${u.karma}**.\n`;
                }

                msg.channel.send(content);
            } break;

            default: {
                const karma = await (this._ctx as KarmaModule).getKarmaForUser(msg.author.id, msg.guild.id);
                try {
                    await msg.author.send(`Ваша карма на сервере ${msg.guild.name} - **${karma}**.`);
                    await msg.delete();
                } catch (e) {
                    
                }
            } break;
        }

    }
}