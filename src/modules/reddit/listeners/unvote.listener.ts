import VoteListener from "./vote.listener";

export default class UnvoteListener extends VoteListener {
    for: string = 'messageReactionRemove';
}