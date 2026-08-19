## Visão geral da autenticação

A autenticação do site foi estruturada em camadas. O Firebase Authentication é responsável por identificar o usuário, manter a sessão ativa no navegador e gerar o token usado nas requisições protegidas. 

Para acessar o Firebase, basta ir em console.firebase.google.com e conferir o Web App Diavi Auth. Nele todas as informações dos usuários estarão disponíveis. Além das demais configurações se necessário.

Já o sistema interno usa uma base de identidade no Neon para definir se o usuário autenticado também está autorizado a acessar a aplicação.

Para acessar o Neon, basta ir em console.neon.tech no banco diavi-identity. Lá também está disponível a modelagem do banco.

## Proteção no frontend

No frontend, as rotas internas são protegidas pelo componente `ProtectedRoute`. Ele impede que páginas privadas sejam exibidas para usuários sem login e aguarda o carregamento da sessão antes de decidir se deve redirecionar para `/login`.

Também existe uma diferença entre estar logado no Firebase e estar autorizado no sistema. Um usuário pode ter autenticação válida no Firebase, mas só acessa as áreas internas se também existir como `identityUser`.

## Chamadas autenticadas

As requisições para APIs sensíveis usam o `authorizedFetch`, definido no contexto de autenticação. Ele obtém o token atual do Firebase e envia esse token no cabeçalho `Authorization`, no formato `Bearer <token>`.

Isso evita que a segurança dependa apenas da interface. Mesmo que alguém tente chamar uma API diretamente, a rota protegida precisa receber um token válido para continuar.

## Validação no backend

No backend, as APIs protegidas validam o token Firebase antes de executar operações sensíveis. Depois disso, o sistema consulta o banco de identidade no Neon para verificar se aquele usuário autenticado realmente possui permissão na aplicação.

Essa camada é a parte mais importante da segurança, porque impede que a proteção fique limitada ao navegador. O frontend controla a experiência de acesso, mas a autorização real acontece no servidor.

## Configurações que não aparecem no repositório

Algumas informações essenciais não são visíveis apenas olhando o repositório local. As variáveis de ambiente, como `IDENTITY_DATABASE_URL` e credenciais administrativas do Firebase, ficam configuradas fora do código, normalmente na Vercel ou no ambiente de produção.

Também não é possível saber pelo repo quais usuários existem no Firebase, quais domínios estão autorizados, quais provedores de login estão ativos, quais registros existem no Neon ou quais permissões foram cadastradas para cada usuário.

## Políticas externas

As regras do Firebase, especialmente do Firestore quando usado, fazem parte da segurança do sistema. Essas regras precisam estar publicadas no Firebase Console ou aplicadas pela Firebase CLI. Ter um arquivo de regras no projeto local não garante que elas estejam ativas em produção.

Por isso, a revisão da segurança precisa considerar o código, mas também as configurações ativas no Firebase, na Vercel e no banco Neon.

## Estado atual da segurança

Com essa estrutura, o site possui proteção em três níveis: controle de acesso visual no frontend, envio de token Firebase nas requisições e validação real no backend com consulta ao banco de identidade.