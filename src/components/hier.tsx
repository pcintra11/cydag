export class HierNode<T>{
  nodeType: string;
  id: string;
  idPai: string;
  group: boolean; // se esse é um nivel pai com filhos (redundância apenas para melhora de performance)
  sortKey: string;
  nodeContent: T;
  stateForceRefreshTot?: any; // se algum filho mudar força o refresh do pai (totais?)
  stateOpen?: boolean; // abertura dos itens subordinados // #!!!!!! controlar por classes !
  nodesFilho: HierNode<T>[];
  nodesFilhoLoad: boolean;
  constructor(nodeType: string, keys: any[] | null, nodeTypePai: string | null, keysPai: any[] | null, group: boolean, sortKey: string, nodeContent: T, stateOpen = false) {
    this.nodeType = nodeType;
    // this.key = Array.isArray(key) ? key.join('-') : key;
    if (nodeType == null) throw new Error('nodeType null');
    //if (keys == null) throw new Error('keys null'); //#!!!! aceita sim!!
    this.id = HierNode.nodeId(nodeType, keys);
    this.idPai = nodeTypePai != null ? HierNode.nodeId(nodeTypePai, keysPai) : null;
    this.group = group;
    this.sortKey = sortKey;
    this.nodeContent = nodeContent;
    this.stateOpen = stateOpen;
    this.nodesFilho = [];
    this.nodesFilhoLoad = false;
  }
  static nodeId(nodeType?: string, keys?: any[]) {
    let result = '';
    if (nodeType != null)
      result += nodeType;
    if (keys != null)
      result += '_' + keys.map((key) => key.toString()).join('-');
    return result;
  }
}