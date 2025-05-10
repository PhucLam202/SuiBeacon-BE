import mongoose from "mongoose";
import boxen from "boxen";
import chalk from "chalk";
import ora, { Ora } from "ora";
import { PushResponse } from "../types/pushCli";
import listPackages from "./list.js";
import WalrusService from "../service/walrusService.js";
import DataModel from "../models/DataModel.js";
import Package from "../models/Package.js";
import PushHistory from "../models/PushHistory.js";
import connectDB, { isConnected } from "../config/database.js";

async function pushPackageList(projectName: string, spinner: Ora,userAddress:string) {
  //Temporarily fix the hard address, later we will redo the auth function to get the address from FE and save it automatically.
  //Flow: 
  // User logs in 
  // -> FE saves data 
  // -> FE calls the auth function <automatically for BE>
  // -> BE saves it to a config file or DB
  // -> then the push command will automatically add it to each user. 
  try {
    // STEP 0: Ensure database connection
    if (!isConnected()) {
      spinner.text = chalk.blue("Connecting to database...");
      await connectDB();
    }
    
    // STEP 1: Validate project name
    if (!projectName) {
      spinner.fail(chalk.red("Project name is required"));
      return;
    }
    
    // STEP 2: Get installed packages
    spinner.text = chalk.blue("Fetching installed packages...");
    const packages = await listPackages();
    
    // STEP 3: Check if packages exist
    if (packages.length === 0) {
      spinner.fail(chalk.red("No packages found to push"));
      await mongoose.disconnect();
      return;
    }
    
    // STEP 4: Create payload with project name
    spinner.text = chalk.blue("Preparing package data...");
    const payload = {
      projectName: projectName,
      packages,
      metadata: {
        totalCount: packages.length,
        timestamp: new Date().toISOString(),
        source: "beacon-cli"
      }
    };
    
    // STEP 5: Upload to Walrus
    spinner.text = chalk.blue("Uploading to Walrus...");
    const walrusService = new WalrusService();
    const blobId = await walrusService.uploadBlob(
      payload,
      `Complete package list for project: ${projectName}`
    );
    
    // Default wallet address for CLI usage
    const walletAddress = userAddress;
    // const walletAddress = "0xc9b3863e6f8249dfbd6c559c3f530adfce1e2976b726848c37d550ebb90774fe";
    
    // STEP 6: Save to DataModel with both walletAddress and projectName
    try {
      await DataModel.create({
        walletAddress: walletAddress,
        projectName: projectName,
        blobId: blobId,
        createdAt: new Date()
      });
      
      console.log(chalk.gray("✓ Data saved to DataModel"));
    } catch (dbError: any) {
      console.error("Error saving to DataModel:", dbError);
      // Continue execution even if database save fails
    }
    
    // STEP 7: Save each package to Package collection
    try {
      for (const pkg of packages) {
        await Package.create({
          walletAddress: walletAddress,
          blobId,
          package: {
            name: pkg.name,
            version: pkg.version
          },
          metadata: {
            source: 'beacon-cli',
            projectName: projectName
          }
        });
      }
      
      console.log(chalk.gray(`✓ Saved ${packages.length} packages to database`));
    } catch (dbError: any) {
      console.error("Error saving packages:", dbError);
      // Continue execution even if database save fails
    }
    
    // STEP 8: Save push history
    try {
      await PushHistory.create({
        walletAddress: walletAddress,
        blobId,
        packageCount: packages.length,
        source: "beacon-cli",
        createdAt: new Date()
      });
    } catch (dbError: any) {
      console.error("Error saving push history:", dbError);
      // Continue execution even if database save fails
    }
    
    // STEP 9: Create response
    const data: PushResponse = {
      success: true,
      blobId,
      payload
    };

    // STEP 10: Display success message
    spinner.succeed(chalk.green("✅ Package list pushed to hub successfully"));
    console.log(
      boxen(
        `Project: ${chalk.bold.green(projectName)}\nPushed ${data.payload.packages.length} packages to hub\nBlob ID: ${data.blobId}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );

    // Display detailed package information
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
    
    // STEP 11: Close database connection to allow process to exit
    await mongoose.disconnect();
    
    return data;
  } catch (err: any) {
    // STEP 12: Handle errors
    spinner.fail(chalk.red(`❌ Error: ${err.message}`));
    console.error(chalk.yellow("Full error details:"), err);
    
    // Ensure database connection is closed even on error
    try {
      await mongoose.disconnect();
    } catch (disconnectErr) {
      console.error("Error closing database connection:", disconnectErr);
    }
    
    return {
      success: false,
      blobId: "",
      payload: null
    };
  }
}

export default pushPackageList;  
