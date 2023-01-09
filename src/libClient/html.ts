//import DOMPurify from 'dompurify'; // @!
export const HtmlLineBreak = (source: string) => {
  //const safeHtml = DOMPurify.sanitize(source.replaceAll('\n', '<br/>'));  
  if (source == null)
    return '';
  else if (typeof source == 'string')
    //return source.replaceAll('\n', '<br/>'); // não está disponivel no nodeJS, apenas no ECMA 2021 !!!
    return source.replace(/\n/g, '<br/>');
  else
    return typeof source;
}