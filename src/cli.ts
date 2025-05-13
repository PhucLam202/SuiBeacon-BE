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
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  .action(async (pkg, version) => {
    const spinner = ora({
      text: chalk.blue(
        `Installing ${pkg}${version ? ` version ${version}` : ""}`
      ),
      spinner: "dots",
    }).start();

    await installPackage(pkg, spinner, version);
    process.exit(0);
  });

// List installed packages command
program
  .command("list")
  .description("List all installed packages")
  .action(async () => {
    await listPackages();
    process.exit(0);
  });

// Remove package command
program
  .command("remove <packages...>")
  .description("Remove one or more packages")
  .action(async (packages: string[]) => {
    console.log(chalk.blue(`Removing packages: ${packages.join(', ')}`));
    await removePackage(packages.join(' '));
    process.exit(0);
  });

// Search command
program
  .command("search [search]")
  .description("Search available packages")
  .action(async (search?: string) => {
    const spinner = ora({
      text: chalk.blue("Searching for packages..."),
      spinner: "dots",
    }).start();
    await searchAvailablePackages(search, spinner);
    process.exit(0);
  });

// program
//   .command("devVM")
//   .description("Start a development shell using")
//   .action(() => {
//     console.log(chalk.blue("Starting development shell..."));
//     startDevelopmentShell();
//   });

// Update command
program
  .command("update <package>")
  .description("Update a package")
  .action(async (pkg: string) => {
    console.log(chalk.blue(`Updating ${pkg}...`));
    await updatePackage(pkg);
    process.exit(0);
  });
function startDevelopmentShell() {
  const nixShell = spawn("nix", ["develop"], {
    stdio: "inherit",
  });
}

program
  .command("push <projectName>")
  .description("Push all installed packages to hub")
  .action(async (projectName: string) => {
    const spinner = ora({
      text: chalk.blue("Pushing package list to hub..."),
      spinner: "dots",
    }).start();

    const user = getLoggedInUser();
    if (!user) {
      spinner.fail(
        chalk.red("You need to login first. Use 'beacon login <userAddress>'")
      );
      process.exit(1);
      return;
    }

    await pushPackageList(projectName, spinner, user.userAddress);
    process.exit(0);
  });

program
  .command("pull <url>")
  .description("Pull and install a package list from a remote URL")
  .action(async (url) => {
    const spinner = ora({
      text: chalk.blue("Preparing to pull packages from remote..."),
      spinner: "dots",
    }).start();

    await pullFromWalrus(url, spinner);
    process.exit(0);
  });

// Login command
program
  .command("login <userAddress>")
  .description("Login with your user address")
  .action(async (userAddress: string) => {
    const spinner = ora({
      text: chalk.blue(`Logging in with address: ${userAddress}`),
      spinner: "dots",
    }).start();

    await login(userAddress, spinner);
    process.exit(0);
  });

// add command quickstart
program
  .command("quickstart <environment>")
  .description(
    "Quickly install all packages needed for a specific development environment"
  )
  .action(async (environment: string) => {
    const spinner = ora({
      text: chalk.blue(`Preparing ${environment} development environment...`),
      spinner: "dots",
    }).start();

    await installQuickstart(environment, spinner);
    process.exit(0);
  });

// add command to list all theme eviroment 
program
  .command("environments")
  .description("List all available development environments")
  .action(() => {
    console.log(
      boxen(
        `${chalk.bold.green(
          "sui"
        )} - SUI blockchain development environment\n` +
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

    console.log(
      chalk.yellow(
        `To set up an environment, use: beacon quickstart <environment>`
      )
    );
    process.exit(0);
  });

// add command server to CLI
program
  .command("server")
  .description("Start the API server")
  .option("-p, --port <port>", "Port to run server on", "3000")
  .option("-h, --host <host>", "Host to bind server to", "localhost")
  .action(async (options) => {
    const spinner = ora({
      text: chalk.blue("Starting API server..."),
      spinner: "dots",
    }).start();

    try {
      const { default: startServer } = await import("./server.js");
      await startServer(options.port, options.host);

      spinner.succeed(
        chalk.green(
          `API server running on http://${options.host}:${options.port}`
        )
      );
      console.log(chalk.cyan(`Press Ctrl+C to stop the server`));

      process.stdin.resume();

      process.on("SIGINT", () => {
        console.log(chalk.yellow("\nStopping server..."));
        mongoose.disconnect().then(() => {
          console.log(chalk.green("Server stopped"));
          process.exit(0);
        });
      });
    } catch (error) {
      spinner.fail(chalk.red(`Failed to start server: ${error}`));
      process.exit(1);
    }
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
