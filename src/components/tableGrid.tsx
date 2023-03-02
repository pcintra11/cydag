import React from 'react';
import { Box, useTheme } from '@mui/material';

import { FriendlyErrorMsgApi } from '../libCommon/util';
import { IGenericObject } from '../libCommon/types';

import { AbortProcComponent, LogErrorUnmanaged } from './abortProc';
//import { Button, BtnLine, FakeLink, IconButton, VisualBlock, WaitingLine } from '../components';

//import { useMediaQuery } from 'react-responsive';
// const isDesktopOrLaptop = useMediaQuery({
//   query: '(min-width: 1224px)'
// })
// const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
// const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' })
// const isPortrait = useMediaQuery({ query: '(orientation: portrait)' })
// csl({ isDesktopOrLaptop, isBigScreen, isTabletOrMobile, isPortrait });

interface ColGridConfigOptions {
  width?: string;
  align?: 'center' | 'right'; // reativar @!!!!!
}
export class ColGridConfig {
  hdr: React.ReactNode;
  content: (dataRow: IGenericObject) => React.ReactNode; //@@!!!!!!! IGenericObject -> RowGrid
  //width: string;
  options?: ColGridConfigOptions;
  // { width: 'auto' } default
  // { width: 'minmax(auto,2rem)' }
  // { width: '1fr' , align: 'right' }
  // { width: 'minmax(3rem,8%)' }
  constructor(hdr: React.ReactNode, content: (dataRow: IGenericObject) => React.ReactNode, options?: ColGridConfigOptions) {
    this.hdr = hdr;
    this.content = content;
    this.options = options;
  }
}
class RowGrid {
  data: any;
  index: number;
  constructor(data: any, index: number) {
    this.data = data;
    this.index = index;
  }
}
// https://codepen.io/nchevobbe/pen/bYZEqq?editors=0110
// https://www.freecodecamp.org/news/https-medium-com-nakayama-shingo-creating-responsive-tables-with-pure-css-using-the-grid-layout-module-8e0ea8f03e83/
// https://codepen.io/ShingoNakayama/pen/LMLeRZ

// export function TableGridOld({ columnsConfig, dataRows: dataRows, preGrid, posGrid }: { columnsConfig: ColumnsConfig[], dataRows: Record<string, any>[], preGrid?: React.ReactNode, posGrid?: React.ReactNode }) {
//   const styleGridColumns: CSSProperties = {
//     display: 'grid', justifyItems: 'sta', alignItems: 'start', justifyContent: 'start', alignContent: 'start',
//     gridTemplateColumns: columnsConfig.reduce((acum, curr) => acum += `${curr.width} `, ''),
//   };
//   const themePlus = useTheme();
//   return (
//     <>
//       <div className={g_cn.distribVert}>

//         {preGrid &&
//           preGrid
//         }
//         <div>
//           <div style={{ ...styleGridColumns, zIndex: 1, backgroundColor: 'orange', height: '50px' }} role='rowheader' className='xxx-tableHeader'>
//             {columnsConfig.map((colGrid, colIndex) => <div key={colIndex} role='columnheader'>{typeof (colGrid.hdr) === 'string' ? colGrid.hdr : colGrid.hdr}</div>)}
//           </div>
//           <div role='grid' className={g_cn.gridBorder}>
//             {dataRows.map((rowGrid, rowIndex) =>
//               <div key={rowIndex} className={rowIndex % 2 === 0 ? '' : g_cn.destaq1} role='row'>
//                 <div style={{ ...styleGridColumns }} key={rowIndex}>
//                   {columnsConfig.map((colGrid, colIndex) =>
//                     <div key={colIndex} role='gridcell' className={g_cn.gridBorder}>{colGrid.content(rowGrid)}</div>
//                   )}
//                 </div >
//               </div >
//             )}
//           </div>
//         </div>

//         {posGrid &&
//           <div className='posgrid'>
//             {posGrid}
//           </div>
//         }
//       </div>
//       <style jsx>{`
//         [role=grid] {
//           border-top-style: none;
//         }
//         [role=rowheader] {
//           position: sticky;
//           top: 0;
//         }
//         [role=columnheader], [role=gridcell] {
//           XXheight: 2rem;
//           overflow: hidden;
//           white-space: nowrap;
//           text-overflow: ellipsis;
//           &:XXXhover {
//             overflow: visible; 
//             white-space: normal;
//             height:auto;
//           }          
//         }
//         [role=columnheader] {
//           padding: 5px;
//           border-bottom: 1px solid ${theme.themeDeriv.borderHeavyColor};
//         }
//         [role=row] {
//           &:hover {
//             background-color: ${theme.themeDeriv.destaque2.backColor};
//           }
//         }
//         [role=gridcell] {
//           padding: 2px 5px;
//         }
//         .posgrid {
//           background-color: ${theme.palette.background.default};
//           position: sticky;
//           bottom: 0;
//         }
//       `}</style>
//     </>
//   );
// }

export class ExtraLinesGridConfig {
  condition: (rowGrid: RowGrid) => boolean;
  content: (rowGrid: RowGrid) => React.ReactNode;
  constructor(condition: (rowGrid: RowGrid) => boolean, content: (rowGrid: RowGrid) => React.ReactNode) {
    this.condition = condition;
    this.content = content;
  }
}

interface ITableGridProps {
  colsGridConfig: ColGridConfig[],
  extraLinesGridConfig?: ExtraLinesGridConfig[],
  dataRows: IGenericObject[],
  preGrid?: React.ReactNode,
  posGrid?: React.ReactNode
  //alternColor?: boolean;
}
export function TableGrid({ colsGridConfig, extraLinesGridConfig, dataRows, preGrid, posGrid }: ITableGridProps) {
  const themePlus = useTheme();

  // const stTableGridColumnBase: CSSProperties = {
  //   display: 'flex',
  //   flexDirection: 'row',
  //   alignItems: 'start',  /* eixo cruzado era flex-direction (alinhamento na vertical) */
  //   flexWrap: 'wrap',
  //   //gap: '0.3rem',
  //   //justifyContent: 'center', /* filhos no proprio eixo */
  // }; 
  // const g_st2 = {
  //   containerVerticalScrollableStyle: {
  //     maxHeight: '100%',
  //     overflowY: 'auto',
  //   } as CSSProperties,
  //   containerVerticalfullStyle: {
  //     display: 'grid',
  //     height: '100%',
  //     alignItems: 'start',
  //     alignContent: 'start',
  //     gap: '1rem',
  //     overflowY: 'auto',
  //     //gridTemplateRows: 'auto 1fr auto',  deve ser complementado !!!!
  //   } as CSSProperties,
  //   tableGridColumnIcons: {
  //     ...stTableGridColumnBase,
  //     justifyContent: 'center',
  //     columnGap: '0.3rem',
  //   } as CSSProperties,
  //   tableGridColumnAlignLeft: {
  //     ...stTableGridColumnBase,
  //     justifyContent: 'start',
  //     columnGap: '0.5rem',
  //   } as CSSProperties,
  //   tableGridColumnAlignRight: {
  //     ...stTableGridColumnBase,
  //     justifyContent: 'end',
  //     columnGap: '0.5rem',
  //   } as CSSProperties,
  //   tableGridColumnAlignCenter: {
  //     ...stTableGridColumnBase,
  //     justifyContent: 'center',
  //     columnGap: '0.5rem',
  //   } as CSSProperties,
  // };
  //#region funções
  // const styleByOptions = (options: ColGridConfigOptions) => {
  //   let style = null;
  //   if (options?.align == 'center')
  //     style = g_st2.tableGridColumnAlignCenter;
  //   else if (options?.align == 'right')
  //     style = g_st2.tableGridColumnAlignRight;
  //   return style;
  // };


  const TableHeader = () => {
    // .xxxg-tableHeader { //@!!!!!
    //   color: ${({ theme }: { theme: Theme }) => theme.palette.text.primary};
    //   background-color: ${({ theme }: { theme: Theme }) => theme.palette.background.default};
    // }
    // className={'header'}
    return (<>
      {colsGridConfig.map((colGridConfig, index) =>
        //<div key={index} className={'header'} style={styleByOptions(colGridConfig.options)}>{colGridConfig.hdr || '-'}</div>
        <div key={index} className={'header'}>{colGridConfig.hdr || '-'}</div>
      )
      }</>);
  };

  // const TableFooterInsidGrid = ({ children }: { children: ReactNode }) => {
  //   return (<>
  //     <div style={{ gridColumn: '1/-1' }}>
  //       {children}
  //     </div>
  //   </>);
  // };
  const Row = ({ rowGrid }: { rowGrid: RowGrid }) => {
    //csl({ rowGrid });
    const classFirst = (rowGrid.index == 0 ? ' firstRow' : '');
    const classAltern = ''; // (alternColor && rowGrid.index % 2 === 1 ? g_cn.destaq1 : '');
    try {
      return (<>
        {colsGridConfig.map((colGridConfig, index) =>
          //<div key={index} className={'cel' + classFirst + classAltern} style={styleByOptions(colGridConfig.options)}>{colGridConfig.content(rowGrid)}</div>
          <div key={index} className={'cel' + classFirst + classAltern} >{colGridConfig.content(rowGrid)}</div>
        )}
        {extraLinesGridConfig != null &&
          <>
            {extraLinesGridConfig.map((extraLineGridConfig, index) => {
              if (extraLineGridConfig.condition(rowGrid))
                return (<div key={index} className={'cel extraLine' + classAltern}>{extraLineGridConfig.content(rowGrid)}</div>);
              else
                return null;
            })}
          </>
        }
      </>);
    } catch (error) {
      LogErrorUnmanaged(error, 'TableGridRow-render');
      return (<>
        {colsGridConfig.map((_, index) =>
          <div key={index}>
            {index == 0
              ? <div>{FriendlyErrorMsgApi(error)}</div>
              : <div>*erro*</div>
            }
          </div>
        )}
      </>);
    }
  };
  //#endregion

  try {

    const gridTemplateColumns = colsGridConfig.reduce((acum, curr) => acum += `${curr.options?.width || 'auto'} `, '');

    return (
      <Box display='flex' flexDirection='column' gap={0.5} height='100%' overflow='hidden'>

        {preGrid != null &&
          preGrid
        }
        <Box flex={1} overflow='auto'>
          <Box display='flex' flexDirection='column' gap={0.5}>
            <div style={{
              display: 'grid',
              gridTemplateColumns,
              gridTemplateRows: 'auto',
              gridAutoRows: 'auto', gridAutoColumns: 'auto',
              justifyItems: 'stretch', alignItems: 'stretch',
              justifyContent: 'start', alignContent: 'start',
            }}>
              <TableHeader />
              {dataRows.map((dataRow, index) => <Row key={index} rowGrid={new RowGrid(dataRow, index)} />)}
              {/* {posGrid &&
                <TableFooter><Box mt={1}>{posGrid}</Box></TableFooter>
              } */}
            </div >
            {/* {posGrid && <Box className='posgrid'>{posGrid}</Box>} */}
            {posGrid &&
              <Box mt={1}>{posGrid}</Box>
            }
          </Box>
        </Box>
        <style jsx global>{`
        .header {
          padding: 3px 8px;
          align-self: end;
          XXbackground-color: green;
          background-color: ${themePlus.palette.background.default};
          position: sticky;
          top: 0;  
          z-index: 1;
        }
        .cel {
          border: 1px solid ${themePlus.themePlusDeriv.borderLightColor};
          padding: 3px 8px;
          overflow: hidden;
          xwhite-space: nowrap;
          text-overflow: ellipsis;         
          &.firstRow {
            border-top: 2px solid  ${themePlus.themePlusDeriv.borderHeavyColor};
          }
          &:hover {
            XXXbackground-color: ${themePlus.themePlusDeriv.destaque2.backColor};
          }
        }
        .extraLine {
          grid-column: 1 / span ${colsGridConfig.length};
          padding-bottom: 0.5rem;
        }

        .posgrid {
          background-color: ${themePlus.palette.background.default};
          XXposition: sticky;
          XXbottom: 0;
        }
      `}</style>
      </Box>
    );
  } catch (error) {
    LogErrorUnmanaged(error, 'TableGrid-render');
    return (<AbortProcComponent error={error} component='TableGrid' />);
  }
}

