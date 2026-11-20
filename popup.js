import { createFrameRule, hostPermission, readWebUrl } from "./rules.js";

const form = document.querySelector("#rule-form");
const parentOrigin = document.querySelector("#parent-origin");
const targetInput = document.querySelector("#target");
const frameUrls = document.querySelector("#frame-urls");
const frameInfo = document.querySelector("#frame-info");
const applyButton = document.querySelector("#apply");
const reloadButton = document.querySelector("#reload");
const clearButton = document.querySelector("#clear");
const ruleState = document.querySelector("#rule-state");
const status = document.querySelector("#status");
const dnr = chrome.declarativeNetRequest;

let tab;
let parentUrl;
let activeRule;
let busy = true;

function showStatus(message, warning = false) {
  status.textContent = message;
  status.classList.toggle("warning", warning);
}

function updateControls() {
  const parentIsSecure = parentUrl?.protocol === "https:";
  targetInput.disabled = busy || !parentUrl;
  applyButton.disabled = busy || !parentIsSecure;
  reloadButton.disabled = busy || !parentIsSecure;
  clearButton.disabled = busy || !activeRule;

  if (activeRule) {
    const targetOrigin = activeRule.condition.urlFilter.slice(1, -1);
    ruleState.textContent = `X-Frame-Options 규칙 · ${targetOrigin}`;
  } else {
    ruleState.textContent = parentIsSecure ? "현재 탭에 적용된 규칙이 없습니다." : "";
  }
}

async function runAction(action) {
  if (busy) {
    return;
  }

  busy = true;
  updateControls();
  try {
    await action();
  } catch (error) {
    console.error(error);
    showStatus("작업에 실패했습니다. 같은 부모 탭에서 팝업을 다시 열어 주세요.", true);
  } finally {
    busy = false;
    updateControls();
  }
}

function findFrameSources() {
  const sources = Array.from(document.querySelectorAll("iframe[src]:not([srcdoc])"), frame => frame.src);
  return [...new Set(sources)];
}

function reloadFrames(parentOrigin, origin) {
  if (location.origin !== parentOrigin) {
    return 0;
  }

  const frames = Array.from(document.querySelectorAll("iframe[src]:not([srcdoc])"));
  const matches = frames.filter(frame => URL.canParse(frame.src) && new URL(frame.src).origin === origin);
  for (const frame of matches) {
    frame.src = frame.src;
  }
  return matches.length;
}

function getHttpsTarget() {
  const target = readWebUrl(targetInput.value);
  if (target?.protocol !== "https:") {
    showStatus("iframe 주소는 https://로 시작해야 합니다.", true);
    return null;
  }
  return target;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const target = getHttpsTarget();
  if (!target || parentUrl?.protocol !== "https:") {
    return;
  }

  void runAction(async () => {
    const origins = [...new Set([hostPermission(parentUrl), hostPermission(target)])];
    if (!await chrome.permissions.request({ origins })) {
      showStatus("사이트 권한 요청이 취소되었습니다.", true);
      return;
    }

    const currentTab = await chrome.tabs.get(tab.id);
    if (readWebUrl(currentTab.url)?.origin !== parentUrl.origin) {
      showStatus("부모 페이지 주소가 바뀌었습니다. 팝업을 다시 열어 주세요.", true);
      return;
    }

    const rule = createFrameRule(tab.id, parentUrl, target);
    await dnr.updateSessionRules({ removeRuleIds: [tab.id], addRules: [rule] });
    activeRule = rule;
    showStatus("적용했습니다. iframe을 새로고침하거나 페이지에서 iframe을 다시 여세요.");
  });
});

reloadButton.addEventListener("click", () => {
  const target = getHttpsTarget();
  if (!target) {
    return;
  }

  void runAction(async () => {
    const [{ result: count }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: reloadFrames,
      args: [parentUrl.origin, target.origin]
    });
    if (count) {
      showStatus(`같은 출처의 iframe ${count}개에 새로고침을 요청했습니다.`);
    } else {
      showStatus("주소가 일치하는 iframe을 찾지 못했습니다. 페이지에서 iframe을 다시 여세요.", true);
    }
  });
});

clearButton.addEventListener("click", () => {
  void runAction(async () => {
    await dnr.updateSessionRules({ removeRuleIds: [tab.id] });
    activeRule = undefined;
    showStatus("규칙을 해제했습니다. 다음 iframe 요청부터 적용됩니다.");
  });
});

async function initialize() {
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || tab.id < 0) {
      parentOrigin.textContent = "확인할 탭이 없습니다.";
      return;
    }

    const rules = await dnr.getSessionRules({ ruleIds: [tab.id] });
    [activeRule] = rules;
    parentUrl = readWebUrl(tab.url);
    if (!parentUrl) {
      parentOrigin.textContent = "일반 웹페이지에서 열어 주세요.";
      return;
    }

    parentOrigin.textContent = parentUrl.origin;
    if (parentUrl.protocol === "http:") {
      showStatus("부모 페이지가 HTTP입니다. 부모 페이지를 HTTPS로 연 뒤 다시 시도하세요.", true);
    }

    const [{ result: sources }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: findFrameSources
    });
    const urls = sources.map(readWebUrl).filter(Boolean);
    for (const url of urls) {
      const option = document.createElement("option");
      option.value = url.href;
      frameUrls.append(option);
    }

    if (activeRule) {
      targetInput.value = activeRule.condition.urlFilter.slice(1, -1);
    } else if (urls.length === 1) {
      targetInput.value = urls[0].href;
    }

    const insecureCount = urls.filter(url => url.protocol === "http:").length;
    if (insecureCount) {
      frameInfo.textContent = `HTTP 주소 ${insecureCount}개를 찾았습니다. 대상 사이트가 제공하는 HTTPS 주소를 사용하세요.`;
    } else if (!urls.length) {
      frameInfo.textContent = "iframe을 먼저 열거나 주소를 직접 입력하세요.";
    }
  } catch (error) {
    console.error(error);
    frameInfo.textContent = "이 탭에서 iframe 목록을 읽지 못했습니다.";
  } finally {
    busy = false;
    updateControls();
  }
}

void initialize();
