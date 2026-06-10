/**
 * Egern 通用脚本：面板显示 + 网络自动切换
 * 通过 $argument 传入 JSON 参数，格式示例：
 * {
 *   "type": "panel" | "network",    // 调用方式
 *   "G1": "♾️",  "W1": "VPS",  "C1": "VPS2Free",
 *   "G2": "",    "W2": "",     "C2": "",
 *   "G3": "",    "W3": "",     "C3": ""
 * }
 * 
 * 注意：当 type=network 时，参数可从 $argument 读取（模块已合并）
 * 当 type=panel  时，也需要传入相同的 G1/W1/C1... 参数，或复用模块参数。
 * 这里为了简单，统一从 $argument 中获取所有参数。
 */

// ---------- 工具函数 ----------
const getNetworkState = () => {
  // Egern 中网络信息位于 $network 或 $context.device
  // 优先使用 $context.device（更可靠）
  if ($context && $context.device && $context.device.wifi) {
    return $context.device.wifi.ssid || "Cellular";
  }
  // 备选：$network 对象（Surge 兼容）
  if ($network && $network.wifi && $network.wifi.ssid) {
    return $network.wifi.ssid;
  }
  return "Cellular";
};

const getNetworkType = () => {
  const ssid = getNetworkState();
  return ssid === "Cellular" ? "移动数据" : `Wi-Fi (${ssid})`;
};

// 解析传入参数（$argument 应是 JSON 字符串）
const parseArgs = () => {
  try {
    const argObj = JSON.parse($argument || "{}");
    return {
      type: argObj.type || "network",      // 脚本用途
      groups: [
        { group: argObj.G1, wifi: argObj.W1, cell: argObj.C1 },
        { group: argObj.G2, wifi: argObj.W2, cell: argObj.C2 },
        { group: argObj.G3, wifi: argObj.W3, cell: argObj.C3 }
      ].filter(g => g.group && g.group !== "")   // 过滤空策略组
    };
  } catch (e) {
    $notification.post("❌ 参数错误", "请检查模块 argument", e.message);
    return { type: "network", groups: [] };
  }
};

// 执行策略组切换
const switchGroups = (groups) => {
  const isWifi = getNetworkState() !== "Cellular";
  const messages = [];
  for (const g of groups) {
    const targetNode = isWifi ? g.wifi : g.cell;
    if (targetNode && targetNode !== "") {
      $surge.setSelectGroupPolicy(g.group, targetNode);
      messages.push(`"${g.group}" ➔ ${targetNode}`);
    }
  }
  return messages;
};

// 获取当前所有策略组的实际节点（用于面板显示）
const getCurrentPolicies = (groups) => {
  const status = [];
  for (const g of groups) {
    const current = $surge.getSelectGroupPolicy(g.group);
    status.push(`${g.group}: ${current}`);
  }
  return status.join("\n");
};

// ---------- 面板内容生成 ----------
const generatePanel = (groups) => {
  const networkType = getNetworkType();
  const policies = getCurrentPolicies(groups);
  const panel = {
    title: "📡 网络策略组",
    content: `当前网络: ${networkType}\n\n${policies}`,
    icon: "antenna.radiowaves.left.and.right",
    "icon-color": "#4A90E2",
    actions: [
      {
        title: "🔄 手动刷新/切换",
        "script-path": "inline",   // 调用同一个脚本，但触发网络切换逻辑
        argument: JSON.stringify({ type: "network", ...JSON.parse($argument || "{}") }),
        action: "network-changed"
      }
    ]
  };
  return panel;
};

// ---------- 网络切换主逻辑（带防抖） ----------
const onNetworkChanged = (groups) => {
  const nowNetwork = getNetworkState();
  const lastNetwork = $persistentStore.read("LAST_NETWORK_STATE");

  if (nowNetwork === lastNetwork) {
    $done();  // 状态未变，退出
    return;
  }

  // 防抖：等待 3 秒，若网络再次变化则放弃本次切换
  setTimeout(() => {
    const stableNetwork = getNetworkState();
    if (stableNetwork !== nowNetwork) {
      $done();
      return;
    }
    $persistentStore.write(stableNetwork, "LAST_NETWORK_STATE");
    const messages = switchGroups(groups);
    if (messages.length > 0) {
      $notification.post(
        "🔄 策略组已自动切换",
        `当前环境: ${getNetworkType()}`,
        messages.join("\n")
      );
    }
    $done();
  }, 3000);
};

// ---------- 入口 ----------
(async () => {
  const { type, groups } = parseArgs();

  if (type === "panel") {
    // 面板调用：直接返回面板内容
    const panel = generatePanel(groups);
    $done(panel);
  } else if (type === "network") {
    // 网络变化调用
    onNetworkChanged(groups);
  } else {
    $notification.post("⚠️ 脚本错误", "未知的调用类型", `type: ${type}`);
    $done();
  }
})();
