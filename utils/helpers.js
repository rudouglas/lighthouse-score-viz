export const NBSP = '\xa0';
export const numberFormatter = new Intl.NumberFormat();

// thx Lighthouse's util.js
export function arithmeticMean(items) {
  items = items.filter(item => item.metadata.weight > 0);
  const results = items.reduce(
    (result, item) => {
      const score = item.data.score;
      const weight = item.metadata.weight;
      return {
        weight: result.weight + weight,
        sum: result.sum + score * weight,
      };
    },
    {weight: 0, sum: 0}
  );
  return results.sum / results.weight || 0;
}

export function calculateRating(score) {
	const RATINGS = {
		PASS: {label: 'pass', minScore: 0.9},
		AVERAGE: {label: 'average', minScore: 0.5},
		FAIL: {label: 'fail'},
	};

  let rating = RATINGS.FAIL.label;
  if (score >= RATINGS.PASS.minScore) {
    rating = RATINGS.PASS.label;
  } else if (score >= RATINGS.AVERAGE.minScore) {
    rating = RATINGS.AVERAGE.label;
  }
  return rating;
}