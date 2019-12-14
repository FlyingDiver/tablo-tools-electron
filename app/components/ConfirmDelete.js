import React, { Component } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import Title from './Title';

type Props = { what: [], onDelete: () => {} };

export default class ConfirmDelete extends Component<Props> {
  props: Props;

  constructor() {
    super();
    this.state = { show: false };
    this.handleClose = this.handleClose.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleClose() {
    this.setState({ show: false });
  }

  handleShow = () => {
    this.setState({ show: true });
  };

  handleDelete() {
    this.setState({ show: false });
    const { onDelete } = this.props;
    onDelete();
  }

  render() {
    const { show } = this.state;
    const { what } = this.props;
    // console.log(what);
    let containsProtected = false;
    what.forEach(item => {
      if (item.userInfo.protected) containsProtected = true;
    });

    return (
      <div id={Math.floor(Math.random() * 1000)}>
        <Button
          size="sm"
          variant="danger"
          onClick={this.handleShow}
          title="Delete"
        >
          <span className="fa fa-trash-alt" />
        </Button>

        <Modal show={show} onHide={this.handleClose} animation={false} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {containsProtected ? (
              <Alert variant="warning">
                You are deleting a PROTECTED recording!
              </Alert>
            ) : (
              ''
            )}
            Are you sure you want to delete:
            <br />
            {what.map(item => (
              <Title airing={item} key={Math.floor(Math.random() * 1000)} />
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={this.handleDelete}>
              Yes, delete!
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}