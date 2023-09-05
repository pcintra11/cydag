export const configApp = {
  appVersion: 'v1.0.8',

  appName: 'Cydag',
  friendlyErrorMessage: 'Ocorreu um erro inesperado',
  support: { email: 'pcintra1@gmail.com', phone: '11916078600' },

  forceWaitMinimumMs: 500,
  maximumSearchResult: 200,
  revalidateSSGMinutes: 60,
  csvTextNoData: '* nenhum dado *',
  csvDelimiter: ';',
  csvStrForNull: '(vazio)',
  csvColumnCmd: 'cmd(incluir/alterar/excluir)',
  linkEmailExpirationMinutes: (isAmbDev: boolean) => isAmbDev ? (30) : (24 * 60),
};
