import { ClasseCustoRestrita } from '../../../../appCydag/modelTypes';

enum CmdApi_ClasseCustoRestrita {
  list = 'list',
  insert = 'insert',
  update = 'update',
  delete = 'delete',
}
export {
  CmdApi_ClasseCustoRestrita,  
  CmdApi_ClasseCustoRestrita as CmdApi_Crud,
  ClasseCustoRestrita as Entity_Crud,
};