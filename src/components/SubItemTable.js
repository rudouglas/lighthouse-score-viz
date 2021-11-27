import React from "react";
import {
  Card,
  CardBody,
  HeadingText,
  Grid,
  GridItem,
  NrqlQuery,
  Spinner,
  AutoSizer,
  Tile,
  Link,
  Table,
  TableHeaderCell,
  TableRow,
  TableHeader,
  TableRowCell,
} from "nr1";
import { checkMeasurement, parseUrl } from "../../utils/helpers";

import "./accordion.css";

export default class SubItemTable extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { headings, items } = this.props.details;
    // const  = ["url", "transferSize", "mainThreadTime"];
    const tableKeys = headings.map((heading) => {
      if (!heading.key && heading.subItemsHeading) {
        return heading.subItemsHeading.key;
      }
      return heading.key;
    });
    const transformedItems = [];

    items.forEach((item) => {
      const mainKey = Object.keys(item).reduce((acc, key) => {
        if (key === "entity") {
          const flatten = Object.keys(item.entity).reduce((acc, entityKey) => {
            return { ...acc, [entityKey]: item.entity[entityKey] };
          }, {});
          return { ...acc, ...flatten };
        }
        return { ...acc, [key]: item[key] };
      }, {});

      transformedItems.push(mainKey);
      item.subItems?.items.forEach((subItem) => {
        const subKey = Object.keys(subItem).reduce((acc, key) => {
          if (key === "location") {
            const flatten = Object.keys(subItem.location).reduce(
              (acc, locationKey) => {
                return { ...acc, [locationKey]: subItem.location[locationKey] };
              },
              {}
            );
            return { ...acc, ...flatten };
          }
          if (key === "source") {
            return acc;
          }
          return { ...acc, [key]: subItem[key] };
        }, {});
        transformedItems.push(subKey);
      });
    });
    console.log({items})
    return (
      <Table items={transformedItems} multivalue>
        <TableHeader>
          {headings.map((heading) => (
            <TableHeaderCell
              value={({ item }) => item[heading]}
              width={["url", "entity"].includes(heading.key) ? "60%" : "20%"}
            >
              {heading.text || heading.label || heading.key}
            </TableHeaderCell>
          ))}
        </TableHeader>

        {({ item }) => (
          <TableRow>
            {tableKeys.map((key) => {
              if (key === "entity") {
                if (item.text) {
                  return (
                    <TableRowCell>
                      <Link to={item.url}>{item.text}</Link>
                    </TableRowCell>
                  );
                } else {
                  if (item.url.startsWith("http")) {
                    const { value, additionalValue } = parseUrl(item.url);
                    return (
                      <TableRowCell
                        additionalValue={`${additionalValue}`}
                        style={{ marginLeft: "15px" }}
                      >
                        <Link to={item.url}>{value}</Link>
                      </TableRowCell>
                    );
                  }
                  return <TableRowCell>{item.url}</TableRowCell>;
                }
              }
              if (key === "url") {
                if (item.subItems) {
                  return (
                    <TableRowCell>
                      <Link to={item.url}>{item.url}</Link>
                    </TableRowCell>
                  );
                }
                !item.url && console.log({ item });
                if (item.url?.startsWith("http")) {
                  const { value, additionalValue } = parseUrl(item.url);
                  return (
                    <TableRowCell
                      additionalValue={`${additionalValue}`}
                      style={{ marginLeft: "15px" }}
                    >
                      <Link to={item.url}>{value}</Link>
                    </TableRowCell>
                  );
                }
                return <TableRowCell>{item.url}</TableRowCell>;
              }
              if (key === "signal") {
                return <TableRowCell>{item[key]}</TableRowCell>;
              }
              const { valueType, itemType, granularity } = headings.filter(
                (heading) => heading.key === key
              )[0];

              const measurement = checkMeasurement(
                valueType || itemType,
                item[key],
                granularity
              );
              return <TableRowCell>{`${measurement}`}</TableRowCell>;
            })}
          </TableRow>
        )}
      </Table>
    );
  }
}
