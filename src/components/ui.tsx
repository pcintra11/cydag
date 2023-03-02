import React from 'react';

import Avatar_mui from '@mui/material/Avatar';
import AvatarGroup_mui from '@mui/material/AvatarGroup';
import Badge_mui, { BadgeProps as BadgeProps_mui } from '@mui/material/Badge';
import Button_mui from '@mui/material/Button';
import IconButton_mui from '@mui/material/IconButton';
import LinearProgress_mui from '@mui/material/LinearProgress';
import Autocomplete_mui from '@mui/material/Autocomplete';
import Select_mui from '@mui/material/Select';
import TextField_mui from '@mui/material/TextField';
import MenuItem_mui from '@mui/material/MenuItem';

import { styled } from '@mui/material/styles';
import { Alert, Box, Collapse, IconButton, Stack, SxProps, useTheme } from '@mui/material';
//import withStyles from '@mui/styles/withStyles';
import CloseIcon from '@mui/icons-material/Close';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch_mui from '@mui/material/Switch';

// sai todos _mui ?? @@!!!!!

import { IGenericObject } from '../libCommon/types';
import { csd } from '../libCommon/dbg';
import { InputVariantType } from '../styles/themeTools';

export type ThemeColors = 'primary' | 'secondary' | 'success' | 'error';
//type SpecialColors = 'like' | 'dislike';
// function isThemeColor(color: ThemeColors) { //  | SpecialColors
//   if (['primary', 'secondary', 'success', 'error'].findIndex((item) => item == color) >= 0)
//     return true;
//   else
//     return false;
// }
// function ColorSpecial(color: SpecialColors) {
//   if (color == 'like')
//     return 'blue';
//   else if (color == 'dislike')
//     return 'red'; // @@@!!
// }

export const fontSizeGrid = '10px';
export const fontSizeIconsInGrid = '14px';

interface ISxMakerProps {
  //categSizeXY?: number;
  sizeXY?: number | string;
  fontSize?: number | string; // @@@!! number é pixels??
  //color?: ThemeColors;
  //fontSizeFactor?: number;
}
export function sxMaker(props: ISxMakerProps) {
  const { sizeXY, ...propsForward } = props; //  fontSize, categFontSize, fontSizeFactor
  // const categsSize = {
  //   1: 24,
  //   2: 36,
  //   3: 56,
  // }

  const size = (size) => { // , categSize
    if (size != null)
      return size;
    // const categSizeUse = categSize == 'def' ? 2 : categSize;
    // if (categsSize[categSizeUse] == null)
    //   throw new Error(`sxMaker: categSize ${categSize} não previsto`);
    // return categsSize[categSizeUse];
  };

  const sx: IGenericObject = { ...propsForward }; // @@@!!!!! type 

  if (sizeXY != null) {
    // || categSizeXY != null
    const sizeUse = size(sizeXY);
    sx.width = sizeUse;
    sx.height = sizeUse;
    // if (fontSizeFactor != null)
    //   sx.fontSize = sizeUse * fontSizeFactor;
  }

  return sx;
}

// interface BoxProps {
//   children: React.ReactNode;
//   color?: 'error.main';
// }
// export function BoxMy(props: BoxProps) { //@!!!!!
//   const { children, ...propsForward } = props;
//   return (
//     <Box {...propsForward}>
//       {children}
//     </Box>
//   );
// }

// interface IButtonProps { // extends React.ButtonHTMLAttributes<HTMLButtonElement> {
//   children: React.ReactNode;
//   color?: ThemeColors;
//   onClick?: () => void; // @@@!! usar o type correto
//   disabled?: boolean;
//   submit?: boolean;

//   contained?: boolean;
//   outlined?: boolean;
//   text?: boolean;

//   small?: boolean;
//   medium?: boolean;
//   large?: boolean;
// }
// export function ButtonMy(props: IButtonProps) {
//   const { children, submit, contained, outlined, text, small, medium, large, disabled, ...propsForward } = props;

//   const propsPlus: IGenericObject = {}; //@!!!!!!

//   if (submit)
//     propsPlus.type = 'submit';
//   else
//     propsPlus.type = 'button';

//   if (contained)
//     propsPlus.variant = 'contained';
//   else if (outlined)
//     propsPlus.variant = 'outlined';
//   else if (text)
//     propsPlus.variant = 'text';
//   else
//     propsPlus.variant = 'contained';

//   if (small)
//     propsPlus.size = 'small';  // @@@ usar sx (system)
//   else if (medium)
//     propsPlus.size = 'medium';
//   else if (large)
//     propsPlus.size = 'large';

//   return (
//     <Button_mui disabled={disabled} {...propsForward} {...propsPlus}>
//       {children}
//     </Button_mui>
//   );
// }

interface IBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  submit?: boolean;
  color?: 'error' | 'primary';
  contained?: boolean;
  outlined?: boolean;
  text?: boolean;
  small?: boolean;
  medium?: boolean;
  large?: boolean;
  sx?: SxProps;
  executing?: boolean;
  //endIcon?: React.ReactNode;
}
export const Btn = ({ children, submit, contained, outlined, text, small, medium, large, executing, ...propsForward }: IBtnProps) => {
  const propsPlus: IGenericObject = {};
  if (submit)
    propsPlus.type = 'submit';
  else
    propsPlus.type = 'button';
  if (small)
    propsPlus.size = 'small';  // @@@ usar sx (system)
  else if (medium)
    propsPlus.size = 'medium';
  else if (large)
    propsPlus.size = 'large';
  if (executing)
    propsPlus.disabled = true;
  const themePlus = useTheme();

  if (contained)
    propsPlus.variant = 'contained';
  else if (outlined)
    propsPlus.variant = 'outlined';
  else if (text)
    propsPlus.variant = 'text';
  else
    propsPlus.variant = themePlus.themePlusConfig?.buttomVariant;

  return (
    <Button_mui {...propsForward} {...propsPlus}>{children}</Button_mui>
  );
};


interface IBadgeUiProps {
  content: string | number;
  max?: number;
  showZero?: boolean;
  vertical?: 'top' | 'bottom' | 'center';
  horizontal?: 'left' | 'right';
  contentSize: number;
  children: React.ReactNode;
}

export function BadgeMy({ content, max, showZero, vertical, horizontal, contentSize, children }: IBadgeUiProps) {
  // const config: any = {
  //   // boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  //   // "&::after": {
  //   //   position: "absolute",
  //   //   top: 0,
  //   //   left: 0,
  //   //   width: "100%",
  //   //   height: "100%",
  //   //   borderRadius: "50%",
  //   //   border: "1px solid currentColor",
  //   //   content: '""'
  //   // }
  //   // XXbackgroundColor: 'red',
  //   // right: 0,
  //   // top: 11,
  //   // padding: "0 3px",
  //   fontSize: 'xx-small',
  // };
  const themePlus = useTheme();

  let sizeXY = Math.trunc(contentSize * 0.45); // tamanho do badge 
  if (sizeXY < 12)
    sizeXY = Math.trunc(contentSize * 0.70);
  let margingExcedHoriz = Math.trunc(sizeXY * 0.60); // ele estoura a área original em aproximadamente 50%
  if (margingExcedHoriz < 10)
    margingExcedHoriz = 10; // quando é muito pequeno estágerando um 'padding' horizontal adicional !
  const fontSize = Math.trunc(sizeXY * 0.80);  // para caber e tb ter padding

  const sx: SxProps = { marginLeft: null }; // @@@!!

  let top = null;
  let verticalUse = null;
  if (vertical == 'center') {
    top = '50%';
    verticalUse = 'top';
  }
  else
    verticalUse = vertical || 'top';
  const horizontalUse = horizontal || 'right';

  if (horizontalUse == 'left')
    sx.paddingLeft = `${margingExcedHoriz}px`;
  else if (horizontalUse == 'right')
    sx.paddingRight = `${margingExcedHoriz}px`;
  //sx.width = `${sizeXY + margingExcedHoriz}px`; // mudou o position??!!
  //csl({ sizeXY, horizontalUse, verticalUse, sx });

  // const sizeBadge = sizeXY;
  // const StyledComp = styled(Badge_mui)<BadgeProps_mui>(({ theme }) => ({
  //   '& .MuiBadge-badge': {
  //     left: `-${Math.trunc(sizeBadge / 2)}`,
  //     fontSize: `${sizeBadge - 2}px`,
  //     top: sizeBadge,
  //     border: `2px solid ${theme.palette.background.paper}`, 
  //     padding: '2px 2px',
  //     width: sizeBadge, 
  //     height: sizeBadge,
  //   },
  // }));

  let border = null;
  if (sizeXY >= 20)
    border = `2px solid ${themePlus.palette.background.paper}`; //@@@!!! paper color?
  else if (sizeXY >= 10)
    border = `1px solid ${themePlus.palette.background.paper}`;

  const StyledBadge = styled(Badge_mui)<BadgeProps_mui>(() => ({ // { theme }
    '& .MuiBadge-badge': {
      //left: '-0%',
      fontSize,
      top,
      border,
      //border: sizeXY >= 10 ? `1px solid ${theme.palette.background.paper}` : null,
      padding: '0px',
      width: `${sizeXY}px`,
      height: `${sizeXY}px`,
    },
  }));

  // criar um criterio para tamanho que seja universal em todos os componentes @@@@!!!

  return (
    <Box sx={sx}>
      <StyledBadge
        color='primary'
        badgeContent={content}
        max={max}
        showZero={showZero}
        overlap='circular'
        anchorOrigin={{ vertical: verticalUse, horizontal: horizontalUse }}>
        {children}
      </StyledBadge>
    </Box>
  );
  //     anchorOrigin={anchorOrigin}
}

interface IAvatarProps {
  name?: string; // gera imagem do avatar com as iniciais das primeiras palavras
  nameAvatar?: string; // gera imagem do avatar com a string passada
  imgSrc?: string;
  className?: string;
  //categSize?: number;
  sizeXY?: number | string;
  fontSize?: number | string;
}
export function AvatarMy(props: IAvatarProps) {
  const { imgSrc, name, nameAvatar, sizeXY, fontSize } = props; // , ...propsIgnore
  const iconLetters = (name: string, nameAvatar: string) => {
    if (nameAvatar != null)
      return nameAvatar;
    if (name == null)
      return '';
    const comps = name.split(' ');
    const wordsUse = 1;
    let letters = comps.filter((_, index) => index < wordsUse).reduce((prev, curr) => prev + curr.substring(0, 1), '').toUpperCase();
    if (letters.toLowerCase() == 'cu' ||
      letters.toLowerCase() == 'fdp')
      letters = letters.substring(0, 1);
    return letters;
  };
  // if (props.name == null &&
  //   props.imgSrc == null)
  //   throw new Error('Avatar deve ter name ou imgSrc');
  const sx = sxMaker({ sizeXY, fontSize }); // , fontSizeFactor: 0.6
  return (
    <>
      {imgSrc != null
        ? <Avatar_mui alt={name} sx={sx} src={imgSrc} />
        : <Avatar_mui alt={name} sx={sx}>{iconLetters(name, nameAvatar)}</Avatar_mui>
      }
    </>
  );
}

interface IAvatarGroupProps {
  max?: number;
  className?: string;
  //categSize?: number;
  sizeXY?: number | string;
  fontSize?: number | string;
  children: React.ReactNode;
}
export function AvatarGroupMy(props: IAvatarGroupProps) {
  const { sizeXY, fontSize } = props; // , ...propsIgnore
  //csl({ props, avatares });
  const sx = sxMaker({ sizeXY, fontSize });
  return (
    <AvatarGroup_mui max={props.max}
      sx={{ '& .MuiAvatar-root': sx }}
    >
      {props.children}
    </AvatarGroup_mui>
  );
  // return (
  //   <>
  //     {avatars.filter((x, i) => i < max).map((x, i) => (
  //       <Avatar {...propsFwd} {...x} />
  //     ))}
  //     {avatars.length > max &&
  //       <Avatar_x {...propsFwd}>{`+${avatars.length - max}`}</Avatar_x>
  //     }
  //   </>
  // );
}


interface IconButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  submit?: boolean;
  padding?: number;
  executing?: boolean;
}
export function IconButtonMy(props: IconButtonProps) { // implementar no componente do icon o 'onclick' opcional @@!!!!!!
  const { children, submit, onClick, disabled, padding } = props;
  const disabledUse = props.executing ? true : disabled; // @!!!!!!!!! mudar a cor no filho?
  const propsBtn: IGenericObject = { onClick, disabled: disabledUse }; // @@@@!!!!!!
  if (submit)
    propsBtn.type = 'submit';
  else
    propsBtn.type = 'button';
  const sx: IGenericObject = {}; // type SxProps @@@@!!!!!!
  if (padding != null)
    sx.padding = padding;
  //return <IconButton_mui {...propsBtn}> <Comp sx={sx} {...propsForwardIcon} /></IconButton_mui >
  return (<IconButton_mui {...propsBtn} sx={sx}>{children}</IconButton_mui>);
}

export function WaitingObs({ text = 'Favor aguardar' }: { text?: string }) {
  return (
    <Box sx={{ width: '100%' }}>
      {text != null &&
        <Box>{text}</Box>
      }
      <LinearProgress_mui />
    </Box>
  );
}

export function BtnLine({ children, left, right, bottomStick }: { children: React.ReactNode, center?: boolean, left?: boolean, right?: boolean, bottomStick?: boolean }) {
  const themePlus = useTheme();
  let justifyContent = 'center';
  if (left) justifyContent = 'left';
  else if (right) justifyContent = 'right';
  //const propsForward = bottomStick ? {  } : {}; //@!!!!!!!!! color
  if (bottomStick)
    return (
      <Box position='sticky' bottom={0} p='0.5' bgcolor={themePlus.themePlusDeriv.destaque1.backColor}>
        <Stack direction='row' alignItems='center' gap={1} justifyContent={justifyContent} flexWrap='wrap' >
          {children}
        </Stack>
      </Box>
    );
  else

    return (
      <Box>
        <Stack direction='row' alignItems='center' gap={1} justifyContent={justifyContent} flexWrap='wrap' >
          {children}
        </Stack>
      </Box>
    );
}

export function VisualBlock({ children, className }: { children: React.ReactNode, className?: string }) {
  const themePlus = useTheme();
  // margin não está funcionando em sx  @@@!
  //  className={`${g_cn.distribVert} ${className}`} , p: '1.0rem'  clasName @!!!!!!
  return (
    <Stack gap={1} p={1} sx={{ border: 1, borderColor: themePlus.themePlusDeriv.destaque2.backColor }}
      className={className}>
      {children}
    </Stack>
  );
}

// export function Displaimer({ children }: { children: React.ReactNode }) {
//   let className = g_cn.inLineL;
//   if (right)
//     className = g_cn.inLineR;
//   return (
//     <Box className={className}>
//       {children}
//     </Box>
//   );
// }

interface IFakeLinkProps { onClick?: () => void; disabled?: boolean; color?: string; bgcolor?: string; children: React.ReactNode }
export function FakeLink({ onClick, disabled, color, bgcolor, children }: IFakeLinkProps) {
  if (disabled)
    return <Box color={color} bgcolor={bgcolor}>{children}</Box>;
  else
    //return <Typography sx={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={onClick}>{children}</Typography>;
    return <Box color={color} bgcolor={bgcolor} sx={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={onClick}>{children}</Box>;
}

export function WhatsAppLink({ phone, textLink, message }: { phone: string, textLink?: string, message?: string }) {
  const phoneCountryCode = '55';
  const href = `https://api.whatsapp.com/send?phone=${phoneCountryCode}${phone}&text=${message || ''}`;
  //csl(href);
  return (
    <a href={
      `${encodeURI(href)}`
    } target='_blank' rel='noreferrer'>{textLink || phone}</a>
  );
}

export const ImgResponsive = ({ src, maxHeight = '100vh', width = '100%', style = {} }:
  { src: string, maxHeight?: string, width?: string, style?: React.CSSProperties }) => {
  // a imagem respeitará as proporções, nada será cortado
  const styleImg = {
    display: 'block',
    width: 'auto',
    height: 'auto',
    maxHeight: maxHeight,
    maxWidth: '100%',
    margin: 'auto',
  };
  // className='businessImg'
  return (
    <div style={{ width: width }}>
      <img style={{ ...styleImg, ...style }} src={src} />
    </div>
  );
};

// export function ModalError({ text }: { text: string }) {
//   const [open, setOpen] = useState(false);
//   const handleOpen = () => setOpen(true);
//   const handleClose = () => setOpen(false);
//   return <Modal_mui
//     open={open}
//     onClose={handleClose}
//   ><div>{text}</div></Modal_mui>;
// }

// export function PageContentScroll({ children }) {
//   return (
//     <div style={{...containerVerticalfullStyle, gridTemplateRows: '1fr'}}>
//       <div style={containerVerticalScrollableStyle}>
//         {children}
//       </div>
//     </div>
//   );
// }

// export const Ty = ({ children }: { children: React.ReactNode }) => {
//   return (<Typography>{children}</Typography>);
// };


// @@!!!!!! icone de fechar não está alinhado !
export const AlertMy = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(true);
  return (
    <Box sx={{ width: '100%' }}>
      <Collapse in={open}>
        <Alert
          action={
            <IconButton
              aria-label='close'
              color='inherit'
              size='small'
              onClick={() => { setOpen(false); }}
            >
              <CloseIcon fontSize='inherit' />
            </IconButton>
          }
        >
          {children}
        </Alert>
      </Collapse>
    </Box>
  );
};

export const Spc = () => (<span>&nbsp;</span>);

interface ISwitchMyProps {
  label?: React.ReactNode;
  checked: boolean;
  onChange?: (ev: any) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}
export function SwitchMy({ label, ...propsForward }: ISwitchMyProps) { //  @!!!!!!! implementar form!! e COLOR !!
  return (
    <FormControlLabel control={
      <Switch_mui {...propsForward} />
    } label={label} />
  );
}

export class SelOption<T = string>  {
  cod: T;
  descr: string;
  disabled: boolean;
  constructor(cod?: T, descr?: string, disabled = false) {
    this.cod = cod;
    this.descr = descr;
    this.disabled = disabled;
  }
  show(withCod = false) {
    if (!withCod)
      return this.descr;
    if (this.cod == null)
      return this.descr;
    if (typeof this.cod === 'string' && this.cod === '')
      return this.descr;
    return `${this.descr} (${this.cod})`;
  }
}

interface ISelectMyProps {
  width?: string,
  value: string | number,
  onChange: (ev) => void,
  displayEmpty?: boolean,
  options: SelOption<any>[],
  placeHolder?: string,
  fontSize?: string | number;
  error?: boolean;
  disabled?: boolean;
}
export const SelectMy = ({ width, value, onChange, displayEmpty, options, placeHolder, fontSize, error, disabled }: ISelectMyProps) => {
  const themePlus = useTheme();
  return (
    <Select_mui sx={{ width, fontSize }} variant={themePlus.themePlusConfig?.inputVariant}
      value={value || ''}
      onChange={onChange}
      displayEmpty={displayEmpty}
      renderValue={value == '' ? () => (placeHolder || '') : undefined}
      error={error}
      disabled={disabled}
    >
      {options.map((x, i) => <MenuItem_mui key={i} value={x.cod} disabled={x.disabled} sx={{ fontSize }}>{x.descr}</MenuItem_mui>)}
    </Select_mui>
  );
};

// opção
{/* <TextField select label='Linha de Custo' variant={themePlus.themePlusConfig?.inputVariant}
value={fatorCusto || ''}
onChange={(ev) => {
  const value = ev.target.value === '' ? null : ev.target.value;
  frmData.setValue(Entity_Crud.F.fatorCusto, value);
  setMainStatesCache({ errorFlds: { ...mainStates.errorFlds, fatorCustoError: null } });
}}
error={mainStates.errorFlds?.fatorCustoError != null}
helperText={mainStates.errorFlds?.fatorCustoError}
disabled={isDelete}
>
{mainStates.fatorCustoArray.map((x, index) => <MenuItem key={index} value={x.fatorCusto}>{x.descr}</MenuItem>)}
</TextField> */}

interface IAutocompleteMyProps {
  width?: string,
  value: any,
  onChange: (ev, newValue) => void,
  getOptionLabel: (option: any) => string,
  isOptionEqualToValue: (option: any, value: any) => boolean,
  getOptionDisabled?: (option: any) => boolean,
  freeSolo?: boolean,
  disabled?: boolean,
  disableClearable?: boolean,
  multiple?: boolean,
  limitTags?: number;
  options: SelOption[] | string[],
  label?: string,
  placeholder?: string,
  fontSize?: string | number; // apenas para o campo de resultado, não interfere no combo aberto
  variant?: InputVariantType;
}
export const AutocompleteMy = ({ width, value, onChange, getOptionLabel, isOptionEqualToValue, getOptionDisabled,
  freeSolo, disabled, disableClearable, multiple, limitTags, options, label, placeholder, fontSize, variant }: IAutocompleteMyProps) => {
  const themePlus = useTheme();
  const widthUse = width || '99.5%';
  const variantUse = variant || themePlus.themePlusConfig?.inputVariant;
  const disableCloseOnSelect = multiple;
  return (
    <Autocomplete_mui
      sx={{ width: widthUse, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
      freeSolo={freeSolo}
      autoSelect
      blurOnSelect
      disabled={disabled}
      value={value}
      disableClearable={disableClearable}
      multiple={multiple} disableCloseOnSelect={disableCloseOnSelect}
      limitTags={limitTags}
      renderInput={(params) =>
        <TextField_mui {...params} variant={variantUse} label={label} placeholder={placeholder}
          inputProps={{ ...params.inputProps, style: { fontSize } }}
        />}
      options={options}
      onChange={onChange}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      getOptionDisabled={getOptionDisabled}
    />
  );
};