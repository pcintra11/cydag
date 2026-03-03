import { Db, MongoClient } from 'mongodb';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';

import { EnvDeployConfig, EnvSvr, isAmbDev } from '../app_base/envs';
import { UriDb } from '../libServer/dbMongo';
import { SendPasswordResetHub } from '../app_hub/betterAuthSendResetPassword';

//#region variáveis
const databaseUri = UriDb(); // process.env.SITE_DATABASE_APP!;
const databaseName = databaseUri.split('//')[1].split('/')[1].split('?')[0];
const betterAuthMongoClient = new Db(new MongoClient(databaseUri), databaseName); // DbOptions

const resetPasswordTokenExpiresInSeconds = 2 * 60 * 60;

const cookieNamePrefixHttps = isAmbDev() ? '' : '__Secure-';

export const cookieBetterAuthSession = {
  data: `${cookieNamePrefixHttps}better-auth.session_data`,
  token: `${cookieNamePrefixHttps}better-auth.session_token`,
}

const betterAuthModelName = {
  user: 'sys_better_auth_users',
  account: 'sys_better_auth_accounts',
  verification: 'sys_better_auth_verifications',
  session: 'sys_better_auth_sessions',
  rateLimit: 'sys_better_auth_rate_limits'
}

export const betterAuthExpiresInSeconds = 400 * 24 * 60 * 60;
//#endregion

// https://www.better-auth.com/docs/reference/options
export const auth = betterAuth({
  appName: "Cydag",
  secret: EnvSvr('betterAuthSecret'),
  baseURL: EnvDeployConfig().app_url,

  database: mongodbAdapter(betterAuthMongoClient),
  user: { modelName: betterAuthModelName.user },
  account: { modelName: betterAuthModelName.account },
  verification: { modelName: betterAuthModelName.verification },

  session: {
    modelName: betterAuthModelName.session,
    expiresIn: betterAuthExpiresInSeconds,
    updateAge: 60 * 60 * 24, // a cada  dia a expiração da sessão será novamente 'esticada'
    cookieCache: {
      enabled: true, // habilita o cookie 'better-auth.session_cache'
      maxAge: 1 * 60 * 60,
      strategy: "compact", // or "jwt" or "jwe"
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: !isAmbDev(),
      httpOnly: true,
      path: "/",
    },
  },
  rateLimit: {
    modelName: betterAuthModelName.rateLimit,
  },

  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false, // eu já faço isso
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      // console.log('sendResetPassword', { user, url, token });
      await SendPasswordResetHub(user.email, url, token, resetPasswordTokenExpiresInSeconds);
    },
    onPasswordReset: async ({ user }, request) => {
      //console.log(`Password for user ${user.email} has been reset.`);
    },
    resetPasswordTokenExpiresIn: resetPasswordTokenExpiresInSeconds,
  },  

  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
    },
  },

  // logger: {
  //   level: "debug",
  //   log: (level, message, ...args) => console.log('betterAuth logger', { level, message, metadata: args, timestamp: new Date().toISOString() }),
  // },

  onAPIError: {
    throw: true,
    onError: (error, ctx) => {
      console.error("Auth error:", error);
    },
    errorURL: "/auth/error",
    customizeDefaultErrorPage: {
      colors: {
        background: "#ffffff",
        foreground: "#000000",
        primary: "#0070f3",
        primaryForeground: "#ffffff",
        mutedForeground: "#666666",
        border: "#e0e0e0",
        destructive: "#ef4444",
        titleBorder: "#0070f3",
        titleColor: "#000000",
        gridColor: "#f0f0f0",
        cardBackground: "#ffffff",
        cornerBorder: "#0070f3"
      },
      size: {
        radiusSm: "0.25rem",
        radiusMd: "0.5rem",
        radiusLg: "1rem",
        textSm: "0.875rem",
        text2xl: "1.5rem",
        text4xl: "2.25rem",
        text6xl: "3.75rem"
      },
      font: {
        defaultFamily: "system-ui, sans-serif",
        monoFamily: "monospace"
      },
      disableTitleBorder: false,
      disableCornerDecorations: false,
      disableBackgroundGrid: false
    }
  },
});

// // O expires (ou maxAge) do cookie deve ser idêntico ao campo expiresAt da sessão criada no MongoDB.@!!!!!!!!!!!!27
// export async function BetterAuthDeleteUser(email: string) {
//   const userBetterAuth = await betterAuthMongoClient.collection(betterAuthModelName.user).findOne({ email });
//   if (userBetterAuth != null) {
//     //cl('deletando betterAuth user', email);
//     await betterAuthMongoClient.collection(betterAuthModelName.user).deleteOne({ _id: userBetterAuth._id });
//     await betterAuthMongoClient.collection(betterAuthModelName.session).deleteMany({ userId: userBetterAuth._id });
//     await betterAuthMongoClient.collection(betterAuthModelName.account).deleteMany({ userId: userBetterAuth._id });
//     //await betterAuthMongoClient.collection(betterAuthModelName.user_profiles).deleteOne({ userId: userBetterAuth._id });
//   }
// }

export async function BetterAuthUserExist(email: string) {
  const userBetterAuth = await betterAuthMongoClient.collection(betterAuthModelName.user).findOne({ email });
  return userBetterAuth != null;
}