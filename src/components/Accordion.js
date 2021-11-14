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
} from "nr1";
import { getSymbol, checkMeasurement } from "../../utils/helpers";

import "./accordion.css";

export default class Accordion extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      accordionIsOpen: false,
      display: "none",
    };
    this.toggleAccordion = this.toggleAccordion.bind(this);
  }

  toggleAccordion = () => {
    if (this.state.accordionIsOpen) {
      this.setState({ accordionIsOpen: false, display: "none" });
    } else {
      this.setState({ accordionIsOpen: true, display: "block" });
    }
  };
  render() {
    const { score, title, description, children, numericValue, numericUnit } =
      this.props;
    return (
      <div className="accordion__section">
        <div className="accordion__header" onClick={this.toggleAccordion}>
          <Grid>
            <GridItem columnSpan={6}>
              <p className="accordion__title">
                {getSymbol(score)}
                {title}
              </p>
            </GridItem>
            <GridItem columnSpan={4}>
              <p className="accordion__title">{title}</p>
            </GridItem>
            <GridItem columnSpan={1}>
              <p className="accordion__title">{checkMeasurement(numericUnit, numericValue)}</p>
            </GridItem>
          </Grid>
        </div>
        <div
          className="accordion__content"
          style={{ display: `${this.state.display}` }}
        >
          <Card className="EmptyState">
            <CardBody className="EmptyState-cardBody">
              <HeadingText
                spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                type={HeadingText.TYPE.HEADING_3}
              >
                {description}
              </HeadingText>
              {children}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }
}
