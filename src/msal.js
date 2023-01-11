import * as msal from '@azure/msal-browser';
import { csd } from './libCommon/dbg';
import { EnvDeployConfig, EnvMSalConfig } from './libCommon/envs';

const msalConfig = {
  auth: {
    clientId: EnvMSalConfig().client_id,
    authority: EnvMSalConfig().authority,
    //redirectUri: `${EnvDeployConfig().app_url}`,
    redirectUri: '/',
    scopes: ['user.read', 'email', 'offline_access']
    //redirectUri: `${EnvDeployConfig().app_url}/cydag`, // /cydag
    //redirectUri: 'http://localhost:3008/',
  },
  cache: {
    secureCookies: true,
  }
};

//csl({ msalConfig });

const msalInstance = new msal.PublicClientApplication(msalConfig);
const clientId = msalConfig.auth.clientId;
msalInstance.addEventCallback(event => {
  try {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
      console.log('Autenticador >> ', event.payload.account);
      msalInstance.setActiveAccount(event.payload.account);
    }
  } catch (error) {
    console.error("Something wrong in msalInstance.addEventCallback - ", error);
  }
});


export { msalInstance, clientId };