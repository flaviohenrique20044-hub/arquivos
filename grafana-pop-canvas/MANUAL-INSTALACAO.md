# Manual de instalação do POP Canvas

O POP Canvas é um painel para Grafana 12. Cada cartão reúne dois indicadores e uma série temporal. O pacote neste repositório já está compilado. A versão 1.0.0 foi testada no Grafana 12.4.12 com dados do Prometheus.

## 1. Baixar o plugin

Em um terminal com Git e acesso a este repositório privado, execute:

```sh
git clone https://github.com/flaviohenrique20044-hub/arquivos.git
cd arquivos/grafana-pop-canvas
```

Os arquivos a instalar estão em [plugins/poplab-popcanvas-panel](plugins/poplab-popcanvas-panel). Você deve ter acesso administrativo ao servidor do Grafana ou ao arquivo Compose que controla o serviço.

## 2. Instalar no servidor de destino

### Linux com serviço systemd

Descubra o diretório de plugins configurado em `[paths] plugins` ou em `GF_PATHS_PLUGINS`. Em instalações Linux por pacote, normalmente é `/var/lib/grafana/plugins`.

```sh
sudo sh install.sh /var/lib/grafana/plugins
```

O script cria uma pasta própria e interrompe a operação se ela já existir. Em uma instalação por pacote, edite o arquivo ativo, normalmente `/etc/grafana/grafana.ini`. Em `[plugins]`, acrescente o ID à lista de plugins sem assinatura. Se já houver entradas, separe os IDs por vírgula.

```ini
[plugins]
allow_loading_unsigned_plugins = poplab-popcanvas-panel
```

Reinicie o serviço uma vez. Para uma instância em funcionamento, faça isso na janela de manutenção escolhida para o ambiente.

```sh
sudo systemctl restart grafana-server
sudo systemctl is-active grafana-server
```

### Docker Compose

No Compose da instância de destino, acrescente a montagem e o ID ao serviço Grafana. Este exemplo assume que o repositório foi clonado para uma subpasta ao lado do arquivo Compose. Mantenha os volumes e as variáveis que já existem e, se a lista de plugins sem assinatura já tiver IDs, acrescente o novo separado por vírgula.

```yaml
services:
  grafana:
    environment:
      GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS: "poplab-popcanvas-panel"
    volumes:
      - ./arquivos/grafana-pop-canvas/plugins/poplab-popcanvas-panel:/var/lib/grafana/plugins/poplab-popcanvas-panel:ro
```

Adapte o caminho do host e o nome do serviço ao seu projeto. Recrie somente o serviço Grafana para aplicar a montagem e a variável.

```sh
docker compose up -d --no-deps grafana
docker compose logs --tail=80 grafana
```

### Windows

De dentro de `arquivos\grafana-pop-canvas`, ajuste o caminho para o diretório real de plugins e copie os arquivos pelo PowerShell. O exemplo interrompe se já existir uma instalação com o mesmo ID.

```powershell
$plugins = 'C:\caminho\do\grafana\data\plugins'
$destino = Join-Path $plugins 'poplab-popcanvas-panel'
if (Test-Path -LiteralPath $destino) { throw 'O POP Canvas já existe nesse diretório.' }
Copy-Item -LiteralPath '.\plugins\poplab-popcanvas-panel' -Destination $destino -Recurse
```

Acrescente o ID a `allow_loading_unsigned_plugins` na seção `[plugins]` do arquivo de configuração ativo, normalmente `conf\custom.ini`. Se a instalação usa uma variável de ambiente para essa lista, atualize `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS`. Reinicie pelo gerenciador de serviços ou pelo mesmo mecanismo que iniciou o Grafana.

A configuração autoriza especificamente o ID `poplab-popcanvas-panel`. O pacote é sem assinatura e se destina ao Grafana autogerenciado. [Configuração do Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#allow_loading_unsigned_plugins) · [Política de assinaturas](https://grafana.com/docs/grafana/latest/administration/plugin-management/plugin-sign/)

## 3. Criar o primeiro cartão com Zabbix

1. No Grafana de destino, configure a [fonte de dados Zabbix](https://grafana.com/docs/plugins/alexanderzobnin-zabbix-app/latest/configure/) e faça **Save & test**. Use uma conta com permissão de leitura nos grupos dos hosts que serão exibidos.
2. Em uma dashboard, escolha **Add visualization**, selecione a fonte **Zabbix** e troque a visualização para **POP Canvas**.
3. Configure as consultas A, B e C. Em cada consulta, selecione o grupo, o host e o item correspondentes ao POP. Cada consulta deve retornar uma série numérica com horário.

| Consulta | Item esperado | Configuração no cartão |
| --- | --- | --- |
| **A** | Estado do roteador, por exemplo um item ICMP | **UP = 1**, **DOWN = 0** se essa for a convenção do item |
| **B** | Estado da rede elétrica | Se o sensor devolve `0` para rede presente e `1` para em bateria, use **UP = 0**, **DOWN = 1** |
| **C** | Tensão do banco de baterias | Título **Tensão do banco** e unidade **V** |

O campo de unidade só muda a apresentação. Se o item retorna milivolts, converta o valor na consulta ou no pré-processamento do Zabbix antes de usar a unidade V. Ajuste a validade dos indicadores para cobrir o intervalo real de coleta e seus atrasos esperados. **N/D** indica que o cartão não tem uma leitura válida para aquele indicador.

Valide cada item no **Explore** antes de duplicar o cartão. Os nomes dos itens e a lógica de estados dependem dos sensores na instância de destino.

## 4. Importar uma dashboard

Abra **Dashboards → New → Import** e carregue o JSON desejado.

- [Dashboard TV](dashboards/tv.json) contém 32 cartões em oito colunas e quatro linhas. Em cada cartão, troque a fonte para **Zabbix**, cadastre A, B e C e salve.
- [Dashboard Laboratório POP](dashboards/laboratorio.json) é o exemplo original com Prometheus. Usa a fonte de UID `pop-prom` e [consultas ICMP específicas do laboratório](consultas.promql). Para usar Zabbix, selecione a fonte Zabbix e crie novamente as três consultas com os itens dos seus hosts.

## 5. Conferir e reverter

- Se **POP Canvas** não aparecer, confira o log de inicialização e verifique se `plugin.json`, `module.js` e `icon.svg` estão diretamente em `<diretório-de-plugins>/poplab-popcanvas-panel/`.
- Se aparecer **N/D**, confira no **Explore** o valor numérico, o horário da amostra e os valores UP e DOWN configurados. Para **Sem histórico**, verifique se C retorna pontos no período da dashboard.
- Para reverter a instalação, mova apenas a pasta `poplab-popcanvas-panel` para fora do diretório de plugins ou remova sua montagem no Compose. Remova esse ID da lista de exceções e reinicie o Grafana. Exporte antes as dashboards que deseja guardar, pois os cartões dependem do plugin para renderizar.
