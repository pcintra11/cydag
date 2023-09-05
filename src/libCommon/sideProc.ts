export function OnClient() {
  // if (typeof window !== 'undefined') return true;
  if (typeof window === 'object') return true; // evitar esse método @!!!!!
  else return false;
}
export function OnServer() {
  return !OnClient();
}

export function AssertIsServer(caller: string = null, data?: any) {
  if (!OnServer())
    // eslint-disable-next-line no-console
    console.log(`${caller} in client!`, data);
}
export function AssertIsClient(caller: string = null, data?: any) {
  if (!OnClient())
    // eslint-disable-next-line no-console
    console.log(`${caller} in server!`, data);
}