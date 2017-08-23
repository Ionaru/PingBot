import * as Discord from 'discord.js';
import * as moment from 'moment';
import fetch from 'node-fetch';
import { logger, WinstonPnPLogger } from 'winston-pnp-logger';
import { Config } from './helpers/config';
import { IFleetUpData, IFleetUpOperationData, IOperationData } from './typings';
import Timer = NodeJS.Timer;

let client: Discord.Client;

let config: Config;

const operations: IOperationData = {};

const pings: { [id: number]: Timer[] } = {};

let myPingChannel: Discord.TextChannel;

const checkInterval = 10 * 60 * 1000; // 10 minutes
let aheadPingTime: number;

async function activate() {
  new WinstonPnPLogger({
    logDir: '../logs'
  });

  logger.info('Bot has awoken, loading configuration');

  config = new Config('config');

  const token = config.getConfigProperty('token');

  aheadPingTime = Number(config.getConfigProperty('hoursAmount')) * 60 * 60 * 1000;

  client = new Discord.Client();
  client.login(token);
  client.once('ready', () => {
    announceReady().then();
  });
}

async function announceReady() {
  myPingChannel = getPingChannel();
  if (myPingChannel) {
    logger.info(`Server: ${myPingChannel.guild.name}`);
    logger.info(`Channel: ${myPingChannel.name}`);

    if (config.getConfigProperty('announceSelf')) {
      const message = `<@${client.user.id}> reporting for fleet-ping duty **o7**`;

      myPingChannel.send(message).catch((error) => {
        let errorText = `Unable to send a message to channel ${myPingChannel.name}.`;
        if(error.toString().indexOf('Missing Permissions') > -1) {
          errorText += ' Looks like a problem with permissions on Discord.';
        } else if(error.toString().indexOf('Missing Access') > -1) {
          errorText += ' Looks like the bot was unable to join the Discord channel.';
        }

        logger.error(errorText);
        logger.error(error);
        deactivate(true, true).then();
      });
    }

    const fleetUpAppKey = config.getConfigProperty('app-key');
    const fleetUpUserId = config.getConfigProperty('user-id');
    const fleetUpApiCode = config.getConfigProperty('api-code');
    const fleetUpHost = 'http://api.fleet-up.com';
    const fleetUpPath = 'Api.svc';
    const url = `${fleetUpHost}/${fleetUpPath}/${fleetUpAppKey}/${fleetUpUserId}/${fleetUpApiCode}/Operations`;
    logger.info(`API: ${url}`);
    await fetchOperations(url, true);
    scheduleWarnings();
    setInterval(fetchOperations, checkInterval, url);
  } else {
    logger.error('This bot needs a channel to send messages to, please enter a correct Channel ID in the config file');
    deactivate(true).then();
  }

  logger.info(`I am ${client.user.username}, now online!`);

  client.on('warn', (warning: string) => {
    logger.warn(warning);
  });
  client.on('error', (error: Error) => {
    logger.error(error.message);
  });
  client.once('disconnect', (event: CloseEvent) => {
    logger.warn('Connection closed');
    logger.warn('Code:', event.code);
    logger.warn('Reason:', event.reason);
    logger.warn('Performing soft reboot');
    deactivate(false).then(() => {
      activate().then();
    });
  });
}

export async function deactivate(exitProcess: boolean, error = false) {
  let quitMessage = 'Quitting';
  if(error) {
    quitMessage += ' because of an error'
  }
  quitMessage += '!';

  logger.info(quitMessage);
  if (client) {
    await client.destroy();
    client = null;
    logger.info('Client destroyed');
  }
  logger.info('Shutdown success!');
  if (exitProcess) {
    process.exit(0);
  }
}

async function fetchOperations(url, firstFetch = false): Promise<void> {
  const response = await fetch(url).catch((error) => {
    logger.warn(error);
    return null;
  });
  if (response) {
    const json: IFleetUpData = await response.json().catch((error) => {
      logger.warn(error);
      return {};
    });
    if (json.Success) {
      const fleetUpOperationIds: number[] = [];
      if (json.Data) {
        for (const fleetUpOperation of json.Data) {
          fleetUpOperationIds.push(fleetUpOperation.Id);
          if ((parseFleetUpTime(fleetUpOperation.Start).getTime() - Date.now()) > 0) {
            if (!firstFetch && !operations[fleetUpOperation.Id]) {
              sendNewOpPing(fleetUpOperation);
            }
            if (operations[fleetUpOperation.Id]) {
              if (JSON.stringify(operations[fleetUpOperation.Id]) !== JSON.stringify(fleetUpOperation)) {
                sendOpEditPing(fleetUpOperation);
              }
            }
            operations[fleetUpOperation.Id] = fleetUpOperation;
          }
        }
        for (const operationId in operations) {
          if (!fleetUpOperationIds.includes(Number(operationId))) {
            if ((parseFleetUpTime(operations[operationId].Start).getTime() - Date.now()) > 0) {
              for (const timer of pings[operationId]) {
                clearTimeout(timer);
              }
              await sendOpRemovedPing(operations[operationId]);
            }
            delete operations[operationId];
          }
        }
      }
    } else {
      logger.error(`Unable to fetch operations data, reason: ${response.status}; ${response.statusText}`);
      logger.error(JSON.stringify(json));
    }
  }
  scheduleWarnings();
}

function scheduleWarnings() {
  for (const operationId in operations) {
    if (operations.hasOwnProperty(operationId)) {
      const operation = operations[operationId];
      const timeTillOpStart = parseFleetUpTime(operation.Start).getTime() - Date.now();
      const timeTillPingTime = timeTillOpStart - aheadPingTime;

      if (pings[operationId]) {
        for (const timer of pings[operationId]) {
          clearTimeout(timer);
        }
      } else {
        pings[operationId] = [];
      }

      if (aheadPingTime && timeTillPingTime < checkInterval && timeTillPingTime > 0) {
        pings[operationId].push(setTimeout(sendAheadPing, timeTillPingTime, operation));
      }
      if (timeTillOpStart < checkInterval && timeTillOpStart > 0) {
        pings[operationId].push(setTimeout(sendOpStartPing, timeTillOpStart, operation));
      }
    }
  }
}

function getPingChannel() {
  const pingChannelId = config.getConfigProperty('channel-id');
  for (const guild of client.guilds.array()) {
    for (const channel of guild.channels.array()) {
      if (channel.id === pingChannelId && channel.type === 'text') {
        return channel as Discord.TextChannel;
      }
    }
  }
  logger.error(`No channel found with ID ${pingChannelId} on any servers this bot is in.`);
}

function parseFleetUpTime(timeString: string): Date {
  return new Date(Number(timeString.replace(/\D+/g, '')));
}

function pluralize(singular: string, plural: string, amount: number): string {
  if (amount === 1) {
    return singular;
  }
  return plural;
}

function getFleetMoment(timeDate: Date): string {
  return moment.utc(timeDate).format('dddd D MMM [**at**] HH[:]mm');
}

function opMessageInfo(operation: IFleetUpOperationData) {
  let message = '';

  if (config.getConfigProperty('showFleetNameTime')) {
    const momentString = getFleetMoment(parseFleetUpTime(operation.Start));
    if (operation.Subject !== '(No Name)') {
      message += `**${operation.Subject}** starts on **${momentString} EVE time**`;
    } else {
      message += `This fleet starts on **${momentString} EVE time**`;
    }
    message += '\n\n';
  }

  if (config.getConfigProperty('showLocation')) {
    if (operation.Location && operation.LocationInfo) {
      message += `Fleet forms in **${operation.Location}** - **${operation.LocationInfo}**`;
      message += '\n\n';
    } else if (operation.Location) {
      message += `Fleet forms in **${operation.Location}**`;
      message += '\n\n';
    }
  }

  if (config.getConfigProperty('showDoctrines')) {
    if (operation.Doctrines.length) {
      const doctrineNames = [];
      for (const doctrine of operation.Doctrines) {
        doctrineNames.push(doctrine.Name);
      }
      message += `Doctrine: **${doctrineNames.join(`** / **`)}**`;
      message += '\n\n';
    }
  }

  if (config.getConfigProperty('showURL')) {
    if (operation.Url) {
      message += `More info on **<${operation.Url}>**`;
      message += '\n';
    }
  }

  if (config.getConfigProperty('showFleetUpLink')) {
    message += `FleetUp link: **<https://fleet-up.com/Operation#${operation.Id}>**`;
  }

  if (message.length === 0) {
    logger.warn(`Ping for fleet ${operation.Subject} (${operation.Id}) contained no information and is probably not useful.`);
  }

  return message;
}

function sendNewOpPing(operation: IFleetUpOperationData) {
  if (config.getConfigProperty('operationCreated')) {
    let message = '@everyone';
    message += '\n';
    message += '**A new operation has been posted!**';
    message += '\n\n';
    message += opMessageInfo(operation);

    myPingChannel.send(message).catch((error) => {
      logger.error(`An error occurred when trying to ping channel ${myPingChannel.name}`);
      logger.error(error);
    });
  }
}

async function sendOpRemovedPing(operation: IFleetUpOperationData) {
  if (config.getConfigProperty('operationRemoved')) {
    const momentString = getFleetMoment(parseFleetUpTime(operation.Start));

    let message = '@everyone';
    message += '\n';
    message += '**An operation has been cancelled!**';
    message += '\n\n';
    if (config.getConfigProperty('showFleetNameTime')) {
      if (operation.Subject === '(No Name)') {
        message += `The fleet was scheduled to start on **${momentString} EVE time**\n\n`;
      } else {
        message += `**${operation.Subject}** was scheduled to start on **${momentString} EVE time**\n\n`;
      }
    }

    if (config.getConfigProperty('showURL')) {
      if (operation.Url) {
        message += `More info on <${operation.Url}>`;
        message += '\n';
      }
    }
    if (config.getConfigProperty('showFleetUpLink')) {
      message += `FleetUp link: <https://fleet-up.com/Operation#${operation.Id}>`;
    }

    await myPingChannel.send(message).catch((error) => {
      logger.error(`An error occurred when trying to ping channel ${myPingChannel.name}`);
      logger.error(error);
    });
  }
}

function sendOpEditPing(operation: IFleetUpOperationData) {
  if (config.getConfigProperty('operationEdited')) {
    let message = '@everyone';
    message += '\n';
    message += '**A posted operation was edited, re-check the time and place!**';
    message += '\n\n';
    message += opMessageInfo(operation);

    myPingChannel.send(message).catch((error) => {
      logger.error(`An error occurred when trying to ping channel ${myPingChannel.name}`);
      logger.error(error);
    });
  }
}

function sendAheadPing(operation: IFleetUpOperationData) {
  if (config.getConfigProperty('operationStartSoon')) {
    const pingHours = Number(config.getConfigProperty('hoursAmount'));
    const hourWord = pluralize('hour', 'hours', pingHours);
    let message = '@everyone';
    message += '\n';
    message += `**An operation will start in ${pingHours} ${hourWord}!**`;
    message += '\n\n';
    message += opMessageInfo(operation);

    myPingChannel.send(message).catch((error) => {
      logger.error(`An error occurred when trying to ping channel ${myPingChannel.name}`);
      logger.error(error);
    });
  }
}

function sendOpStartPing(operation: IFleetUpOperationData) {
  if (config.getConfigProperty('operationStarting')) {
    let message = '@everyone';
    message += '\n';
    message += '**An operation is underway, join join join!**';
    message += '\n\n';
    message += opMessageInfo(operation);

    myPingChannel.send(message).catch((error) => {
      logger.error(`An error occurred when trying to ping channel ${myPingChannel.name}`);
      logger.error(error);
    });
  }
}

activate().then();
process.stdin.resume();
process.on('unhandledRejection', (reason: string, p: Promise<any>): void => {
  logger.error('Unhandled Rejection at: Promise', p, '\nreason:', reason);
});
process.on('uncaughtException', (error) => {
  logger.error(error.message);
  deactivate(true, true).then();
});
process.on('SIGINT', () => {
  deactivate(true).then();
});
