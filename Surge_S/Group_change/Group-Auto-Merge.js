/**
 * @description 根据网络类型自动切换多组策略组节点（多组扩展整合版）
 */

// 解析参数并过滤掉可能存在的空项（防止空逗号导致的偏移）
const args = ($argument || "").split(",").map(item => item.trim());

const isWifi = $network.wifi && $network.wifi.ssid;
const networkType = isWifi ? `Wi-Fi (${$network.wifi.ssid})` : "移动数据"; 
let messages = [];

// 依然保持每 3 个一组的逻辑 (Group, WifiNode, CellNode)
for (let i = 0; i < args.length; i += 3) {
  const group = args[i];
  const wifiNode = args[i + 1];
  const cellNode = args[i + 2];

  // 核心逻辑：只要这一组的“策略组名”为空，就视为该组未配置，跳过
  if (!group || group === "") continue; 

  const targetNode = isWifi ? wifiNode : cellNode;
  
  // 执行切换
  $surge.setSelectGroupPolicy(group, targetNode);
  
  // 收集信息：例如 "Proxy" → "HK-01"
  messages.push(`"${group}" ➔ ${targetNode}`);
}

// 统一推送通知
if (messages.length > 0) {
  $notification.post(
    "🔄 策略组自动切换",
    `当前环境: ${networkType}`,
    messages.join("\n")
  );
}

$done();
