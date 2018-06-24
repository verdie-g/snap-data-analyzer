const fs = require('fs');
const mustache = require('mustache');

const templateName = 'template.html';

function readJsonFile(filename) {
  const json = fs.readFileSync(filename).toString();
  return JSON.parse(json);
}

function addFields(o, fields) {
  Object.keys(o).forEach(key => {
    Object.keys(fields).forEach(field => {
      if (o[key][field] === undefined) {
        o[key][field] = fields[field];
      }
    });
  });
}

function mergeObjectsKeys(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  const exclusiveUnionKeys = aKeys.filter(el => bKeys.indexOf(el) === -1);

  exclusiveUnionKeys.forEach(key => {
    if (a.hasOwnProperty(key)) {
      b[key] = {};
    } else {
      a[key] = {};
    }
  });
}

function aggregateByUser(messages, messagesByUser, userField, incrementField) {
  messages.forEach(message => {
    if (messagesByUser[message[userField]] === undefined) {
      messagesByUser[message[userField]] = {};
    }
    if (messagesByUser[message[userField]][incrementField] === undefined) {
      messagesByUser[message[userField]][incrementField] = 0;
    }
    messagesByUser[message[userField]][incrementField] += 1;
  });
}

function getSnaps(jsonFolder) {
  const snaps = readJsonFile(`${jsonFolder}/snap_history.json`);

  const snapsByUser = {};
  aggregateByUser(snaps['Received Snap History'], snapsByUser, 'From', 'received');
  aggregateByUser(snaps['Sent Snap History'], snapsByUser, 'To', 'sent');
  return snapsByUser;
}

function getMessages(jsonFolder) {
  const chat = readJsonFile(`${jsonFolder}/chat_history.json`);

  const messagesByUser = {};
  aggregateByUser(chat['Received Chat History'], messagesByUser, 'From', 'received');
  aggregateByUser(chat['Sent Chat History'], messagesByUser, 'To', 'sent');
  return messagesByUser;
}

function generateStatsFile(ctx) {
  const template = fs.readFileSync(templateName).toString();
  Object.keys(ctx).forEach(key => { ctx[key] = JSON.stringify(ctx[key]) });
  const rendered = mustache.render(template, ctx);
  fs.writeFileSync('index.html', rendered);
}

if (process.argv.length <= 2) {
  console.error(`usage: node snap_graph.js {json_folder}`);
  process.exit(1);
}

const jsonFolder = process.argv[2];
const snapsByUser = getSnaps(jsonFolder);
const messagesByUser = getMessages(jsonFolder);
mergeObjectsKeys(snapsByUser, messagesByUser);
addFields(snapsByUser, { 'sent': 0, 'received': 0 });
addFields(messagesByUser, { 'sent': 0, 'received': 0 });

const users = Object.keys(snapsByUser);
const totalSnaps = users.map(user => snapsByUser[user].sent + snapsByUser[user].received);
const messagesCount = users.map(user => messagesByUser[user].sent + messagesByUser[user].received);

generateStatsFile({
  users: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'],
  totalSnaps,
  messagesCount, 
});
