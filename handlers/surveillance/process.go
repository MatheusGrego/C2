package surveillance

import (
	"encoding/json"
	"sort"

	"github.com/shirou/gopsutil/v3/process"
)

// ProcessInfo contém informações de um processo
type ProcessInfo struct {
	PID  int32   `json:"pid"`
	Name string  `json:"name"`
	CPU  float64 `json:"cpu"`
	Mem  uint64  `json:"mem_mb"`
}

// ProcessListHandler lista processos em execução
// Retorna JSON com lista de processos ordenados por uso de memória
func ProcessListHandler(params []interface{}) (string, error) {
	procs, err := process.Processes()
	if err != nil {
		return "", err
	}

	var list []ProcessInfo
	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			name = "<unknown>"
		}

		cpuPercent, _ := p.CPUPercent()

		var memMB uint64
		memInfo, err := p.MemoryInfo()
		if err == nil && memInfo != nil {
			memMB = memInfo.RSS / 1024 / 1024
		}

		list = append(list, ProcessInfo{
			PID:  p.Pid,
			Name: name,
			CPU:  cpuPercent,
			Mem:  memMB,
		})
	}

	// Ordenar por memória (maior primeiro)
	sort.Slice(list, func(i, j int) bool {
		return list[i].Mem > list[j].Mem
	})

	// Serializar como JSON formatado
	output, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return "", err
	}

	return string(output), nil
}

// GetProcessByName retorna processos que correspondem ao nome
func GetProcessByName(name string) ([]ProcessInfo, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	var matches []ProcessInfo
	for _, p := range procs {
		pName, _ := p.Name()
		if pName == name {
			cpuPercent, _ := p.CPUPercent()

			var memMB uint64
			memInfo, _ := p.MemoryInfo()
			if memInfo != nil {
				memMB = memInfo.RSS / 1024 / 1024
			}

			matches = append(matches, ProcessInfo{
				PID:  p.Pid,
				Name: pName,
				CPU:  cpuPercent,
				Mem:  memMB,
			})
		}
	}

	return matches, nil
}
