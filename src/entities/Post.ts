import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export default class Post {

    @PrimaryGeneratedColumn('uuid')
    public readonly id: string;

    @Column()
    public author: string;

    @Column()
    public guild_id: string;

    @Column()
    public channel_id: string;

    @Column()
    public message_id: string;

    @Column()
    public karma: number;

}