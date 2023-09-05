import { PageIndexHub } from '../app_hub/clientResources';
import { pagesSuporte } from '../app_suporte/endPoints';

//interface IPageIndexProps { app: string }

const pageSelf = pagesSuporte.index;
export default function PageIndexDynam() {
  // export default function PageIndexDynam({ app }: IPageIndexProps) {
  // const router = useRouter();
  // React.useEffect(() => {
  //   router.push(pagesHub.index.pagePath);
  // }, []);
  // return (<WaitingObs text='Redirecionando' />);

  return <PageIndexHub />;
  // if (app === appName.vizinet)
  //   return <PageIndex1 />;
  // else if (app === appName.cydag)
  //   return <PageIndex2 />;
  // else
  //   return (
  //     <>
  //       <Box>app não reconhecido</Box>
  //     </>
  //   );
}

// export async function getStaticProps() {
//   // const ctrlContext = new CtrlContext('index-getStaticProps');
//   // NotifyAdmASync('página index gerada', HoraDebug(), ctrlContext);
//   const result = {
//     props: {
//       app: configApp.appName,
//     },
//   };
//   return result;
// }