/**
 * @description 根据网络类型自动切换策略组节点并发送通知
 */

const GROUP = '♾️';            // 请替换为你的策略组名称
const WIFI_NODE = 'VPS';           // Wi-Fi 时要切换到的节点名称
const CELLULAR_NODE = 'VPS2Free';   // 移动数据时要切换到的节点名称

if ($network.wifi && $network.wifi.ssid) {
  // 当前接入 Wi-Fi
  $surge.setSelectGroupPolicy(GROUP, WIFI_NODE);
  $notification.post('Surge', '已接入 Wi-Fi', `策略组 "${GROUP}" 已切换至节点 "${WIFI_NODE}"`);
} else {
  // 当前接入移动数据
  $surge.setSelectGroupPolicy(GROUP, CELLULAR_NODE);
  $notification.post('Surge', '已接入 移动数据', `策略组 "${GROUP}" 已切换至节点 "${CELLULAR_NODE}"`);
}

$done();