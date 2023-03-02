//import { CircularProgress, SxProps } from '@mui/material';
import { SxProps } from '@mui/material';

//#region icons
import DownloadIcon from '@mui/icons-material/Download';
import DownloadindIcon from '@mui/icons-material/Downloading';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RedoIcon from '@mui/icons-material/Redo';
import ClearIcon from '@mui/icons-material/Clear';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
// import ThumbUp from '@mui/icons-material/ThumbUp';
// import ThumbUpOutlined from '@mui/icons-material/ThumbUpOutlined';
// import ThumbDown from '@mui/icons-material/ThumbDown';
// import ThumbDownOutlined from '@mui/icons-material/ThumbDownOutlined';
// import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
// import CheckCircle from '@mui/icons-material/CheckCircle';
// import SaveIcon from '@mui/icons-material/Save';
// import CancelIcon from '@mui/icons-material/Cancel';
//#endregion

import { IGenericObject } from '../libCommon/types';
import { AutocompleteMy, Btn, IconButtonMy, SelectMy, SelOption, ThemeColors } from '../components';
import { dbgError } from '../libCommon/dbg';
import { isAmbDev } from '../libCommon/isAmb';

import { globals } from '../libClient/clientGlobals';
import { ForeColorByBack, ThemePlus } from '../styles/themeTools';

import { RevisaoValor, RevisaoValorMd } from './types';
import { mesesHdr } from './util';

export type IconsAllowed = 'create' | 'edit' | 'delete' | 'search' | 'download' | 'downloading' | 'expand' | 'colapse' | 'redo' | 'clear' | 'restoreDelete';
//export const IconComponent = (icon: IconsAllowed) => { return IconComp(icon); };

const IconComp = (icon: IconsAllowed) => {
  if (icon == 'create') return AddCircleOutlineOutlinedIcon;
  else if (icon == 'edit') return EditIcon;
  else if (icon == 'delete') return DeleteIcon;
  else if (icon == 'restoreDelete') return RestoreFromTrashIcon;
  else if (icon == 'download') return DownloadIcon;
  else if (icon == 'downloading') return DownloadindIcon;
  else if (icon == 'expand') return ExpandMoreIcon;
  else if (icon == 'colapse') return ExpandLessIcon;
  else if (icon == 'redo') return RedoIcon;
  else if (icon == 'clear') return ClearIcon;
  // else if (icon == 'like') return ThumbUp;
  // else if (icon == 'likeOut') return ThumbUpOutlined;
  // else if (icon == 'dislike') return ThumbDown;
  // else if (icon == 'dislikeOut') return ThumbDownOutlined;
  // else if (icon == 'checkCircle') return CheckCircle;
  // else if (icon == 'checkCircleOut') return CheckCircleOutline;
  // else if (icon == 'save') return SaveIcon;
  // else if (icon == 'cancel') return CancelIcon;
  else if (icon == 'search') return SearchIcon;
  else
    throw new Error(`Icon ${icon} não previsto`);
};

interface IconAppProps {
  icon: IconsAllowed;
  fontSize?: number | string;
  color?: ThemeColors;
  colorSx?: string;
}
export const IconApp = ({ icon, fontSize, color, colorSx }: IconAppProps) => {
  const Comp = IconComp(icon);
  const propsForward: IGenericObject = {};
  const sx: SxProps = { fontSize };
  if (color != null) {
    // if (isThemeColor(color))
    propsForward.color = color;
    // else
    //   sx.color = ColorSpecial(color as SpecialColors);
  }
  else if (colorSx != null)
    sx.color = colorSx;
  return (<Comp sx={sx} {...propsForward} />);
};

// function IconCrud({ icon }: IconCrudProps) {
//   return (<IconApp icon={icon} color='primary' fontSize='1rem' />);
// }

interface IconButtonAppCrudProps {
  icon: IconsAllowed;
  title?: string;
  fontSize?: number | string;
  color?: ThemeColors;
  colorSx?: string;
  onClick: () => void;
  disabled?: boolean;
}
/**
 * Icons associados a registros determinados (alguma ação NO registro)
 */
export const IconButtonAppCrud = ({ icon, fontSize, color, colorSx, onClick, disabled }: IconButtonAppCrudProps) => {
  const fontSizeUse = fontSize || '1rem';
  return (
    // <Tooltip title={'title'} placement='top' onClose={() => csd('close')}>
    <IconButtonMy padding={0} onClick={onClick} disabled={disabled}>
      <IconApp icon={icon} color={color} colorSx={colorSx} fontSize={fontSizeUse} />
    </IconButtonMy>
    // </Tooltip>
  );
};

export const IconButtonAppSearch = () => {
  return (
    <IconButtonMy submit>
      <IconApp icon='search' color='primary' fontSize='2rem' />
    </IconButtonMy>
  );
};

interface IconButtonDownloadProps {
  onClick: () => void;
  downloadInProgress: boolean;
}
export const IconButtonAppDownload = ({ onClick, downloadInProgress }: IconButtonDownloadProps) => {
  // rever animação
  return (
    <>
      {/* {downloadInProgress
        ? <IconButtonMy disabled>
          <IconApp icon='download' color='primary' fontSize='2rem' />
          <CircularProgress
            size='1rem'
            sx={{
              color: 'blue', position: 'absolute',
              top: '30%', left: '35%', zIndex: 1,
            }}
          />
        </IconButtonMy>
        : <IconButtonMy onClick={onClick}>
          <IconApp icon='download' color='primary' fontSize='2rem' />
        </IconButtonMy>
      } */}
      {downloadInProgress
        ? <IconButtonMy disabled>
          <IconApp icon='downloading' color='primary' fontSize='2rem' />
        </IconButtonMy>
        : <IconButtonMy onClick={onClick}>
          <IconApp icon='download' color='primary' fontSize='2rem' />
        </IconButtonMy>
      }
    </>
  );
};

interface BtnCrudProps {
  action: 'insert' | 'update' | 'delete';
  onClick?: () => void; // apenas para delete, pois insert e update será usado 'submit' para a validação dos campos
}
export const BtnCrud = ({ action, onClick }: BtnCrudProps) => {
  const buttonText = {
    insert: 'Incluir',
    update: 'Alterar',
    delete: 'Excluir',
  }[action];
  const props: any = {};
  props.color = action == 'delete' ? 'error' : 'primary';
  if (onClick == null) props.submit = true;
  else props.onClick = onClick;
  return (
    <Btn {...props}>{buttonText}</Btn>
  );
};

const propsByBgcolor = (bgcolor: string) => {
  const color = ForeColorByBack(bgcolor);
  return { color, bgcolor };
};
export const propsColorByTotLevel = (themePlus: ThemePlus, level: number) => {
  const bgColorsHier = themePlus.themePlusConfig?.colorsBackHier || [];
  const bgColorDefault = '#ffffff';
  if (level == 0) {
    dbgError('propsColorByTotLevel com level 0!');
    return propsByBgcolor(bgColorDefault);
  }
  if (level > (bgColorsHier.length - 1)) {
    //dbgError(`propsColorByTotLevel com level ${level} (nr de levels ${bgColorsHier.length})!`);
    return propsByBgcolor(bgColorDefault);
  }
  return propsByBgcolor(bgColorsHier[level]);
};
export const propsColorByCompRealPlan = (themePlus: ThemePlus, varAbs: number) => {
  const bgColorRealMaior = '#ffe5e5'; //#!!!!!!!!
  const bgColorRealMenor = '#e5f2e5';
  if (varAbs > 0) return { bgcolor: bgColorRealMaior };
  else if (varAbs < 0) return { bgcolor: bgColorRealMenor };
  else return {};
};

export const propsColorHeader = (themePlus: ThemePlus) => {
  const bgColorsHier = themePlus.themePlusConfig?.colorsBackHier || [];
  if (bgColorsHier.length == 0) return propsByBgcolor('#ffffff');
  else return propsByBgcolor(bgColorsHier[0]);
};

interface ISelRevisao {
  value: RevisaoValor,
  onChange: ((newValue: RevisaoValor) => void),
}
export const SelRevisao = ({ value, onChange }: ISelRevisao) => {
  const revisaoOptions = [
    new SelOption<RevisaoValor>(null, RevisaoValorMd.Name, true),
    ...RevisaoValorMd.all.map((x) => new SelOption(x.cod, x.descr)),
  ];
  return (
    <AutocompleteMy width='150px'
      value={revisaoOptions.find((x) => x.cod === value)}
      onChange={(ev, newValue: SelOption<RevisaoValor>) => onChange(newValue?.cod || null)}
      getOptionLabel={(option: SelOption<RevisaoValor>) => option.show()}
      isOptionEqualToValue={(option: SelOption<RevisaoValor>, value: SelOption<RevisaoValor>) => option.cod === value.cod}
      placeholder={RevisaoValorMd.Name}
      options={revisaoOptions}
      getOptionDisabled={(option: SelOption<RevisaoValor>) => option.disabled}
      disableClearable
    />
  );
};

interface ISelAno {
  value: string;
  onChange: ((newValue: string) => void);
  options: SelOption<string>[];
}
export const SelAno = ({ value, onChange, options }: ISelAno) => {
  return (
    <SelectMy width='70px'
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
      displayEmpty
      placeHolder='Ano'
      options={[new SelOption('Ano', 'Ano', true), ...options]}
    />
  );
};

interface ISelMes {
  value: number;
  onChange: ((newValue: number) => void);
}
export const SelMes = ({ value, onChange }: ISelMes) => {
  const options = mesesHdr.map((x, index) => new SelOption<number>(index + 1, x));
  return (
    <SelectMy width='60px'
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
      displayEmpty
      placeHolder='Mês'
      options={[new SelOption<number>(0, 'Mês', true), ...options]}
    />
  );
};

interface ISelEntity {
  value: string | string[];
  onChange: ((newValue: string | string[]) => void)
  options: SelOption<string>[];
  disableClearable?: boolean;
  name: string;
  width?: string;
  withCod?: boolean,
  multiple?: boolean,
  limitTags?: number;
}
export const SelEntity = ({ value, onChange, options, disableClearable, name, width, withCod, multiple, limitTags }: ISelEntity) => {
  const optionsUse = [new SelOption<string>('', name, true), ...options];
  let props, valueUse;
  if (multiple) {
    props = { onChange: (ev, newValue: SelOption[]) => onChange(newValue.map((x) => x.cod)), multiple, limitTags, placeholder: value.length > 0 ? undefined : name };
    valueUse = optionsUse.filter((x) => value.includes(x.cod));
  }
  else {
    props = { onChange: (ev, newValue: SelOption) => onChange(newValue?.cod || null), placeholder: name };
    valueUse = optionsUse.find((x) => x.cod === value);
  }
  // @!!!!!!! implementar checkBox
  // não permitir o wrap
  return (
    <AutocompleteMy width={width || '350px'}
      value={valueUse}
      {...props}
      getOptionLabel={(option: SelOption) => option.show(withCod)}
      isOptionEqualToValue={(option: SelOption, value: SelOption) => option.cod === value.cod}
      options={optionsUse}
      getOptionDisabled={(option: SelOption) => option.disabled}
      disableClearable={disableClearable}
    />
  );
};

export const devFeature = () => {
  return isAmbDev() ||
    globals?.loggedUserIsDev === true;
};
