const fs = require('fs');
const path = require('path');

const pluginsPath = path.resolve(__dirname, 'server/storage/plugins/agent-skills');
console.log('Checking plugins at:', pluginsPath);

if (fs.existsSync(pluginsPath)) {
  const folders = fs.readdirSync(pluginsPath);
  console.log('Found folders:', folders);
  for (const folder of folders) {
    const configPath = path.join(pluginsPath, folder, 'plugin.json');
    if (fs.existsSync(configPath)) {
      console.log(`- ${folder}: plugin.json exists`);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`  Name: ${config.name}, Active: ${config.active}`);
    } else {
      console.log(`- ${folder}: plugin.json MISSING`);
    }
  }
} else {
  console.log('Plugins directory does not exist!');
}
