import boxen from "boxen";
import chalk from "chalk";
import { exec } from "child_process";
import ora from "ora";
import { promisify } from "util";
import { inspect } from "util";

const execPromise = promisify(exec);

async function listPackages() {
  const spinner = ora({
    text: chalk.blue("Fetching installed packages..."),
    spinner: "dots",
  }).start();

  try {
    const { stdout } = await execPromise(
      `nix --extra-experimental-features "nix-command flakes" profile list --json 2>/dev/null`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    // Pretty‑print raw JSON
    console.log(
      chalk.gray("Debug: Raw nix profile list output:"),
      inspect(JSON.parse(stdout), { depth: 2, colors: true, compact: false })
    );

    // Parse
    const profileData = JSON.parse(stdout);
    console.log(
      chalk.gray("Debug: Parsed profile data:"),
      inspect(profileData, { depth: 4, colors: true, compact: false })
    );

    // Lấy elements đúng cách
    const elems = profileData.elements ?? {};
    const pkgNames = Object.keys(elems);

    if (pkgNames.length === 0) {
      spinner.succeed();
      console.log(chalk.yellow("No packages installed or profile is empty."));
      return;
    }

    // Format packages
    const formatted = pkgNames
      .map(name => {
        const info = elems[name];
        const storePath = info.storePaths[0].split("/").pop() || "";
        const versionMatch = storePath.match(/-(\d+\.\d+\.\d+[^-]*)$/);
        const version = versionMatch ? versionMatch[1] : "unknown";
        return `${chalk.bold.green(name)} ${chalk.blue(`v${version}`)}`;
      })
      .join("\n");

    spinner.succeed(chalk.green("✅ Installed packages fetched."));
    console.log(
      boxen(`Installed packages:\n\n${formatted}`, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
      })
    );
  } catch (err: any) {
    spinner.fail(chalk.red(`❌ Error fetching installed packages: ${err.message}`));
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
  }
}

export default listPackages;
