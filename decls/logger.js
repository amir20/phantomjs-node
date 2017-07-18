declare type Logger = {
    info(s: string, ...params: any[]): void;
    debug(s: string, ...params: any[]): void;
    error(s: string, ...params: any[]): void;
    warn(s: string, ...params: any[]): void;
}
