import { BasePHP } from "@php-wasm/universal/src/lib/base-php";
import { UniversalPHP } from "@php-wasm/universal/src/lib/universal-php";

export enum LogSeverity {
    // A debugging event.
    Debug,
    // An informational event. Indicates that an event happenedate.
    Info,
    // A warning event. Not an error but is likely more important than an informational event.
    Warn,
    // An error event. Something went wrong.
    Error,
    // A fatal error such as application or system crash.
    Fatal,
}

export class Logger {
    private readonly LOG_PREFIX = 'Playground';

    constructor() {
        this.collectPlaygroundLogs();
    }

    private collectPlaygroundLogs() {
         if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.log(
                    `${event.message} in ${event.filename} on line ${event.lineno}:${event.colno}`,
                    LogSeverity.Fatal
                );
            });
            window.addEventListener('unhandledrejection', (event) => {
                this.log(
                    `${event.reason.stack}`,
                    LogSeverity.Fatal
                );
            });
        }
    }

    /**
     * Get UTC date in the PHP log format https://github.com/php/php-src/blob/master/main/main.c#L849
     *
     * @param date
     * @returns string
     */
    private formatLogDate(date: Date): string {
        const day = String(date.getUTCDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getUTCMonth()];
        const year = date.getUTCFullYear();
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');

        return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} UTC`;
    }

    public log(message: string, severity?: LogSeverity): void {
        if (severity === undefined) {
            severity = LogSeverity.Info;
        }
        const now = this.formatLogDate(new Date());
        const log = `[${now}] ${this.LOG_PREFIX} ${LogSeverity[severity]}: ${message}`;
        this.logRaw(log);
    }

    public logRaw(log: string): void {
        console.debug(log);
    }
};

let logger: Logger | undefined = undefined;

export function get_logger(): Logger {
    if (!logger) {
        logger = new Logger();
    }
    return logger;
}