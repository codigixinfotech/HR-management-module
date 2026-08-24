const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const name = process.env.DB_NAME;

const url = `mysql://${user}:${password}@${host}:${port}/${name}`;
console.log('Constructed URL:', url);
