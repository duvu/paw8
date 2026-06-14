import { config } from 'dotenv';
import { join } from 'path';

// Load the api-gateway .env file for e2e tests
config({ path: join(__dirname, '../.env') });
