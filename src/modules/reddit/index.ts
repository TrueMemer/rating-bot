import PostListener from "./listeners/post.listener";
import VoteListener from "./listeners/vote.listener";
import UnvoteListener from "./listeners/unvote.listener";
import WhitelistCommand from "./commands/whitelist.command";
import { Connection, createConnection, Repository } from "typeorm";
import Post from "../karma/entities/KarmaReward";
import ChannelWhitelistEntry from "./entities/ChannelWhitelistEntry";
import { TextChannel, MessageReaction, User, Collection } from "discord.js";
import { CommanderModule, Bot } from "@despair/discord";
import { MessageDeleteListener } from "./listeners/delete.listener";
import { KarmaModule } from "../karma";

export default class RedditModule extends CommanderModule {

    public name: string = 'reddit';
    dependencies = ['karma'];

    private _karmaModule: KarmaModule;

    get karmaModule() {
        return this._karmaModule;
    }

    private _db: Connection;

    get db() {
        return this._db;
    }

    get whitelistRepository() {
        return this._db.getRepository(ChannelWhitelistEntry);
    }

    constructor() {
        super();
        
        this.registerEventHandler(new PostListener(this));
        this.registerEventHandler(new VoteListener(this));
        this.registerEventHandler(new UnvoteListener(this));
        this.registerEventHandler(new MessageDeleteListener(this));

        this.registerCommand(new WhitelistCommand(this));
    }

    private async initDatabase() {
        this._db = await createConnection({
            type: 'sqlite',
            name: 'default',
            database: 'data/reddit.sqlite3',
            entities: [ ChannelWhitelistEntry ],
            synchronize: true
        });
    }

    public async initialize(ctx: Bot): Promise<boolean> {
        try {
            await this.initDatabase();
        } catch (e) {
            console.error('[module:reddit] module initialization failed with error ', e);
            return false;
        }

        this._karmaModule = ctx.modules.get('karma') as KarmaModule;
        if (!this._karmaModule) return false;

        console.log('[module:reddit] initialized successfully');

        return true;
    }

    public async afterStart(ctx: Bot) {
        console.log('[module:reddit] caching old posts...');

        const postsRepository = this._karmaModule.rewardRepository;

        const posts = await postsRepository.find();
    
        for (const p of posts) {

            const guild = ctx.self.client.guilds.get(p.guild_id);

            if (!guild) continue;

            const channel = guild.channels.get(p.channel_id) as TextChannel;

            const message = await channel.fetchMessage(p.message_id);

            const filter = (reaction: MessageReaction, user: User) => ['🔻', '🔺'].includes(reaction.emoji.name) && user.id !== ctx.self.id;

            message.awaitReactions(filter)
                .then((reactions: Collection<string, MessageReaction>) => {
                    console.log('catched reaction on message', message.id);
                });


            //console.log(message);
        }

        console.log('[module:reddit] done caching old posts');
    }

}