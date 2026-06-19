/**
 * @description 根据网络类型自动切换多组策略组节点
 * @author Kuihua
 *
 * 功能：
 * 1. 支持最多 3 组策略组自动切换
 * 2. Wi-Fi 与蜂窝数据自动选择不同节点
 * 3. 防抖机制：等待网络稳定后再切换
 * 4. 状态记忆：避免重复切换与重复通知
 * 5. Delay 可在 Surge 模块面板中调整，默认 2 秒
 */

const rawArgs = ($argument || "")
  .split(",")
  .map(item => item.trim());

// 最后一个参数为 Delay（秒）
const delaySeconds = Math.max(parseFloat(rawArgs.pop()) || 2, 0);

// 剩余参数为策略组配置
const args = rawArgs;

// 获取当前网络状态
function getNetworkState() {
  const isWifi = $network.wifi && $network.wifi.ssid;
  return isWifi ? $network.wifi.ssid : "Cellular";
}

// 当前瞬时网络状态
const initialNetworkState = getNetworkState();

// 上一次已成功切换的网络状态
const lastNetworkState = $persistentStore.read("LAST_NETWORK_STATE");

// 网络状态未变化，直接退出
if (initialNetworkState === lastNetworkState) {
  $done();
} else {

  // 延迟等待网络稳定
  setTimeout(() => {

    // 再次确认网络状态
    const currentNetworkState = getNetworkState();

    // 如果等待期间网络再次变化，认为仍在抖动，放弃本次切换
    if (currentNetworkState !== initialNetworkState) {
      $done();
      return;
    }

    // 写入新的稳定网络状态
    $persistentStore.write(
      currentNetworkState,
      "LAST_NETWORK_STATE"
    );

    const isWifi =
      $network.wifi &&
      $network.wifi.ssid;

    const networkType = isWifi
      ? `Wi-Fi (${currentNetworkState})`
      : "移动数据";

    let messages = [];

    // 每三个参数为一组
    for (let i = 0; i < args.length; i += 3) {

      const group = args[i];
      const wifiNode = args[i + 1];
      const cellNode = args[i + 2];

      // 未配置则跳过
      if (!group) continue;

      const targetNode = isWifi
        ? wifiNode
        : cellNode;

      // 节点为空则跳过
      if (!targetNode) continue;

      try {
        $surge.setSelectGroupPolicy(
          group,
          targetNode
        );

        messages.push(
          `"${group}" ➔ ${targetNode}`
        );

      } catch (e) {
        console.log(
          `[Group-Auto-Merge] 切换失败: ${group} -> ${targetNode}`
        );
      }
    }

    // 统一通知
    if (messages.length > 0) {
      $notification.post(
        "🔄 策略组自动切换",
        `当前环境：${networkType}`,
        messages.join("\n")
      );
    }

    $done();

  }, delaySeconds * 1000);
}