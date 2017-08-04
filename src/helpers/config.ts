import fs = require('fs');
import ini = require('ini');
import path = require('path');
import { logger } from 'winston-pnp-logger';

export const configPath = path.join(__dirname, '../../config/');

export class Config {

  config: Object;
  configName: string;

  constructor(configName?: string) {
    this.configName = configName;
    this.readConfigFile();
  }

  readConfigFile() {
    this.config = ini.parse(fs.readFileSync(path.join(configPath, this.configName + '.ini'), 'utf-8'));
    logger.info(`Config loaded: ${this.configName + '.ini'}`);
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
