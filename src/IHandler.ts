export interface IHandler {
    for: string;
    listener: Function;
    ignoreSelf?: boolean;
}