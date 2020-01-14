import { Client, Message, ClientUser, MessageReaction, User } from 'discord.js';
import { OnMessageHandler } from './HandlerTypes';
import ICommand from './ICommand';
import { IHandler } from './IHandler';

class CommanderHandler implements IHandler {
    public for: string = "message";
    public ignoreSelf: boolean = true;

    constructor(prefix: string) {
        this._prefix = prefix;
    }

    private _commandMap: Map<string, ICommand> = new Map;
    private _aliasesMap: Map<string, string> = new Map;
    private _prefix: string;

    public listener: OnMessageHandler = (ctx, msg, next) => {
        if (this.ignoreSelf && msg.author.id === ctx.self.id)
            return;

        if (msg.content.startsWith(this._prefix)) {
            const [cmd, ...args] = msg.content.trim().slice(this._prefix.length).split(/\s+/g);

            const command = this._commandMap.get(cmd) || this._commandMap.get(this._aliasesMap.get(cmd));
            if (!command) {
                msg.channel.send('Unknown command!');
                return;
            }

            command.handler(ctx, msg, cmd, args);
        }

        return next();
    };

    public registerCommand(command: ICommand) {
        this._commandMap.set(command.name, command);

        if (command.aliases) {
            for (const alias of command.aliases) {
                this._aliasesMap.set(alias, command.name);
            }
        }
    }
}

export declare type BotOptions = {
    token: string,
    ignoreSelf?: boolean,
    prefix?: string,
    enableCommander?: boolean
};

export class Bot {

    private _client: Client;
    private _dbContext: any;
    private _commanderHandler: CommanderHandler;

    public get self(): ClientUser { return this._client.user; };

    public get db(): any { return this._dbContext; }

    private _onReady() {
        console.log('Bot is ready!');
    }

    constructor(options: BotOptions) {
        this._client = new Client();
        this._client.token = options.token;

        if (options.enableCommander) {
            this._commanderHandler = new CommanderHandler(options.prefix || '!');
        }

        this.registerDefaultHandlers();
        
    }

    public registerCommand(command: ICommand) {
        if (!this._commanderHandler) {
            console.warn('Commander is not enabled!');
            return;
        }
        this._commanderHandler.registerCommand(command);
    }

    public registerDbContext(conn: any) {
        this._dbContext = conn;
    }

    public start(): Promise<string> {
        return this._client.login();
    }

    private registerDefaultHandlers() {
        this._client.on('ready', this._onReady);

        if (this._commanderHandler)
            this.registerHandler(this._commanderHandler);
    }

    public registerHandler(handler: IHandler) {
        if (handler.for === 'message') {
            this._client.on('message', (msg: Message) => {
                handler.listener(this, msg, () => 1);
            });
        }
        if (handler.for === 'messageReactionAdd') {
            this._client.on('messageReactionAdd', (messageReaction: MessageReaction, user: User) => {
                handler.listener(this, messageReaction, user);
            });
        }
        if (handler.for === 'messageReactionRemove') {
            this._client.on('messageReactionRemove', (messageReaction: MessageReaction, user: User) => {
                handler.listener(this, messageReaction, user);
            });
        }

        console.log('registered event handler for ' + handler.for);
    }

};