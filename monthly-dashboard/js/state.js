const STORAGE_KEY = "golden-goose.monthly-selection.v1";

function parseStored(storage) {
  try { return JSON.parse(storage?.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function parseSearch(search) {
  const params = new URLSearchParams(search || "");
  return {
    country: params.get("country"),
    month: params.get("month"),
    partnerView: params.get("partnerView"),
  };
}

export function createSelectionState(
  payload,
  storage = window.localStorage,
  search = window.location.search,
) {
  const stored = parseStored(storage);
  const fromUrl = parseSearch(search);
  let country = ["KR", "JP"].includes(fromUrl.country)
    ? fromUrl.country
    : (["KR", "JP"].includes(stored.country) ? stored.country : (payload.defaultCountry || "KR"));
  const selectedByCountry = { ...(stored.selectedByCountry || {}) };
  const partnerView = ["revenue", "participation"].includes(fromUrl.partnerView)
    ? fromUrl.partnerView
    : (["revenue", "participation"].includes(stored.partnerView) ? stored.partnerView : "revenue");
  let selectedPartnerView = partnerView;

  const months = () => payload.countries?.[country]?.availableMonths || [];
  const validMonth = (candidate) => months().includes(candidate) ? candidate : (months().at(-1) || null);
  let month = validMonth(fromUrl.month || selectedByCountry[country]);
  selectedByCountry[country] = month;

  const persist = () => storage?.setItem(STORAGE_KEY, JSON.stringify({
    country,
    selectedByCountry,
    partnerView: selectedPartnerView,
  }));
  const selectMonth = (candidate) => {
    month = validMonth(candidate);
    selectedByCountry[country] = month;
    persist();
    return snapshot();
  };
  const snapshot = () => ({
    country,
    month,
    months: [...months()],
    partnerView: selectedPartnerView,
  });

  return {
    get value() { return snapshot(); },
    setCountry(nextCountry) {
      if (!["KR", "JP"].includes(nextCountry)) return snapshot();
      country = nextCountry;
      return selectMonth(selectedByCountry[country]);
    },
    setMonth: selectMonth,
    previousMonth() {
      const index = months().indexOf(month);
      return selectMonth(index > 0 ? months()[index - 1] : month);
    },
    nextMonth() {
      const index = months().indexOf(month);
      return selectMonth(index >= 0 && index < months().length - 1 ? months()[index + 1] : month);
    },
    goCurrent() { return selectMonth(months().at(-1)); },
    setPartnerView(nextView) {
      if (["revenue", "participation"].includes(nextView)) {
        selectedPartnerView = nextView;
        persist();
      }
      return snapshot();
    },
  };
}
