import { Message } from "discord.js";
import { Bot } from "./Bot";

export declare type OnMessageHandler = (ctx: Bot, msg: Message, next: Function) => void;