import * as Discord from 'discord.js';
import * as moment from 'moment';
import { FleetUpData, FleetUpOperationData, OperationData } from './typings';
import { Logger, logger } from './helpers/program-logger';
import { Config } from './helpers/config';
import fetch from 'node-fetch';
import path = require('path');
import programLogger = require('./helpers/program-logger');
import fs = require('fs');
import ini = require('ini');
import configService = require('./helpers/config');
import Timer = NodeJS.Timer;

let client: Discord.Client;

let botConfig: Config;

const operations: OperationData = {};

const pings: { [id: number]: Array<Timer> } = {};

let myPingChannel: Discord.TextChannel;

const checkInterval = 10 * 60 * 1000; // 10 minutes
const aheadPingTime = 2 * 60 * 60 * 1000; // 2 hours

async function activate() {
  programLogger.logger = new Logger();

  logger.info('Bot has awoken, loading configuration');

  botConfig = new Config('config');

  const token = botConfig.get('token');

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
    const fleetUpAppKey = botConfig.get('app-key');
    const fleetUpUserId = botConfig.get('user-id');
    const fleetUpApiCode = botConfig.get('api-code');
    const fleetUpHost = 'http://api.fleet-up.com';
    const fleetUpPath = 'Api.svc';
    const url = `${fleetUpHost}/${fleetUpPath}/${fleetUpAppKey}/${fleetUpUserId}/${fleetUpApiCode}/Operations`;
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
    logger.error(error);
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

async function deactivate(exitProcess: boolean) {
  logger.info('Quitting!');
  if (client) {
    await client.destroy();
    client = null;
    logger.info('Client destroyed');
  }
  logger.info('Done!');
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
    const json: FleetUpData = await response.json().catch((error) => {
      logger.warn(error);
      return {};
    });
    if (json.Success) {
      const fleetUpOperationIds: Array<number> = [];
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
      if (pings[operationId]) {
        for (const timer of pings[operationId]) {
          clearTimeout(timer);
        }
      } else {
        pings[operationId] = [];
      }
      if (timeTillOpStart - aheadPingTime > 0) {
        pings[operationId].push(setTimeout(sendAheadPing, timeTillOpStart - aheadPingTime, operation));
      }
      if (timeTillOpStart > 0) {
        pings[operationId].push(setTimeout(sendOpStartPing, timeTillOpStart, operation));
      }
    }
  }
}

function getPingChannel() {
  const pingChannelId = botConfig.get('channel-id');
  for (const guild of client.guilds.array()) {
    for (const channel of guild.channels.array()) {
      if (channel.id === pingChannelId && channel.type === 'text') {
        return <Discord.TextChannel> channel;
      }
    }
  }
  logger.error(`No channel found with ID ${pingChannelId} on any servers this bot is in.`);
}

function parseFleetUpTime(timeString: string): Date {
  return new Date(Number(timeString.replace(/\D+/g, '')));
}

function getFleetMoment(timeDate: Date): string {
  return moment.utc(timeDate).format('dddd D MMM [**at**] HH[:]mm');
}

function opMessageInfo(operation: FleetUpOperationData) {
  let message = '';
  const momentString = getFleetMoment(parseFleetUpTime(operation.Start));

  if (operation.Subject === '(No Name)') {
    message += `This fleet starts on **${momentString} EVE time**`;
  } else {
    message += `**${operation.Subject}** starts on **${momentString} EVE time**`;
  }

  message += '\n\n';

  if (operation.Location && operation.LocationInfo) {
    message += `Fleet forms in \`${operation.Location}\` - \`${operation.LocationInfo}\``;
    message += '\n\n';
  } else if (operation.Location) {
    message += `Fleet forms in \`${operation.Location}\``;
    message += '\n\n';
  }

  if (operation.Url) {
    message += `More info on <${operation.Url}>`;
    message += '\n';
  }

  message += `FleetUp link: <https://fleet-up.com/Operation#${operation.Id}>`;
  message += '\n\n';

  return message;
}

function sendNewOpPing(operation: FleetUpOperationData) {
  if (botConfig.get('operationCreated')) {
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

async function sendOpRemovedPing(operation: FleetUpOperationData) {
  if (botConfig.get('operationRemoved')) {
    const momentString = getFleetMoment(parseFleetUpTime(operation.Start));

    let message = '@everyone';
    message += '\n';
    message += '**An operation has been cancelled!**';
    message += '\n\n';
    if (operation.Subject === '(No Name)') {
      message += `The fleet was scheduled to start on **${momentString} EVE time**\n\n`;
    } else {
      message += `**${operation.Subject}** was scheduled to start on **${momentString} EVE time**\n\n`;
    }

    if (operation.Url) {
      message += `More info on <${operation.Url}>`;
      message += '\n';
    }
    message += `FleetUp link: <https://fleet-up.com/Operation#${operation.Id}>`;

    await myPingChannel.send(message).catch((error) => {
      logger.error(`An error occurred when trying to ping channel ${myPingChannel.name}`);
      logger.error(error);
    });
  }
}

function sendOpEditPing(operation: FleetUpOperationData) {
  if (botConfig.get('operationEdited')) {
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

function sendAheadPing(operation: FleetUpOperationData) {
  if (botConfig.get('operationStartSoon')) {
    let message = '@everyone';
    message += '\n';
    message += '**An operation will start in 2 hours!**';
    message += '\n\n';
    message += opMessageInfo(operation);

    myPingChannel.send(message).catch((error) => {
      logger.error(`An error occurred when trying to ping channel ${myPingChannel.name}`);
      logger.error(error);
    });
  }
}

function sendOpStartPing(operation: FleetUpOperationData) {
  if (botConfig.get('operationStarting')) {
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
process.on('unhandledRejection', function (reason: string, p: Promise<any>): void {
  logger.error('Unhandled Rejection at: Promise', p, '\nreason:', reason);
});
process.on('uncaughtException', function (error) {
  logger.error(error);
  deactivate(true).then();
});
process.on('SIGINT', () => {
  deactivate(true).then();
});
