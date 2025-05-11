import chalk from "chalk";
import ora, { Ora } from "ora";
import WalrusService from "../service/walrusService.js";
import installPackage from "./install.js";
import { inspect } from "util";

/**
 * Pulls and installs a package list from a Walrus blob ID
 * @param url The URL containing the blob ID
 * @param spinner Progress indicator
 */
async function pullFromWalrus(url: string, spinner: Ora) {
    try {
      const blobId = url.split("/").pop();
      console.log("blobId => ", blobId);

      if (!blobId) {
        spinner.fail(chalk.red("Invalid blob ID format"));
        return;
      }

      spinner.text = chalk.blue(`Fetching package list ...`);
  
      // Initialize Walrus service
      const walrusService = new WalrusService();
      
      // Fetch blob data from Walrus
      const blobContent = await walrusService.readBlobAsText(blobId);
      
      if (!blobContent) {
        spinner.fail(chalk.red(`Failed to fetch blob with ID: ${blobId}`));
        return;
      }
      
      // Parse the blob data
      const payload = JSON.parse(blobContent);
      
      // Debug: Log the full payload structure
      console.log("Payload structure:", inspect(payload, { depth: 4, colors: true }));
  
      if (!payload.packages || !Array.isArray(payload.packages)) {
        spinner.fail(chalk.red("Invalid package list format. Expected 'packages' array."));
        return;
      }
  
      const packages = payload.packages;
      console.log("Total packages found:", packages.length);
      
      if (packages.length === 0) {
        spinner.fail(chalk.red("No packages found in the blob."));
        return;
      }
  
      spinner.succeed(chalk.green(`Found ${packages.length} packages to install`));
  
      // Install each package
      let successCount = 0;
      let failCount = 0;
  
      for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i];
        console.log(`Processing package ${i+1}/${packages.length}:`, pkg);
        
        const packageSpinner = ora({
          text: chalk.blue(`Installing ${pkg.name} v${pkg.version}...`),
          spinner: "dots",
        }).start();
  
        try {
          await installPackage(pkg.name, packageSpinner, pkg.version);
          successCount++;
        } catch (err) {
          failCount++;
          packageSpinner.fail(chalk.red(`Failed to install ${pkg.name}: ${err}`));
        }
      }
  
      // Summary
      spinner.succeed(chalk.green(`Installation complete: ${successCount} succeeded, ${failCount} failed`));
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
      console.error(chalk.yellow("Full error details:"), err);
    }
  }
  
  export { pullFromWalrus };
