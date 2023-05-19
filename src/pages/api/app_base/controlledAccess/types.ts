enum CmdApi {
  //get = 'get',
  controlledAccessCheckAllowed = 'controlledAccessCheckAllowed',
  controlledAccessClaimAccess = 'controlledAccessClaimAccess',
  controlledAccessList = 'controlledAccessList',
  controlledAccessAllow = 'controlledAccessAllow',
  controlledAccessDeny = 'controlledAccessDeny',
  controlledAccessDelete = 'controlledAccessDelete',
}
export {
  CmdApi as CmdApi_ControlledAccess,
};

export enum ControlledAccessStatus {
  checking = 'checking',
  allowed = 'allowed',
  notAllowed = 'notAllowed',
  waiting = 'waiting',
  asked = 'asked',
}