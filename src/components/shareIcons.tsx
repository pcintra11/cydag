import { Stack, Box } from '@mui/material';

import { EmailShareButton, FacebookShareButton, TelegramShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import { EmailIcon, FacebookIcon, TelegramIcon, TwitterIcon, WhatsappIcon } from 'react-share';

import { configApp } from '../app_hub/appConfig';

import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { SystemMsgCli } from '../libClient/systemMsgCli';

interface ShareIconsProps {
  url: string;
  text: string;
  emailSubject: string;
  loggedUserInfo: string;
  page: string;
  //point?: string ;
}

export const ShareIcons = ({ url, text, emailSubject, loggedUserInfo, page }: ShareIconsProps) => {
  const SharedOpen = (socialNetwork: string) => {
    SystemMsgCli(CategMsgSystem.alert, `shareOpen - ${page}`, `socialNetwork: ${socialNetwork} ; loggedUserInfo ${loggedUserInfo}`);
  };

  const windowWidth = 700;
  const windowHeight = 600;

  // facebook quote não funciona !!

  {/* <Box>
    Como sugestão use esse texto abaixo para compartilhar, onde já tem o link para o Vizinet com uma breve descrição.
    Ao copiar/colar na sua rede social (WhatsApp, Facebook, etc.) aguarde alguns segundos para a imagem e texto aparecerem, assim ficará mais interessante a postagem.
  </Box> */}

  // @!!!!!!! retirar fundo azul

  return (
    <Stack direction='row' alignItems='center' spacing={1.5}>
      <Box>
        <WhatsappShareButton
          url={url}
          title={text}
          onClick={() => SharedOpen('whats')}
          separator=''
          windowWidth={windowWidth}
          windowHeight={windowHeight}
        >
          <WhatsappIcon size={40} round={true} />
        </WhatsappShareButton>
      </Box>

      <Box>
        <FacebookShareButton
          url={url}
          quote={text}
          hashtag={`#${configApp.appName}`}
        >
          <FacebookIcon size={40} round={true} />
        </FacebookShareButton>
      </Box>

      {/* <FacebookMessengerShareButton
          url={urlShare}
          quote={descriptionShare}
        >
          <FacebookMessengerIcon size={40} round={true} />
        </FacebookMessengerShareButton> */}

      <Box>
        <EmailShareButton
          url={url}
          body={text}
          subject={`${emailSubject}`}
          openShareDialogOnClick={true}
          onClick={() => SharedOpen('email')}
          windowWidth={windowWidth}
          windowHeight={windowHeight}
        >
          <EmailIcon size={40} round={true} />
        </EmailShareButton>
      </Box>

      <Box>
        <TelegramShareButton
          url={url}
          title={text}
          onClick={() => SharedOpen('telegram')}
          windowWidth={windowWidth}
          windowHeight={windowHeight}
        >
          <TelegramIcon size={40} round={true} />
        </TelegramShareButton>
      </Box>

      <Box>
        <TwitterShareButton
          url={url}
          title={text}
          onClick={() => SharedOpen('twitter')}
          windowWidth={windowWidth}
          windowHeight={windowHeight}
        >
          <TwitterIcon size={40} round={true} />
        </TwitterShareButton>
      </Box>

    </Stack>
  );
};