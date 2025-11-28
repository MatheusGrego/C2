# 🔨 SENTINEL C2 - BUILD GUIDE

## 📋 Duas Abordagens de Build

### ✅ **Opção 1: Build com Nome Legítimo (RECOMENDADO)**

Compila o binário JÁ com nome legítimo, evitando renomeação em runtime.

```cmd
build_stealth_named.bat
```

**Vantagens:**
- ✅ Processo aparece com nome legítimo **IMEDIATAMENTE**
- ✅ Sem renomeação em runtime (mais furtivo)
- ✅ Task Manager mostra nome legítimo
- ✅ Nenhum traço de "sentinel.exe"

**Desvantagens:**
- ❌ Precisa escolher nome manualmente

---

### ⚙️ **Opção 2: Build Padrão com Auto-Renomeação**

Compila como `sentinel.exe`, mas renomeia automaticamente na primeira execução.

```cmd
build_advanced.bat
```

**Como funciona:**
1. Compila como `sentinel.exe`
2. **Primeira execução:**
   - Detecta nome suspeito
   - Copia para nome legítimo aleatório
   - Executa nova cópia
   - Deleta `sentinel.exe` original
3. **Segunda execução em diante:**
   - Já está com nome legítimo
   - Nenhuma renomeação necessária

**Vantagens:**
- ✅ Automático (escolhe nome aleatório)
- ✅ Funciona mesmo se você esquecer de renomear

**Desvantagens:**
- ❌ Por ~2 segundos aparece como "sentinel.exe" no Task Manager
- ❌ Ligeiramente menos furtivo

---

## 🎯 Comparação Lado a Lado

| Aspecto | Opção 1 (Named) | Opção 2 (Auto-Rename) |
|---------|----------------|----------------------|
| **Nome no Task Manager** | ✅ Legítimo desde início | ⚠️ "sentinel.exe" por 2s |
| **Detecção por Nome** | ✅ Zero suspeita | ⚠️ Breve janela de detecção |
| **Facilidade** | ⚠️ Manual | ✅ Automático |
| **Stealth Score** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Recomendado para** | Pentests profissionais | Testes rápidos |

---

## 🚀 Guia Passo a Passo

### **Método 1: Build com Nome Legítimo**

1. Execute o script:
   ```cmd
   build_stealth_named.bat
   ```

2. Escolha um nome:
   ```
   [1] OneDriveUpdate.exe
   [2] WindowsHealthCheck.exe
   [3] MicrosoftEdgeUpdate.exe
   ... etc
   ```

3. Aguarde compilação

4. Resultado:
   ```
   [+] Binary: OneDriveUpdate.exe
   [+] Size: 8945 KB
   [+] Process Name: OneDriveUpdate.exe
   ```

5. **Deploy:**
   - Copie `OneDriveUpdate.exe` para o alvo
   - **NÃO renomeie de volta para sentinel.exe**
   - Execute

6. **Task Manager mostrará:**
   ```
   Name: OneDriveUpdate.exe
   Status: Running
   ```

---

### **Método 2: Build Padrão com Auto-Renomeação**

1. Execute:
   ```cmd
   build_advanced.bat
   ```

2. Resultado:
   ```
   [+] Binary: sentinel.exe
   ```

3. **Deploy:**
   - Copie `sentinel.exe` para o alvo
   - Execute

4. **O que acontece (primeira execução):**
   ```
   [1] Processo inicia como "sentinel.exe"
   [2] Detecta nome suspeito
   [3] Copia para "GoogleUpdateTask.exe" (aleatório)
   [4] Executa nova cópia
   [5] Deleta "sentinel.exe"
   [6] Processo agora é "GoogleUpdateTask.exe"
   ```

5. **Task Manager mostrará (após 2 segundos):**
   ```
   Name: GoogleUpdateTask.exe
   Status: Running
   ```

---

## 📝 Nomes Legítimos Disponíveis

```
OneDriveUpdate.exe           - Atualização do OneDrive
WindowsHealthCheck.exe       - Verificação de saúde do Windows
MicrosoftEdgeUpdate.exe      - Atualização do Edge
AdobeUpdateService.exe       - Serviço de atualização Adobe
GoogleUpdateTask.exe         - Task de atualização Google
NvidiaDriverUpdate.exe       - Atualização de driver Nvidia
RealtekAudioService.exe      - Serviço de áudio Realtek
IntelGraphicsUpdate.exe      - Atualização de gráficos Intel
SystemTelemetryService.exe   - Telemetria do sistema
WindowsDefenderScheduler.exe - Agendador do Defender
```

**Critérios de seleção:**
- ✅ Nomes que **parecem atualizações** (usuário ignora)
- ✅ Nomes de **marcas conhecidas** (confiança)
- ✅ Nomes **genéricos** do sistema (não chama atenção)

---

## 🔍 Verificação de Stealth

### Após o Build

```bash
# 1. Verificar nome do arquivo
ls -lh GoogleUpdateTask.exe
# ✅ Nome legítimo

# 2. Verificar strings vazadas
strings GoogleUpdateTask.exe | grep -i "sentinel"
# ✅ Nenhum resultado (se usou Garble)

# 3. Verificar imports suspeitos
dumpbin /imports GoogleUpdateTask.exe
# ✅ Poucas imports (devido a Dynamic API Resolution)
```

### Durante Execução

```
Task Manager → Processos → Encontrar "GoogleUpdateTask.exe"
Clique direito → Properties
```

**Verificações:**
- ✅ Nome: GoogleUpdateTask.exe
- ✅ Descrição: (vazia)
- ✅ Company: (vazia)
- ✅ Não parece suspeito

---

## ⚠️ Considerações Importantes

### 1. Persistência Mantém o Nome
Quando o agente instala persistência:
- ✅ Copia para local de persistência com MESMO nome legítimo
- ✅ Registry entry usa nome legítimo
- ✅ Scheduled Task usa nome legítimo

**Exemplo:**
```
Registry: HKCU\...\Run
Nome: "GoogleUpdateTask"
Valor: "C:\Users\...\GoogleUpdateTask.exe"
```

### 2. Migração Polimórfica
Ao migrar (Melt & Move):
- ✅ Escolhe NOVO nome legítimo aleatório
- ✅ Copia para nova localização
- ✅ Atualiza persistência

**Exemplo de migração:**
```
Localização 1: ...\Temp\GoogleUpdateTask.exe
    ↓ (6 horas depois)
Localização 2: ...\Cache\NvidiaDriverUpdate.exe
    ↓ (8 horas depois)
Localização 3: ...\Recent\WindowsHealthCheck.exe
```

### 3. Auto-Deleção
Se usar Opção 2 (auto-rename):
- ✅ `sentinel.exe` é deletado automaticamente
- ✅ Usa comando CMD oculto com delay
- ✅ Nenhum rastro do nome original

---

## 🎯 Qual Método Usar?

### Use **Opção 1 (Named)** se:
- ✅ Pentest profissional
- ✅ Red Team operation
- ✅ Precisa de máxima furtividade
- ✅ Vai monitorar em tempo real (Task Manager)
- ✅ Alvo tem EDR avançado

### Use **Opção 2 (Auto-Rename)** se:
- ✅ Testes rápidos
- ✅ CTF ou competições
- ✅ Não vai monitorar em tempo real
- ✅ Alvo não tem EDR (só AV)
- ✅ Quer automação

---

## 🛡️ Defesa (Blue Team Perspective)

### Como Detectar
```powershell
# 1. Processos com nomes legítimos mas caminhos suspeitos
Get-Process | Where-Object {
    $_.Name -match "Update|Service|Health" -and
    $_.Path -notmatch "Program Files|Windows"
}

# 2. Verificar assinatura digital
Get-AuthenticodeSignature GoogleUpdateTask.exe
# Real: Assinado pela Microsoft/Google/etc
# Fake: Unsigned ou self-signed

# 3. Verificar metadata do arquivo
Get-Item GoogleUpdateTask.exe | Select-Object *
# Real: Tem VersionInfo, Company, Description
# Fake: Tudo vazio
```

### Como Bloquear
- ✅ Application Whitelisting (AppLocker)
- ✅ Code Signing enforcement
- ✅ Behavioral detection (EDR)
- ✅ Process tree analysis

---

## 📊 Resumo Final

```
┌────────────────────────────────────────────────────┐
│  MÉTODO 1: build_stealth_named.bat                 │
│  ✅ Nome legítimo desde o início                   │
│  ✅ Máxima furtividade                             │
│  ⚠️ Escolha manual de nome                        │
│                                                     │
│  MÉTODO 2: build_advanced.bat                      │
│  ✅ Automático                                      │
│  ✅ Renomeação em runtime                          │
│  ⚠️ Breve janela de detecção (2s)                  │
└────────────────────────────────────────────────────┘
```

**Recomendação:** Use **Método 1** para produção, **Método 2** para testes.

---

**Build com inteligência. Deploy com cautela. Operate with stealth.** 🥷
