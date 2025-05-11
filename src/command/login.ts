import chalk from "chalk";
import ora, { Ora } from "ora";
import fs from "fs";
import path from "path";
import os from "os";
import { UserCredentials } from "../types/loginCli";

const CONFIG_DIR = path.join(os.homedir(), '.beacon');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

async function login(userAddress: string, spinner: Ora) {
  try {
    // Validate user address
    if (!userAddress || userAddress.trim() === '') {
      spinner.fail(chalk.red("User address cannot be empty"));
      return false;
    }

    // Create config directory if it doesn't exist
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    // Save credentials
    const credentials: UserCredentials = {
      userAddress,
      timestamp: Date.now()
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(credentials, null, 2));
    
    spinner.succeed(chalk.green(`✅ Successfully logged in as ${userAddress}`));
    return true;
  } catch (err: any) {
    spinner.fail(chalk.red(`❌ Login failed: ${err.message}`));
    console.error(chalk.yellow("Full error details:"), err);
    return false;
  }
}

export function getLoggedInUser(): UserCredentials | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data) as UserCredentials;
  } catch (err) {
    return null;
  }
}

export default login;