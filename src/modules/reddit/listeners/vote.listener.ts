import { MessageReaction, User } from "discord.js";
import { Bot, EventHandler } from "@despair/discord";

export default class VoteListener extends EventHandler {
    listener = async (ctx: Bot, reaction: MessageReaction, user: User) => {
        const postRepository = await this._ctx.karmaModule.rewardRepository;

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