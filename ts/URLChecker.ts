import { cannotUseInsecureUrl, cannotUseNonHttpsProtocol } from './Errors';
import HttpError from './Errors';

const domains = [
  'cdn.discordapp.com',
  'cdn.discord.com',
  'github.com',
  'raw.githubusercontent.com',
  'nora.lgbt',
  '0j3.github.io',
  '0j3-2.github.io',
  'unsplash.com',
  'i.imgur.com',
];

// FUNCTION URL isProhibited
const isProhibited = (url: string) => {
  let v = false;
  domains.forEach(domain => {
    if (url.startsWith(domain + '/')) v = true;
  });
  return !v;
};

// FUNCTION URLChecker
export default (url: string) => {
  if (!url.startsWith('http')) {
    return cannotUseNonHttpsProtocol;
  } else if (!url.startsWith('https://')) {
    return cannotUseInsecureUrl;
  } else if (isProhibited(url.replace('https://', ''))) {
    return new HttpError(
      400,
      'The domain you specified is not authorized',
      `We do not support usage of the domain ${
        url.replace('https://', '').split('/')[0]
      }`
    );
  }
  return {
    isError: false,
  };
};
