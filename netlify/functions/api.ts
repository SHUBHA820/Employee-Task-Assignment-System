import serverless from 'serverless-http';
import { app } from '../../src/apiApp';

export const handler = serverless(app);
