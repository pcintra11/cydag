import { configApp } from "../app_hub/appConfig";

export const cookiesSys = { // todas apps usam, podendo ser restrito o nome para cada app se for conveniente (ex: themeVariant)
  betterAuth: `${configApp.appCode}_better-auth` as const,
  themeVariants: `${configApp.appCode}_themeVariants` as const,
  ctrlLog: `${configApp.appCode}_ctrlLog` as const,
  browserId: `${configApp.appCode}_browserId` as const,
  cookieDevContext: `${configApp.appCode}_cookieDevContext` as const,
  loggedUser: `${configApp.appCode}_loggedUser` as const,
  //canChangeThemeCookieStr: 'canChangeThemeStr' as 'canChangeThemeStr',
};