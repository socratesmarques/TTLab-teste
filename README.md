# TTLab

O construtor de raquetes do TTLab permite combinar madeira e borrachas, comparar as duas faces e buscar alternativas por estilo ou objetivo. A montagem inicial é um exemplo editável do catálogo demonstrativo.

## Executar

Use Node.js 24 LTS e npm. Na raiz do checkout, execute:

```sh
npm ci
npm run dev
```

Abra o endereço local impresso pelo Vite. Para servir a distribuição de produção, use `npm run build` seguido de `npm run preview`.

## Usar a bancada

- Use a busca rápida para procurar por nome ou fabricante em todo o catálogo. Também é possível escolher uma peça diretamente no cartão de madeira, forehand ou backhand. Os perfis genéricos permitem explorar uma madeira desconhecida.
- Arraste ou use toque para girar a raquete. Os botões controlam perspectiva, separação das camadas, zoom e restauração da câmera. Em navegadores sem WebGL 2, a bancada apresenta uma prévia 2D.
- Ao completar as três peças, confira os indicadores e radares. Em **Melhorar montagem**, escolha um objetivo e compare os componentes propostos com a montagem que iniciou a busca.
- Em **Explorar**, selecione um estilo, ajuste as nove metas separadamente em FH e BH e escolha as restrições. A busca ocorre ao pressionar **Buscar recomendações**. Alterar um filtro descarta o relatório anterior.
- O relatório permite alternar entre alternativas, inspecionar as diferenças, aplicar uma combinação e imprimir a seleção. A opção de salvar como PDF depende do diálogo de impressão do navegador.
- **Salvar montagem** grava uma cópia nomeada na biblioteca deste navegador. **Compartilhar** codifica as peças e variações na URL. Para abrir o link em outro dispositivo, a aplicação precisa estar hospedada em um endereço acessível por ele.

## Testes

```sh
npm test
npm run build
```

A suíte de navegador usa Python 3 com Playwright e Chromium. Prepare o ambiente Python uma vez e execute:

```sh
python -m pip install playwright
python -m playwright install chromium
npm run test:e2e
```

O teste compila a distribuição, inicia o Vite Preview em uma porta local livre e percorre seleção, variações, câmera, biblioteca, compartilhamento, melhoria e descoberta em duas larguras. Há um cenário específico para WebGL indisponível.

## Arquitetura

| Área | Responsabilidade |
| --- | --- |
| `src/catalog.ts` | Tipos, equipamentos, variações e validação do formato de compartilhamento v1 |
| `src/model.ts` | Análise pura por face, metas dos perfis e classificação das combinações |
| `src/optimizer.worker.ts` | Execução da busca em segundo plano, inclusive cancelamento ao mudar critérios |
| `src/Scene.tsx` e `src/Viewer.tsx` | Modelo procedural original em Three.js / React Three Fiber, órbita, vistas e alternativa 2D |
| `src/Equipment.tsx`, `src/SearchLab.tsx` e `src/Radar.tsx` | Seleção de peças, preferências, resultados e radares vetoriais |
| `src/main.tsx` | Estado React da bancada, biblioteca local, links e navegação |

O catálogo e o cálculo ficam no cliente. Os IDs dos equipamentos e variações identificam uma configuração em links e na biblioteca. Para integrar uma fonte licenciada, preserve os IDs existentes ou implemente uma migração de versão no decodificador.

## Modelo e limites dos dados

Os fabricantes, modelos, preços e atributos são fictícios. Toda a análise é heurística. As grandezas do catálogo servem para comparação interna. As durezas usam uma escala demonstrativa. Os modelos genéricos têm parâmetros de referência próprios.

Para cada face, o modelo usa rigidez da madeira, velocidade e aderência da borracha, espessura e dureza da esponja. Calcula nove índices limitados a 0–100. Por exemplo, a velocidade combina 35% de rigidez, 48% de velocidade da borracha e 17% de espessura normalizada. Esponjas macias e madeiras flexíveis favorecem o índice de contato. As equações e os arredondamentos estão em `src/model.ts`.

O peso soma a madeira e duas borrachas recortadas. Cada borracha parte de uma massa de referência a 2 mm, com ajuste de 6 g por milímetro e 0,15 g por grau acima da menor dureza do modelo. O equilíbrio é o centro de massa longitudinal aproximado com centros fixados a 11 cm e 17,5 cm da base do cabo para a madeira e as borrachas. O objetivo de equilíbrio aproxima esse resultado de 14 cm. O custo soma uma madeira e duas folhas. As dimensões visuais aproximam uma cabeça de 15 × 16 cm e cabo de 10 cm. A vista em camadas amplia as separações para inspeção.

A busca enumera as combinações admissíveis do catálogo, incluindo as variações de cada face. Madeira genérica participa quando o usuário a mantém fixa. Orçamento, fabricante, madeira fixa, igualdade dos modelos, espessura e dureza são filtros obrigatórios. A compatibilidade vale 100 menos a distância absoluta média ponderada às duas metas. Velocidade, efeito e controle recebem peso 2 e os outros índices recebem peso 1. O custo-benefício opcional acrescenta até 20 pontos de classificação conforme o preço. Na melhoria, a busca exige ganho positivo no objetivo escolhido e acrescenta duas vezes o ganho à classificação. A utilidade de custo-benefício considera efeito e controle das duas faces por real. O relatório seleciona até cinco trios distintos de modelos, com a melhor variação de cada trio. Compatibilidade expressa proximidade às metas.

## Referências funcionais

A página pública do construtor apresenta seleção por componente, busca rápida, sugestão de madeira e uma alternativa genérica. A página de descoberta apresenta perfis defensivos a ofensivos, restrições de marca e orçamento, metas individuais por face e níveis de busca. As sessões automatizadas de navegação receberam HTTP 403. A observação direta de interações completas, animações, comportamento mobile e desempenho da referência ficou limitada pela verificação de acesso. O TTLab implementa sua própria experiência, modelo e busca exaustiva. [Construtor de referência](https://rubbermetrics.com/pt-BR/racket-builder) · [Descoberta de referência](https://rubbermetrics.com/pt-BR/racket-builder/discover)


## Ambiente Codex no Windows

Use Git, Codex, Node.js LTS com npm, Google Chrome estável e Python 3 para a skill Webapp Testing. Abra o checkout no Codex. As skills e os MCPs são configurados no perfil do usuário e podem ser reutilizados em outros projetos.

### Skills

Confira o seletor de skills do Codex antes de instalar. Se faltar alguma, peça ao `$skill-installer` que instale o caminho correspondente no repositório oficial.

| Skill | Fonte oficial |
| --- | --- |
| `frontend-design` | [anthropics/skills · skills/frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) |
| `web-design-guidelines` | [vercel-labs/agent-skills · skills/web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) |
| `webapp-testing` | [anthropics/skills · skills/webapp-testing](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) |

Para os exemplos Python da skill Webapp Testing, confira `python -m pip show playwright` e `python -m playwright install --list`. Se faltar o pacote, instale com `python -m pip install playwright` no ambiente Python que usará para os testes. Se faltar o Chromium correspondente, execute `python -m playwright install chromium`.

### Servidores MCP

Comece com `codex mcp list`. Para cada servidor de navegador que estiver faltando, execute a linha correspondente no PowerShell. As versões abaixo foram verificadas na preparação do TTLab. Ambos os servidores abrem sessões isoladas em modo headless e usam o Chrome instalado na máquina.

```powershell
codex mcp add playwright -- cmd.exe /d /c npx -y '@playwright/mcp@0.0.86' --browser chrome --headless --isolated
codex mcp add chrome-devtools -- cmd.exe /d /c npx -y 'chrome-devtools-mcp@1.13.0' --headless --isolated --no-usage-statistics --no-performance-crux
```

Para usar a instância hospedada do Context7, adicione este bloco ao `~/.codex/config.toml` se o servidor ainda não estiver registrado. O acesso anônimo funciona para consultas públicas, sujeito aos limites do serviço. Se precisar de acesso autenticado, consulte as opções na documentação do fornecedor.

```toml
[mcp_servers.context7]
url = "https://mcp.context7.com/mcp"
```

Para configurar o REA, confira a versão existente com `rea --version` e os pré-requisitos da versão que pretende usar. Reutilize o REA quando já estiver instalado. Em um ambiente novo, siga o [guia oficial de instalação do REA](https://github.com/morluto/rea/blob/main/docs/getting-started/installation.md). Para registrar uma instalação existente apenas no Codex, revise o resultado de `rea setup --client codex --dry-run` e execute `rea setup --client codex`. Acrescente `--skill=false` aos dois comandos se a skill compatível já estiver instalada. Motores de análise nativa são opcionais para o trabalho com comportamento público de páginas.

Consulte a configuração e os parâmetros na documentação oficial do [Codex](https://developers.openai.com/codex/mcp), do [Playwright MCP](https://github.com/microsoft/playwright-mcp), do [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) e do [Context7](https://context7.com/docs/clients/codex).

### Verificação

1. Rode `codex mcp list` e confirme que `playwright`, `chrome-devtools`, `context7` e `rea` estão habilitados.
2. Reinicie o Codex Desktop e abra uma nova conversa para carregar os MCPs. As skills são detectadas automaticamente. Reinicie o Codex se alguma delas ainda não aparecer.
3. Peça ao Playwright MCP e ao Chrome DevTools MCP que abram uma página HTML de teste local e leiam seu título. Use o Context7 para consultar um exemplo de `browser.newContext` do Playwright. Rode `rea doctor --client codex` para conferir o registro do REA.

Execute também as suítes da seção de testes antes de publicar alterações na aplicação.
