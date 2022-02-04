import React from "react";
import PropTypes from "prop-types";
import { VictoryPie, VictoryAnimation, VictoryLabel } from "victory";
import {
  Card,
  CardBody,
  HeadingText,
  NrqlQuery,
  Spinner,
  AutoSizer,
  PlatformStateContext,
  CardHeader,
  Grid,
  GridItem,
  Stack,
  StackItem,
  CardSection,
  Layout,
  LayoutItem,
  BlockText,
  Link,
  Badge,
} from "nr1";
import NrqlQueryError from "../../src/nrql-query-error";
import NoDataState from "../../src/no-data-state";
import { baseLabelStyles } from "../../src/theme";
import { ATTRIBUTES, mainThresholds } from "../../utils/attributes";
import {
  arithmeticMean,
  getSymbol,
  parseScoreFromNrqlResult,
  getMainColor,
} from "../../utils/helpers";
import { SCORE_QUERIES } from "../../utils/constants";
import { QUANTILE_AT_VALUE } from "../../utils/math.js";
import ScoreVisualization from "../../src/components/ScoreVisualization";
const BOUNDS = {
  X: 300,
  Y: 300,
};

const LABEL_SIZE = 20;
const LABEL_PADDING = 10;
const CHART_WIDTH = BOUNDS.X + LABEL_PADDING * 2;
const CHART_HEIGHT = BOUNDS.Y + LABEL_SIZE;

export default class CircularProgressBar extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    showDescriptions: PropTypes.Boolean,
    showCategoryScores: PropTypes.Boolean,
    showCategoryScores: PropTypes.Boolean,
    showCoreScores: PropTypes.Boolean,

    showScoreGuide: PropTypes.Boolean,
    showOverallScore: PropTypes.Boolean,
    /**
     * An array of objects consisting of a nrql `query` and `accountId`.
     * This should be a standard prop for any NRQL based visualizations.
     */
    nrqlQueries: PropTypes.arrayOf(
      PropTypes.shape({
        accountId: PropTypes.number,
        query: PropTypes.string,
        timeframe: PropTypes.string,
        requestedUrl: PropTypes.string,
        strategy: PropTypes.string,
      })
    ),

    /**
     * Configuration that determines what values to display as critical or
     * successful.
     */
    thresholds: PropTypes.shape({
      criticalThreshold: PropTypes.number,
      highValuesAreSuccess: PropTypes.bool,
    }),
  };

  checkWeights = (results) => {
    const weights = Object.values(results).map(
      (metricScoring) => metricScoring.metadata.weight
    );
    const weightSum = weights.reduce((agg, val) => (agg += val));
    console.assert(weightSum > 0.999 && weightSum < 1.0001); // lol rounding is hard.
  };

  calculateScore = (metrics, value) => {
    return Math.round(QUANTILE_AT_VALUE(metrics, value) * 100);
  };

  formatData = (data) => {
    return Object.keys(ATTRIBUTES).map((att) => {
      const { name, explanation, weight, scores, metrics, link } =
        ATTRIBUTES[att];
      const filtered = data.find((point) =>
        Object.keys(point.data[0]).some((key) => key.includes(att))
      );
      // console.log({ filtered });
      const usedKey = Object.keys(filtered.data[0]).find((key) =>
        key.includes(att)
      );
      // console.log({ usedKey });
      const result = filtered.data[0][usedKey];
      const score = this.calculateScore(metrics, result);
      // console.log({ score, result });
      // console.log(score);
      return {
        metadata: {
          id: att,
          name,
          explanation,
          weight,
          scores,
          metrics,
          link,
        },
        data: { result, score }, // Current value.
      };
    });
  };
  calculateTotalScore = (data) => {
    const percent = arithmeticMean(data);
    console.log(percent);
    const color = getMainColor(percent);
    console.log({
      percent,
      label: "Lighthouse Score",
      series: [
        { x: "progress", y: percent, color },
        { x: "remainder", y: 100 - percent, color: "transparent" },
      ],
    });
    return {
      percent,
      color,
      label: "Lighthouse Score",
      series: [
        { x: "progress", y: percent, color },
        { x: "remainder", y: 100 - percent, color: "transparent" },
      ],
    };
  };

  nrqlInputIsValid = (data) => {
    // console.log(data);
    const allowedAttributes = Object.keys(ATTRIBUTES)
      .map((key) => JSON.stringify(data).includes(key))
      .filter(Boolean);
    // console.log({ allowedAttributes });
    return allowedAttributes.length >= 6;
  };

  checkColor = (time, scores) => {
    let color = "red";
    if (time / 1000 <= scores.fast) {
      color = "green";
    } else if (time / 1000 <= scores.mid) {
      color = "orange";
    }
    return color;
  };

  checkTime = (time, attribute) => {
    const { scores, units } = ATTRIBUTES[attribute];
    const color = this.checkColor(time, scores);
    const calculatedScore = () => {
      if (units == "s") {
        return `${time / 1000} s`;
      } else if (units == "ms") {
        return `${time} ms`;
      } else {
        return `${Number(Math.round(time + "e" + 4) + "e-" + 4)}`;
      }
    };
    return (
      <h4
        style={{
          marginRight: "5px",
          color,
          fontSize: "1em",
        }}
      >
        {calculatedScore()}
      </h4>
    );
  };

  checkSymbol = (time, attribute) => {
    const { scores } = ATTRIBUTES[attribute];
    const color = this.checkColor(time, scores);
    if (color === "orange") {
      return (
        <div
          style={{
            backgroundColor: color,
            width: 10,
            height: 10,
          }}
        ></div>
      );
    } else if (color === "red") {
      return (
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "10px solid red",
          }}
        ></div>
      );
    } else {
      return (
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: color,
          }}
        ></div>
      );
    }
  };

  render() {
    const {
      nrqlQueries,

      showDescriptions = true,
      showCategoryScores = true,
      showCoreScores = true,
      showScoreGuide = true,
      showOverallScore = true,
    } = this.props;

    const nrqlQueryPropsAvailable =
      nrqlQueries &&
      nrqlQueries[0] &&
      nrqlQueries[0].accountId &&
      nrqlQueries[0].query;
    if (!nrqlQueryPropsAvailable) {
      return <EmptyState />;
    }
    const {
      timeframe = "4 hours",
      requestedUrl,
      strategy = "desktop",
    } = nrqlQueries[0];
    console.log({ timeframe, requestedUrl, strategy, nrqlQueries });
    return (
      <AutoSizer>
        {({ width, height }) => (
          <PlatformStateContext.Consumer>
            {({ timeRange }) => (
              <NrqlQuery
                query={nrqlQueries[0].query}
                accountId={parseInt(nrqlQueries[0].accountId)}
                pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
                timeRange={timeRange}
              >
                {({ data, loading, error }) => {
                  if (loading) {
                    return <Spinner />;
                  }

                  if (error && data === null) {
                    return (
                      <NrqlQueryError
                        title="NRQL Syntax Error"
                        description={error.message}
                      />
                    );
                  }

                  if (!data.length) {
                    return <NoDataState />;
                  }
                  // console.log({ data });
                  if (!this.nrqlInputIsValid(data)) {
                    return (
                      <NrqlQueryError
                        title="Unsupported NRQL query"
                        description="The provided NRQL query is not supported by this visualization. Please make sure to have the following attributes: 
                        firstContentfulPaint,
                        largestContentfulPaint,
                        interactive,
                        totalBlockingTime,
                        cumulativeLayoutShift,
                        speedIndex"
                      />
                    );
                  }
                  // const { requestedUrl } = data[0].data[0];

                  // console.log(data[0]);
                  const filteredAttributes = this.formatData(data);
                  const performanceScore = parseScoreFromNrqlResult(data);
                  // console.log({ performanceScore });

                  // return <div>Hello</div>;
                  this.checkWeights(filteredAttributes);
                  // console.log(filteredAttributes);
                  const performanceColor = getMainColor(performanceScore);
                  // console.log({ performanceColor });
                  const performanceSeries = [
                    {
                      x: "progress",
                      y: performanceScore,
                      color: performanceColor,
                    },
                    {
                      x: "remainder",
                      y: 100 - performanceScore,
                      color: "transparent",
                    },
                  ];
                  let TEST_QUERIES;
                  if (requestedUrl) {
                    TEST_QUERIES = [
                      {
                        title: "Performance",
                        query: `FROM lighthousePerformance SELECT average(score) WHERE requestedUrl = '${requestedUrl}' AND deviceType = '${strategy || 'desktop'}' SINCE ${timeframe} ago`,
                      },
                      {
                        title: "Best practices",
                        query: `FROM lighthouseBestPractices SELECT average(score) WHERE requestedUrl = '${requestedUrl}' AND deviceType = '${strategy || 'desktop'}' SINCE ${timeframe} ago`,
                      },
                      {
                        title: "SEO",
                        query: `FROM lighthouseSeo SELECT average(score) WHERE requestedUrl = '${requestedUrl}' AND deviceType = '${strategy || 'desktop'}' SINCE ${timeframe} ago`,
                      },
                      {
                        title: "PWA",
                        query: `FROM lighthousePwa SELECT average(score) WHERE requestedUrl = '${requestedUrl}' AND deviceType = '${strategy || 'desktop'}' SINCE ${timeframe} ago`,
                      },
                      {
                        title: "Accessibility",
                        query: `FROM lighthouseAccessibility SELECT average(score) WHERE requestedUrl = '${requestedUrl}' AND deviceType = '${strategy || 'desktop'}' SINCE ${timeframe} ago`,
                      },
                    ];
                  }
                  // const { percent, color, label, series } =
                  //   this.calculateTotalScore(filteredAttributes);
                  // console.log(height);
                  return (
                    <>
                      {/* {requestedUrl} */}
                      {TEST_QUERIES && TEST_QUERIES.map(({ title, query }) => (
                            <div style={{ width: "250px" }}>
                              <NrqlQuery
                                query={query}
                                accountId={parseInt(nrqlQueries[0].accountId)}
                                pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
                                timeRange={timeRange}
                              >
                                {({ data, loading, error }) => {
                                  if (loading) {
                                    return <Spinner />;
                                  }
                                  console.log({query})
                                  if (error && data === null) {
                                    return (
                                      <NrqlQueryError
                                        title="NRQL Syntax Error"
                                        description={error.message}
                                      />
                                    );
                                  }

                                  if (!data.length) {
                                    return <NoDataState />;
                                  }
                                  console.log({data})
                                  const categoryScore = parseScoreFromNrqlResult(data);
                                  console.log({categoryScore})
                                  // return (<div>Hello</div>)
                                  // const resultData = data[0].data[0];
                                  // const { title } = resultData;
                                  // let score = resultData.score * 100;
                                  // console.log({ score });
                                  const color = getMainColor(categoryScore);
                                  console.log({ color });
                                  const series = [
                                    { x: "progress", y: categoryScore, color },
                                    {
                                      x: "remainder",
                                      y: 100 - categoryScore,
                                      color: "transparent",
                                    },
                                  ];
                                  return (
                                    <Stack
                                      directionType={
                                        Stack.DIRECTION_TYPE.VERTICAL
                                      }
                                      style={{
                                        textAlign: "center",
                                        width: "100%",
                                        alignItems: "center",
                                        paddingTop: "15px",
                                      }}
                                    >
                                      <StackItem style={{ width: "200px" }}>
                                        <ScoreVisualization
                                          score={categoryScore}
                                          color={color}
                                          series={series}
                                        />
                                      </StackItem>
                                      <StackItem>
                                        <HeadingText
                                          type={HeadingText.TYPE.HEADING_1}
                                          spacingType={[
                                            HeadingText.SPACING_TYPE.MEDIUM,
                                          ]}
                                        >
                                          {title} Score
                                        </HeadingText>
                                      </StackItem>
                                    </Stack>
                                  );
                                }}
                              </NrqlQuery>
                            </div>
                          ))}
                      <Grid>
                        {showCoreScores && (
                          <GridItem
                            columnSpan={9}
                            style={{ paddingLeft: "20px" }}
                          >
                            <Grid>
                              {filteredAttributes.map((att) => {
                                return (
                                  <GridItem
                                    columnSpan={4}
                                    style={{
                                      marginBottom:
                                        !showDescriptions && showOverallScore
                                          ? "80px"
                                          : "0px",
                                    }}
                                  >
                                    <Card>
                                      <CardBody>
                                        <CardSection>
                                          <Stack
                                            verticalType={
                                              Stack.VERTICAL_TYPE.CENTER
                                            }
                                          >
                                            <StackItem>
                                              {this.checkSymbol(
                                                att.data.result,
                                                att.metadata.id
                                              )}
                                            </StackItem>
                                            <StackItem
                                              style={{
                                                fontWeight: 500,
                                                width: "250px",
                                              }}
                                            >
                                              <h3
                                                style={{
                                                  fontWeight: 500,
                                                }}
                                              >
                                                {att.metadata.name}
                                              </h3>
                                            </StackItem>
                                          </Stack>
                                          <HeadingText
                                            type={HeadingText.TYPE.HEADING_1}
                                            spacingType={[
                                              HeadingText.SPACING_TYPE.LARGE,
                                            ]}
                                          >
                                            {this.checkTime(
                                              att.data.result,
                                              att.metadata.id
                                            )}
                                          </HeadingText>
                                        </CardSection>
                                        <CardSection>
                                          {showScoreGuide && (
                                            <Grid
                                              spacingType={[
                                                Grid.SPACING_TYPE.EXTRA_LARGE,
                                                Grid.SPACING_TYPE.NONE,
                                                Grid.SPACING_TYPE.NONE,
                                              ]}
                                              gapType={Grid.GAP_TYPE.SMALL}
                                            >
                                              <GridItem
                                                columnSpan={3}
                                                style={{ color: "green" }}
                                              >
                                                Good
                                              </GridItem>
                                              <GridItem
                                                columnSpan={3}
                                                style={{ color: "orange" }}
                                              >
                                                Moderate
                                              </GridItem>
                                              <GridItem
                                                columnSpan={3}
                                                style={{ color: "red" }}
                                              >
                                                Slow
                                              </GridItem>
                                              <GridItem columnSpan={3}>
                                                Weight
                                              </GridItem>
                                              <GridItem
                                                columnSpan={3}
                                                style={{ color: "green" }}
                                              >
                                                {`0 - ${att.metadata.scores.fast}`}
                                              </GridItem>
                                              <GridItem
                                                columnSpan={3}
                                                style={{ color: "orange" }}
                                              >
                                                {`${att.metadata.scores.fast} - ${att.metadata.scores.mid}`}
                                              </GridItem>
                                              <GridItem
                                                columnSpan={3}
                                                style={{ color: "red" }}
                                              >
                                                {`> ${att.metadata.scores.mid}`}
                                              </GridItem>
                                              <GridItem columnSpan={3}>
                                                {`${
                                                  att.metadata.metrics.weight *
                                                  100
                                                }%`}
                                              </GridItem>
                                            </Grid>
                                          )}
                                        </CardSection>
                                        {showDescriptions && (
                                          <CardSection>
                                            <Grid
                                              spacingType={[
                                                Grid.SPACING_TYPE.EXTRA_LARGE,
                                                Grid.SPACING_TYPE.NONE,
                                                Grid.SPACING_TYPE.NONE,
                                              ]}
                                              gapType={Grid.GAP_TYPE.SMALL}
                                            >
                                              <GridItem columnSpan={12}>
                                                <BlockText>
                                                  {att.metadata.explanation}
                                                </BlockText>
                                              </GridItem>
                                              <GridItem columnSpan={12}>
                                                <Link to={att.metadata.link}>
                                                  Read more
                                                </Link>
                                              </GridItem>
                                            </Grid>
                                          </CardSection>
                                        )}
                                      </CardBody>
                                    </Card>
                                  </GridItem>
                                );
                              })}
                            </Grid>
                          </GridItem>
                        )}
                      </Grid>
                      {showCategoryScores && (
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                          <div style={{ width: "250px" }}>
                            <Stack
                              directionType={Stack.DIRECTION_TYPE.VERTICAL}
                              style={{
                                textAlign: "center",
                                width: "100%",
                                alignItems: "center",
                                paddingTop: "15px",
                              }}
                            >
                              <StackItem style={{ width: "200px" }}>
                                <ScoreVisualization
                                  score={performanceScore}
                                  color={performanceColor}
                                  series={performanceSeries}
                                />
                              </StackItem>
                              <StackItem>
                                <HeadingText
                                  type={HeadingText.TYPE.HEADING_1}
                                  spacingType={[
                                    HeadingText.SPACING_TYPE.MEDIUM,
                                  ]}
                                >
                                  Performance Score
                                </HeadingText>
                              </StackItem>
                            </Stack>
                          </div>
                          {SCORE_QUERIES.map(({ title, query }) => (
                            <div style={{ width: "250px" }}>
                              <NrqlQuery
                                query={query}
                                accountId={parseInt(nrqlQueries[0].accountId)}
                                pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
                                timeRange={timeRange}
                              >
                                {({ data, loading, error }) => {
                                  if (loading) {
                                    return <Spinner />;
                                  }

                                  if (error && data === null) {
                                    return (
                                      <NrqlQueryError
                                        title="NRQL Syntax Error"
                                        description={error.message}
                                      />
                                    );
                                  }

                                  if (!data.length) {
                                    return <NoDataState />;
                                  }

                                  const resultData = data[0].data[0];
                                  const { title } = resultData;
                                  let score = resultData.score * 100;
                                  console.log({ score });
                                  const color = getMainColor(score);
                                  console.log({ color });
                                  const series = [
                                    { x: "progress", y: score, color },
                                    {
                                      x: "remainder",
                                      y: 100 - score,
                                      color: "transparent",
                                    },
                                  ];
                                  return (
                                    <Stack
                                      directionType={
                                        Stack.DIRECTION_TYPE.VERTICAL
                                      }
                                      style={{
                                        textAlign: "center",
                                        width: "100%",
                                        alignItems: "center",
                                        paddingTop: "15px",
                                      }}
                                    >
                                      <StackItem style={{ width: "200px" }}>
                                        <ScoreVisualization
                                          score={score}
                                          color={color}
                                          series={series}
                                        />
                                      </StackItem>
                                      <StackItem>
                                        <HeadingText
                                          type={HeadingText.TYPE.HEADING_1}
                                          spacingType={[
                                            HeadingText.SPACING_TYPE.MEDIUM,
                                          ]}
                                        >
                                          {title} Score
                                        </HeadingText>
                                      </StackItem>
                                    </Stack>
                                  );
                                }}
                              </NrqlQuery>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                }}
              </NrqlQuery>
            )}
          </PlatformStateContext.Consumer>
        )}
      </AutoSizer>
    );
  }
}

const EmptyState = () => (
  <Card className="EmptyState">
    <CardBody className="EmptyState-cardBody">
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
        type={HeadingText.TYPE.HEADING_3}
      >
        Please provide a NRQL query & account ID pair
      </HeadingText>
      <HeadingText
        spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
        type={HeadingText.TYPE.HEADING_4}
      >
        This Visualization supports NRQL queries with a single SELECT clause
        returning the necessary attributes from PageSpeed Insights Synthetics
        Monitor. For example:
      </HeadingText>
      <code>
        {
          "FROM lighthouseScores SELECT firstContentfulPaint, largestContentfulPaint, interactive, totalBlockingTime, cumulativeLayoutShift, speedIndex WHERE requestedUrl = 'https://developer.newrelic.com' SINCE 30 MINUTES AGO LIMIT 1"
        }
      </code>
    </CardBody>
  </Card>
);
