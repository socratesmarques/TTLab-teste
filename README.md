# TTLab

O TTLab é uma plataforma de tênis de mesa em fase de preparação do ambiente de desenvolvimento.

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

Nesta etapa, a verificação do repositório consiste em `git diff --check` e `git status --short`. Os testes dos MCPs podem ser feitos com páginas e arquivos temporários.
