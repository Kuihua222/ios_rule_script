/**
 * @description 根据网络类型自动切换策略组节点（支持参数）
 */

// Surge argument 解析
const args = ($argument || "").split(",");

const GROUP = args[0] || "♾️";
const WIFI_NODE = args[1] || "VPS";
const CELLULAR_NODE = args[2] || "VPS2Free";

if ($network.wifi && $network.wifi.ssid) {
  $surge.setSelectGroupPolicy(GROUP, WIFI_NODE);
  $notification.post(
    "Group-Auto",
    "已接入 Wi-Fi",
    `策略组 "${GROUP}" → "${WIFI_NODE}"`
  );
} else {
  $surge.setSelectGroupPolicy(GROUP, CELLULAR_NODE);
  $notification.post(
    "Group-Auto",
    "已接入移动数据",
    `策略组 "${GROUP}" → "${CELLULAR_NODE}"`
  );
}

$done();
