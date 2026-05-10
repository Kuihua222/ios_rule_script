/**
 * @description 根据网络类型自动切换多组策略组节点（单弹窗整合版）
 */

// Surge argument 解析，去除空格
const args = $argument || "";
const isWifi = $network.wifi && $network.wifi.ssid;
const networkType = isWifi ? `Wi-Fi (${$network.wifi.ssid})` : "移动数据"; 
let messages = [];

// 先用分号拆分出不同的组别
const groups = args.split(";").map(item => item.trim());

for (let groupStr of groups) {
  if (!groupStr) continue;
  
  // 再用逗号拆分出 组名, Wifi节点, 流量节点
  const [group, wifiNode, cellNode] = groupStr.split(",").map(item => item.trim());
  
  if (!group || !wifiNode || !cellNode) continue;

  const targetNode = isWifi ? wifiNode : cellNode;
  $surge.setSelectGroupPolicy(group, targetNode);
  messages.push(`"${group}" → "${targetNode}"`);
}

if (messages.length > 0) {
  $notification.post("🔄 策略组自动切换", `已接入 ${networkType}`, messages.join("\n"));
}
$done();
