import React from "react";
import {
  Card,
  CardBody,
  HeadingText,
  Stack,
  StackItem,
  AutoSizer,
  PlatformStateContext,
  CardHeader,
  Grid,
  GridItem,
  platform,
  nerdlet,
  navigation,
  InlineMessage,
  TableHeader,
  TableRow,
  TableRowCell,
  TableHeaderCell,
  ngql,
  Button,
  CardSection,
  AccountPicker,
} from "nr1";
import OverviewTable from "./components/OverviewTable";
import Lighthouse from "../../src/components/Lighthouse";
import { scoreScript } from "../../src/utils/constants";
import { getMainColor } from "../../utils/helpers";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import CodeEditor from "@uiw/react-textarea-code-editor";

export default class LighthouseScoreNerdlet extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      accountId: null,
    };
  }
  _setAccountId = (evt, value) => {
    this.setState({ accountId: null });
    console.log(value);
    this.setState({
      accountId: value,
    });
  };
  _openModal = () => {
    const { accountId } = this.state;
    navigation.openStackedNerdlet({
      id: "build-script",
      urlState: {
        accountId,
      },
    });
  };

  render() {
    const { accountId } = this.state;

    return (
      <Card>
        <CardBody>
          <Stack style={{ width: "100%", display: "flex" }}>
            <StackItem>
              <img
                src="https://cdn.worldvectorlogo.com/logos/google-lighthouse.svg"
                width="50px"
              />
            </StackItem>
            <StackItem>
              <HeadingText
                spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                type={HeadingText.TYPE.HEADING_2}
              >
                Lighthouse Score
              </HeadingText>
            </StackItem>
            <StackItem style={{ padding: "10px" }}>
              <Lighthouse />
            </StackItem>
          </Stack>
          <CardSection />
          <Stack>
            <StackItem>
              <AccountPicker
                spacingType={[AccountPicker.SPACING_TYPE.LARGE]}
                value={accountId}
                onChange={this._setAccountId}
                label="Choose your account"
                required
              />
            </StackItem>
            {accountId && (
              <>
                <StackItem>
                  <StackItem style={{ marginLeft: "10px" }}>
                    <div
                      style={{
                        borderLeft: "6px solid rgb(170 170 170 / 16%)",
                        height: "100px",
                      }}
                    ></div>
                  </StackItem>
                </StackItem>
                <StackItem>
                  <HeadingText spacingType={[HeadingText.SPACING_TYPE.LARGE]}>
                    Build Synthetics Scripts
                  </HeadingText>

                  <Button
                    spacingType={[Button.SPACING_TYPE.LARGE]}
                    type={Button.TYPE.OUTLINE}
                    onClick={this._openModal}
                  >
                    Build script
                  </Button>
                </StackItem>
              </>
            )}
            <StackItem style={{ marginLeft: "50px" }}>
              <div
                style={{
                  borderLeft: "6px solid rgb(170 170 170 / 16%)",
                  height: "100px",
                }}
              ></div>
            </StackItem>
            <StackItem>
              <HeadingText spacingType={[HeadingText.SPACING_TYPE.LARGE]}>
                Custom Visualizations
              </HeadingText>
              <Button
                spacingType={[Button.SPACING_TYPE.LARGE]}
                to="https://staging.onenr.io/0mMRNyaD7wn"
              >
                Overall Scores Viz
              </Button>
              <Button
                spacingType={[Button.SPACING_TYPE.LARGE]}
                to="https://staging.onenr.io/0VKQXVmr0Ra"
              >
                Accessibility Viz
              </Button>
              <Button
                spacingType={[Button.SPACING_TYPE.LARGE]}
                to="https://staging.onenr.io/0PoR8ZDLgQG"
              >
                Best Practices Viz
              </Button>
              <Button
                spacingType={[Button.SPACING_TYPE.LARGE]}
                to="https://staging.onenr.io/0Y8wpNWJWjO"
              >
                Performance Viz
              </Button>
              <Button
                spacingType={[Button.SPACING_TYPE.LARGE]}
                to="https://staging.onenr.io/0WBQ1ym7XQx"
              >
                PWA Viz
              </Button>
              <Button
                spacingType={[Button.SPACING_TYPE.LARGE]}
                to="https://staging.onenr.io/037jbWB20Qy"
              >
                SEO Viz
              </Button>
            </StackItem>
          </Stack>

          <CardSection />

          {accountId && (
            <>
              <InlineMessage label="Average scores since 2 days ago" />
              <OverviewTable accountId={accountId} />
            </>
          )}
        </CardBody>
      </Card>
    );
  }
}