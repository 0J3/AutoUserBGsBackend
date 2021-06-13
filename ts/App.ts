import api from './API';
import { port, apiRoute } from './config';
// import * as express from 'express';

// const app = express();

// app.use(apiRoute, api);

// app.listen(port, () => {
api.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/`);
});
