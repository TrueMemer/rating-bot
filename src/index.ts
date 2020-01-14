import 'reflect-metadata';

require('dotenv').config();

import { Bot } from './Bot';
import { Message, MessageAttachment, MessageReaction, User, TextChannel, Collection } from 'discord.js';

import { createConnection, Repository, getConnection } from 'typeorm';
import ChannelWhitelistEntry from './entities/ChannelWhitelistEntry';
import ICommand from './ICommand';
import { IHandler } from './IHandler';
import { OnMessageHandler } from './HandlerTypes';
import Post from './entities/Post';

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

class SettingsCommand implements ICommand {
    public name: string = 'settings';
    public aliases: string[] = ['s', 'self'];
    private userWhitelist: string[] = ['156453647327297536'];

    public async handler(ctx: Bot, msg: Message, _cmd: string, args: string[]) { 
        if (!this.userWhitelist.includes(msg.author.id)) return;

        switch (args[0]) {
            case 'avatar': {

                switch (args[1]) {
                    case 'set': {

                        if (msg.attachments.size > 0) {
                            if (isExtImage(msg.attachments.first().filename)) {
                                await ctx.self.setAvatar(msg.attachments.first().url);
                                return;
                            }
                        } else if (msg.embeds.length > 0) {
                            if (isExtImage(msg.embeds[0].url)) {
                                await ctx.self.setAvatar(msg.embeds[0].url);
                                return;
                            }
                        } else if (validURL(args[2])) {
                            if (isExtImage(args[2])) {
                                await ctx.self.setAvatar(args[2]);
                                return;
                            }
                        }

                    } break;

                    default:
                        break;
                }

            } break;

            case 'username': {

                switch(args[1]) {
                    case 'set': {
                        if (!args[2]) {
                            await ctx.self.setUsername('');
                            break;
                        } else {
                            await ctx.self.setUsername(args[2]);
                            break;
                        }
                    }

                    default: 
                        break;
                }

            } break;
        }
    }
}

class WhitelistCommand implements ICommand {
    public name: string = 'whitelist';
    public aliases: string[] = ['w', 'wh'];
    private userWhitelist: string[] = ['156453647327297536'];

    public async handler(ctx: Bot, msg: Message, _cmd: string, args: string[]) {
        if (!this.userWhitelist.includes(msg.author.id)) return;
        const whitelistRepository = ctx.db.getRepository(ChannelWhitelistEntry) as Repository<ChannelWhitelistEntry>;

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

class KarmaCommand implements ICommand {
    public name: string = 'karma';
    public async handler(ctx: Bot, msg: Message, _cmd: string, args: string[]) {

        if (!msg.guild) return;

        const postRepository = await ctx.db.getRepository(Post) as Repository<Post>;

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
                let { karma } = await postRepository
                .createQueryBuilder('post')
                .select('sum(post.karma)', 'karma')
                .where('guild_id = :gid', { gid: msg.guild.id })
                .andWhere('author = :uid', { uid: msg.author.id })
                .getRawOne();
    
                if (!karma) karma = 0;

                await msg.author.send(`Ваша карма на сервере ${msg.guild.name} - **${karma}**.`);
                await msg.delete();
            } break;
        }

    }
}

class ExampleListener implements IHandler {
    for: string = 'message';
    ignoreSelf: boolean = true;  
    listener: OnMessageHandler = async (ctx, msg, next) => {
        if (!msg.guild) return;

        const whitelistRepository = ctx.db.getRepository(ChannelWhitelistEntry) as Repository<ChannelWhitelistEntry>;
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

            const postRepository = await ctx.db.getRepository(Post);

            const post = new Post();
            post.author = msg.author.id;
            post.guild_id = msg.guild.id;
            post.message_id = msg.id;
            post.channel_id = msg.channel.id;
            post.karma = 0;

            await postRepository.save(post);
        }
        next();
    }
}

class UpvoteListener implements IHandler {
    listener = async (ctx: Bot, reaction: MessageReaction, user: User) => {
        const postRepository = await ctx.db.getRepository(Post) as Repository<Post>;

        const post = await postRepository.findOne({ where: { 
            message_id: reaction.message.id,
            guild_id: reaction.message.guild.id
        }});

        //console.log(reaction);

        if (!post) return;

        const upvoteReaction = reaction.message.reactions.find(r => r.emoji.name === '🔺');
        const downvoteReaction = reaction.message.reactions.find(r => r.emoji.name === '🔻');

        let type;

        if (reaction.emoji.name == '🔺') {
            type = 'upvote';
            // if (downvoteReaction.users.has(user.id)) {
            //     console.log('already voted');
            //     await reaction.remove(user.id);
            //     return;
            // }
        } else if (reaction.emoji.name == '🔻') {
            type = 'downvote';
            // if (upvoteReaction.users.has(user.id)) {
            //     console.log('already voted');
            //     await reaction.remove(user.id);
            //     return;
            // }
        } else return;

        console.log('valid ' + type + ' react');

        if (reaction.message.author.id === user.id && user.id !== '156453647327297536') {
            await reaction.remove(user);
            return;
        }

        let pluses = upvoteReaction.count - 1;
        let minuses = downvoteReaction.count - 1;

        console.log('size', reaction.message.reactions.size);

        console.log(pluses, minuses)

        post.karma = pluses - minuses;

        await postRepository.save(post);

        console.log(reaction.message.id, post.karma);
    };
    ignoreSelf?: boolean = true;
    for: string = 'messageReactionAdd';
}

class RemoveUpvoteListener extends UpvoteListener {
    for: string = 'messageReactionRemove';
}

async function main() {
    const db = await createConnection({
        type: 'sqlite',
        name: 'default',
        database: './db.sqlite3',
        entities: [ ChannelWhitelistEntry, Post ],
        synchronize: true
    });

    let bot = new Bot({
        token: process.env.TOKEN,
        ignoreSelf: true,
        prefix: '!',
        enableCommander: true
    });

    bot.registerDbContext(db);
    bot.registerCommand(new WhitelistCommand);
    bot.registerCommand(new SettingsCommand);
    bot.registerCommand(new KarmaCommand);
    bot.registerHandler(new ExampleListener);
    bot.registerHandler(new UpvoteListener);
    bot.registerHandler(new RemoveUpvoteListener);


    bot.start().then(async () => {
        const postsRepository = bot.db.getRepository(Post) as Repository<Post>;

        const posts = await postsRepository.find();
    
        for (const p of posts) {

            const guild = bot.self.client.guilds.get(p.guild_id);

            const channel = guild.channels.get(p.channel_id) as TextChannel;

            const message = await channel.fetchMessage(p.message_id);

            const filter = (reaction: MessageReaction, user: User) => ['🔻', '🔺'].includes(reaction.emoji.name) && user.id !== bot.self.id;

            message.awaitReactions(filter)
                .then((reactions: Collection<string, MessageReaction>) => {
                    console.log('catched reaction on message', message.id);
                });


            //console.log(message);
        }
    });
}

main().catch(console.error);