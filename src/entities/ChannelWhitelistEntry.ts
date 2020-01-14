import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export default class ChannelWhitelistEntry {
    @PrimaryGeneratedColumn('uuid')
    public readonly id: string;

    @Column()
    public guild_id: string;

    @Column()
    public channel_id: string;
}