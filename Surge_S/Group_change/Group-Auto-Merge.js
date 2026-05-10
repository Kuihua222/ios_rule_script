/**
 * @description 根据网络类型自动切换多组策略组节点（增强兼容版）
 */

// 1. 获取并清洗参数
const argument = $argument || "";
const args = argument.split(",").map(item => item.trim());

// 2. 环境判断
const isWifi = $network.wifi && $network.wifi.ssid;
const networkType = isWifi ? `Wi-Fi (${$network.wifi.ssid})` : "移动数据";
let successMessages = [];

// 3. 循环处理逻辑（步长为3）
// 每次取三个参数：[策略组, WiFi节点, 移动数据节点]
for (let i = 0; i < args.length; i += 3) {
  const groupName = args[i];
  const wifiNode = args[i + 1];
  const cellNode = args[i + 2];

  // 健壮性检查：只有三个参数都存在时才执行切换
  if (groupName && wifiNode && cellNode) {
    const targetNode = isWifi ? wifiNode : cellNode;
    
    // 执行切换
    $surge.setSelectGroupPolicy(groupName, targetNode);
    
    // 记录结果
    successMessages.push(`🔹 ${groupName} → ${targetNode}`);
  }
}

// 4. 统一弹窗通知
if (successMessages.length > 0) {
  $notification.post(
    "🔄 策略组网络自动切换",
    `当前环境：${networkType}`,
    successMessages.join("\n")
  );
} else if (argument === "") {
  $notification.post("⚠️ 自动切换脚本", "错误", "未检测到模块参数，请检查配置");
}

$done();
