///////////////////////////////////////////////////////
/////////// Error Class ///////////////////////////////
///////////////////////////////////////////////////////

// CLASS Error
export default class Error {
  static fromJSON(json: {
    code: number;
    short: string;
    long?: string;
    extra?: any;
  }) {
    return new Error(json.code, json.short, json.long, json.extra);
  }

  errCode: number;
  shortBio: string;
  longBio: string = 'No further information about this error was provided';
  extraJSON: any;
  isError: boolean = true;

  constructor(
    eCode: number,
    shortBio: string,
    longBio?: string,
    extraData?: any
  ) {
    this.errCode = eCode;
    this.shortBio = shortBio;
    if (longBio) this.longBio = longBio;
    if (extraData) this.extraJSON = extraData;
  }
  toJSON() {
    return {
      code: this.errCode,
      short: this.shortBio,
      long: this.longBio,
      extra: this.extraJSON,
    };
  }
}

///////////////////////////////////////////////////////
/////////// Individual Errors /////////////////////////
///////////////////////////////////////////////////////
export const cannotUseNonHttpsProtocol = new Error(
  400,
  'Invalid Protocol',
  `You cannot use a non HTTPS:// protocol for an image`
);
export const cannotUseInsecureUrl = new Error(
  400,
  'Cannot use insecure image URL',
  `You cannot submit an insecure (HTTP) URL, as we refuse to submit those to any client. Try again with the HTTPS:// variant`
);
export const whoami_noauth = new Error(
  400,
  'No Auth, No WhoAmI',
  `You cannot call /whoamireally without specifying ?auth=`
);
export const getbanner_noid = new Error(
  400,
  'No ID, no Banner',
  `You cannot call /getbanner/:id without an id`
);
