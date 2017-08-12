import fs = require('fs');
import ini = require('ini');
import path = require('path');
import { logger } from 'winston-pnp-logger';
import { deactivate } from '../ping-bot';

export const configDir = path.join(__dirname, '../../config/');

export class Config {

  public config: object;
  public configName: string;

  constructor(configName?: string) {
    this.configName = configName;
    this.readConfigFile();
  }

  public getConfigProperty(property: string): any {
    if (this.config.hasOwnProperty(property)) {
      return this.config[property];
    } else {
      logger.warn(`Property '${property}' does not exist in config '${this.configName}.ini'`);
      return null;
    }
  }

  private readConfigFile() {
    let configFile;
    const configPath = path.join(configDir, this.configName + '.ini');
    try {
      configFile = fs.readFileSync(configPath, 'utf-8');
    } catch (error) {
      if (error.message.startsWith('ENOENT')) {
        logger.error(`Could not find ${configPath}, does it exist?`);
        deactivate(true).then();
      } else {
        throw error;
      }
    }

    this.config = ini.parse(configFile);

    for (const key in this.config) {
      if (this.config.hasOwnProperty(key)) {
        if (this.config[key] === '') {
          logger.error(`All config values have to be filled in, '${key}' was missing.`);
          deactivate(true).then();
        }
      }
    }

    logger.info(`Config loaded: ${this.configName + '.ini'}`);
  }
}
