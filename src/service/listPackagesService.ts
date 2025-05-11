import { exec } from "child_process";
import { promisify } from "util";
import  listPackages  from "../command/list.js";
import { AppError } from "../middlewares/e/AppError.js";
import { ErrorCode } from "../middlewares/e/ErrorCode.js";
const execPromise = promisify(exec);

interface Package {
  name: string;
  version: string;
}

export class ListPackagesService {
  async getPackages(): Promise<Package[]> {
    try {
      const packages = await listPackages();
      return packages;
    } catch (err: any) {
      throw AppError.newError500(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to fetch packages: ${err.message}`);
    }
  }
}

export default new ListPackagesService();

