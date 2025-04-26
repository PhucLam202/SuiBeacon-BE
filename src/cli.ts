#!/usr/bin/env node
import "dotenv/config";
import { spawn } from "child_process";
import { Command } from "commander";
import chalk from "chalk";
import ora, { Ora } from "ora";
import installPackage from "./command/install.js";
import listPackages from "./command/list.js";
import removePackage from "./command/remove.js";
import searchAvailablePackages from "./command/search.js";
import updatePackage from "./command/update.js";
import boxen from "boxen";
import pushPackageList from "./command/pushlist.js";

const program = new Command();
program
  .name("beacon")
  .description("CLI tool powered by Nix for package management")
  .version("1.0.0");

// // Lệnh install
program
  .command("install <package> [version]")
  .description("Install a package with optional version")
  .action((pkg, version) => {
    const spinner = ora({
      text: chalk.blue(
        `Installing ${pkg}${version ? ` version ${version}` : ""}`
      ),
      spinner: "dots",
    }).start();

    installPackage(pkg, spinner, version);
  });

// Lệnh list package installed
program
  .command("list")
  .description("List all installed packages")
  .action(() => {
    console.log(chalk.inverse("Fetching installed packages..."));
    listPackages();
  });

// Lệnh remove package
program
  .command("remove <package>")
  .description("remove a package")
  .action((pkg: string) => {
    console.log(chalk.blue(`Removing ${pkg}`));
    removePackage(pkg);
  });

// Lệnh search
program
  .command("search [search]")
  .description("Search available packages")
  .action((search?: string) => {
    const spinner = ora({
      text: chalk.blue("Searching for packages..."),
      spinner: "dots",
    }).start();
    searchAvailablePackages(search, spinner);
  });

program
  .command("devVM")
  .description("Start a development shell using")
  .action(() => {
    console.log(chalk.blue("Starting development shell..."));
    startDevelopmentShell();
  });
// Lệnh update
program
  .command("update <package>")
  .description("Update a package")
  .action((pkg: string) => {
    console.log(chalk.blue(`Updating ${pkg}...`));
    updatePackage(pkg);
  });
function startDevelopmentShell() {
  const nixShell = spawn("nix", ["develop"], {
    stdio: "inherit",
  });
}

// Lệnh đồng bộ packages với tài khoản
program
  .command("sync")
  .description("Sync installed packages with your account")
  .option("-w, --wallet <address>", "Your wallet address")
  .action(async (options) => {
    const spinner = ora({
      text: chalk.blue("Syncing packages with your account..."),
      spinner: "dots",
    }).start();
    
    try {
      if (!options.wallet) {
        spinner.fail(chalk.red("Wallet address is required"));
        console.log(chalk.yellow("Usage: beacon sync --wallet <address>"));
        return;
      }
      
      const response = await fetch(`http://localhost:${process.env.PORT || 5000}/v1/userPackages/${options.wallet}/sync`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        spinner.fail(chalk.red(`Failed to sync: ${data.message}`));
        return;
      }
      
      spinner.succeed(chalk.green("✅ Packages synced successfully"));
      console.log(
        boxen(`Synced ${data.packages.length} packages with account ${options.wallet}`, {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        })
      );
    } catch (err: any) {
      spinner.fail(chalk.red(`❌ Error: ${err.message}`));
    }
  });

// Thêm lệnh pushlist mới (không yêu cầu wallet)
program
  .command("pushlist")
  .description("Push all installed packages to hub without requiring wallet")
  .action(() => {
    const spinner = ora({
      text: chalk.blue("Pushing package list to hub..."),
      spinner: "dots",
    }).start();
    
    pushPackageList(spinner);
  });

// Sửa lại lệnh push hiện tại
// program
//   .command("push")
//   .description("Push your packages to the hub")
//   .requiredOption("-w, --wallet <address>", "Your wallet address")
//   .action(async (options) => {
//     const spinner = ora({
//       text: chalk.blue("Pushing packages to hub..."),
//       spinner: "dots",
//     }).start();
    
//     try {
//       const response = await fetch(`http://localhost:${process.env.PORT || 5000}/v1/userPackages/${options.wallet}/push`, {
//         method: 'POST'
//       });
      
//       const data = await response.json();
      
//       if (!response.ok) {
//         spinner.fail(chalk.red(`Failed to push: ${data.message}`));
//         return;
//       }
      
//       spinner.succeed(chalk.green("✅ Packages pushed to hub successfully"));
//       console.log(
//         boxen(`Pushed ${data.packages.length} packages to hub\nBlob ID: ${data.blobId}`, {
//           padding: 1,
//           margin: 1,
//           borderStyle: "round",
//           borderColor: "green",
//         })
//       );
//     } catch (err: any) {
//       spinner.fail(chalk.red(`❌ Error: ${err.message}`));
//     }
//   });

// Chạy CLI
program.parse(process.argv);
