import { Bot } from "./Bot";
import { Message } from "discord.js";

export declare type ICommandHandler = (ctx: Bot, msg: Message, cmd: string, args: string[]) => void;

export default interface ICommand {
    name: string;
    aliases?: string[];
    handler: ICommandHandler;
}
