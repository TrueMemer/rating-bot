import ChannelWhitelistEntry from "../entities/ChannelWhitelistEntry";
import { Repository } from "typeorm";
import { Message } from "discord.js";
import { Command, Bot } from "@despair/discord";

export default class WhitelistCommand extends Command {
    public name: string = 'whitelist';
    public aliases: string[] = ['w', 'wh'];
    private userWhitelist: string[] = ['156453647327297536'];

    public async handler(ctx: Bot, msg: Message, _cmd: string, args: string[]) {
        if (!this.userWhitelist.includes(msg.author.id)) return;
        const whitelistRepository = this._ctx.db.getRepository(ChannelWhitelistEntry) as Repository<ChannelWhitelistEntry>;

        switch(args[0]) {
            case 'status': {
                const entry = await whitelistRepository.findOne({ 
                    where: {
                        guild_id: msg.guild.id,
                        channel_id: msg.channel.id
                    }
                });

                if (entry) {
                    return msg.channel.send('This channel is whitelisted!');
                } else {
                    return msg.channel.send('This channel is not whitelisted!');
                }
            }
            case 'add': {
                const entries = await whitelistRepository.find({
                    where: {
                        guild_id: msg.guild.id,
                        channel_id: msg.channel.id
                    }
                });

                if (entries.length !== 0) {
                    return msg.channel.send('This channel is already whitelisted');
                }

                const entry = new ChannelWhitelistEntry;
                entry.channel_id = msg.channel.id;
                entry.guild_id = msg.guild.id;

                await whitelistRepository.save(entry);

                return msg.channel.send('Successfully whitelisted this channel!');
            }
            case 'remove': {
                await whitelistRepository.delete({
                    guild_id: msg.guild.id,
                    channel_id: msg.channel.id
                });
                
                return msg.channel.send('This channel was unwhitelisted!');
            }
        }
    }
}