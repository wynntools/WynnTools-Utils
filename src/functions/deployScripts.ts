import { errorMessage, scriptMessage } from './logger';
import { readdirSync } from 'fs';

export const deployScripts = async () => {
  try {
    const scriptFiles = readdirSync('./src/scripts');
    let count = scriptFiles.length;
    for (const file of scriptFiles) {
      if (file.toLowerCase().includes('disabled')) {
        count--;
        scriptMessage(`Skipping ${file.split('.')[0]} (disabled)`);
        continue;
      }
      await import(`../scripts/${file}`);
      scriptMessage(`Successfully loaded ${file.split('.')[0]}`);
    }
    scriptMessage(`Successfully loaded ${count} script(s).`);
  } catch (error: any) {
    errorMessage(error);
  }
};
