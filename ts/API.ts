import * as express from 'express';
import fetch from 'node-fetch';
import { apiRoute, clientID, clientSecret, redirect_uri } from './config';
import { whoami_noauth, getbanner_noid } from './Errors';
import * as fs from 'fs';
import * as multer from 'multer';
import * as expressratelimit from 'express-rate-limit';

let data = {};
const saveData = () => {
  fs.writeFileSync('./data.json', JSON.stringify(data));
};
if (!fs.existsSync('./data.json')) {
  saveData();
} else {
  data = JSON.parse(fs.readFileSync('./data.json').toString());
}

// POLYFILL BTOA
const btoa = (str: string | Buffer) => {
  let buffer: Buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = Buffer.from(str.toString(), 'binary');
  }

  return buffer.toString('base64');
};

const app = express();

app.use(
  expressratelimit({
    windowMs: 5000,
    max: 100,
    message: 'The server seems to be overloaded. Please try again later',
  })
);

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(multer().array());

const postRedirLocation = 'https://aubg.nora.lgbt/';

const url = `https://discord.com/api/oauth2/authorize?client_id=${clientID}&redirect_uri=${encodeURIComponent(
  redirect_uri
)}&response_type=code&scope=identify%20email`; // login uri

const authCodeRoute = `'${apiRoute}/whoamireally?auth='+(localStorage.getItem('AUTH_TOKEN_TYPE')||'Bearer')+' '+localStorage.getItem('AUTH_CODE'), {}).then(response => response.json()`;
const authCode = `fetch(${authCodeRoute})`; // Code to get auth token

// ROUTE /styles
app.get('/styles', (req, res) => {
  res.send(`body {
  background: #2a2b2c;
  color:#fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
a{
  color:#fff
}`);
});

// FUNCTION updateCSS
let css = ``;
const updateCSS = () => {
  let ncss = '';
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const element = data[key];
      ncss =
        ncss +
        `*[user_by_bdfdb="${key}"],*[data-user-id="${key}"]{--user-background: url(https://cdn.discordapp.com/${element.banner});}`;
    }
  }
  css = ncss;
  fs.writeFileSync('./css.css', css);
};
updateCSS();
setInterval(updateCSS, 60e3);

// ROUTE /vars.css
app.all('/vars.css', (req, res) => {
  res.send(css);
});

// ROUTE /getBanner
app.get('/getBanner/:id', (req, res) => {
  if (!req.params.id) {
    res.status(404).send(getbanner_noid);
  } else {
    res.send({ banner: (data[req.params.id] || {}).banner || '' });
  }
});

// ROUTE /whoami (debug)
app.get('/whoami', (req, res) => {
  res.send(`<link rel="stylesheet" href="${apiRoute}/styles">
<h1>If you accidentally found this, please click <a href="/">here</a></h1><h2>This is a **DEBUG TOOL**, not something for normal users.</h2>
You are <span id="User">UNKNOWN#0000</span> (ID: <span id="ID">0</span>, Avatar: <a id="AvatarLink"><span id="Avatar"></span></a>)
<p>CLIENT INFO:</p>
<ol>
<li id="authCode"></li>
<li id="att"></li>
</ol>
<script id='s'>
  ${authCode}.then((data)=>{
    document.getElementById('User').innerHTML=data.username+'#'+data.discriminator;
    document.getElementById('ID').innerHTML=data.id;
    document.getElementById('Avatar').innerHTML=data.avatar;
    document.getElementById('AvatarLink').href=\`https://cdn.discordapp.com/avatars/$\{data.id}/$\{data.avatar}\`
    document.getElementById('s').outerHTML='';
    document.getElementById('authCode').innerHTML='ACode: <code>'+localStorage.getItem('AUTH_CODE')+'</code>'
    document.getElementById('att').innerHTML='att: <code>'+localStorage.getItem('AUTH_TOKEN_TYPE')+'</code>'
  });
</script>`);
});

// FUNCTION getUserData
const getUserData = async (auth: any) => {
  const a: { json: () => Promise<any> } = await fetch(
    'https://discord.com/api/users/@me',
    {
      ['h' + 'eaders']: {
        authorization: auth,
      },
    }
  );

  const d = await a.json();

  return d;
};

// FUNCTION setUserBanner
const setUserBanner = async (auth: string, banner: string) => {
  const d = await getUserData(auth);

  if (d.id) {
    data[d.id] = data[d.id] || {};
    data[d.id].banner = banner;
    saveData();
    return false;
  } else {
    return d;
  }
};

// ROUTE /setUserBanner/:auth
app.post('/setUserBanner/:auth', async (req, res) => {
  const body = req.body;
  if (typeof body == 'undefined') res.send('no body');
  if (typeof body.url == 'undefined') res.send('no url');

  const v = await setUserBanner(req.params.auth, body.url);

  if (v) res.send(v);
  else res.redirect(302, 'https://aubg.nora.lgbt/success');
});

// ROUTE /whoamireally (api/debug)
app.get('/whoamireally', async ({ query }, res) => {
  if (!query.auth) {
    return res.send(whoami_noauth.toJSON());
  }

  res.send(await getUserData(query.auth));
});

// ROUTE /RedirComplete
app.get('/redirComplete', async ({ query }, res) => {
  let { code, state } = query;

  if (!state) {
    res.status(400).send('No state');
  }
  if (code) {
    try {
      const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        ['b' + 'ody']: new URLSearchParams({
          client_id: clientID.toString(),
          client_secret: clientSecret,
          code: code.toString(),
          grant_type: 'authorization_code',
          redirect_uri,
          scope: 'identify',
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const oauthData = await oauthResult.json();

      if (!oauthData.error)
        res.send(
          `<link rel="stylesheet" href="${apiRoute}/styles"><script>if(localStorage.getItem('oauth-state')=='${state}'){localStorage.setItem('AUTH_CODE','${oauthData.access_token}');localStorage.setItem('AUTH_TOKEN_TYPE','${oauthData.token_type}');localStorage.removeItem('oauth-state');document.location.replace('${postRedirLocation}')}else{alert('error: invalid state\\n'+localStorage.getItem('oauth-state'));localStorage.removeItem('oauth-state')}</script>`
        );
      else
        res.status(401).send({
          error: true,
          discordError: true,
          discordResponse: oauthData,
        });

      // const userResult = await fetch('https://discord.com/api/users/@me', {
      //   headers: {
      //     authorization: `${oauthData.token_type} ${oauthData.access_token}`,
      //   },
      // });

      // console.log(oauthData);

      // const resDat = await userResult.json();

      // res.send(resDat.id);
    } catch (error) {
      // NOTE: An unauthorized token will not throw an error;
      // it will return a 401 Unauthorized response in the try block above
      console.error(error);
    }
  } else {
    res.status(400).send({
      err: 'NO_CODE_SPECIFIED',
    });
  }
});

// ROUTE /login
app.get('/login', (req, res) => {
  const generateRandomString = () => {
    let randomString = '';
    const randomNumber = Math.floor(Math.random() * 10);

    for (let i = 0; i < 20 + randomNumber; i++) {
      randomString += String.fromCharCode(33 + Math.floor(Math.random() * 94));
    }

    return randomString.split('#').join('').split('?').join('');
  };
  const randomString = generateRandomString();

  const target = url + `&state=${encodeURIComponent(btoa(randomString))}`;

  res.send(`<link rel="stylesheet" href="/styles">
<script>
//SET OAUTH STATE
localStorage.setItem('oauth-state','${btoa(randomString)}');

//WAIT TO ENSURE ITEM GOT SET
setTimeout(()=>{
//GOTO URL
document.location.replace('${target}');
},100)
</script>`);
});

// ROUTE /source
app.get('/source', (req, res) =>
  res.redirect('https://nora.lgbt/goto/gh/AutoUserBGsBackend')
);

// ANCHOR export api
export default app;
