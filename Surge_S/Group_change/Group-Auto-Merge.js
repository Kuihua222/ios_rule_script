/**
 * @description 根据网络类型自动切换多组策略组节点（增加防抖与状态记忆）
 */

const args = ($argument || "").split(",").map(item => item.trim());

// 获取当前瞬时的网络状态标识
const getNetworkState = () => {
  const isWifi = $network.wifi && $network.wifi.ssid;
  return isWifi ? $network.wifi.ssid : "Cellular";
};

const initialNetworkState = getNetworkState();

// 1. 读取上一次成功切换的网络状态，避免重复触发
const lastNetworkState = $persistentStore.read("LAST_NETWORK_STATE");

if (initialNetworkState === lastNetworkState) {
  // 如果网络状态未发生实质改变（即波动后又恢复了原来的网络），直接结束
  $done();
} else {
  // 2. 延迟等待网络稳定（例如等待 3 秒）
  // 注意：Surge 脚本默认超时时间是 5 秒。如果这里设置大于 5 秒，需在配置中加 timeout=10
  setTimeout(() => {
    const currentNetworkState = getNetworkState();
    
    // 3. 再次确认网络状态，如果这几秒内网络又变了，说明是持续不稳定波动，放弃本次切换
    if (currentNetworkState !== initialNetworkState) {
      $done();
      return;
    }

    // 网络已稳定，记录最新状态到持久化存储
    $persistentStore.write(currentNetworkState, "LAST_NETWORK_STATE");

    const isWifi = $network.wifi && $network.wifi.ssid;
    const networkType = isWifi ? `Wi-Fi (${currentNetworkState})` : "移动数据";
    let messages = [];

    // 执行分组切换逻辑
    for (let i = 0; i < args.length; i += 3) {
      const group = args[i];
      const wifiNode = args[i + 1];
      const cellNode = args[i + 2];

      if (!group || group === "") continue;

      const targetNode = isWifi ? wifiNode : cellNode;
      $surge.setSelectGroupPolicy(group, targetNode);
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
  }, 3000); // 延迟 3000 毫秒（3 秒），可根据你的实际情况调整
}