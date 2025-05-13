
import chalk from "chalk";
import ora, { Ora } from "ora";
import WalrusService from "../service/walrusService.js";
import installPackage from "./install.js";
import boxen from "boxen";
import PackageInfo from "../types/dataCli.js";

interface WalrusPayload {
  projectName?: string;
  packages: PackageInfo[];
  metadata?: {
    totalCount: number;
    timestamp: string;
    source: string;
  };
}

/**
 * Pulls and installs a package list from a Walrus blob ID
 * @param url The URL containing the blob ID
 * @param spinner Progress indicator
 */
async function pullFromWalrus(url: string, spinner: Ora) {
    try {
      const blobId = url.split("/").pop();
      
      if (!blobId) {
        spinner.fail(chalk.red("Invalid blob ID format"));
        return;
      }

      spinner.text = chalk.blue(`Fetching package list ...`);
  
      const walrusService = new WalrusService();
      
      // Fetch blob data from Walrus
      const blobContent = await walrusService.readBlobAsText(blobId);
      
      if (!blobContent) {
        spinner.fail(chalk.red(`Failed to fetch blob with ID: ${blobId}`));
        return;
      }
      
      // Parse the blob data
      const payload = JSON.parse(blobContent) as WalrusPayload;
      
      if (!payload.packages || !Array.isArray(payload.packages)) {
        spinner.fail(chalk.red("Invalid package list format. Expected 'packages' array."));
        return;
      }
  
      const packages = payload.packages;
      
      if (packages.length === 0) {
        spinner.fail(chalk.red("No packages found in the blob."));
        return;
      }
  
      const projectName = payload.projectName || "Unknown Project";
      spinner.succeed(chalk.green(`Found ${packages.length} packages from project "${projectName}"`));
      
      const packageList = packages
        .map(pkg => `${chalk.bold.green(pkg.name)} ${pkg.version && pkg.version !== 'unknown' ? chalk.blue(`v${pkg.version}`) : ''}`)
        .join('\n');
      
      console.log(
        boxen(`Packages to install:\n\n${packageList}`, {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "cyan",
        })
      );
  
      // Install each package
      let successCount = 0;
      let failCount = 0;
      const failedPackages: string[] = [];
  
      for (let i = 0; i < packages.length; i++) {
        const pkg: PackageInfo = packages[i];
        
        const packageSpinner = ora({
          text: chalk.blue(`Installing ${pkg.name}${pkg.version && pkg.version !== 'unknown' ? ` v${pkg.version}` : ''} (${i+1}/${packages.length})...`),
          spinner: "dots",
        }).start();
  
        try {
          // Only pass version if it's not "unknown"
          if (pkg.version && pkg.version !== 'unknown') {
            await installPackage(pkg.name, packageSpinner, pkg.version);
          } else {
            // If version is "unknown", just install the package without specifying version
            await installPackage(pkg.name, packageSpinner);
          }
          successCount++;
        } catch (err) {
          failCount++;
          failedPackages.push(pkg.name);
          packageSpinner.fail(chalk.red(`Failed to install ${pkg.name}`));
        }
      }
  
      // Summary
      if (failCount > 0) {
        // Display list of failed packages
        console.log(chalk.red(`Failed to install: ${failedPackages.join(', ')}`));
      }
      
      // Display summary in boxen
      console.log(
        boxen(
          `${chalk.bold(`Project: ${projectName}`)}\n\n` +
          `${chalk.green(`✓ Successfully installed: ${successCount}`)}\n` +
          `${failCount > 0 ? chalk.red(`✗ Failed: ${failCount}`) : ''}`,
          {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: successCount > 0 ? "green" : "red",
          }
        )
      );
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
      console.error(chalk.yellow("Full error details:"), err);
    }
  }
  
  export { pullFromWalrus };
