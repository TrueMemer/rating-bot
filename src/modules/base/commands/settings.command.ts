import { Message } from "discord.js";
import { Command, Bot, Module } from "@despair/discord";

function isExtImage(filename: string) {
    return filename.endsWith('png') || 
        filename.endsWith('jpg') || 
        filename.endsWith('gif') ||
        filename.endsWith('jpeg');
}

function validURL(str: string) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

// TODO: Make this like extension?
export default class SettingsCommand extends Command {
    public name: string = 'settings';
    public aliases: string[] = ['s', 'self'];
    private userWhitelist: string[] = ['156453647327297536'];

    public async handler(ctx: Bot, msg: Message, _cmd: string, args: string[]) { 
        if (!this.userWhitelist.includes(msg.author.id)) return;

        switch (args[0]) {
            case 'modules':
            case 'module': {

                switch (args[1]) {
                    case 'list': {

                        let content = 'Загруженные модули:\n';
                        const modules: string[] = [];

                        ctx.modules.forEach((v, k) => {
                            modules.push(`${k}${v.disabled ? '(-)' : ''}`);
                        });

                        content += modules.join(',');

                        msg.channel.send(content);

                    } break;

                    case 'enable': {

                        const moduleName = args[2];

                        if (!moduleName) return;

                        const module = ctx.modules.get(moduleName);
                        
                        if (!module) {
                            msg.reply('такого модуля не было загружено.');
                            return;
                        }

                        if (!module.disabled) {
                            msg.reply('этот модуль уже включен.');
                            return;
                        }

                        module.disabled = false;

                        msg.reply(`модуль '${moduleName}' был включен на время текущего сеанса.`);

                    } break;

                    case 'disable': {

                        const moduleName = args[2];

                        if (!moduleName) return;

                        const module = ctx.modules.get(moduleName);
                        
                        if (!module) {
                            msg.reply('такого модуля не было загружено.');
                            return;
                        }

                        if (module.disabled) {
                            msg.reply('этот модуль уже выключен.');
                            return;
                        }

                        module.disabled = true;

                        msg.reply(`модуль '${moduleName}' был отключен на время текущего сеанса.`);

                    } break;
                }

            } break;

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
                            await ctx.self.setUsername(args.splice(2).join(' '));
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