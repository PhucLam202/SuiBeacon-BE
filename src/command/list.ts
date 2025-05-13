import boxen from "boxen";
import chalk from "chalk";
import { exec } from "child_process";
import ora from "ora";
import { promisify } from "util";
import { inspect } from "util";
import PackageInfo from "../types/dataCli.js";
import mongoose from "mongoose";

const execPromise = promisify(exec);
async function listPackages(): Promise<PackageInfo[]> {
  const spinner = ora({
    spinner: "dots",
  }).start();

  try {
    const { stdout } = await execPromise(
      `nix --extra-experimental-features "nix-command flakes" profile list --json 2>/dev/null`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    // Parse
    const profileData = JSON.parse(stdout);

    // Get elements correctly
    const elems = profileData.elements ?? {};
    const pkgNames = Object.keys(elems);

    if (pkgNames.length === 0) {
      spinner.succeed();
      console.log(chalk.yellow("No packages installed or profile is empty."));
      return [];
    }

    // Create packages array
    const packages: PackageInfo[] = pkgNames.map(name => {
      const info = elems[name];
      const storePath = info.storePaths[0].split("/").pop() || "";
      
      const versionMatch = storePath.match(/-(\d+[\.\d]*[a-z0-9\-]*)$/);
      
      let version = "unknown";
      if (versionMatch) {
        version = versionMatch[1];
      } else {
        const nameVersionMatch = name.match(/(\d+[\.\d]*[a-z0-9\-]*)$/);
        if (nameVersionMatch) {
          version = nameVersionMatch[1];
        }
      }
      
      return {
        name,
        version,
        pname: name,
        description: "",
        license: "unknown",
        type: "installed"
      };
    });

    // Format packages for display
    const formatted = packages
      .map(pkg => `${chalk.bold.green(pkg.name)} ${chalk.blue(`v${pkg.version}`)}`)
      .join("\n");
    console.log(
      boxen(`Installed packages:\n\n${formatted}`, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
      })
    );
    
    return packages;
  } catch (err: any) {
    spinner.fail(
      chalk.red(`Error fetching installed packages: ${err.message}`)
    );
    console.error(chalk.yellow("Full error details:"), err);
    console.error(
      chalk.yellow(
        [
          "If this error persists, ensure flakes are enabled and the profile is accessible:",
          "1. Check Nix version: nix --version",
          "2. Enable flakes: mkdir -p ~/.config/nix &&",
          "   echo 'experimental-features = nix-command flakes' >> ~/.config/nix/nix.conf",
          "3. Verify profile: nix profile list --json",
          "4. Check profile file: ls -l ~/.local/state/nix/profiles/profile",
        ].join("\n")
      )
    );
    
    return [];
  }
}

export default listPackages;
