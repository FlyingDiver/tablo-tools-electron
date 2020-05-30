// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Prompt } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import { Alert } from 'react-bootstrap';
import Airing from '../utils/Airing';
import RecordingExport from './RecordingExport';
import { asyncForEach, throttleActions } from '../utils/utils';
import {
  EXP_WAITING,
  EXP_WORKING,
  EXP_DONE,
  EXP_CANCEL
} from '../constants/app';

type Props = {
  actionList: Array<Airing>
};
type State = { exportState: number, atOnce: number };

class VideoExport extends Component<Props, State> {
  props: Props;

  static defaultProps: {};

  shouldCancel: boolean;

  // TODO: ref type again
  airingRefs: {};

  constructor(props: Props) {
    super();
    this.state = { exportState: EXP_WAITING, atOnce: 1 };

    this.airingRefs = {};
    this.shouldCancel = false;
    const { actionList } = props;

    actionList.forEach(item => {
      this.airingRefs[item.object_id] = React.createRef();
    });

    (this: any).processVideo = this.processVideo.bind(this);
    (this: any).cancelProcess = this.cancelProcess.bind(this);
  }

  componentWillUnmount() {
    this.cancelProcess(false);
  }

  atOnceChange = async (event: SyntheticEvent<HTMLInputElement>) => {
    await this.setState({ atOnce: parseInt(event.currentTarget.value, 10) });
  };

  processVideo = async () => {
    const { actionList } = this.props;
    const { exportState, atOnce } = this.state;
    this.shouldCancel = false;

    if (exportState === EXP_WORKING) return;

    await this.setState({ exportState: EXP_WORKING });

    const actions = [];

    await asyncForEach(actionList, rec => {
      const ref = this.airingRefs[rec.object_id];
      actions.push(() => {
        if (ref.current && this.shouldCancel === false)
          return ref.current.processVideo();
      });
    });

    await throttleActions(actions, atOnce).then(results => {
      // console.log(results);
      return results;
    });

    this.setState({ exportState: EXP_DONE });
  };

  cancelProcess = async (updateState: boolean = true) => {
    const { actionList } = this.props;

    this.shouldCancel = true;

    await asyncForEach(actionList, async rec => {
      const ref = this.airingRefs[rec.object_id];
      if (ref && ref.current) await ref.current.cancelProcess();
      return new Promise(() => {});
    });

    if (updateState) this.setState({ exportState: EXP_CANCEL });
  };

  render() {
    const { actionList } = this.props;

    const { exportState, atOnce } = this.state;

    // / airingList = ensureAiringArray(airingList);
    const timeSort = (a, b) => {
      if (a.airingDetails.datetime < b.airingDetails.datetime) return 1;
      return -1;
    };

    actionList.sort((a, b) => timeSort(a, b));

    return (
      <>
        <Prompt
          when={exportState === EXP_WORKING}
          message="Leaving will CANCEL all Exports in progress. Are you sure?"
        />
        <ExportActions
          state={exportState}
          atOnce={atOnce}
          atOnceChange={this.atOnceChange}
          cancel={this.cancelProcess}
          process={this.processVideo}
        />
        {actionList.map(airing => {
          const ref = this.airingRefs[airing.object_id];
          return (
            <RecordingExport
              ref={ref}
              airing={airing}
              key={`RecordingExport-${airing.object_id}`}
            />
          );
        })}
      </>
    );
  }
}

/**
 * @return {string}
 */
function ExportActions(prop) {
  const { state, cancel, process, atOnce, atOnceChange } = prop;
  // , atOnce, atOnceChange

  if (state === EXP_WORKING) {
    return (
      <Col>
        <Button variant="secondary" onClick={cancel}>
          Cancel
        </Button>
      </Col>
    );
  }

  // if state === EXP_WAITING || EXP_CANCEL
  return (
    <Alert variant="primary" className="p-2 m-2">
      <Row>
        <Col md="4" className="pt-2">
          <h4 className="pl-2">Export Recordings</h4>
        </Col>
        <Col md="auto">
          <InputGroup size="sm" className="pt-1">
            <InputGroup.Prepend>
              <InputGroup.Text title="More than 2 is probably silly, but YOLO!">
                <span className="fa fa-info pr-2" />
                Max:
              </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              as="select"
              value={atOnce}
              aria-describedby="btnState"
              onChange={atOnceChange}
              title="More than 2 is probably silly, but YOLO!"
            >
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
            </Form.Control>
          </InputGroup>
        </Col>
        <Col md="auto">
          <Button variant="light" onClick={process} className="mr-2">
            Export
          </Button>
        </Col>
      </Row>
    </Alert>
  );
}

const mapStateToProps = (state: any) => {
  return {
    actionList: state.actionList
  };
};

export default connect<*, *, *, *, *, *>(mapStateToProps)(VideoExport);
