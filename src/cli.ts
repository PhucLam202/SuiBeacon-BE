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
import pushPackageList from "./command/push.js";
import { pullFromWalrus } from "./command/pull.js";
import connectDB from "./config/database.js";
import login, { getLoggedInUser } from "./command/login.js";
import mongoose from "mongoose";
import installQuickstart from "./command/quickstart.js";

// Ensure database connection is established
connectDB().catch((err) => {
  console.error(chalk.red("Failed to connect to database:"), err.message);
  process.exit(1);
});

const program = new Command();
program
  .name("beacon")
  .description("CLI tool powered by Nix for package management")
  .version("1.0.0");

// Install command
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

// List installed packages command
program
  .command("list")
  .description("List all installed packages")
  .action(() => {
    console.log(chalk.inverse("Fetching installed packages..."));
    listPackages();
  });

// Remove package command
program
  .command("remove <package>")
  .description("remove a package")
  .action((pkg: string) => {
    console.log(chalk.blue(`Removing ${pkg}`));
    removePackage(pkg);
  });

// Search command
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
// Update command
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

// New push command (no wallet required)
program
  .command("push <projectName>")
  .description("Push all installed packages to hub")
  .action((projectName: string) => {
    const spinner = ora({
      text: chalk.blue("Pushing package list to hub..."),
      spinner: "dots",
    }).start();

    const user = getLoggedInUser();
    if (!user) {
      spinner.fail(chalk.red("You need to login first. Use 'beacon login <userAddress>'"));
      return;
    }

    pushPackageList(projectName, spinner, user.userAddress);
  });


program
  .command("pull <url>")
  .description("Pull and install a package list from a remote URL")
  .action((url) => {
    const spinner = ora({
      text: chalk.blue("Preparing to pull packages from remote..."),
      spinner: "dots",
    }).start();

    pullFromWalrus(url, spinner);
  });

// Login command
program
  .command("login <userAddress>")
  .description("Login with your user address")
  .action((userAddress: string) => {
    const spinner = ora({
      text: chalk.blue(`Logging in with address: ${userAddress}`),
      spinner: "dots",
    }).start();

    login(userAddress, spinner);
  });

// Thêm command quickstart
program
  .command("quickstart <environment>")
  .description("Quickly install all packages needed for a specific development environment")
  .action((environment: string) => {
    const spinner = ora({
      text: chalk.blue(`Preparing ${environment} development environment...`),
      spinner: "dots",
    }).start();

    installQuickstart(environment, spinner);
  });

// Thêm command để liệt kê các quickstart có sẵn
program
  .command("environments")
  .description("List all available development environments")
  .action(() => {
    console.log(chalk.inverse("Available development environments:"));
    
    console.log(
      boxen(
        `${chalk.bold.green("sui")} - SUI blockchain development environment\n` +
        `${chalk.bold.green("node")} - Node.js development environment\n` +
        `${chalk.bold.green("rust")} - Rust development environment`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    );
    
    console.log(chalk.yellow(`To set up an environment, use: beacon quickstart <environment>`));
  });

// Run CLI
program.parse(process.argv);

// Handle MongoDB disconnection for CLI commands
if (mongoose.connection.readyState === 1) {
  // Force process exit after commands complete
  process.on("beforeExit", async () => {
    try {
      await mongoose.disconnect();
    } catch (err) {
      console.error("Error disconnecting from MongoDB:", err);
    }
  });

  // Also handle explicit exit signals
  process.on("SIGINT", async () => {
    try {
      await mongoose.disconnect();
      console.log(chalk.gray("\nDatabase connection closed."));
      process.exit(0);
    } catch (err) {
      console.error("Error disconnecting from MongoDB:", err);
      process.exit(1);
    }
  });

  // Force exit after a timeout to prevent hanging
  setTimeout(() => {
    if (mongoose.connection.readyState === 1) {
      mongoose.disconnect().finally(() => {
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }, 1000); // 1 second timeout
}
