import React from "react";

import {
  Table,
  TableHeader,
  TableRow,
  TableRowCell,
  TableHeaderCell,
  ngql,
  NerdGraphQuery,
  HeadingText,
  Spinner
} from "nr1";
import { getMainColor } from "../../../utils/helpers";
import TableEmptyState from "./TableEmptyState";
export default class OverviewTable extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      accountId: "",
      items: null,
    };
  }
  componentDidMount = async () => {
    await this._getItems();
  };
  componentDidUpdate = async (prevProps, prevState) => {
    const { accountId } = this.props;
    if (prevProps.accountId === accountId) {
      return;
    }
    await this._getItems();
  };
  _getItems = async () => {
    const { accountId } = this.props;
    if (!accountId) {
      return;
    }
    const eventTypes = [
      "lighthousePerformance",
      "lighthouseAccessibility",
      "lighthouseBestPractices",
      "lighthouseSeo",
      "lighthousePwa",
    ];
    const allResults = await Promise.all(
      eventTypes.map(async (eventType) => {
        const query = ngql`query($id: Int!) {
            actor {
              account(id: $id) {
              nrql(query: "SELECT average(score) FROM ${eventType} FACET requestedUrl, syntheticLocation SINCE 2 days ago") {
                nrql
                results
              }
            }
          }
        }`;
        const variables = { id: accountId };
        const { data, error } = await NerdGraphQuery.query({
          query,
          variables,
        });
        if (error) {
          console.error(error);
          return;
        }
        const {
          actor: {
            account: {
              nrql: { results },
            },
          },
        } = data;
        console.log({ [eventType]: results });
        return { eventType, data: results };
      })
    );

    const items = this._formatResults(allResults);
    console.log({ items });
    this.setState({ items });
  };

  _formatResults = (results) => {
    const requestedUrls = results.flatMap((result) => {
      return result.data.map((item) => {
        const { facet } = item;
        return [facet[0], facet[1]];
      });
    }).filter(a=>!(2-(this[a]=++this[a]|0)));

    console.log({ requestedUrls, results });
    const items = requestedUrls.map(([requestedUrl, syntheticLocation]) => {
      return results.reduce((acc, result) => {
        const averageScore = result.data.find(
          (datum) =>
            datum.facet[0] === requestedUrl &&
            datum.facet[1] === syntheticLocation
        )["average.score"];
        return {
          requestedUrl,
          syntheticLocation,
          ...acc,
          [`${result.eventType}Score`]: averageScore,
        };
      }, {});
    });
    return items;
  };

  render() {
    const { items } = this.state;
    console.log({ items });
    return (
      items ? (
        items.length > 0 ? <Table items={items} style={{ fontSize: "2em" }}>
          <TableHeader>
            <TableHeaderCell
              value={({ item }) => item.requestedUrl}
              width="20%"
            >
              Requested URL
            </TableHeaderCell>
            <TableHeaderCell
              value={({ item }) => item.syntheticLocation}
              width="20%"
            >
              Location
            </TableHeaderCell>
            <TableHeaderCell
              value={({ item }) => item.lighthousePerformanceScore}
            >
              Performance
            </TableHeaderCell>
            <TableHeaderCell
              value={({ item }) => item.lighthouseAccessibilityScore}
            >
              Accessibility
            </TableHeaderCell>
            <TableHeaderCell
              value={({ item }) => item.lighthouseBestPracticesScore}
            >
              Best Practices
            </TableHeaderCell>
            <TableHeaderCell value={({ item }) => item.lighthouseSeoScore}>
              SEO
            </TableHeaderCell>
            <TableHeaderCell value={({ item }) => item.lighthousePwaScore}>
              PWA
            </TableHeaderCell>
          </TableHeader>

          {({ item }) => (
            <TableRow>
              <TableRowCell>{item.requestedUrl}</TableRowCell>
              <TableRowCell>{item.syntheticLocation}</TableRowCell>
              <TableRowCell
                style={{
                  backgroundColor: getMainColor(
                    item.lighthousePerformanceScore * 100
                  ),
                  color: "white",
                }}
              >
                {Math.round(item.lighthousePerformanceScore * 100)}
              </TableRowCell>
              <TableRowCell
                style={{
                  backgroundColor: getMainColor(
                    item.lighthouseAccessibilityScore * 100
                  ),
                  color: "white",
                }}
              >
                {Math.round(item.lighthouseAccessibilityScore * 100)}
              </TableRowCell>
              <TableRowCell
                style={{
                  backgroundColor: getMainColor(
                    item.lighthouseBestPracticesScore * 100
                  ),
                  color: "white",
                }}
              >
                {Math.round(item.lighthouseBestPracticesScore * 100)}
              </TableRowCell>
              <TableRowCell
                style={{
                  backgroundColor: getMainColor(item.lighthouseSeoScore * 100),
                  color: "white",
                }}
              >
                {Math.round(item.lighthouseSeoScore * 100)}
              </TableRowCell>
              <TableRowCell
                style={{
                  backgroundColor: getMainColor(item.lighthousePwaScore * 100),
                  color: "white",
                }}
              >
                {Math.round(item.lighthousePwaScore * 100)}
              </TableRowCell>
            </TableRow>
          )}
        </Table> : <TableEmptyState />
      ) : <Spinner type={Spinner.TYPE.DOT} />

    );
  }
}
