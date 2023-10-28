// Credits https://github.com/DuckySoLucky/hypixel-discord-chat-bridge/blob/f8a8a8e1e1c469127b8fcd03e6553b43f22b8250/src/Updater.js (Edited)
import { updateMessage, scriptMessage, errorMessage, otherMessage } from '../functions/logger';
import { exec } from 'child_process';
import { schedule } from 'node-cron';

schedule('0 */6 * * *', function () {
  scriptMessage('Checking for Code updates.');
  exec('git pull', (error, stdout, stderr) => {
    if (error) {
      errorMessage(`Git pull error: ${error}`);
      return;
    }
    if (stdout === 'Already up to date.\n') {
      return scriptMessage('Code is already up to date.');
    }
    if (stderr) {
      otherMessage(`Git pull stderr: ${stderr}`);
    }
    updateMessage();
  });
});
