enum CmdApi_ProcessoOrcamentario {
  list = 'list',
  insert = 'insert',
  update = 'update',
  // statusBloquear = 'statusBloquear',
  // statusDesbloquear = 'statusDesbloquear',
  // statusEncerrar = 'statusEncerrar',
  // statusReabrir = 'statusReabrir',

  downloadConfigCCs = 'downloadConfigCCs',
  uploadConfigCCs = 'uploadConfigCCs',
  
  geraRevisaoValores = 'geraRevisaoValores',
}
export {
  CmdApi_ProcessoOrcamentario,
  CmdApi_ProcessoOrcamentario as CmdApi_Crud,
};

// const codYup = yup
//   .string()
//   .required(msgValidRequired)
//   .trim()
//   .uppercase()
//   .matches(/^(([A-Z]){2})$/, 'Deve ter 2 posições com letras');

// const descrYup = yup
//   .string()
//   .required(msgValidRequired)
//   .min(5, 'deve ter no mínimo 5 caracteres')
//   .max(30, 'deve ter no máximo 30 caracteres');
