import fs = require('fs');
import ini = require('ini');
import path = require('path');

import { logger } from './program-logger';

export const configPath = path.join(__dirname, '../../config/');

export let botConfig: Config;

export class Config {

  config: Object;
  configName: string;
  allowedMissing: boolean;

  constructor(configName?: string, allowedMissing = false) {
    this.configName = configName;
    this.allowedMissing = allowedMissing;
    this.readConfigFile();
  }

  readConfigFile() {
    try {
      // Try to read the config file from the config folder in the project root directory
      this.config = ini.parse(fs.readFileSync(path.join(configPath, this.configName + '.ini'), 'utf-8'));
      logger.info(`Config loaded: ${this.configName + '.ini'}`);
    } catch (error) {
      // Config file was not found or the parsing went wrong
      if (error.code === 'ENOENT' && this.allowedMissing) {
        // Config file is allowed to be missing, but the application might miss functionality
        logger.warn(this.configName + '.ini was not found, some functionality will be disabled and application might misbehave.');
        this.config = {};
      } else {
        // The config file was marked as essential for the system or something else went wrong, throw the original error.
        throw error;
      }
    }
  }

  get(property: string): any {
    if (this.config.hasOwnProperty(property)) {
      return this.config[property];
    } else {
      logger.warn(`Property '${property}' does not exist in config '${this.configName}.ini'`);
      return null;
    }
  }
}
