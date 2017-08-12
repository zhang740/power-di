export declare enum OutLevel {
    Log = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    None = 4,
}
export declare class Logger {
    private outLevel;
    setOutLevel(level: OutLevel): void;
    error(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
}
declare const logger: Logger;
export default logger;
