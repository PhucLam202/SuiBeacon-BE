import boxen from "boxen";
import chalk from "chalk";
import ora, { Ora } from "ora";
import { PushResponse } from "../types/pushCli";
import listPackages from "./list.js";
import WalrusService from "../service/walrusService.js";

async function pushPackageList(spinner: Ora) {
  try {
    // Sử dụng hàm listPackages trực tiếp thay vì service
    const packages = await listPackages();
    
    if (packages.length === 0) {
      spinner.fail(chalk.red("No packages found to push"));
      return;
    }
    
    // Tạo payload
    const payload = {
      packages,
      metadata: {
        totalCount: packages.length,
        timestamp: new Date().toISOString(),
        source: "beacon-cli"
      }
    };
    
    // Upload lên Walrus
    const walrusService = new WalrusService();
    const blobId = await walrusService.uploadBlob(
      payload,
      "Complete package list"
    );
    
    // Tạo response
    const data: PushResponse = {
      success: true,
      blobId,
      payload
    };

    spinner.succeed(chalk.green("✅ Package list pushed to hub successfully"));
    console.log(
      boxen(
        `Pushed ${data.payload.packages.length} packages to hub\nBlob ID: ${data.blobId}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );

    // Hiển thị thông tin chi tiết về các package đã đẩy lên
    const packageList = data.payload.packages
      .map((pkg) => `${chalk.bold.green(pkg.name)} ${chalk.blue(`v${pkg.version}`)}`)
      .join("\n");

    console.log(
      boxen(`Packages pushed to hub:\n\n${packageList}`, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
      })
    );
  } catch (err: any) {
    spinner.fail(chalk.red(`❌ Error: ${err.message}`));
    console.error(chalk.yellow("Full error details:"), err);
  }
}

export default pushPackageList;
  
