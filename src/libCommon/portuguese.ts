/**
 * checa se é uma palavra não relevante para a língua (preposições, artigos, etc)
 * @param text 
 * @returns 
 */
function WordIsRelevant(text: string) {
  // https://www.portugues.com.br/gramatica/morfologia.html
  // artigos, preposições, etc
  const search = text.toLowerCase();
  const prepos = [
    'a', 'o', 'as', 'os', 'e',
    'da', 'do', 'das', 'dos', 'de',
    'em', 'num', 'numa',
    'na', 'no', 'nas', 'nos', 
    'para', 'pra', 'pro', 'pras', 'pros',  
  ];
  return prepos.findIndex((x) => x == search) === -1;
}
/**
 * Devolve o string passado sem nenhuma acentuação
 * @param text 
 */
function RemoveAccentuation(text: string) {
  let result = text;
  result = result.replace(new RegExp('[ÁÀÂÃ]', 'g'), 'A');
  result = result.replace(new RegExp('[ÉÈÊ]', 'g'), 'E');
  result = result.replace(new RegExp('[ÍÌÎ]', 'g'), 'I');
  result = result.replace(new RegExp('[ÓÒÔÕ]', 'g'), 'O');
  result = result.replace(new RegExp('[ÚÙÛÜ]', 'g'), 'U');
  result = result.replace(new RegExp('[Ç]', 'g'), 'C');
  // 
  result = result.replace(new RegExp('[áàâã]', 'g'), 'a');
  result = result.replace(new RegExp('[éèê]', 'g'), 'e');
  result = result.replace(new RegExp('[íìî]', 'g'), 'i');
  result = result.replace(new RegExp('[óòôõ]', 'g'), 'o');
  result = result.replace(new RegExp('[úùûü]', 'g'), 'u');
  result = result.replace(new RegExp('[ç]', 'g'), 'c');
  //csl('PortugueseRemoveAccentuation', { text, result });
  return result;
}

// function RemovePunctuation(text: string) {
//   let result = text;
//   result = result.replace(new RegExp('[\.\,\?\!\"\'\%\(\)\;]', 'g'), ' ');
//   return result;
// }

export const Portuguese = {
  WordIsRelevant,
  RemoveAccentuation,
};