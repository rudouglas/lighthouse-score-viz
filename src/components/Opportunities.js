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
import Accordion from "../../src/components/Accordion";
import { checkMeasurement, parseUrl, sortDetails } from "../../utils/helpers";
import DetailsTable from "./DetailsTable";

import "./accordion.css";

export default class Opportunities extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { opportunities: unsorted } = this.props;
    const opportunities = sortDetails(unsorted);

    return (
      <>
        <HeadingText spacingType={[HeadingText.SPACING_TYPE.LARGE]}>
          Opportunities
        </HeadingText>
        {opportunities.map((opportunity) => {
          return (
            <Accordion {...opportunity}>
              {Object.entries(opportunity).map((opp) => (
                <p>{JSON.stringify(opp)}</p>
              ))}
              {
                <div>
                  {['table', 'opportunity'].includes(opportunity.details?.type) && (
                    <DetailsTable details={opportunity.details} />
                  )}
                </div>
              }
            </Accordion>
          );
        })}
      </>
    );
  }
}
