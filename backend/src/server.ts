import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`  JANRAKSHA AI — Backend Command Server`);
  console.log(`  Team Paradise Force | Bihar Police Hackathon PS-04`);
  console.log(`  API Active on: http://localhost:${config.port}${config.apiPrefix}`);
  console.log(`  Health Check:  http://localhost:${config.port}${config.apiPrefix}/health`);
  console.log(`====================================================`);
});
