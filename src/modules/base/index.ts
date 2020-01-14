import SettingsCommand from "./commands/settings.command";
import { CommanderModule } from "@despair/discord";
import { ArchiveCommand } from "./commands/archive.command";

export default class BaseModule extends CommanderModule {

    name: string = 'base';

    constructor() {
        super();
    
        this.registerCommand(new SettingsCommand(this));
        this.registerCommand(new ArchiveCommand(this));
    }

    async initialize() {
        console.log('[module:base] initialize');
        return true;
    }

    afterStart() {
    }

}