import FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import { mimeTypes } from '../libCommon/util';

interface ISaveAsXlsx { sheetName: string, data: any[] }
export const SaveAsXlsx = (fileName: string, sheets: ISaveAsXlsx[]) => {
  // https://dev.to/jasurkurbanov/how-to-export-data-to-excel-from-api-using-react-25go
  const mimeType = mimeTypes.msExcel.type;
  const fileExt = mimeTypes.msExcel.ext.xlsx;

  //const ws = XLSX.utils.json_to_sheet(apiData);
  const wb: XLSX.WorkBook = { SheetNames: [], Sheets: {} }; // SheetNames: ["data"], Sheets: { data: ws }  };
  sheets.forEach((x) => { wb.SheetNames.push(x.sheetName); wb.Sheets[x.sheetName] = XLSX.utils.json_to_sheet(x.data); });

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: mimeType });
  FileSaver.saveAs(blob, fileName + '.' + fileExt);
};

export const SaveAsCsv = (fileName: string, data: any[], csvDelimiter = ';') => { // evitar, usar SaveAsXlsx para resolver problemas com acentos
  const mimeType = mimeTypes.csv.type;
  const fileExt = mimeTypes.csv.ext.csv;
  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data), { FS: csvDelimiter });
  const blob = new Blob([csv], { type: mimeType });
  FileSaver.saveAs(blob, fileName + '.' + fileExt, { autoBom: true });
};