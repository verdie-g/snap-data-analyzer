const fs = require('fs');
const mustache = require('mustache');

const templateName = 'template.html';
const removeEmptyUsers = true;

function readJsonFile(filename) {
  const json = fs.readFileSync(filename).toString();
  return JSON.parse(json);
}

function addFields(o, fields) {
  Object.keys(o).forEach((key) => {
    Object.entries(fields)
      .filter(([field]) => !(field in o[key]))
      .forEach(([field, defaultValue]) => {
        o[key][field] = defaultValue;
      });
  });
}

function mergeObjectsKeys(a, b) {
  const shareObjectKeys = (from, to) => {
    Object.keys(from)
      .filter(key => !(key in to))
      .forEach((key) => {
        to[key] = {};
      });
  };

  shareObjectKeys(a, b);
  shareObjectKeys(b, a);
}

function aggregateByUser(messages, messagesByUser, userField, incrementField) {
  messages.forEach((message) => {
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

  // Media Type can be TEXT, VIDEO, "" (IMAGE OR SNAP OPENING ?)
  const isText = c => c['Media Type'] === 'TEXT';
  const received = chat['Received Chat History'].filter(isText);
  const sent = chat['Sent Chat History'].filter(isText);

  const messagesByUser = {};
  aggregateByUser(received, messagesByUser, 'From', 'received');
  aggregateByUser(sent, messagesByUser, 'To', 'sent');
  return messagesByUser;
}

function mapUsersToNames(jsonFolder) {
  const friends = readJsonFile(`${jsonFolder}/friends.json`);

  return friends.Friends
    .filter(f => f['Display Name'] !== '')
    .reduce((nameByUser, f) => {
      nameByUser[f.Username] = f['Display Name'];
      return nameByUser;
    }, {});
}

function generateStatsFile(ctx) {
  const template = fs.readFileSync(templateName).toString();
  Object.keys(ctx).forEach((key) => { ctx[key] = JSON.stringify(ctx[key]); });
  const rendered = mustache.render(template, ctx);
  fs.writeFileSync('index.html', rendered);
}

if (process.argv.length <= 2) {
  console.error('usage: node snap_graph.js {json_folder}');
  process.exit(1);
}

const jsonFolder = process.argv[2];
const snapsByUser = getSnaps(jsonFolder);
const messagesByUser = getMessages(jsonFolder);
const nameByUser = mapUsersToNames(jsonFolder);
mergeObjectsKeys(snapsByUser, messagesByUser);
addFields(snapsByUser, { sent: 0, received: 0 });
addFields(messagesByUser, { sent: 0, received: 0 });

var users = Object.keys(snapsByUser);
var totalSnaps = users.map(user => snapsByUser[user].sent + snapsByUser[user].received);
var messagesCount = users.map(user => messagesByUser[user].sent + messagesByUser[user].received);
var names = users.map(u => nameByUser[u] || u);

if (removeEmptyUsers) {
  // only counts snaps as chat_history data is polluted with stories
  // simply add (messagesByUser[user].sent + messagesByUser[user].received) to count messages also
  var contactedUsers = users.filter(user => (snapsByUser[user].sent + snapsByUser[user].received) > 0);
  totalSnaps = contactedUsers.map(user => snapsByUser[user].sent + snapsByUser[user].received);
  messagesCount = contactedUsers.map(user => messagesByUser[user].sent + messagesByUser[user].received);
  names = contactedUsers.map(u => nameByUser[u] || u);
}

generateStatsFile({
  users: names,
  totalSnaps,
  messagesCount,
});
