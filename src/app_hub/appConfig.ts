export const configApp = {
  appVersion: 'v1.6.6',

  appName: 'Cydag' as const,
  appCode: 'cyd' as const,
  friendlyErrorMessage: 'Ocorreu um erro inesperado',
  supportSys: { email: 'pcintra1@gmail.com', phone: '11999110101' },
  supportApp: { email: 'bruna.aquino@cyrela.com.br' },

  forceWaitMinimumMs: 500,
  maximumSearchResult: 200,
  revalidateSSGMinutes: 60,
  csvTextNoData: '* nenhum dado *',
  csvDelimiter: ';',
  csvStrForNull: '(vazio)',
  csvColumnCmd: 'cmd(incluir/alterar/excluir)',
  linkEmailExpirationMinutes: (isAmbDev: boolean) => isAmbDev ? (30) : (24 * 60),
};
