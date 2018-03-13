export enum OutLevel {
  Log, Info, Warn, Error, None
}

export class Logger {
  private outLevel = OutLevel.Log
  public setOutLevel(level: OutLevel) {
    this.outLevel = level
  }

  error(message?: any, ...optionalParams: any[]): void {
    if (this.outLevel <= OutLevel.Error) {
      console.error(message, ...optionalParams)
    }
  }
  info(message?: any, ...optionalParams: any[]): void {
    if (this.outLevel <= OutLevel.Info) {
      console.info(message, ...optionalParams)
    }
  }
  log(message?: any, ...optionalParams: any[]): void {
    if (this.outLevel <= OutLevel.Log) {
      console.log(message, ...optionalParams)
    }
  }
  warn(message?: any, ...optionalParams: any[]): void {
    if (this.outLevel <= OutLevel.Warn) {
      console.warn(message, ...optionalParams)
    }
  }
}

const logger = new Logger
export default logger
