import chalk from "chalk";
import ora, { Ora } from "ora";
import boxen from "boxen";
import installPackage from "./install.js";
import { quickstarts } from "../types/themeStart.js";

async function installQuickstart(quickstartName: string, spinner: Ora) {
  try {
    if (!quickstarts[quickstartName]) {
      spinner.fail(chalk.red(`Quickstart "${quickstartName}" not found`));
      console.log(chalk.yellow(`Available quickstarts: ${Object.keys(quickstarts).join(", ")}`));
      return;
    }

    const packages = quickstarts[quickstartName];
    spinner.succeed(chalk.green(`Found ${packages.length} packages in "${quickstartName}" quickstart`));

    const packageList = packages
      .map(pkg => `${chalk.bold.green(pkg.name)} ${pkg.version !== "latest" ? chalk.blue(`v${pkg.version}`) : ""}`)
      .join("\n");

    console.log(
      boxen(`Packages to install:\n\n${packageList}`, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
      })
    );

    console.log(chalk.yellow("Installing packages... (Press Ctrl+C to cancel)"));

    for (const pkg of packages) {
      const packageSpinner = ora({
        text: chalk.blue(`Installing ${pkg.name}${pkg.version !== "latest" ? ` version ${pkg.version}` : ""}...`),
        spinner: "dots",
      }).start();

      try {
        await installPackage(pkg.name, packageSpinner, pkg.version !== "latest" ? pkg.version : undefined, pkg.flakeUrl);
      } catch (err) {
        packageSpinner.fail(chalk.red(`Failed to install ${pkg.name}`));
        console.error(err);
      }
    }

    console.log(
      boxen(chalk.green(`Successfully installed "${quickstartName}" development environment`), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
      })
    );
  } catch (err: any) {
    spinner.fail(chalk.red(`Error: ${err.message}`));
    console.error(chalk.yellow("Full error details:"), err);
  }
}

export default installQuickstart;
