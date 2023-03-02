import { DropzoneState } from 'react-dropzone';

import { csd, dbgError } from './dbg';
import { IGenericObject } from './types';

export enum UploadStatus {
  none,
  loading,
  reseting,
  done,
  error,
}

export const UploadErrorCodeCustom = 'custom-error';
export const UploadFriendlyError = (error) => {
  if (error.code == UploadErrorCodeCustom) return error.message;
  // erros standard (as msgs são em inglês)
  if (error.code == 'file-invalid-type') return 'Tipo inválido';
  if (error.code == 'file-too-large') return 'Tamanho do arquivo acima do permitido';
  if (error.code == 'too-many-files') return 'Número de arquivos acima do limite';
  return `${error.code} - ${error.message}`;
};

interface IUploadNameValidatorConfig { prefix?: string, suffix?: string }
export function UploadFileNameValidator(file, config: IUploadNameValidatorConfig) {
  if (file instanceof File) {
    if (config.prefix != null &&
      !file.name.startsWith(config.prefix)) {
      return {
        code: UploadErrorCodeCustom,
        message: `Nome do aquivo (${file.name}) deve ter '${config.prefix}' no início`,
      };
    }
    if (config.suffix != null &&
      !file.name.endsWith(config.suffix)) {
      return {
        code: UploadErrorCodeCustom,
        message: `Nome do aquivo (${file.name}) deve ter '${config.suffix}' no final`,
      };
    }
  }
  return null;
}

export const UploadStateClear = (dropZone: DropzoneState) => {
  //export const UploadStateClear = (acceptedFiles: File[], fileRejections: FileRejection[], inputRef: React.RefObject<HTMLInputElement>) => {
  //csl('removeAll...', acceptedFiles.length);
  dropZone.acceptedFiles.length = 0;
  dropZone.acceptedFiles.splice(0, dropZone.acceptedFiles.length);
  dropZone.fileRejections.length = 0;
  dropZone.fileRejections.splice(0, dropZone.acceptedFiles.length);
  dropZone.inputRef.current.value = '';
  //csl(acceptedFiles);
};

export enum MessageLevelUpload {
  ok,
  warn,
  error,
}
export interface IUploadMessage { level: MessageLevelUpload, message: string }

// /**
//  * Normaliza o objeto informado considerando a atualização via csv:
//  * - brancos e nulos -> undefined (deve ser removido no chamador para NÂO vai atualizar o campo no db)
//  * - '(vazio)' -> null (DEVE atualizar o campo no db com null)
//  * @param object
//  * @param strResetProp String que indicada que o campo deve ser resetado (atualizado com null) (ex: '(vazio)')
//  * @returns
//  */
// export const NormalizeLineCsvUpd = (object: any, strResetProp: string) => {
//   Object.keys(object).forEach((prop) => {
//     if (object[prop] == null ||
//       object[prop].trim() == '')
//       object[prop] = undefined; // serão removidas, é como se o campo nem tivesse sido mencionado
//     else if (object[prop] == strResetProp)
//       object[prop] = null;
//   });
// };

export class FldCsvDef {
  fld: string;
  suppressColumn?: boolean; // não exporta e nem aceita na importação
  mandatoryValue?: boolean; // valor obrigatório (diferente de branco)
  fldDisp?: string; // header da coluna no CSV
  down?: (entity: IGenericObject) => string;
  up?: (entity: IGenericObject) => any;
  def?: (entity: IGenericObject) => any;
  constructor(fld: string, options?: { suppressColumn?: boolean, mandatoryValue?: boolean, fldDisp?: string, down?: (entity: IGenericObject) => string, up?: (entity: IGenericObject) => any, def?: (entity: IGenericObject) => any }) {
    this.fld = fld;
    this.fldDisp = options?.fldDisp || fld;
    this.suppressColumn = options?.suppressColumn || false;
    this.mandatoryValue = options?.mandatoryValue || false;
    this.down = options?.down;
    this.up = options?.up;
    this.def = options?.def;
  }
}
/**
 * Gera fldsCsvDef para todos os campos como o default para o campo ou fldsCsvCustom se houver
 * @param entityStructure 
 * @param fldsCsvCustom 
 * @returns 
 */
export const FldsCsvAll = (entityStructure: IGenericObject, fldsCsvCustom: FldCsvDef[] = []) => {
  const result: FldCsvDef[] = [];
  const fldsEntity = Object.keys(entityStructure);
  fldsEntity.forEach((fld) => {
    const fldCustom = fldsCsvCustom.find((fldCustom) => fldCustom.fld == fld);
    if (fldCustom == null)
      result.push(new FldCsvDef(fld));
    else
      result.push(fldCustom);
  });
  fldsCsvCustom.forEach((x) => {
    if (!fldsEntity.includes(x.fld))
      dbgError(`prop ${x.fld} inexistente na entidade`);
  });
  return result;
};

export const ToCsvDownload = (data: IGenericObject, fldsCsvDef: FldCsvDef[]) => {
  try {
    return fldsCsvDef.reduce((prev, curr) => {
      if (curr.suppressColumn) return prev;
      if (data[curr.fld] == null) return { ...prev, [curr.fldDisp]: '' };
      if (curr.down == null) return { ...prev, [curr.fldDisp]: data[curr.fld] };
      else return { ...prev, [curr.fldDisp]: curr.down(data) };
    }, {} as any);
  } catch (error) {
    dbgError('Erro em ToCsvDownload', error.message, data);
    return null;
  }
};

export const FromCsvUpload = (data: IGenericObject, fldsCsvDef: FldCsvDef[], csvStrForNull: string) => {
  const documentCsvDb: IGenericObject = {};
  const allErrorsMessages: string[] = [];
  const dataTrim: IGenericObject = {};
  Object.keys(data).forEach((prop) => dataTrim[prop] = data[prop].trim());
  fldsCsvDef.forEach((curr) => {
    const cellValue = dataTrim[curr.fldDisp] != undefined ? dataTrim[curr.fldDisp] : undefined;
    if (curr.suppressColumn == false) {
      if (cellValue !== undefined &&
        cellValue != '') {
        if (cellValue == csvStrForNull)
          documentCsvDb[curr.fld] = null;
        else {
          try {
            if (curr.up == null) documentCsvDb[curr.fld] = cellValue;
            else documentCsvDb[curr.fld] = curr.up(dataTrim);
          }
          catch (error) { allErrorsMessages.push(`coluna ${curr.fldDisp}: ${error.message}`); }
        }
      }
      else if (curr.def != null) {
        try {
          documentCsvDb[curr.fld] = curr.def(dataTrim);
        }
        catch (error) { allErrorsMessages.push(`coluna ${curr.fldDisp} (default): ${error.message}`); }
      }
      else if (curr.mandatoryValue)
        allErrorsMessages.push(`coluna ${curr.fldDisp}: informação obrigatória`);
    }
    else {
      if (curr.def != null) { // dados derivados de outras colunas
        try { documentCsvDb[curr.fld] = curr.def(dataTrim); }
        catch (error) { allErrorsMessages.push(`coluna autogerada ${curr.fldDisp}: ${error.message}`); }
      }
    }
  });
  return { documentCsvDb, allErrorsMessages };
};