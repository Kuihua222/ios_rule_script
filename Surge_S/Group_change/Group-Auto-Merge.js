/**
 * @description 根据网络类型自动切换多组策略组节点
 * @author Kuihua
 *
 * 功能：
 * 1. 支持最多 3 组策略组自动切换
 * 2. Wi-Fi 与蜂窝自动选择不同节点
 * 3. 防抖机制（Delay 可调）
 * 4. 状态记忆，避免重复切换
 * 5. 单次通知
 */

const argument = $argument || "";

/**
 * argument 格式：
 * Delay|G1,W1,C1|G2,W2,C2|G3,W3,C3
 */

const sections = argument.split("|");

// Delay
const delaySeconds = Math.max(
  parseFloat(sections[0]) || 2,
  0
);

// 三组配置
const groups = sections.slice(1);

/**
 * 获取当前网络状态
 */
function getNetworkState() {
  const isWifi = $network.wifi && $network.wifi.ssid;
  return isWifi ? $network.wifi.ssid : "Cellular";
}

const initialNetworkState = getNetworkState();

const lastNetworkState = $persistentStore.read(
  "LAST_NETWORK_STATE"
);

// 网络未变化，直接退出
if (initialNetworkState === lastNetworkState) {
  $done();
} else {

  setTimeout(() => {

    // 再次确认网络是否稳定
    const currentNetworkState = getNetworkState();

    if (currentNetworkState !== initialNetworkState) {
      $done();
      return;
    }

    // 写入状态
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

    const messages = [];

    groups.forEach(item => {

      if (!item) return;

      const [
        group,
        wifiNode,
        cellNode
      ] = item
        .split(",")
        .map(v => (v || "").trim());

      // 未配置则跳过
      if (!group) return;

      const targetNode = isWifi
        ? wifiNode
        : cellNode;

      // 节点为空则跳过
      if (!targetNode) return;

      try {

        $surge.setSelectGroupPolicy(
          group,
          targetNode
        );

        messages.push(
          `"${group}" → ${targetNode}`
        );

      } catch (e) {

        console.log(
          `[Group-Auto-Merge] 切换失败：${group} → ${targetNode}`
        );
      }
    });

    // 通知
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