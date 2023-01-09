import * as msal from '@azure/msal-browser';
import { csd } from './libCommon/dbg';
import { EnvDeployConfig, EnvMSalConfig } from './libCommon/envs';

const msalConfig = {
  auth: {
    clientId: EnvMSalConfig().client_id,
    authority: EnvMSalConfig().authority,
    redirectUri: `${EnvDeployConfig().app_url}`,
    scopes: ['user.read', 'email', 'offline_access']
    //redirectUri: `${EnvDeployConfig().app_url}/cydag`, // /cydag
    //redirectUri: 'http://localhost:3008/',
  }
};

//csl({ msalConfig });

const msalInstance = new msal.PublicClientApplication(msalConfig);
const clientId = msalConfig.auth.clientId;

export { msalInstance, clientId };