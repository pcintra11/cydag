import { CmdApi_ControlledAccess, ControlledAccessStatus } from '../pages/api/app_base/controlledAccess/types';

import { CallApiCliASync } from '../fetcher/fetcherCli';

import { apisBase } from './endPoints';

export const ControlledAccessCheck = async () => {
  const apiReturn = await CallApiCliASync<{ value: { controlledAccessStatus: string, message: string } }>(apisBase.controlledAccess.apiPath,
    { cmd: CmdApi_ControlledAccess.controlledAccessCheckAllowed });
  return {
    controlledAccessStatus: apiReturn.value.controlledAccessStatus as ControlledAccessStatus,
    message: apiReturn.value.message,
  };
};
export const ControlledAccessClaim = async (info: string) => {
  const apiReturn = await CallApiCliASync<{ value: { controlledAccessStatus: string } }>(apisBase.controlledAccess.apiPath,
    { cmd: CmdApi_ControlledAccess.controlledAccessClaimAccess, info });
  return {
    controlledAccessStatus: apiReturn.value.controlledAccessStatus as ControlledAccessStatus,
  };
};