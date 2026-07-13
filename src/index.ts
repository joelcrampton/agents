import 'dotenv/config';
import { add } from './commands/add.js';
import { list } from './commands/list.js';
import { remove } from './commands/remove.js';

function printHelp(): void {
  console.log(`Usage: npm start -- <command>

Commands:
  add "<item>"    Search for a clothing item and save your pick
  list            Show everything on your wishlist
  remove <id>     Remove an item by id (ids are shown by \`list\`)
  help            Show this help

Shortcut: npm start -- "<item>" is the same as: npm start -- add "<item>"`);
}

const args = process.argv.slice(2);
const [command, ...rest] = args;

switch (command) {
  case 'list':
    await list();
    break;
  case 'remove':
    await remove(rest);
    break;
  case 'add':
    await add(rest.join(' '));
    break;
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;
  default:
    // Back-compat shortcut: treat a bare argument as a search to add.
    await add(args.join(' '));
}

// The Postgres client keeps the event loop alive; exit once the command is done.
process.exit();
