/**
 * @description 根据网络类型自动切换多组策略组节点（增加防抖与状态记忆）
 */

const args = ($argument || "").split(",").map(item => item.trim());

// 读取延迟时间（毫秒），默认 3000
const delay = parseInt(args[9], 10) || 3000;

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
  // 2. 延迟等待网络稳定
  // 注意：Surge 脚本默认超时时间是 5 秒。
  // 如果 D 设置超过 5000，请确保 Script 的 timeout 足够大。
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
    const networkType = isWifi
      ? `Wi-Fi (${currentNetworkState})`
      : "移动数据";

    let messages = [];

    // 执行分组切换逻辑
    for (let i = 0; i < 9; i += 3) {
      const group = args[i];
      const wifiNode = args[i + 1];
      const cellNode = args[i + 2];

      if (!group || group === "") continue;

      const targetNode = isWifi ? wifiNode : cellNode;

      $surge.setSelectGroupPolicy(group, targetNode);

      messages.push(`"${group}"→ ${targetNode}`);
    }

    // 显示当前配置的延迟时间
    messages.push(`"⌛️"→ ${delay / 1000}s`);

    // 统一推送通知
    if (messages.length > 0) {
      $notification.post(
        "🔄 策略组自动切换",
        `当前环境: ${networkType}`,
        messages.join("\n")
      );
    }

    $done();
  }, delay);
}