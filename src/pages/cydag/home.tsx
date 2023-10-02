import { useRouter } from 'next/router';
import React from 'react';

import { Box, Stack } from '@mui/material';

import { dbg } from '../../libCommon/dbg';
import { AnchorHrefMailTo } from '../../libCommon/util';

import { AbortProc, LogErrorUnmanaged, Tx } from '../../components';

import { pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { Env, isAmbPrd } from '../../app_base/envs';
import { configApp } from '../../app_hub/appConfig';

const pageSelf = pagesApp.home;
export default function PageHome() {
  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  React.useEffect(() => {
    if (!router.isReady || isLoadingUser) return;
    //dbg({ level: 1, context: 'index' }, 'loggedUser cydag (by hook)', loggedUser);
  }, [router.isReady, isLoadingUser, loggedUser?.email]);

  const nomeSistema = 'CYDAG';
  const emailSuporte = 'cydag@cyrela.com.br';

  const folderManuais = '/appCydag/manuais'; // em public
  const files = {
    manualOrcam: 'Manual_Orçamento_2024.pdf',
    classesMateriais: 'Lista_de_Classes_ x_Materiais_CYDAG_2024.pdf',
    formProjetos: 'Formulário_para_preenchimento_(Projetos)_2024.xlsx',
    manualConsulta: 'Manual_CYDAG_Consulta.pdf',
  };

  try {
    return (
      <Stack spacing={1} height='100%' overflow='auto'>

        <Tx bold paragraph>
          Seja bem-vindo ao {nomeSistema} {loggedUser?.name}!
        </Tx>

        <Box>
          <Tx paragraph>
            O {nomeSistema} é o nosso sistema de orçamento e acompanhamento das despesas gerais e administrativas da Cyrela.
          </Tx>
          <Tx paragraph>
            Até o 5º dia útil de cada mês, o sistema será atualizado com as despesas incorridas até o final do mês anterior.
          </Tx>
          <Tx paragraph>
            É importante que todos os gestores da empresa acompanhem mensalmente a evolução de suas despesas para garantir o cumprimento de um importante pilar da Cultura Cyrela: SOLIDEZ FINANCEIRA.
          </Tx>
          <Tx paragraph>
            Caso você encontre qualquer lançamento que julga estar errado ou tenha qualquer dúvida quanto à utilização do sistema, favor entrar em contato com a controladoria
            corporativa através do e-mail
            &nbsp;<a href={`${AnchorHrefMailTo(emailSuporte, 'Contato pelo sistema')}`}>{emailSuporte}</a>&nbsp;
            .
          </Tx>

          <Box mt={2}>
            <Tx paragraph>
              Favor consultar os manuais abaixo caso tenha alguma dúvida:
            </Tx>

            <a href={`${folderManuais}/${files.manualOrcam}`} target='_blank' rel='noreferrer'>
              <Tx>Manual de Orçamento 2024</Tx>
            </a>

            <a href={`${folderManuais}/${files.classesMateriais}`} target='_blank' rel='noreferrer'>
              <Tx>Lista de Classes x Materiais 2024</Tx>
            </a>

            <a href={`${folderManuais}/${files.formProjetos}`} target='_blank' rel='noreferrer'>
              <Tx>Formulário para preenchimento (Projetos) 2024</Tx>
            </a>

            <a href={`${folderManuais}/${files.manualConsulta}`} target='_blank' rel='noreferrer'>
              <Tx>Manual de Consulta</Tx>
            </a>
          </Box>

          <Stack direction='row' spacing={1} justifyContent='end' mt={1}>
            <Tx>Versão {configApp.appVersion}</Tx>
            {!isAmbPrd() &&
              <Tx>(ambiente {Env('amb')})</Tx>
            }
          </Stack>
        </Box>

      </Stack>
    );
  } catch (error) {
    LogErrorUnmanaged(error, `${pageSelf.pagePath}-render`);
    return (<AbortProc error={error} tela={pageSelf.pagePath} />);
  }
}