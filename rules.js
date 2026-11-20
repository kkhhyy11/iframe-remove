export function readWebUrl(value) {
  const text = value?.trim();
  if (!text || !/^https?:\/\//i.test(text)) {
    return null;
  }

  try {
    const url = new URL(text);
    if (url.username || url.password || url.hostname.includes("*")) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function hostPermission(url) {
  return `${url.protocol}//${url.hostname}/*`;
}

export function createFrameRule(tabId, parent, target) {
  return {
    id: tabId,
    action: {
      type: "modifyHeaders",
      responseHeaders: [{ header: "x-frame-options", operation: "remove" }]
    },
    condition: {
      tabIds: [tabId],
      topDomains: [parent.hostname],
      initiatorDomains: [parent.hostname],
      resourceTypes: ["sub_frame"],
      urlFilter: `|${target.origin}/`
    }
  };
}
