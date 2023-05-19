import { EmailShareButton, FacebookShareButton, TelegramShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import { EmailIcon, FacebookIcon, TelegramIcon, TwitterIcon, WhatsappIcon } from 'react-share';
import { Stack } from '@mui/material';

import { configApp } from '../app_hub/appConfig';

import { CategMsgSystem } from '../libCommon/logSystemMsg_cliSvr';

import { SystemMsgCli } from '../libClient/systemMsgCli';

export const ShareIcons = ({ url, text, emailSubject, loggedUserInfo, page, point }: { url: string, text: string, emailSubject: string, loggedUserInfo: string, page: string , point: string }) => {
  const SharedOpen = (socialNetwork: string) => {
    SystemMsgCli(CategMsgSystem.alert, `shareOpen - ${page}`, `point: ${point} ; socialNetwork: ${socialNetwork} ; loggedUserInfo ${loggedUserInfo}`);
  };

  const windowWidth = 700;
  const windowHeight = 600;

  // facebook quote não funciona !!

  return (
    <Stack direction='row' alignItems='center' gap={0.5}>
      <FacebookShareButton
        url={url}
        quote={text}
        hashtag={`#${configApp.appName}`}
      >
        <FacebookIcon size={40} round={true} />
      </FacebookShareButton>

      {/* <FacebookMessengerShareButton
          url={urlShare}
          quote={descriptionShare}
        >
          <FacebookMessengerIcon size={40} round={true} />
        </FacebookMessengerShareButton> */}

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

      <TelegramShareButton
        url={url}
        title={text}
        onClick={() => SharedOpen('telegram')}
        windowWidth={windowWidth}
        windowHeight={windowHeight}
      >
        <TelegramIcon size={40} round={true} />
      </TelegramShareButton>
      <TwitterShareButton
        url={url}
        title={text}
        onClick={() => SharedOpen('twitter')}
        windowWidth={windowWidth}
        windowHeight={windowHeight}
      >
        <TwitterIcon size={40} round={true} />
      </TwitterShareButton>
    </Stack>
  );
};