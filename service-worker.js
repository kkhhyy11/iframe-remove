function removeTabRule(tabId) {
  chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId] })
    .catch(error => console.error("Could not remove the closed tab's frame rule.", error));
}

chrome.tabs.onRemoved.addListener(removeTabRule);
chrome.tabs.onReplaced.addListener((_newTabId, oldTabId) => removeTabRule(oldTabId));
