package com.sentinel.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HeartbeatDTO {

    private String hwid;
    
    private String hostname;
    
    @JsonProperty("os_info")
    private String osInfo;
    
    @JsonProperty("ip_local")
    private String ipLocal;
    
    @JsonProperty("cpu_load")
    private Double cpuLoad;
    
    @JsonProperty("ram_usage")
    private Long ramUsage;
    
    @JsonProperty("active_window")
    private String activeWindow;
}
