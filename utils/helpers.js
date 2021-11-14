import { Icon } from 'nr1'
import { ATTRIBUTES, mainThresholds } from "./attributes";

export const NBSP = "\xa0";
export const numberFormatter = new Intl.NumberFormat();

// thx Lighthouse's util.js
export function arithmeticMean(items) {
  items = items.filter((item) => item.metadata.weight > 0);
  const results = items.reduce(
    (result, item) => {
      const score = item.data.score;
      const weight = item.metadata.weight;
      return {
        weight: result.weight + weight,
        sum: result.sum + score * weight,
      };
    },
    { weight: 0, sum: 0 }
  );
  return results.sum / results.weight || 0;
}

export function calculateRating(score) {
  const RATINGS = {
    PASS: { label: "pass", minScore: 0.9 },
    AVERAGE: { label: "average", minScore: 0.5 },
    FAIL: { label: "fail" },
  };

  let rating = RATINGS.FAIL.label;
  if (score >= RATINGS.PASS.minScore) {
    rating = RATINGS.PASS.label;
  } else if (score >= RATINGS.AVERAGE.minScore) {
    rating = RATINGS.AVERAGE.label;
  }
  return rating;
}

export const getMainColor = (value) => {
  if (value >= mainThresholds.good) {
    return "green";
  } else if (value >= mainThresholds.moderate) {
    return "orange";
  } else {
    return "red";
  }
};

export const getSymbol = (score) => {
  if (!score) {
    console.log("getSymbol", "score is null");
    return (
      <Icon type={Icon.TYPE.INTERFACE__SIGN__MINUS__V_ALTERNATE} />
    )
  }
  const color = getMainColor(score * 100);
  if (color === "orange") {
    return (
      <Icon type={Icon.TYPE.INTERFACE__STATE__WARNING__WEIGHT_BOLD} color="orange" />
    );
  } else if (color === "red") {
    return (
      <Icon type={Icon.TYPE.INTERFACE__CARET__CARET_TOP__WEIGHT_BOLD__SIZE_8} color="red" />
    );
  } else {
    return (
      <Icon type={Icon.TYPE.INTERFACE__SIGN__CHECKMARK__V_ALTERNATE__WEIGHT_BOLD} color="green" />
    );
  }
};

export const checkMeasurement = (type, value) => {
  if (["timespanMs", "millisecond"].includes(type)) {
    return `${value} ms`;
  } else if (type === "bytes") {

    return `${value/1000} KiB`;
  }
  return "ts";
}

export const parseUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const removeHost = url.split(hostname);
    const pathname = url.replace(removeHost[0], "").replace(hostname, "");
    // console.log(parsedUrl);
    return { value: pathname, additionalValue: hostname };
  } catch (e) {
    console.error(e);
    return;
  }
};
