export const CookiesInResponse = async (setCookieHeaders: string[]) => {
  return setCookieHeaders.map((cookieString) => {
    const comps1: string[] = cookieString.split('=');
    const name = comps1[0];
    const comps2: string[] = comps1[1].split(';');
    const value = comps2[0];
    return { name, value };
  });
}