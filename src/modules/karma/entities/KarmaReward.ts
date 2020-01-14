import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum KarmaRewardType {
    POST_VOTES,
    MESSAGE,
    OTHER
}

@Entity()
export default class KarmaReward {

    @PrimaryGeneratedColumn('uuid')
    public readonly id: string;

    @Column()
    public author: string;

    @Column({ nullable: true })
    public guild_id: string;

    @Column({ nullable: true })
    public channel_id: string;

    @Column({ nullable: true })
    public message_id: string;

    @Column()
    public karma: number;

    @Column({ default: KarmaRewardType.POST_VOTES })
    public rewardType: KarmaRewardType;

}