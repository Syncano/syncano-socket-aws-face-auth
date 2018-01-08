import 'dotenv/config';

const config = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
  return { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION };
};

export default config;
