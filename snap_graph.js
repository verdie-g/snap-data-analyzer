const fs = require('fs');
const mustache = require('mustache');

const templateName = 'template.html';

function readJsonFile(filename) {
  const json = fs.readFileSync(filename).toString();
  return JSON.parse(json);
}

function countSnaps(snaps, snapsByUser, userField) {
  snaps.forEach(snap => {
    if (snapsByUser[snap[userField]] === undefined) {
      snapsByUser[snap[userField]] = {
        video: 0,
        image: 0,
        total: 0,
      };
    } 
    snapsByUser[snap[userField]].total += 1;
    if (snap['Media Type'] === 'IMAGE') {
      snapsByUser[snap[userField]].image += 1;
    } else {
      snapsByUser[snap[userField]].video += 1;
    }
  });
}

if (process.argv.length <= 2) {
  console.error(`usage: node snap_graph.js {json_folder}`);
  process.exit(1);
}

const jsonFolder = process.argv[2];
const snaps = readJsonFile(`${jsonFolder}/snap_history.json`);

const snapsByUser = {};
countSnaps(snaps['Received Snap History'], snapsByUser, 'From');
countSnaps(snaps['Sent Snap History'], snapsByUser, 'To');

const users = Object.keys(snapsByUser);
const totalSnaps = Object.keys(snapsByUser).map(user => snapsByUser[user].total);

const ctx = { users, totalSnaps };

const template = fs.readFileSync(templateName).toString();
Object.keys(ctx).forEach(key => { ctx[key] = JSON.stringify(ctx[key]) });
const rendered = mustache.render(template, ctx);
fs.writeFileSync("index.html", rendered);
