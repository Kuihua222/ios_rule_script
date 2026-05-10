/**
 * @description 根据网络类型自动切换多组策略组节点（单弹窗整合版）
 */

// Surge argument 解析，去除空格
const args = ($argument || "").split(",").map(item => item.trim());

const isWifi = $network.wifi && $network.wifi.ssid;
// 加入 SSID 让通知更清晰
const networkType = isWifi ? `Wi-Fi (${$network.wifi.ssid})` : "移动数据"; 
let messages = [];

// 遍历参数，每 3 个为一组 (Group, WifiNode, CellNode)
for (let i = 0; i < args.length; i += 3) {
  const group = args[i];
  const wifiNode = args[i + 1];
  const cellNode = args[i + 2];

  // 如果参数不完整（比如第二组没填），则跳过该组，这样默认就只执行填了的一组
  if (!group || !wifiNode || !cellNode) continue; 

  const targetNode = isWifi ? wifiNode : cellNode;
  
  // 执行策略切换
  $surge.setSelectGroupPolicy(group, targetNode);
  
  // 收集通知信息
  messages.push(`"${group}" → "${targetNode}"`);
}

// 只要有成功切换的策略组，就发送一条合并的弹窗
if (messages.length > 0) {
  $notification.post(
    "🔄 策略组自动切换",
    `已接入 ${networkType}`,
    messages.join("\n")
  );
}

$done();
