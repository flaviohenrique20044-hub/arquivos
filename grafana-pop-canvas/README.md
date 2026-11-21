# POP Canvas para Grafana 12

Painel com dois indicadores de estado e uma série temporal no mesmo cartão. Inclui o fonte, o plugin compilado e duas dashboards importáveis.

## Instalação pelo terminal

Clone o repositório privado com uma conta que tenha acesso. O plugin já vem compilado.

```sh
git clone https://github.com/flaviohenrique20044-hub/arquivos.git
cd arquivos/grafana-pop-canvas
sudo sh install.sh /var/lib/grafana/plugins
```

O caminho acima é o padrão em várias instalações Linux. Se o Grafana usa Docker, aponte para o diretório do volume de plugins no host ou monte a pasta `plugins/poplab-popcanvas-panel` dentro do diretório de plugins do contêiner.

No Windows, a partir da mesma pasta, execute `Copy-Item -Recurse .\plugins\poplab-popcanvas-panel 'C:\caminho\para\plugins'` no PowerShell. Use o diretório de plugins configurado na sua instância.

O pacote é sem assinatura. Na seção `[plugins]` da configuração do Grafana, acrescente este ID à lista existente de `allow_loading_unsigned_plugins`:

```ini
[plugins]
allow_loading_unsigned_plugins = poplab-popcanvas-panel
```

Em Docker, use `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS` com o mesmo ID. Preserve eventuais IDs anteriores e reinicie o Grafana uma vez para aparecer **POP Canvas** no seletor de visualizações.

## Dashboards

- `dashboards/tv.json` contém 32 cartões com espaços para as consultas dos sensores.
- `dashboards/laboratorio.json` demonstra consultas ICMP e pressupõe um Prometheus com as métricas documentadas em `consultas.promql`. Os JSONs apontam para a fonte de UID `pop-prom`. Se a sua fonte usa outro UID, selecione-a após importar e revise as expressões.

No editor do painel, configure **A** para o roteador, **B** para energia e **C** para o histórico. Para um sensor de energia invertido, use **UP = 0** e **DOWN = 1** em B.

O código-fonte está em `pop-canvas/src`. Para recompilar, execute `node pop-canvas/build.mjs /caminho/para/esbuild` com Node e esbuild 0.25.12.
