import { CommanderModule, Bot } from "@despair/discord";
import KarmaCommand from "./commands/karma.command";
import { Connection, createConnection } from "typeorm";
import KarmaReward from "./entities/KarmaReward";

export class KarmaModule extends CommanderModule {

    name = "karma";
    // dependencies = ['reddit'];

    private _db: Connection;

    get db() {
        return this._db;
    }

    get rewardRepository() {
        return this._db.getRepository(KarmaReward);
    }

    constructor() {
        super();

        this.registerCommand(new KarmaCommand(this));
    }

    private async initDatabase() {
        this._db = await createConnection({
            type: 'sqlite',
            name: 'default',
            database: 'data/karma.sqlite3',
            entities: [ KarmaReward ],
            synchronize: true
        });
    }

    public async initialize(ctx: Bot): Promise<boolean> {
        try {
            await this.initDatabase();
        } catch (e) {
            console.error('[module:karma] module initialization failed with error ', e);
            return false;
        }

        console.log('[module:karma] initialized successfully');

        return true;
    }

    async afterStart() {

    }

    async getKarmaForUser(uid: string, gid: string) {
        let { karma } = await this.rewardRepository
            .createQueryBuilder('post')
            .select('sum(post.karma)', 'karma')
            .where('guild_id = :gid', { gid })
            .andWhere('author = :uid', { uid })
            .getRawOne();

        if (!karma) karma = 0;

        return karma;
    }

}