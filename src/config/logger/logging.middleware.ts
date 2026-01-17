import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger();

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on("finish", () => {
      const end = Date.now();
      const duration = end - start;
      // if (res.statusCode >= 500) {
      //   this.logger.error(
      //     `${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
      //   );
      //   throw new Error(req.statusMessage);
      // }
      if (res.statusCode >= 400 && res.statusCode < 500) {
        this.logger.warn(
          `${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
        );
        return;
      }

      this.logger.log(
        `${req.method} ${req.url} ${res.statusCode} ${duration}ms`,
      );
    });
    next();
  }
}
