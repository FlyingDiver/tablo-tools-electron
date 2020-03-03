import React, { Component } from 'react';
import Image from 'react-bootstrap/Image';

import unknownImg from '../../resources/white-question-mark.png';

import Api from '../utils/Tablo';

// maxheight is not used!
type Props = { imageId: string, maxHeight: number };

export default class TabloImage extends Component<Props> {
  props: Props;

  render() {
    const { imageId, maxHeight } = this.props;
    const host = Api.device.private_ip;
    const style = {};
    if (maxHeight) {
      style.maxHeight = maxHeight;
    }
    let url = unknownImg;
    if (imageId && parseInt(imageId, 10)) {
      url = `http://${host}:8885/images/${imageId}`;
    }
    return <Image style={style} src={url} fluid rounded />;
  }
}
