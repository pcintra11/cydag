import { useRouter } from 'next/router';
import React from 'react';

import { Box, Stack } from '@mui/material';

import { dbg } from '../../libCommon/dbg';
import { AnchorHrefMailTo } from '../../libCommon/util';

import { AbortProc, LogErrorUnmanaged } from '../../components';

import { pagesApp } from '../../appCydag/endPoints';
import { useLoggedUser } from '../../appCydag/useLoggedUser';
import { Env } from '../../libCommon/envs';
import { isAmbPrd } from '../../libCommon/isAmb';

const pageSelf = pagesApp.home;
export default function PageHome() {
  const router = useRouter();
  const { loggedUser, isLoadingUser } = useLoggedUser({ id: pageSelf.pagePath });

  React.useEffect(() => {
    if (!router.isReady || isLoadingUser) return;
    dbg({ level: 1, context: 'index' }, 'loggedUser cydag (by hook)', loggedUser);
  }, [router.isReady, isLoadingUser, loggedUser?.email]);

  const folderManuais = '/appCydag/manuais'; // em public

  const emailSuporte = 'cydag@cyrela.com.br';

  try {
    return (
      <Stack gap={1} height='100%' overflow='auto'>

        <Box>
          <p>
            <b>Seja bem-vindo ao CYDAG {loggedUser?.name}!</b>
          </p>
        </Box>

        <Box>
          <p>
            O CYDAG é o nosso sistema de orçamento e acompanhamento das despesas gerais e administrativas da Cyrela.
          </p>
          <p>
            Até o 5º dia útil de cada mês, o sistema será atualizado com as despesas incorridas até o final do mês anterior.
          </p>
          <p>
            É importante que todos os gestores da empresa acompanhem mensalmente a evolução de suas despesas para garantir o cumprimento de um importante pilar da Cultura Cyrela: SOLIDEZ FINANCEIRA.
          </p>
          <p>
            Caso você encontre qualquer lançamento que julga estar errado ou tenha qualquer dúvida quanto à utilização do sistema, favor entrar em contato com a controladoria
            corporativa através do e-mail
            &nbsp;<a href={`${AnchorHrefMailTo(emailSuporte, 'Contato pelo sistema')}`}>{emailSuporte}</a>&nbsp;
            .
          </p>

          <Box mt={2}>
            <p>
              Favor consultar os manuais abaixo caso tenha alguma dúvida:
            </p>

            <a href={`${folderManuais}/Manual_Orçamento_CYDAG_2022.pdf`} target='_blank' rel='noreferrer'>
              <Box>Manual de Orçamento 2022</Box>
            </a>

            <a href={`${folderManuais}/Lista_de_Classes_ x_Materiais_CYDAG.pdf`} target='_blank' rel='noreferrer'>
              <Box>Lista de Classes x Materiais - CYDAG</Box>
            </a>

            <a href={`${folderManuais}/Manual_CYDAG_Consulta.pdf`} target='_blank' rel='noreferrer'>
              <Box>Manual de Consulta</Box>
            </a>
          </Box>

          <Stack direction='row' gap={1} justifyContent='end' mt={1}>
            <Box>Versão {Env('appVersion')}</Box>
            {!isAmbPrd() &&
              <Box>(ambiente {Env('amb')})</Box>
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