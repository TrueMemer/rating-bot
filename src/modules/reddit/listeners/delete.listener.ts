import { EventHandler, Bot } from "@despair/discord";
import { Message } from "discord.js";
import { Repository } from "typeorm";
import KarmaReward from "../../karma/entities/KarmaReward";

export class MessageDeleteListener extends EventHandler {

    for = 'messageDelete';

    listener = async (ctx: Bot, msg: Message) => {

        const whitelisted = await this._ctx.whitelistRepository.findOne({ where: { guild_id: msg.guild.id, channel_id: msg.channel.id } });
        if (!whitelisted) return;

        const reward = await this._ctx.karmaModule.rewardRepository.findOne({ where: {
            guild_id: msg.guild.id,
            channel_id: msg.channel.id,
            message_id: msg.id
        }});

        if (!reward) {
            console.log('not post, ignoring');
            return;
        }

        await (await this._ctx.karmaModule.rewardRepository as Repository<KarmaReward>).remove(reward);
    }

}