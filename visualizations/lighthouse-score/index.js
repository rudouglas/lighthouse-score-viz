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
  Banner,
} from "nr1";
import NrqlQueryError from "../../src/nrql-query-error";
import NoDataState from "../../src/no-data-state";
import { baseLabelStyles } from "../../src/theme";
import { ATTRIBUTES, mainThresholds } from "../../utils/attributes";
import {
  arithmeticMean,
} from "../../utils/helpers";
import { QUANTILE_AT_VALUE } from "../../utils/math.js";
const BOUNDS = {
  X: 400,
  Y: 400,
};

const LABEL_SIZE = 24;
const LABEL_PADDING = 10;
const CHART_WIDTH = BOUNDS.X;
const CHART_HEIGHT = BOUNDS.Y - LABEL_SIZE - LABEL_PADDING;

export default class CircularProgressBar extends React.Component {
  // Custom props you wish to be configurable in the UI must also be defined in
  // the nr1.json file for the visualization. See docs for more details.
  static propTypes = {
    /**
     * An array of objects consisting of a nrql `query` and `accountId`.
     * This should be a standard prop for any NRQL based visualizations.
     */
    nrqlQueries: PropTypes.arrayOf(
      PropTypes.shape({
        accountId: PropTypes.number,
        query: PropTypes.string,
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
      const { name, explanation, weight, scores, metrics, link } = ATTRIBUTES[att];
      const filtered = data.filter((point) => point.data[0][att]);
      const result = filtered[0].data[0][att];
      const score = this.calculateScore(metrics, result);

      console.log(score);
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
    console.log(percent)
    const color = this.getMainColor(percent);
    return {
      percent,
      label: "Lighthouse Score",
      series: [
        { x: "progress", y: percent, color },
        { x: "remainder", y: 100 - percent, color: "transparent" },
      ],
    };
  }

  nrqlInputIsValid = (data) => {
    const allowedAttributes = data
      .map((point) => {
        return Object.keys(point.data[0]).some((key) =>
          Object.keys(ATTRIBUTES).includes(key)
        );
      })
      .filter(Boolean);
    return allowedAttributes.length >= 6;
  };

  getMainColor = (value) => {
    if (value >= mainThresholds.good) {
      return "green"
    } else if (value >= mainThresholds.moderate) {
      return "orange"
    } else {
      return "red"
    }
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
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "10px solid orange",
          }}
        ></div>
      );
    } else if (color === "red") {
      return (
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "red",
          }}
        ></div>
      );
    } else {
      return (
        <div
          style={{
            backgroundColor: "green",
            width: 8,
            height: 8,
          }}
        ></div>
      );
    }
  };

  render() {
    const { nrqlQueries } = this.props;

    const nrqlQueryPropsAvailable =
      nrqlQueries &&
      nrqlQueries[0] &&
      nrqlQueries[0].accountId &&
      nrqlQueries[0].query;

    if (!nrqlQueryPropsAvailable) {
      return <EmptyState />;
    }
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

                  if (!this.nrqlInputIsValid(data)) {
                    return (
                      <NrqlQueryError
                        title="Unsupported NRQL query"
                        description="The provided NRQL query is not supported by this visualization. Please make sure to have the following attributes: custom.firstContentfulPaint,
                        custom.largestContentfulPaint,
                        custom.interactive,
                        custom.totalBlockingTime,
                        custom.cumulativeLayoutShift,
                        custom.speedIndex"
                      />
                    );
                  }

                  const filteredAttributes = this.formatData(data);
                  this.checkWeights(filteredAttributes);
                  console.log(filteredAttributes)
                  const { percent, label, series } = this.calculateTotalScore(filteredAttributes)

                  return (
                    <>
                      <svg
                        viewBox={`0 0 ${BOUNDS.X} ${BOUNDS.Y}`}
                        width={width}
                        height={height}
                        className="CircularProgressBar"
                      >
                        <VictoryPie
                          standalone={false}
                          animate={{ duration: 5000 }}
                          data={series}
                          width={CHART_WIDTH}
                          height={CHART_HEIGHT}
                          padding={10}
                          innerRadius={50}
                          cornerRadius={25}
                          labels={() => null}
                          style={{ data: { fill: ({ datum }) => datum.color } }}
                        />
                        <VictoryAnimation duration={1000} data={percent}>
                          {(percent) => (
                            <VictoryLabel
                              textAnchor="middle"
                              verticalAnchor="middle"
                              x={CHART_WIDTH / 2}
                              y={CHART_HEIGHT / 2}
                              text={`${Math.round(percent)}%`}
                              style={{ ...baseLabelStyles, fontSize: 45 }}
                            />
                          )}
                        </VictoryAnimation>
                        <VictoryLabel
                          text={label}
                          lineHeight={1}
                          x={CHART_WIDTH / 2}
                          y={BOUNDS.Y - LABEL_SIZE}
                          textAnchor="middle"
                          style={{ ...baseLabelStyles, fontSize: LABEL_SIZE }}
                        />
                      </svg>
                      <Layout>
                        <LayoutItem
                          type={LayoutItem.TYPE.SPLIT_LEFT}
                          sizeType={LayoutItem.SIZE_TYPE.LARGE}
                        />
                        <LayoutItem>
                          <Grid>
                            {filteredAttributes.map((att) => {
                              return (
                                <GridItem columnSpan={6}>
                                  <Card>
                                    <CardHeader>
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
                                            color: "#017C86",
                                            fontWeight: 500,
                                            width: "300px",
                                          }}
                                        >
                                          <h3
                                            style={{
                                              color: "#017C86",
                                              fontWeight: 500,
                                            }}
                                          >
                                            {att.metadata.name}
                                          </h3>
                                        </StackItem>
                                        <StackItem>
                                          {this.checkTime(
                                            att.data.result,
                                            att.metadata.id
                                          )}
                                        </StackItem>
                                      </Stack>
                                    </CardHeader>
                                    <CardBody>
                                      <CardSection>
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
                                              att.metadata.metrics.weight * 100
                                            }%`}
                                          </GridItem>
                                        </Grid>
                                      </CardSection>
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
                                            <BlockText>{att.metadata.explanation}</BlockText>
                                          </GridItem>
                                          <GridItem columnSpan={12}>
                                            <Link to={att.metadata.link}>Read more</Link>
                                          </GridItem>
                                        </Grid>
                                      </CardSection>
                                    </CardBody>
                                  </Card>
                                </GridItem>
                              );
                            })}
                          </Grid>
                        </LayoutItem>
                        <LayoutItem
                          type={LayoutItem.TYPE.SPLIT_RIGHT}
                          sizeType={LayoutItem.SIZE_TYPE.LARGE}
                        />
                      </Layout>
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
          "FROM SyntheticCheck SELECT latest(custom.firstContentfulPaint), latest(custom.largestContentfulPaint), latest(custom.interactive), latest(custom.totalBlockingTime), latest(custom.cumulativeLayoutShift), latest(custom.speedIndex) WHERE monitorName = 'LIGHTHOUSE - website.com'"
        }
      </code>
    </CardBody>
  </Card>
);
