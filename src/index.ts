import 'reflect-metadata';

require('dotenv').config();

import { Bot } from '@despair/discord';

import RedditModule from './modules/reddit';
import BaseModule from './modules/base';
import { KarmaModule } from './modules/karma';

async function main() {

    let bot = new Bot({
        token: process.env.TOKEN,
        ignoreSelf: false,
        prefix: '~',
        enableCommander: true
    });

    bot.registerModule(new KarmaModule);
    bot.registerModule(new RedditModule);
    bot.registerModule(new BaseModule);

    await bot.start();
}

main().catch(console.error);