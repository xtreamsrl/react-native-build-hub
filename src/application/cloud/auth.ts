import * as fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import querystring from 'node:querystring';
import open from 'open';
import './firebase';

import { getAuth, GoogleAuthProvider, signInWithCredential, User } from 'firebase/auth';
import { getRootDestinationFolder } from '../utils';
import { UserImpl } from '@firebase/auth/internal';

function fetchWithFormData(url: string, formData: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestOptions: http.RequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const req = https.request(url, requestOptions, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const responseData = JSON.parse(data);
        resolve(responseData);
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(formData);
    req.end();
  });
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const PORT = 3004; // Change this to the desired port number
const redirectUri = 'http://localhost:3004'; // This should be a page in your application that handles the authentication response.

async function getAuthTokensFromFile() {
  if (fs.existsSync(getTokenCacheFile())) {
    const tokens = JSON.parse(fs.readFileSync(getTokenCacheFile(), 'utf-8'));
    return tokens;
  }
  return null;
}

function getTokenCacheFile() {
  return path.join(getRootDestinationFolder(), 'auth-tokens.json');
}

async function saveTokensToFile(tokens: any) {
  fs.writeFileSync(getTokenCacheFile(), JSON.stringify(tokens));
}

export async function restoreUser() {
  const userData = await getAuthTokensFromFile();
  if (userData) {
    const user: User = UserImpl._fromJSON(getAuth() as any, userData);
    await getAuth().updateCurrentUser(user);

    await getAuth().currentUser?.reload();
    console.log('userCredential', user);
  } else {
    throw new Error('No tokens found');
  }
}

async function handleLoginWithCode(code: string, res: http.ServerResponse, server: http.Server, resolve: () => void) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';

  const tokenRequestBody = querystring.stringify({
    code,
    client_id: CLIENT_ID,
    client_secret: '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',
    redirect_uri: 'http://localhost:3004',
    grant_type: 'authorization_code',
  });

  fetchWithFormData(tokenUrl, tokenRequestBody)
    .then(data => {
      if (data.id_token) {
        const idToken = data.id_token;
        console.log('Received ID token:', idToken);

        // Build Firebase credential with the Google ID token.
        const credential = GoogleAuthProvider.credential(idToken);

        // Sign in with credential from the Google user.
        const auth = getAuth();
        signInWithCredential(auth, credential)
          .then(userCredential => {
            console.log('userCredential', userCredential);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`<html><head></head><body>Signed in, go back to the cli</body></html>`);
            server.close();
            saveTokensToFile(userCredential.user.toJSON());
            resolve();
          })
          .catch(error => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
          });
      } else {
        console.error('Error fetching ID token:', data.error);
      }
    })
    .catch((error: any) => {
      console.error('Error fetching ID token:', error.message);
    });
}

export function startListenOnRedirect(resolve: () => void, reject: (err: any) => void) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url!, `http://localhost:${PORT}`);
    const code = url.searchParams.get('code');

    if (code) {
      handleLoginWithCode(code, res, server, resolve);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<html><head></head><body>Signed in, go back to the cli</body></html>`);
    }
  });

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

async function openOauthLogin() {
  const googleLoginUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=profile email`;

  open(googleLoginUrl);
}

export async function signIn() {
  return new Promise<void>((resolve, reject) => {
    startListenOnRedirect(resolve, reject);
    openOauthLogin();
  });
}
