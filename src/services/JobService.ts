import { glob } from "glob";
import path from "path";
import { pathToFileURL } from "url";
import schedule from "node-schedule";
import { Logger } from "./Logger";
import { BaseJobs } from "../structures/BaseJobs";
import { CustomClient } from "../structures/CustomClient";

export class JobService {
  private _client: CustomClient;

  private _jobs: BaseJobs[];

  public constructor(client: CustomClient) {
    this._client = client;
    this._jobs = [];
  }

  public async startJobs(): Promise<void> {
    this._jobs.forEach((job: BaseJobs) => {
      const jobSchedule: string = job.schedule;

      schedule.scheduleJob(jobSchedule, async () => {
        try {
          if (job.log) {
            Logger.info(
              this._client.lang.info.jobRun.replace("{job}", job.name),
            );
          }

          await job.execute();

          if (job.log) {
            Logger.info(
              this._client.lang.info.jobSuccess.replace("{job}", job.name),
            );
          }
        } catch (error) {
          Logger.error(
            this._client.lang.error.job.replace("{job}", job.name),
            error,
          );
        }
      });
    });
  }

  public async stopJobs(): Promise<void> {
    await schedule.gracefulShutdown();
  }

  public async loadJobs(): Promise<void> {
    const jobsDir = path.resolve(__dirname, "../jobs");

    const files = await glob(`${jobsDir}/**/*.{ts,js}`);

    await Promise.all(files.map((file) => this.loadJobFile(file)));
  }

  private async loadJobFile(file: string): Promise<void> {
    try {
      const filePath = file.replace(/\\/g, "/");

      const importedModule = await import(`@jobs/../../${filePath}`);

      Object.keys(importedModule).forEach((key) => {
        const ExportedClass = importedModule[key];

        if (ExportedClass.prototype instanceof BaseJobs) {
          const job: BaseJobs = new ExportedClass();
          this._jobs.push(job);
        }
      });
    } catch (error) {
      Logger.error("errorMessage", error);
    }
  }
}
