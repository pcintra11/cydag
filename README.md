# Cydag
## _Aplicação em React para planejamento de despesas da controladoria e integração com o SAP_

## Principais Tecnologias

- [https://nextjs.org/] - NextJs
- [https://mui.com/] - Material UI
- [https://www.mongodb.com/cloud] - Banco de dados MongoDB no Atlas
- Login via Azure/AD


## Instalação

- Configure as variáveis do arquivo variaveis_configurar.txt de acordo com o ambiente
- Certifique-se que o banco é Mongo Db full a partir de 6.0 (foi constatado problemas com o Cosmos Db)

## Plataformas testadas

- Vercel
- Azure (vide obs)


## Observações

Os arquivos 'server.js' e 'azure-pipelines*.yml' são necessários apenas para a plataforma Azure
Os pacotes 'express' e 'http-proxy-middleware' são necessários apenas para a plataforma Azure

Os dados de SITE_EMAIL_CONFIG são utilizados para envio de mensagens de erro no sistema

## URLs

QAS: cydag-qas.cyrela.com.br
PRD: cydag.cyrela.com.br
