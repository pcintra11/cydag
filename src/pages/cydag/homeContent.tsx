import type { ReactNode } from 'react';
import {
  Box, CssBaseline, Link, Paper, Stack, SvgIcon,
  Typography, createTheme, ThemeProvider
} from '@mui/material';
import BannerHome from '../../components/bannerHome';

const theme = createTheme({
  palette: {
    primary: { main: '#2871a5' },
    secondary: { main: '#bd5b5c' },
    background: { default: '#f6f8f9', paper: '#ffffff' },
    text: { primary: '#273746', secondary: '#667581' },
    divider: '#e1e7eb',
  },
  typography: { fontFamily: 'Inter, "Segoe UI", Arial, sans-serif', fontSize: 14 },
  shape: { borderRadius: 8 },
});

type IconName = 'calendar' | 'chart' | 'warning' | 'document' | 'target' | 'search' | 'bulb' | 'screen' | 'mail';

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9h18" /></>,
    chart: <><path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-7M17 6h3v3" /></>,
    warning: <><path d="m12 3 10 18H2L12 3zM12 9v5M12 17h.01" /></>,
    document: <path d="M6 3h8l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v6h5M8 13h8M8 17h6" />,
    target: <><circle cx="11" cy="12" r="8" /><circle cx="11" cy="12" r="4" /><path d="m14 9 7-6-3 9-3-3z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    bulb: <path d="M9 18h6M10 22h4M8 14c-1.3-1-2-2.4-2-4a6 6 0 1 1 12 0c0 1.6-.7 3-2 4-.7.6-1 1.2-1 2h-6c0-.8-.3-1.4-1-2zM12 2V1M4.9 4.9 4 4M19.1 4.9l.9-.9" />,
    screen: <><rect x="3" y="4" width="18" height="14" rx="1" /><path d="M8 22h8M12 18v4M7 14l3-3 2 2 4-5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  };
  return (
    <SvgIcon sx={{ fontSize: size, flexShrink: 0, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      {paths[name]}
    </SvgIcon>
  );
}

function IconBadge({ name, prominent = false, color = '#2e668b', background = '#edf3f6' }: {
  name: IconName; prominent?: boolean; color?: string; background?: string;
}) {
  return (
    <Box sx={{ width: prominent ? 48 : 39, height: prominent ? 48 : 39, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: prominent ? '50%' : '9px', bgcolor: prominent ? 'secondary.main' : background, color: prominent ? '#fff' : color }}>
      <Icon name={name} size={prominent ? 24 : 20} />
    </Box>
  );
}

export interface SupportMaterial {
  file: string;
  title: string;
}

export interface OrientacoesPageProps {
  userName?: string | null;
  emailSuporte?: string;
  appVersion?: string;
  ambNotProdTxt?: string | null;
  folderMaterial?: string;
  materials?: readonly SupportMaterial[];
}

const defaultMaterials: readonly SupportMaterial[] = [
  { file: '', title: 'Manual de Orçamento xxxx' },
  { file: '', title: 'Lista de Classes x Materiais xxxx' },
  { file: '', title: 'Formulário para Preenchimento – Projetos xxxx' },
];

const benefits: readonly { icon: IconName; title: string; description: string }[] = [
  { icon: 'calendar', title: 'Planejar', description: 'Antecipar despesas e organizar os recursos necessários para a área.' },
  { icon: 'chart', title: 'Acompanhar', description: 'Monitorar mensalmente o Orçado x Realizado.' },
  { icon: 'search', title: 'Identificar', description: 'Encontrar desvios e entender suas principais causas.' },
  { icon: 'target', title: 'Decidir', description: 'Utilizar as informações para definir prioridades e agir.' },
];

const steps: readonly { icon: IconName; title: string }[] = [
  { icon: 'document', title: 'Consulte seu orçamento' },
  { icon: 'chart', title: 'Acompanhe o realizado' },
  { icon: 'search', title: 'Analise os desvios' },
  { icon: 'target', title: 'Tome ações' },
];

function InfoCard({ icon, title, children, color, background }: {
  icon: IconName; title: string; children: ReactNode; color?: string; background?: string;
}) {
  return (
    <Paper component="article" elevation={0} square sx={{ p: 2.5, height: '100%' }}>
      <IconBadge name={icon} color={color} background={background} />
      <Typography component="h3" sx={{ fontSize: 14, fontWeight: 700, color: '#344857', mt: 1.5, mb: 0.75 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

function Description({ children }: { children: ReactNode }) {
  return <Typography sx={{ fontSize: 12, lineHeight: 1.65, color: 'text.secondary' }}>{children}</Typography>;
}

/** Componente de conteúdo: usa o ThemeProvider do aplicativo hospedeiro. */
export function HomeContent({ folderMaterial = 'folderMaterial', materials = defaultMaterials, userName = 'José das Couves',
  ambNotProdTxt = 'amb QAS', appVersion = '9.99', emailSuporte = 'contato@xxx.com' }: OrientacoesPageProps) {

  return (
    <ThemeProvider theme={theme}><CssBaseline />
      <Box component="main" sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
        <Box component="header" sx={{ position: 'relative', overflow: 'hidden', minHeight: 190, display: 'flex', alignItems: 'center', bgcolor: '#f5f6f4', borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <BannerHome />
          </Box>
          <Box sx={{ width: '100%', maxWidth: 1390, mx: 'auto', px: { xs: 2.5, sm: 4, lg: 7.75 }, py: 4, position: 'relative', zIndex: 1, background: 'linear-gradient(90deg, #f5f6f4 25%, rgba(245,246,244,.9) 55%, transparent 100%)' }}>
            <Box sx={{ width: 58, height: 3, bgcolor: 'secondary.main', mb: 2 }} />
            <Typography component="h1" sx={{ fontSize: { xs: 27, md: 37 }, fontWeight: 700, letterSpacing: '-.025em', lineHeight: 1.2, maxWidth: 740, mb: 1 }}>Orientações para Uso do Sistema</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: 14, sm: 16 }, maxWidth: 680 }}>Tudo o que você precisa saber para utilizar o CYDAG de forma simples e eficiente.</Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 1390, mx: 'auto', px: { xs: 2.5, sm: 4, lg: 7.75 }, pt: 3.5, pb: 6 }}>
          <Stack component="section" direction="row" spacing={2} sx={{ mb: 3.5, alignItems: { xs: 'flex-start', sm: 'center' } }}>
            <IconBadge name="target" prominent />
            <Box>
              <Typography component="h2" sx={{ fontSize: { xs: 18, sm: 21 }, fontWeight: 700, lineHeight: 1.25, mb: 0.5 }}>Seja bem-vindo ao CYDAG {userName}!</Typography>
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>O CYDAG é o sistema utilizado para planejamento, acompanhamento e controle das despesas gerais e administrativas da Cyrela.</Typography>
            </Box>
          </Stack>

          <Box component="section" aria-label="Orientações principais" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: '1px', bgcolor: 'divider', borderBlock: 1, borderColor: 'divider' }}>
            <InfoCard icon="calendar" title="Atualização mensal">
              <Description>Até o 5º dia útil de cada mês, o sistema será atualizado com as despesas realizadas até o final do mês anterior.</Description>
            </InfoCard>
            <InfoCard icon="chart" title="Acompanhe seus resultados" color="#467a5d" background="#edf4ef">
              <Description>É importante que os gestores consultem regularmente suas despesas e acompanhem a evolução do Orçado x Realizado, identificando desvios e oportunidades de melhoria.</Description>
            </InfoCard>
            <InfoCard icon="warning" title="Encontrou alguma inconsistência?" color="#b27629" background="#fbf2e7">
              <Description>Se identificar um lançamento incorreto ou tiver dúvidas sobre a utilização do sistema, fale com a Controladoria Corporativa.</Description>
              <Link href={`mailto:${emailSuporte}`} underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1, fontSize: 12, fontWeight: 600, overflowWrap: 'anywhere' }}><Icon name="mail" size={16} />{emailSuporte}</Link>
            </InfoCard>
            <InfoCard icon="document" title="Materiais de apoio" color="#51647d" background="#eef1f6">
              <Description>Consulte os materiais para orientações sobre orçamento e utilização do sistema:</Description>
              <Stack component="ul" spacing={0.75} sx={{ listStyle: 'none', p: 0, mt: 1, mb: 0 }}>
                {materials.map((material) => (
                  <Box component="li" key={material.title}>
                    {material.file != '' ? (
                      <Link href={`${folderMaterial}/${material.file}`} target='_blank' rel="noopener noreferrer" sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start', fontSize: 11.5, lineHeight: 1.45 }}>
                        <Icon name="document" size={14} />{material.title}
                      </Link>
                    ) : (
                      <Box aria-disabled="true" sx={{ display: 'flex', gap: 0.75, color: 'text.secondary', fontSize: 11.5, lineHeight: 1.45 }}><Icon name="document" size={14} /><Box component="span">{material.title}<Typography component="span" sx={{ display: 'block', fontSize: 10 }}>Arquivo não disponível</Typography></Box></Box>
                    )}
                  </Box>
                ))}
              </Stack>
            </InfoCard>
          </Box>

          <Box component="section" aria-labelledby="budget-title" sx={{ mt: 4 }}>
            <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', mb: 2 }}>
              <IconBadge name="bulb" prominent />
              <Box>
                <Typography id="budget-title" component="h2" sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.25 }}>Por que o orçamento é importante?</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>Ele ajuda a sua área a planejar melhor, acompanhar resultados e tomar decisões mais assertivas.</Typography>
              </Box>
            </Stack>
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'secondary.main', borderRadius: '0 8px 8px 0', px: 2.5, py: 2, mb: 1.75 }}>
              <Typography component="h3" sx={{ fontSize: 16, fontWeight: 700, mb: 0.75 }}>Cultura Cyrela em Ação: Resultados Sustentáveis e Perenes</Typography>
              <Description>Planejar e acompanhar o orçamento com responsabilidade nos ajuda a olhar para o longo prazo e tomar decisões com foco em resultados. Com agilidade, qualidade e eficiência operacional, contribuímos para a rentabilidade e a solidez financeira da empresa, fazendo a diferença na vida das famílias que vivem em nossos empreendimentos.</Description>
            </Paper>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: '1px', bgcolor: 'divider', borderBlock: 1, borderColor: 'divider' }}>
              {benefits.map((benefit) => (
                <Paper key={benefit.title} component="article" square elevation={0} sx={{ p: 2.25 }}>
                  <Box sx={{ color: 'primary.main', mb: 1 }}><Icon name={benefit.icon} /></Box>
                  <Typography component="h3" sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '.035em', textTransform: 'uppercase', mb: 0.75 }}>{benefit.title}</Typography>
                  <Description>{benefit.description}</Description>
                </Paper>
              ))}
            </Box>
          </Box>

          <Box component="section" aria-labelledby="steps-title" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.05fr 4fr' }, gap: 2.5, mt: 3, alignItems: 'center' }}>
            <Stack direction="row" spacing={1.5}>
              <Box sx={{ color: 'primary.main' }}><Icon name="screen" size={29} /></Box>
              <Box>
                <Typography id="steps-title" component="h2" sx={{ fontSize: 14, fontWeight: 700, mb: 0.5 }}>Como usar o CYDAG?</Typography>
                <Description>Siga o passo a passo e aproveite todas as funcionalidades do sistema.</Description>
              </Box>
            </Stack>
            <Box component="ol" sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: 2.5, listStyle: 'none', m: 0, p: 0 }}>
              {steps.map((step, index) => (
                <Box component="li" key={step.title} sx={{ textAlign: 'center', position: 'relative' }}>
                  <Box aria-hidden="true" sx={{ width: 28, height: 28, display: 'grid', placeItems: 'center', mx: 'auto', mb: 1, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', fontSize: 11, fontWeight: 700 }}>{index + 1}</Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, maxWidth: 115, mx: 'auto', minHeight: 32 }}>{step.title}</Typography>
                  <Box sx={{ color: '#486a7d', mt: 0.5 }}><Icon name={step.icon} /></Box>
                  {index < steps.length - 1 && <Box aria-hidden="true" sx={{ position: 'absolute', right: -16, top: 26, fontSize: 24, color: '#8a969e', display: { xs: index === 1 ? 'none' : 'block', sm: 'block' } }}>›</Box>}
                </Box>
              ))}
            </Box>
          </Box>

          <Stack component="footer" direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 2, mt: 4, color: 'text.secondary' }}>
            <Typography sx={{ fontSize: 11 }}>CYDAG · Planejamento e acompanhamento de despesas</Typography>
            <Stack direction='row' spacing={1} justifyContent='end' mt={1}>
              <Typography sx={{ fontSize: 11, fontWeight: 600 }}>Versão {appVersion}</Typography>
              {ambNotProdTxt != null &&
                <Typography sx={{ fontSize: 11, fontWeight: 600 }}>(ambiente {ambNotProdTxt})</Typography>
              }
            </Stack>
          </Stack>

        </Box>
      </Box>
    </ThemeProvider>
  );
}