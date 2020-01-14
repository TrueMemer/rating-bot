import { Message, MessageAttachment } from "discord.js";
import ChannelWhitelistEntry from "../entities/ChannelWhitelistEntry";
import { Repository } from "typeorm";
import Post from "../../karma/entities/KarmaReward";
import { EventHandler, Bot } from "@despair/discord";

function validURL(str: string) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

function isExtImage(filename: string) {
    return filename.endsWith('png') || 
        filename.endsWith('jpg') || 
        filename.endsWith('gif') ||
        filename.endsWith('jpeg');
}

export default class PostListener extends EventHandler {
    for: string = 'message';
    ignoreSelf: boolean = true;  
    listener = async (ctx: Bot, msg: Message) => {
        if (!msg.guild) return;

        const whitelistRepository = this._ctx.db.getRepository(ChannelWhitelistEntry) as Repository<ChannelWhitelistEntry>;
        const entry = await whitelistRepository.findOne({ guild_id: msg.guild.id, channel_id: msg.channel.id });

        if (!entry)
            return;

        if (msg.content.startsWith('~')) {
            return;
        }

        const isImage = 
            (v: MessageAttachment) => 
                isExtImage(v.url) ||
                v.url.endsWith('mp4') ||
                v.url.endsWith('mpeg') ||
                v.url.endsWith('webm') ||
                v.url.endsWith('mp3') ||
                v.url.endsWith('ogg');

        if ((msg.attachments.size > 0 && msg.attachments.every(isImage)) || msg.embeds.length > 0 || validURL(msg.content)) {
            await msg.react('🔺');
            await msg.react('🔻');

            const postRepository = this._ctx.karmaModule.rewardRepository;

            const post = new Post();
            post.author = msg.author.id;
            post.guild_id = msg.guild.id;
            post.message_id = msg.id;
            post.channel_id = msg.channel.id;
            post.karma = 0;

            await postRepository.save(post);
        }

    }
}