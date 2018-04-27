import 'dotenv/config';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, COLLECTION_ID } = process.env;
const config = { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, COLLECTION_ID };

export default config;
